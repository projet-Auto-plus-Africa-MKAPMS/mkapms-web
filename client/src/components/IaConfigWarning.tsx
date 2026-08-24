/**
 * Bandeau d'alerte "IA non configurée" — présent partout où l'utilisateur
 * peut tenter d'envoyer une commande à l'IA. Sans clé API configurée, chaque
 * envoi échouait silencieusement avec un motif obscur. Ce composant remonte
 * la vraie cause et pointe vers l'action à effectuer.
 */
import { AlertTriangle, ExternalLink } from "lucide-react";
import { trpc } from "../lib/trpc";

export function IaConfigWarning({ compact = false }: { compact?: boolean }) {
  const status = trpc.intelligences.configStatus.useQuery(undefined, {
    refetchInterval: 60000,
    retry: 1,
  });
  const data = status.data;
  if (!data) return null;
  if (data.operational) return null;

  return (
    <div
      data-testid="ia-config-warning"
      className={`mb-4 rounded-2xl border border-rose-300 bg-rose-50 p-4 shadow-sm ${compact ? "text-xs" : ""}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle size={16} className="text-rose-700" />
        <h3 className="text-sm font-black text-rose-900">
          Assistant IA hors service — aucune clé API configurée
        </h3>
      </div>
      <p className="text-sm text-rose-800">{data.guidance}</p>
      <div className="mt-3 space-y-2">
        {data.providers.map((p) => (
          <div
            key={p.code}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2"
          >
            <span className="text-sm font-semibold text-slate-900">{p.label}</span>
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
              {p.envKey}
            </code>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${p.configured ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
            >
              {p.configured ? "actif" : "absent"}
            </span>
            {!p.configured && p.obtain.startsWith("http") && (
              <a
                href={p.obtain}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900"
              >
                Obtenir la clé <ExternalLink size={11} />
              </a>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-rose-700">
        Coller la clé dans les <strong>Variables Railway</strong> du service backend
        → Railway redéploie → l'IA remonte automatiquement.
      </p>
    </div>
  );
}
