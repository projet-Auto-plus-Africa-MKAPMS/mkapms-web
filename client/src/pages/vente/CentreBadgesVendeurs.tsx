import { Link } from "react-router-dom";
import { ChevronLeft, Award, Check, Shield, Star, Clock, Truck, MessageSquare } from "lucide-react";
const BADGES = [
  { label: "Pro Vérifié", icon: Shield, desc: "Compte et documents vérifiés", ok: true, color: "bg-blue-600" },
  { label: "Premium", icon: Star, desc: "Abonnement Premium actif", ok: true, color: "bg-[#D4AF37]" },
  { label: "Elite", icon: Award, desc: "Top 10% des vendeurs", ok: false, color: "bg-purple-600" },
  { label: "Expert VO", icon: Check, desc: "+500 véhicules vendus", ok: false, color: "bg-emerald-600" },
  { label: "Top Vendeur", icon: Star, desc: "Note > 4.8/5", ok: true, color: "bg-green-600" },
  { label: "Livraison Rapide", icon: Truck, desc: "Délai < 3 jours", ok: true, color: "bg-cyan-600" },
  { label: "Réponse Rapide", icon: MessageSquare, desc: "Temps réponse < 1h", ok: true, color: "bg-orange-600" },
];
export default function CentreBadgesVendeurs() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Award size={20} /> Badges vendeur</h1></div>
      <div className="px-4 mt-4 space-y-2">{BADGES.map(b => { const Icon = b.icon; return (
        <div key={b.label} className={`rounded-xl bg-white border p-4 flex items-center gap-3 ${b.ok ? "border-[#E5E7EB]" : "border-[#E5E7EB] opacity-50"}`}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${b.ok ? b.color : "bg-gray-200"}`}><Icon size={16} className="text-white" /></div>
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{b.label}</h3><p className="text-[10px] text-[#6B7280]">{b.desc}</p></div>
          {b.ok ? <Check size={14} className="text-green-600" /> : <Clock size={14} className="text-red-500" />}
        </div>); })}</div>
    </div>
  );
}
