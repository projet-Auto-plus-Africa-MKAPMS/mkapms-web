/**
 * Registre & Centre de Contrôle des Moteurs MKA.P-MS
 *
 * Page réservée : PDG (super_admin) et Directeur / Administration (admin).
 *
 * C'est l'écran du « moteur principal » (Core Engine + Registre) : TOUS les
 * moteurs de la plateforme y sont listés un par un, regroupés par famille et
 * rangés du plus important au plus petit, avec leur état, leur santé, leur
 * version, leurs dépendances et leur dernier signal (heartbeat). Chaque moteur
 * est connecté au moteur principal (dépendance "core").
 *
 * - Lecture : PDG + Directeur (directionProcedure côté serveur).
 * - Contrôle d'état (activer / désactiver / lecture seule / maintenance /
 *   staging) : réservé au PDG (super_admin). Le Directeur voit tout mais ne
 *   peut pas changer l'état d'un moteur.
 *
 * Aucune logique métier des moteurs n'est dupliquée ici : la page consomme
 * uniquement le registre central et les contrats déjà enregistrés.
 */
import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { DiagnosticPanel } from "./DiagnosticPanel";
import {
  Cpu,
  ChevronLeft,
  RefreshCw,
  Activity,
  ExternalLink,
  ShieldAlert,
  Search,
  X,
  Brain,
  ShieldCheck,
  AlertTriangle,
  History,
  Network,
  Undo2,
} from "lucide-react";

/** Filtre rapide piloté par les cases cliquables du bandeau de synthèse. */
type QuickFilter = "all" | "active" | "degraded";

type EngineState = "active" | "read_only" | "maintenance" | "disabled" | "staging";

/**
 * Ordre d'importance des moteurs (les plus gros en haut) à l'intérieur d'une
 * même famille. Le Core Engine est le moteur principal auquel tous les autres
 * sont connectés, il est donc toujours en tête. Les moteurs non listés passent
 * en bas de leur famille, triés par nom.
 */
const PRIORITY: Record<string, number> = {
  core: 0,
  identity: 1,
  permission: 2,
  country: 3,
  language: 4,
  notification: 5,
  document: 6,
  smart: 7,
  redirection: 8,
  payment: 9,
  search: 10,
  workflow: 11,
  knowledge: 12,
  monitoring: 13,
  analytics: 14,
  seo: 15,
};

/** Familles de moteurs, dans l'ordre d'affichage (les plus structurantes en haut). */
const CATEGORY_ORDER: { key: string; title: string; subtitle: string }[] = [
  { key: "core", title: "Moteur principal", subtitle: "Le cœur : tous les moteurs y sont connectés" },
  { key: "transversal", title: "Moteurs transversaux", subtitle: "Services communs à toute la plateforme" },
  { key: "univers", title: "Univers", subtitle: "Un moteur par univers métier" },
  { key: "service", title: "Services", subtitle: "Un moteur par service dédié" },
  { key: "sous_section", title: "Sous-sections d'univers", subtitle: "Officiel / Professionnel / Particulier — isolables" },
];

/** Route réelle du centre de contrôle dédié de chaque moteur (si elle existe). */
const CONTROL_ROUTE: Record<string, string> = {
  core: "/superadmin/core-engine-beta",
  identity: "/superadmin/identity-os",
  smart: "/superadmin/smart-engine",
  permission: "/superadmin/permission-engine",
  country: "/superadmin/country-os",
  language: "/superadmin/language-os",
  notification: "/superadmin/notification-os",
  document: "/superadmin/document-os",
  redirection: "/superadmin/redirection-engine",
};

const STATE_LABEL: Record<EngineState, string> = {
  active: "Actif",
  read_only: "Lecture seule",
  maintenance: "Maintenance",
  disabled: "Désactivé",
  staging: "Préproduction",
};

const STATE_STYLE: Record<EngineState, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  read_only: "bg-sky-100 text-sky-700 border-sky-200",
  maintenance: "bg-amber-100 text-amber-700 border-amber-200",
  disabled: "bg-slate-200 text-slate-600 border-slate-300",
  staging: "bg-violet-100 text-violet-700 border-violet-200",
};

const HEALTH_STYLE: Record<string, string> = {
  ok: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
  unknown: "bg-slate-400",
};

