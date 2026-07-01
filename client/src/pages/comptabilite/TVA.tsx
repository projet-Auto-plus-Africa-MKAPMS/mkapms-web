import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Receipt, ChevronDown, Download, Eye, CheckCircle,
  Calendar, TrendingUp, TrendingDown, FileText, X, Search, Filter
} from "lucide-react";

type Tab = "resume" | "declarations" | "historique" | "simulation";

interface TVAEntry {
  id: number;
  periode: string;
  tvaCollectee: number;
  tvaDeductible: number;
  tvaNette: number;
  statut: "declaree" | "en_attente" | "en_retard" | "brouillon";
  dateLimite: string;
  dateDeclaration?: string;
}

const TVA_DATA: TVAEntry[] = [
  { id: 1, periode: "Juin 2026", tvaCollectee: 23940, tvaDeductible: 11900, tvaNette: 12040, statut: "en_attente", dateLimite: "15/07/2026" },
  { id: 2, periode: "Mai 2026", tvaCollectee: 21500, tvaDeductible: 10200, tvaNette: 11300, statut: "declaree", dateLimite: "15/06/2026", dateDeclaration: "12/06/2026" },
  { id: 3, periode: "Avril 2026", tvaCollectee: 19800, tvaDeductible: 9500, tvaNette: 10300, statut: "declaree", dateLimite: "15/05/2026", dateDeclaration: "14/05/2026" },
  { id: 4, periode: "Mars 2026", tvaCollectee: 22100, tvaDeductible: 10800, tvaNette: 11300, statut: "declaree", dateLimite: "15/04/2026", dateDeclaration: "10/04/2026" },
  { id: 5, periode: "Fevrier 2026", tvaCollectee: 18200, tvaDeductible: 8900, tvaNette: 9300, statut: "declaree", dateLimite: "15/03/2026", dateDeclaration: "13/03/2026" },
  { id: 6, periode: "Janvier 2026", tvaCollectee: 20500, tvaDeductible: 9800, tvaNette: 10700, statut: "declaree", dateLimite: "15/02/2026", dateDeclaration: "11/02/2026" },
];

const TVA_PAR_SERVICE = [
  { service: "Vente vehicules", collectee: 9040, deductible: 3200, nette: 5840 },
  { service: "Location", collectee: 5660, deductible: 2100, nette: 3560 },
  { service: "Garage / Reparation", collectee: 3740, deductible: 2800, nette: 940 },
  { service: "Pieces detachees", collectee: 2480, deductible: 1900, nette: 580 },
  { service: "Abonnements", collectee: 1820, deductible: 400, nette: 1420 },
  { service: "Publicite", collectee: 1200, deductible: 500, nette: 700 },
];

const STATUT_STYLE: Record<string, string> = {
  declaree: "bg-green-50 text-green-700",
  en_attente: "bg-amber-50 text-amber-700",
  en_retard: "bg-red-50 text-red-700",
  brouillon: "bg-slate-100 text-slate-600",
};

const STATUT_LABEL: Record<string, string> = {
  declaree: "Declaree",
  en_attente: "En attente",
  en_retard: "En retard",
  brouillon: "Brouillon",
};

