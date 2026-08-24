/**
 * Centre de Contrôle — Moteur de Redirection MKA.P-MS (Redirection Engine)
 *
 * Page réservée : PDG uniquement (super_admin).
 *
 * Permet de gérer les redirections de la plateforme sans câblage en dur :
 * - créer / modifier / activer / supprimer des règles (clé → destination)
 * - voir les statistiques (règles, redirections servies, clés sans règle)
 * - repérer les clés demandées sans règle (à configurer)
 * - consulter le journal des résolutions
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import {
  Route as RouteIcon,
  ChevronLeft,
  BarChart3,
  ListChecks,
  Database,
  Plus,
  Trash2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  AlertTriangle,
  Network,
} from "lucide-react";

type Tab = "dashboard" | "couverture" | "rules" | "logs";

const TABS: { key: Tab; label: string; icon: typeof RouteIcon }[] = [
  { key: "dashboard", label: "Vue d'ensemble", icon: BarChart3 },
  { key: "couverture", label: "Couverture", icon: Network },
  { key: "rules", label: "Règles", icon: ListChecks },
  { key: "logs", label: "Journal", icon: Database },
];

const ETAT_ZONE: Record<string, { label: string; cage: string; point: string }> = {
  branchee: { label: "Branchée", cage: "border-green-200 bg-green-50", point: "bg-green-500" },
  partielle: { label: "Partielle", cage: "border-amber-200 bg-amber-50", point: "bg-amber-500" },
  absente: { label: "Non branchée", cage: "border-red-200 bg-red-50", point: "bg-red-500" },
};

const KIND_LABEL: Record<string, string> = {
  button: "Bouton",
  service: "Service",
  route: "Route",
};

const OUTCOME_LABEL: Record<string, string> = {
  unmatched: "Sans règle",
  not_found: "404",
  error: "Erreur",
};

export default function RedirectionEngineControlCenter() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  // Accès PDG uniquement
  if (!user || user.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="flex items-center gap-1 text-sm text-white/60 mb-3">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <RouteIcon size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Moteur de Redirection MKA.P-MS</h1>
            <p className="text-xs text-white/50">Centre de contrôle — redirections centralisées</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                tab === t.key ? "bg-[#D4AF37] text-white" : "bg-white text-[#374151] border border-[#E5E7EB]"
              }`}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="px-4">
        {tab === "dashboard" && <DashboardTab onGoRules={() => setTab("rules")} />}
        {tab === "couverture" && <CouvertureTab />}
        {tab === "rules" && <RulesTab />}
        {tab === "logs" && <LogsTab />}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-10">
      <RefreshCw className="animate-spin text-[#D4AF37]" size={24} />
    </div>
  );
}

/**
 * Couverture réelle du moteur : quelles zones de la plateforme lui sont
 * branchées, et ce qui manque — nommé au lieu d'être supposé sain.
 */