const HEALTH_LABEL: Record<string, string> = {
  ok: "En bonne santé",
  degraded: "Dégradé",
  down: "Hors service",
  unknown: "Inconnu",
};

/** Les 5 états opérationnels calculés du registre complet (point 41). */
type OperationalState = "ok" | "partiel" | "degrade" | "hors_service" | "non_configure";

const OP_ORDER: OperationalState[] = [
  "ok",
  "partiel",
  "degrade",
  "hors_service",
  "non_configure",
];

const OP_LABEL: Record<OperationalState, string> = {
  ok: "Opérationnel",
  partiel: "Partiel",
  degrade: "Dégradé",
  hors_service: "Hors service",
  non_configure: "Non configuré",
};

const OP_STYLE: Record<OperationalState, string> = {
  ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
  partiel: "bg-sky-100 text-sky-700 border-sky-200",
  degrade: "bg-amber-100 text-amber-700 border-amber-200",
  hors_service: "bg-red-100 text-red-700 border-red-200",
  non_configure: "bg-slate-200 text-slate-600 border-slate-300",
};

/** Journal des modifications d'agents (point 42). */
const CHANGE_STATUS_LABEL: Record<string, string> = {
  declaree: "En attente de validation",
  validee: "Validée",
  rejetee: "Rejetée",
  annulee: "Annulée (retour arrière)",
};

const CHANGE_STATUS_STYLE: Record<string, string> = {
  declaree: "bg-amber-100 text-amber-700",
  validee: "bg-emerald-100 text-emerald-700",
  rejetee: "bg-red-100 text-red-700",
  annulee: "bg-slate-200 text-slate-600",
};

const STATE_ORDER: EngineState[] = [
  "active",
  "read_only",
  "staging",
  "maintenance",
  "disabled",
];

type EngineRow = {
  name: string;
  label: string;
  category: string;
  version: string;
  state: string;
  health: string;
  description: string | null;
  dependencies: string[] | null;
  lastHeartbeat: string | Date | null;
};

