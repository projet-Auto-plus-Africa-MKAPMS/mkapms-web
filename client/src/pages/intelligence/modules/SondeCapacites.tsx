/** Tests réels des capacités du fournisseur de modèles : état séparé et preuve de chaque capacité. */
import { useState } from "react";
import { trpc } from "../../../lib/trpc";

const LIBELLES: Record<string, string> = {
  NOT_AVAILABLE: "Non disponible pour ce projet",
  AVAILABLE_IN_OPENAI: "Disponible chez le fournisseur",
  ENABLED_FOR_PROJECT: "Activé pour le projet",
  ADAPTER_READY: "Adaptateur prêt",
  CONNECTED_TO_MKA_PMS_IA: "Branché dans MKA.P-MS AI (non testé)",
  TESTED: "Testé (appel réel réussi, sans adaptateur)",
  FUNCTIONAL: "Fonctionnel (appel réel via MKA.P-MS AI)",
  WAITING_EXTERNAL_ACCESS: "En attente d'accès externe (refus prouvé)",
};

export function SondeCapacites() {
  const utils = trpc.useUtils();
  const etat = trpc.intelligences.sondeEtat.useQuery();
  const [couteux, setCouteux] = useState(false);
  const [message, setMessage] = useState("");
  const lancer = trpc.intelligences.sondeLancer.useMutation({
    onSuccess: async (r) => {
      setMessage(`Sonde terminée : ${r.nombreModeles} modèle(s) dans le projet, ${r.capacites.length} ligne(s) de preuve.`);
      await utils.intelligences.sondeEtat.invalidate();
    },
    onError: (e) => setMessage(e.message),
  });
  const lignes = (etat.data?.capacites ?? []).slice().sort((a, b) => a.capacite.localeCompare(b.capacite));
  const catalogue = lignes.find((l) => l.capacite === "catalogue_modeles");
  const ids = ((catalogue?.details as { ids?: string[] } | undefined)?.ids ?? []) as string[];
  return (
    <section className="rounded-xl border border-black/10 p-4 space-y-3">
      <h2 className="text-base font-black">Tests réels des capacités du fournisseur</h2>
      <p className="text-sm">
        « Activé chez le fournisseur » ne veut pas dire « fonctionnel dans MKA.P-MS AI ». Chaque capacité est essayée par un vrai
        appel, sur le point d'entrée et le modèle exacts. Seule une requête réussie qui passe par l'adaptateur de la plateforme
        la rend « Fonctionnelle » ; un refus est conservé avec sa preuve (statut, type, code, modèle). Aucune clé n'est affichée.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={couteux} onChange={(e) => setCouteux(e.target.checked)} />
        Inclure les essais payants (génération d'image)
      </label>
      <button
        type="button"
        disabled={lancer.isPending}
        onClick={() => lancer.mutate({ inclureCouteux: couteux })}
        className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40"
      >
        {lancer.isPending ? "Test en cours…" : "Tester toutes les capacités"}
      </button>
      <p role="status" className="text-sm">{message}</p>
      {etat.isLoading && <p>Chargement…</p>}
      {!etat.isLoading && lignes.length === 0 && <p className="text-sm">Aucun test n'a encore été lancé.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {lignes.filter((l) => l.capacite !== "catalogue_modeles").map((l) => {
          const d = l.details as { libelle?: string; note?: string; saute?: string; essais?: { modele: string; http: number | null; erreurCode: string }[] };
          return (
            <article key={l.capacite} className="rounded-lg border p-3 space-y-1 text-sm">
              <h3 className="font-bold">{d.libelle ?? l.capacite}</h3>
              <p>{LIBELLES[l.etat] ?? l.etat}</p>
              <p className="text-xs">Point d'entrée : {l.endpoint}{l.modele ? ` · modèle : ${l.modele}` : ""}</p>
              {l.httpStatus !== null && <p className="text-xs">Statut HTTP : {l.httpStatus}{l.erreurCode ? ` · code : ${l.erreurCode}` : ""}{l.erreurType ? ` · type : ${l.erreurType}` : ""}</p>}
              {d.saute && <p className="text-xs">{d.saute}</p>}
              {d.note && <p className="text-xs">{d.note}</p>}
              {d.essais && d.essais.length > 0 && (
                <details>
                  <summary className="text-xs">Essais par modèle</summary>
                  <ul className="text-xs">
                    {d.essais.map((e) => <li key={e.modele}>{e.modele} → {e.http ?? "pas de réponse"}{e.erreurCode ? ` (${e.erreurCode})` : ""}</li>)}
                  </ul>
                </details>
              )}
              <p className="text-[11px] opacity-70">Testé le {new Date(l.testeLe).toLocaleString("fr-FR")}</p>
            </article>
          );
        })}
      </div>
      {ids.length > 0 && (
        <details>
          <summary className="text-sm">Identifiants exacts des modèles du projet ({ids.length})</summary>
          <p className="text-xs break-words">{ids.join(", ")}</p>
        </details>
      )}
    </section>
  );
}
