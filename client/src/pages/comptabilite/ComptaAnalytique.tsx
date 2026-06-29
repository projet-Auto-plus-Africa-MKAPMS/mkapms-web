import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, BarChart3, ChevronDown, Globe, MapPin, Building2,
  Wrench, Users, Briefcase, X, Download, CheckCircle, TrendingUp
} from "lucide-react";

type Dimension = "pays" | "ville" | "agence" | "garage" | "employe" | "service";

interface AnalyseRow {
  label: string;
  ca: number;
  depenses: number;
  benefice: number;
  pct: string;
  up: boolean;
  transactions: number;
}

const DATA: Record<Dimension, AnalyseRow[]> = {
  pays: [
    { label: "France", ca: 287450, depenses: 145000, benefice: 142450, pct: "+12.4%", up: true, transactions: 456 },
    { label: "Cote d'Ivoire", ca: 85200, depenses: 42000, benefice: 43200, pct: "+28.1%", up: true, transactions: 234 },
    { label: "Senegal", ca: 62300, depenses: 31500, benefice: 30800, pct: "+15.6%", up: true, transactions: 178 },
    { label: "Maroc", ca: 54800, depenses: 28900, benefice: 25900, pct: "+8.3%", up: true, transactions: 145 },
    { label: "Cameroun", ca: 38500, depenses: 22000, benefice: 16500, pct: "-2.1%", up: false, transactions: 98 },
    { label: "Belgique", ca: 28900, depenses: 15200, benefice: 13700, pct: "+5.9%", up: true, transactions: 67 },
  ],
  ville: [
    { label: "Paris", ca: 142500, depenses: 72000, benefice: 70500, pct: "+10.2%", up: true, transactions: 234 },
    { label: "Abidjan", ca: 68200, depenses: 34000, benefice: 34200, pct: "+25.3%", up: true, transactions: 189 },
    { label: "Dakar", ca: 48900, depenses: 24500, benefice: 24400, pct: "+18.7%", up: true, transactions: 134 },
    { label: "Lyon", ca: 45600, depenses: 23000, benefice: 22600, pct: "+8.9%", up: true, transactions: 112 },
    { label: "Casablanca", ca: 42300, depenses: 22100, benefice: 20200, pct: "+6.5%", up: true, transactions: 98 },
    { label: "Marseille", ca: 38700, depenses: 19800, benefice: 18900, pct: "+14.1%", up: true, transactions: 87 },
    { label: "Douala", ca: 28500, depenses: 16000, benefice: 12500, pct: "-3.4%", up: false, transactions: 72 },
    { label: "Bruxelles", ca: 22400, depenses: 11800, benefice: 10600, pct: "+4.2%", up: true, transactions: 45 },
  ],
  agence: [
    { label: "Siege MKA.P-MS Paris", ca: 98500, depenses: 48000, benefice: 50500, pct: "+15.3%", up: true, transactions: 156 },
    { label: "Agence Abidjan Plateau", ca: 52300, depenses: 26000, benefice: 26300, pct: "+22.1%", up: true, transactions: 134 },
    { label: "Agence Dakar Almadies", ca: 38900, depenses: 19500, benefice: 19400, pct: "+12.8%", up: true, transactions: 98 },
    { label: "Agence Lyon Part-Dieu", ca: 34200, depenses: 17000, benefice: 17200, pct: "+7.6%", up: true, transactions: 78 },
    { label: "Agence Casablanca Maarif", ca: 28700, depenses: 15200, benefice: 13500, pct: "+5.1%", up: true, transactions: 67 },
  ],
  garage: [
    { label: "Garage Central Paris", ca: 34800, depenses: 18000, benefice: 16800, pct: "+22.3%", up: true, transactions: 89 },
    { label: "AutoPro 77", ca: 28500, depenses: 14200, benefice: 14300, pct: "+15.8%", up: true, transactions: 67 },
    { label: "Meca Service Abidjan", ca: 22100, depenses: 11000, benefice: 11100, pct: "+30.2%", up: true, transactions: 56 },
    { label: "Carrosserie Express Lyon", ca: 18900, depenses: 9500, benefice: 9400, pct: "+8.4%", up: true, transactions: 45 },
    { label: "Garage Meca Plus", ca: 15200, depenses: 8100, benefice: 7100, pct: "-1.5%", up: false, transactions: 34 },
  ],
  employe: [
    { label: "Karim M. — Mecanicien senior", ca: 28500, depenses: 2800, benefice: 25700, pct: "+18.2%", up: true, transactions: 34 },
    { label: "Sarah K. — Resp. location", ca: 42300, depenses: 3200, benefice: 39100, pct: "+24.5%", up: true, transactions: 45 },
    { label: "Mohamed A. — Commercial vente", ca: 68900, depenses: 2600, benefice: 66300, pct: "+12.1%", up: true, transactions: 38 },
    { label: "Fatima B. — Comptabilite", ca: 0, depenses: 2900, benefice: -2900, pct: "—", up: true, transactions: 52 },
    { label: "Omar L. — Mecanicien", ca: 22100, depenses: 2000, benefice: 20100, pct: "+9.3%", up: true, transactions: 22 },
  ],
  service: [
    { label: "Vente vehicules", ca: 142500, depenses: 45000, benefice: 97500, pct: "+8.2%", up: true, transactions: 47 },
    { label: "Location", ca: 68200, depenses: 22000, benefice: 46200, pct: "+15.1%", up: true, transactions: 156 },
    { label: "Garage / Reparation", ca: 34800, depenses: 18500, benefice: 16300, pct: "+22.3%", up: true, transactions: 89 },
    { label: "Pieces detachees", ca: 24600, depenses: 15200, benefice: 9400, pct: "+30.5%", up: true, transactions: 156 },
    { label: "Publicite", ca: 13000, depenses: 3200, benefice: 9800, pct: "-3.2%", up: false, transactions: 34 },
    { label: "Encheres", ca: 28950, depenses: 5800, benefice: 23150, pct: "+5.7%", up: true, transactions: 12 },
    { label: "Abonnements", ca: 18500, depenses: 1200, benefice: 17300, pct: "+19.8%", up: true, transactions: 241 },
    { label: "Depannage", ca: 8900, depenses: 4500, benefice: 4400, pct: "+11.4%", up: true, transactions: 28 },
  ],
};

