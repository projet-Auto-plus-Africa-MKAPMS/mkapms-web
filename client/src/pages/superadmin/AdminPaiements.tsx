import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Euro, ArrowDown, ArrowUp, AlertCircle, ChevronDown, Check, Clock, ShieldCheck, X } from "lucide-react";
import { DocumentView, buildFactureData } from "../../components/DocumentPDF";
import { trpc } from "../../lib/trpc";

const PAIEMENTS = [
  { id: 1, ref: "PAY-20250609-001", client: "Garage Auto 93", montant: "89 EUR", type: "abonnement", statut: "reussi", date: "09/06/2025 14:32", methode: "Carte bancaire", plan: "Pro Premium" },
  { id: 2, ref: "PAY-20250609-002", client: "Martin D.", montant: "24.90 EUR", type: "boost", statut: "reussi", date: "09/06/2025 12:15", methode: "Carte bancaire", plan: "Premium 30j" },
  { id: 3, ref: "PAY-20250609-003", client: "LuxDrive VTC", montant: "249.99 EUR", type: "abonnement", statut: "reussi", date: "09/06/2025 10:00", methode: "Prelevement", plan: "VTC Max" },
  { id: 4, ref: "PAY-20250608-004", client: "Sophie L.", montant: "6.90 EUR", type: "boost", statut: "echoue", date: "08/06/2025 22:45", methode: "Carte bancaire", plan: "Boost 7j" },
  { id: 5, ref: "PAY-20250608-005", client: "Carrosserie SD", montant: "99 EUR", type: "abonnement", statut: "reussi", date: "08/06/2025 09:00", methode: "Prelevement", plan: "Garage Elite" },
  { id: 6, ref: "PAY-20250607-006", client: "Ahmed K.", montant: "5.90 EUR", type: "pack_photos", statut: "rembourse", date: "07/06/2025 16:20", methode: "Carte bancaire", plan: "Pack 5 photos" },
];

