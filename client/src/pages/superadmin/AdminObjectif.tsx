import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Target } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   OBJECTIFS DE PILOTAGE
   Données réelles : trpc.objectifs.list/setCible (server/routers/objectifs.ts).
   "Actuel" est recalculé en direct depuis paiements/comptes/annonces/tickets ;
   la cible est une décision de la Direction, jamais devinée. Taux de rétention
   et NPS n'ont aujourd'hui aucune méthode de calcul réelle dans le dépôt —
   affichés "Non mesuré" plutôt qu'approximés.
   ══════════════════════════════════════════════════════════════════════════ */

export default function AdminObjectif() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const listQ = trpc.objectifs.list.useQuery();
  const setCible = trpc.objectifs.setCible.useMutation({ onSuccess: () => utils.objectifs.list.invalidate() });

  function pct(actuel: string | null, cible: string | null): number | null {
    if (actuel == null || cible == null) return null;
    const a = parseFloat(actuel.replace(/[^\d.-]/g, ""));
    const c = parseFloat(cible);
    if (!(c > 0) || Number.isNaN(a)) return null;
    return Math.min(100, Math.round((a / c) * 100));
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Target size={20} className="text-[#D4AF37]" /> Objectifs</h1>
      </div>
      {listQ.isLoading && <p className="px-4 mt-4 text-xs text-[#9CA3AF]">Chargement…</p>}
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {listQ.data?.map((o) => {
          const isExp = expanded === o.cle;
          const p = pct(o.actuel, o.cible);
          return (
            <div key={o.cle} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : o.cle)} className="w-full text-left p-3">
                <p className="text-[10px] text-[#6B7280]">{o.label}</p>
                <p className="text-sm font-black text-[#111]">{o.nonMesure ? "Non mesuré" : o.actuel ?? "0"}</p>
                {!o.nonMesure && (
                  <>
                    <div className="mt-1 h-1.5 rounded-full bg-[#E5E7EB]">
                      {p !== null && <div className={`h-full rounded-full ${p >= 80 ? "bg-green-500" : p >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${p}%` }} />}
                    </div>
                    <p className="text-[9px] text-[#6B7280] mt-0.5">{p !== null ? `${p}% de ${o.cible}` : o.cible ? `Cible : ${o.cible}` : "Aucune cible fixée"}</p>
                  </>
                )}
              </button>
              {isExp && !o.nonMesure && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <button
                    disabled={setCible.isPending}
                    onClick={() => {
                      const valeur = prompt(`Nouvelle cible pour "${o.label}" :`, o.cible ?? "");
                      if (valeur == null) return;
                      const n = Number(valeur);
                      if (!(n >= 0)) return;
                      setCible.mutate({ cle: o.cle, cible: n });
                    }}
                    className="w-full rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white disabled:opacity-50"
                  >
                    Modifier la cible
                  </button>
                </div>
              )}
              {isExp && o.nonMesure && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <p className="text-[9px] text-[#6B7280]">Aucune méthode de calcul réelle n'existe encore pour cet indicateur.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
