import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Eye, Edit, Trash2, Check, Clock } from "lucide-react";
const JOURNAL = [
  { action: "Connexion", user: "Ahmed B.", date: "15/03 14:30", ip: "192.168.1.x" },
  { action: "Modification annonce", user: "Jean D.", date: "15/03 12:15", ip: "192.168.1.x" },
  { action: "Suppression brouillon", user: "Ahmed B.", date: "14/03 16:00", ip: "192.168.1.x" },
  { action: "Validation document", user: "Ahmed B.", date: "14/03 10:30", ip: "192.168.1.x" },
  { action: "Connexion", user: "Marie P.", date: "13/03 09:00", ip: "10.0.0.x" },
];
export default function CentreSecurite() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} /> Sécurité</h1><p className="mt-1 text-sm text-white/80">Journal d'activité</p></div>
      <div className="px-4 mt-4 space-y-1.5">{JOURNAL.map((j, i) => (
        <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          {j.action.includes("Connexion") ? <Eye size={12} className="text-blue-600" /> : j.action.includes("Modification") ? <Edit size={12} className="text-amber-500" /> : j.action.includes("Suppression") ? <Trash2 size={12} className="text-red-500" /> : <Check size={12} className="text-green-600" />}
          <div className="flex-1"><p className="text-sm text-[#111]">{j.action}</p><p className="text-[9px] text-[#6B7280]">{j.user} · {j.date}</p></div>
        </div>))}</div>
    </div>
  );
}
