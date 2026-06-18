import { Link } from "react-router-dom";
import { ChevronLeft, Archive } from "lucide-react";
export default function HistoriqueNotifications() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/notifications" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Notifications</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Archive size={20} className="text-[#D4AF37]" /> Historique notifications</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4"><p className="text-sm text-[#6B7280] text-center">Module Historique notifications</p></div>
    </div>
  );
}
