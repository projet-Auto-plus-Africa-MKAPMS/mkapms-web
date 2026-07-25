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
import {
  Cpu,
  ChevronLeft,
  RefreshCw,
  Activity,
  ExternalLink,
  ShieldAlert,
  Search,
  X,
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
  smart: 6,
  redirection: 7,
  payment: 8,
  search: 9,
  workflow: 10,
  knowledge: 11,
  monitoring: 12,
  analytics: 13,
  seo: 14,
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
  const utils = trpc.useUtils();
  const setState = trpc.engineRegistry.setState.useMutation({
    onSettled: () => {
      utils.engineRegistry.list.invalidate();
      utils.engineRegistry.stats.invalidate();
    },
  });

  // Filtres du tableau de bord (cases cliquables + recherche + état).
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [stateFilter, setStateFilter] = useState<EngineState | "all">("all");
  const [search, setSearch] = useState("");

  const engines = (list.data ?? []) as EngineRow[];

  const degradedCount = useMemo(
    () => engines.filter((e) => e.health === "degraded" || e.health === "down").length,
    [engines],
  );
  const activeCount = useMemo(
    () => engines.filter((e) => e.state === "active").length,
    [engines],
  );

  const matchesFilters = (e: EngineRow) => {
    if (quick === "active" && e.state !== "active") return false;
    if (quick === "degraded" && !(e.health === "degraded" || e.health === "down")) return false;
    if (stateFilter !== "all" && e.state !== stateFilter) return false;
    const q = search.trim().toLowerCase();
    if (q && !(`${e.label} ${e.name} ${e.description ?? ""}`.toLowerCase().includes(q)))
      return false;
    return true;
  };
  const filtered = engines.filter(matchesFilters);
  const hasActiveFilter = quick !== "all" || stateFilter !== "all" || search.trim() !== "";
  const resetFilters = () => {
    setQuick("all");
    setStateFilter("all");
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
                        </div>
                      </div>

                      <div className="mt-3 grid gap-x-6 gap-y-1 text-xs text-slate-600 sm:grid-cols-2">
                        <p>
                          <span className="text-slate-400">Connecté à : </span>
                          {e.dependencies?.length ? e.dependencies.join(", ") : "—"}
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
                                onClick={() => setState.mutate({ name: e.name, state: s })}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                              >
                                {STATE_LABEL[s]}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Contrôle d'état réservé au PDG.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <p className="mt-2 text-center text-[11px] text-slate-400">
          Chaque moteur gère uniquement son périmètre et reste connecté au moteur principal.
          Les sous-sections en « préproduction » sont déclarées et isolables ; leur logique
          dédiée sera développée moteur par moteur.
        </p>
      </div>
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
