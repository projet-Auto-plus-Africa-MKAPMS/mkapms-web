import { Link } from "react-router-dom";
import { ChevronLeft, Users } from "lucide-react";
export default function NosPartenaires() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Nos partenaires</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4"><p className="text-sm text-[#6B7280] text-center">Module Nos partenaires MKA.P-MS</p></div>
    </div>
  );
}