function CouvertureTab() {
  const q = trpc.redirectionEngine.couverture.useQuery(undefined, { refetchInterval: 30000 });
  const a = q.data;

  if (q.isLoading) return <Loading />;
  if (!a) return <p className="py-6 text-sm text-[#6B7280]">Audit indisponible.</p>;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
        <h2 className="text-base font-bold text-[#111]">Couverture du moteur</h2>
        <p className="mt-1 text-xs text-[#374151]">{a.resume}</p>
        <p className="mt-1 text-[10px] text-[#9CA3AF]">
          {a.reglesActives} règle(s) active(s) · audit du {new Date(a.genereLe).toLocaleString("fr-FR")}
        </p>
      </div>

      <div className="space-y-2">
        {a.zones.map((z) => {
          const e = ETAT_ZONE[z.etat] ?? ETAT_ZONE.absente;
          return (
            <div key={z.code} className={`rounded-xl border p-3 ${e.cage}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.point}`} />
                  <div>
                    <p className="text-sm font-bold text-[#111]">{z.label}</p>
                    <p className="text-[11px] text-[#6B7280]">
                      {z.presentes} règle(s) active(s) sur {z.attendu} prévue(s) au catalogue
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-bold uppercase text-[#374151]">{e.label}</span>
              </div>
              {z.manque && <p className="mt-1.5 text-[11px] text-[#B45309]">{z.manque}</p>}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          <h3 className="text-sm font-bold text-[#111]">Destinations inexistantes</h3>
        </div>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          Règles actives qui envoient le visiteur vers une page absente de la plateforme : le moteur casse le
          parcours au lieu de le sauver.
        </p>
        {a.reglesCassees.length === 0 ? (
          <p className="mt-2 text-sm text-green-600">Toutes les destinations correspondent à une page réelle.</p>
        ) : (
          <div className="mt-2 space-y-1">
            {a.reglesCassees.map((r) => (
              <div key={r.key} className="rounded-lg bg-[#FEF2F2] px-2 py-1.5">
                <code className="text-xs text-[#111]">{r.key}</code>
                <p className="text-[11px] text-red-600">{r.motif}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
        <h3 className="text-sm font-bold text-[#111]">Clés sans règle (30 j)</h3>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          Clés prévues au catalogue mais absentes de la base, ou réclamées par la plateforme sans réponse.
        </p>
        {a.clesSansRegle.length === 0 ? (
          <p className="mt-2 text-sm text-green-600">Aucune clé sans règle.</p>
        ) : (
          <div className="mt-2 space-y-1">
            {a.clesSansRegle.map((c) => (
              <div key={c.key} className="flex items-center justify-between rounded-lg bg-[#F5F3EF] px-2 py-1.5">
                <div className="min-w-0">
                  <code className="text-xs text-[#111]">{c.key}</code>
                  {c.label && <p className="truncate text-[10px] text-[#6B7280]">{c.label}</p>}
                </div>
                <span className="shrink-0 text-[10px] font-bold text-[#6B7280]">
                  {c.origine === "catalogue" ? "catalogue" : `${c.demandes}× demandée`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
        <h3 className="text-sm font-bold text-[#111]">Pages introuvables non résolues (30 j)</h3>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          Chemins visités sans alias : le moteur n'a rien pu proposer. Une suggestion n'apparaît que si une page
          réelle correspond — sinon aucune, plutôt qu'une redirection au hasard.
        </p>
        {a.routes404.length === 0 ? (
          <p className="mt-2 text-sm text-green-600">Aucune page introuvable non résolue.</p>
        ) : (
          <div className="mt-2 space-y-1">
            {a.routes404.map((r) => (
              <div key={r.chemin} className="rounded-lg bg-[#F5F3EF] px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <code className="truncate text-xs text-[#111]">{r.chemin}</code>
                  <span className="shrink-0 text-[10px] font-bold text-[#6B7280]">{r.occurrences}×</span>
                </div>
                <p className="text-[10px] text-[#6B7280]">
                  {r.suggestion ? `Destination possible : ${r.suggestion}` : "Aucune destination sûre identifiée."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardTab({ onGoRules }: { onGoRules: () => void }) {
  const stats = trpc.redirectionEngine.stats.useQuery(undefined, { refetchInterval: 15000 });
  const broken = trpc.redirectionEngine.broken.useQuery({ limit: 30 }, { refetchInterval: 15000 });
  const s = stats.data;

  const cards = [
    { label: "Règles", value: s?.totalRules ?? 0 },
    { label: "Règles actives", value: s?.activeRules ?? 0 },
    { label: "Redirections servies", value: s?.totalHits ?? 0 },
    { label: "Résolutions (24h)", value: s?.resolutions24h ?? 0 },
    { label: "Pages introuvables (24h)", value: s?.notFound24h ?? 0 },
    { label: "404 auto-résolus (24h)", value: s?.autoHealed24h ?? 0 },
    { label: "Erreurs (24h)", value: s?.errors24h ?? 0 },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#111]">Vue d'ensemble</h2>
      {stats.isLoading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                <p className="text-[11px] text-[#6B7280]">{c.label}</p>
                <p className="text-2xl font-black text-[#111]">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-[#D4AF37]" />
              <h3 className="text-sm font-bold text-[#111]">Clés sans règle (7 j)</h3>
            </div>
            <p className="mt-1 text-[11px] text-[#6B7280]">
              Clés demandées par la plateforme mais sans règle active. Crée une règle pour les diriger.
            </p>
            {(s?.unmatchedKeys?.length ?? 0) === 0 ? (
              <p className="mt-2 text-sm text-green-600">Aucune clé sans règle. Tout est couvert.</p>
            ) : (
              <div className="mt-2 space-y-1">
                {s!.unmatchedKeys.map((u: any) => (
                  <div key={u.key} className="flex items-center justify-between rounded-lg bg-[#F5F3EF] px-2 py-1.5">
                    <code className="text-xs text-[#111]">{u.key}</code>
                    <span className="text-[10px] font-bold text-[#6B7280]">{u.count}×</span>
                  </div>
                ))}
                <button onClick={onGoRules} className="mt-1 text-[11px] font-semibold text-blue-600 underline">
                  Configurer des règles →
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="text-sm font-bold text-[#111]">Redirections cassées (7 j)</h3>
            </div>
            <p className="mt-1 text-[11px] text-[#6B7280]">
              Parcours en échec remontés automatiquement : pages introuvables (404), clés sans règle et erreurs.
            </p>
            {(broken.data?.length ?? 0) === 0 ? (
              <p className="mt-2 text-sm text-green-600">Aucune redirection cassée. Tous les parcours aboutissent.</p>
            ) : (
              <div className="mt-2 space-y-1">
                {broken.data!.map((b, i) => (
                  <div key={`${b.key}-${b.source}-${i}`} className="rounded-lg bg-[#FEF2F2] px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <code className="truncate text-xs text-[#111]">{b.key}</code>
                      <span className="shrink-0 text-[10px] font-bold text-red-600">
                        {OUTCOME_LABEL[b.outcome ?? ""] ?? b.outcome} · {b.count}×
                      </span>
                    </div>
                    {b.source && <p className="truncate text-[10px] text-[#6B7280]">depuis {b.source}</p>}
                    {b.lastError && <p className="truncate text-[10px] text-red-500">{b.lastError}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  key: "",
  label: "",
  kind: "button",
  target: "",
  external: false,
  priority: 0,
  description: "",
};

function RulesTab() {
  const rules = trpc.redirectionEngine.rules.useQuery(undefined, { refetchInterval: 15000 });
  const utils = trpc.useUtils();
  const refresh = () => {
    utils.redirectionEngine.rules.invalidate();
    utils.redirectionEngine.stats.invalidate();
  };
  const create = trpc.redirectionEngine.createRule.useMutation({ onSuccess: refresh });
  const update = trpc.redirectionEngine.updateRule.useMutation({ onSuccess: refresh });
  const del = trpc.redirectionEngine.deleteRule.useMutation({ onSuccess: refresh });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const items = rules.data ?? [];

  function submit() {
    if (!form.key.trim() || !form.label.trim() || !form.target.trim() || create.isPending) return;
    create.mutate(
      {
        key: form.key.trim(),
        label: form.label.trim(),
        kind: form.kind as any,
        target: form.target.trim(),
        external: form.external,
        priority: Number(form.priority) || 0,
        description: form.description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setForm({ ...EMPTY_FORM });
          setShowForm(false);
        },
      },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111]">Règles de redirection</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-xl bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white"
        >
          <Plus size={14} /> Nouvelle règle
        </button>
      </div>

      {create.error && <p className="text-xs text-red-600">{create.error.message}</p>}

      {showForm && (
        <div className="space-y-2 rounded-xl border border-[#E5E7EB] bg-white p-3">
          <input
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            placeholder="Clé unique (ex: bouton_devenir_pro)"
            className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
          />
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Libellé lisible (ex: Bouton « Devenir pro »)"
            className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value })}
              className="flex-1 rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
            >
              <option value="button">Bouton</option>
              <option value="service">Service</option>
              <option value="route">Route</option>
            </select>
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              placeholder="Priorité"
              className="w-24 rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
            />
          </div>
          <input
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
            placeholder="Destination (/abonnements ou https://…)"
            className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-[#374151]">
            <input
              type="checkbox"
              checked={form.external}
              onChange={(e) => setForm({ ...form, external: e.target.checked })}
            />
            Lien externe (ouvrir dans un nouvel onglet)
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            placeholder="Description (optionnel)"
            className="w-full resize-none rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
          />
          <button
            onClick={submit}
            disabled={create.isPending || !form.key.trim() || !form.label.trim() || !form.target.trim()}
            className="w-full rounded-lg bg-[#111] py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            Enregistrer la règle
          </button>
        </div>
      )}

      {rules.isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#6B7280]">
          <RouteIcon size={28} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2">Aucune règle. Crée la première pour centraliser une redirection.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r: any) => (
            <div key={r.id} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[10px] font-bold text-[#374151]">
                      {KIND_LABEL[r.kind] ?? r.kind}
                    </span>
                    <span className="text-sm font-bold text-[#111]">{r.label}</span>
                  </div>
                  <code className="mt-1 block truncate text-[11px] text-[#6B7280]">{r.key}</code>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#374151]">
                    → {r.target} {r.external && <ExternalLink size={11} className="text-[#6B7280]" />}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#9CA3AF]">
                    {r.hitCount ?? 0} redirection(s) · priorité {r.priority ?? 0}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    onClick={() => update.mutate({ id: r.id, active: !r.active })}
                    className={`flex items-center gap-1 text-[11px] font-bold ${r.active ? "text-green-600" : "text-gray-400"}`}
                  >
                    {r.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {r.active ? "Actif" : "Inactif"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer la règle « ${r.label} » ?`)) del.mutate({ id: r.id });
                    }}
                    className="text-[#DC2626]"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogsTab() {
  const logs = trpc.redirectionEngine.logs.useQuery({ limit: 200 }, { refetchInterval: 15000 });
  const items = logs.data ?? [];

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#111]">Journal des résolutions</h2>
      {logs.isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#6B7280]">Aucune résolution enregistrée pour l'instant.</p>
      ) : (
        <div className="space-y-1">
          {items.map((l: any) => (
            <div
              key={l.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <code className="block truncate text-xs text-[#111]">{l.key}</code>
                {l.resolvedTo && <span className="block truncate text-[10px] text-[#6B7280]">→ {l.resolvedTo}</span>}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  l.matched ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {l.matched ? "Résolu" : "Sans règle"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
