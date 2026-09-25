import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Euro, ArrowDown, AlertCircle, ChevronDown, Check, Clock, ShieldCheck, X, RotateCcw } from "lucide-react";
import { DocumentView, buildFactureData } from "../../components/DocumentPDF";
import { trpc } from "../../lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@server/router.js";

/* ══════════════════════════════════════════════════════════════════════════
   GESTION PAIEMENTS (superadmin)
   Données réelles : trpc.admin.paymentsList/paymentsStats (server/routers/
   admin.ts), qui lisent la table payments jointe à users pour le vrai nom du
   client. "Relancer" envoie une vraie notification in-app au client
   (admin.relancerPaiement) — jamais une nouvelle session Stripe recréée à
   partir d'un identifiant deviné : l'audit externe du 24 septembre a signalé
   ce risque précis (ne jamais réutiliser un identifiant de paiement de
   démonstration pour une relance). La référence affichée est soit le vrai
   identifiant Stripe de la transaction, soit l'id interne réel du paiement —
   jamais une référence "PAY-20250609-001" inventée.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUT_LABEL: Record<string, string> = { paid: "réussi", failed: "échoué", refunded: "remboursé", pending: "en attente", cancelled: "annulé" };
const STATUT_STYLE: Record<string, string> = {
  paid: "bg-green-50 text-green-700", failed: "bg-red-50 text-red-700", refunded: "bg-amber-50 text-amber-700", pending: "bg-slate-100 text-slate-600", cancelled: "bg-slate-100 text-slate-600",
};

type Paiement = inferRouterOutputs<AppRouter>["admin"]["paymentsList"][number];

function reference(p: Paiement) {
  return p.stripePaymentIntentId || `PAY-${p.id}`;
}

export default function AdminPaiements() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<"tous" | "paid" | "failed" | "refunded" | "pending">("tous");
  const [viewFacture, setViewFacture] = useState<Paiement | null>(null);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const audit = trpc.paymentEngine.audit.useQuery(undefined, { enabled: showAudit });
  const [showRegistry, setShowRegistry] = useState(false);
  const products = trpc.paymentEngine.productsAll.useQuery(undefined, { enabled: showRegistry });
  const utils = trpc.useUtils();
  const seedProducts = trpc.paymentEngine.seedProducts.useMutation({
    onSuccess: () => utils.paymentEngine.productsAll.invalidate(),
  });

  const statsQ = trpc.admin.paymentsStats.useQuery();
  const listQ = trpc.admin.paymentsList.useQuery({ limit: 100, status: filter === "tous" ? undefined : filter });
  const relancer = trpc.admin.relancerPaiement.useMutation({
    onSuccess: () => { setActionDone("Notification envoyée au client"); setTimeout(() => setActionDone(null), 2500); },
    onError: (e) => alert(e.message),
  });
  const [actionDone, setActionDone] = useState<string | null>(null);

  const paiements = listQ.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Euro size={20} className="text-[#D4AF37]" /> Gestion paiements</h1>
        <button
          onClick={() => setShowAudit(true)}
          className="mt-3 w-full rounded-lg bg-white/10 py-2 text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <ShieldCheck size={14} className="text-[#D4AF37]" /> Audit du Payment OS (couverture réelle)
        </button>
        <button
          onClick={() => setShowRegistry(true)}
          className="mt-2 w-full rounded-lg bg-white/10 py-2 text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Euro size={14} className="text-[#D4AF37]" /> Registre produits & tarifs (prix serveur)
        </button>
      </div>

      {actionDone && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2">
          <Check size={16} /> {actionDone}
        </div>
      )}

      {showRegistry && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60" onClick={() => setShowRegistry(false)}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-[#111] flex items-center gap-2"><Euro size={18} className="text-[#D4AF37]" /> Registre produits & tarifs</h3>
              <button onClick={() => setShowRegistry(false)} className="text-[#9CA3AF]"><X size={18} /></button>
            </div>
            <p className="text-[11px] text-[#6B7280] mb-3">
              Source unique des prix. Le serveur résout toujours le montant depuis ce registre — jamais depuis le navigateur.
            </p>
            <button
              onClick={() => seedProducts.mutate()}
              disabled={seedProducts.isPending}
              className="mb-3 w-full rounded-lg bg-[#111] py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {seedProducts.isPending ? "Alimentation…" : "Alimenter / compléter le catalogue"}
            </button>
            {seedProducts.data && (
              <p className="mb-3 text-[11px] text-green-700">{seedProducts.data.inserted} produit(s) ajouté(s) · {seedProducts.data.total} au total.</p>
            )}
            {products.isLoading ? (
              <p className="text-xs text-[#6B7280]">Chargement…</p>
            ) : products.data && products.data.length > 0 ? (
              <div className="space-y-1.5">
                {products.data.map((p) => (
                  <div key={p.id} className="rounded-lg border border-[#E5E1D8] p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#111]">{p.name}</span>
                      <span className="text-[11px] font-black text-[#111]">{p.price.toFixed(2)} {p.currency}{p.paymentType === "recurring" ? `/${p.periodicity === "yearly" ? "an" : "mois"}` : ""}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[9px] text-[#6B7280]">{p.univers}</span>
                      <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[9px] text-[#6B7280]">TVA {p.vatRate}%</span>
                      <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[9px] text-[#6B7280]">{p.beneficiary}{p.commissionRate > 0 ? ` · ${p.commissionRate}%` : ""}</span>
                      {p.validityDays > 0 && <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[9px] text-[#6B7280]">{p.validityDays}j</span>}
                      {!p.active && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] text-red-700">inactif</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6B7280]">Registre vide — cliquez sur « Alimenter » pour importer le catalogue.</p>
            )}
          </div>
        </div>
      )}

      {showAudit && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60" onClick={() => setShowAudit(false)}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-[#111] flex items-center gap-2"><ShieldCheck size={18} className="text-[#D4AF37]" /> Audit Payment OS</h3>
              <button onClick={() => setShowAudit(false)} className="text-[#9CA3AF]"><X size={18} /></button>
            </div>
            {audit.isLoading ? (
              <p className="text-xs text-[#6B7280]">Analyse du moteur de paiement…</p>
            ) : audit.data ? (
              <div className="space-y-4">
                <p className="text-[11px] text-[#6B7280]">
                  {audit.data.totals.transactions} transaction(s) dans le moteur interne · {audit.data.countryRulesCount} règle(s) pays · {audit.data.methods.length} moyens · {audit.data.statuses.length} statuts.
                </p>

                {audit.data.gaps.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[11px] font-bold text-amber-900 mb-1">Écarts détectés</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {audit.data.gaps.map((g, i) => (
                        <li key={i} className="text-[10px] text-amber-900">{g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold text-[#111] mb-1">Cas de paiement</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {audit.data.cases.map((c) => (
                      <div key={c.key} className={`rounded-lg border p-2 ${c.covered ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                        <div className="flex items-center gap-1">
                          {c.covered ? <Check size={11} className="text-green-600 shrink-0" /> : <AlertCircle size={11} className="text-red-500 shrink-0" />}
                          <span className="text-[10px] font-bold text-[#111]">{c.label}</span>
                        </div>
                        <span className="text-[9px] text-[#6B7280]">{c.observed} transaction(s)</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-[#111] mb-1">Webhooks Stripe (Phase 35)</p>
                  <div className="space-y-1">
                    {audit.data.webhooks.map((w) => (
                      <div key={w.event} className="flex items-center justify-between text-[10px]">
                        <span className="text-[#111]">{w.label}</span>
                        <span className={`rounded-full px-2 py-0.5 font-bold ${w.handled ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {w.handled ? "traité" : "à brancher"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-red-600">{audit.error?.message ?? "Audit indisponible."}</p>
            )}
          </div>
        </div>
      )}

      {/* Stats grille */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {[
          { id: "paid" as const, l: "CA du jour", v: statsQ.data ? `${Number(statsQ.data.caJourEur).toLocaleString("fr-FR")} EUR` : "—", icon: ArrowDown, c: "text-green-500", bg: "bg-green-50" },
          { id: "paid" as const, l: "CA du mois", v: statsQ.data ? `${Number(statsQ.data.caMoisEur).toLocaleString("fr-FR")} EUR` : "—", icon: Euro, c: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
          { id: "failed" as const, l: "Échoués", v: statsQ.data ? String(statsQ.data.echoues) : "—", icon: AlertCircle, c: "text-red-500", bg: "bg-red-50" },
          { id: "pending" as const, l: "En attente", v: statsQ.data ? String(statsQ.data.enAttente) : "—", icon: Clock, c: "text-amber-500", bg: "bg-amber-50" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <button key={i} onClick={() => setFilter(s.id)} className={`rounded-xl bg-white border p-3 flex items-center gap-3 active:scale-[0.97] ${filter === s.id ? "border-[#D4AF37] ring-1 ring-[#D4AF37]" : "border-[#E5E7EB]"}`}>
              <div className={`h-9 w-9 rounded-lg ${s.bg} grid place-items-center`}><Icon size={16} className={s.c} /></div>
              <div className="text-left"><p className="text-[10px] text-[#6B7280]">{s.l}</p><p className={`text-sm font-black ${s.c}`}>{s.v}</p></div>
            </button>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="px-4 mt-3 flex gap-2">
        {(["tous", "paid", "failed", "refunded"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-bold ${filter === f ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {f === "tous" ? "Tous" : f === "paid" ? "Réussis" : f === "failed" ? "Échoués" : "Remboursés"}
          </button>
        ))}
      </div>

      {/* Liste paiements */}
      <div className="px-4 mt-3 space-y-2">
        {listQ.isLoading && <p className="text-center text-xs text-[#9CA3AF] py-8">Chargement…</p>}
        {!listQ.isLoading && paiements.length === 0 && <p className="text-center text-xs text-[#9CA3AF] py-8">Aucun paiement trouvé.</p>}
        {paiements.map((p) => {
          const isExp = expanded === p.id;
          return (
            <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : p.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${p.status === "paid" ? "bg-green-50" : p.status === "failed" ? "bg-red-50" : "bg-amber-50"}`}>
                  {p.status === "paid" ? <Check size={14} className="text-green-600" /> : p.status === "failed" ? <AlertCircle size={14} className="text-red-500" /> : <Clock size={14} className="text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{p.clientName || p.clientEmail || `Utilisateur #${p.userId}`}</p>
                  <p className="text-[10px] text-[#6B7280]">{new Date(p.createdAt).toLocaleString("fr-FR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#D4AF37]">{Number(p.amount).toLocaleString("fr-FR")} {p.currency}</p>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ml-auto ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Référence</span><p className="font-bold text-[#111] truncate">{reference(p)}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Type</span><p className="font-bold text-[#111]">{p.type}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Statut</span><p className={`inline-block rounded-full px-2 py-0.5 font-bold ${STATUT_STYLE[p.status]}`}>{STATUT_LABEL[p.status] ?? p.status}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Client</span><p className="font-bold text-[#D4AF37] truncate">{p.clientEmail || "—"}</p></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setSelectedPaiement(p)} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Voir détails</button>
                    {p.status === "failed" && (
                      <button disabled={relancer.isPending} onClick={() => relancer.mutate({ paymentId: p.id })} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-50 py-1.5 text-[9px] font-bold text-red-600 active:scale-[0.97] disabled:opacity-50">
                        <RotateCcw size={10} /> Relancer
                      </button>
                    )}
                    {(p.status === "paid" || p.status === "refunded") && <button onClick={() => setViewFacture(p)} className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37] active:scale-[0.97]">Facture</button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {viewFacture && (
        <DocumentView
          doc={buildFactureData({
            ref: reference(viewFacture),
            objet: viewFacture.type,
            client: viewFacture.clientName || viewFacture.clientEmail || `Utilisateur #${viewFacture.userId}`,
            montant: `${viewFacture.amount} ${viewFacture.currency}`,
            date: new Date(viewFacture.createdAt).toLocaleString("fr-FR"),
            statut: viewFacture.status === "paid" ? "Payé" : viewFacture.status === "refunded" ? "Remboursé" : viewFacture.status,
            type: "Paiement",
          })}
          onClose={() => setViewFacture(null)}
        />
      )}

      {selectedPaiement && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4" onClick={() => setSelectedPaiement(null)}>
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center gap-4 mb-6">
              <div className={`h-14 w-14 rounded-2xl grid place-items-center ${selectedPaiement.status === "paid" ? "bg-green-50" : selectedPaiement.status === "failed" ? "bg-red-50" : "bg-amber-50"}`}>
                <Euro size={28} className={selectedPaiement.status === "paid" ? "text-green-600" : selectedPaiement.status === "failed" ? "text-red-500" : "text-amber-500"} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#111]">{selectedPaiement.clientName || selectedPaiement.clientEmail}</h3>
                <p className="text-xs text-[#6B7280]">{reference(selectedPaiement)}</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-[#6B7280]">Montant</span>
                <span className="text-sm font-black text-[#D4AF37]">{selectedPaiement.amount} {selectedPaiement.currency}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-[#6B7280]">Date & Heure</span>
                <span className="text-sm font-bold text-[#111]">{new Date(selectedPaiement.createdAt).toLocaleString("fr-FR")}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-[#6B7280]">Statut</span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${STATUT_STYLE[selectedPaiement.status]}`}>
                  {(STATUT_LABEL[selectedPaiement.status] ?? selectedPaiement.status).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-[#6B7280]">Type</span>
                <span className="text-sm font-bold text-[#111]">{selectedPaiement.type}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-[#6B7280]">Client</span>
                <span className="text-sm font-bold text-[#111]">{selectedPaiement.clientEmail || "—"}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelectedPaiement(null)} className="flex-1 rounded-xl border border-[#E5E7EB] py-3 text-xs font-bold text-[#6B7280]">Fermer</button>
              {(selectedPaiement.status === "paid" || selectedPaiement.status === "refunded") && (
                <button onClick={() => { setViewFacture(selectedPaiement); setSelectedPaiement(null); }} className="flex-1 rounded-xl bg-[#111] py-3 text-xs font-bold text-[#D4AF37]">Voir la facture</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
