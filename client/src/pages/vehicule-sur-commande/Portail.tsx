import { Link } from "react-router-dom";
import { Car, PlusCircle, ClipboardList, Package } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   PORTAIL « VÉHICULE SUR COMMANDE » (/vehicule-sur-commande)
   Demande PDG : système totalement séparé du VO existant. Réutilise
   trpc.annonces.list filtré par ownership="partenaire" — jamais un second
   registre d'annonces.
   Route gardée par RequirePermission(module="back_office") dans App.tsx :
   réservée aux équipes MKA.P-MS, jamais à un particulier ou un pro — donc
   ce composant n'affiche que les actions employé, sans branche "client".
   ══════════════════════════════════════════════════════════════════════════ */

const LABEL_STATUT: Record<string, { label: string; style: string }> = {
  disponible_sur_commande: { label: "Disponible sur commande", style: "bg-blue-700 text-white" },
  disponible_sur_visite: { label: "Disponible sur visite", style: "bg-emerald-700 text-white" },
};

export default function PortailVehiculeSurCommande() {
  const { data, isLoading } = trpc.annonces.list.useQuery({ ownership: "partenaire", limit: 24 });
  const annonces = data?.items ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Package size={22} className="text-[#D4AF37]" /> Véhicule sur commande
        </h1>
        <p className="mt-1 text-xs text-white/50">
          Un véhicule sourcé chez un fournisseur, commandable avant d'être physiquement chez MKA.P-MS. Système totalement séparé des véhicules d'occasion déjà en stock.
        </p>
        <div className="mt-3 flex gap-2">
          <Link to="/vehicule-sur-commande/depot" className="flex items-center gap-1 rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-bold text-[#111]">
            <PlusCircle size={14} /> Déposer un véhicule
          </Link>
          <Link to="/vehicule-sur-commande/mes-vehicules" className="flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-white">
            <ClipboardList size={14} /> Mes véhicules attribués
          </Link>
        </div>
      </div>

      <div className="px-4 mt-4">
        {isLoading && <p className="text-sm text-[#6B7280] text-center">Chargement…</p>}
        {!isLoading && annonces.length === 0 && (
          <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">
            Aucun véhicule sur commande disponible pour l'instant.
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a: any) => {
            const statut = LABEL_STATUT[a.vehiculeSurCommandeLabel ?? "disponible_sur_commande"];
            return (
              <Link key={a.id} to={`/vehicule/${a.id}`} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden shadow-sm">
                <div className="h-36 bg-[#F5F3EF] flex items-center justify-center">
                  {a.photoPrincipale ? (
                    <img src={a.photoPrincipale} alt={a.titre} className="h-full w-full object-cover" />
                  ) : (
                    <Car size={32} className="text-[#D1D5DB]" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-[#111] truncate">{a.titre}</p>
                  <p className="text-xs text-[#6B7280]">{Number(a.prix).toLocaleString("fr-FR")} {a.devise}</p>
                  {statut && <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${statut.style}`}>{statut.label}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
