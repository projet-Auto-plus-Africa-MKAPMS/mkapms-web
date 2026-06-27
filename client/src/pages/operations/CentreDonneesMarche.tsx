import { Link } from "react-router-dom";
import { ChevronLeft, BarChart3 } from "lucide-react";
export default function CentreDonneesMarche() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/operations" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Opérations</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Centre données marché</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4"><p className="text-sm text-[#6B7280] text-center">Module Centre données marché</p></div>
    </div>
  );
}
