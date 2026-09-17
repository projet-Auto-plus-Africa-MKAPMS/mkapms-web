import { Link } from "react-router-dom";
import { ChevronLeft, BarChart3, Package, Calendar, Euro, MessageSquare, FileText, TrendingUp, ChevronRight } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { BoutonMoteur } from "../../lib/boutonMoteur";

const ICONES: Record<string, typeof Package> = {
  stock: Package,
  reservees: Calendar,
  ventes_mois: TrendingUp,
  ca_mois: Euro,
};

const MENU = [
  { label: "Stock", to: "/vente/stock", icon: Package },
  { label: "Réservations", to: "/vente/reservations", icon: Calendar },
  { label: "Messages", to: "/messagerie", icon: MessageSquare },
  { label: "Documents", to: "/documents", icon: FileText },
  { label: "Statistiques", to: "/vente/statistiques", icon: BarChart3 },
];

function formaterMontant(n: number) {
  return n >= 1000 ? `${Math.round(n / 1000)}k €` : `${n.toLocaleString("fr-FR")} €`;
}

export default function TableauBordVendeur() {
  const compteurs = trpc.voEspaces.compteurs.useQuery();
  const cartes = (compteurs.data?.cartes ?? []).filter((c) => c.tableaux.includes("resume_vendeur"));

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <BoutonMoteur code="vente_resume_retour_tableau" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Pro
        </BoutonMoteur>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <BarChart3 size={20} /> Résumé vendeur
        </h1>
        <p className="text-xs text-white/60">Compteurs réels de votre compte</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 grid grid-cols-4 gap-2">
        {compteurs.isLoading && cartes.length === 0 && (
          <div className="col-span-4 rounded-xl bg-white border border-[#E5E7EB] p-3 text-center text-xs text-[#6B7280]">Chargement…</div>
        )}
        {cartes.map((c) => {
          const Icon = ICONES[c.code] ?? Package;
          const query = c.statut ? { statut: c.statut } : undefined;
          return (
            <Link
              key={c.code}
              to={query ? `${c.cible}?statut=${encodeURIComponent(c.statut ?? "")}` : c.cible}
              className="rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-center active:scale-[0.97] transition"
            >
              <Icon size={14} className="mx-auto text-blue-700" />
              <p className="text-base font-black text-[#111] mt-1">
                {c.genre === "montant" ? formaterMontant(c.valeur) : c.valeur}
              </p>
              <p className="text-[8px] text-[#6B7280]">{c.libelle}</p>
            </Link>
          );
        })}
      </div>

      <div className="px-4 mt-4 space-y-1.5">
        {MENU.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.label} to={m.to} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 active:scale-[0.99] transition">
              <Icon size={14} className="text-blue-700" />
              <span className="flex-1 text-sm font-semibold text-[#111]">{m.label}</span>
              <ChevronRight size={14} className="text-red-500" />
            </Link>
          );
        })}
        <BoutonMoteur code="vente_resume_factures" className="flex w-full items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 active:scale-[0.99] transition">
          <Euro size={14} className="text-blue-700" />
          <span className="flex-1 text-left text-sm font-semibold text-[#111]">Factures</span>
          <ChevronRight size={14} className="text-red-500" />
        </BoutonMoteur>
      </div>
    </div>
  );
}
