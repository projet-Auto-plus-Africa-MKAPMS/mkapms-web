/** Additive controls for the canonical provider-capability registry. */
import { useState } from "react";
import { trpc } from "../../../lib/trpc";
import { SondeCapacites } from "./SondeCapacites";
import { MemoireSemantique } from "./MemoireSemantique";

export function FonctionsControle() {
  const utils = trpc.useUtils();
  const etat = trpc.intelligences.fonctions.useQuery();
  /**
   * Retour du PDG : un seul champ « Motif » partagé pour toutes les cartes
   * bloquait silencieusement l'activation dès qu'une carte était éteinte
   * sans y taper de motif — le champ restait vide et rendait TOUS les
   * boutons « Activer » inactifs, sans indication visible pourquoi. Un motif
   * par carte (même schéma que l'onglet Fonctionnalités du Centre
   * Intelligence direction, CentreIntelligences.tsx) : chaque bouton dépend
   * uniquement de son propre champ.
   */
  const [motifs, setMotifs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [retours, setRetours] = useState<Record<string, { ok: boolean; detail: string }>>({});
  const regler = trpc.intelligences.reglerFonction.useMutation({
    onSuccess: async (r, variables) => {
      setMessage(r.detail);
      setRetours((m) => ({ ...m, [variables.fonction]: r }));
      setMotifs((m) => ({ ...m, [variables.fonction]: "" }));
      await utils.intelligences.fonctions.invalidate();
    },
    onError: (e) => setMessage(e.message),
  });
  const reglerTout = trpc.intelligences.reglerToutesFonctions.useMutation({
    onSuccess: async (r, variables) => {
      const faites = r.resultats.filter((x) => x.ok).length;
      setMessage(
        `${faites}/${r.resultats.length} capacité${r.resultats.length > 1 ? "s" : ""} ${
          variables.active ? "activée" : "désactivée"
        }${faites > 1 ? "s" : ""}.`,
      );
      setRetours(Object.fromEntries(r.resultats.map((x) => [x.fonction, { ok: x.ok, detail: x.detail }])));
      await utils.intelligences.fonctions.invalidate();
    },
    onError: (e) => setMessage(e.message),
  });
  const occupe = regler.isPending || reglerTout.isPending;
  const motifPar = (active: boolean, saisi: string) =>
    saisi.trim() ||
    (active
      ? "Activation par le propriétaire depuis les paramètres IA."
      : "Désactivation par le propriétaire depuis les paramètres IA.");
  return (
    <section className="rounded-xl border border-black/10 p-4 space-y-3">
      <h2 className="text-base font-black">Capacités — activées / désactivées</h2>
      <p className="text-sm">
        Le registre conserve toutes les fonctions existantes. Leur exécution dépend aussi du fournisseur, des
        droits et du niveau d’autonomie. Ce statut ne remplace pas un test réel de chaque capacité. Les mémoires
        utilisateur, projet et entreprise restent dans leurs espaces actuels ; aucun partage avec SHOP n’est activé
        ici.
      </p>
      {etat.data && (
        <p className="text-sm font-bold">
          {etat.data.resume.actives} active{etat.data.resume.actives > 1 ? "s" : ""} ·{" "}
          {etat.data.resume.eteintes} éteinte{etat.data.resume.eteintes > 1 ? "s" : ""} ·{" "}
          {etat.data.resume.impossibles} sans fournisseur
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={occupe || !etat.data}
          onClick={() => reglerTout.mutate({ active: true, motif: motifPar(true, "") })}
          className="rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
        >
          Tout activer
        </button>
        <button
          type="button"
          disabled={occupe || !etat.data}
          onClick={() => reglerTout.mutate({ active: false, motif: motifPar(false, "") })}
          className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40"
        >
          Tout désactiver
        </button>
      </div>
      {etat.isLoading && <p>Chargement…</p>}
      {etat.error && <p role="alert">État des fonctions indisponible.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {etat.data?.fonctions.map((f) => {
          const motif = motifs[f.code] ?? "";
          return (
            <article key={f.code} className="rounded-lg border p-3 space-y-2">
              <h3 className="font-bold">{f.libelle}</h3>
              <p className="text-xs">État déclaré : {f.etat}</p>
              <p className="text-sm">{f.apport}</p>
              <p className="text-xs">{f.motif}</p>
              <details>
                <summary className="text-sm">Conditions et usage</summary>
                <p className="text-xs">{f.exigence}</p>
                <p className="text-xs">{f.precaution}</p>
                <p className="text-xs">{f.autonomie}</p>
              </details>
              <label className="block text-xs">
                Motif de la décision
                <input
                  value={motif}
                  maxLength={600}
                  onChange={(e) => setMotifs((m) => ({ ...m, [f.code]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border p-2"
                />
              </label>
              <div className="flex flex-wrap gap-2" role="group" aria-label={f.libelle}>
                <button
                  type="button"
                  aria-pressed={f.etat === "active"}
                  disabled={occupe || f.etat === "active" || !f.activable}
                  onClick={() => regler.mutate({ fonction: f.code, active: true, motif: motifPar(true, motif) })}
                  className="rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  Activer
                </button>
                <button
                  type="button"
                  aria-pressed={f.etat !== "active"}
                  disabled={occupe || f.etat !== "active"}
                  onClick={() => regler.mutate({ fonction: f.code, active: false, motif: motifPar(false, motif) })}
                  className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40"
                >
                  Désactiver
                </button>
              </div>
              {retours[f.code] && (
                <p role="status" className={`text-xs ${retours[f.code].ok ? "text-green-700" : "text-red-700"}`}>
                  {retours[f.code].detail}
                </p>
              )}
              {!f.activable && f.etat !== "active" && (
                <p className="text-xs text-red-700">Impossible faute de fournisseur joignable pour cette capacité.</p>
              )}
            </article>
          );
        })}
      </div>
      <p role="status" className="text-sm">
        {message}
      </p>
      <MemoireSemantique />
      <SondeCapacites />
    </section>
  );
}
