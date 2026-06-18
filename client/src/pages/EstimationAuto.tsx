import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Calculator, Search, Car, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function EstimationAuto() {
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Calculator size={20} className="text-[#D4AF37]" /> Estimation automobile</h1>
        <p className="mt-1 text-sm text-white/60">Estimez la valeur de votre véhicule en 30 secondes</p>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <label className="text-sm font-bold text-[#111]">Plaque d'immatriculation ou VIN</label>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-3">
          <Search size={14} className="text-[#6B7280]" />
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="AB-123-CD ou VIN…" className="w-full bg-transparent text-sm font-semibold outline-none uppercase" />
        </div>
        <button onClick={() => setShowResult(true)} className={`mt-3 w-full rounded-xl py-3.5 text-sm font-bold text-white transition ${input.length >= 4 ? "bg-[#D4AF37] active:scale-[0.98]" : "bg-[#D4D4D4]"}`} disabled={input.length < 4}>
          Estimer mon véhicule
        </button>
      </div>

      {showResult && (
        <div className="mx-4 mt-4 space-y-3">
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2"><Car size={16} className="text-[#D4AF37]" /><span className="text-sm font-bold text-[#111]">Peugeot 3008 GT — 2022</span></div>
            <p className="text-[10px] text-[#6B7280]">Hybride · Automatique · 45 000 km · Première main</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
              <TrendingDown size={16} className="mx-auto text-red-500" />
              <p className="text-[9px] text-red-600 mt-1">Valeur basse</p>
              <p className="text-lg font-black text-red-600">22 500 €</p>
            </div>
            <div className="rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-4 text-center">
              <Minus size={16} className="mx-auto text-[#D4AF37]" />
              <p className="text-[9px] text-[#D4AF37] mt-1">Valeur moyenne</p>
              <p className="text-xl font-black text-[#D4AF37]">26 000 €</p>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
              <TrendingUp size={16} className="mx-auto text-green-600" />
              <p className="text-[9px] text-green-600 mt-1">Valeur haute</p>
              <p className="text-lg font-black text-green-600">29 500 €</p>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
            <h3 className="text-sm font-bold text-[#111]">Détail de l'estimation</h3>
            {[["Cote Argus", "25 800 €"], ["Marché actuel", "26 200 €"], ["État estimé", "Bon"], ["Demande", "Forte"]].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between text-xs"><span className="text-[#6B7280]">{l}</span><span className="font-bold text-[#111]">{v}</span></div>
            ))}
          </div>
          <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Vendre mon véhicule sur MKA.P-MS</button>
        </div>
      )}
    </div>
  );
}
