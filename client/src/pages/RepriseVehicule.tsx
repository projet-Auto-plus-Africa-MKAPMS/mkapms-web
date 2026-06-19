import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ArrowRightLeft, Camera, Upload, Check, Car, Euro } from "lucide-react";
const ETAPES = ["Informations", "Photos", "Estimation", "Proposition"];
export default function RepriseVehicule() {
  const [step, setStep] = useState(0);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><ArrowRightLeft size={20} className="text-[#D4AF37]" /> Reprise véhicule</h1>
        <p className="mt-1 text-sm text-white/60">Déposez votre véhicule, recevez une proposition</p>
      </div>
      <div className="px-4 mt-4 flex gap-1">{ETAPES.map((e, i) => (<div key={i} className="flex-1"><div className={`h-1 rounded-full ${i <= step ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} /><p className={`text-[8px] mt-0.5 text-center ${i <= step ? "text-[#D4AF37] font-bold" : "text-red-500"}`}>{e}</p></div>))}</div>
      {step === 0 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Informations véhicule</h3>
          {[["Marque", "Ex: Peugeot"], ["Modèle", "Ex: 3008"], ["Année", "Ex: 2022"], ["Kilométrage", "Ex: 45 000"], ["Carburant", "Essence, Diesel, Hybride…"], ["Immatriculation", "AB-123-CD"]].map(([l, p]) => (
            <div key={l}><label className="text-xs text-[#6B7280]">{l}</label><input type="text" placeholder={p} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
          ))}
          <button onClick={() => setStep(1)} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Suivant</button>
        </div>
      )}
      {step === 1 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Photos du véhicule</h3>
          <div className="grid grid-cols-2 gap-2">
            {["Face avant", "Face arrière", "Côté gauche", "Côté droit", "Tableau de bord", "Compteur km"].map((z) => (
              <button key={z} className="rounded-lg border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 py-6 flex flex-col items-center gap-1"><Camera size={16} className="text-[#D4AF37]" /><span className="text-[9px] font-semibold text-[#111]">{z}</span></button>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Suivant</button>
        </div>
      )}
      {step === 2 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 text-center space-y-3">
          <Car size={32} className="mx-auto text-[#D4AF37]" />
          <h3 className="text-base font-bold text-[#111]">Estimation en cours…</h3>
          <p className="text-xs text-[#6B7280]">Nous analysons votre véhicule. Vous recevrez une proposition sous 24h.</p>
          <button onClick={() => setStep(3)} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Voir la proposition</button>
        </div>
      )}
      {step === 3 && (
        <div className="mx-4 mt-4 space-y-3">
          <div className="rounded-xl bg-white border border-[#D4AF37]/30 p-4 text-center">
            <p className="text-xs text-[#6B7280]">Notre proposition de reprise</p>
            <p className="text-3xl font-black text-[#D4AF37] mt-1">18 500 €</p>
            <p className="text-[10px] text-[#6B7280] mt-1">Peugeot 3008 GT · 2022 · 45 000 km</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Accepter</button>
            <button className="rounded-xl border-2 border-[#E5E7EB] py-3 text-sm font-bold text-[#6B7280]">Négocier</button>
          </div>
        </div>
      )}
    </div>
  );
}
