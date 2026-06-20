import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Wrench, Clock, Check, ChevronDown } from "lucide-react";
import VehicleIdentification from "../../components/VehicleIdentification";

const TRAVAUX = [
  { label: "Plaquettes + disques avant", mecanicien: "Ahmed B.", pont: "Pont 2", debut: "10:00", duree: "2h", statut: "termine", ref: "BOS-0986-5443", prix: "285 EUR" },
  { label: "Filtre habitacle", mecanicien: "Ahmed B.", pont: "Pont 2", debut: "12:00", duree: "15 min", statut: "termine", ref: "MAN-8821-FC", prix: "32 EUR" },
  { label: "Reparation direction", mecanicien: "Paul M.", pont: "Pont 3", debut: "14:00", duree: "3h", statut: "en_cours", ref: "TRW-JRM445", prix: "520 EUR" },
  { label: "Pneu avant droit", mecanicien: "Jean D.", pont: "Pont 1", debut: "15:00", duree: "30 min", statut: "a_faire", ref: "MIC-205/55R16", prix: "89 EUR" },
];

export default function OrdreReparation() {
  const [vehicleFound, setVehicleFound] = useState(false);
  const [expandedTravail, setExpandedTravail] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} className="text-[#D4AF37]" /> Ordre de reparation</h1>
        <p className="mt-1 text-sm text-white/60">OR-2025-0142</p>
      </div>

      {/* Identification vehicule */}
      <div className="px-4 mt-4">
        <VehicleIdentification onVehicleFound={() => setVehicleFound(true)} compact />
      </div>

      {/* Travaux */}
      {vehicleFound && (
        <div className="px-4 mt-4 space-y-2">
          <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Travaux</h2>
          {TRAVAUX.map((t, i) => {
            const isExp = expandedTravail === i;
            return (
              <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <button onClick={() => setExpandedTravail(isExp ? null : i)} className="w-full text-left p-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#111]">{t.label}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${t.statut === "termine" ? "bg-green-50 text-green-600" : t.statut === "en_cours" ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-[#9CA3AF]"}`}>
                        {t.statut === "termine" ? "Termine" : t.statut === "en_cours" ? "En cours" : "A faire"}
                      </span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </button>
                {isExp && (
                  <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Mecanicien</span><p className="font-bold text-[#111]">{t.mecanicien}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Pont</span><p className="font-bold text-[#111]">{t.pont}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Debut / Duree</span><p className="font-bold text-[#111]">{t.debut} · {t.duree}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Reference</span><p className="font-bold text-[#D4AF37]">{t.ref}</p></div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-[#111]">Prix: {t.prix}</span>
                      <button className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-[9px] font-bold text-white">Voir details</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div className="rounded-xl bg-[#111] p-3 flex items-center justify-between mt-3">
            <span className="text-xs text-white/60">Total estimation</span>
            <span className="text-sm font-black text-[#D4AF37]">926 EUR</span>
          </div>
        </div>
      )}
    </div>
  );
}
