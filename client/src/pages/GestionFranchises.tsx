import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Shield, Check, Euro, Star, AlertCircle,
  ChevronRight
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   GESTION DES FRANCHISES
   Standard / Réduite / Premium. Prix calculé automatiquement.
   ══════════════════════════════════════════════════════════════════════════ */

const FRANCHISES = [
  {
    id: "standard", label: "Franchise Standard", prix: "Incluse", franchise: "800 €",
    desc: "Couverture de base incluse dans le prix de location",
    avantages: ["Responsabilité civile", "Vol et incendie", "Bris de glace (franchise 150 €)"],
    exclusions: ["Pneus", "Intérieur", "Effets personnels"],
    color: "border-[#E5E7EB]", badge: "bg-[#F5F3EF] text-[#6B7280]",
  },
  {
    id: "reduite", label: "Franchise Réduite", prix: "+ 8 €/jour", franchise: "300 €",
    desc: "Franchise réduite de 800 € à 300 € pour plus de sérénité",
    avantages: ["Tout Standard", "Franchise réduite à 300 €", "Assistance renforcée", "Pneus inclus"],
    exclusions: ["Intérieur", "Effets personnels"],
    color: "border-blue-300", badge: "bg-blue-50 text-blue-700",
    popular: true,
  },
  {
    id: "premium", label: "Franchise Premium", prix: "+ 15 €/jour", franchise: "0 €",
    desc: "Franchise à 0 €. Zéro stress, zéro surprise.",
    avantages: ["Tout Réduite", "Franchise 0 €", "Pneus, glaces, intérieur", "Véhicule de remplacement", "Effets personnels (500 €)"],
    exclusions: [],
    color: "border-[#D4AF37]", badge: "bg-[#D4AF37] text-white",
  },
];

export default function GestionFranchises() {
  const [selected, setSelected] = useState("reduite");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Gestion des franchises</h1>
        <p className="mt-1 text-sm text-white/60">Choisissez votre niveau de protection</p>
      </div>

      {/* Info */}
      <div className="mx-4 mt-4 rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
        <AlertCircle size={14} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800">La franchise est le montant maximum restant à votre charge en cas de sinistre. Plus la franchise est basse, moins vous payez en cas de problème.</p>
      </div>

      {/* Franchise options */}
      <div className="px-4 mt-4 space-y-3">
        {FRANCHISES.map((f) => (
          <button key={f.id} onClick={() => setSelected(f.id)} className={`w-full rounded-xl border-2 bg-white overflow-hidden text-left transition ${selected === f.id ? "border-[#D4AF37] ring-1 ring-[#D4AF37]/20" : f.color}`}>
            {f.popular && <div className="bg-blue-600 px-3 py-1 text-center text-[10px] font-bold text-white">Le plus populaire</div>}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${f.badge}`}>{f.label}</span>
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selected === f.id ? "border-[#D4AF37] bg-[#D4AF37]" : "border-[#D4D4D4]"}`}>
                  {selected === f.id && <Check size={12} className="text-white" />}
                </div>
              </div>
              <p className="mt-2 text-xs text-[#6B7280]">{f.desc}</p>
              <div className="mt-3 flex items-center gap-4">
                <div><p className="text-[9px] text-[#6B7280]">Prix</p><p className="text-sm font-bold text-[#D4AF37]">{f.prix}</p></div>
                <div><p className="text-[9px] text-[#6B7280]">Franchise</p><p className="text-sm font-black text-[#111]">{f.franchise}</p></div>
              </div>
              <div className="mt-3 space-y-1">
                {f.avantages.map((a, i) => (
                  <p key={i} className="flex items-center gap-1.5 text-xs text-green-700"><Check size={10} className="shrink-0" /> {a}</p>
                ))}
                {f.exclusions.map((e, i) => (
                  <p key={i} className="flex items-center gap-1.5 text-xs text-red-400"><span className="shrink-0 text-[10px]">✕</span> {e}</p>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="px-4 mt-6">
        <button className="w-full rounded-xl bg-[#D4AF37] py-4 text-base font-extrabold text-white active:scale-[0.98] transition shadow-lg">
          Appliquer la franchise {FRANCHISES.find((f) => f.id === selected)?.label}
        </button>
      </div>
    </div>
  );
}