export default function EngineRegistryControlCenter() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const isPdg = user?.role === "super_admin";

  const list = trpc.engineRegistry.list.useQuery(undefined, {
    enabled: isDirection,
    refetchInterval: 15000,
  });
  const stats = trpc.engineRegistry.stats.useQuery(undefined, {
    enabled: isDirection,
    refetchInterval: 15000,
  });
  // Point 41 — état opérationnel réel (calculé) de chaque moteur.
  const overview = trpc.engineRegistry.overview.useQuery(undefined, {
    enabled: isDirection,
    refetchInterval: 30000,
  });
  // Phase 55 — deux moteurs centraux.
  const supervision = trpc.centralEngines.supervision.useQuery(undefined, {
    enabled: isDirection,
    refetchInterval: 15000,
  });
  const intelligence = trpc.centralEngines.intelligence.useQuery(undefined, {
    enabled: isPdg,
    refetchInterval: 30000,
  });
  const utils = trpc.useUtils();
  const graph = trpc.engineRegistry.dependencyGraph.useQuery(undefined, {
    enabled: isDirection,
  });
  const invalidateRegistry = () => {
    utils.engineRegistry.list.invalidate();
    utils.engineRegistry.stats.invalidate();
    utils.engineRegistry.overview.invalidate();
    utils.engineRegistry.anomalies.invalidate();
    utils.engineRegistry.dependencyGraph.invalidate();
  };

  // Point 43 — une action sensible passe par un avis d'impact avant d'être
  // appliquée : éteindre un moteur coupait silencieusement ses dépendants.
  const [pending, setPending] = useState<{
    name: string;
    state: EngineState;
    avertissements: string[];
    blocages: string[];
    impacts: string[];
  } | null>(null);

  const setState = trpc.engineRegistry.setStateChecked.useMutation({
    onSuccess: (res, vars) => {
      if (res.applied) {
        setPending(null);
        return;
      }
      setPending({
        name: vars.name,
        state: vars.state as EngineState,
        avertissements: res.validation.avertissements,
        blocages: res.validation.blocages,
        impacts: res.validation.impact?.activeAffected ?? [],
      });
    },
    onSettled: invalidateRegistry,
  });

  // Point 44 — retour arrière du dernier changement d'état.
  const [revertMsg, setRevertMsg] = useState<string | null>(null);
  const revert = trpc.engineRegistry.revertState.useMutation({
    onSuccess: (res) => {
      setRevertMsg(
        res.applied
          ? `${res.engine} : état précédent rétabli (${res.from} → ${res.to}).`
          : `${res.engine} : ${res.raison}`,
      );
    },
    onSettled: invalidateRegistry,
  });

  // Filtres du tableau de bord (cases cliquables + recherche + état).
  const [opFilter, setOpFilter] = useState<OperationalState | "all">("all");
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [stateFilter, setStateFilter] = useState<EngineState | "all">("all");
  const [search, setSearch] = useState("");

  const engines = (list.data ?? []) as EngineRow[];
  const readiness = useMemo(
    () => new Map((overview.data?.moteurs ?? []).map((m) => [m.name, m])),
    [overview.data],
  );
  const graphByName = useMemo(
    () => new Map((graph.data?.nodes ?? []).map((n) => [n.name, n])),
    [graph.data],
  );

  const degradedCount = useMemo(
    () => engines.filter((e) => e.health === "degraded" || e.health === "down").length,
    [engines],
  );
  const activeCount = useMemo(
    () => engines.filter((e) => e.state === "active").length,
    [engines],
  );

  const matchesFilters = (e: EngineRow) => {
    if (opFilter !== "all" && readiness.get(e.name)?.operational !== opFilter) return false;
    if (quick === "active" && e.state !== "active") return false;
    if (quick === "degraded" && !(e.health === "degraded" || e.health === "down")) return false;
    if (stateFilter !== "all" && e.state !== stateFilter) return false;
    const q = search.trim().toLowerCase();
    if (q && !(`${e.label} ${e.name} ${e.description ?? ""}`.toLowerCase().includes(q)))
      return false;
    return true;
  };
  const filtered = engines.filter(matchesFilters);
  const hasActiveFilter =
    quick !== "all" || stateFilter !== "all" || opFilter !== "all" || search.trim() !== "";
  const resetFilters = () => {
    setQuick("all");
    setStateFilter("all");
    setOpFilter("all");
    setSearch("");
  };

  // PDG + Directeur uniquement
  if (!user || !isDirection) {
    return <Navigate to="/" replace />;
  }
  const sortInFamily = (a: EngineRow, b: EngineRow) => {
    const pa = PRIORITY[a.name] ?? 999;
    const pb = PRIORITY[b.name] ?? 999;
    if (pa !== pb) return pa - pb;
    return a.label.localeCompare(b.label);
  };

  const knownKeys = new Set(CATEGORY_ORDER.map((c) => c.key));
  const extraCats = Array.from(
    new Set(engines.map((e) => e.category).filter((c) => !knownKeys.has(c))),
  ).map((key) => ({ key, title: key, subtitle: "" }));
  const families = [...CATEGORY_ORDER, ...extraCats];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <Cpu size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">
              Registre &amp; Contrôle des Moteurs MKA.P-MS
            </h1>
            <p className="text-xs text-white/50">
              Tous les moteurs connectés au moteur principal (Core) — rangés du plus gros au plus petit.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-5">
        {/* Phase 55 — Deux moteurs centraux (chefs d'orchestre) */}
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {/* Moteur 2 — Supervision & Opérations (PDG + Directeur) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <h2 className="text-sm font-black text-slate-900">Supervision &amp; Opérations</h2>
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                PDG + Directeur
              </span>
            </div>
            {supervision.isLoading ? (
              <p className="text-xs text-slate-400">Analyse en cours…</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Moteurs" value={supervision.data?.registry.totalEngines ?? 0} />
                  <MiniStat label="Actifs" value={supervision.data?.registry.activeEngines ?? 0} />
                  <MiniStat
                    label="Anomalies"
                    value={supervision.data?.anomalies.length ?? 0}
                    tone={(supervision.data?.anomalies.length ?? 0) > 0 ? "warn" : undefined}
                  />
                </div>
                {(supervision.data?.anomalies.length ?? 0) > 0 && (
                  <ul className="mt-3 space-y-1">
                    {supervision.data?.anomalies.slice(0, 4).map((a, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-amber-700">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        <span>
                          <strong>{a.label}</strong> — {a.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-[10px] text-slate-400">
                  Santé plateforme : {supervision.data?.platformHealth.overall ?? "—"} · Alertes ouvertes :{" "}
                  {supervision.data?.alerts.total ?? 0}
                </p>
              </>
            )}
          </div>

          {/* Moteur 1 — Intelligence & Décision (PDG uniquement) */}
          {isPdg && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Brain size={16} className="text-violet-600" />
                <h2 className="text-sm font-black text-slate-900">Intelligence &amp; Décision</h2>
                <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                  PDG uniquement
                </span>
              </div>
              {intelligence.isLoading ? (
                <p className="text-xs text-slate-400">Préparation des recommandations…</p>
              ) : (
                <>
                  <p className="text-xs text-slate-600">
                    <strong>{intelligence.data?.pendingDecisions ?? 0}</strong> proposition(s) en attente de votre validation.
                  </p>
                  <ul className="mt-2 space-y-1">
                    {(intelligence.data?.recommendations ?? []).slice(0, 4).map((r) => (
                      <li key={r.id} className="text-[11px] text-slate-600">
                        • <strong>{r.title}</strong>{" "}
                        <span className="text-slate-400">({r.category}, impact {r.impact ?? "n/c"})</span>
                      </li>
                    ))}
                    {(intelligence.data?.recommendations.length ?? 0) === 0 && (
                      <li className="text-[11px] text-slate-400">Aucune proposition en attente.</li>
                    )}
                  </ul>
                  <Link
                    to="/superadmin/smart-engine"
                    className="mt-2 inline-block text-[11px] font-semibold text-violet-700 underline"
                  >
                    Ouvrir le Système Intelligent pour valider →
                  </Link>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Lecture seule — aucune action sensible n'est appliquée sans votre validation.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bandeau synthèse — cases cliquables (filtres) */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <StatCard
              label="Moteurs"
              value={stats.data?.totalEngines ?? engines.length}
              selected={quick === "all" && stateFilter === "all"}
              onClick={() => {
                setQuick("all");
                setStateFilter("all");
              }}
            />
            <StatCard
              label="Actifs"
              value={stats.data?.activeEngines ?? activeCount}
              selected={quick === "active"}
              onClick={() => {
                setStateFilter("all");
                setQuick((q) => (q === "active" ? "all" : "active"));
              }}
            />
            <StatCard
              label="Dégradés / HS"
              value={degradedCount}
              tone="warn"
              selected={quick === "degraded"}
              onClick={() => {
                setStateFilter("all");
                setQuick((q) => (q === "degraded" ? "all" : "degraded"));
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            {!isPdg && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700">
                <ShieldAlert size={13} /> Lecture seule (Directeur)
              </span>
            )}
            <button
              onClick={() => {
                list.refetch();
                stats.refetch();
              }}
              disabled={list.isFetching || stats.isFetching}
              className="flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 disabled:opacity-60"
            >
              <RefreshCw size={12} className={list.isFetching || stats.isFetching ? "animate-spin" : ""} />
              {list.isFetching || stats.isFetching ? "Actualisation…" : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* Diagnostic actionnable des moteurs dégradés/HS */}
        <DiagnosticPanel isPdg={isPdg} />

        {/* Réconciliation des états sur preuve d'audit (jamais sur déclaration) */}
        {isPdg && <ReconciliationSurPreuve />}

        {/* Point 41 — registre complet : les 5 états opérationnels réels */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-baseline gap-2">
            <h2 className="text-sm font-black text-slate-900">État opérationnel réel</h2>
            <span className="text-[11px] text-slate-400">
              Calculé à partir de la santé, du dernier signal et des dépendances — jamais déclaré.
            </span>
          </div>
          {overview.isLoading ? (
            <p className="text-xs text-slate-400">Analyse du registre…</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {OP_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={opFilter === s}
                    onClick={() => setOpFilter((f) => (f === s ? "all" : s))}
                    className={`rounded-xl border px-3 py-2 text-left transition hover:shadow-sm ${OP_STYLE[s]} ${
                      opFilter === s ? "ring-2 ring-[#111]" : ""
                    }`}
                  >
                    <p className="text-lg font-black leading-none">
                      {overview.data?.parEtat[s] ?? 0}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold">{OP_LABEL[s]}</p>
                  </button>
                ))}
              </div>
              {(overview.data?.dependancesEnDefaut.length ?? 0) > 0 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[11px] font-bold text-amber-800">
                    {overview.data?.dependancesEnDefaut.length} moteur(s) avec une dépendance en défaut :
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {overview.data?.dependancesEnDefaut.slice(0, 6).map((m) => (
                      <li key={m.name} className="text-[11px] text-amber-700">
                        <strong>{m.label}</strong> — {m.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Options : recherche + filtre par état */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(ev) => setSearch(ev.target.value)}
              placeholder="Rechercher un moteur…"
              className="w-56 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 outline-none focus:border-slate-400"
            />
          </div>
          {(["all", ...STATE_ORDER] as (EngineState | "all")[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuick("all");
                setStateFilter(s);
              }}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                stateFilter === s
                  ? "border-[#111] bg-[#111] text-[#D4AF37]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s === "all" ? "Tous les états" : STATE_LABEL[s]}
            </button>
          ))}
          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
            >
              <X size={12} /> Réinitialiser
            </button>
          )}
          <span className="text-xs text-slate-400">
            {filtered.length} / {engines.length} moteur{engines.length > 1 ? "s" : ""}
          </span>
        </div>

        {list.isLoading && (
          <p className="py-10 text-center text-sm text-slate-400">Chargement des moteurs…</p>
        )}

        {!list.isLoading && engines.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            Aucun moteur enregistré pour le moment.
          </p>
        )}

        {!list.isLoading && engines.length > 0 && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            Aucun moteur ne correspond à ce filtre.{" "}
            <button onClick={resetFilters} className="font-semibold text-slate-600 underline">
              Réinitialiser
            </button>
          </p>
        )}

        {families.map((fam) => {
          const rows = filtered.filter((e) => e.category === fam.key).sort(sortInFamily);
          if (rows.length === 0) return null;
          return (
            <section key={fam.key} className="mb-7">
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">
                  {fam.title}
                </h2>
                <span className="text-xs text-slate-400">
                  {rows.length} · {fam.subtitle}
                </span>
              </div>
              <div className="space-y-3">
                {rows.map((e, idx) => {
                  const state = (e.state ?? "disabled") as EngineState;
                  const route = CONTROL_ROUTE[e.name];
                  return (
                    <div
                      key={e.name}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#111] text-xs font-black text-[#D4AF37]">
                            #{idx + 1}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{e.label}</h3>
                            <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                              {e.name} · v{e.version}
                            </p>
                            {e.description && (
                              <p className="mt-1 max-w-xl text-xs text-slate-500">{e.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${STATE_STYLE[state]}`}
                          >
                            {STATE_LABEL[state]}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                            <span className={`h-2 w-2 rounded-full ${HEALTH_STYLE[e.health] ?? HEALTH_STYLE.unknown}`} />
                            {HEALTH_LABEL[e.health] ?? e.health}
                          </span>
                          {(() => {
                            const r = readiness.get(e.name);
                            if (!r) return null;
                            const op = r.operational as OperationalState;
                            return (
                              <span
                                title={r.reason}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${OP_STYLE[op]}`}
                              >
                                {OP_LABEL[op]}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {readiness.get(e.name) && (
                        <p className="mt-2 text-[11px] text-slate-500">
                          {readiness.get(e.name)?.reason}
                        </p>
                      )}

                      <div className="mt-3 grid gap-x-6 gap-y-1 text-xs text-slate-600 sm:grid-cols-2">
                        <p>
                          <span className="text-slate-400">Connecté à : </span>
                          {e.dependencies?.length ? e.dependencies.join(", ") : "—"}
                        </p>
                        <p>
                          <Network size={11} className="mr-1 inline text-slate-400" />
                          <span className="text-slate-400">Moteurs qui en dépendent : </span>
                          {graphByName.get(e.name)?.requiredBy.length
                            ? graphByName.get(e.name)?.requiredBy.join(", ")
                            : "aucun"}
                        </p>
                        <p className="flex items-center gap-1">
                          <Activity size={11} className="text-slate-400" />
                          <span className="text-slate-400">Dernier signal : </span>
                          {e.lastHeartbeat
                            ? new Date(e.lastHeartbeat).toLocaleString("fr-FR")
                            : "—"}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                        {route && (
                          <Link
                            to={route}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#111] px-3 py-1.5 text-xs font-semibold text-[#D4AF37]"
                          >
                            <ExternalLink size={12} /> Centre de contrôle
                          </Link>
                        )}

                        {isPdg ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {STATE_ORDER.filter((s) => s !== state).map((s) => (
                              <button
                                key={s}
                                disabled={setState.isPending}
                                onClick={() =>
                                  setState.mutate({ name: e.name, state: s, confirm: false })
                                }
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                              >
                                {STATE_LABEL[s]}
                              </button>
                            ))}
                            <button
                              disabled={revert.isPending}
                              onClick={() => revert.mutate({ name: e.name })}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                            >
                              <Undo2 size={12} /> État précédent
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Contrôle d'état réservé au PDG.
                          </span>
                        )}
                      </div>

                      {revertMsg && revertMsg.startsWith(e.name) && (
                        <p className="mt-2 rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                          {revertMsg}
                        </p>
                      )}

                      {/* Point 43 — avis d'impact : rien n'est appliqué sans confirmation. */}
                      {pending?.name === e.name && (
                        <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
                          <p className="text-[11px] font-bold text-amber-800">
                            Passer ce moteur en « {STATE_LABEL[pending.state]} » touche d'autres moteurs.
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {pending.blocages.map((b, i) => (
                              <li key={`b${i}`} className="text-[11px] font-semibold text-red-700">
                                {b}
                              </li>
                            ))}
                            {pending.avertissements.map((a, i) => (
                              <li key={`a${i}`} className="text-[11px] text-amber-700">
                                {a}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {pending.blocages.length === 0 && (
                              <button
                                disabled={setState.isPending}
                                onClick={() =>
                                  setState.mutate({
                                    name: pending.name,
                                    state: pending.state,
                                    confirm: true,
                                  })
                                }
                                className="rounded-lg bg-[#111] px-2.5 py-1 text-[11px] font-bold text-[#D4AF37] disabled:opacity-50"
                              >
                                Je confirme malgré l'impact
                              </button>
                            )}
                            <button
                              onClick={() => setPending(null)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Points 43-44 — anomalies consolidées du registre */}
        <AnomaliesSection />

        {/* Point 42 — journal des modifications d'agents */}
        <AgentChangesSection isPdg={isPdg} />

        <p className="mt-2 text-center text-[11px] text-slate-400">
          Chaque moteur gère uniquement son périmètre et reste connecté au moteur principal.
          Les sous-sections en « préproduction » sont déclarées et isolables ; leur logique
          dédiée sera développée moteur par moteur.
        </p>
      </div>
    </div>
  );
}

const ANOMALY_STYLE: Record<string, string> = {
  critique: "border-red-200 bg-red-50 text-red-700",
  important: "border-amber-200 bg-amber-50 text-amber-700",
  a_surveiller: "border-slate-200 bg-slate-50 text-slate-600",
};

const ANOMALY_SEVERITY_LABEL: Record<string, string> = {
  critique: "Critique",
  important: "Important",
  a_surveiller: "À surveiller",
};

/**
 * Anomalies consolidées du registre (points 43-44) : dépendances manquantes,
 * dépendances circulaires, moteurs hors service, signaux périmés. Une liste
 * vide veut dire « aucune anomalie relevée », pas « tout est parfait ».
 */
function AnomaliesSection() {
  const anomalies = trpc.engineRegistry.anomalies.useQuery(undefined, {
    refetchInterval: 60000,
  });
  const graph = trpc.engineRegistry.dependencyGraph.useQuery();
  const [severity, setSeverity] = useState<string>("all");

  const rows = (anomalies.data?.anomalies ?? []).filter(
    (a) => severity === "all" || a.severite === severity,
  );

  return (
    <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <AlertTriangle size={16} className="text-amber-600" />
        <h2 className="text-sm font-black text-slate-900">Anomalies du registre</h2>
        <span className="text-[11px] text-slate-400">
          Dépendances manquantes ou circulaires, moteurs coupés, signaux trop anciens.
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {["all", "critique", "important", "a_surveiller"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeverity(s)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
              severity === s
                ? "border-[#111] bg-[#111] text-[#D4AF37]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s === "all"
              ? `Toutes (${anomalies.data?.anomalies.length ?? 0})`
              : `${ANOMALY_SEVERITY_LABEL[s]} (${anomalies.data?.parSeverite[s] ?? 0})`}
          </button>
        ))}
      </div>

      {(graph.data?.cycles.length ?? 0) > 0 && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-[11px] font-bold text-red-800">
            Dépendance circulaire détectée — aucun ordre de démarrage n'est possible :
          </p>
          {graph.data?.cycles.map((c, i) => (
            <p key={i} className="font-mono text-[11px] text-red-700">
              {c.join(" → ")}
            </p>
          ))}
        </div>
      )}

      {anomalies.isLoading ? (
        <p className="text-xs text-slate-400">Analyse du registre…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-400">
          Aucune anomalie relevée pour ce filtre.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((a, i) => (
            <li
              key={i}
              className={`rounded-xl border px-3 py-2 text-[11px] ${
                ANOMALY_STYLE[a.severite] ?? ANOMALY_STYLE.a_surveiller
              }`}
            >
              <span className="font-bold">{ANOMALY_SEVERITY_LABEL[a.severite] ?? a.severite}</span>
              {" · "}
              <span className="font-mono">{a.code}</span>
              {a.engine ? ` · ${a.engine}` : ""} — {a.detail}
            </li>
          ))}
        </ul>
      )}

      {(graph.data?.missing.length ?? 0) > 0 && (
        <p className="mt-2 text-[10px] text-slate-500">
          {graph.data?.missing.length} dépendance(s) déclarée(s) vers un moteur absent du
          registre : elles ne pourront jamais être satisfaites en l'état.
        </p>
      )}
    </section>
  );
}

/**
 * Réconciliation des états sur preuve.
 *
 * Un moteur ne passe `active` que si l'audit d'activation l'a prouvé
 * opérationnel (procédure exposée, signal reçu, données réelles, test réussi).
 * Les moteurs refusés sont affichés avec le manque exact — c'est ce qui évite
 * qu'un moteur soit peint en vert parce que son code existe.
 */
function ReconciliationSurPreuve() {
  const utils = trpc.useUtils();
  const reconcilier = trpc.engineRegistry.reconcilierSurPreuve.useMutation({
    onSettled: () => {
      utils.engineRegistry.list.invalidate();
      utils.engineRegistry.stats.invalidate();
      utils.engineRegistry.readiness.invalidate();
    },
  });
  const rapport = reconcilier.data;

  return (
    <div
      data-testid="engine-reconciliation"
      className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-slate-900">Activation sur preuve</h2>
          <p className="text-[11px] text-slate-500">
            Aucun moteur n'est activé parce que son code existe : il faut une procédure
            exposée, un signal reçu, des données réelles et un test réussi.
          </p>
        </div>
        <button
          type="button"
          data-testid="engine-reconciliation-run"
          onClick={() => reconcilier.mutate({ executerAudit: true })}
          disabled={reconcilier.isPending}
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {reconcilier.isPending ? "Audit en cours…" : "Auditer et activer ce qui est prouvé"}
        </button>
      </div>

      {reconcilier.error && (
        <p className="rounded-xl bg-rose-50 p-2 text-xs font-semibold text-rose-700">
          {reconcilier.error.message}
        </p>
      )}

      {rapport && (
        <div className="space-y-2 text-xs">
          {rapport.source === "aucun_audit" ? (
            <p className="rounded-xl bg-amber-50 p-2 text-amber-800">
              Aucun audit d'activation disponible : aucun état n'a été modifié.
            </p>
          ) : (
            <p className="text-slate-500">
              Audit du {new Date(rapport.auditDate ?? "").toLocaleString("fr-FR")}
            </p>
          )}
          <p className="font-semibold text-emerald-700">
            {rapport.promus.length === 0
              ? "Aucun moteur ne remplit encore toutes les conditions d'activation."
              : `Activés sur preuve : ${rapport.promus.join(", ")}`}
          </p>
          {rapport.refuses.length > 0 && (
            <ul className="space-y-1">
              {rapport.refuses.map((r) => (
                <li key={r.moteur} className="rounded-xl border border-slate-200 p-2">
                  <span className="font-bold text-slate-800">{r.moteur}</span>{" "}
                  <span className="text-slate-400">({r.etat})</span>
                  <p className="text-slate-600">{r.manque}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Journal des modifications d'agents (point 42).
 *
 * Chaque intervention est tracée avec son auteur, sa preuve d'application en
 * base et sa procédure de retour arrière. Aucune modification ne se valide
 * toute seule : la décision reste au PDG.
 */
function AgentChangesSection({ isPdg }: { isPdg: boolean }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const utils = trpc.useUtils();
  const stats = trpc.engineRegistry.agentChangeStats.useQuery();
  const changes = trpc.engineRegistry.agentChanges.useQuery({
    limit: 50,
    ...(statusFilter === "all"
      ? {}
      : { status: statusFilter as "declaree" | "validee" | "rejetee" | "annulee" }),
  });
  const review = trpc.engineRegistry.reviewAgentChange.useMutation({
    onSettled: () => {
      utils.engineRegistry.agentChanges.invalidate();
      utils.engineRegistry.agentChangeStats.invalidate();
    },
  });

  const rows = changes.data ?? [];

  return (
    <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <History size={16} className="text-slate-500" />
        <h2 className="text-sm font-black text-slate-900">Journal des modifications</h2>
        <span className="text-[11px] text-slate-400">
          Ce qui a réellement été modifié sur la plateforme, par qui, et comment le défaire.
        </span>
      </div>

      {stats.data && (
        <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700">
            {stats.data.total} modification(s)
          </span>
          <span className="rounded-lg bg-amber-100 px-2 py-1 font-semibold text-amber-700">
            {stats.data.enAttenteDeValidation} en attente de validation
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-600">
            {stats.data.sansRetourArriere} sans retour arrière documenté
          </span>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {["all", "declaree", "validee", "rejetee", "annulee"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
              statusFilter === s
                ? "border-[#111] bg-[#111] text-[#D4AF37]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s === "all" ? "Toutes" : CHANGE_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {changes.isLoading ? (
        <p className="text-xs text-slate-400">Lecture du journal…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-400">
          Aucune modification enregistrée pour ce filtre. Le journal ne montre que des
          modifications réellement constatées.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">{c.title}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                    {c.kind} · {c.reference}
                    {c.engineName ? ` · ${c.engineName}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      CHANGE_STATUS_STYLE[c.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {CHANGE_STATUS_LABEL[c.status] ?? c.status}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.appliedInDb ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.appliedInDb ? "Appliquée en base" : "Application non constatée"}
                  </span>
                </div>
              </div>

              {c.detail && <p className="mt-1 text-[11px] text-slate-600">{c.detail}</p>}
              <p className="mt-1 text-[10px] text-slate-400">
                Par {c.agent} · {new Date(c.createdAt).toLocaleString("fr-FR")}
                {c.appliedAt ? ` · appliquée le ${new Date(c.appliedAt).toLocaleString("fr-FR")}` : ""}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                {c.rollbackPlan
                  ? `Retour arrière : ${c.rollbackPlan}`
                  : "Retour arrière non documenté — à demander à l'auteur avant toute annulation."}
              </p>
              {c.reviewNote && (
                <p className="mt-1 text-[10px] text-slate-500">Décision : {c.reviewNote}</p>
              )}

              {isPdg && c.status === "declaree" && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: c.id, decision: "validee" })}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-50"
                  >
                    Valider
                  </button>
                  <button
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: c.id, decision: "rejetee" })}
                    className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-bold text-red-700 disabled:opacity-50"
                  >
                    Rejeter
                  </button>
                  <button
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: c.id, decision: "annulee" })}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 disabled:opacity-50"
                  >
                    Marquer annulée
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {!isPdg && (
        <p className="mt-2 text-[10px] text-slate-400">
          Lecture seule (Directeur) — la validation d'une modification est réservée au PDG.
        </p>
      )}
    </section>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warn";
}) {
  return (
    <div
      className={`rounded-lg border px-2 py-1.5 ${
        tone === "warn" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className={`text-lg font-black ${tone === "warn" ? "text-amber-700" : "text-slate-900"}`}>
        {value}
      </p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  selected,
  onClick,
}: {
  label: string;
  value: number;
  tone?: "warn";
  selected?: boolean;
  onClick?: () => void;
}) {
  const base =
    tone === "warn"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-white";
  const ring = selected
    ? tone === "warn"
      ? "ring-2 ring-amber-400 border-amber-400"
      : "ring-2 ring-[#111] border-[#111]"
    : "";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border px-4 py-2 text-left transition hover:shadow-sm active:scale-[0.98] ${base} ${ring}`}
    >
      <p className={`text-[11px] ${tone === "warn" ? "text-amber-600" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`text-xl font-black ${tone === "warn" ? "text-amber-700" : "text-slate-900"}`}>
        {value}
      </p>
    </button>
  );
}