const DIM_ICONS: Record<Dimension, typeof Globe> = {
  pays: Globe,
  ville: MapPin,
  agence: Building2,
  garage: Wrench,
  employe: Users,
  service: Briefcase,
};

const DIM_LABELS: Record<Dimension, string> = {
  pays: "Par pays",
  ville: "Par ville",
  agence: "Par agence",
  garage: "Par garage",
  employe: "Par employe",
  service: "Par service",
};

export default function ComptaAnalytique() {
  const [dim, setDim] = useState<Dimension>("pays");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [modalRow, setModalRow] = useState<AnalyseRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const rows = DATA[dim];
  const totalCA = rows.reduce((s, r) => s + r.ca, 0);
  const totalBenefice = rows.reduce((s, r) => s + r.benefice, 0);

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
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Comptabilite analytique</h1>
        <p className="mt-0.5 text-sm text-white/60">Analyse multi-dimensionnelle de la performance</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <p className="text-lg font-black text-[#D4AF37]">{totalCA.toLocaleString("fr-FR")} EUR</p>
          <p className="text-[9px] text-[#6B7280]">CA total {DIM_LABELS[dim].toLowerCase()}</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <p className={`text-lg font-black ${totalBenefice >= 0 ? "text-green-600" : "text-red-500"}`}>{totalBenefice.toLocaleString("fr-FR")} EUR</p>
          <p className="text-[9px] text-[#6B7280]">Benefice total</p>
        </div>
      </div>

      <div className="px-4 mb-4 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {(Object.keys(DIM_LABELS) as Dimension[]).map(d => {
          const Icon = DIM_ICONS[d];
          return (
            <button key={d} onClick={() => { setDim(d); setExpanded(null); }} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${dim === d ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={11} /> {DIM_LABELS[d]}
            </button>
          );
        })}
      </div>

      <div className="px-4 space-y-2">
        {rows.map((row, i) => {
          const isExp = expanded === i;
          const pctOfTotal = totalCA > 0 ? Math.round(row.ca / totalCA * 100) : 0;
          return (
            <div key={row.label} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{row.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${pctOfTotal}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-[#6B7280] shrink-0">{pctOfTotal}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <div className="text-right">
                    <p className="text-sm font-black text-[#111]">{row.ca.toLocaleString()} EUR</p>
                    <p className={`text-[10px] font-bold ${row.up ? "text-green-500" : "text-red-500"}`}>{row.pct}</p>
                  </div>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                    <div className="rounded-lg bg-green-50 p-2"><span className="text-green-600">CA</span><p className="font-bold text-green-700">{row.ca.toLocaleString()} EUR</p></div>
                    <div className="rounded-lg bg-red-50 p-2"><span className="text-red-600">Depenses</span><p className="font-bold text-red-700">{row.depenses.toLocaleString()} EUR</p></div>
                    <div className="rounded-lg bg-[#D4AF37]/10 p-2"><span className="text-[#D4AF37]">Benefice</span><p className="font-bold text-[#111]">{row.benefice.toLocaleString()} EUR</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setModalRow(row)} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97]">Detail complet</button>
                    <button onClick={() => showToast(`Rapport ${row.label} exporte`)} className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={12} /> Export</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 mt-4">
        <button onClick={() => showToast("Export analytique complet genere")} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={14} /> Exporter l'analyse complete</button>
      </div>

      {modalRow && (
        <Overlay onClose={() => setModalRow(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">{modalRow.label}</h2>
            <p className="text-xs text-slate-500 mb-4">Analyse detaillee — {DIM_LABELS[dim]}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-green-50 p-3"><p className="text-[10px] text-green-600">Chiffre d'affaires</p><p className="text-lg font-black text-green-700">{modalRow.ca.toLocaleString()} EUR</p></div>
              <div className="rounded-xl bg-red-50 p-3"><p className="text-[10px] text-red-600">Depenses</p><p className="text-lg font-black text-red-700">{modalRow.depenses.toLocaleString()} EUR</p></div>
              <div className="rounded-xl bg-[#D4AF37]/10 p-3"><p className="text-[10px] text-[#D4AF37]">Benefice net</p><p className="text-lg font-black text-[#111]">{modalRow.benefice.toLocaleString()} EUR</p></div>
              <div className="rounded-xl bg-blue-50 p-3"><p className="text-[10px] text-blue-600">Transactions</p><p className="text-lg font-black text-blue-700">{modalRow.transactions}</p></div>
            </div>
            <div className="space-y-2 text-[10px] mb-4">
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Evolution</span><span className={`font-bold ${modalRow.up ? "text-green-600" : "text-red-500"}`}>{modalRow.pct}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Marge</span><span className="font-bold text-[#111]">{modalRow.ca > 0 ? Math.round(modalRow.benefice / modalRow.ca * 100) : 0}%</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Panier moyen</span><span className="font-bold text-[#111]">{modalRow.transactions > 0 ? Math.round(modalRow.ca / modalRow.transactions).toLocaleString() : 0} EUR</span></div>
            </div>
            <button onClick={() => { showToast(`Rapport detaille ${modalRow.label} exporte en PDF`); setModalRow(null); }} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Download size={14} /> Exporter le rapport PDF</button>
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
