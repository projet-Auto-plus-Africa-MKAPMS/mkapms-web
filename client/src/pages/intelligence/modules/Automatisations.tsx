/** Controls the existing autonomy engine; no second executor or shared SHOP state. */
import { useState } from "react";
import { Workflow } from "lucide-react";
import { trpc } from "../../../lib/trpc";

export function Automatisations() {
  const utils = trpc.useUtils();
  const autonomie = trpc.intelligences.autonomie.useQuery();
  const [motif, setMotif] = useState("");
  const [message, setMessage] = useState("");
  const [choix, setChoix] = useState<Record<string, number>>({});
  const [objectif, setObjectif] = useState("");
  const [rapport, setRapport] = useState("");
  const regler = trpc.intelligences.reglerAutonomie.useMutation({
    onSuccess: async (r) => { setMessage(r.detail); await utils.intelligences.autonomie.invalidate(); },
    onError: (e) => setMessage(e.message),
  });
  const mission = trpc.intelligences.lancerMission.useMutation({
    onSuccess: (r) => setRapport(r.rapport || r.resume),
    onError: (e) => setMessage(e.message),
  });
  if (autonomie.isLoading) return <p>Chargement des réglages d’autonomie…</p>;
  if (!autonomie.data) return <p role="alert">Réglages indisponibles. Aucun changement effectué.</p>;
  return <div className="space-y-4">
    <section className="rounded-xl border border-black/10 p-4 space-y-3">
      <h2 className="flex items-center gap-2 font-black"><Workflow className="h-5 w-5" />Automatisations et autonomie</h2>
      <p className="text-sm">Ces réglages utilisent les permissions et le moteur d’autonomie existants. Le plafond général limite chaque domaine. Une fonction absente ou un fournisseur indisponible reste bloquant.</p>
      <label className="block text-sm">Motif de la modification
        <textarea value={motif} onChange={e => setMotif(e.target.value)} maxLength={2000} rows={3} className="mt-1 w-full rounded-lg border p-2" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">{autonomie.data.domaines.map(d => <article key={d.domaine} className="rounded-lg border p-3 space-y-2">
        <h3 className="font-bold">{d.libelle}</h3>
        <p className="text-xs">Niveau enregistré : {d.niveau} · effectif : {d.effectif}</p>
        <p className="text-sm">{d.portee}</p>
        <label className="block text-sm">Niveau souhaité
          <select value={choix[d.domaine] ?? d.niveau} onChange={e => setChoix(x => ({ ...x, [d.domaine]: Number(e.target.value) }))} className="mt-1 w-full rounded border p-2">
            {autonomie.data!.niveaux.map(n => <option key={n.niveau} value={n.niveau}>{n.niveau} — {n.libelle}</option>)}
          </select>
        </label>
        <button type="button" disabled={regler.isPending || motif.trim().length < 10} onClick={() => regler.mutate({ domaine: d.domaine, niveau: choix[d.domaine] ?? d.niveau, motif })} className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-40">Appliquer ce niveau</button>
        <button type="button" disabled={regler.isPending} onClick={() => regler.mutate({ domaine: d.domaine, niveau: 1, motif: "Désactivation de l’exécution autonome depuis le cockpit propriétaire." })} className="ml-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Désactiver l’exécution</button>
      </article>)}</div>
      <p role="status" className="text-sm whitespace-pre-wrap">{message}</p>
    </section>
    <section className="rounded-xl border border-black/10 p-4 space-y-3">
      <h2 className="font-black">Confier une mission au moteur existant</h2>
      <p className="text-sm">La mission suit les étapes réellement implémentées et s’arrête sur les permissions, capacités ou dépendances manquantes. Le rapport indique le travail exécuté. Ce lancement n’installe pas une planification récurrente.</p>
      <form onSubmit={e => { e.preventDefault(); mission.mutate({ objectif }); }} className="space-y-3">
        <label className="block text-sm">Objectif sans secrets<textarea required minLength={5} maxLength={4000} value={objectif} onChange={e => setObjectif(e.target.value)} className="mt-1 w-full rounded-lg border p-2" rows={4} /></label>
        <button disabled={mission.isPending} className="rounded-lg bg-black px-3 py-2 text-white disabled:opacity-40">{mission.isPending ? "Mission en cours…" : "Lancer la mission autorisée"}</button>
      </form>
      {rapport && <pre className="whitespace-pre-wrap break-words rounded-lg bg-black/5 p-3 text-sm">{rapport}</pre>}
    </section>
    <section className="rounded-xl border border-black/10 p-4 space-y-2"><h2 className="font-black">Historique des réglages</h2>{autonomie.data.journal.map(j => <p key={j.id} className="text-sm">{j.domaine} : {j.avant} → {j.apres} · {j.motif}</p>)}</section>
  </div>;
}
