/**
 * MKA.P-MS Intelligence — module Usage & coûts (LOT IA02B), complété du
 * Provider Registry en LOT IA02D (Direction → Intelligence → Dependencies,
 * point 14).
 *
 * Vue direction réelle (server/intelligences/service.ts::etat,
 * server/governance/dependencies.ts) : accès, fournisseurs, usage, plafonds,
 * et maintenant readiness de déconnexion par dépendance de modèle externe. Détail
 * fournisseur volontairement présent ici — c'est la vue direction, pas une
 * surface publique — pour que la direction puisse suivre coût, état et
 * remplacement de chaque fournisseur avant l'échéance d'indépendance du 27
 * mars 2027.
 */
import { Gauge, ShieldAlert } from "lucide-react";
import { trpc } from "../../../lib/trpc";

const LABEL_MIGRATION: Record<string, string> = {
  ON_TRACK: "Dans les temps",
  AT_RISK: "À risque",
  BLOCKED: "Bloqué",
  READY_TO_DISCONNECT: "Prêt à déconnecter",
  DISCONNECTED: "Déconnecté",
};

const CLASSE_MIGRATION: Record<string, string> = {
  ON_TRACK: "bg-[#E9F7EF] text-[#1a7f37]",
  AT_RISK: "bg-[#FFFBEA] text-[#8B7500]",
  BLOCKED: "bg-red-50 text-red-600",
  READY_TO_DISCONNECT: "bg-[#E9F7EF] text-[#1a7f37]",
  DISCONNECTED: "bg-black/5 text-black/40",
};

function DependancesIndependance() {
  const registre = trpc.intelligences.dependancesRegistre.useQuery();
  const alertes = trpc.intelligences.dependancesAlertes.useQuery();

  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-black/40" />
        <h2 className="text-base font-black text-[#111]">Indépendance API — échéance 27 mars 2027</h2>
      </div>

      {registre.isLoading && <p className="text-sm text-black/40">Chargement…</p>}
      <div className="space-y-2">
        {registre.data?.map((d) => (
          <div key={d.providerId} className="rounded-lg border border-black/5 bg-[#FAFAFA] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#111]">{d.internalName}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${CLASSE_MIGRATION[d.statutMigration] ?? "bg-black/5 text-black/50"}`}>
                {LABEL_MIGRATION[d.statutMigration] ?? d.statutMigration}
              </span>
            </div>
            <p className="mt-1 text-xs text-black/50">
              Readiness de déconnexion : <span className="font-bold">{d.readiness.pourcentage} %</span>
              {d.targetDisconnectDate && ` — échéance ${new Date(d.targetDisconnectDate).toLocaleDateString("fr-FR")}`}
            </p>
            <p className="mt-0.5 text-[11px] text-black/40">
              Capacités utilisées : {d.capabilitiesUsed.join(", ") || "aucune"} · repli : {d.fallback}
            </p>
            {d.readiness.bloquants.length > 0 && (
              <ul className="mt-1.5 list-inside list-disc text-[11px] text-black/50">
                {d.readiness.bloquants.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {alertes.data && alertes.data.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="mb-1 text-xs font-bold text-amber-900">Alertes migration</p>
          <ul className="list-inside list-disc text-[11px] text-amber-800">
            {alertes.data.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function UsageCouts() {
  const etat = trpc.intelligences.etat.useQuery();

  if (etat.isLoading) return <p className="text-sm text-black/40">Chargement…</p>;
  if (!etat.data) return <p className="text-sm text-red-600">État indisponible.</p>;

  const { acces, fournisseurs, usage, plafonds } = etat.data;

  return (
    <div className="space-y-4">
      <DependancesIndependance />

      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Gauge className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Accès</h2>
        </div>
        <p className="text-sm text-[#111]">
          Statut : <span className="font-bold">{acces.status}</span> — {acces.message}
        </p>
        {acces.fournisseur && (
          <p className="mt-1 text-xs text-black/50">
            Fournisseur actif : {acces.fournisseur} / {acces.modele}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-black/10 p-4">
        <h2 className="mb-3 text-base font-black text-[#111]">Fournisseurs</h2>
        <div className="space-y-2">
          {fournisseurs.map((f) => (
            <div key={f.code} className="rounded-lg border border-black/5 bg-[#FAFAFA] p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-[#111]">{f.label}</span>
                <span className="text-xs font-bold text-black/50">{f.status}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-black/40">
                {f.capability}
                {f.missingEnv.length > 0 && ` — variable(s) manquante(s) : ${f.missingEnv.join(", ")}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-black/10 p-4">
        <h2 className="mb-3 text-base font-black text-[#111]">Plafonds</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {plafonds.map((p) => (
            <div key={p.cote} className="rounded-lg border border-black/5 bg-[#FAFAFA] p-3 text-sm">
              <span className="font-bold text-[#111]">{p.cote}</span> : {p.consommes} / {p.plafond}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-black/10 p-4">
        <h2 className="mb-3 text-base font-black text-[#111]">Usage (30 derniers jours)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-black/40">
                <th className="pb-2 pr-3">Jour</th>
                <th className="pb-2 pr-3">Côté</th>
                <th className="pb-2 pr-3">Appels</th>
                <th className="pb-2 pr-3">Échecs</th>
                <th className="pb-2">Jetons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {usage.map((u, i) => (
                <tr key={i}>
                  <td className="py-1.5 pr-3">{u.jour}</td>
                  <td className="py-1.5 pr-3">{u.cote}</td>
                  <td className="py-1.5 pr-3">{u.appels}</td>
                  <td className="py-1.5 pr-3">{u.echecs}</td>
                  <td className="py-1.5">{u.jetons}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {usage.length === 0 && <p className="py-2 text-sm text-black/40">Aucun usage mesuré.</p>}
        </div>
      </div>
    </div>
  );
}
