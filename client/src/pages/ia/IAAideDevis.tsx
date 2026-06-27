import { Link } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";
export default function IAAideDevis() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> IA Aide au devis</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4"><p className="text-sm text-[#6B7280] text-center">Module IA Aide au devis MKA.P-MS</p></div>
    </div>
  );
}
