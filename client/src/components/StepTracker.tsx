import { Check } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   STEP TRACKER — suivi multi-étapes générique (aucun composant réutilisable
   n'existait pour ça sur la plateforme). Utilisé par le portail « Véhicule
   sur commande » : 10 étapes internes (employé) et 7 étapes simplifiées
   (client) sont deux affichages du même composant, jamais deux widgets
   différents. Jamais d'étape "en cours" fabriquée au-delà de l'étape réelle
   atteinte (`currentIndex`).
   ══════════════════════════════════════════════════════════════════════════ */

export interface StepTrackerStep {
  key: string;
  label: string;
}

export function StepTracker({ steps, currentIndex, failed }: { steps: StepTrackerStep[]; currentIndex: number; failed?: boolean }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const done = i < currentIndex || (i === currentIndex && !failed);
        const isCurrent = i === currentIndex;
        const last = i === steps.length - 1;
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  failed && isCurrent
                    ? "bg-red-600 text-white"
                    : done
                      ? "bg-[#D4AF37] text-white"
                      : "bg-[#E5E7EB] text-[#9CA3AF]"
                }`}
              >
                {done && !(failed && isCurrent) ? <Check size={14} /> : i + 1}
              </div>
              {!last && <div className={`w-0.5 flex-1 ${i < currentIndex ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} style={{ minHeight: 22 }} />}
            </div>
            <div className={`pb-5 text-sm ${isCurrent ? "font-bold text-[#111]" : done ? "text-[#374151]" : "text-[#9CA3AF]"}`}>{step.label}</div>
          </div>
        );
      })}
    </div>
  );
}
