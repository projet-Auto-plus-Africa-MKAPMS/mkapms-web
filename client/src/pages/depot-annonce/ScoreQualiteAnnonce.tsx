import { Link } from "react-router-dom";
import { ChevronLeft, Star, Camera, Video, FileText, MessageSquare, Check, AlertTriangle } from "lucide-react";
const CRITERIA = [
  { label: "Photos complètes", score: 25, max: 30, icon: Camera, status: "good" },
  { label: "Vidéo ajoutée", score: 10, max: 15, icon: Video, status: "good" },
  { label: "Documents fournis", score: 15, max: 15, icon: FileText, status: "perfect" },
  { label: "Description détaillée", score: 15, max: 20, icon: MessageSquare, status: "warning" },
  { label: "Options activées", score: 10, max: 10, icon: Check, status: "perfect" },
  { label: "Historique entretien", score: 0, max: 10, icon: AlertTriangle, status: "missing" },
];
export default function ScoreQualiteAnnonce() {
  const total = CRITERIA.reduce((s, c) => s + c.score, 0);
  const max = CRITERIA.reduce((s, c) => s + c.max, 0);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dépôt annonce</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Star size={20} className="text-[#D4AF37]" /> Score qualité</h1>
      </div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-4 text-center shadow-sm mb-4">
        <p className="text-4xl font-black" style={{ color: total >= 80 ? "#10B981" : total >= 50 ? "#F59E0B" : "#EF4444" }}>{total}/{max}</p>
        <div className="flex justify-center gap-0.5 mt-1">{[1,2,3,4,5].map(i => (<Star key={i} size={16} className={i <= Math.round(total/max*5) ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#E5E7EB]"} />))}</div>
        <p className="text-xs text-[#6B7280] mt-1">{total >= 80 ? "Excellente annonce !" : total >= 50 ? "Bonne annonce — ajoutez plus de détails" : "Annonce à améliorer"}</p>
      </div>
      <div className="px-4 space-y-2">
        {CRITERIA.map(c => { const Icon = c.icon; return (
          <div key={c.label} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <Icon size={14} className={c.status === "perfect" ? "text-green-500" : c.status === "good" ? "text-blue-500" : c.status === "warning" ? "text-yellow-500" : "text-red-400"} />
            <div className="flex-1"><p className="text-xs font-semibold text-[#111]">{c.label}</p></div>
            <span className="text-xs font-bold" style={{ color: c.score >= c.max ? "#10B981" : c.score > 0 ? "#F59E0B" : "#EF4444" }}>{c.score}/{c.max}</span>
          </div>); })}
      </div>
    </div>
  );
}
