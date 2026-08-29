import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Package,
  FileText,
  MessageSquare,
  Calendar,
  Euro,
  Users,
  BarChart3,
  Settings,
  Tag,
  Bell,
  ChevronRight,
  Shield,
  Star,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { trpc } from "../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   7-8. TABLEAU DE BORD PRO VENTE
   Toutes les valeurs affichées viennent du compte connecté (voEspaces) :
   aucun chiffre d'exemple, aucun stock d'un autre compte.
   ══════════════════════════════════════════════════════════════════════════ */

export default function TableauBordProVente() {
  const { user } = useAuth();
  const acces = trpc.voEspaces.acces.useQuery();
  const compteurs = trpc.voEspaces.compteurs.useQuery();
  const nonLues = trpc.notifications.unreadCount.useQuery();

  const c = compteurs.data;
  const abonnement = acces.data?.abonnement;
  const chargement = compteurs.isLoading;
  const val = (n: number | undefined) => (chargement ? "…" : String(n ?? 0));

  const stats = [
    { label: "Stock", value: val(c?.stock), color: "text-blue-600", to: "/vente/stock" },
    { label: "Actives", value: val(c?.actives), color: "text-green-600", to: "/vente/mes-annonces" },
    {
      label: "Réservées",
      value: val(c?.reservees),
      color: "text-amber-600",
      to: "/vente/reservations",
    },
    { label: "Vendues", value: val(c?.vendues), color: "text-[#D4AF37]", to: "/vente/mes-annonces" },
  ];

  const menu = [
    { label: "Mes annonces", icon: FileText, to: "/vente/mes-annonces", count: c?.actives, color: "bg-blue-600" },
    { label: "Stock véhicules", icon: Package, to: "/vente/stock", count: c?.stock, color: "bg-indigo-600" },
    { label: "Brouillons", icon: FileText, to: "/vente/mes-annonces", count: c?.brouillons, color: "bg-gray-500" },
    { label: "En validation", icon: AlertCircle, to: "/vente/mes-annonces", count: c?.enValidation, color: "bg-amber-500" },
    { label: "Annonces vendues", icon: Tag, to: "/vente/mes-annonces", count: c?.vendues, color: "bg-green-600" },
    { label: "Messages clients", icon: MessageSquare, to: "/messagerie", count: null, color: "bg-purple-600" },
    { label: "Réservations", icon: Calendar, to: "/vente/reservations", count: c?.reservees, color: "bg-amber-600" },
    { label: "Abonnements", icon: Star, to: "/vente/abonnements", count: null, color: "bg-[#D4AF37]" },
    { label: "Factures", icon: Euro, to: "/vente/factures", count: null, color: "bg-teal-600" },
    { label: "Documents société", icon: Shield, to: "/vente/documents-societe", count: null, color: "bg-cyan-600" },
    { label: "Employés", icon: Users, to: "/vente/employes", count: null, color: "bg-orange-600" },
    { label: "Statistiques", icon: BarChart3, to: "/vente/statistiques", count: null, color: "bg-pink-600" },
  ];

  const titre = user?.companyName || user?.name || "Mon espace professionnel";
  const alertes = nonLues.data ?? 0;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Accueil
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white">
                {acces.data?.espace === "officiel" ? "OFFICIEL" : "PRO"}
              </span>
              {abonnement && (
                <span className="rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-bold text-white flex items-center gap-0.5">
                  <Shield size={8} /> Abonnement VO actif
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-white">{titre}</h1>
            <p className="text-xs text-white/60">Tableau de bord professionnel</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/notifications"
              className="relative h-9 w-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Bell size={16} className="text-white" />
              {alertes > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center">
                  {alertes}
                </span>
              )}
            </Link>
            <Link
              to="/profil"
              className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Settings size={16} className="text-white" />
            </Link>
          </div>
        </div>
      </div>

      {/* Compteurs réels du compte connecté */}
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-center active:scale-[0.97] transition"
          >
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="text-[8px] text-[#6B7280]">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="px-4 mt-3 grid grid-cols-2 gap-2">
        <Link
          to="/acheter/depot-annonce"
          className="rounded-xl bg-blue-800 p-3 text-center active:scale-[0.98] transition"
        >
          <Tag size={18} className="mx-auto text-white" />
          <p className="text-xs font-bold text-white mt-1">Déposer annonce</p>
        </Link>
        <Link
          to="/vente/stock"
          className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.98] transition"
        >
          <Package size={18} className="mx-auto text-blue-700" />
          <p className="text-xs font-bold text-[#111] mt-1">Gérer stock</p>
        </Link>
      </div>

      <div className="px-4 mt-4 space-y-1.5">
        {menu.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.label}
              to={m.to}
              className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 active:scale-[0.99] transition"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${m.color}`}
              >
                <Icon size={14} className="text-white" />
              </div>
              <span className="flex-1 text-sm font-semibold text-[#111]">{m.label}</span>
              {m.count !== null && m.count !== undefined && (
                <span className="rounded-full bg-[#F5F3EF] h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[9px] font-bold text-[#6B7280]">
                  {m.count}
                </span>
              )}
              <ChevronRight size={14} className="text-red-500" />
            </Link>
          );
        })}
      </div>

      {/* Abonnement réellement enregistré sur ce compte */}
      <div className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-[#D4AF37]/30 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50">
            {abonnement ? "Abonnement actif" : acces.data?.equipe ? "Accès équipe" : "Abonnement"}
          </p>
          <p className="text-sm font-bold text-[#D4AF37]">
            {abonnement?.label ??
              (acces.data?.equipe ? "Espace officiel MKA.P-MS" : "Aucun abonnement VO")}
          </p>
          <p className="text-[9px] text-white/40">
            {abonnement
              ? [
                  abonnement.quotaAnnonces === null
                    ? "Annonces illimitées"
                    : `${abonnement.quotaAnnonces} annonces`,
                  abonnement.finPeriode
                    ? `jusqu'au ${new Date(abonnement.finPeriode).toLocaleDateString("fr-FR")}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : acces.data?.equipe
                ? "Stock officiel géré dans VO Interne"
                : "Souscrivez pour gérer votre stock"}
          </p>
        </div>
        <Link
          to="/vente/abonnements"
          className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-[10px] font-bold text-white"
        >
          Gérer
        </Link>
      </div>
    </div>
  );
}
