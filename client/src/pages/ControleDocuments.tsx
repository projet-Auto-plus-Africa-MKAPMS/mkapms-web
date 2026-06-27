import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ShieldCheck, Check, X, Clock, AlertCircle,
  FileCheck, User, Calendar, CreditCard, Car
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   CONTRÔLE DES DOCUMENTS AVANT RÉSERVATION
   Vérification automatique avant paiement : permis, ID, âge, ancienneté permis.
   Évite les refus après paiement.
   ══════════════════════════════════════════════════════════════════════════ */

const VERIFICATIONS = [
  { id: "permis", label: "Permis de conduire", desc: "Permis valide et non suspendu", icon: Car, statut: "valide" as const },
  { id: "identite", label: "Pièce d'identité", desc: "CNI ou passeport en cours de validité", icon: User, statut: "valide" as const },
  { id: "age", label: "Âge minimum", desc: "21 ans minimum (25 ans pour premium)", icon: Calendar, statut: "valide" as const },
  { id: "anciennete", label: "Ancienneté permis", desc: "2 ans minimum de permis", icon: FileCheck, statut: "valide" as const },
  { id: "paiement", label: "Moyen de paiement", desc: "Carte bancaire valide enregistrée", icon: CreditCard, statut: "en_attente" as const },
];

const STATUT_CONFIG = {
  valide: { label: "Validé", color: "text-green-600", bg: "bg-green-50", icon: Check },
  en_attente: { label: "En attente", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  refuse: { label: "Refusé", color: "text-red-600", bg: "bg-red-50", icon: X },
};

export default function ControleDocuments() {
  const validCount = VERIFICATIONS.filter((v) => v.statut === "valide").length;
  const allValid = validCount === VERIFICATIONS.length;
  const progress = Math.round((validCount / VERIFICATIONS.length) * 100);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><ShieldCheck size={20} className="text-[#D4AF37]" /> Contrôle pré-réservation</h1>
        <p className="mt-1 text-sm text-white/60">Vérification automatique avant paiement</p>
      </div>

      {/* Progress */}
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-[#111]">Progression</span>
          <span className="text-sm font-bold text-[#D4AF37]">{validCount}/{VERIFICATIONS.length}</span>
        </div>
        <div className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
          <div className="h-full rounded-full bg-[#D4AF37] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-[#6B7280]">
          {allValid ? "Tous les contrôles sont validés. Vous pouvez réserver." : "Complétez les vérifications pour pouvoir réserver."}
        </p>
      </div>

      {/* Info */}
      <div className="mx-4 mt-3 rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
        <AlertCircle size={14} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800">Ce contrôle automatique vérifie vos documents <span className="font-bold">avant le paiement</span> pour éviter tout refus après. Aucune mauvaise surprise.</p>
      </div>

      {/* Checklist */}
      <div className="px-4 mt-4 space-y-2">
        {VERIFICATIONS.map((v) => {
          const s = STATUT_CONFIG[v.statut];
          const SIcon = s.icon;
          const VIcon = v.icon;
          return (
            <div key={v.id} className={`rounded-xl bg-white border p-4 ${v.statut === "valide" ? "border-green-200" : v.statut === "en_attente" ? "border-amber-200" : "border-red-200"}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${v.statut === "valide" ? "bg-green-50" : "bg-[#F5F3EF]"}`}>
                  <VIcon size={16} className={v.statut === "valide" ? "text-green-600" : "text-[#6B7280]"} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#111]">{v.label}</h3>
                  <p className="text-[10px] text-[#6B7280]">{v.desc}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.color} ${s.bg}`}>
                  <SIcon size={10} /> {s.label}
                </span>
              </div>
              {v.statut === "en_attente" && (
                <button className="mt-3 w-full rounded-lg bg-[#D4AF37]/10 py-2 text-xs font-bold text-[#D4AF37]">Ajouter</button>
              )}
              {v.statut === "refuse" && (
                <button className="mt-3 w-full rounded-lg bg-red-50 py-2 text-xs font-bold text-red-600">Corriger</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Action */}
      <div className="px-4 mt-6">
        <button className={`w-full rounded-xl py-4 text-base font-extrabold text-white transition ${allValid ? "bg-[#D4AF37] active:scale-[0.98] shadow-lg" : "bg-[#D4D4D4]"}`} disabled={!allValid}>
          {allValid ? "Continuer vers la réservation" : "Vérifications incomplètes"}
        </button>
      </div>
    </div>
  );
}
