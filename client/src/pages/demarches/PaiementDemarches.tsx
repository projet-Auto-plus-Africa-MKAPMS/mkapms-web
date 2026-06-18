import { Link } from "react-router-dom";
import { ChevronLeft, Euro, Check, FileText, Download } from "lucide-react";
export default function PaiementDemarches() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Euro size={20} className="text-[#D4AF37]" /> Paiement</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Carte grise — Changement titulaire</span><span className="font-bold">227,76 €</span></div>
        <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Frais de service MKA.P-MS</span><span className="font-bold">29,90 €</span></div>
        <div className="flex justify-between pt-2 border-t-2 border-[#D4AF37] text-base"><span className="font-black">Total</span><span className="font-black text-[#D4AF37]">257,66 €</span></div>
        <button className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white active:scale-[0.98]">Payer par carte</button>
        <p className="text-center text-[9px] text-[#6B7280]">Paiement sécurisé · Facture automatique · Archivage</p>
      </div>
    </div>
  );
}
