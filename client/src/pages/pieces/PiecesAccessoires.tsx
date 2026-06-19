import { Link } from "react-router-dom";
import { ChevronLeft, Package, ChevronRight } from "lucide-react";
const ITEMS = ["Tapis",
"Multimédia",
"Caméras",
"GPS",
"Attelage",
"Coffre de toit",];
export default function PiecesAccessoires() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pièces</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Package size={20} className="text-[#D4AF37]" /> Accessoires</h1></div>
      <div className="px-4 mt-4 space-y-1.5">{ITEMS.map(i => (
        <Link key={i} to="/pieces/recherche" className="flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] p-3 active:scale-[0.99]"><span className="text-sm font-semibold text-[#111]">{i}</span><ChevronRight size={16} className="text-red-500" /></Link>))}</div>
    </div>
  );
}
