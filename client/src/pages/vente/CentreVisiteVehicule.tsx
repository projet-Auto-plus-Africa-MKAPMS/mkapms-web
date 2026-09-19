import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, MapPin, Video, Phone, Calendar } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   VISITE VÉHICULE (/vente/visite/:id)
   Données réelles : trpc.reservations.demanderVisite (server/routers/
   reservations.ts, table bookings, type "test_drive" — déclaré depuis
   toujours dans le schéma mais jamais utilisé). Réutilise le même moteur
   que les réservations avec acompte, jamais un second registre. Réservé
   aux acheteurs connectés (porte d'accès générale U, pas la porte VO
   professionnelle — cet écran ne concerne pas un vendeur).
   ══════════════════════════════════════════════════════════════════════════ */

const MODES_VISITE: { value: "sur_place" | "visio" | "appel_video"; label: string; icon: typeof MapPin; desc: string }[] = [
  { value: "sur_place", label: "Visite sur place", icon: MapPin, desc: "Rendez-vous au garage" },
  { value: "visio", label: "Visio", icon: Video, desc: "Appel vidéo en direct" },
  { value: "appel_video", label: "Appel vidéo", icon: Phone, desc: "Tour du véhicule en vidéo" },
];
const CRENEAUX = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

export default function CentreVisiteVehicule() {
  const { id } = useParams();
  const annonceId = Number(id);
  const navigate = useNavigate();
  const { data: annonce, isLoading } = trpc.annonces.get.useQuery({ id: annonceId }, { enabled: Number.isFinite(annonceId) });
  const [mode, setMode] = useState(0);
  const [date, setDate] = useState("");
  const [creneau, setCreneau] = useState<string | null>(null);

  const demander = trpc.reservations.demanderVisite.useMutation({
    onSuccess: () => navigate(`/vehicule/${annonceId}?visite=1`),
  });

  if (!Number.isFinite(annonceId) || (!isLoading && !annonce)) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] p-4">
        <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">Véhicule introuvable — revenez depuis sa fiche.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to={`/vehicule/${annonceId}`} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-[#D4AF37]" /> Visite véhicule</h1>
        {annonce && <p className="mt-1 text-sm text-white/60">{annonce.titre || `${annonce.marque} ${annonce.modele}`}</p>}
      </div>

      <div className="px-4 mt-4 space-y-2">
        {MODES_VISITE.map((m, i) => {
          const Icon = m.icon;
          return (
            <button key={m.value} onClick={() => setMode(i)} className={`w-full rounded-xl p-4 flex items-center gap-3 border-2 ${mode === i ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB] bg-white"}`}>
              <Icon size={18} className={mode === i ? "text-[#D4AF37]" : "text-[#6B7280]"} />
              <div className="flex-1 text-left"><p className="text-sm font-bold text-[#111]">{m.label}</p><p className="text-[10px] text-[#6B7280]">{m.desc}</p></div>
            </button>
          );
        })}
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <h3 className="text-sm font-bold text-[#111] mb-2">Choisir un créneau</h3>
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

      <div className="px-4 mt-4">
        <button
          onClick={() => demander.mutate({ annonceId, mode: MODES_VISITE[mode].value, date, creneau: creneau! })}
          disabled={!date || !creneau || demander.isPending}
          className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {demander.isPending ? "Envoi…" : "Confirmer la visite"}
        </button>
      </div>
    </div>
  );
}
