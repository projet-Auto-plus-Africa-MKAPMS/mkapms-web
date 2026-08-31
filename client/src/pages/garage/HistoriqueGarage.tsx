/**
 * Historique garage — interventions réellement enregistrées du client.
 *
 * L'écran affichait quatre interventions inventées avec un « total dépensé »
 * calculé sur ces montants : un historique d'entretien inexact vaut moins que
 * pas d'historique du tout. Les trois boutons passent par le Moteur de boutons,
 * et la facture reste annoncée comme absente tant qu'aucune n'est émise.
 */
import { Link } from "react-router-dom";
import { ChevronLeft, History } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";
import { trpc } from "../../lib/trpc";

const LIBELLES_STATUT: Record<string, string> = {
  en_attente: "En attente",
  planifiee: "Planifié",
  accueil: "Réceptionné",
  diagnostic: "Diagnostic",
  devis_envoye: "Devis envoyé",
  en_reparation: "En réparation",
  controle_qualite: "Contrôle qualité",
  pret: "Prêt",
  termine: "Terminé",
  annulee: "Annulé",
  confirme: "Confirmé",
};

export default function HistoriqueGarage() {
  const interventions = trpc.garages.myInterventions.useQuery(undefined, { retry: false });
  const rdvs = interventions.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Garage
        </Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <History size={20} className="text-[#D4AF37]" /> Historique garage
        </h1>
        <p className="mt-1 text-sm text-white/60">Vos passages à l'atelier réellement enregistrés</p>
      </div>

      {interventions.isLoading && <p className="px-4 mt-4 text-xs text-[#6B7280]">Chargement…</p>}

      {interventions.isError && (
        <p className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800">
          Historique indisponible : {interventions.error.message}
        </p>
      )}

      {!interventions.isLoading && !interventions.isError && rdvs.length === 0 && (
        <p className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 text-xs text-[#6B7280]">
          Aucune intervention enregistrée à votre nom. Aucun historique d'exemple n'est affiché ici.
        </p>
      )}

      <div className="px-4 mt-3 space-y-2">
        {rdvs.map((r) => (
          <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex justify-between">
              <h3 className="text-sm font-bold text-[#111]">{r.motif || `Rendez-vous ${r.type}`}</h3>
              <span className="text-[10px] font-bold text-[#D4AF37]">
                {LIBELLES_STATUT[String(r.status)] ?? String(r.status)}
              </span>
            </div>
            <p className="text-[10px] text-[#6B7280] mt-0.5">
              {new Date(r.dateHeure).toLocaleString("fr-FR")} · RDV-{r.id}
            </p>
            {r.notes && <p className="text-xs text-[#6B7280] mt-0.5">{r.notes}</p>}
            {r.acompteCents > 0 && (
              <p className="text-[10px] text-[#6B7280] mt-1">
                Acompte {(r.acompteCents / 100).toLocaleString("fr-FR")} €
                {r.acomptePaid ? " — réglé" : " — non réglé"}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              <BoutonMoteur
                code="garage_historique_suivi"
                className="rounded-lg bg-[#F5F3EF] px-2 py-1 text-[9px] font-bold text-[#111]"
              >
                Suivi
              </BoutonMoteur>
              <BoutonMoteur
                code="garage_historique_devis"
                className="rounded-lg bg-[#F5F3EF] px-2 py-1 text-[9px] font-bold text-[#111]"
              >
                Devis
              </BoutonMoteur>
              <BoutonMoteur
                code="garage_historique_facture"
                className="rounded-lg bg-[#F5F3EF] px-2 py-1 text-[9px] font-bold text-[#111]"
              >
                Facture
              </BoutonMoteur>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
