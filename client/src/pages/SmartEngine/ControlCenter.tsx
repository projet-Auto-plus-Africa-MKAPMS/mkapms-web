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
import { useState, useEffect, useRef } from "react";
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
  GraduationCap,
  Send,
  Globe,
  Lightbulb,
  Plus,
  Cpu,
  ExternalLink,
  BookOpen,
  Zap,
  HeartPulse,
  Boxes,
  Gauge,
} from "lucide-react";

type Tab = "dashboard" | "etat" | "qualite" | "alertes" | "apprentissage" | "connaissances" | "savoir" | "optimisation" | "moteurs" | "developpements" | "recherches" | "doublons" | "suspects" | "annonces" | "badges" | "sante" | "journal" | "validations" | "avis" | "comportement";

const TABS: { key: Tab; label: string; icon: typeof Brain }[] = [
  { key: "dashboard", label: "Vue d'ensemble", icon: BarChart3 },
  { key: "etat", label: "État plateforme", icon: HeartPulse },
  { key: "qualite", label: "Qualité", icon: Gauge },
  { key: "alertes", label: "Alertes", icon: AlertTriangle },
  { key: "apprentissage", label: "Apprentissage privé", icon: GraduationCap },
  { key: "connaissances", label: "Connaissances externes", icon: Globe },
  { key: "savoir", label: "Base de connaissances", icon: BookOpen },
  { key: "optimisation", label: "Auto-optimisation", icon: Zap },
  { key: "moteurs", label: "Moteurs connectés", icon: Cpu },
  { key: "developpements", label: "Développements", icon: Boxes },
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
        {tab === "dashboard" && <DashboardTab onNavigate={setTab} />}
        {tab === "etat" && <EtatPlateformeTab />}
        {tab === "qualite" && <QualiteTab />}
        {tab === "alertes" && <AlertesTab />}
        {tab === "apprentissage" && <ApprentissageTab />}
        {tab === "connaissances" && <ConnaissancesTab />}
        {tab === "savoir" && <BaseConnaissancesTab />}
        {tab === "optimisation" && <OptimisationTab />}
        {tab === "moteurs" && <MoteursTab />}
        {tab === "developpements" && <DeveloppementsTab />}
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
function DashboardTab({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { data, isLoading } = trpc.smartEngine.dashboard.useQuery();

  if (isLoading) return <Loading />;
  if (!data) return <Empty msg="Aucune donnée disponible" />;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-[#111]">Vue d'ensemble — 30 derniers jours</h2>
      <p className="text-[11px] text-[#9CA3AF]">Chaque carte est cliquable — appuyez pour voir le détail complet.</p>

      {/* Alertes */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Alertes ouvertes" value={data.alerts.openAlerts} color="red" icon={AlertTriangle} onClick={() => onNavigate("alertes")} />
        <StatCard label="Critiques" value={data.alerts.criticalAlerts} color="red" icon={XCircle} onClick={() => onNavigate("avis")} />
        <StatCard label="Total alertes" value={data.alerts.totalAlerts} color="gray" icon={Shield} onClick={() => onNavigate("journal")} />
      </div>

      {/* Recherches */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Recherches totales" value={data.searches?.total ?? 0} color="blue" icon={Search} onClick={() => onNavigate("recherches")} />
        <StatCard label="Sans résultat" value={data.searches?.withoutResults ?? 0} color="orange" icon={XCircle} onClick={() => onNavigate("recherches")} />
      </div>

      {/* Santé */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Éléments OK" value={data.health.ok} color="green" icon={CheckCircle2} onClick={() => onNavigate("sante")} />
        <StatCard label="Cassés" value={data.health.broken} color="red" icon={XCircle} onClick={() => onNavigate("sante")} />
        <StatCard label="Lents" value={data.health.slow} color="yellow" icon={Clock} onClick={() => onNavigate("sante")} />
      </div>

      {/* Activité */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Actions système" value={data.activity?.total ?? 0} color="purple" icon={Activity} onClick={() => onNavigate("journal")} />
        <StatCard label="À valider" value={data.activity?.needsValidation ?? 0} color="orange" icon={CheckCircle2} onClick={() => onNavigate("validations")} />
      </div>

      {/* Pulse temps réel */}
      {data.pulse && (
      <>
      <h3 className="text-sm font-bold text-[#111] mt-2">Pouls de la plateforme — 7 derniers jours</h3>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Visites pages" value={data.pulse.pageVisits ?? 0} color="blue" icon={Eye} onClick={() => onNavigate("comportement")} />
        <StatCard label="Utilisateurs uniques" value={data.pulse.uniqueUsers ?? 0} color="green" icon={Users} onClick={() => onNavigate("comportement")} />
        <StatCard label="Recherches" value={data.pulse.searches ?? 0} color="purple" icon={Search} onClick={() => onNavigate("recherches")} />
        <StatCard label="Vues annonces" value={data.pulse.annonceViews ?? 0} color="blue" icon={Eye} onClick={() => onNavigate("comportement")} />
        <StatCard label="Dépôts" value={data.pulse.deposits ?? 0} color="green" icon={CheckCircle2} onClick={() => onNavigate("comportement")} />
        <StatCard label="Modifications" value={data.pulse.modifications ?? 0} color="yellow" icon={Activity} onClick={() => onNavigate("journal")} />
      </div>
      </>
      )}
      <button onClick={() => onNavigate("comportement")} className="w-full text-left rounded-xl bg-[#111] p-3 transition hover:ring-2 hover:ring-[#D4AF37]/60">
        <p className="text-sm font-bold text-[#D4AF37]">Utilisateurs actifs (15 min)</p>
        <p className="text-2xl font-black text-white">{data.activeUsers ?? 0}</p>
        <p className="text-[10px] text-white/40">Appuyez pour le suivi comportemental temps réel →</p>
      </button>

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
   TAB : Apprentissage privé (chat PDG ↔ Système Intelligent)
   ═══════════════════════════════════════════════════════════ */
function ApprentissageTab() {
  const conversation = trpc.smartEngine.teachingConversation.useQuery({ limit: 200 });
  const stats = trpc.smartEngine.teachingStats.useQuery();
  const utils = trpc.useUtils();
  const teach = trpc.smartEngine.teach.useMutation({
    onSuccess: () => {
      utils.smartEngine.teachingConversation.invalidate();
      utils.smartEngine.teachingStats.invalidate();
    },
  });
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = conversation.data ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  function send() {
    const msg = text.trim();
    if (!msg || teach.isPending) return;
    setText("");
    teach.mutate({ message: msg });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111]">Apprentissage privé</h2>
        <span className="rounded-full bg-[#111] px-2.5 py-1 text-[10px] font-bold text-[#D4AF37]">
          {stats.data?.lessons ?? 0} leçon(s) mémorisée(s)
        </span>
      </div>
      <p className="text-[11px] text-[#6B7280]">
        Espace confidentiel — toi seul (PDG) discutes ici avec le Système Intelligent. Écris-lui une
        information (une affirmation) et il la mémorise ; pose une question (avec « ? ») et il répond
        à partir de ce que tu lui as appris.
      </p>

      <div
        ref={scrollRef}
        className="max-h-[52vh] space-y-2 overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white p-3"
      >
        {conversation.isLoading ? (
          <Loading />
        ) : messages.length === 0 ? (
          <div className="py-8 text-center">
            <GraduationCap size={28} className="mx-auto text-[#D4AF37]" />
            <p className="mt-2 text-sm text-[#6B7280]">
              Commence à lui apprendre. Exemple :<br />
              « Un véhicule VO interne ne doit jamais être visible par un particulier. »
            </p>
          </div>
        ) : (
          messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.role === "pdg" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  m.role === "pdg"
                    ? "bg-[#D4AF37] text-white"
                    : "bg-[#F5F3EF] text-[#111] border border-[#E5E7EB]"
                }`}
              >
                {m.role === "system" && (
                  <span className="mb-0.5 block text-[10px] font-bold text-[#D4AF37]">Système Intelligent</span>
                )}
                {m.message}
              </div>
            </div>
          ))
        )}
        {teach.isPending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#F5F3EF] px-3 py-2">
              <RefreshCw size={14} className="animate-spin text-[#D4AF37]" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="Apprends-lui quelque chose, ou pose une question…"
          className="flex-1 resize-none rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111] focus:border-[#D4AF37] focus:outline-none"
        />
        <button
          onClick={send}
          disabled={teach.isPending || !text.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#D4AF37] text-white transition disabled:opacity-40"
          aria-label="Envoyer"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Connaissances externes (veille / benchmark)
   ═══════════════════════════════════════════════════════════ */
const KNOWLEDGE_CATS: { key: string; label: string }[] = [
  { key: "marketplace", label: "Marketplace auto" },
  { key: "concessionnaire", label: "Concessionnaire" },
  { key: "garage", label: "Garage" },
  { key: "location", label: "Location" },
  { key: "pieces", label: "Pièces" },
  { key: "general", label: "Général" },
];

function ConnaissancesTab() {
  const list = trpc.smartEngine.knowledgeList.useQuery({ limit: 300 });
  const stats = trpc.smartEngine.knowledgeStats.useQuery();
  const utils = trpc.useUtils();
  const refresh = () => {
    utils.smartEngine.knowledgeList.invalidate();
    utils.smartEngine.knowledgeStats.invalidate();
  };
  const seed = trpc.smartEngine.seedKnowledge.useMutation({ onSuccess: refresh });
  const add = trpc.smartEngine.addKnowledge.useMutation({ onSuccess: refresh });
  const mark = trpc.smartEngine.markKnowledgeApplied.useMutation({ onSuccess: refresh });

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("marketplace");
  const [source, setSource] = useState("");
  const [insight, setInsight] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [url, setUrl] = useState("");

  const items = list.data ?? [];

  function submit() {
    if (!insight.trim() || add.isPending) return;
    add.mutate(
      {
        category: category as any,
        source: source.trim() || undefined,
        insight: insight.trim(),
        recommendation: recommendation.trim() || undefined,
        url: url.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSource("");
          setInsight("");
          setRecommendation("");
          setUrl("");
          setShowForm(false);
        },
      },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111]">Connaissances externes</h2>
        <span className="rounded-full bg-[#111] px-2.5 py-1 text-[10px] font-bold text-[#D4AF37]">
          {stats.data?.total ?? 0} connaissance(s)
        </span>
      </div>
      <p className="text-[11px] text-[#6B7280]">
        Veille : bonnes pratiques observées ailleurs (marketplaces, concessionnaires, garages…) avec un
        conseil concret pour MKA.P-MS. Ajoute une connaissance, ou charge la base de départ du secteur.
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-xl bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white"
        >
          <Plus size={14} /> Ajouter
        </button>
        {items.length === 0 && (
          <button
            onClick={() => seed.mutate()}
            disabled={seed.isPending}
            className="flex items-center gap-1 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#374151] disabled:opacity-40"
          >
            <RefreshCw size={14} className={seed.isPending ? "animate-spin" : ""} /> Charger la base de départ
          </button>
        )}
      </div>

      {showForm && (
        <div className="space-y-2 rounded-xl border border-[#E5E7EB] bg-white p-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
          >
            {KNOWLEDGE_CATS.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Source / acteur observé (optionnel)"
            className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
          />
          <textarea
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            rows={2}
            placeholder="Ce qui a été observé / appris"
            className="w-full resize-none rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
          />
          <textarea
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            rows={2}
            placeholder="Conseil concret pour MKA.P-MS (optionnel)"
            className="w-full resize-none rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Lien (optionnel)"
            className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
          />
          <button
            onClick={submit}
            disabled={add.isPending || !insight.trim()}
            className="w-full rounded-lg bg-[#111] py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      )}

      {list.isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#6B7280]">
          <Globe size={28} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2">Aucune connaissance pour l'instant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((k: any) => (
            <div key={k.id} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[10px] font-bold text-[#374151]">
                  {KNOWLEDGE_CATS.find((c) => c.key === k.category)?.label ?? k.category}
                </span>
                {k.applied && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                    <CheckCircle2 size={12} /> Appliqué
                  </span>
                )}
              </div>
              {k.source && <p className="mt-1 text-[11px] font-semibold text-[#6B7280]">{k.source}</p>}
              <p className="mt-1 text-sm text-[#111]">{k.insight}</p>
              {k.recommendation && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[#FFF8E1] p-2">
                  <Lightbulb size={14} className="mt-0.5 shrink-0 text-[#D4AF37]" />
                  <p className="text-xs text-[#7A5C00]">{k.recommendation}</p>
                </div>
              )}
              {k.url && (
                <a href={k.url} target="_blank" rel="noreferrer" className="mt-1 block text-[11px] text-blue-600 underline">
                  {k.url}
                </a>
              )}
              <button
                onClick={() => mark.mutate({ id: k.id, applied: !k.applied })}
                className="mt-2 text-[11px] font-semibold text-[#6B7280] underline"
              >
                {k.applied ? "Marquer comme non appliqué" : "Marquer comme appliqué"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Base de connaissances officielle (Parties 6 & 7)
   Mémoire officielle de MKA.P-MS, alimentée automatiquement.
   ═══════════════════════════════════════════════════════════ */
const KB_DOMAIN_LABELS: Record<string, string> = {
  vehicule: "Véhicules",
  piece: "Pièces",
  panne: "Pannes",
  utilisateur: "Utilisateurs",
  recherche: "Recherches",
  mot_cle: "Mots-clés",
  service: "Services",
  garage: "Garages",
};

function BaseConnaissancesTab() {
  const [domain, setDomain] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const stats = trpc.smartEngine.kbStats.useQuery();
  const list = trpc.smartEngine.kbList.useQuery({
    domain: domain || undefined,
    status: (status || undefined) as "proposed" | "confirmed" | "rejected" | undefined,
    limit: 200,
  });
  const utils = trpc.useUtils();
  const validate = trpc.smartEngine.kbValidate.useMutation({
    onSuccess: () => {
      utils.smartEngine.kbList.invalidate();
      utils.smartEngine.kbStats.invalidate();
    },
  });

  const items = list.data ?? [];
  const totals = stats.data?.totals;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111]">Base de connaissances</h2>
        <span className="rounded-full bg-[#111] px-2.5 py-1 text-[10px] font-bold text-[#D4AF37]">
          {totals?.total ?? 0} entrée(s)
        </span>
      </div>
      <p className="text-[11px] text-[#6B7280]">
        Mémoire officielle de MKA.P-MS. Chaque action (recherche, dépôt, nouvelle version/pièce…) est
        observée automatiquement. Une donnée cohérente qui revient plusieurs fois passe de
        « proposée » à « confirmée ». Aucune donnée n'est perdue — tu peux confirmer ou rejeter.
      </p>

      {/* Stats globales */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Proposées" value={totals?.proposed ?? 0} color="orange" icon={Clock} />
        <StatCard label="Confirmées" value={totals?.confirmed ?? 0} color="green" icon={CheckCircle2} />
        <StatCard label="Rejetées" value={totals?.rejected ?? 0} color="red" icon={XCircle} />
        <StatCard label="Observations" value={totals?.observations ?? 0} color="blue" icon={Activity} />
      </div>

      {/* Répartition par domaine */}
      {stats.data && stats.data.byDomain.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setDomain("")}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${domain === "" ? "bg-[#D4AF37] text-white" : "bg-white text-[#374151] border border-[#E5E7EB]"}`}
          >
            Tous
          </button>
          {stats.data.byDomain.map((d) => (
            <button
              key={d.domain}
              onClick={() => setDomain(d.domain)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${domain === d.domain ? "bg-[#D4AF37] text-white" : "bg-white text-[#374151] border border-[#E5E7EB]"}`}
            >
              {KB_DOMAIN_LABELS[d.domain] ?? d.domain} · {d.count}
            </button>
          ))}
        </div>
      )}

      {/* Filtre statut */}
      <div className="flex gap-1.5">
        {[
          { key: "", label: "Tous statuts" },
          { key: "proposed", label: "Proposées" },
          { key: "confirmed", label: "Confirmées" },
          { key: "rejected", label: "Rejetées" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setStatus(s.key)}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${status === s.key ? "bg-[#111] text-white" : "bg-white text-[#374151] border border-[#E5E7EB]"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty msg="Aucune connaissance pour ce filtre. La base se remplit automatiquement à chaque action." />
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <div key={e.id} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[9px] font-bold uppercase text-[#6B7280]">
                      {KB_DOMAIN_LABELS[e.domain] ?? e.domain}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF]">{e.type}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-[#111]">{e.value}</p>
                  {e.parentKey && (
                    <p className="text-[10px] text-[#9CA3AF]">Contexte : {e.parentKey}</p>
                  )}
                  <p className="mt-0.5 text-[10px] text-[#9CA3AF]">
                    {e.observations ?? 1} observation(s) · source : {e.firstSource ?? "système"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      e.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : e.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {e.status === "confirmed" ? "Confirmée" : e.status === "rejected" ? "Rejetée" : "Proposée"}
                  </span>
                  {e.status !== "confirmed" && (
                    <button
                      onClick={() => validate.mutate({ id: e.id, approved: true })}
                      disabled={validate.isPending}
                      className="rounded-lg bg-green-600 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-40"
                    >
                      Confirmer
                    </button>
                  )}
                  {e.status !== "rejected" && (
                    <button
                      onClick={() => validate.mutate({ id: e.id, approved: false })}
                      disabled={validate.isPending}
                      className="rounded-lg border border-[#E5E7EB] px-2 py-1 text-[10px] font-semibold text-[#374151] disabled:opacity-40"
                    >
                      Rejeter
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Qualité — Moteur Qualité (Partie 12)
   Score qualité par domaine + global. 100% lecture seule.
   ═══════════════════════════════════════════════════════════ */
function qualityColor(status: string): string {
  if (status === "bon") return "text-green-600";
  if (status === "moyen") return "text-orange-500";
  return "text-red-500";
}
function qualityDot(status: string): string {
  if (status === "bon") return "bg-green-500";
  if (status === "moyen") return "bg-orange-500";
  return "bg-red-500";
}

function QualiteTab() {
  const overview = trpc.smartEngine.qualityOverview.useQuery();
  const utils = trpc.useUtils();
  const run = trpc.smartEngine.qualityAuditRun.useMutation({
    onSuccess: () => utils.smartEngine.qualityOverview.invalidate(),
  });

  const data = overview.data;
  const cats = data?.categories ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111]">Moteur Qualité</h2>
        {data?.hasData && (
          <span className={`rounded-full bg-[#111] px-2.5 py-1 text-[10px] font-bold ${qualityColor(data.globalStatus)}`}>
            Global {data.globalScore}/100
          </span>
        )}
      </div>
      <p className="text-[11px] text-[#6B7280]">
        Le Système Intelligent mesure la <b>qualité réelle</b> de la plateforme (complétude des
        annonces, photos, descriptions, prix, confiance, doublons, santé, avis). Il <b>ne modifie
        rien</b> et ne décide jamais seul : il mesure, explique et <b>recommande</b> — toi seul
        décides des suites.
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => run.mutate()}
          disabled={run.isPending}
          className="flex items-center gap-1 rounded-xl bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
        >
          <RefreshCw size={14} className={run.isPending ? "animate-spin" : ""} /> Lancer un audit qualité
        </button>
        {run.data && (
          <span className="text-[11px] text-[#6B7280]">
            Audit terminé — {run.data.results.length} domaine(s), global {run.data.globalScore}/100
          </span>
        )}
      </div>

      {overview.isLoading ? (
        <p className="text-xs text-[#6B7280]">Chargement…</p>
      ) : !data?.hasData ? (
        <p className="rounded-xl bg-white p-4 text-center text-xs text-[#6B7280]">
          Aucun audit encore. Clique sur « Lancer un audit qualité ».
        </p>
      ) : (
        <div className="space-y-2">
          {cats.map((c) => (
            <div key={c.category} className="rounded-xl bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${qualityDot(c.status)}`} />
                  <span className="text-sm font-semibold text-[#111]">{c.label}</span>
                </div>
                <span className={`text-sm font-black ${qualityColor(c.status)}`}>{c.score}/100</span>
              </div>
              <p className="mt-1 text-[11px] text-[#374151]">{c.headline}</p>
              {c.recommendation && (
                <p className="mt-1 flex items-start gap-1 text-[11px] text-[#B45309]">
                  <Lightbulb size={12} className="mt-0.5 shrink-0" /> {c.recommendation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : État plateforme — tableau de santé temps réel (Partie 9)
   ═══════════════════════════════════════════════════════════ */
function EtatPlateformeTab() {
  const health = trpc.smartEngine.platformHealth.useQuery(undefined, {
    refetchInterval: 30000, // rafraîchissement temps réel toutes les 30s
  });

  if (health.isLoading) return <Loading />;
  if (!health.data) return <Empty msg="État indisponible" />;

  const { overall, categories, generatedAt } = health.data;
  const dot = (level: string) =>
    level === "red" ? "bg-red-500" : level === "yellow" ? "bg-yellow-400" : "bg-green-500";
  const overallLabel =
    overall === "red" ? "Attention requise" : overall === "yellow" ? "À surveiller" : "Tout va bien";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111]">État de la plateforme</h2>
        <button
          onClick={() => health.refetch()}
          disabled={health.isFetching}
          className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#374151]"
        >
          <RefreshCw size={12} className={health.isFetching ? "animate-spin" : ""} /> Actualiser
        </button>
      </div>

      {/* Bandeau global */}
      <div className="flex items-center gap-3 rounded-2xl bg-[#111] p-4">
        <span className={`h-4 w-4 rounded-full ${dot(overall)} shadow-[0_0_12px] shadow-current`} />
        <div>
          <p className="text-sm font-bold text-white">{overallLabel}</p>
          <p className="text-[10px] text-white/50">
            Vue temps réel · maj {new Date(generatedAt).toLocaleTimeString("fr-FR")}
          </p>
        </div>
      </div>

      {/* Grille des indicateurs */}
      <div className="grid grid-cols-2 gap-2">
        {categories.map((c) => (
          <div key={c.key} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
            <div className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${dot(c.level)}`} />
              <span className="text-[11px] font-semibold text-[#374151]">{c.label}</span>
            </div>
            <p className="mt-1 text-lg font-black text-[#111]">{c.headline}</p>
            <p className="text-[10px] leading-tight text-[#9CA3AF]">{c.detail}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-[#9CA3AF]">
        🟢 OK · 🟡 à surveiller · 🔴 action requise. Données réelles agrégées en lecture seule
        (aucune modification de la plateforme).
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Alertes à niveaux (Partie 10)
   Le Smart Engine détecte et lève des alertes ; le PDG les traite.
   Niveaux : 🟢 Information · 🟡 Attention · 🟠 Important · 🔴 Critique
   ═══════════════════════════════════════════════════════════ */
const ALERT_LEVELS: { key: string; label: string; dot: string; text: string }[] = [
  { key: "info", label: "🟢 Information", dot: "bg-green-500", text: "text-green-700" },
  { key: "warning", label: "🟡 Attention", dot: "bg-yellow-400", text: "text-yellow-700" },
  { key: "important", label: "🟠 Important", dot: "bg-orange-500", text: "text-orange-700" },
  { key: "critical", label: "🔴 Critique", dot: "bg-red-500", text: "text-red-700" },
];
const ALERT_LEVEL_MAP: Record<string, { label: string; dot: string; text: string }> =
  Object.fromEntries(ALERT_LEVELS.map((l) => [l.key, l]));

function AlertesTab() {
  const utils = trpc.useUtils();
  const [level, setLevel] = useState<string | undefined>(undefined);

  const stats = trpc.smartEngine.alertLevelStats.useQuery();
  const list = trpc.smartEngine.alerts.useQuery({
    status: "open",
    severity: level as "info" | "warning" | "important" | "critical" | undefined,
    limit: 100,
  });

  const refresh = () => {
    void utils.smartEngine.alerts.invalidate();
    void utils.smartEngine.alertLevelStats.invalidate();
  };
  const scan = trpc.smartEngine.alertScan.useMutation({ onSuccess: refresh });
  const resolve = trpc.smartEngine.resolveAlert.useMutation({ onSuccess: refresh });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111]">Alertes</h2>
        <button
          onClick={() => scan.mutate()}
          disabled={scan.isPending}
          className="flex items-center gap-1 rounded-full bg-[#D4AF37] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
        >
          <RefreshCw size={12} className={scan.isPending ? "animate-spin" : ""} />
          {scan.isPending ? "Analyse…" : "Analyser maintenant"}
        </button>
      </div>

      {scan.data && (
        <p className="text-[11px] text-[#374151]">
          {scan.data.created > 0
            ? `${scan.data.created} nouvelle(s) alerte(s) détectée(s).`
            : "Aucun nouveau problème détecté."}
        </p>
      )}

      {/* Compteurs par niveau (cliquables = filtre) */}
      <div className="grid grid-cols-4 gap-2">
        {ALERT_LEVELS.map((l) => {
          const count = (stats.data?.[l.key as keyof typeof stats.data] as number) ?? 0;
          const active = level === l.key;
          return (
            <button
              key={l.key}
              onClick={() => setLevel(active ? undefined : l.key)}
              className={`rounded-xl border p-2 text-center transition ${
                active ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-[#E5E7EB] bg-white"
              }`}
            >
              <span className={`mx-auto mb-1 block h-2.5 w-2.5 rounded-full ${l.dot}`} />
              <p className="text-lg font-black text-[#111]">{count}</p>
              <p className="text-[9px] leading-tight text-[#9CA3AF]">{l.label.slice(2)}</p>
            </button>
          );
        })}
      </div>

      {level && (
        <button onClick={() => setLevel(undefined)} className="text-[11px] font-semibold text-[#D4AF37]">
          ← Voir tous les niveaux
        </button>
      )}

      {/* Liste des alertes ouvertes */}
      {list.isLoading ? (
        <Loading />
      ) : !list.data || list.data.length === 0 ? (
        <Empty msg="Aucune alerte ouverte 🎉" />
      ) : (
        <div className="space-y-2">
          {list.data.map((a) => {
            const lv = ALERT_LEVEL_MAP[a.severity ?? "info"] ?? ALERT_LEVEL_MAP.info;
            return (
              <div key={a.id} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                <div className="flex items-start gap-2">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${lv.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#111]">{a.title}</p>
                    {a.description && (
                      <p className="mt-0.5 text-[11px] leading-snug text-[#6B7280]">{a.description}</p>
                    )}
                    <p className="mt-1 text-[10px] text-[#9CA3AF]">
                      <span className={`font-semibold ${lv.text}`}>{lv.label}</span> · {a.category}
                      {a.createdAt ? ` · ${new Date(a.createdAt).toLocaleString("fr-FR")}` : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => resolve.mutate({ id: a.id, status: "resolved" })}
                    disabled={resolve.isPending}
                    className="rounded-full bg-[#111] px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
                  >
                    Résolu
                  </button>
                  <button
                    onClick={() => resolve.mutate({ id: a.id, status: "dismissed" })}
                    disabled={resolve.isPending}
                    className="rounded-full border border-[#E5E7EB] px-3 py-1 text-[11px] font-semibold text-[#374151] disabled:opacity-60"
                  >
                    Ignorer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-[#9CA3AF]">
        Le Système Intelligent surveille boutons, APIs, pages, redirections, annonces, images et
        paiements, et lève une alerte de niveau adapté dès qu'un problème est détecté.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Auto-optimisation (Partie 8)
   Le Smart Engine PROPOSE ; le PDG applique ou rejette.
   ═══════════════════════════════════════════════════════════ */
const OPT_CATEGORY_LABELS: Record<string, string> = {
  vitesse_recherche: "Vitesse recherche",
  classement_annonces: "Classement annonces",
  qualite_resultats: "Qualité résultats",
  mots_cles: "Mots-clés",
  filtres: "Filtres",
  suggestions: "Suggestions",
};

/* ═══════════════════════════════════════════════════════════
   TAB : Développements (Partie 11 — apprentissage des développements)
   ═══════════════════════════════════════════════════════════ */
const DEV_KIND_LABELS: Record<string, string> = {
  moteur: "Moteur",
  table: "Table",
  api: "API",
  page: "Page",
  bouton: "Bouton",
  formulaire: "Formulaire",
};
const DEV_PERMISSION_LABELS: Record<string, string> = {
  definie: "Permission définie",
  requise: "Permission à définir",
  publique: "Public",
  na: "—",
};

function DeveloppementsTab() {
  const [kind, setKind] = useState<string>("");
  const [permission, setPermission] = useState<string>("");
  const stats = trpc.smartEngine.devLearningStats.useQuery();
  const list = trpc.smartEngine.devLearningList.useQuery({
    kind: (kind || undefined) as "moteur" | "table" | "api" | "page" | "bouton" | "formulaire" | undefined,
    permission: (permission || undefined) as "definie" | "requise" | "publique" | "na" | undefined,
  });
  const utils = trpc.useUtils();
  const refresh = () => {
    utils.smartEngine.devLearningList.invalidate();
    utils.smartEngine.devLearningStats.invalidate();
  };
  const scan = trpc.smartEngine.devLearningScan.useMutation({ onSuccess: refresh });
  const review = trpc.smartEngine.devLearningReview.useMutation({ onSuccess: refresh });

  const items = list.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111]">Apprentissage des développements</h2>
        <span className="rounded-full bg-[#111] px-2.5 py-1 text-[10px] font-bold text-[#D4AF37]">
          {stats.data?.total ?? 0} élément(s)
        </span>
      </div>
      <p className="text-[11px] text-[#6B7280]">
        À chaque nouveau développement (moteur, table, API, page, bouton), le Système Intelligent
        l'<b>analyse</b>, comprend sa fonction, l'<b>ajoute à sa surveillance</b> et vérifie qu'une
        <b> permission</b> est bien définie (Permission Engine). Détection réelle : APIs du routeur
        vivant + tables de la base. Aucune donnée n'est modifiée — toi seul décides.
      </p>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="APIs" value={stats.data?.parKind?.api ?? 0} color="green" icon={Cpu} />
        <StatCard label="Tables" value={stats.data?.parKind?.table ?? 0} color="orange" icon={Database} />
        <StatCard label="Perm. à définir" value={stats.data?.permissionsRequises ?? 0} color="red" icon={Shield} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => scan.mutate()}
          disabled={scan.isPending}
          className="flex items-center gap-1 rounded-xl bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
        >
          <RefreshCw size={14} className={scan.isPending ? "animate-spin" : ""} /> Analyser les développements
        </button>
        {scan.data && (
          <span className="text-[11px] text-[#6B7280]">
            {scan.data.scanned} détecté(s) · {scan.data.created} nouveau(x)
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { key: "", label: "Tous types" },
          { key: "api", label: "APIs" },
          { key: "table", label: "Tables" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setKind(s.key)}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${kind === s.key ? "bg-[#111] text-white" : "bg-white text-[#374151] border border-[#E5E7EB]"}`}
          >
            {s.label}
          </button>
        ))}
        <span className="mx-1 self-center text-[#D1D5DB]">|</span>
        {[
          { key: "", label: "Toutes perm." },
          { key: "requise", label: "À définir" },
          { key: "definie", label: "Définies" },
          { key: "publique", label: "Publiques" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setPermission(s.key)}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${permission === s.key ? "bg-[#111] text-white" : "bg-white text-[#374151] border border-[#E5E7EB]"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty msg="Aucun développement enregistré. Appuie sur « Analyser les développements » pour détecter les APIs et tables réelles." />
      ) : (
        <div className="space-y-2">
          {items.map((d) => (
            <div key={d.id} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[9px] font-bold uppercase text-[#6B7280]">
                      {DEV_KIND_LABELS[d.kind] ?? d.kind}
                    </span>
                    {d.subtype && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-600">
                        {d.subtype}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        d.permission === "requise"
                          ? "bg-red-100 text-red-700"
                          : d.permission === "definie"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {DEV_PERMISSION_LABELS[d.permission ?? "na"] ?? d.permission}
                    </span>
                    {d.status === "surveille" && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                        Sous surveillance
                      </span>
                    )}
                    {d.status === "ignore" && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500">
                        Ignoré
                      </span>
                    )}
                  </div>
                  <p className="mt-1 break-all text-sm font-semibold text-[#111]">{d.name}</p>
                  {d.functionGuess && (
                    <p className="mt-0.5 text-[11px] text-[#6B7280]">{d.functionGuess}</p>
                  )}
                  {d.permissionModule && (
                    <p className="mt-0.5 text-[10px] text-[#9CA3AF]">Module : {d.permissionModule}</p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {d.status !== "surveille" && (
                  <button
                    onClick={() => review.mutate({ id: d.id, status: "surveille" })}
                    disabled={review.isPending}
                    className="rounded-lg bg-[#111] px-2.5 py-1 text-[10px] font-bold text-white disabled:opacity-40"
                  >
                    Mettre sous surveillance
                  </button>
                )}
                {d.permission === "requise" && (
                  <button
                    onClick={() => review.mutate({ id: d.id, permission: "definie" })}
                    disabled={review.isPending}
                    className="rounded-lg bg-[#D4AF37] px-2.5 py-1 text-[10px] font-bold text-white disabled:opacity-40"
                  >
                    Marquer permission définie
                  </button>
                )}
                {d.status !== "ignore" && (
                  <button
                    onClick={() => review.mutate({ id: d.id, status: "ignore" })}
                    disabled={review.isPending}
                    className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1 text-[10px] font-bold text-[#6B7280] disabled:opacity-40"
                  >
                    Ignorer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OptimisationTab() {
  const [status, setStatus] = useState<string>("");
  const stats = trpc.smartEngine.optimizationStats.useQuery();
  const list = trpc.smartEngine.optimizationsList.useQuery({
    status: (status || undefined) as "proposed" | "applied" | "rejected" | undefined,
    limit: 100,
  });
  const utils = trpc.useUtils();
  const refresh = () => {
    utils.smartEngine.optimizationsList.invalidate();
    utils.smartEngine.optimizationStats.invalidate();
  };
  const generate = trpc.smartEngine.optimizationsGenerate.useMutation({ onSuccess: refresh });
  const review = trpc.smartEngine.optimizationReview.useMutation({ onSuccess: refresh });

  const items = list.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111]">Auto-optimisation</h2>
        <span className="rounded-full bg-[#111] px-2.5 py-1 text-[10px] font-bold text-[#D4AF37]">
          {stats.data?.total ?? 0} proposition(s)
        </span>
      </div>
      <p className="text-[11px] text-[#6B7280]">
        Le Système Intelligent analyse la plateforme et <b>propose</b> des optimisations (vitesse,
        classement, qualité, mots-clés, filtres, suggestions). Il ne modifie <b>jamais</b> une règle
        métier sans ton accord — toi seul appliques ou rejettes chaque proposition.
      </p>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Proposées" value={stats.data?.proposed ?? 0} color="orange" icon={Clock} />
        <StatCard label="Appliquées" value={stats.data?.applied ?? 0} color="green" icon={CheckCircle2} />
        <StatCard label="Rejetées" value={stats.data?.rejected ?? 0} color="red" icon={XCircle} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="flex items-center gap-1 rounded-xl bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
        >
          <RefreshCw size={14} className={generate.isPending ? "animate-spin" : ""} /> Analyser & proposer
        </button>
        {generate.data && (
          <span className="text-[11px] text-[#6B7280]">
            {generate.data.created} nouvelle(s) proposition(s)
          </span>
        )}
      </div>

      <div className="flex gap-1.5">
        {[
          { key: "", label: "Toutes" },
          { key: "proposed", label: "Proposées" },
          { key: "applied", label: "Appliquées" },
          { key: "rejected", label: "Rejetées" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setStatus(s.key)}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${status === s.key ? "bg-[#111] text-white" : "bg-white text-[#374151] border border-[#E5E7EB]"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty msg="Aucune proposition. Appuie sur « Analyser & proposer » pour générer des optimisations à partir des données réelles." />
      ) : (
        <div className="space-y-2">
          {items.map((o) => (
            <div key={o.id} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[9px] font-bold uppercase text-[#6B7280]">
                      {OPT_CATEGORY_LABELS[o.category] ?? o.category}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        o.impact === "eleve"
                          ? "bg-red-100 text-red-700"
                          : o.impact === "faible"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      Impact {o.impact}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#111]">{o.title}</p>
                  {o.detail && <p className="mt-0.5 text-[11px] text-[#6B7280]">{o.detail}</p>}
                  {o.recommendation && (
                    <p className="mt-1 rounded-lg bg-[#F5F3EF] px-2 py-1 text-[11px] text-[#374151]">
                      💡 {o.recommendation}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    o.status === "applied"
                      ? "bg-green-100 text-green-700"
                      : o.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {o.status === "applied" ? "Appliquée" : o.status === "rejected" ? "Rejetée" : "Proposée"}
                </span>
              </div>
              {o.status === "proposed" && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => review.mutate({ id: o.id, decision: "applied" })}
                    disabled={review.isPending}
                    className="rounded-lg bg-green-600 px-3 py-1 text-[11px] font-bold text-white disabled:opacity-40"
                  >
                    Appliquer
                  </button>
                  <button
                    onClick={() => review.mutate({ id: o.id, decision: "rejected" })}
                    disabled={review.isPending}
                    className="rounded-lg border border-[#E5E7EB] px-3 py-1 text-[11px] font-semibold text-[#374151] disabled:opacity-40"
                  >
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Moteurs connectés (hub d'observation)
   ═══════════════════════════════════════════════════════════ */
const HEALTH_UI: Record<string, { label: string; dot: string; badge: string }> = {
  ok: { label: "En bonne santé", dot: "bg-green-500", badge: "bg-green-100 text-green-700" },
  degraded: { label: "Dégradé", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  down: { label: "Hors service", dot: "bg-red-500", badge: "bg-red-100 text-red-700" },
  unknown: { label: "Inconnu", dot: "bg-gray-400", badge: "bg-gray-100 text-gray-500" },
};

function MoteursTab() {
  const engines = trpc.smartEngine.enginesOverview.useQuery();
  const list = engines.data ?? [];
  const total = list.length;
  const actifs = list.filter((e: any) => e.status === "actif").length;
  const degradedList = list.filter(
    (e: any) => e.health === "degraded" || e.health === "down",
  );

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#111]">Moteurs connectés</h2>
      <p className="text-[11px] text-[#6B7280]">
        Le Système Intelligent observe <b>tous</b> les moteurs de la plateforme (source : registre
        central). Chaque moteur installé y apparaît automatiquement, avec son état et sa santé.
      </p>

      {!engines.isLoading && (
        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5">
            <span className="text-[10px] text-[#6B7280]">Moteurs observés </span>
            <span className="text-sm font-black text-[#111]">{total}</span>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5">
            <span className="text-[10px] text-green-700">Actifs </span>
            <span className="text-sm font-black text-green-800">{actifs}</span>
          </div>
          <div
            className={`rounded-lg border px-3 py-1.5 ${
              degradedList.length > 0
                ? "border-amber-200 bg-amber-50"
                : "border-[#E5E7EB] bg-white"
            }`}
          >
            <span className="text-[10px] text-amber-700">Dégradés / HS </span>
            <span className="text-sm font-black text-amber-800">{degradedList.length}</span>
          </div>
        </div>
      )}

      {!engines.isLoading && degradedList.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[11px] font-bold text-amber-800">
            {degradedList.length} moteur(s) à surveiller :
          </p>
          <p className="mt-1 text-[11px] text-amber-700">
            {degradedList.map((e: any) => e.name).join(", ")}
          </p>
        </div>
      )}

      {engines.isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-2">
          {list.map((e: any) => {
            const h = HEALTH_UI[e.health] ?? HEALTH_UI.unknown;
            return (
              <div key={e.key} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-[#D4AF37]" />
                    <span className="text-sm font-bold text-[#111]">{e.name}</span>
                    <span className="font-mono text-[10px] text-[#9CA3AF]">
                      {e.key} · v{e.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${h.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${h.dot}`} />
                      {h.label}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        e.status === "actif"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {e.status === "actif" ? "Actif" : "Prévu"}
                    </span>
                  </div>
                </div>
                {e.description && <p className="mt-1 text-[11px] text-[#6B7280]">{e.description}</p>}
                {e.dependencies?.length > 0 && (
                  <p className="mt-1 text-[10px] text-[#9CA3AF]">
                    Connecté à : {e.dependencies.join(", ")}
                  </p>
                )}

                {e.metrics.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {e.metrics.map((m: any, i: number) => (
                      <div key={i} className="rounded-lg bg-[#F5F3EF] p-2">
                        <p className="text-[10px] text-[#6B7280]">{m.label}</p>
                        <p className="text-lg font-black text-[#111]">{m.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {e.controlPath && (
                  <Link
                    to={e.controlPath}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 underline"
                  >
                    Ouvrir le centre de contrôle <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
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
              <p className="text-xs text-red-800">{s.query?.trim() ? s.query : formatFilters(s.filters)}</p>
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

function StatCard({ label, value, color, icon: Icon, onClick }: { label: string; value: number; color: string; icon: typeof Brain; onClick?: () => void }) {
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
  const inner = (
    <>
      <div className="flex items-center gap-1.5">
        <Icon size={12} />
        <span className="text-[10px] font-semibold">{label}</span>
      </div>
      <p className="mt-1 text-xl font-black">{value}</p>
    </>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className={`text-left rounded-xl border p-3 transition hover:ring-2 hover:ring-[#D4AF37]/60 active:scale-[0.98] ${cls}`}>
        {inner}
      </button>
    );
  }
  return <div className={`rounded-xl border p-3 ${cls}`}>{inner}</div>;
}

const FILTER_LABELS: Record<string, string> = {
  type: "Type",
  categorieAnnonce: "Catégorie",
  marque: "Marque",
  modele: "Modèle",
  ville: "Ville",
  prixMin: "Prix min",
  prixMax: "Prix max",
  anneeMin: "Année min",
  anneeMax: "Année max",
  carburant: "Carburant",
  boite: "Boîte",
  categorie: "Catégorie",
};

function formatFilters(filters: unknown): string {
  if (!filters || typeof filters !== "object") return "Recherche vide (aucun critère)";
  const entries = Object.entries(filters as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (entries.length === 0) return "Recherche vide (aucun critère)";
  return entries.map(([k, v]) => `${FILTER_LABELS[k] ?? k} : ${String(v)}`).join(" · ");
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
