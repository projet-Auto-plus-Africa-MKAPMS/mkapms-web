/**
 * MKA.P-MS Intelligence — module Historique (LOT IA02B).
 *
 * Journal réel des dix-neuf actions de direction (server/intelligences/actions.ts
 * ::journal, déjà utilisé par le Centre Intelligence direction) — pas un second
 * journal, la même table `in_actions` lue ici.
 */
import { History, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { trpc } from "../../../lib/trpc";

const STYLE_RESULTAT: Record<string, { icone: typeof CheckCircle2; classe: string }> = {
  execute: { icone: CheckCircle2, classe: "text-[#1a7f37]" },
  propose: { icone: Clock3, classe: "text-[#8B7500]" },
  refuse: { icone: XCircle, classe: "text-red-600" },
};

export function Historique() {
  const journal = trpc.intelligences.journalActions.useQuery({ limit: 80 });

  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-5 w-5 text-black/40" />
        <h2 className="text-base font-black text-[#111]">Historique des actions</h2>
      </div>

      {journal.isLoading && <p className="text-sm text-black/40">Chargement…</p>}
      {journal.error && (
        <p className="text-sm text-red-600">Impossible de charger l'historique : {journal.error.message}</p>
      )}
      {journal.data?.length === 0 && (
        <p className="text-sm text-black/40">Aucune action de direction enregistrée pour l'instant.</p>
      )}

      <ul className="divide-y divide-black/5">
        {journal.data?.map((a) => {
          const style = STYLE_RESULTAT[a.resultat] ?? STYLE_RESULTAT.refuse;
          const Icone = style.icone;
          return (
            <li key={a.id} className="flex items-start gap-3 py-3">
              <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${style.classe}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-bold text-[#111]">{a.commande}</span>
                  {a.argument && (
                    <span className="truncate text-xs text-black/40">{a.argument}</span>
                  )}
                  <span className="ml-auto shrink-0 text-[11px] text-black/30">
                    {new Date(a.createdAt).toLocaleString("fr-FR")}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-black/60">{a.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
