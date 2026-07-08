/**
 * Centre de Contrôle Intelligent — Système Intelligent MKA.P-MS
 *
 * Page réservée : PDG uniquement (super_admin).
 *
 * Affiche :
 * - Recherches sans résultat
 * - Données à valider
 * - Doublons détectés
 * - Faux comptes suspects
 * - Annonces suspectes
 * - Erreurs détectées
 * - Recommandations
 * - Activité en temps réel
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import {
  Brain,
  ChevronLeft,
  AlertTriangle,
  Search,
  Activity,
  Shield,
  Eye,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  Star,
  BarChart3,
  FileWarning,
  Users,
  Layers,
} from "lucide-react";

type Tab = "dashboard" | "recherches" | "doublons" | "suspects" | "annonces" | "badges" | "sante" | "journal" | "validations" | "avis" | "comportement";

const TABS: { key: Tab; label: string; icon: typeof Brain }[] = [
  { key: "dashboard", label: "Vue d'ensemble", icon: BarChart3 },
  { key: "recherches", label: "Recherches", icon: Search },
  { key: "doublons", label: "Doublons", icon: Layers },
  { key: "suspects", label: "Comptes suspects", icon: Users },
  { key: "annonces", label: "Annonces", icon: FileWarning },
  { key: "badges", label: "Badges", icon: Star },
  { key: "sante", label: "Santé plateforme", icon: Activity },
  { key: "journal", label: "Journal", icon: Database },
  { key: "validations", label: "Validations", icon: CheckCircle2 },
  { key: "avis", label: "Avis", icon: Eye },
  { key: "comportement", label: "Comportement", icon: Activity },
];

export default function ControlCenter() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  // Accès PDG uniquement
  if (!user || user.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-white/60 mb-3">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <Brain size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Système Intelligent MKA.P-MS</h1>
            <p className="text-xs text-white/50">Centre de contrôle — MKA.P-MS Smart Engine</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                tab === t.key
                  ? "bg-[#D4AF37] text-white"
                  : "bg-white text-[#374151] border border-[#E5E7EB]"
              }`}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="px-4">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "recherches" && <RecherchesTab />}
        {tab === "doublons" && <DoublonsTab />}
        {tab === "suspects" && <SuspectsTab />}
        {tab === "annonces" && <AnnoncesTab />}
        {tab === "badges" && <BadgesTab />}
        {tab === "sante" && <SanteTab />}
        {tab === "journal" && <JournalTab />}
        {tab === "validations" && <ValidationsTab />}
        {tab === "avis" && <AvisTab />}
        {tab === "comportement" && <ComportementTab />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Vue d'ensemble (Dashboard)
   ═══════════════════════════════════════════════════════════ */
