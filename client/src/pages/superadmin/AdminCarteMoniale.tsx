import { Link } from "react-router-dom";
import { ChevronLeft, Globe } from "lucide-react";

const PAYS = [
  { nom: "France", utilisateurs: 1245, annonces: 890, ca: "145 000 EUR" },
  { nom: "Belgique", utilisateurs: 234, annonces: 156, ca: "28 000 EUR" },
  { nom: "Suisse", utilisateurs: 89, annonces: 67, ca: "15 000 EUR" },
  { nom: "Luxembourg", utilisateurs: 45, annonces: 32, ca: "8 500 EUR" },
  { nom: "Senegal", utilisateurs: 34, annonces: 21, ca: "3 200 EUR" },
  { nom: "Cote d'Ivoire", utilisateurs: 28, annonces: 15, ca: "2 100 EUR" },
];

export default function AdminCarteMoniale() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Globe size={20} className="text-[#D4AF37]" /> Carte mondiale</h1>
        <p className="text-xs text-white/50 mt-1">6 pays actifs · 1 675 utilisateurs</p>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {PAYS.map((p) => (
          <button key={p.nom} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3 active:scale-[0.98]">
            <div className="h-9 w-9 rounded-full bg-[#D4AF37]/10 grid place-items-center"><Globe size={16} className="text-[#D4AF37]" /></div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-[#111]">{p.nom}</p>
              <p className="text-[10px] text-[#6B7280]">{p.utilisateurs} utilisateurs · {p.annonces} annonces</p>
            </div>
            <span className="text-xs font-black text-[#D4AF37]">{p.ca}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
