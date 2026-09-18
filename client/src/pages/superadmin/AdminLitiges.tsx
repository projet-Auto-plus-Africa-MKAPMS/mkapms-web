import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Scale, ChevronDown, AlertCircle } from "lucide-react";
import { trpc } from "../../lib/trpc";

const STATUT_LABEL: Record<string, string> = {
  ouvert: "Ouvert",
  en_analyse: "En médiation",
  resolu: "Résolu",
  rembourse: "Remboursé",
  clos: "Clos",
};

/**
 * Litiges (/superadmin/admin-litiges).
 *
 * Données réelles : trpc.disputes.listAll / decide (server/routers/operations.ts,
 * table disputes) — le même moteur de litiges déjà utilisé côté client par
 * disputes.mine/open, jamais un second registre inventé pour le back-office.
 */
export default function AdminLitiges() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const litiges = trpc.disputes.listAll.useQuery();
  const decide = trpc.disputes.decide.useMutation({
    onSuccess: () => utils.disputes.listAll.invalidate(),
  });

  const liste = litiges.data ?? [];
  const counts = {
    ouverts: liste.filter((l) => l.status === "ouvert").length,
    mediation: liste.filter((l) => l.status === "en_analyse").length,
    resolus: liste.filter((l) => l.status === "resolu" || l.status === "rembourse" || l.status === "clos").length,
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Scale size={20} className="text-[#D4AF37]" /> Litiges</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Ouverts", v: counts.ouverts, c: "text-red-500" },
          { l: "Médiation", v: counts.mediation, c: "text-amber-500" },
          { l: "Résolus", v: counts.resolus, c: "text-green-500" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </div>
        ))}
      </div>

      {litiges.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((l) => {
          const isExp = expanded === l.id;
          return (
            <div key={l.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : l.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-red-50 grid place-items-center"><AlertCircle size={14} className="text-red-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{l.category}</p>
                  <p className="text-[10px] text-[#6B7280]">{l.openerEmail ?? `Utilisateur #${l.openedBy}`}{l.againstUserId ? ` vs #${l.againstUserId}` : ""} · {new Date(l.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <p className="text-[10px] text-[#6B7280] mb-2">{l.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {l.amountRefunded && <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Remboursé</span><p className="font-bold text-[#D4AF37]">{Number(l.amountRefunded).toLocaleString("fr-FR")} EUR</p></div>}
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Statut</span><p className="font-bold text-[#111]">{STATUT_LABEL[l.status] ?? l.status}</p></div>
                  </div>
                  {l.status !== "clos" && (
                    <div className="flex gap-2 mt-2">
                      {l.status !== "en_analyse" && (
                        <button onClick={() => decide.mutate({ id: l.id, status: "en_analyse" })} disabled={decide.isPending} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white disabled:opacity-50">Médiation</button>
                      )}
                      <button onClick={() => decide.mutate({ id: l.id, status: "resolu" })} disabled={decide.isPending} className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white disabled:opacity-50">Résoudre</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {!litiges.isLoading && liste.length === 0 && (
          <p className="text-sm text-[#6B7280] text-center py-8">Aucun litige pour le moment.</p>
        )}
      </div>
    </div>
  );
}
