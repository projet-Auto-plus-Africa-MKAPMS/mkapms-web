import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Cpu, Activity, CheckCircle, XCircle, AlertTriangle,
  Loader2, ChevronDown, RefreshCw, Zap, Globe, Search, Truck, GraduationCap,
  ShoppingCart, BarChart3, FileText, Users, Key, Bot, GitBranch, Layers,
  Clock, Server,
} from "lucide-react";
import { trpc } from "../../lib/trpc";

const CENTRE_ICONS: Record<string, any> = {
  services: Zap, recommandation: BarChart3, fournisseurs: Globe, distribution: Truck,
  formation: GraduationCap, b2b: ShoppingCart, statsIA: BarChart3, documents: FileText,
  partenaires: Users, openApi: Key, automation: Bot, workflow: GitBranch,
  recherche: Search, expansion: Globe, ecosysteme: Layers,
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  actif: { bg: "bg-green-50", text: "text-green-700", label: "Actif" },
  inactif: { bg: "bg-slate-100", text: "text-slate-500", label: "Inactif" },
  erreur: { bg: "bg-red-50", text: "text-red-700", label: "Erreur" },
  maintenance: { bg: "bg-amber-50", text: "text-amber-700", label: "Maintenance" },
};

const LOG_LEVEL_STYLES: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warn: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  debug: "bg-slate-100 text-slate-600",
};

type TabKey = "centres" | "logs" | "communications" | "sante";

