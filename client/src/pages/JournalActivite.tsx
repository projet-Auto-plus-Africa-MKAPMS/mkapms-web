import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Clock, Filter, Search, AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";
import { trpc } from "../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   JOURNAL D'ACTIVITE MKA.P-MS (/journal-activite)
   Réutilise le vrai moteur d'audit déjà utilisé pour la traçabilité radar
   Direction (server/audit.ts : logAction(), table audit_logs, déjà exposée
   par trpc.admin.auditLog) — aucun second moteur créé.
   L'ancienne version affichait 23 entrées entièrement fabriquées couvrant
   trois catégories (Utilisateurs/Garages/Admin) : aucune de ces catégories
   n'a d'équivalent réel. audit_logs ne trace aujourd'hui QUE les actions du
   back-office (annonce.*, garage.*, kyc.*, account.*, promo.*, pub.*,
   staff.create) — jamais les actions des utilisateurs ou des garages
   eux-mêmes (connexion, favori, devis créé...), qui ne sont pas
   instrumentées. Ce périmètre réel et honnête remplace les catégories
   inventées : filtrage par type d'entité réel (entityType), recherche sur
   les vrais champs, gravité dérivée du nom réel de l'action (jamais une
   gravité inventée par enregistrement). « Imprimer »/« PDF » retirés :
   aucun moteur d'export n'existe.
   ══════════════════════════════════════════════════════════════════════════ */

type Gravite = "info" | "warning" | "critical";

function graviteDe(action: string): Gravite {
  if (action.includes("delete")) return "critical";
  if (action.includes("refus") || action.includes("reject")) return "warning";
  return "info";
}

const GRAVITE_COLORS: Record<Gravite, string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