export default function AdminPaiements() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("tous");
  const [viewFacture, setViewFacture] = useState<typeof PAIEMENTS[0] | null>(null);
  const [selectedPaiement, setSelectedPaiement] = useState<typeof PAIEMENTS[0] | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const audit = trpc.paymentEngine.audit.useQuery(undefined, { enabled: showAudit });

  const filtered = filter === "tous" ? PAIEMENTS : PAIEMENTS.filter((p) => p.statut === filter);

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
      </div>

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
          { id: "reussi", l: "CA du jour", v: "4 230 EUR", icon: ArrowDown, c: "text-green-500", bg: "bg-green-50" },
          { id: "reussi", l: "CA du mois", v: "198 450 EUR", icon: Euro, c: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
          { id: "echoue", l: "Echoues", v: "3", icon: AlertCircle, c: "text-red-500", bg: "bg-red-50" },
          { id: "rembourse", l: "En attente", v: "7", icon: Clock, c: "text-amber-500", bg: "bg-amber-50" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.l} onClick={() => setFilter(s.id)} className={`rounded-xl bg-white border p-3 flex items-center gap-3 active:scale-[0.97] ${filter === s.id ? "border-[#D4AF37] ring-1 ring-[#D4AF37]" : "border-[#E5E7EB]"}`}>
              <div className={`h-9 w-9 rounded-lg ${s.bg} grid place-items-center`}><Icon size={16} className={s.c} /></div>
              <div className="text-left"><p className="text-[10px] text-[#6B7280]">{s.l}</p><p className={`text-sm font-black ${s.c}`}>{s.v}</p></div>
            </button>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="px-4 mt-3 flex gap-2">
        {["tous", "reussi", "echoue", "rembourse"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-bold ${filter === f ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {f === "tous" ? "Tous" : f === "reussi" ? "Reussis" : f === "echoue" ? "Echoues" : "Rembourses"}
          </button>
        ))}
      </div>

      {/* Liste paiements */}
      <div className="px-4 mt-3 space-y-2">
        {filtered.map((p) => {
          const isExp = expanded === p.id;
          return (
            <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : p.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${p.statut === "reussi" ? "bg-green-50" : p.statut === "echoue" ? "bg-red-50" : "bg-amber-50"}`}>
                  {p.statut === "reussi" ? <Check size={14} className="text-green-600" /> : p.statut === "echoue" ? <AlertCircle size={14} className="text-red-500" /> : <ArrowUp size={14} className="text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{p.client}</p>
                  <p className="text-[10px] text-[#6B7280]">{p.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#D4AF37]">{p.montant}</p>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ml-auto ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Reference</span><p className="font-bold text-[#111]">{p.ref}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Type</span><p className="font-bold text-[#111]">{p.type}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Methode</span><p className="font-bold text-[#111]">{p.methode}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Plan</span><p className="font-bold text-[#D4AF37]">{p.plan}</p></div>
                  </div>
                  <div className="flex gap-2 mt-2">
	                    <button onClick={() => setSelectedPaiement(p)} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Voir details</button>
	                    {p.statut === "echoue" && <button className="flex-1 rounded-lg bg-red-50 py-1.5 text-[9px] font-bold text-red-600 active:scale-[0.97]">Relancer</button>}
	                    {p.statut === "reussi" && <button onClick={() => setViewFacture(p)} className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37] active:scale-[0.97]">Facture</button>}
	                    {p.statut === "rembourse" && <button onClick={() => setSelectedPaiement(p)} className="flex-1 rounded-lg bg-slate-100 py-1.5 text-[9px] font-bold text-slate-600 active:scale-[0.97]">Historique</button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {viewFacture && (
        <DocumentView
          doc={buildFactureData({ ref: viewFacture.ref, objet: `${viewFacture.type} — ${viewFacture.plan}`, client: viewFacture.client, montant: viewFacture.montant, date: viewFacture.date, statut: viewFacture.statut === "reussi" ? "Paye" : viewFacture.statut, type: "Paiement" })}
          onClose={() => setViewFacture(null)}
        />
      )}

      {selectedPaiement && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4" onClick={() => setSelectedPaiement(null)}>
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center gap-4 mb-6">
              <div className={`h-14 w-14 rounded-2xl grid place-items-center ${selectedPaiement.statut === "reussi" ? "bg-green-50" : selectedPaiement.statut === "echoue" ? "bg-red-50" : "bg-amber-50"}`}>
                <Euro size={28} className={selectedPaiement.statut === "reussi" ? "text-green-600" : selectedPaiement.statut === "echoue" ? "text-red-500" : "text-amber-500"} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#111]">{selectedPaiement.client}</h3>
                <p className="text-xs text-[#6B7280]">{selectedPaiement.ref}</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-[#6B7280]">Montant</span>
                <span className="text-sm font-black text-[#D4AF37]">{selectedPaiement.montant}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-[#6B7280]">Date & Heure</span>
                <span className="text-sm font-bold text-[#111]">{selectedPaiement.date}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-[#6B7280]">Statut</span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${selectedPaiement.statut === "reussi" ? "bg-green-50 text-green-700" : selectedPaiement.statut === "echoue" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                  {selectedPaiement.statut.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-[#6B7280]">Mode de paiement</span>
                <span className="text-sm font-bold text-[#111]">{selectedPaiement.methode}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-[#6B7280]">Offre / Plan</span>
                <span className="text-sm font-bold text-[#111]">{selectedPaiement.plan}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelectedPaiement(null)} className="flex-1 rounded-xl border border-[#E5E7EB] py-3 text-xs font-bold text-[#6B7280]">Fermer</button>
              {selectedPaiement.statut === "reussi" && (
                <button onClick={() => { setViewFacture(selectedPaiement); setSelectedPaiement(null); }} className="flex-1 rounded-xl bg-[#111] py-3 text-xs font-bold text-[#D4AF37]">Telecharger Facture</button>
              )}
              {selectedPaiement.statut === "rembourse" && (
                <button onClick={() => { setViewFacture({...selectedPaiement, statut: "Remboursé"}); setSelectedPaiement(null); }} className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-xs font-bold text-white">Preuve Remboursement</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
