/**
 * Demandes de déploiement en attente de LA personne connectée (jamais un
 * rôle entier — server/intelligences/deploiement/approbateurs.ts). Le moteur
 * ne déploie jamais lui-même : approuver ici ne fait qu'ouvrir le feu vert,
 * le code doit ensuite être réellement poussé en production ailleurs, puis
 * la publication vérifiée ici via l'état réel Railway.
 */
import { useState } from "react";
import { CheckCircle2, CloudUpload, XCircle } from "lucide-react";
import { trpc } from "../../../lib/trpc";

export function DeploiementsEnAttente() {
  const utils = trpc.useUtils();
  const enAttente = trpc.intelligences.deploiementsEnAttente.useQuery(undefined, { refetchOnWindowFocus: false });
  const [message, setMessage] = useState("");
  const [motifs, setMotifs] = useState<Record<number, string>>({});

  const invalider = () => utils.intelligences.deploiementsEnAttente.invalidate();

  const approuver = trpc.intelligences.approuverDeploiement.useMutation({
    onSuccess: async (r) => { setMessage(r.detail); await invalider(); },
    onError: (e) => setMessage(e.message),
  });
  const refuser = trpc.intelligences.refuserDeploiement.useMutation({
    onSuccess: async (r) => { setMessage(r.detail); await invalider(); },
    onError: (e) => setMessage(e.message),
  });

  if (enAttente.isLoading) return null;
  if (!enAttente.data || enAttente.data.length === 0) return null;

  return (
    <section className="alhud-dev-history" aria-label="Déploiements en attente">
      <h3><CloudUpload /> Déploiements en attente de votre décision</h3>
      {enAttente.data.map((d) => (
        <article key={d.id}>
          <strong>Demande de déploiement #{d.id}</strong>
          <p>Mission #{d.missionId ?? "—"} · demandée le {new Date(d.createdAt).toLocaleString("fr-FR")}</p>
          <label className="block text-xs">
            Motif de la décision
            <input
              value={motifs[d.id] ?? ""}
              maxLength={2000}
              onChange={(e) => setMotifs((m) => ({ ...m, [d.id]: e.target.value }))}
              className="mt-1 w-full rounded-lg border p-2"
            />
          </label>
          <div className="alhud-dev-actions">
            <button
              type="button"
              className="primary"
              disabled={approuver.isPending}
              onClick={() => approuver.mutate({ id: d.id, motif: motifs[d.id] ?? "" })}
            >
              <CheckCircle2 /><span>Approuver</span>
            </button>
            <button
              type="button"
              disabled={refuser.isPending}
              onClick={() => refuser.mutate({ id: d.id, motif: motifs[d.id] ?? "" })}
            >
              <XCircle /><span>Refuser</span>
            </button>
          </div>
        </article>
      ))}
      {message ? <p role="status" className="alhud-dev-message">{message}</p> : null}
    </section>
  );
}