export default function CoreEngineBeta() {
  const [tab, setTab] = useState<TabKey>("centres");
  const [expandedCentre, setExpandedCentre] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<{ centre?: string; level?: "info" | "warn" | "error" | "debug" }>({});

  const overview = trpc.coreEngine.beta.overview.useQuery();
  const logs = trpc.coreEngine.beta.logs.useQuery({ centre: logFilter.centre, level: logFilter.level, limit: 100 });
  const comms = trpc.coreEngine.beta.communications.useQuery();

  const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: "centres", label: "15 Centres", icon: Cpu },
    { key: "sante", label: "Sant\u00e9", icon: Activity },
    { key: "logs", label: "Journal", icon: Clock },
    { key: "communications", label: "Comms", icon: GitBranch },
  ];

  const data = overview.data;
  const loading = overview.isLoading;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Super Admin
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Cpu size={20} className="text-[#D4AF37]" /> Core Engine
            </h1>
            <p className="mt-0.5 text-xs text-white/50">B\u00eata - PDG / Direction uniquement</p>
          </div>
          <div className="bg-amber-500/20 rounded-full px-3 py-1">
            <span className="text-[10px] font-bold text-amber-400">B\u00caTA</span>
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      {data && (
        <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-1.5 mb-3">
          <div className="rounded-lg bg-white border border-[#E5E7EB] p-2 text-center shadow-sm">
            <p className="text-sm font-black text-[#D4AF37]">15</p>
            <p className="text-[7px] text-[#6B7280]">Centres</p>
          </div>
          <div className="rounded-lg bg-white border border-[#E5E7EB] p-2 text-center shadow-sm">
            <p className="text-sm font-black text-green-600">{data.totalEvents}</p>
            <p className="text-[7px] text-[#6B7280]">\u00c9v\u00e9nements</p>
          </div>
          <div className="rounded-lg bg-white border border-[#E5E7EB] p-2 text-center shadow-sm">
            <p className="text-sm font-black text-red-500">{data.failedActions}</p>
            <p className="text-[7px] text-[#6B7280]">Erreurs</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 mb-3">
        <div className="flex gap-1 rounded-xl bg-white border border-[#E5E7EB] p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-[10px] font-bold transition ${
                  tab === t.key ? "bg-[#111] text-white" : "text-[#6B7280] hover:bg-slate-50"
                }`}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-[#D4AF37]" />
        </div>
      )}

      {/* ═══ ONGLET CENTRES ═══ */}
      {tab === "centres" && data && (
        <div className="px-4 space-y-2">
          {data.centres.map((c: any) => {
            const Icon = CENTRE_ICONS[c.key] || Server;
            const isExpanded = expandedCentre === c.key;
            const healthStatus = c.health?.status ?? "actif";
            const style = STATUS_STYLES[healthStatus] || STATUS_STYLES.actif;
            return (
              <div key={c.key} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <button
                  onClick={() => setExpandedCentre(isExpanded ? null : c.key)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                    <Icon size={16} className="text-[#D4AF37]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111] truncate">{c.label}</p>
                    <p className="text-[10px] text-[#6B7280]">{c.count} enregistrement{c.count !== 1 ? "s" : ""}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <ChevronDown size={14} className={`text-[#6B7280] transition ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                {isExpanded && (
                  <div className="border-t border-[#E5E7EB] px-3 py-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-xs font-black text-[#111]">{c.health?.requestCount24h ?? 0}</p>
                        <p className="text-[8px] text-[#6B7280]">Requ\u00eates/24h</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-xs font-black text-[#111]">{c.health?.avgResponseMs ?? "-"}</p>
                        <p className="text-[8px] text-[#6B7280]">Temps r\u00e9p. (ms)</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-xs font-black text-[#111]">{c.health?.errorCount24h ?? 0}</p>
                        <p className="text-[8px] text-[#6B7280]">Erreurs/24h</p>
                      </div>
                    </div>
                    {c.health?.lastError && (
                      <div className="rounded-lg bg-red-50 p-2">
                        <p className="text-[9px] font-semibold text-red-700">Derni\u00e8re erreur :</p>
                        <p className="text-[9px] text-red-600 mt-0.5">{c.health.lastError}</p>
                      </div>
                    )}
                    <p className="text-[9px] text-[#6B7280]">
                      Table : <span className="font-mono text-[#111]">{c.table}</span>
                    </p>
                    <p className="text-[9px] text-[#6B7280]">
                      Uptime : <span className="font-bold text-green-600">{c.health?.uptime ?? "100"}%</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ ONGLET SANT\u00c9 ═══ */}
      {tab === "sante" && data && (
        <div className="px-4 space-y-3">
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h2 className="text-sm font-bold text-[#111] flex items-center gap-2 mb-3">
              <Activity size={16} className="text-[#D4AF37]" /> Tableau de Sant\u00e9
            </h2>
            <div className="space-y-1.5">
              {data.centres.map((c: any) => {
                const healthStatus = c.health?.status ?? "actif";
                const style = STATUS_STYLES[healthStatus] || STATUS_STYLES.actif;
                const Icon = healthStatus === "actif" ? CheckCircle : healthStatus === "erreur" ? XCircle : AlertTriangle;
                const iconColor = healthStatus === "actif" ? "text-green-500" : healthStatus === "erreur" ? "text-red-500" : "text-amber-500";
                return (
                  <div key={c.key} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                    <Icon size={14} className={iconColor} />
                    <span className="flex-1 text-xs font-medium text-[#111]">{c.label}</span>
                    <span className="text-[9px] text-[#6B7280]">{c.health?.avgResponseMs ?? "-"} ms</span>
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${style.bg} ${style.text}`}>{style.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h2 className="text-sm font-bold text-[#111] mb-3">Orchestration r\u00e9cente</h2>
            {data.recentOrchestration.length === 0 ? (
              <p className="text-xs text-[#6B7280]">Aucune orchestration encore.</p>
            ) : (
              <div className="space-y-1.5">
                {data.recentOrchestration.map((o: any) => (
                  <div key={o.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-[10px]">
                    <Zap size={12} className="text-[#D4AF37]" />
                    <span className="font-semibold text-[#111]">{o.eventType}</span>
                    <span className="text-[#6B7280]">{o.sourceModule}</span>
                    <span className="ml-auto text-green-600 font-bold">{o.actionsSucceeded}/{o.actionsTriggered}</span>
                    {o.actionsFailed > 0 && <span className="text-red-600 font-bold">{o.actionsFailed} err</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ ONGLET JOURNAL ═══ */}
      {tab === "logs" && (
        <div className="px-4 space-y-3">
          <div className="flex gap-2">
            <select
              value={logFilter.centre ?? ""}
              onChange={(e) => setLogFilter({ ...logFilter, centre: e.target.value || undefined })}
              className="flex-1 rounded-lg border border-[#E5E7EB] bg-white px-2 py-1.5 text-xs"
            >
              <option value="">Tous les centres</option>
              {data?.centres.map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <select
              value={logFilter.level ?? ""}
              onChange={(e) => setLogFilter({ ...logFilter, level: (e.target.value || undefined) as any })}
              className="w-24 rounded-lg border border-[#E5E7EB] bg-white px-2 py-1.5 text-xs"
            >
              <option value="">Niveau</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            {logs.isLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#D4AF37]" /></div>
            ) : (logs.data?.length ?? 0) === 0 ? (
              <div className="p-6 text-center">
                <Clock size={28} className="mx-auto text-[#D4AF37] mb-2" />
                <p className="text-xs text-[#6B7280]">Aucun log encore. Le journal se remplira automatiquement.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {logs.data?.map((log: any) => (
                  <div key={log.id} className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${LOG_LEVEL_STYLES[log.level] || LOG_LEVEL_STYLES.info}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-semibold text-[#111]">{log.centre}</span>
                      <span className="text-[9px] text-[#6B7280]">{log.action}</span>
                      {log.durationMs != null && <span className="ml-auto text-[9px] text-[#6B7280]">{log.durationMs}ms</span>}
                    </div>
                    {log.message && <p className="text-[10px] text-[#374151]">{log.message}</p>}
                    {log.error && <p className="text-[10px] text-red-600 mt-0.5">{log.error}</p>}
                    <p className="text-[8px] text-[#9CA3AF] mt-1">{new Date(log.createdAt).toLocaleString("fr-FR")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ ONGLET COMMUNICATIONS ═══ */}
      {tab === "communications" && (
        <div className="px-4 space-y-3">
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h2 className="text-sm font-bold text-[#111] flex items-center gap-2 mb-3">
              <GitBranch size={16} className="text-[#D4AF37]" /> Liens inter-modules
            </h2>
            {comms.isLoading ? (
              <Loader2 size={20} className="animate-spin text-[#D4AF37] mx-auto" />
            ) : (comms.data?.links.length ?? 0) === 0 ? (
              <p className="text-xs text-[#6B7280]">Aucun lien configur\u00e9 encore.</p>
            ) : (
              <div className="space-y-1.5">
                {comms.data?.links.map((link: any) => (
                  <div key={link.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-[10px]">
                    <span className="font-bold text-[#111]">{link.sourceModule}</span>
                    <span className="text-[#D4AF37]">{link.sourceAction}</span>
                    <span className="text-[#6B7280]">\u2192</span>
                    <span className="font-bold text-[#111]">{link.targetModule}</span>
                    <span className="text-[#D4AF37]">{link.targetAction}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h2 className="text-sm font-bold text-[#111] flex items-center gap-2 mb-3">
              <Zap size={16} className="text-[#D4AF37]" /> \u00c9v\u00e9nements r\u00e9cents
            </h2>
            {comms.isLoading ? (
              <Loader2 size={20} className="animate-spin text-[#D4AF37] mx-auto" />
            ) : (comms.data?.recentEvents.length ?? 0) === 0 ? (
              <p className="text-xs text-[#6B7280]">Aucun \u00e9v\u00e9nement encore.</p>
            ) : (
              <div className="space-y-1.5">
                {comms.data?.recentEvents.map((ev: any) => (
                  <div key={ev.id} className="rounded-lg bg-slate-50 p-2">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="font-bold text-[#111]">{ev.eventType}</span>
                      <span className="text-[#6B7280]">{ev.sourceModule}</span>
                      <span className="ml-auto text-[8px] text-[#9CA3AF]">{new Date(ev.createdAt).toLocaleString("fr-FR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h2 className="text-sm font-bold text-[#111] flex items-center gap-2 mb-3">
              <Bot size={16} className="text-[#D4AF37]" /> Actions d\u00e9clench\u00e9es
            </h2>
            {comms.isLoading ? (
              <Loader2 size={20} className="animate-spin text-[#D4AF37] mx-auto" />
            ) : (comms.data?.recentActions.length ?? 0) === 0 ? (
              <p className="text-xs text-[#6B7280]">Aucune action encore.</p>
            ) : (
              <div className="space-y-1.5">
                {comms.data?.recentActions.map((act: any) => {
                  const statusColor = act.status === "termine" ? "text-green-600" : act.status === "echoue" ? "text-red-600" : "text-amber-600";
                  return (
                    <div key={act.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-[10px]">
                      <span className="font-bold text-[#111]">{act.actionType}</span>
                      <span className="text-[#6B7280]">\u2192 {act.targetModule}</span>
                      <span className={`ml-auto font-bold ${statusColor}`}>{act.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-4 mt-6">
        <p className="text-center text-[9px] text-[#9CA3AF]">
          Core Engine B\u00eata \u00b7 Accessible uniquement PDG / Direction \u00b7 Non visible par les utilisateurs
        </p>
      </div>
    </div>
  );
}
