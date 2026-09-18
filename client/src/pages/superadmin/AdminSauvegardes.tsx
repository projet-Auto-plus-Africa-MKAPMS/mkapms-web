import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Database, ChevronDown, Check, RotateCcw, Clock } from "lucide-react";
import { trpc } from "../../lib/trpc";

/**
 * Sauvegardes (/superadmin/admin-sauvegardes).
 *
 * Données réelles : trpc.backupOs.* (server/backup-os/index.ts) — moteur déjà
 * construit et jamais raccordé à un écran. Les sauvegardes physiques de la
 * base restent gérées par l'hébergeur (Railway) : ce moteur tient un
 * manifeste logique (comptages par table) et un flux de restauration soumis
 * à validation humaine, jamais exécuté automatiquement (garde-fou). Pas de
 * bouton "Télécharger" : aucun export de fichier n'existe réellement, ce
 * serait un nouveau bouton fantôme.
 */
export default function AdminSauvegardes() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const dashboardQ = trpc.backupOs.dashboard.useQuery();
  const snapshotsQ = trpc.backupOs.snapshots.useQuery();
  const requestsQ = trpc.backupOs.restoreRequests.useQuery();
  const createSnapshot = trpc.backupOs.createSnapshot.useMutation({
    onSuccess: () => { utils.backupOs.snapshots.invalidate(); utils.backupOs.dashboard.invalidate(); },
  });
  const requestRestore = trpc.backupOs.requestRestore.useMutation({
    onSuccess: () => utils.backupOs.restoreRequests.invalidate(),
  });
  const decideRestore = trpc.backupOs.decideRestore.useMutation({
    onSuccess: () => utils.backupOs.restoreRequests.invalidate(),
  });

  const snapshots = snapshotsQ.data ?? [];
  const pendingRequests = (requestsQ.data ?? []).filter((r) => r.status === "pending");
  const totalRows = dashboardQ.data?.businessMetrics?.snapshots as number | undefined;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Database size={20} className="text-[#D4AF37]" /> Sauvegardes</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-lg font-black text-green-500">{totalRows ?? snapshots.length}</p>
          <p className="text-[9px] text-[#6B7280]">Sauvegardes enregistrées</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-lg font-black text-[#D4AF37]">{pendingRequests.length}</p>
          <p className="text-[9px] text-[#6B7280]">Restaurations en attente</p>
        </div>
      </div>
      <div className="px-4 mt-3">
        <button
          onClick={() => createSnapshot.mutate({ note: "Sauvegarde manuelle" })}
          disabled={createSnapshot.isPending}
          className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {createSnapshot.isPending ? "Sauvegarde en cours…" : "Sauvegarde manuelle maintenant"}
        </button>
      </div>

      {pendingRequests.length > 0 && (
        <div className="px-4 mt-4 space-y-2">
          <h2 className="text-xs font-bold text-[#6B7280] uppercase">Demandes de restauration en attente</h2>
          {pendingRequests.map((r) => (
            <div key={r.id} className="rounded-xl bg-white border border-amber-200 p-3 flex items-center gap-3">
              <Clock size={14} className="text-amber-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#111]">Sauvegarde #{r.snapshotId}</p>
                <p className="text-[10px] text-[#6B7280]">{(r.scope as string[]).join(", ")}</p>
              </div>
              <button onClick={() => decideRestore.mutate({ requestId: r.id, approve: true })} disabled={decideRestore.isPending} className="rounded-lg bg-green-500 px-3 py-1.5 text-[9px] font-bold text-white disabled:opacity-50">Approuver</button>
              <button onClick={() => decideRestore.mutate({ requestId: r.id, approve: false })} disabled={decideRestore.isPending} className="rounded-lg bg-red-50 px-3 py-1.5 text-[9px] font-bold text-red-600 disabled:opacity-50">Rejeter</button>
            </div>
          ))}
        </div>
      )}

      {snapshotsQ.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {snapshots.map((s) => {
          const isExp = expanded === s.id;
          const dejaDemandee = (requestsQ.data ?? []).some((r) => r.snapshotId === s.id && r.status === "pending");
          return (
            <div key={s.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : s.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${s.status === "captured" ? "bg-green-50" : "bg-red-50"}`}>
                  <Check size={14} className={s.status === "captured" ? "text-green-500" : "text-red-500"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{new Date(s.createdAt).toLocaleString("fr-FR")}</p>
                  <p className="text-[10px] text-[#6B7280]">{s.totalRows.toLocaleString("fr-FR")} lignes · {s.scope.length} table(s){s.note ? ` · ${s.note}` : ""}</p>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-1 text-[9px] text-[#6B7280]">
                    {Object.entries(s.rowCounts as Record<string, number>).map(([table, n]) => (
                      <div key={table} className="flex justify-between rounded bg-[#F5F3EF] px-2 py-1"><span>{table}</span><span className="font-bold">{n}</span></div>
                    ))}
                  </div>
                  <button
                    onClick={() => requestRestore.mutate({ snapshotId: s.id })}
                    disabled={requestRestore.isPending || dejaDemandee}
                    className="w-full rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <RotateCcw size={10} /> {dejaDemandee ? "Restauration déjà demandée" : "Demander une restauration (validation PDG requise)"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {!snapshotsQ.isLoading && snapshots.length === 0 && (
          <p className="text-sm text-[#6B7280] text-center py-8">Aucune sauvegarde enregistrée.</p>
        )}
      </div>
    </div>
  );
}
