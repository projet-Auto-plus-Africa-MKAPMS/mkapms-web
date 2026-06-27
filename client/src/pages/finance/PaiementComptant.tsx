import { Link } from "react-router-dom";
import { ChevronLeft, Euro, Check, FileText } from "lucide-react";
export default function PaiementComptant() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Euro size={20} className="text-[#D4AF37]" /> Paiement comptant</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Montant total</span><span className="text-xl font-black text-[#D4AF37]">25 000 €</span></div>
        <button className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white active:scale-[0.98]">Payer par carte</button>
        <button className="w-full rounded-xl bg-white border border-[#E5E7EB] py-3 text-sm font-bold text-[#111] active:scale-[0.98]">Payer par virement</button>
        <p className="text-center text-[9px] text-[#6B7280]">Facture immédiate · Historique conservé</p>
      </div>
    </div>
  );
}
