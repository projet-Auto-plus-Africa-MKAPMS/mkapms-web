import { Link } from "react-router-dom";
import { ChevronLeft, MessageSquare } from "lucide-react";
export default function QuestionsReponses() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/communaute" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Communauté</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><MessageSquare size={20} className="text-[#D4AF37]" /> Questions et Réponses</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4"><p className="text-sm text-[#6B7280] text-center">Module Questions et Réponses</p></div>
    </div>
  );
}
