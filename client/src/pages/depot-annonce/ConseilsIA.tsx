import { Link } from "react-router-dom";
import { ChevronLeft, Sparkles, Camera, Video, FileText, Clock, TrendingUp } from "lucide-react";
const CONSEILS = [
  { conseil: "Ajouter photo moteur", impact: "+5 points", icon: Camera, priorite: "haute" },
  { conseil: "Ajouter vidéo présentation", impact: "+10 points", icon: Video, priorite: "haute" },
  { conseil: "Ajouter historique entretien", impact: "+10 points", icon: FileText, priorite: "haute" },
  { conseil: "Ajouter contrôle technique récent", impact: "+5 points", icon: FileText, priorite: "moyenne" },
  { conseil: "Améliorer la description", impact: "+5 points", icon: FileText, priorite: "moyenne" },
  { conseil: "Réduire le prix de 3%", impact: "Visibilité +20%", icon: TrendingUp, priorite: "optionnel" },
];
const PRIO_COLORS: Record<string, string> = { haute: "bg-red-100 text-red-600", moyenne: "bg-yellow-100 text-yellow-600", optionnel: "bg-blue-100 text-blue-600" };
export default function ConseilsIA() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dépôt annonce</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Sparkles size={20} className="text-[#D4AF37]" /> Conseils IA</h1>
        <p className="text-xs text-white/50 mt-1">Améliorer la visibilité et la qualité de vos annonces</p>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {CONSEILS.map(c => { const Icon = c.icon; return (
          <div key={c.conseil} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37]/10"><Icon size={14} className="text-[#D4AF37]" /></div>
            <div className="flex-1"><p className="text-xs font-semibold text-[#111]">{c.conseil}</p><p className="text-[10px] text-green-600 font-bold">{c.impact}</p></div>
            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${PRIO_COLORS[c.priorite]}`}>{c.priorite}</span>
          </div>); })}
      </div>
    </div>
  );
}
