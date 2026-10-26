import { Link } from "react-router-dom";
import { Car, PlusCircle, ClipboardList, Package } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { isAdmin } from "@shared/roles";
import MediaAdSlot from "../../components/MediaAdSlot";

/* ══════════════════════════════════════════════════════════════════════════
   PORTAIL « VÉHICULE SUR COMMANDE » (/vehicule-sur-commande)
   Demande PDG : système totalement séparé du VO existant. Réutilise
   trpc.annonces.list filtré par ownership="partenaire" — jamais un second
   registre d'annonces. isAdmin ici inclut "employee" (@shared/roles).
   ══════════════════════════════════════════════════════════════════════════ */

const LABEL_STATUT: Record<string, { label: string; style: string }> = {
  disponible_sur_commande: { label: "Disponible sur commande", style: "bg-blue-700 text-white" },
  disponible_sur_visite: { label: "Disponible sur visite", style: "bg-emerald-700 text-white" },
};

export default function PortailVehiculeSurCommande() {
  const { user } = useAuth();
  const { data, isLoading } = trpc.annonces.list.useQuery({ ownership: "partenaire", limit: 24 });
  const annonces = data?.items ?? [];
  const employe = isAdmin(user?.role);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pb-8 pt-8 text-center">
        <video className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25" autoPlay muted loop playsInline preload="metadata" poster="/pubs/hero5-pro.jpg" aria-hidden="true"><source src="/videos/home/home_finance.mp4" type="video/mp4" /></video>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/80 to-black/90" />
        <h1 className="mx-auto flex max-w-4xl items-center justify-center gap-2 break-words text-3xl font-black text-white sm:text-5xl">
          <Package size={22} className="text-[#D4AF37]" /> Véhicule sur commande
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-white/65 sm:text-base">
          Un véhicule sourcé chez un fournisseur, commandable avant d'être physiquement chez MKA.P-MS. Système totalement séparé des véhicules d'occasion déjà en stock.
        </p>
        {employe && (
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Link to="/vehicule-sur-commande/depot" className="flex items-center gap-1 rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-bold text-[#111]">
              <PlusCircle size={14} /> Déposer un véhicule
            </Link>
            <Link to="/vehicule-sur-commande/mes-vehicules" className="flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-white">
              <ClipboardList size={14} /> Mes véhicules attribués
            </Link>
          </div>
        )}
        {user && !employe && (
          <Link to="/vehicule-sur-commande/mes-commandes" className="mt-3 inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-white">
            <ClipboardList size={14} /> Mes commandes
          </Link>
        )}
      </section>

      <div className="px-4 mt-4">
        <MediaAdSlot label="Partenaire mobilité internationale" />
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
                  <p className="break-words text-sm font-bold text-[#111]">{a.titre}</p>
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
