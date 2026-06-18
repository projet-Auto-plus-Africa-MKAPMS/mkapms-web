import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ClipboardCheck, Camera, Check, Square,
  Fuel, Car, CircleDot, Gauge, Shield, Clock, Eye
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   INSPECTION NUMÉRIQUE
   Checklist avant départ + retour. Photos obligatoires par zone.
   ══════════════════════════════════════════════════════════════════════════ */

const CHECKLIST = [
  { id: "pneus", label: "Pneus", desc: "État des 4 pneus, pression, usure", icon: CircleDot },
  { id: "carrosserie", label: "Carrosserie", desc: "Rayures, bosses, impacts", icon: Car },
  { id: "interieur", label: "Intérieur", desc: "Sièges, tableau de bord, propreté", icon: Shield },
  { id: "carburant", label: "Niveau carburant", desc: "Jauge carburant ou charge batterie", icon: Fuel },
  { id: "km", label: "Kilométrage", desc: "Relevé compteur km", icon: Gauge },
];

const INSPECTIONS = [
  { id: 1, vehicule: "Mercedes Classe E Break", ref: "LOC-2025-0042", type: "depart" as const, date: "15/03/2025 09:15", complete: true, checks: 5, photos: 10 },
  { id: 2, vehicule: "Mercedes Classe E Break", ref: "LOC-2025-0042", type: "retour" as const, date: "-", complete: false, checks: 0, photos: 0 },
  { id: 3, vehicule: "Peugeot 3008 GT", ref: "LOC-2025-0038", type: "depart" as const, date: "01/03/2025 10:00", complete: true, checks: 5, photos: 10 },
  { id: 4, vehicule: "Peugeot 3008 GT", ref: "LOC-2025-0038", type: "retour" as const, date: "08/03/2025 10:30", complete: true, checks: 5, photos: 10 },
];

export default function InspectionNumerique() {
  const [activeInsp, setActiveInsp] = useState<number | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setChecked((p) => ({ ...p, [id]: !p[id] }));
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><ClipboardCheck size={20} className="text-[#D4AF37]" /> Inspection numérique</h1>
        <p className="mt-1 text-sm text-white/60">Checklist obligatoire avant départ et au retour</p>
      </div>

      {/* Inspections list */}
      <div className="px-4 mt-4 space-y-3">
        {INSPECTIONS.map((insp) => (
          <button key={insp.id} onClick={() => setActiveInsp(activeInsp === insp.id ? null : insp.id)} className={`w-full rounded-xl bg-white border overflow-hidden text-left transition ${insp.complete ? "border-[#E5E7EB]" : "border-amber-300"}`}>
            <div className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${insp.complete ? "bg-green-50" : "bg-amber-50"}`}>
                {insp.complete ? <Check size={16} className="text-green-600" /> : <Clock size={16} className="text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#111]">{insp.vehicule}</h3>
                <p className="text-[10px] text-[#6B7280]">{insp.ref} · {insp.type === "depart" ? "Départ" : "Retour"} · {insp.date}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#111]">{insp.checks}/5</p>
                <p className="text-[9px] text-[#6B7280]">{insp.photos} photos</p>
              </div>
            </div>

            {activeInsp === insp.id && !insp.complete && (
              <div className="px-4 pb-4 border-t border-[#F3F4F6]" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs font-bold text-[#111] mt-3 mb-2">Checklist d'inspection</p>
                <div className="space-y-2">
                  {CHECKLIST.map((c) => {
                    const Icon = c.icon;
                    const isChecked = checked[c.id] || false;
                    return (
                      <div key={c.id} className="flex items-center gap-3">
                        <button onClick={() => toggle(c.id)} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition ${isChecked ? "bg-[#D4AF37] border-[#D4AF37]" : "border-[#D4D4D4]"}`}>
                          {isChecked && <Check size={14} className="text-white" />}
                        </button>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#F5F3EF]"><Icon size={14} className="text-[#6B7280]" /></div>
                        <div className="flex-1"><p className="text-sm text-[#111]">{c.label}</p><p className="text-[9px] text-[#6B7280]">{c.desc}</p></div>
                        <button className="rounded bg-[#F5F3EF] p-1.5"><Camera size={12} className="text-[#D4AF37]" /></button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 rounded-lg bg-[#F5F3EF] p-2 text-center text-xs text-[#6B7280]">
                  {checkedCount}/{CHECKLIST.length} vérifications · Photos requises pour chaque point
                </div>
                <button className={`mt-3 w-full rounded-xl py-3 text-sm font-bold text-white transition ${checkedCount === CHECKLIST.length ? "bg-[#D4AF37] active:scale-[0.98]" : "bg-[#D4D4D4]"}`} disabled={checkedCount < CHECKLIST.length}>
                  Valider l'inspection
                </button>
              </div>
            )}

            {activeInsp === insp.id && insp.complete && (
              <div className="px-4 pb-4 border-t border-[#F3F4F6]" onClick={(e) => e.stopPropagation()}>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 rounded-lg bg-[#F5F3EF] py-2 text-xs font-semibold text-[#6B7280] flex items-center justify-center gap-1"><Eye size={12} /> Voir les photos</button>
                  <button className="flex-1 rounded-lg bg-[#F5F3EF] py-2 text-xs font-semibold text-[#6B7280] flex items-center justify-center gap-1"><ClipboardCheck size={12} /> Rapport</button>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
