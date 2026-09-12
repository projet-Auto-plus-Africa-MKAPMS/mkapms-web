import { Link } from "react-router-dom";
import { ChevronLeft, Wrench } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* Données réelles : trpc.garages.myInterventions (server/routers/garages.ts,
   table rdv_garage) — jamais un second historique inventé. Le nom du
   garage n'est pas joint par cette procédure : plutôt que d'inventer un
   nom, la référence réelle (#garageId). */

const STATUT_LABEL: Record<string, string> = {
  en_attente: "En attente",
  confirme: "Confirmé",
  honore: "Honoré",
  annule_client: "Annulé par vous",
  annule_garage: "Annulé par le garage",
  no_show: "Non présenté",
  planifiee: "Planifié",
  accueil: "Véhicule réceptionné",
  diagnostic: "Diagnostic en cours",
  devis_envoye: "Devis envoyé",
  en_reparation: "Réparation en cours",
  controle_qualite: "Contrôle qualité",
  pret: "Prêt à récupérer",
  termine: "Terminé",
  annulee: "Annulée",
};

export default function HistoriqueEntretiens() {
  const mine = trpc.garages.myInterventions.useQuery();
  const liste = mine.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} className="text-[#D4AF37]" /> Historique entretiens</h1>
        <p className="mt-1 text-sm text-white/60">Vos rendez-vous et interventions garage</p>
      </div>

      {mine.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((r) => (
          <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111]">{r.motif ?? "Rendez-vous garage"} — Garage #{r.garageId}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{STATUT_LABEL[r.status] ?? r.status}</span>
            </div>
            <p className="text-[10px] text-[#9CA3AF] mt-1">{new Date(r.dateHeure).toLocaleString("fr-FR")}</p>
          </div>
        ))}
      </div>

      {!mine.isLoading && liste.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Wrench size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun entretien pour le moment.</p>
        </div>
      )}
    </div>
  );
}
