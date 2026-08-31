import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";

const CHECKLIST = [
  "Travaux conformes",
  "Niveaux vérifiés",
  "Test freinage",
  "Test route",
  "Voyants éteints",
  "Propreté",
];
const NIVEAUX = ["Mécanicien", "Responsable d'atelier"];

export default function ControleQualitePremium() {
  const [coches, setCoches] = useState<Record<string, boolean>>({});
  const faits = CHECKLIST.filter(c => coches[c]).length;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> CQ Premium</h1><p className="mt-1 text-sm text-white/60">Double validation obligatoire</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <p className="text-sm font-bold text-[#111]">Contrôle à cocher par l'atelier — {faits}/{CHECKLIST.length}</p>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          Les points ne sont pas cochés d'avance : un contrôle non fait ne doit pas s'afficher comme conforme. Ce qui est coché ici reste sur l'appareil, aucun dossier de contrôle qualité n'existe encore côté serveur.
        </p>
      </div>
      <div className="px-4 mt-3 space-y-1.5">{CHECKLIST.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => setCoches(v => ({ ...v, [c]: !v[c] }))}
          className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3 text-left"
        >
          {coches[c]
            ? <Check size={14} className="text-green-600" />
            : <div className="h-4 w-4 rounded-full border-2 border-[#D4D4D4]" />}
          <span className="text-sm text-[#111]">{c}</span>
        </button>))}
      </div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
        <h3 className="text-sm font-bold text-[#111]">Validations obligatoires</h3>
        {NIVEAUX.map(niveau => (
          <div key={niveau} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0">
            <div className="h-4 w-4 rounded-full border-2 border-[#D4D4D4]" />
            <p className="flex-1 text-sm font-semibold text-[#111]">{niveau} — en attente</p>
          </div>))}
        <BoutonMoteur
          code="garage_cq_validation"
          className="block w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white text-center"
        >
          Valider
        </BoutonMoteur>
      </div>
    </div>
  );
}
