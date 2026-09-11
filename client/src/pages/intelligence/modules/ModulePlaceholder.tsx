import type { LucideIcon } from "lucide-react";

/**
 * Squelette commun à tous les modules non encore construits de MKA.P-MS
 * Intelligence. Un module réel remplace ce composant par le sien — aucun
 * module fonctionnel ne doit rester sur ce placeholder une fois développé.
 */
export function ModulePlaceholder({
  icone: Icone,
  titre,
  description,
}: {
  icone: LucideIcon;
  titre: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-black/10 bg-[#FAFAFA] p-8 text-center">
      <Icone className="h-8 w-8 text-black/30" />
      <h2 className="text-lg font-bold text-black/80">{titre}</h2>
      <p className="max-w-md text-sm text-black/50">{description}</p>
      <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-black/40">
        Module à venir
      </span>
    </div>
  );
}
