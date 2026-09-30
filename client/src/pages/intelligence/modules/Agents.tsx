import { Bot, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { trpc } from "../../../lib/trpc";

export function Agents() {
  const etat = trpc.intelligences.agentAutonome.useQuery(undefined, { refetchOnWindowFocus: false });
  const utils = trpc.useUtils();
  const regler = trpc.intelligences.reglerAgentAutonome.useMutation({
    onSuccess: () => void Promise.all([utils.intelligences.agentAutonome.invalidate(), utils.intelligences.autonomie.invalidate()]),
  });
  const actif = etat.data?.actif ?? false;
  return <section className="mx-auto max-w-4xl space-y-6 p-4">
    <div className="flex items-start gap-3"><Bot className="mt-1 h-7 w-7"/><div><h1 className="text-2xl font-semibold">Agent autonome</h1><p className="text-sm text-gray-600">Créateur : {etat.data?.createur ?? "MKA.P-MS"} · mandat privé de la plateforme principale.</p></div></div>
    <div className="rounded-2xl border p-5">
      <p className="mb-4 font-medium">État : <span className={actif ? "text-green-700" : "text-gray-600"}>{etat.isLoading ? "Vérification…" : actif ? "Activé" : "Désactivé"}</span></p>
      <div className="grid grid-cols-2 gap-3" role="group" aria-label="État de l’agent autonome">
        <button type="button" onClick={() => regler.mutate({ actif: true })} disabled={regler.isPending || etat.isLoading || actif} className="rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-35">Activer</button>
        <button type="button" onClick={() => regler.mutate({ actif: false })} disabled={regler.isPending || etat.isLoading || !actif} className="rounded-xl border px-4 py-3 font-semibold disabled:opacity-35">Désactiver</button>
      </div>
      {regler.isError && <p className="mt-3 text-sm text-red-700" role="alert">{regler.error.message}</p>}
      <p className="mt-4 text-sm text-gray-600">{etat.data?.mandat}</p>
    </div>
    <div><h2 className="mb-3 text-lg font-semibold">Capacités réellement raccordées</h2><div className="grid gap-3 md:grid-cols-2">{etat.data?.capacites.map((c) => {
      const disponible = c.etat === "disponible"; const Icon = disponible ? CheckCircle2 : Clock3;
      return <article key={c.code} className="rounded-xl border p-4"><div className="flex items-center gap-2"><Icon className={disponible ? "h-5 w-5 text-green-700" : "h-5 w-5 text-amber-700"}/><strong>{c.libelle}</strong></div><p className="mt-2 text-sm text-gray-600">{c.detail}</p></article>;
    })}</div></div>
    <div className="rounded-xl bg-gray-50 p-4"><h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5"/>Protections conservées</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">{etat.data?.protections.map((p) => <li key={p}>{p}</li>)}</ul></div>
  </section>;
}
