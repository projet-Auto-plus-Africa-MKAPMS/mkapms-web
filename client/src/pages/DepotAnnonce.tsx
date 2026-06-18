import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, PlusCircle, Car, Bike, Truck, ChevronRight, Camera, Check, Upload, FileText } from "lucide-react";

const TYPES = [
  { id: "voiture", label: "Déposer une voiture", icon: Car, color: "bg-[#D4AF37]" },
  { id: "moto", label: "Déposer une moto", icon: Bike, color: "bg-red-600" },
  { id: "utilitaire", label: "Déposer un utilitaire", icon: Truck, color: "bg-orange-600" },
  { id: "camion", label: "Déposer un camion", icon: Truck, color: "bg-gray-700" },
  { id: "vtc", label: "Déposer un véhicule VTC", icon: Car, color: "bg-[#111]" },
];

export default function DepotAnnonce() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  if (!selectedType) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-[#111] px-4 pt-6 pb-5">
          <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><PlusCircle size={20} className="text-[#D4AF37]" /> Déposer une annonce</h1>
          <p className="mt-1 text-sm text-white/60">Vendez votre véhicule sur MKA.P-MS</p>
        </div>
        <div className="px-4 mt-6"><h2 className="text-base font-bold text-[#111]">Que souhaitez-vous vendre ?</h2>
          <div className="mt-4 space-y-2">
            {TYPES.map((t) => { const Icon = t.icon; return (
              <button key={t.id} onClick={() => { setSelectedType(t.id); setStep(0); }} className="w-full flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 active:scale-[0.99] transition">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.color}`}><Icon size={18} className="text-white" /></div>
                <span className="flex-1 text-sm font-bold text-[#111] text-left">{t.label}</span><ChevronRight size={16} className="text-[#6B7280]" />
              </button>
            ); })}
          </div>
        </div>
      </div>
    );
  }

  const ETAPES = ["Informations", "Photos", "Documents", "Vérification", "Publication"];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <button onClick={() => setSelectedType(null)} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Changer de type</button>
        <h1 className="text-xl font-black text-white">Déposer : {TYPES.find((t) => t.id === selectedType)?.label.replace("Déposer ", "")}</h1>
      </div>
      <div className="px-4 mt-4 flex gap-1">{ETAPES.map((e, i) => (<div key={i} className="flex-1"><div className={`h-1 rounded-full ${i <= step ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} /><p className={`text-[7px] mt-0.5 text-center ${i <= step ? "text-[#D4AF37] font-bold" : "text-[#9CA3AF]"}`}>{e}</p></div>))}</div>

      {step === 0 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Informations véhicule</h3>
          {[["Plaque immatriculation", "AB-123-CD"], ["VIN (optionnel)", "Numéro VIN"], ["Marque", "Ex: Peugeot"], ["Modèle", "Ex: 3008"], ["Année", "2022"], ["Kilométrage", "45 000"], ["Énergie", "Essence / Diesel / Hybride…"], ["Boîte", "Manuelle / Automatique"], ["Prix souhaité", "25 000 €"], ["Ville", "Paris"], ["Description", "Décrivez votre véhicule…"]].map(([l, p]) => (
            <div key={l}><label className="text-xs text-[#6B7280]">{l}</label>
              {l === "Description" ? <textarea placeholder={p} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm h-20" /> : <input type="text" placeholder={p} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />}
            </div>
          ))}
          <button onClick={() => setStep(1)} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Suivant — Photos</button>
        </div>
      )}
      {step === 1 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Photos (minimum 5)</h3>
          <div className="grid grid-cols-3 gap-2">
            {["Face avant", "Face arrière", "Côté gauche", "Côté droit", "Tableau de bord", "Compteur", "Coffre", "Sièges", "Moteur"].map((z) => (
              <button key={z} className="rounded-lg border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 py-5 flex flex-col items-center gap-1"><Camera size={14} className="text-[#D4AF37]" /><span className="text-[8px] font-semibold text-[#111]">{z}</span></button>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Suivant — Documents</button>
        </div>
      )}
      {step === 2 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Documents recommandés</h3>
          {["Carte grise", "Contrôle technique", "Factures entretien", "Historique véhicule"].map((d) => (
            <button key={d} className="w-full flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-3">
              <FileText size={14} className="text-[#D4AF37]" /><span className="flex-1 text-sm text-[#111]">{d}</span><Upload size={14} className="text-[#6B7280]" />
            </button>
          ))}
          <button onClick={() => setStep(3)} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Suivant — Vérification</button>
        </div>
      )}
      {step === 3 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3 text-center">
          <Check size={32} className="mx-auto text-green-600" />
          <h3 className="text-base font-bold text-[#111]">Vérification en cours</h3>
          <p className="text-xs text-[#6B7280]">Votre annonce est en cours de vérification. Statut :</p>
          <div className="space-y-1 text-left">
            {[["Brouillon", true], ["Envoyée", true], ["En vérification", true], ["Publiée", false], ["Refusée", false]].map(([s, done]) => (
              <div key={s as string} className="flex items-center gap-2 text-xs"><span className={`h-2 w-2 rounded-full ${done ? "bg-green-500" : "bg-[#E5E7EB]"}`} /><span className={done ? "text-[#111] font-semibold" : "text-[#9CA3AF]"}>{s as string}</span></div>
            ))}
          </div>
          <button onClick={() => setStep(4)} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Voir le résultat</button>
        </div>
      )}
      {step === 4 && (
        <div className="mx-4 mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-center space-y-2">
          <Check size={32} className="mx-auto text-green-600" />
          <h3 className="text-base font-bold text-green-800">Annonce publiée !</h3>
          <p className="text-xs text-green-700">Votre annonce est maintenant visible sur MKA.P-MS.</p>
          <Link to="/acheter" className="inline-block rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white mt-2">Voir mes annonces</Link>
        </div>
      )}
    </div>
  );
}