const GRAVITE_BADGE: Record<Gravite, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export default function JournalActivite() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("tous");
  const [graviteFilter, setGraviteFilter] = useState<Gravite | "tous">("tous");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const logQuery = trpc.admin.auditLog.useQuery({ limit: 200 });
  const entries = logQuery.data ?? [];

  const entityTypes = [...new Set(entries.map((e) => e.entityType).filter((t): t is string => !!t))].sort();

  const filtered = entries.filter((e) => {
    if (entityFilter !== "tous" && e.entityType !== entityFilter) return false;
    const g = graviteDe(e.action);
    if (graviteFilter !== "tous" && g !== graviteFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return e.action.toLowerCase().includes(s) || (e.actorEmail ?? "").toLowerCase().includes(s) || (e.entityType ?? "").toLowerCase().includes(s);
    }
    return true;
  });

  const countByGravite = (g: Gravite) => entries.filter((e) => graviteDe(e.action) === g).length;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <Link to="/admin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Administration</Link>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Clock size={22} className="text-[#D4AF37]" /> Journal d'activite</h1>
        <p className="mt-1 text-xs text-white/50">Actions réelles du back-office — qui a fait quoi et quand</p>
      </div>

      {logQuery.isError && (
        <p className="mx-4 mt-4 text-sm text-red-600">Accès refusé ou erreur : {logQuery.error.message}</p>
      )}

      {!logQuery.isError && (
        <>
          {/* Stats rapides — cliquables */}
          <div className="mx-4 -mt-3 relative z-10 grid grid-cols-3 gap-2 mb-3">
            <button onClick={() => setGraviteFilter(graviteFilter === "info" ? "tous" : "info")} className={`rounded-xl border p-3 text-center transition hover:shadow-md ${graviteFilter === "info" ? "ring-2 ring-blue-400" : ""} bg-blue-50 border-blue-200`}>
              <div className="text-xl font-black text-blue-700">{countByGravite("info")}</div>
              <div className="text-[9px] font-bold text-blue-600">Info</div>
            </button>
            <button onClick={() => setGraviteFilter(graviteFilter === "warning" ? "tous" : "warning")} className={`rounded-xl border p-3 text-center transition hover:shadow-md ${graviteFilter === "warning" ? "ring-2 ring-amber-400" : ""} bg-amber-50 border-amber-200`}>
              <div className="text-xl font-black text-amber-700">{countByGravite("warning")}</div>
              <div className="text-[9px] font-bold text-amber-600">Alertes</div>
            </button>
            <button onClick={() => setGraviteFilter(graviteFilter === "critical" ? "tous" : "critical")} className={`rounded-xl border p-3 text-center transition hover:shadow-md ${graviteFilter === "critical" ? "ring-2 ring-red-400" : ""} bg-red-50 border-red-200`}>
              <div className="text-xl font-black text-red-700">{countByGravite("critical")}</div>
              <div className="text-[9px] font-bold text-red-600">Critiques</div>
            </button>
          </div>

          {/* Types d'entité réels — dérivés des données, jamais une catégorie fixe inventée */}
          {entityTypes.length > 0 && (
            <div className="px-4 flex gap-1.5 overflow-x-auto pb-2 mb-2">
              <button onClick={() => setEntityFilter("tous")} className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-[10px] font-bold border transition ${entityFilter === "tous" ? "bg-[#111] text-white border-[#111]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>
                Tous <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-black ${entityFilter === "tous" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{entries.length}</span>
              </button>
              {entityTypes.map((t) => (
                <button key={t} onClick={() => setEntityFilter(t)} className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-[10px] font-bold border transition ${entityFilter === t ? "bg-[#111] text-white border-[#111]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>
                  {t} <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-black ${entityFilter === t ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{entries.filter((e) => e.entityType === t).length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="px-4 mb-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par action, auteur, type..." className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#D4AF37]" />
            </div>
          </div>

          {/* Liste */}
          <div className="px-4 space-y-2">
            {logQuery.isLoading && <p className="text-sm text-slate-400 text-center py-8">Chargement…</p>}
            {!logQuery.isLoading && filtered.length === 0 && (
              <div className="rounded-xl bg-white border border-slate-200 p-8 text-center">
                <Filter size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">Aucune activite trouvee</p>
              </div>
            )}

            {filtered.map((e) => {
              const g = graviteDe(e.action);
              const isExpanded = expandedId === e.id;
              return (
                <div key={e.id}>
                  <button onClick={() => setExpandedId(isExpanded ? null : e.id)} className={`w-full text-left rounded-xl border p-3 transition hover:shadow-md cursor-pointer ${GRAVITE_COLORS[g]} ${isExpanded ? "ring-2 ring-[#D4AF37]/30" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${g === "critical" ? "bg-red-200" : g === "warning" ? "bg-amber-200" : "bg-blue-200"}`}>
                        {g === "critical" || g === "warning" ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold">{e.action}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${GRAVITE_BADGE[g]}`}>
                            {g === "info" ? "INFO" : g === "warning" ? "ALERTE" : "CRITIQUE"}
                          </span>
                        </div>
                        {e.entityType && <p className="text-[11px] mt-0.5 leading-snug">{e.entityType}{e.entityId ? ` #${e.entityId}` : ""}</p>}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-[9px] font-bold opacity-70">{e.actorEmail ?? "Système"}</span>
                          <span className="text-[9px] opacity-50">{new Date(e.createdAt).toLocaleString("fr-FR")}</span>
                          {e.ipAddress && <span className="text-[9px] opacity-40">IP: {e.ipAddress}</span>}
                        </div>
                      </div>
                      <ChevronDown size={14} className={`text-slate-400 shrink-0 mt-1 transition ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mx-2 rounded-b-xl bg-white border-x border-b border-slate-200 p-3 space-y-2 -mt-1">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-2">
                          <p className="text-slate-400">Auteur</p>
                          <p className="font-bold text-[#111]">{e.actorEmail ?? "Système"}</p>
                        </div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2">
                          <p className="text-slate-400">Date / Heure</p>
                          <p className="font-bold text-[#111]">{new Date(e.createdAt).toLocaleString("fr-FR")}</p>
                        </div>
                        {e.ipAddress && (
                          <div className="rounded-lg bg-[#F5F3EF] p-2 col-span-2">
                            <p className="text-slate-400">Adresse IP</p>
                            <p className="font-bold text-[#111]">{e.ipAddress}</p>
                          </div>
                        )}
                        {e.metadata != null && (
                          <div className="rounded-lg bg-[#F5F3EF] p-2 col-span-2">
                            <p className="text-slate-400">Détails</p>
                            <p className="font-mono text-[9px] text-[#111] break-all">{JSON.stringify(e.metadata)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mx-4 mt-6 rounded-xl bg-white border border-slate-200 p-4">
        <h3 className="text-xs font-bold text-[#111] mb-2">Informations</h3>
        <ul className="space-y-1 text-[10px] text-slate-500">
          <li>• Ce journal trace les actions du back-office (annonces, garages, KYC, comptes, promotions, publicités) — pas encore les actions des utilisateurs ou des garages eux-mêmes, qui ne sont pas instrumentées à ce jour.</li>
          <li>• Les 200 dernières actions sont affichées.</li>
          <li>• Seuls les comptes Direction ont accès au journal.</li>
        </ul>
      </div>
    </div>
  );
}
