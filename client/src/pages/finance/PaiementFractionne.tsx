import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, CreditCard, Check } from "lucide-react";
const OPTIONS = [
  { fois: 2, mensualite: "12 500 €" }, { fois: 3, mensualite: "8 333 €" },
  { fois: 4, mensualite: "6 250 €" }, { fois: 5, mensualite: "5 000 €" }, { fois: 10, mensualite: "2 500 €" },
];
export default function PaiementFractionne() {
  const [selected, setSelected] = useState(2);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-700 px-4 pt-6 pb-5"><Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><CreditCard size={20} /> Paiement en plusieurs fois</h1><p className="mt-1 text-sm text-white/80">Montant total : 25 000 €</p></div>
      <div className="px-4 mt-4 space-y-2">{OPTIONS.map(o => (
        <button key={o.fois} onClick={() => setSelected(o.fois)} className={`w-full rounded-xl p-4 flex justify-between border-2 ${selected === o.fois ? "border-blue-500 bg-blue-50" : "border-[#E5E7EB] bg-white"}`}>
          <span className="text-sm font-bold text-[#111]">{o.fois}x sans frais</span><span className="text-sm font-bold text-blue-700">{o.mensualite}/mois</span>
        </button>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl bg-blue-700 py-3 text-sm font-bold text-white active:scale-[0.98]">Valider le paiement</button></div>
    </div>
  );
}