export default function TVA() {
  const [tab, setTab] = useState<Tab>("resume");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [modalEntry, setModalEntry] = useState<TVAEntry | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [simTaux, setSimTaux] = useState("20");
  const [simCA, setSimCA] = useState("120000");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const totalCollectee = TVA_DATA[0].tvaCollectee;
  const totalDeductible = TVA_DATA[0].tvaDeductible;
  const totalNette = TVA_DATA[0].tvaNette;

  const Overlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-[#F5F3EF] grid place-items-center"><X size={16} /></button>
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/compta-dirigeant" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Comptabilite</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Receipt size={20} className="text-[#D4AF37]" /> Gestion TVA</h1>
        <p className="mt-0.5 text-sm text-white/60">Calcul automatique, declarations et historique</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <TrendingUp size={14} className="text-green-500 mx-auto mb-1" />
          <p className="text-lg font-black text-green-600">{totalCollectee.toLocaleString("fr-FR")} EUR</p>
          <p className="text-[9px] text-[#6B7280]">TVA collectee</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <TrendingDown size={14} className="text-red-500 mx-auto mb-1" />
          <p className="text-lg font-black text-red-500">{totalDeductible.toLocaleString("fr-FR")} EUR</p>
          <p className="text-[9px] text-[#6B7280]">TVA deductible</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <Receipt size={14} className="text-[#D4AF37] mx-auto mb-1" />
          <p className="text-lg font-black text-[#D4AF37]">{totalNette.toLocaleString("fr-FR")} EUR</p>
          <p className="text-[9px] text-[#6B7280]">TVA nette</p>
        </div>
      </div>

      <div className="px-4 mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {(["resume", "declarations", "historique", "simulation"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {t === "resume" ? "Resume" : t === "declarations" ? "Declarations" : t === "historique" ? "Historique" : "Simulation"}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === "resume" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37]">TVA par service — Mois en cours</h3></div>
              {TVA_PAR_SERVICE.map(s => (
                <button key={s.service} onClick={() => showToast(`Detail ${s.service}: Collectee ${s.collectee.toLocaleString()} EUR`)} className="w-full flex items-center justify-between px-3 py-2.5 border-b border-[#F3F4F6] last:border-0 text-left active:bg-[#F5F3EF] transition">
                  <div>
                    <span className="text-sm font-semibold text-[#111]">{s.service}</span>
                    <p className="text-[10px] text-[#6B7280]">Collectee: {s.collectee.toLocaleString()} EUR</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${s.nette >= 0 ? "text-[#D4AF37]" : "text-red-500"}`}>{s.nette.toLocaleString()} EUR</span>
                    <p className="text-[10px] text-[#6B7280]">Net</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-amber-600" />
                <p className="text-xs font-bold text-amber-800">Prochaine echeance</p>
              </div>
              <p className="text-sm font-black text-amber-900">15 Juillet 2026 — Declaration TVA Juin</p>
              <p className="text-[10px] text-amber-700 mt-0.5">Montant estime: {totalNette.toLocaleString("fr-FR")} EUR</p>
            </div>
          </div>
        )}

        {tab === "declarations" && (
          <div className="space-y-2">
            {TVA_DATA.map(entry => {
              const isExp = expanded === entry.id;
              return (
                <div key={entry.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : entry.id)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#D4AF37]/10 grid place-items-center"><Receipt size={16} className="text-[#D4AF37]" /></div>
                      <div>
                        <p className="text-sm font-bold text-[#111]">{entry.periode}</p>
                        <p className="text-[10px] text-[#6B7280]">Limite: {entry.dateLimite}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${STATUT_STYLE[entry.statut]}`}>{STATUT_LABEL[entry.statut]}</span>
                      <span className="text-sm font-black text-[#D4AF37]">{entry.tvaNette.toLocaleString()} EUR</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                      <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                        <div className="rounded-lg bg-green-50 p-2"><span className="text-green-600">Collectee</span><p className="font-bold text-green-700">{entry.tvaCollectee.toLocaleString()} EUR</p></div>
                        <div className="rounded-lg bg-red-50 p-2"><span className="text-red-600">Deductible</span><p className="font-bold text-red-700">{entry.tvaDeductible.toLocaleString()} EUR</p></div>
                        <div className="rounded-lg bg-[#D4AF37]/10 p-2"><span className="text-[#D4AF37]">Nette</span><p className="font-bold text-[#111]">{entry.tvaNette.toLocaleString()} EUR</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setModalEntry(entry)} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97]"><Eye size={12} /> Detail</button>
                        <button onClick={() => showToast(`Export PDF — ${entry.periode}`)} className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={12} /> PDF</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "historique" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 mb-3">
              <p className="text-[10px] text-white/40 uppercase">Total TVA nette — 6 derniers mois</p>
              <p className="text-2xl font-black text-[#D4AF37]">{TVA_DATA.reduce((s, e) => s + e.tvaNette, 0).toLocaleString("fr-FR")} EUR</p>
            </div>
            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37]">Evolution mensuelle</h3></div>
              {TVA_DATA.map(entry => (
                <button key={entry.id} onClick={() => setModalEntry(entry)} className="w-full flex items-center justify-between px-3 py-2.5 border-b border-[#F3F4F6] last:border-0 text-left active:bg-[#F5F3EF] transition">
                  <div>
                    <span className="text-sm font-semibold text-[#111]">{entry.periode}</span>
                    <p className="text-[10px] text-[#6B7280]">{entry.dateDeclaration ? `Declaree le ${entry.dateDeclaration}` : "Non declaree"}</p>
                  </div>
                  <span className="text-sm font-bold text-[#D4AF37]">{entry.tvaNette.toLocaleString()} EUR</span>
                </button>
              ))}
            </div>
            <button onClick={() => showToast("Export Excel historique TVA")} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={14} /> Exporter l'historique complet</button>
          </div>
        )}

        {tab === "simulation" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <h3 className="text-sm font-bold text-[#111] mb-3">Simulateur de TVA</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-[#6B7280] uppercase mb-1 block">Chiffre d'affaires HT (EUR)</label>
                  <input type="number" value={simCA} onChange={e => setSimCA(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-sm font-semibold text-[#111]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#6B7280] uppercase mb-1 block">Taux de TVA (%)</label>
                  <div className="flex gap-2">
                    {["5.5", "10", "20"].map(t => (
                      <button key={t} onClick={() => setSimTaux(t)} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${simTaux === t ? "bg-[#D4AF37] text-white" : "bg-[#F5F3EF] text-[#6B7280] border border-[#E5E7EB]"}`}>{t}%</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <p className="text-[10px] text-white/40 uppercase mb-3">Resultat de la simulation</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-white/50">CA HT</p>
                  <p className="text-lg font-black text-white">{Number(simCA).toLocaleString("fr-FR")} EUR</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/50">TVA ({simTaux}%)</p>
                  <p className="text-lg font-black text-[#D4AF37]">{Math.round(Number(simCA) * Number(simTaux) / 100).toLocaleString("fr-FR")} EUR</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/50">CA TTC</p>
                  <p className="text-lg font-black text-green-400">{Math.round(Number(simCA) * (1 + Number(simTaux) / 100)).toLocaleString("fr-FR")} EUR</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/50">TVA annuelle estimee</p>
                  <p className="text-lg font-black text-amber-400">{Math.round(Number(simCA) * Number(simTaux) / 100 * 12).toLocaleString("fr-FR")} EUR</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {modalEntry && (
        <Overlay onClose={() => setModalEntry(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">Declaration TVA — {modalEntry.periode}</h2>
            <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${STATUT_STYLE[modalEntry.statut]}`}>{STATUT_LABEL[modalEntry.statut]}</span>
            <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
              <div className="rounded-xl bg-green-50 p-3"><p className="text-[10px] text-green-600">TVA collectee</p><p className="text-lg font-black text-green-700">{modalEntry.tvaCollectee.toLocaleString()} EUR</p></div>
              <div className="rounded-xl bg-red-50 p-3"><p className="text-[10px] text-red-600">TVA deductible</p><p className="text-lg font-black text-red-700">{modalEntry.tvaDeductible.toLocaleString()} EUR</p></div>
              <div className="rounded-xl bg-[#D4AF37]/10 p-3 col-span-2"><p className="text-[10px] text-[#D4AF37]">TVA nette a payer</p><p className="text-2xl font-black text-[#111]">{modalEntry.tvaNette.toLocaleString()} EUR</p></div>
            </div>
            <div className="space-y-2 text-[10px] mb-4">
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Date limite</span><span className="font-bold text-[#111]">{modalEntry.dateLimite}</span></div>
              {modalEntry.dateDeclaration && <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Date declaration</span><span className="font-bold text-[#111]">{modalEntry.dateDeclaration}</span></div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { showToast(`PDF declaration ${modalEntry.periode} exporte`); setModalEntry(null); }} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Download size={14} /> Export PDF</button>
              <button onClick={() => { showToast(`Declaration ${modalEntry.periode} validee`); setModalEntry(null); }} className="flex-1 rounded-xl bg-green-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><CheckCircle size={14} /> Valider</button>
            </div>
          </div>
        </Overlay>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[90%]">
          <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-xl flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400 shrink-0" /><span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-white/40 hover:text-white">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
