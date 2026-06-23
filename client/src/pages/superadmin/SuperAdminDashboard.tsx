import { Link } from "react-router-dom";
import { Shield, Users, FileText, BarChart3, Bell, Settings, Globe, Lock, ChevronRight, Car, Home, Wrench, Truck, Package, Euro, Megaphone, Calculator, UserCheck } from "lucide-react";
const STATS = [
  { l: "Utilisateurs", v: "12 450", color: "#D4AF37", to: "/superadmin/admin-utilisateurs" },
  { l: "Annonces", v: "8 320", color: "#10B981", to: "/superadmin/admin-moderation-annonces" },
  { l: "Locations", v: "1 840", color: "#3B82F6", to: "/superadmin/admin-abonnements" },
  { l: "Ventes", v: "3 210", color: "#8B5CF6", to: "/superadmin/admin-paiements" },
  { l: "Garages", v: "142", color: "#F59E0B", to: "/superadmin/admin-comptes-pro" },
  { l: "Démarches", v: "2 890", color: "#EF4444", to: "/superadmin/admin-journal" },
  { l: "Pièces", v: "15 200", color: "#14B8A6", to: "/superadmin/admin-abonnements" },
];
const SECTIONS = [
  { title: "Services", items: [
    { label: "Vente", icon: Car, to: "/superadmin/admin-vente", desc: "Annonces, réservations, clients" },
    { label: "Location", icon: Home, to: "/superadmin/admin-location", desc: "Contrats, cautions, véhicules" },
    { label: "Garage", icon: Wrench, to: "/superadmin/admin-garage", desc: "Planning, mécaniciens, devis" },
    { label: "Dépannage", icon: Truck, to: "/superadmin/admin-depannage", desc: "Interventions, dépanneurs" },
    { label: "Pièces", icon: Package, to: "/superadmin/admin-pieces", desc: "Stock, commandes, vendeurs" },
    { label: "Démarches", icon: FileText, to: "/superadmin/admin-demarches", desc: "CG, cessions, dossiers" },
  ]},
  { title: "Gestion", items: [
    { label: "Finance", icon: Euro, to: "/superadmin/admin-paiements", desc: "Paiements, commissions, CA" },
    { label: "Publicité", icon: Megaphone, to: "/superadmin/admin-moderation-annonces", desc: "Espaces, campagnes, tarifs" },
    { label: "Comptabilité", icon: Calculator, to: "/superadmin/admin-paiements", desc: "Revenus, dépenses, résultat" },
    { label: "Employés", icon: Users, to: "/superadmin/admin-employes", desc: "Rôles, droits, planning" },
    { label: "Utilisateurs", icon: UserCheck, to: "/superadmin/admin-utilisateurs", desc: "Comptes, validation, badges" },
    { label: "Sécurité", icon: Shield, to: "/superadmin/admin-securite", desc: "2FA, journal, sauvegardes" },
  ]},
];
export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><Shield size={22} className="text-[#D4AF37]" /> Super Admin</h1><p className="mt-0.5 text-xs text-white/50">Accès complet · Fondateur MKA.P-MS</p></div>
          <div className="bg-[#D4AF37]/20 rounded-full px-3 py-1"><span className="text-[10px] font-bold text-[#D4AF37]">FONDATEUR</span></div>
        </div>
      </div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-4 gap-1.5 mb-4">
        {STATS.map(s => (<Link key={s.l} to={s.to} className="rounded-lg bg-white border border-[#E5E7EB] p-2 text-center shadow-sm hover:shadow-md active:scale-95 transition"><p className="text-sm font-black" style={{ color: s.color }}>{s.v}</p><p className="text-[7px] text-[#6B7280] leading-tight">{s.l}</p></Link>))}
      </div>
      {SECTIONS.map(sec => (
        <div key={sec.title} className="px-4 mb-4">
          <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">{sec.title}</h2>
          <div className="space-y-1.5">
            {sec.items.map(m => { const Icon = m.icon; return (
              <Link key={m.label} to={m.to} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 active:scale-[0.99] shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37]/10"><Icon size={16} className="text-[#D4AF37]" /></div>
                <div className="flex-1"><p className="text-sm font-semibold text-[#111]">{m.label}</p><p className="text-[10px] text-[#6B7280]">{m.desc}</p></div>
                <ChevronRight size={14} className="text-red-500" />
              </Link>); })}
          </div>
        </div>
      ))}
      <div className="px-4"><p className="text-center text-[10px] text-[#9CA3AF]">Super Admin · Tu vois tout · Tu peux tout modifier</p></div>
    </div>
  );
}
