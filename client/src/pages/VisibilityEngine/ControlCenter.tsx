/**
 * Tableau PDG « Visibilité & Croissance » — Moteur Central de Visibilité MKA.P-MS.
 *
 * Regroupe en un seul espace : SEO / visibilité Intelligence (GEO) / audience / réseaux
 * sociaux / mots-clés & intentions / promotions, par canal et par pays.
 * Lecture pour la Direction (PDG + Directeur) ; les actions de (re)génération
 * et de validation restent réservées au PDG (super_admin).
 *
 * Brand-neutral : aucun nom de fournisseur externe. Les réseaux sont des canaux
 * configurables (le nom vit dans la donnée du canal).
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import {
  ChevronLeft,
  Globe,
  Radio,
  Users,
  Sparkles,
  Tag,
  Megaphone,
  RefreshCw,
  CheckCircle2,
  Clock,
  BarChart3,
  Send,
  TrendingUp,
} from "lucide-react";

type Tab = "dashboard" | "canaux" | "audiences" | "geo" | "intentions" | "publications";

const TABS: { key: Tab; label: string; icon: typeof Globe }[] = [
  { key: "dashboard", label: "Vue d'ensemble", icon: BarChart3 },
  { key: "canaux", label: "Canaux", icon: Radio },
  { key: "audiences", label: "Audience", icon: Users },
  { key: "geo", label: "Visibilité assistants", icon: Sparkles },
  { key: "intentions", label: "Mots-clés & intentions", icon: Tag },
  { key: "publications", label: "Publications", icon: Send },
];

function Stat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
      <p className={`text-lg font-black ${accent}`}>{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
      <p className="text-[9px] text-[#6B7280] mt-0.5">{label}</p>
    </div>
  );
}

export default function VisibilityControlCenter() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const utils = trpc.useUtils();

  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const isPdg = user?.role === "super_admin";

  const overview = trpc.visibilityOs.overview.useQuery(undefined, { enabled: !!isDirection });
  const channels = trpc.visibilityOs.channels.useQuery(undefined, { enabled: !!isDirection });
  const audiences = trpc.visibilityOs.audiences.useQuery({ limit: 100 }, { enabled: !!isDirection && tab === "audiences" });
  const aiAnswers = trpc.visibilityOs.aiAnswers.useQuery(undefined, { enabled: !!isDirection && tab === "geo" });
  const intents = trpc.visibilityOs.intents.useQuery({ limit: 200 }, { enabled: !!isDirection && tab === "intentions" });
  const publications = trpc.visibilityOs.publications.useQuery({ limit: 100 }, { enabled: !!isDirection && tab === "publications" });

  const rebuildAudiences = trpc.visibilityOs.rebuildAudiences.useMutation({ onSuccess: () => { utils.visibilityOs.audiences.invalidate(); utils.visibilityOs.overview.invalidate(); } });
  const seedAi = trpc.visibilityOs.seedAiAnswers.useMutation({ onSuccess: () => { utils.visibilityOs.aiAnswers.invalidate(); utils.visibilityOs.overview.invalidate(); } });
  const seedIntents = trpc.visibilityOs.seedIntents.useMutation({ onSuccess: () => { utils.visibilityOs.intents.invalidate(); utils.visibilityOs.overview.invalidate(); } });
  const refreshTrends = trpc.visibilityOs.refreshTrends.useMutation({ onSuccess: () => { utils.visibilityOs.intents.invalidate(); utils.visibilityOs.overview.invalidate(); } });
  const setChannel = trpc.visibilityOs.setChannel.useMutation({ onSuccess: () => { utils.visibilityOs.channels.invalidate(); } });
  const validatePub = trpc.visibilityOs.validatePublication.useMutation({ onSuccess: () => { utils.visibilityOs.publications.invalidate(); utils.visibilityOs.overview.invalidate(); } });

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const ov = overview.data;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Globe size={20} className="text-[#D4AF37]" /> Visibilité &amp; Croissance</h1>
        <p className="text-[11px] text-white/50 mt-1">Un seul moteur : SEO · visibilité Intelligence · audience · réseaux · mots-clés · promotions.</p>
      </div>

      {/* Onglets */}
      <div className="px-4 mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold ${tab === t.key ? "bg-[#D4AF37] text-[#111]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}
            >
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Vue d'ensemble */}
      {tab === "dashboard" && (
        <div className="px-4 mt-4 space-y-4">
          {overview.isLoading && <p className="text-sm text-[#6B7280]">Chargement…</p>}
          {ov && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Canaux actifs" value={`${ov.channels.enabled}/${ov.channels.total}`} accent="text-blue-500" />
                <Stat label="Contenus 24h" value={ov.content24h} accent="text-[#D4AF37]" />
                <Stat label="Publications publiées" value={ov.publications.published} accent="text-green-600" />
                <Stat label="En attente de validation" value={ov.publications.prepared} accent="text-orange-500" />
                <Stat label="Audiences propriétaires" value={ov.audiences.owner} accent="text-blue-500" />
                <Stat label="Audiences campagne (brouillon)" value={ov.audiences.external} accent="text-purple-500" />
                <Stat label="Réponses Intelligence / GEO" value={ov.aiAnswers} accent="text-teal-600" />
                <Stat label="Intentions" value={ov.intents.total} accent="text-[#D4AF37]" />
                <Stat label="Intentions tendance" value={ov.intents.trending} accent="text-pink-600" />
              </div>

              <div className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <p className="text-xs font-black text-[#111] mb-2 flex items-center gap-1"><BarChart3 size={14} className="text-[#D4AF37]" /> Événements (24h)</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-base font-black text-blue-500">{ov.events24h.impressions.toLocaleString("fr-FR")}</p><p className="text-[8px] text-[#6B7280]">Impressions</p></div>
                  <div><p className="text-base font-black text-[#D4AF37]">{ov.events24h.clicks.toLocaleString("fr-FR")}</p><p className="text-[8px] text-[#6B7280]">Clics</p></div>
                  <div><p className="text-base font-black text-green-600">{ov.events24h.conversions.toLocaleString("fr-FR")}</p><p className="text-[8px] text-[#6B7280]">Conversions</p></div>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <p className="text-xs font-black text-[#111] mb-2 flex items-center gap-1"><Radio size={14} className="text-[#D4AF37]" /> Publications par canal</p>
                <div className="space-y-1.5">
                  {ov.byChannel.map((c) => (
                    <div key={c.channelKey} className="flex items-center justify-between text-[11px]">
                      <span className={c.enabled ? "text-[#111]" : "text-[#9CA3AF] line-through"}>{c.label}</span>
                      <span className="font-bold text-[#6B7280]">{c.publications.toLocaleString("fr-FR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Canaux */}
      {tab === "canaux" && (
        <div className="px-4 mt-4 space-y-2">
          <p className="text-[11px] text-[#6B7280]">Activez/désactivez un canal et l'auto-publication (canaux organiques gratuits uniquement). Le nom réel du réseau est stocké dans la configuration du canal.</p>
          {(channels.data ?? []).map((c) => (
            <div key={c.channelKey} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#111]">{c.label}</p>
                  <p className="text-[9px] text-[#6B7280]">{c.kind}{c.requiresBudget ? " · nécessite un budget" : " · organique gratuit"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!isPdg || setChannel.isPending}
                    onClick={() => setChannel.mutate({ channelKey: c.channelKey, enabled: !c.enabled })}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${c.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} disabled:opacity-50`}
                  >
                    {c.enabled ? "Actif" : "Inactif"}
                  </button>
                  <button
                    disabled={!isPdg || c.requiresBudget || setChannel.isPending}
                    onClick={() => setChannel.mutate({ channelKey: c.channelKey, autoPublish: !c.autoPublish })}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${c.autoPublish ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"} disabled:opacity-50`}
                  >
                    Auto: {c.autoPublish ? "oui" : "non"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audience */}
      {tab === "audiences" && (
        <div className="px-4 mt-4 space-y-2">
          <button
            disabled={!isPdg || rebuildAudiences.isPending}
            onClick={() => rebuildAudiences.mutate()}
            className="w-full rounded-xl bg-[#111] text-white py-2 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={13} className={rebuildAudiences.isPending ? "animate-spin" : ""} /> Reconstruire les audiences
          </button>
          <p className="text-[10px] text-[#6B7280]">Propriétaire = gratuit et activable. Campagne = brouillon, aucune dépense engagée.</p>
          {(audiences.data ?? []).map((a) => (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#111]">{a.label}</p>
                <p className="text-[9px] text-[#6B7280]">{a.dimension}{a.country ? ` · ${a.country}` : ""} · {a.size.toLocaleString("fr-FR")}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${a.source === "owner" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                {a.source === "owner" ? "Propriétaire" : "Campagne (brouillon)"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Visibilité assistants / GEO */}
      {tab === "geo" && (
        <div className="px-4 mt-4 space-y-2">
          <div className="flex gap-2">
            <button
              disabled={!isPdg || seedAi.isPending}
              onClick={() => seedAi.mutate({})}
              className="flex-1 rounded-xl bg-[#111] text-white py-2 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles size={13} /> Générer les réponses
            </button>
            <a href="/assistants-ia.txt" target="_blank" rel="noreferrer" className="rounded-xl bg-white border border-[#E5E7EB] px-3 py-2 text-xs font-bold text-[#111] flex items-center gap-1">
              Feed public
            </a>
          </div>
          <p className="text-[10px] text-[#6B7280]">Contenu question/réponse structuré, découvrable par les assistants conversationnels. Aucune recommandation externe garantie.</p>
          {(aiAnswers.data ?? []).map((a) => (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
              <p className="text-[11px] font-bold text-[#111]">{a.question}</p>
              <p className="text-[10px] text-[#6B7280] mt-1">{a.answer}</p>
              <p className="text-[9px] text-teal-600 mt-1">{a.topic}{a.country ? ` · ${a.country}` : ""}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mots-clés & intentions */}
      {tab === "intentions" && (
        <div className="px-4 mt-4 space-y-2">
          <div className="flex gap-2">
            <button
              disabled={!isPdg || seedIntents.isPending}
              onClick={() => seedIntents.mutate({})}
              className="flex-1 rounded-xl bg-[#111] text-white py-2 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Tag size={13} /> Générer le socle
            </button>
            <button
              disabled={!isPdg || refreshTrends.isPending}
              onClick={() => refreshTrends.mutate()}
              className="flex-1 rounded-xl bg-white border border-[#E5E7EB] text-[#111] py-2 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <TrendingUp size={13} /> Recalculer les tendances
            </button>
          </div>
          <p className="text-[10px] text-[#6B7280]">Modèle 3 niveaux : mot-clé → question → intention. Tendances dérivées des recherches réelles.</p>
          {(intents.data ?? []).map((it) => (
            <div key={it.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-[#111]">{it.keyword}</p>
                {it.trendScore > 0 && <span className="rounded-full bg-pink-100 text-pink-700 px-2 py-0.5 text-[9px] font-bold">tendance {it.trendScore}</span>}
              </div>
              {it.question && <p className="text-[10px] text-[#6B7280] mt-0.5">{it.question}</p>}
              <p className="text-[9px] text-[#D4AF37] font-bold mt-1">{it.intention}</p>
            </div>
          ))}
        </div>
      )}

      {/* Publications (validation) */}
      {tab === "publications" && (
        <div className="px-4 mt-4 space-y-2">
          <p className="text-[11px] text-[#6B7280] flex items-center gap-1"><Megaphone size={12} /> Publications préparées — validez pour publier (organique).</p>
          {(publications.data ?? []).map((p) => (
            <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#111] truncate">{p.channelKey}</p>
                <p className="text-[9px] text-[#6B7280]">{p.country ?? "—"} · {p.detail}</p>
              </div>
              {p.status === "published" ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600"><CheckCircle2 size={12} /> Publié</span>
              ) : (
                <button
                  disabled={!isPdg || validatePub.isPending}
                  onClick={() => validatePub.mutate({ id: p.id })}
                  className="flex items-center gap-1 rounded-full bg-[#D4AF37] text-[#111] px-2.5 py-1 text-[10px] font-bold disabled:opacity-50"
                >
                  <Clock size={11} /> Valider
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
