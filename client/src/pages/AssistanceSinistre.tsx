import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, AlertTriangle, Phone, MapPin, Camera, Car,
  Wrench, Shield, Clock, Check, ChevronRight, MessageSquare
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   ASSISTANCE & SINISTRE
   Bouton urgence → Panne / Accident / Dépannage / Véhicule immobilisé
   Suivi directement dans le compte.
   ══════════════════════════════════════════════════════════════════════════ */

const URGENCES = [
  { id: "panne", label: "Panne", desc: "Mon véhicule ne démarre pas ou s'est arrêté", icon: Wrench, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "accident", label: "Accident", desc: "J'ai eu un accident avec le véhicule", icon: AlertTriangle, color: "bg-red-50 text-red-700 border-red-200" },
  { id: "depannage", label: "Dépannage", desc: "J'ai besoin d'un dépanneur sur place", icon: Car, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "immobilise", label: "Véhicule immobilisé", desc: "Le véhicule est bloqué et inutilisable", icon: Shield, color: "bg-purple-50 text-purple-700 border-purple-200" },
];

const HISTORIQUE = [
  { id: 1, type: "Panne", vehicule: "Mercedes Classe E Break", date: "10/03/2025", statut: "resolu" as const, desc: "Batterie à plat — intervention sous 45 min" },
  { id: 2, type: "Dépannage", vehicule: "Peugeot 508 GT", date: "15/02/2025", statut: "resolu" as const, desc: "Crevaison autoroute — dépanneur en 30 min" },
];

export default function AssistanceSinistre() {
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-red-600 px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><AlertTriangle size={20} /> Assistance & Sinistre</h1>
        <p className="mt-1 text-sm text-white/80">Assistance 24h/24, 7j/7</p>
      </div>

      {/* Emergency call */}
      <div className="mx-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3 shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
          <Phone size={20} className="text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[#111]">Appel d'urgence</h3>
          <p className="text-xs text-[#6B7280]">09 70 70 50 50 — 24h/24</p>
        </div>
        <button className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white active:scale-[0.98]">Appeler</button>
      </div>

      {/* Type selection */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Quel est votre problème ?</h2>
        <div className="mt-3 space-y-2">
          {URGENCES.map((u) => {
            const Icon = u.icon;
            return (
              <button key={u.id} onClick={() => { setSelected(u.id); setStep(1); }} className={`w-full flex items-center gap-3 rounded-xl border-2 p-4 text-left transition ${selected === u.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : `${u.color}`}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm"><Icon size={18} /></div>
                <div className="flex-1"><span className="text-sm font-bold text-[#111]">{u.label}</span><p className="text-[10px] text-[#6B7280]">{u.desc}</p></div>
                <ChevronRight size={16} className="text-[#6B7280]" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Steps after selection */}
      {selected && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-4">
          <h3 className="text-sm font-bold text-[#111]">Détails de l'incident</h3>
          
          <div>
            <label className="text-xs text-[#6B7280]">Position GPS</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
              <MapPin size={14} className="text-red-500" />
              <span className="text-sm text-[#111]">Position actuelle détectée</span>
              <button className="ml-auto text-xs font-semibold text-[#D4AF37]">Modifier</button>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#6B7280]">Description</label>
            <textarea className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm resize-none h-16" placeholder="Décrivez la situation..." />
          </div>

          <div>
            <label className="text-xs text-[#6B7280]">Photos de l'incident</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((n) => (
                <button key={n} className="rounded-lg border-2 border-dashed border-[#D4D4D4] py-6 flex flex-col items-center gap-1">
                  <Camera size={16} className="text-[#6B7280]" />
                  <span className="text-[9px] text-[#9CA3AF]">Photo {n}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md">
            <AlertTriangle size={16} /> Envoyer la demande d'assistance
          </button>
          <p className="text-[10px] text-[#9CA3AF] text-center">Un conseiller vous contactera dans les 5 minutes</p>
        </div>
      )}

      {/* History */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Historique des incidents</h2>
        <div className="mt-3 space-y-2">
          {HISTORIQUE.map((h) => (
            <div key={h.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111]">{h.type} — {h.vehicule}</h3>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-green-600 bg-green-50"><Check size={10} /> Résolu</span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1">{h.desc}</p>
              <p className="text-[10px] text-[#9CA3AF] mt-1">{h.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
