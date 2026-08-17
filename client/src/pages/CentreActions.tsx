/**
 * Point 70 — Centre d'Actions PDG.
 *
 * Réservé au PDG (super_admin) et au Directeur / Administration (admin) en
 * lecture ; seul le PDG valide, relance ou clôture.
 *
 * Ce que l'écran refuse de faire, volontairement :
 *  - il ne fait pas disparaître une proposition validée : elle devient une
 *    action visible avec son statut réel (point 69) ;
 *  - il n'affiche jamais « terminé » pour une action qui n'a rien exécuté :
 *    une action sans exécuteur automatique est marquée « intervention humaine » ;
 *  - il montre la raison exacte d'un échec, pas un simple libellé « erreur » ;
 *  - il n'invente aucun chiffre : quand rien n'existe, il l'écrit.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Hand,
  Lightbulb,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type Onglet =
  | "a_valider"
  | "en_cours"
  | "termine"
  | "echecs"
  | "suggestions"
  | "connaissances"
  | "opportunites"
  | "alertes";

const ONGLETS: { key: Onglet; label: string }[] = [
  { key: "a_valider", label: "À valider" },
  { key: "en_cours", label: "En cours" },
  { key: "termine", label: "Terminé" },
  { key: "echecs", label: "Échecs" },
  { key: "suggestions", label: "Suggestions IA" },
  { key: "connaissances", label: "Connaissances acquises" },
  { key: "opportunites", label: "Opportunités" },
  { key: "alertes", label: "Alertes" },
];

/** Libellés du cycle de vie du point 69, sans jargon technique. */
const STATUTS: Record<string, { label: string; ton: string }> = {
  propose: { label: "Proposé", ton: "bg-black/5 text-black/60" },
  valide: { label: "Validé", ton: "bg-blue-50 text-blue-700" },
  planifie: { label: "Planifié", ton: "bg-blue-50 text-blue-700" },
  en_cours: { label: "En cours", ton: "bg-amber-50 text-amber-700" },
  test: { label: "Test", ton: "bg-amber-50 text-amber-700" },
  deploye: { label: "Déployé", ton: "bg-emerald-50 text-emerald-700" },
  verifie: { label: "Vérifié", ton: "bg-emerald-50 text-emerald-700" },
  termine: { label: "Terminé", ton: "bg-emerald-50 text-emerald-700" },
  echec: { label: "Échec", ton: "bg-red-50 text-red-700" },
  manuel_requis: { label: "Intervention humaine", ton: "bg-orange-50 text-orange-700" },
  rejete: { label: "Écarté", ton: "bg-black/5 text-black/50" },
};

const RISQUES: Record<number, string> = {
  1: "Niveau 1 — automatique",
  2: "Niveau 2 — autonomie contrôlée",
  3: "Niveau 3 — critique",
};

function dateCourte(v: string | Date | null): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Carte({ titre, valeur, detail }: { titre: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-black/40">{titre}</p>
      <p className="mt-1 text-lg font-black text-[#111]">{valeur}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-black/50">{detail}</p> : null}
    </div>
  );
}

