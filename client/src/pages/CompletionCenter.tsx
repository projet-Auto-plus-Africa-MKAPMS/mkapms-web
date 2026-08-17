/**
 * Points 119-120-121-122 — MKA.P-MS COMPLETION CENTER (PDG / Direction).
 *
 * Ce que cet écran répond : « qu'est-ce qui reste à faire ? ». Domaine par
 * domaine, les 9 maillons de la règle TERMINÉ sont affichés prouvés ou
 * manquants, et chaque pourcentage est la part de maillons prouvés — jamais une
 * estimation. Un domaine sans observation est écrit comme tel au lieu d'être
 * compté comme avancé.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  ListOrdered,
  RefreshCw,
  Target,
  XCircle,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

function Barre({ valeur }: { valeur: number }) {
  const couleur = valeur >= 100 ? "bg-emerald-500" : valeur >= 60 ? "bg-[#d4af37]" : "bg-red-400";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
      <div className={`h-full ${couleur}`} style={{ width: `${Math.min(100, valeur)}%` }} />
    </div>
  );
}

export default function CompletionCenter() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const [message, setMessage] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [tache, setTache] = useState("");
  const [domaineRapport, setDomaineRapport] = useState("");

  const definition = trpc.completion.definition.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const dernier = trpc.completion.dernier.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const ordre = trpc.completion.ordre.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const rapports = trpc.completion.rapports.useQuery(
    { limit: 20 },
    { enabled: !!isDirection, refetchOnWindowFocus: false },
  );

  const evaluer = trpc.completion.evaluer.useMutation({
    onSuccess: (r) => {
      setMessage(
        `Photographie #${r.snapshotId ?? "—"} : ${r.termines}/${r.domaines} domaine(s) TERMINÉ, avancement ${r.avancement} %, ${r.resteAFaire.length} tâche(s) restante(s).`,
      );
      dernier.refetch();
      ordre.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const deposer = trpc.completion.deposerRapport.useMutation({
    onSuccess: (r) => {
      setMessage(`Rapport #${r.id} enregistré — statut calculé : ${r.motif}`);
      setTache("");
      rapports.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const d = dernier.data ?? null;
  const labels = definition.data?.labels ?? {};

  return (
    <div className="min-h-screen bg-[#f6f6f7] pb-20">
      <div className="mx-auto max-w-5xl px-4 py-5">
        <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-sm text-black/60">
          <ChevronLeft size={16} /> Retour
        </Link>

        <header className="rounded-2xl bg-[#111] p-5 text-white">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <Target size={20} className="text-[#d4af37]" />
            MKA.P-MS COMPLETION CENTER
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {definition.data?.regle ??
              "TERMINÉ = Construit + Connecté + Activé + Testé + Observable + Inscrit au registre + Rapporté au Système Intelligent + Non-régression vérifiée + Preuve de résultat."}
          </p>
        </header>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => evaluer.mutate()}
            disabled={evaluer.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <ClipboardList size={15} className={evaluer.isPending ? "animate-pulse" : ""} />
            Calculer ce qui reste à faire
          </button>
          <button
            type="button"
            onClick={() => {
              dernier.refetch();
              ordre.refetch();
              rapports.refetch();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#111]"
          >
            <RefreshCw size={15} /> Rafraîchir
          </button>
        </div>

        {message ? (
          <p className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-sm text-black/70">
            {message}
          </p>
        ) : null}

        {!d ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-[#111]">Aucune photographie d&apos;achèvement</p>
            <p className="mt-1 text-sm text-black/70">
              Tant que le calcul n&apos;a pas été lancé, aucun pourcentage n&apos;est affiché : un
              avancement inventé serait pire que pas d&apos;avancement du tout.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-black/5 bg-white p-3">
                <p className="text-[11px] uppercase tracking-wide text-black/40">Domaines</p>
                <p className="mt-1 text-lg font-black text-[#111]">{d.domaines}</p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-3">
                <p className="text-[11px] uppercase tracking-wide text-black/40">Terminés</p>
                <p className="mt-1 text-lg font-black text-[#111]">
                  {d.termines}/{d.domaines}
                </p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-3">
                <p className="text-[11px] uppercase tracking-wide text-black/40">
                  Maillons prouvés
                </p>
                <p className="mt-1 text-lg font-black text-[#111]">{d.avancement} %</p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-3">
                <p className="text-[11px] uppercase tracking-wide text-black/40">Tâches restantes</p>
                <p className="mt-1 text-lg font-black text-[#111]">{d.resteAFaire.length}</p>
              </div>
            </div>

            <h2 className="mt-6 text-sm font-black uppercase tracking-wide text-black/50">
              Domaine par domaine
            </h2>
            <div className="mt-2 space-y-2">
              {d.verdicts.map((v) => (
                <div key={v.domaine} className="rounded-2xl border border-black/5 bg-white p-4">
                  <button
                    type="button"
                    onClick={() => setOuvert(ouvert === v.domaine ? null : v.domaine)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    {v.termine ? (
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle size={18} className="shrink-0 text-red-500" />
                    )}
                    <span className="flex-1">
                      <span className="block text-sm font-black text-[#111]">{v.label}</span>
                      <span className="block text-[11px] text-black/50">{v.motif}</span>
                    </span>
                    <span className="text-sm font-black text-[#111]">{v.avancement} %</span>
                  </button>
                  <div className="mt-2">
                    <Barre valeur={v.avancement} />
                  </div>

                  {ouvert === v.domaine ? (
                    <div className="mt-3 space-y-3 border-t border-black/5 pt-3">
                      <div className="grid gap-1 sm:grid-cols-2">
                        {Object.entries(v.maillons).map(([cle, ok]) => (
                          <p key={cle} className="flex items-start gap-2 text-[12px]">
                            {ok ? (
                              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                            ) : (
                              <XCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                            )}
                            <span className={ok ? "text-black/60" : "font-bold text-[#111]"}>
                              {(labels as Record<string, string>)[cle] ?? cle}
                            </span>
                          </p>
                        ))}
                      </div>

                      {v.restant.length > 0 ? (
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-black/40">
                            Ce qui reste à faire
                          </p>
                          <ul className="mt-1 space-y-1">
                            {v.restant.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-[12px] text-black/70">
                                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {v.dependancesManquantes.length > 0 ? (
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-black/40">
                            Dépendances manquantes (constatées par les contrôles)
                          </p>
                          <ul className="mt-1 space-y-1">
                            {v.dependancesManquantes.map((r, i) => (
                              <li key={i} className="text-[12px] text-black/60">
                                • {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="mt-6 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
          <ListOrdered size={15} /> Ordre d&apos;exécution (point 122)
        </h2>
        <div className="mt-2 space-y-1">
          {(ordre.data?.etapes ?? []).map((e) => (
            <div
              key={e.rang}
              className="flex items-start gap-3 rounded-xl border border-black/5 bg-white p-3"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/5 text-[11px] font-black text-[#111]">
                {e.rang}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-[#111]">{e.titre}</span>
                <span className="block text-[11px] text-black/50">{e.observe}</span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                  e.etat === "fait"
                    ? "bg-emerald-100 text-emerald-700"
                    : e.etat === "en_cours"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {e.etat === "fait" ? "fait" : e.etat === "en_cours" ? "en cours" : "à faire"}
              </span>
            </div>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-black uppercase tracking-wide text-black/50">
          Rapport de fin de travail (point 120)
        </h2>
        <div className="mt-2 rounded-2xl border border-black/5 bg-white p-4">
          <p className="text-[12px] text-black/60">
            Les tests exécutés, les régressions, l&apos;information du Système Intelligent, le retour
            arrière et le statut final ne sont pas déclarés : ils sont calculés. Un rapport ne peut
            pas s&apos;écrire « terminé » sans preuve.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={tache}
              onChange={(e) => setTache(e.target.value)}
              placeholder="Travail réalisé (ex. « boutons de paiement redirigés »)"
              className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
            <select
              value={domaineRapport}
              onChange={(e) => setDomaineRapport(e.target.value)}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm"
            >
              <option value="">Domaine…</option>
              {(d?.verdicts ?? []).map((v) => (
                <option key={v.domaine} value={v.domaine}>
                  {v.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={tache.trim().length < 3 || deposer.isPending}
              onClick={() =>
                deposer.mutate({
                  tache: tache.trim(),
                  domaine: domaineRapport || undefined,
                })
              }
              className="rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Déposer le rapport
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {(rapports.data ?? []).map((r) => (
              <div key={r.id} className="rounded-xl border border-black/5 p-3">
                <p className="text-sm font-bold text-[#111]">{r.tache}</p>
                <p className="mt-0.5 text-[11px] text-black/50">
                  {r.domaine ?? "domaine non rattaché"} — tests réussis {r.testsReussis}/
                  {r.testsExecutes} — régressions {(r.regressions ?? []).length} — Système Intelligent
                  informé : {r.systemeInformer ? "OUI" : "NON"} — rollback :{" "}
                  {r.rollbackDisponible ? "OUI" : "NON"}
                </p>
                <p className="mt-1 text-[12px] font-black text-[#111]">
                  {r.statutFinal === "termine" ? "TERMINÉ" : "PAS TERMINÉ"} — {r.motif}
                </p>
              </div>
            ))}
            {(rapports.data ?? []).length === 0 ? (
              <p className="text-[12px] text-black/50">Aucun rapport déposé pour l&apos;instant.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
