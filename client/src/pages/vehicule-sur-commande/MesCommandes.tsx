import { Link } from "react-router-dom";
import { ChevronLeft, Package, ChevronRight } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   MES COMMANDES — Véhicule sur commande (vue client, section 9 demande PDG)
   trpc.orderEngine.mesCommandes — jamais les étapes internes.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUT_LABEL: Record<string, string> = {
  vehicule_selectionne: "En cours",
  disponibilite_confirmee: "En cours",
  documents_controles: "En cours",
  prix_marge_valides: "En cours",
  commande_fournisseur_creee: "En cours",
  vehicule_en_preparation: "En préparation",
  transport_organise: "En préparation",
  inspection_realisee: "En préparation",
  pret_visite_livraison: "Prêt",
  decision_finale: "Décision en cours",
  vendue: "Remis",
  retour_en_cours: "Annulée",
  retournee: "Annulée",
  remise_en_stock: "Annulée",
  annulee: "Annulée",
  litige: "Litige en cours",
  remboursee: "Remboursée",
};

export default function MesCommandesClient() {
  const { data, isLoading } = trpc.orderEngine.mesCommandes.useQuery();
  const commandes = data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-5">
        <Link to="/vehicule-sur-commande" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Véhicule sur commande</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Package size={20} className="text-[#D4AF37]" /> Mes commandes</h1>
      </div>

      <div className="px-4 mt-4 space-y-2">
        {isLoading && <p className="text-sm text-[#6B7280] text-center">Chargement…</p>}
        {!isLoading && commandes.length === 0 && (
          <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">Aucune commande pour l'instant.</p>
        )}
        {commandes.map((c) => (
          <Link key={c.id} to={`/vehicule-sur-commande/mes-commandes/${c.id}`} className="flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div>
              <p className="text-sm font-bold text-[#111]">{c.reference}</p>
              <p className="text-[10px] text-[#6B7280] mt-0.5">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#D4AF37]">{STATUT_LABEL[c.status] ?? c.status}</span>
              <ChevronRight size={16} className="text-[#9CA3AF]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
