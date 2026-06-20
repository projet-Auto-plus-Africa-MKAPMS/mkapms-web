import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Calculator, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import VehicleIdentification from "../components/VehicleIdentification";

export default function EstimationAuto() {
  const [showResult, setShowResult] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Calculator size={20} className="text-[#D4AF37]" /> Estimation automobile</h1>
        <p className="mt-1 text-sm text-white/60 flex items-center gap-1"><Sparkles size={12} /> Estimez la valeur en 30 secondes</p>
      </div>

      <div className="px-4 mt-4">
        <VehicleIdentification onVehicleFound={() => setShowResult(true)} />
      </div>

      {showResult && (
        <div className="mx-4 mt-4 space-y-3">
          {/* Estimation values */}
          <div className="grid grid-cols-3 gap-2">
            <button className="rounded-xl bg-red-50 border border-red-200 p-3 text-center active:scale-[0.97]">
              <TrendingDown size={14} className="mx-auto text-red-500" />
              <p className="text-[9px] text-red-600 mt-1">Basse</p>
              <p className="text-base font-black text-red-600">22 500 EUR</p>
            </button>
            <button className="rounded-xl bg-[#D4AF37]/10 border-2 border-[#D4AF37]/40 p-3 text-center active:scale-[0.97]">
              <Minus size={14} className="mx-auto text-[#D4AF37]" />
              <p className="text-[9px] text-[#D4AF37] mt-1">Moyenne</p>
              <p className="text-lg font-black text-[#D4AF37]">26 000 EUR</p>
            </button>
            <button className="rounded-xl bg-green-50 border border-green-200 p-3 text-center active:scale-[0.97]">
              <TrendingUp size={14} className="mx-auto text-green-600" />
              <p className="text-[9px] text-green-600 mt-1">Haute</p>
              <p className="text-base font-black text-green-600">29 500 EUR</p>
            </button>
          </div>

          {/* Detail estimation — expandable */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-3">
            <h3 className="text-xs font-bold text-[#111] mb-2">Detail de l'estimation</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Cote Argus", val: "25 800 EUR" },
                { label: "Marche actuel", val: "26 200 EUR" },
                { label: "Etat estime", val: "Bon" },
                { label: "Demande", val: "Forte" },
                { label: "Depreciation annuelle", val: "-8.5%" },
                { label: "Annonces similaires", val: "24" },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-lg bg-[#F5F3EF] p-2">
                  <p className="text-[9px] text-[#6B7280]">{label}</p>
                  <p className="text-[10px] font-bold text-[#111]">{val}</p>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] shadow-lg">
            Vendre mon vehicule sur MKA.P-MS
          </button>
        </div>
      )}
    </div>
  );
}
