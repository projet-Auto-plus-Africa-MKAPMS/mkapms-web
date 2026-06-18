import { Link } from "react-router-dom";
import { ChevronLeft, Clock, Bell, AlertTriangle, RefreshCw } from "lucide-react";
const ALERTES = [
  { delai: "30 jours", desc: "Première notification d'expiration prochaine", color: "#10B981" },
  { delai: "15 jours", desc: "Rappel d'expiration", color: "#F59E0B" },
  { delai: "7 jours", desc: "Alerte expiration imminente", color: "#F97316" },
  { delai: "1 jour", desc: "Dernière chance de renouveler", color: "#EF4444" },
];
export default function ExpirationAnnonce() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce/tableau-bord-annonceur" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mes annonces</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Clock size={20} className="text-[#D4AF37]" /> Expiration</h1>
      </div>
      <div className="px-4 mt-4 space-y-3">
        <h2 className="text-xs font-bold text-[#6B7280] uppercase">Notifications automatiques</h2>
        {ALERTES.map(a => (
          <div key={a.delai} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: a.color + "15" }}><Bell size={14} style={{ color: a.color }} /></div>
            <div className="flex-1"><p className="text-sm font-bold" style={{ color: a.color }}>J-{a.delai.split(" ")[0]}</p><p className="text-[10px] text-[#6B7280]">{a.desc}</p></div>
          </div>))}
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-[#D4AF37] text-white rounded-xl text-xs font-bold"><RefreshCw size={14} /> Renouveler automatiquement</button>
      </div>
    </div>
  );
}
