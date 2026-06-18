import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Award, ShoppingCart } from "lucide-react";
const TYPES = [{ label: "Standard", prix: "19,90 €" }, { label: "Luxe (fond noir)", prix: "29,90 €" }, { label: "Moto", prix: "14,90 €" }, { label: "Utilitaire", prix: "19,90 €" }];
export default function PlaquesImmatriculation() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-pink-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Award size={20} /> Plaques immatriculation</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4"><label className="text-xs text-[#6B7280]">Numéro d'immatriculation</label><input type="text" placeholder="AB-123-CD" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
      <div className="px-4 mt-3 space-y-2">{TYPES.map((t, i) => (
        <button key={t.label} onClick={() => setSelected(i)} className={`w-full rounded-xl p-4 flex justify-between border-2 ${selected === i ? "border-pink-500 bg-pink-50" : "border-[#E5E7EB] bg-white"}`}><span className="text-sm font-bold text-[#111]">{t.label}</span><span className="text-sm font-bold text-pink-700">{t.prix}</span></button>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl bg-pink-700 py-3 text-sm font-bold text-white active:scale-[0.98]">Commander mes plaques</button></div>
    </div>
  );
}
