import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Car, Check, Calendar } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   ESSAI ROUTIER (/vente/essai/:id)
   Un essai routier exige d'être physiquement présent : réutilise exactement
   le même moteur que CentreVisiteVehicule.tsx (trpc.reservations.
   demanderVisite, table bookings, type "test_drive"), en mode "sur_place"
   uniquement — jamais un second moteur de réservation créé. Les conditions
   (permis valide, pièce d'identité) reflètent le vrai dossier KYC de
   l'acheteur (trpc.kyc.myProfile, déjà utilisé par ControleDocuments.tsx),
   jamais une checklist inventée. L'écran était auparavant orphelin (aucun
   :id, aucune donnée réelle, jamais lié depuis nulle part) et gardé par la
   porte VO professionnelle alors que la demande d'essai est une action
   acheteur — corrigé.
   ══════════════════════════════════════════════════════════════════════════ */

const CRENEAUX = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

export default function CentreEssaiRoutier() {
  const { id } = useParams();
  const annonceId = Number(id);
  const navigate = useNavigate();
  const { data: annonce, isLoading } = trpc.annonces.get.useQuery({ id: annonceId }, { enabled: Number.isFinite(annonceId) });
  const monProfil = trpc.kyc.myProfile.useQuery();
  const [date, setDate] = useState("");
  const [creneau, setCreneau] = useState<string | null>(null);

  const documents = monProfil.data?.documents ?? [];
  const aPermis = documents.some((d) => d.docType === "permis_conduire");
  const aIdentite = documents.some((d) => d.docType === "piece_identite");

  const demander = trpc.reservations.demanderVisite.useMutation({
    onSuccess: () => navigate(`/vehicule/${annonceId}?essai=1`),
  });

  if (!Number.isFinite(annonceId) || (!isLoading && !annonce)) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] p-4">
        <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">Véhicule introuvable — revenez depuis sa fiche.</p>
      </div>
    );
  }

  const CONDITIONS = [
    { label: "Permis valide", ok: aPermis },
    { label: "Pièce d'identité", ok: aIdentite },
    { label: "Rendez-vous confirmé", ok: demander.isSuccess },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to={`/vehicule/${annonceId}`} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} className="text-[#D4AF37]" /> Essai routier</h1>
        {annonce && <p className="mt-1 text-sm text-white/60">{annonce.titre || `${annonce.marque} ${annonce.modele}`}</p>}
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
        <h3 className="text-sm font-bold text-[#111]">Conditions</h3>
        {CONDITIONS.map((c) => (
          <div key={c.label} className="flex items-center gap-2">
            <span className={`h-5 w-5 rounded-full flex items-center justify-center ${c.ok ? "bg-green-100" : "bg-[#E5E7EB]"}`}>
              {c.ok ? <Check size={10} className="text-green-600" /> : <span className="h-2 w-2 rounded-full bg-[#9CA3AF]" />}
            </span>
            <span className="text-sm text-[#111]">{c.label}</span>
          </div>
        ))}
        {!aPermis && <p className="text-[10px] text-amber-600">Ajoutez votre permis dans votre <Link to="/louer/controle-documents" className="underline">contrôle documents</Link> pour lever cette condition.</p>}
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <h3 className="text-sm font-bold text-[#111] mb-2 flex items-center gap-1.5"><Calendar size={14} /> Choisir un créneau</h3>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm mb-2" />
        <div className="flex flex-wrap gap-1.5">
          {CRENEAUX.map((c) => (
            <button
              key={c}
              onClick={() => setCreneau(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${creneau === c ? "bg-[#D4AF37] text-white" : "bg-[#F5F3EF] text-[#111]"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {demander.error && <p className="mx-4 mt-3 text-xs text-red-600">{demander.error.message}</p>}
      {demander.isSuccess && <p className="mx-4 mt-3 text-xs text-green-600">Demande d'essai envoyée au vendeur.</p>}

      <div className="px-4 mt-4">
        <button
          onClick={() => demander.mutate({ annonceId, mode: "sur_place", date, creneau: creneau! })}
          disabled={!date || !creneau || demander.isPending || demander.isSuccess}
          className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {demander.isPending ? "Envoi…" : demander.isSuccess ? "Demande envoyée" : "Réserver l'essai"}
        </button>
      </div>
    </div>
  );
}
