import { Link } from "react-router-dom";
import { ChevronLeft, ClipboardList, ChevronRight } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   MES VÉHICULES ATTRIBUÉS — Véhicule sur commande (vue employé, section 7
   demande PDG). trpc.orderEngine.mesVehiculesAttribues.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUT_LABEL: Record<string, string> = {
  vehicule_selectionne: "Véhicule sélectionné", disponibilite_confirmee: "Disponibilité confirmée",
  documents_controles: "Documents contrôlés", prix_marge_valides: "Prix et marge validés",
  commande_fournisseur_creee: "Commande fournisseur créée", vehicule_en_preparation: "En préparation",
  transport_organise: "Transport organisé", inspection_realisee: "Inspection réalisée",
  pret_visite_livraison: "Prêt pour visite/livraison", decision_finale: "Décision finale",
  vendue: "Vendue", retour_en_cours: "Retour en cours", retournee: "Retournée",
  remise_en_stock: "Remise en stock", annulee: "Annulée", litige: "Litige", remboursee: "Remboursée",
};

export default function MesVehiculesEmploye() {
  const { data, isLoading } = trpc.orderEngine.mesVehiculesAttribues.useQuery();
  const commandes = data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-5">
        <Link to="/vehicule-sur-commande" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Véhicule sur commande</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><ClipboardList size={20} className="text-[#D4AF37]" /> Mes véhicules attribués</h1>
      </div>

      <div className="px-4 mt-4 space-y-2">
        {isLoading && <p className="text-sm text-[#6B7280] text-center">Chargement…</p>}
        {!isLoading && commandes.length === 0 && (
          <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">Aucun véhicule attribué pour l'instant.</p>
        )}
        {commandes.map((c) => (
          <Link key={c.id} to={`/vehicule-sur-commande/mes-vehicules/${c.id}`} className="flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div>
              <p className="text-sm font-bold text-[#111]">{c.reference}</p>
              <p className="text-[10px] text-[#6B7280] mt-0.5">{new Date(c.updatedAt).toLocaleDateString("fr-FR")}</p>
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
