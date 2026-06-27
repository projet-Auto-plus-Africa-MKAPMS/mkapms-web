import { Link } from "react-router-dom";
import { ChevronLeft, Edit3, Pause, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
const ACTIONS = [
  { label: "Modifier l'annonce", desc: "Prix, photos, description, options", icon: Edit3, color: "#3B82F6" },
  { label: "Suspendre l'annonce", desc: "Masquer temporairement sans supprimer", icon: Pause, color: "#F59E0B" },
  { label: "Republier l'annonce", desc: "Remettre en ligne après suspension", icon: RefreshCw, color: "#10B981" },
  { label: "Supprimer l'annonce", desc: "Suppression définitive", icon: Trash2, color: "#EF4444" },
];
export default function ModificationAnnonce() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce/tableau-bord-annonceur" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mes annonces</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Edit3 size={20} className="text-[#D4AF37]" /> Gérer l'annonce</h1>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {ACTIONS.map(a => { const Icon = a.icon; return (
          <button key={a.label} className="w-full flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3.5 shadow-sm text-left active:scale-[0.99]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: a.color + "15" }}><Icon size={16} style={{ color: a.color }} /></div>
            <div className="flex-1"><p className="text-sm font-semibold text-[#111]">{a.label}</p><p className="text-[10px] text-[#6B7280]">{a.desc}</p></div>
          </button>); })}
      </div>
    </div>
  );
}
