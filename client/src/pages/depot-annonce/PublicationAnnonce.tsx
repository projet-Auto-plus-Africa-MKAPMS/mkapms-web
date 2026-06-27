import { Link } from "react-router-dom";
import { Check, Eye, Clock, Home } from "lucide-react";
export default function PublicationAnnonce() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-10 pb-8 text-center">
        <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3"><Check size={32} className="text-white" /></div>
        <h1 className="text-2xl font-black text-white">Annonce publiée !</h1>
        <p className="mt-1 text-xs text-white/50">Votre annonce est maintenant visible sur MKA.P-MS</p>
      </div>
      <div className="px-4 mt-4 space-y-3">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm text-center"><p className="text-sm font-bold text-[#111] mb-1">Peugeot 308 — 15 900 €</p><p className="text-[10px] text-[#6B7280]">Annonce #MKA-2026-00842</p><div className="flex justify-center gap-2 mt-2"><span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">PRO</span><span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">VÉRIFIÉ</span></div></div>
        <div className="rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3"><p className="text-[10px] text-[#374151]"><span className="font-bold text-[#D4AF37]">Prochaine étape :</span> Suivez les vues, clics et messages depuis votre tableau de bord annonceur.</p></div>
        <div className="space-y-2">
          <Link to="/depot-annonce/tableau-bord-annonceur" className="flex items-center justify-center gap-2 w-full py-3 bg-[#111] text-white rounded-xl text-xs font-bold"><Eye size={14} /> Tableau de bord annonceur</Link>
          <Link to="/depot-annonce" className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-[#E5E7EB] text-[#111] rounded-xl text-xs font-bold"><Home size={14} /> Déposer une autre annonce</Link>
        </div>
      </div>
    </div>
  );
}
