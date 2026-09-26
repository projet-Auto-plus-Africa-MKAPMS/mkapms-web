/** Additive controls for the canonical provider-capability registry. */
import { useState } from "react";
import { trpc } from "../../../lib/trpc";
export function FonctionsControle() {
  const utils = trpc.useUtils();
  const etat = trpc.intelligences.fonctions.useQuery();
  const [motif, setMotif] = useState("");
  const [message, setMessage] = useState("");
  const regler = trpc.intelligences.reglerFonction.useMutation({
    onSuccess: async r => { setMessage(r.detail); await utils.intelligences.fonctions.invalidate(); },
    onError: e => setMessage(e.message),
  });
  return <section className="rounded-xl border border-black/10 p-4 space-y-3">
    <h2 className="text-base font-black">Capacités — activées / désactivées</h2>
    <p className="text-sm">Le registre conserve toutes les fonctions existantes. Leur exécution dépend aussi du fournisseur, des droits et du niveau d’autonomie. Ce statut ne remplace pas un test réel de chaque capacité. Les mémoires utilisateur, projet et entreprise restent dans leurs espaces actuels ; aucun partage avec SHOP n’est activé ici.</p>
    <label className="block text-sm">Motif de la décision<input value={motif} maxLength={600} onChange={e => setMotif(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
    {etat.isLoading && <p>Chargement…</p>}
    {etat.error && <p role="alert">État des fonctions indisponible.</p>}
    <div className="grid gap-3 md:grid-cols-2">{etat.data?.fonctions.map(f => <article key={f.code} className="rounded-lg border p-3 space-y-2">
      <h3 className="font-bold">{f.libelle}</h3><p className="text-xs">État déclaré : {f.etat}</p><p className="text-sm">{f.apport}</p><p className="text-xs">{f.motif}</p>
      <details><summary className="text-sm">Conditions et usage</summary><p className="text-xs">{f.exigence}</p><p className="text-xs">{f.precaution}</p><p className="text-xs">{f.autonomie}</p></details>
      <button type="button" role="switch" aria-checked={f.etat === "active"} aria-label={f.libelle} disabled={regler.isPending || (f.etat !== "active" && (!f.activable || motif.trim().length < 3))} onClick={() => regler.mutate({ fonction: f.code, active: f.etat !== "active", motif: motif || "Désactivation par le propriétaire depuis les paramètres IA." })} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">{f.etat === "active" ? "Désactiver" : "Activer"}</button>
    </article>)}</div><p role="status" className="text-sm">{message}</p>
  </section>;
}
