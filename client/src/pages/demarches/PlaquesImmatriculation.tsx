import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Award, Check } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* Données réelles : trpc.carteGrise.createDossier (type "autre", table
   cg_dossiers) — aucune valeur d'enum dédiée "plaques" n'existe côté
   serveur, comme DuplicataDemarche.tsx pour "duplicata". Le type de plaque
   choisi est noté sur le dossier ; le montant réel (prestation) est fixé
   par l'agence au traitement, puis payé via /demarches/paiement-demarches/:id
   (trpc.carteGrise.payerDossier) — jamais un paiement immédiat inventé
   côté client. */

const TYPES = [{ label: "Standard", prix: "19,90 €" }, { label: "Luxe (fond noir)", prix: "29,90 €" }, { label: "Moto", prix: "14,90 €" }, { label: "Utilitaire", prix: "19,90 €" }];

export default function PlaquesImmatriculation() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const [immatriculation, setImmatriculation] = useState("");

  const create = trpc.carteGrise.createDossier.useMutation({
    onSuccess: (dossier) => navigate(`/demarches/paiement-demarches/${dossier.id}`),
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-pink-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Award size={20} /> Plaques immatriculation</h1></div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!immatriculation.trim()) return;
          create.mutate({ type: "autre", immatriculation, notes: `Commande plaques — ${TYPES[selected].label} (${TYPES[selected].prix} indicatif)` });
        }}
      >
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
          <label className="text-xs text-[#6B7280]">Numéro d'immatriculation</label>
          <input value={immatriculation} onChange={(e) => setImmatriculation(e.target.value)} type="text" placeholder="AB-123-CD" required className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
        </div>
        <div className="px-4 mt-3 space-y-2">{TYPES.map((t, i) => (
          <button key={t.label} type="button" onClick={() => setSelected(i)} className={`w-full rounded-xl p-4 flex justify-between border-2 ${selected === i ? "border-pink-500 bg-pink-50" : "border-[#E5E7EB] bg-white"}`}><span className="text-sm font-bold text-[#111]">{t.label}</span><span className="text-sm font-bold text-pink-700">{t.prix}</span></button>))}
        </div>

        {create.isError && <p className="mx-4 mt-3 text-xs font-semibold text-red-600">{create.error.message}</p>}
        {create.isSuccess && <p className="mx-4 mt-3 text-xs font-semibold text-green-600 flex items-center gap-1"><Check size={12} /> Commande {create.data.reference} enregistrée.</p>}

        <div className="px-4 mt-3">
          <button type="submit" disabled={create.isPending || !immatriculation.trim()} className="w-full rounded-xl bg-pink-700 py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50">
            {create.isPending ? "Envoi…" : "Commander mes plaques"}
          </button>
        </div>
      </form>
    </div>
  );
}
