/**
 * Approbateurs de déploiement — désignation nominative, jamais un rôle
 * entier : le PDG choisit une ou plusieurs personnes précises qui pourront
 * donner le feu vert à une mise en production. Cette application ne déploie
 * jamais elle-même : elle pose une demande devant la personne choisie.
 */
import { useState } from "react";
import { trpc } from "../../../lib/trpc";

export function DeploiementApprobateurs() {
  const utils = trpc.useUtils();
  const approbateurs = trpc.intelligences.approbateursDeploiement.useQuery();
  const [q, setQ] = useState("");
  const [motif, setMotif] = useState("");
  const [message, setMessage] = useState("");
  const candidats = trpc.intelligences.rechercherCandidatApprobateur.useQuery(
    { q },
    { enabled: q.trim().length >= 2 },
  );
  const designer = trpc.intelligences.designerApprobateurDeploiement.useMutation({
    onSuccess: async (r) => {
      setMessage(r.detail);
      setQ("");
      setMotif("");
      await utils.intelligences.approbateursDeploiement.invalidate();
    },
    onError: (e) => setMessage(e.message),
  });
  const retirer = trpc.intelligences.retirerApprobateurDeploiement.useMutation({
    onSuccess: async (r) => {
      setMessage(r.detail);
      await utils.intelligences.approbateursDeploiement.invalidate();
    },
    onError: (e) => setMessage(e.message),
  });

  return (
    <section className="rounded-xl border border-black/10 p-4 space-y-3">
      <h2 className="text-base font-black">Approbateurs de déploiement</h2>
      <p className="text-sm">
        Ces personnes précises peuvent approuver ou refuser une mise en production. Cette application ne déploie
        jamais elle-même : une fois approuvé, le code doit encore être réellement poussé en production par la
        personne désignée, hors de cet écran.
      </p>

      <div className="rounded-lg border p-3 space-y-2">
        <h3 className="text-sm font-bold">Désigner une personne</h3>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom ou email…"
          className="w-full rounded-lg border p-2 text-sm"
        />
        {q.trim().length >= 2 && candidats.isLoading && <p className="text-xs">Recherche…</p>}
        {q.trim().length >= 2 && !candidats.isLoading && (candidats.data ?? []).length === 0 && (
          <p className="text-xs">Aucun compte trouvé.</p>
        )}
        <ul className="space-y-1">
          {(candidats.data ?? []).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 rounded border p-2 text-sm">
              <span className="min-w-0">
                {c.nom} <span className="text-black/40">({c.email}, {c.role})</span>
              </span>
              <button
                type="button"
                disabled={designer.isPending}
                onClick={() => designer.mutate({ userId: c.id, motif: motif || `Désigné par le PDG comme approbateur de déploiement.` })}
                className="shrink-0 whitespace-nowrap rounded border px-2 py-1 text-xs font-bold"
              >
                Désigner
              </button>
            </li>
          ))}
        </ul>
        <label className="block text-xs">
          Motif (facultatif, repris par défaut si vide)
          <input
            value={motif}
            maxLength={600}
            onChange={(e) => setMotif(e.target.value)}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </label>
      </div>

      <div className="rounded-lg border p-3 space-y-2">
        <h3 className="text-sm font-bold">Approbateurs actuels</h3>
        {approbateurs.isLoading && <p className="text-xs">Chargement…</p>}
        {!approbateurs.isLoading && (approbateurs.data ?? []).filter((a) => a.actif).length === 0 && (
          <p className="text-xs text-red-700">
            Aucun approbateur désigné : les demandes de déploiement resteront sans personne pour les trancher.
          </p>
        )}
        <ul className="divide-y divide-black/5">
          {(approbateurs.data ?? [])
            .filter((a) => a.actif)
            .map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  {a.nom} <span className="text-black/40">({a.email}, {a.role})</span>
                </span>
                <button
                  type="button"
                  disabled={retirer.isPending}
                  onClick={() => retirer.mutate({ userId: a.userId })}
                  className="shrink-0 whitespace-nowrap rounded border px-2 py-1 text-xs font-bold text-red-700"
                >
                  Retirer
                </button>
              </li>
            ))}
        </ul>
      </div>

      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </section>
  );
}
