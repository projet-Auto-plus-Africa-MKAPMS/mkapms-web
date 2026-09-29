/**
 * Suivi des demandes de déploiement (PDG) — l'état Railway affiché ici vient
 * toujours d'un appel réel au moment du clic « Vérifier Railway » ; rien
 * n'est déclenché depuis cette application, seulement constaté.
 */
import { useState } from "react";
import { trpc } from "../../../lib/trpc";

const LIBELLES: Record<string, string> = {
  en_attente_approbation: "En attente d'approbation",
  approuve: "Approuvé — en attente de publication réelle",
  refuse: "Refusé",
  publie_ok: "Publié avec succès (Railway)",
  publie_echec: "Échec de publication (Railway)",
};

export function DeploiementSuivi() {
  const utils = trpc.useUtils();
  const historique = trpc.intelligences.historiqueDeploiements.useQuery(undefined, { refetchOnWindowFocus: false });
  const [message, setMessage] = useState("");
  const verifier = trpc.intelligences.verifierPublicationDeploiement.useMutation({
    onSuccess: async (r) => { setMessage(r.detail); await utils.intelligences.historiqueDeploiements.invalidate(); },
    onError: (e) => setMessage(e.message),
  });

  return (
    <section className="rounded-xl border border-black/10 p-4 space-y-3">
      <h2 className="text-base font-black">Suivi des déploiements</h2>
      {historique.isLoading && <p className="text-sm">Chargement…</p>}
      {!historique.isLoading && (historique.data ?? []).length === 0 && (
        <p className="text-sm">Aucune demande de déploiement pour l'instant.</p>
      )}
      <ul className="divide-y divide-black/5">
        {(historique.data ?? []).map((d) => (
          <li key={d.id} className="py-2 space-y-1 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">
                #{d.id} · {LIBELLES[d.statut] ?? d.statut}
              </span>
              {(d.statut === "approuve" || d.statut === "publie_echec") && (
                <button
                  type="button"
                  disabled={verifier.isPending}
                  onClick={() => verifier.mutate({ id: d.id })}
                  className="rounded border px-2 py-1 text-xs font-bold"
                >
                  Vérifier Railway
                </button>
              )}
            </div>
            <p className="text-xs text-black/50">
              Mission #{d.missionId ?? "—"} · demandée le {new Date(d.createdAt).toLocaleString("fr-FR")}
              {d.railwayStatut ? ` · dernier constat Railway : ${d.railwayStatut}` : ""}
            </p>
          </li>
        ))}
      </ul>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </section>
  );
}