export default function CentreActions() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const isPdg = user?.role === "super_admin";
  const [onglet, setOnglet] = useState<Onglet>("a_valider");
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const bucket =
    onglet === "a_valider" || onglet === "en_cours" || onglet === "termine" || onglet === "echecs"
      ? onglet
      : null;

  const stats = trpc.smartEngine.actionTaskStats.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const taches = trpc.smartEngine.actionTasks.useQuery(
    { bucket: bucket ?? "tous", limit: 200 },
    { enabled: !!isDirection && !!bucket, refetchOnWindowFocus: false },
  );
  const detail = trpc.smartEngine.actionTaskDetail.useQuery(
    { id: ouvert ?? 0 },
    { enabled: !!isDirection && ouvert !== null, refetchOnWindowFocus: false },
  );
  const suggestions = trpc.smartEngine.optimizationsList.useQuery(
    { status: "proposed", limit: 100 },
    { enabled: !!isDirection && onglet === "suggestions", refetchOnWindowFocus: false },
  );
  const connaissances = trpc.smartEngine.knowledgeList.useQuery(
    { limit: 200 },
    { enabled: !!isDirection && onglet === "connaissances", refetchOnWindowFocus: false },
  );
  const alertes = trpc.smartEngine.alerts.useQuery(
    { status: "open", limit: 100 },
    { enabled: !!isDirection && onglet === "alertes", refetchOnWindowFocus: false },
  );

  const rafraichir = () => {
    stats.refetch();
    taches.refetch();
    if (ouvert !== null) detail.refetch();
  };

  const valider = trpc.smartEngine.actionTaskValidate.useMutation({
    onSuccess: (r) => {
      setMessage(`${STATUTS[r.status]?.label ?? r.status} — ${r.detail}`);
      rafraichir();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const relancer = trpc.smartEngine.actionTaskRetry.useMutation({
    onSuccess: (r) => {
      setMessage(`${STATUTS[r.status]?.label ?? r.status} — ${r.detail}`);
      rafraichir();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const clore = trpc.smartEngine.actionTaskClose.useMutation({
    onSuccess: () => {
      setMessage("Action clôturée.");
      rafraichir();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const validerSuggestion = trpc.smartEngine.optimizationReview.useMutation({
    onSuccess: (r) => {
      setMessage(
        r.detail
          ? `${STATUTS[r.statut ?? ""]?.label ?? r.statut ?? "Traitée"} — ${r.detail}`
          : "Suggestion enregistrée.",
      );
      suggestions.refetch();
      stats.refetch();
      setOnglet("en_cours");
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const s = stats.data;
  const lignes = taches.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <ListChecks size={20} className="text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Centre d'Actions</h1>
            <p className="text-xs text-white/50">
              Une validation produit une action tracée, un résultat vérifié — ou un échec expliqué.
            </p>
          </div>
          <button
            type="button"
            onClick={rafraichir}
            className="rounded-lg bg-white/10 p-2 text-white/70"
            aria-label="Recharger"
          >
            <RefreshCw size={16} className={stats.isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {ONGLETS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => {
              setOnglet(o.key);
              setOuvert(null);
            }}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
              onglet === o.key ? "bg-[#111] text-white" : "bg-white text-black/60"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 px-4">
        {message ? (
          <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-3 text-xs text-black/70">
            {message}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Carte titre="À valider" valeur={String(s?.aValider ?? 0)} />
          <Carte titre="En cours" valeur={String(s?.enCours ?? 0)} />
          <Carte
            titre="Intervention humaine"
            valeur={String(s?.manuel ?? 0)}
            detail="aucune automatisation disponible"
          />
          <Carte titre="Terminées" valeur={String(s?.termine ?? 0)} detail="résultat vérifié" />
          <Carte titre="Échecs" valeur={String(s?.echec ?? 0)} detail="raison conservée" />
          <Carte titre="Total" valeur={String(s?.total ?? 0)} />
        </div>

        {bucket ? (
          taches.isLoading ? (
            <p className="text-sm text-black/50">Chargement des actions…</p>
          ) : taches.error ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              Actions indisponibles : {taches.error.message}
            </p>
          ) : lignes.length === 0 ? (
            <p className="text-sm text-black/50">
              {onglet === "a_valider"
                ? "Aucune action en attente de validation."
                : onglet === "en_cours"
                  ? "Aucune action en cours."
                  : onglet === "termine"
                    ? "Aucune action terminée pour l'instant."
                    : "Aucun échec enregistré."}
            </p>
          ) : (
            <div className="space-y-2">
              {lignes.map((t) => {
                const st = STATUTS[t.status] ?? { label: t.status, ton: "bg-black/5 text-black/60" };
                return (
                  <div key={t.id} className="rounded-xl border border-black/5 bg-white p-3">
                    <button
                      type="button"
                      onClick={() => setOuvert(ouvert === t.id ? null : t.id)}
                      className="flex w-full items-start gap-2 text-left"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#111]">{t.title}</p>
                        <p className="mt-0.5 text-[11px] text-black/50">
                          #{t.id} · {t.actionType} · {RISQUES[t.riskLevel] ?? "niveau inconnu"} ·{" "}
                          {t.countryCode ? `pays ${t.countryCode}` : "tous les pays activés"}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${st.ton}`}>
                        {st.label}
                      </span>
                    </button>

                    {t.description ? (
                      <p className="mt-2 text-[11px] text-black/60">{t.description}</p>
                    ) : null}

                    {t.failureReason ? (
                      <p className="mt-2 flex items-start gap-1 rounded-lg bg-red-50 p-2 text-[11px] text-red-700">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        <span>{t.failureReason}</span>
                      </p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-black/40">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> créée le {dateCourte(t.createdAt)}
                      </span>
                      {t.verifiedAt ? (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 size={11} /> vérifiée le {dateCourte(t.verifiedAt)}
                        </span>
                      ) : null}
                    </div>

                    {isPdg ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {t.status === "propose" ? (
                          <button
                            type="button"
                            onClick={() => valider.mutate({ id: t.id })}
                            disabled={valider.isPending}
                            className="rounded-lg bg-[#111] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                          >
                            Valider et exécuter
                          </button>
                        ) : null}
                        {t.status === "echec" ? (
                          <button
                            type="button"
                            onClick={() => relancer.mutate({ id: t.id })}
                            disabled={relancer.isPending}
                            className="rounded-lg bg-[#111] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                          >
                            Relancer
                          </button>
                        ) : null}
                        {t.status === "manuel_requis" ? (
                          <button
                            type="button"
                            onClick={() =>
                              clore.mutate({
                                id: t.id,
                                decision: "termine",
                                note: "Réalisée manuellement par la direction.",
                              })
                            }
                            disabled={clore.isPending}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                          >
                            <Hand size={11} /> Marquer réalisée
                          </button>
                        ) : null}
                        {t.status !== "termine" && t.status !== "rejete" ? (
                          <button
                            type="button"
                            onClick={() => clore.mutate({ id: t.id, decision: "rejete" })}
                            disabled={clore.isPending}
                            className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-1.5 text-[11px] font-bold text-black/60 disabled:opacity-50"
                          >
                            <XCircle size={11} /> Écarter
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {ouvert === t.id ? (
                      <div className="mt-3 border-t border-black/5 pt-2">
                        <p className="mb-1 text-[11px] font-bold text-black/60">
                          Historique de l'action
                        </p>
                        {detail.isLoading ? (
                          <p className="text-[11px] text-black/40">Chargement…</p>
                        ) : !detail.data ? (
                          <p className="text-[11px] text-black/40">Aucune étape enregistrée.</p>
                        ) : (
                          <ul className="space-y-1">
                            {detail.data.steps.map((e) => (
                              <li key={e.id} className="text-[11px] text-black/60">
                                <span className="font-bold">
                                  {STATUTS[e.step]?.label ?? e.step}
                                </span>{" "}
                                · {dateCourte(e.createdAt)}
                                {e.status === "echec" ? (
                                  <span className="text-red-700"> · échec</span>
                                ) : null}
                                {e.detail ? <span> — {e.detail}</span> : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )
        ) : null}

        {onglet === "suggestions" ? (
          suggestions.isLoading ? (
            <p className="text-sm text-black/50">Chargement des suggestions…</p>
          ) : (suggestions.data ?? []).length === 0 ? (
            <p className="text-sm text-black/50">
              Aucune suggestion en attente. Le Système Intelligent n'en propose que sur des faits
              constatés.
            </p>
          ) : (
            <div className="space-y-2">
              {(suggestions.data ?? []).map((o) => (
                <div key={o.id} className="rounded-xl border border-black/5 bg-white p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles size={14} className="mt-0.5 text-[#D4AF37]" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#111]">{o.title}</p>
                      {o.detail ? (
                        <p className="mt-0.5 text-[11px] text-black/60">{o.detail}</p>
                      ) : null}
                      {o.recommendation ? (
                        <p className="mt-1 text-[11px] text-black/50">→ {o.recommendation}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-black/40">
                        {o.category} · impact {o.impact ?? "moyen"}
                      </p>
                    </div>
                  </div>
                  {isPdg ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          validerSuggestion.mutate({ id: o.id, decision: "applied" })
                        }
                        disabled={validerSuggestion.isPending}
                        className="rounded-lg bg-[#111] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                      >
                        Valider — créer l'action
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          validerSuggestion.mutate({ id: o.id, decision: "rejected" })
                        }
                        disabled={validerSuggestion.isPending}
                        className="rounded-lg border border-black/10 px-3 py-1.5 text-[11px] font-bold text-black/60 disabled:opacity-50"
                      >
                        Écarter
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )
        ) : null}

        {onglet === "connaissances" ? (
          connaissances.isLoading ? (
            <p className="text-sm text-black/50">Chargement des connaissances…</p>
          ) : (connaissances.data ?? []).length === 0 ? (
            <p className="text-sm text-black/50">Aucune connaissance enregistrée pour l'instant.</p>
          ) : (
            <div className="space-y-2">
              {(connaissances.data ?? []).map((k) => (
                <div
                  key={k.id}
                  className="flex items-start gap-2 rounded-xl border border-black/5 bg-white p-3"
                >
                  <BookOpen size={14} className="mt-0.5 text-[#D4AF37]" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#111]">{k.insight}</p>
                    {k.recommendation ? (
                      <p className="mt-0.5 text-[11px] text-black/60">→ {k.recommendation}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-black/40">
                      {k.category}
                      {k.source ? ` · source : ${k.source}` : " · source non renseignée"} ·{" "}
                      {k.applied ? "reprise sur la plateforme" : "apprise, non publiée"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}

        {onglet === "opportunites" ? (
          connaissances.isLoading || suggestions.isLoading ? (
            <p className="text-sm text-black/50">Chargement des opportunités…</p>
          ) : (
            <div className="space-y-2">
              <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-3">
                <p className="mb-1 flex items-center gap-1 text-xs font-bold text-[#111]">
                  <Lightbulb size={13} /> Ce qui est apprise sans être publié
                </p>
                <p className="text-[11px] text-black/60">
                  Une connaissance acquise ne devient jamais du contenu public automatiquement :
                  elle est proposée ici, et c'est la direction qui décide.
                </p>
              </div>
              {(connaissances.data ?? []).filter((k) => !k.applied).length === 0 ? (
                <p className="text-sm text-black/50">
                  Aucune opportunité en attente de décision.
                </p>
              ) : (
                (connaissances.data ?? [])
                  .filter((k) => !k.applied)
                  .map((k) => (
                    <div key={k.id} className="rounded-xl border border-black/5 bg-white p-3">
                      <p className="text-sm font-bold text-[#111]">{k.insight}</p>
                      <p className="mt-1 text-[11px] text-black/40">
                        {k.category}
                        {k.url ? ` · ${k.url}` : ""}
                      </p>
                    </div>
                  ))
              )}
            </div>
          )
        ) : null}

        {onglet === "alertes" ? (
          alertes.isLoading ? (
            <p className="text-sm text-black/50">Chargement des alertes…</p>
          ) : (alertes.data ?? []).length === 0 ? (
            <p className="text-sm text-black/50">Aucune alerte ouverte.</p>
          ) : (
            <div className="space-y-2">
              {(alertes.data ?? []).map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-2 rounded-xl border border-black/5 bg-white p-3"
                >
                  <AlertTriangle size={14} className="mt-0.5 text-[#D4AF37]" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#111]">{a.title}</p>
                    {a.description ? (
                      <p className="mt-0.5 text-[11px] text-black/60">{a.description}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-black/40">
                      {a.category} · {a.severity ?? "info"} · {dateCourte(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}

        <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-3">
          <p className="mb-1 flex items-center gap-1 text-xs font-bold text-[#111]">
            <ShieldCheck size={13} /> Ce que ce centre ne fait pas
          </p>
          <ul className="space-y-1 text-[11px] text-black/60">
            <li>• Une action validée ne disparaît pas : elle garde son statut jusqu'au résultat.</li>
            <li>
              • Une action sans exécuteur automatique n'est jamais marquée terminée : elle attend une
              intervention humaine.
            </li>
            <li>
              • Une action de niveau critique n'est jamais lancée automatiquement, même validée.
            </li>
            <li>• Un échec conserve sa raison exacte et peut être relancé.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
