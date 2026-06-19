import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Building2, User, Mail, Phone, MapPin, Calendar, Upload, FileText, Check, ChevronRight, Shield, Camera } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   4-6. PASSAGE COMPTE PRO VENTE + IDENTITÉ DIRIGEANT + INFOS SOCIÉTÉ
   Choix activité, identité, société, documents, statuts.
   ══════════════════════════════════════════════════════════════════════════ */

const ACTIVITES = [
  "Vente VO", "Garage vendeur", "Marchand automobile", "Concessionnaire",
  "Vendeur moto", "Vendeur utilitaire", "Vendeur camion",
];

const DOCS_DIRIGEANT = ["Pièce d'identité", "Justificatif de domicile", "Selfie vérification"];
const DOCS_SOCIETE = ["KBIS", "Attestation INSEE", "Assurance professionnelle", "RIB société", "Justificatif local"];

const STATUTS = [
  { label: "Brouillon", done: true },
  { label: "Documents manquants", done: true },
  { label: "En analyse", done: true },
  { label: "Validé", done: false },
  { label: "Refusé", done: false },
];

export default function InscriptionProVente() {
  const [step, setStep] = useState(0);
  const [selectedActivite, setSelectedActivite] = useState<string | null>(null);
  const ETAPES = ["Activité", "Dirigeant", "Société", "Documents", "Validation"];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/tableau-de-bord" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon espace</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Building2 size={20} /> Devenir professionnel</h1>
        <p className="mt-1 text-sm text-white/80">Ouvrir un compte pro vente MKA.P-MS</p>
      </div>
      <div className="px-4 mt-4 flex gap-1">{ETAPES.map((e, i) => (<div key={i} className="flex-1"><div className={`h-1 rounded-full ${i <= step ? "bg-blue-600" : "bg-[#E5E7EB]"}`} /><p className={`text-[7px] mt-0.5 text-center ${i <= step ? "text-blue-700 font-bold" : "text-red-500"}`}>{e}</p></div>))}</div>

      {step === 0 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
          <h3 className="text-sm font-bold text-[#111]">Choisissez votre activité</h3>
          {ACTIVITES.map((a) => (
            <button key={a} onClick={() => setSelectedActivite(a)} className={`w-full flex items-center gap-3 rounded-lg border-2 p-3 text-left transition ${selectedActivite === a ? "border-blue-600 bg-blue-50" : "border-[#E5E7EB]"}`}>
              <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${selectedActivite === a ? "border-blue-600 bg-blue-600" : "border-[#D4D4D4]"}`}>{selectedActivite === a && <Check size={10} className="text-white" />}</span>
              <span className="text-sm font-semibold text-[#111]">{a}</span>
            </button>
          ))}
          <button onClick={() => setStep(1)} className={`mt-2 w-full rounded-xl py-3 text-sm font-bold text-white transition ${selectedActivite ? "bg-blue-800 active:scale-[0.98]" : "bg-[#D4D4D4]"}`} disabled={!selectedActivite}>Suivant</button>
        </div>
      )}

      {step === 1 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Identité du dirigeant</h3>
          {[["Prénom *", "Moussa"], ["Nom *", "Konaté"], ["Date de naissance *", "01/01/1990"], ["Téléphone *", "+33 6 12 34 56 78"], ["Email *", "moussa@email.com"], ["Adresse *", "12 Rue de la Paix, Paris"]].map(([l, p]) => (
            <div key={l}><label className="text-xs text-[#6B7280]">{l}</label><input type="text" placeholder={p} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
          ))}
          <h4 className="text-xs font-bold text-[#111] pt-2">Documents dirigeant</h4>
          {DOCS_DIRIGEANT.map((d) => (
            <button key={d} className="w-full flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-3"><Upload size={14} className="text-blue-600" /><span className="flex-1 text-sm text-[#111]">{d}</span><span className="text-[9px] text-red-500">Télécharger</span></button>
          ))}
          <button onClick={() => setStep(2)} className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98]">Suivant</button>
        </div>
      )}

      {step === 2 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Informations société</h3>
          {[["Nom société *", "Auto Premium"], ["Raison sociale *", "SARL Auto Premium"], ["SIREN *", "123 456 789"], ["SIRET *", "123 456 789 00012"], ["N° TVA", "FR12 123456789"], ["Adresse siège *", "12 Rue de la Paix, Paris"], ["Adresse établissement", "Même ou autre"], ["Email société *", "contact@autopremium.fr"], ["Téléphone société *", "+33 1 23 45 67 89"], ["Site internet", "www.autopremium.fr"]].map(([l, p]) => (
            <div key={l}><label className="text-xs text-[#6B7280]">{l}</label><input type="text" placeholder={p} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
          ))}
          <button onClick={() => setStep(3)} className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98]">Suivant</button>
        </div>
      )}

      {step === 3 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Documents société</h3>
          {DOCS_SOCIETE.map((d) => (
            <button key={d} className="w-full flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-3"><FileText size={14} className="text-blue-600" /><span className="flex-1 text-sm text-[#111]">{d}</span><Upload size={14} className="text-red-500" /></button>
          ))}
          <button onClick={() => setStep(4)} className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98]">Soumettre</button>
        </div>
      )}

      {step === 4 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3 text-center">
          <Shield size={32} className="mx-auto text-blue-600" />
          <h3 className="text-base font-bold text-[#111]">Dossier soumis</h3>
          <p className="text-xs text-[#6B7280]">Votre dossier est en cours de vérification.</p>
          <div className="space-y-1.5 text-left">
            {STATUTS.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-xs"><span className={`h-2.5 w-2.5 rounded-full ${s.done ? "bg-blue-600" : "bg-[#E5E7EB]"}`} /><span className={s.done ? "text-[#111] font-semibold" : "text-red-500"}>{s.label}</span></div>
            ))}
          </div>
          <Link to="/tableau-de-bord" className="inline-block w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white mt-2 active:scale-[0.98]">Retour à mon espace</Link>
        </div>
      )}
    </div>
  );
}