function DashboardTab() {
  const { data, isLoading } = trpc.smartEngine.dashboard.useQuery();

  if (isLoading) return <Loading />;
  if (!data) return <Empty msg="Aucune donnée disponible" />;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-[#111]">Vue d'ensemble — 30 derniers jours</h2>

      {/* Alertes */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Alertes ouvertes" value={data.alerts.openAlerts} color="red" icon={AlertTriangle} />
        <StatCard label="Critiques" value={data.alerts.criticalAlerts} color="red" icon={XCircle} />
        <StatCard label="Total alertes" value={data.alerts.totalAlerts} color="gray" icon={Shield} />
      </div>

      {/* Recherches */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Recherches totales" value={data.searches?.total ?? 0} color="blue" icon={Search} />
        <StatCard label="Sans résultat" value={data.searches?.withoutResults ?? 0} color="orange" icon={XCircle} />
      </div>

      {/* Santé */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Éléments OK" value={data.health.ok} color="green" icon={CheckCircle2} />
        <StatCard label="Cassés" value={data.health.broken} color="red" icon={XCircle} />
        <StatCard label="Lents" value={data.health.slow} color="yellow" icon={Clock} />
      </div>

      {/* Activité */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Actions système" value={data.activity?.total ?? 0} color="purple" icon={Activity} />
        <StatCard label="À valider" value={data.activity?.needsValidation ?? 0} color="orange" icon={CheckCircle2} />
      </div>

      {/* Pulse temps réel */}
      {data.pulse && (
      <>
      <h3 className="text-sm font-bold text-[#111] mt-2">Pouls de la plateforme — 7 derniers jours</h3>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Visites pages" value={data.pulse.pageVisits ?? 0} color="blue" icon={Eye} />
        <StatCard label="Utilisateurs uniques" value={data.pulse.uniqueUsers ?? 0} color="green" icon={Users} />
        <StatCard label="Recherches" value={data.pulse.searches ?? 0} color="purple" icon={Search} />
        <StatCard label="Vues annonces" value={data.pulse.annonceViews ?? 0} color="blue" icon={Eye} />
        <StatCard label="Dépôts" value={data.pulse.deposits ?? 0} color="green" icon={CheckCircle2} />
        <StatCard label="Modifications" value={data.pulse.modifications ?? 0} color="yellow" icon={Activity} />
      </div>
      </>
      )}
      <div className="rounded-xl bg-[#111] p-3">
        <p className="text-sm font-bold text-[#D4AF37]">Utilisateurs actifs (15 min)</p>
        <p className="text-2xl font-black text-white">{data.activeUsers ?? 0}</p>
      </div>

      {/* Actions rapides */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-[#111]">Actions rapides</h3>
        <ActionButtons />
      </div>
    </div>
  );
}

function ActionButtons() {
  const analyzeReviews = trpc.smartEngine.analyzeReviews.useMutation();
  const validateUnivers = trpc.smartEngine.validateUnivers.useMutation();
  const validateBadges = trpc.smartEngine.validateBadges.useMutation();
  const registerElements = trpc.smartEngine.registerCriticalElements.useMutation();

  return (
    <div className="grid grid-cols-2 gap-2">
      <ActionBtn label="Analyser les avis" icon={Eye} loading={analyzeReviews.isPending} onClick={() => analyzeReviews.mutate()} />
      <ActionBtn label="Vérifier univers" icon={Layers} loading={validateUnivers.isPending} onClick={() => validateUnivers.mutate()} />
      <ActionBtn label="Vérifier badges" icon={Star} loading={validateBadges.isPending} onClick={() => validateBadges.mutate()} />
      <ActionBtn label="Enregistrer éléments" icon={Shield} loading={registerElements.isPending} onClick={() => registerElements.mutate()} />
    </div>
  );
}

function ActionBtn({ label, icon: Icon, loading, onClick }: { label: string; icon: typeof Brain; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs font-semibold text-[#374151] hover:bg-[#F5F3EF] transition disabled:opacity-50"
    >
      {loading ? <RefreshCw size={12} className="animate-spin" /> : <Icon size={12} />}
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Recherches
   ═══════════════════════════════════════════════════════════ */
function RecherchesTab() {
  const { data: stats } = trpc.smartEngine.searchStats.useQuery({ days: 30 });
  const { data: top } = trpc.smartEngine.topSearches.useQuery({ days: 30, limit: 15 });
  const { data: failed } = trpc.smartEngine.failedSearches.useQuery({ limit: 20 });

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-[#111]">Analyse des recherches</h2>

      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Total recherches" value={stats.total} color="blue" icon={Search} />
          <StatCard label="Utilisateurs uniques" value={stats.uniqueUsers} color="purple" icon={Users} />
          <StatCard label="Avec résultats" value={stats.withResults} color="green" icon={CheckCircle2} />
          <StatCard label="Sans résultat" value={stats.withoutResults} color="red" icon={XCircle} />
        </div>
      )}

      {top && top.length > 0 && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
          <h3 className="mb-2 text-sm font-bold text-[#111]">Top recherches</h3>
          {top.map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between border-b border-[#F3F4F6] py-1.5 last:border-0">
              <span className="text-xs text-[#374151]">{s.query}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#D4AF37]">{s.count}x</span>
                <span className="text-[10px] text-[#6B7280]">~{s.avgResults} résultats</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {failed && failed.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <h3 className="mb-2 text-sm font-bold text-red-700">Recherches sans résultat</h3>
          {failed.slice(0, 10).map((s: any) => (
            <div key={s.id} className="border-b border-red-100 py-1.5 last:border-0">
              <p className="text-xs text-red-800">{s.query || JSON.stringify(s.filters)}</p>
              <p className="text-[10px] text-red-500">{s.ville && `${s.ville} — `}{new Date(s.createdAt).toLocaleDateString("fr-FR")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Doublons
   ═══════════════════════════════════════════════════════════ */
function DoublonsTab() {
  const { data, isLoading } = trpc.smartEngine.unresolvedDuplicates.useQuery({ limit: 30 });
  const resolve = trpc.smartEngine.resolveDuplicate.useMutation();
  const utils = trpc.useUtils();

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <Empty msg="Aucun doublon détecté" />;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#111]">Doublons détectés</h2>
      {data.map((d: any) => (
        <div key={d.id} className="rounded-xl border border-orange-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#111]">Annonce #{d.annonceId} ↔ #{d.matchedAnnonceId}</p>
              <p className="text-[10px] text-orange-600">Type : {d.type} — Confiance : {d.confidence}%</p>
            </div>
            <button
              onClick={() => resolve.mutate({ id: d.id }, { onSuccess: () => utils.smartEngine.unresolvedDuplicates.invalidate() })}
              className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
            >
              Résolu
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Comptes suspects
   ═══════════════════════════════════════════════════════════ */
function SuspectsTab() {
  const { data, isLoading } = trpc.smartEngine.unresolvedSuspects.useQuery({ limit: 30 });
  const resolve = trpc.smartEngine.resolveSuspect.useMutation();
  const utils = trpc.useUtils();

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <Empty msg="Aucun compte suspect détecté" />;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#111]">Comptes suspects</h2>
      {data.map((s: any) => (
        <div key={s.id} className={`rounded-xl border p-3 ${s.severity === "critical" ? "border-red-300 bg-red-50" : "border-orange-200 bg-white"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#111]">Utilisateur #{s.userId}</p>
              <p className="text-[10px] text-[#6B7280]">Raison : {s.reason}</p>
            </div>
            <button
              onClick={() => resolve.mutate({ id: s.id }, { onSuccess: () => utils.smartEngine.unresolvedSuspects.invalidate() })}
              className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
            >
              Résolu
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Annonces mal placées
   ═══════════════════════════════════════════════════════════ */
function AnnoncesTab() {
  const { data, isLoading } = trpc.smartEngine.misplacedAnnonces.useQuery({ limit: 30 });
  const validateUnivers = trpc.smartEngine.validateUnivers.useMutation();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111]">Annonces — vérification univers</h2>
        <button onClick={() => validateUnivers.mutate()} className="rounded-lg bg-[#D4AF37] px-3 py-1 text-xs font-semibold text-white">
          {validateUnivers.isPending ? "Analyse..." : "Lancer l'analyse"}
        </button>
      </div>
      {isLoading ? <Loading /> : !data || data.length === 0 ? <Empty msg="Toutes les annonces sont dans le bon univers" /> : (
        data.map((a: any) => (
          <div key={a.id} className="rounded-xl border border-orange-200 bg-white p-3">
            <p className="text-xs font-bold text-[#111]">{a.title}</p>
            <p className="text-[10px] text-[#6B7280]">{a.description}</p>
          </div>
        ))
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Badges
   ═══════════════════════════════════════════════════════════ */
function BadgesTab() {
  const { data, isLoading } = trpc.smartEngine.badgeAlerts.useQuery({ limit: 30 });
  const validateBadges = trpc.smartEngine.validateBadges.useMutation();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111]">Badges — vérification</h2>
        <button onClick={() => validateBadges.mutate()} className="rounded-lg bg-[#D4AF37] px-3 py-1 text-xs font-semibold text-white">
          {validateBadges.isPending ? "Analyse..." : "Vérifier badges"}
        </button>
      </div>
      {isLoading ? <Loading /> : !data || data.length === 0 ? <Empty msg="Tous les badges sont valides" /> : (
        data.map((b: any) => (
          <div key={b.id} className="rounded-xl border border-orange-200 bg-white p-3">
            <p className="text-xs font-bold text-[#111]">{b.title}</p>
            <p className="text-[10px] text-[#6B7280]">{b.description}</p>
          </div>
        ))
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Santé plateforme
   ═══════════════════════════════════════════════════════════ */
function SanteTab() {
  const { data, isLoading } = trpc.smartEngine.healthStatus.useQuery();

  if (isLoading) return <Loading />;
  if (!data) return <Empty msg="Aucune donnée de santé" />;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#111]">Santé de la plateforme</h2>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="OK" value={data.ok} color="green" icon={CheckCircle2} />
        <StatCard label="Cassés" value={data.broken} color="red" icon={XCircle} />
        <StatCard label="Lents" value={data.slow} color="yellow" icon={Clock} />
      </div>
      <div className="space-y-2">
        {data.items.map((h: any) => (
          <div key={h.id} className={`rounded-xl border p-3 ${h.status === "ok" ? "border-emerald-200 bg-emerald-50" : h.status === "broken" ? "border-red-300 bg-red-50" : "border-orange-200 bg-orange-50"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#111]">{h.element}</p>
                <p className="text-[10px] text-[#6B7280]">{h.page}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${h.status === "ok" ? "bg-emerald-100 text-emerald-700" : h.status === "broken" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                {h.status}
              </span>
            </div>
            {h.errorDetails && <p className="mt-1 text-[10px] text-red-600">{h.errorDetails}</p>}
            {h.suggestedFix && <p className="mt-1 text-[10px] text-blue-600">Correction suggérée : {h.suggestedFix}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Journal d'activité
   ═══════════════════════════════════════════════════════════ */
function JournalTab() {
  const { data, isLoading } = trpc.smartEngine.activityLog.useQuery({ limit: 50, offset: 0 });

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <Empty msg="Aucune activité enregistrée" />;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#111]">Journal d'activité du système</h2>
      {data.map((a: any) => (
        <div key={a.id} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#111]">{a.action}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.result === "success" ? "bg-emerald-100 text-emerald-700" : a.result === "failure" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
              {a.result || "—"}
            </span>
          </div>
          {a.targetType && <p className="text-[10px] text-[#6B7280]">{a.targetType} #{a.targetId}</p>}
          {a.proposedDecision && <p className="mt-1 text-[10px] text-blue-600">{a.proposedDecision}</p>}
          <p className="mt-1 text-[10px] text-[#9CA3AF]">{new Date(a.createdAt).toLocaleString("fr-FR")}</p>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Validations (apprentissage)
   ═══════════════════════════════════════════════════════════ */
function ValidationsTab() {
  const { data, isLoading } = trpc.smartEngine.pendingValidations.useQuery({ limit: 30 });
  const validate = trpc.smartEngine.validateLearned.useMutation();
  const utils = trpc.useUtils();

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <Empty msg="Aucune donnée à valider" />;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#111]">Données à valider (apprentissage)</h2>
      <p className="text-xs text-[#6B7280]">Données proposées par les utilisateurs lors du dépôt d'annonce. Validez ou refusez.</p>
      {data.map((d: any) => (
        <div key={d.id} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#111]">{d.field} : <span className="text-[#D4AF37]">{d.value}</span></p>
              <p className="text-[10px] text-[#6B7280]">{d.marque} {d.modele} — {d.confirmations} confirmation(s)</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => validate.mutate({ id: d.id, approved: true }, { onSuccess: () => utils.smartEngine.pendingValidations.invalidate() })}
                className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700"
              >
                Valider
              </button>
              <button
                onClick={() => validate.mutate({ id: d.id, approved: false }, { onSuccess: () => utils.smartEngine.pendingValidations.invalidate() })}
                className="rounded-lg bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700"
              >
                Refuser
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Avis
   ═══════════════════════════════════════════════════════════ */
function AvisTab() {
  const { data, isLoading } = trpc.smartEngine.reviewAlerts.useQuery({ limit: 20 });
  const analyze = trpc.smartEngine.analyzeReviews.useMutation();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111]">Analyse des avis</h2>
        <button onClick={() => analyze.mutate()} className="rounded-lg bg-[#D4AF37] px-3 py-1 text-xs font-semibold text-white">
          {analyze.isPending ? "Analyse..." : "Analyser les avis"}
        </button>
      </div>
      {isLoading ? <Loading /> : !data || data.length === 0 ? <Empty msg="Aucun problème détecté dans les avis" /> : (
        data.map((a: any) => (
          <div key={a.id} className={`rounded-xl border p-3 ${a.severity === "critical" ? "border-red-300 bg-red-50" : "border-orange-200 bg-orange-50"}`}>
            <p className="text-xs font-bold text-[#111]">{a.title}</p>
            <p className="text-[10px] text-[#6B7280]">{a.description}</p>
          </div>
        ))
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Composants partagés
   ═══════════════════════════════════════════════════════════ */

function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: typeof Brain }) {
  const colorMap: Record<string, string> = {
    red: "bg-red-50 border-red-200 text-red-700",
    green: "bg-emerald-50 border-emerald-200 text-emerald-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    gray: "bg-slate-50 border-slate-200 text-slate-700",
  };
  const cls = colorMap[color] || colorMap.gray;
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="flex items-center gap-1.5">
        <Icon size={12} />
        <span className="text-[10px] font-semibold">{label}</span>
      </div>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw size={20} className="animate-spin text-[#D4AF37]" />
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <CheckCircle2 size={32} className="text-emerald-400" />
      <p className="mt-2 text-sm text-[#6B7280]">{msg}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Comportement (suivi utilisateurs)
   ═══════════════════════════════════════════════════════════ */
function ComportementTab() {
  const pageStats = trpc.smartEngine.pageStats.useQuery({ days: 30 });
  const activeUsers = trpc.smartEngine.activeUsers.useQuery();
  const pulse = trpc.smartEngine.platformPulse.useQuery({ days: 7 });

  if (pageStats.isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-[#111]">Suivi comportemental — Temps réel</h2>

      {/* Utilisateurs actifs */}
      <div className="rounded-xl bg-[#111] p-4">
        <p className="text-sm font-bold text-[#D4AF37]">Utilisateurs actifs (15 dernières min)</p>
        <p className="text-3xl font-black text-white mt-1">{activeUsers.data?.length ?? 0}</p>
        {activeUsers.data && activeUsers.data.length > 0 && (
          <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
            {activeUsers.data.map((u: any, i: number) => (
              <div key={i} className="flex justify-between text-xs text-white/60">
                <span>Utilisateur #{u.userId ?? "anonyme"}</span>
                <span>{u.actionCount} actions</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pulse plateforme */}
      {pulse.data && (
      <div>
        <h3 className="text-sm font-bold text-[#111] mb-2">Pouls plateforme — 7 jours</h3>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Actions totales" value={pulse.data.totalActions ?? 0} color="purple" icon={Activity} />
          <StatCard label="Utilisateurs uniques" value={pulse.data.uniqueUsers ?? 0} color="green" icon={Users} />
          <StatCard label="Visites pages" value={pulse.data.pageVisits ?? 0} color="blue" icon={Eye} />
          <StatCard label="Recherches" value={pulse.data.searches ?? 0} color="blue" icon={Search} />
          <StatCard label="Vues annonces" value={pulse.data.annonceViews ?? 0} color="green" icon={Eye} />
          <StatCard label="Dépôts" value={pulse.data.deposits ?? 0} color="yellow" icon={CheckCircle2} />
        </div>
      </div>
      )}

      {/* Pages les plus visitées */}
      <div>
        <h3 className="text-sm font-bold text-[#111] mb-2">Pages les plus visitées — 30 jours</h3>
        {pageStats.data && pageStats.data.length > 0 ? (
          <div className="space-y-1">
            {pageStats.data.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white border border-[#E5E7EB] p-2.5">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#111] truncate max-w-[200px]">{p.page}</p>
                  <p className="text-[10px] text-[#6B7280]">{p.uniqueUsers} utilisateurs uniques</p>
                </div>
                <span className="text-sm font-black text-[#D4AF37]">{p.visits}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty msg="Aucune donnée de visite encore — le système commence à collecter" />
        )}
      </div>
    </div>
  );
}
