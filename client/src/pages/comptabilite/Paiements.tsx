import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, CreditCard, ChevronDown, Download, Eye, CheckCircle,
  X, Search, Filter, Banknote, Wallet, Clock, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { DocumentView, buildFactureData } from "../../components/DocumentPDF";

type Tab = "tous" | "recus" | "en_attente" | "rembourses";
type Methode = "tous" | "stripe" | "virement" | "cb" | "especes" | "cheque" | "differe";

interface Paiement {
  id: number;
  objet: string;
  montant: number;
  date: string;
  client: string;
  ref: string;
  methode: string;
  methodeKey: string;
  statut: "valide" | "en_attente" | "refuse" | "rembourse";
  delai: string;
  univers: string;
}

const PAIEMENTS: Paiement[] = [
  { id: 1, objet: "Vente Peugeot 3008 GT", montant: 28500, date: "09/06/2026", client: "Martin D.", ref: "PAY-2026-0412", methode: "Virement SEPA", methodeKey: "virement", statut: "valide", delai: "2 jours", univers: "Vente" },
  { id: 2, objet: "Location Mercedes E Break — 7j", montant: 1350, date: "08/06/2026", client: "Sophie L.", ref: "PAY-2026-0411", methode: "Carte bancaire", methodeKey: "cb", statut: "valide", delai: "Immediat", univers: "Location" },
  { id: 3, objet: "Abonnement Pro Premium x12", montant: 1068, date: "07/06/2026", client: "Garage Auto 93", ref: "PAY-2026-0410", methode: "Stripe", methodeKey: "stripe", statut: "valide", delai: "1 jour", univers: "Abonnement" },
  { id: 4, objet: "Reparation BMW 530 — freins", montant: 920, date: "07/06/2026", client: "Thomas R.", ref: "PAY-2026-0409", methode: "Carte bancaire", methodeKey: "cb", statut: "valide", delai: "Immediat", univers: "Garage" },
  { id: 5, objet: "Devis Carrosserie Golf VII", montant: 1580, date: "06/06/2026", client: "Jean-Pierre D.", ref: "PAY-2026-0408", methode: "Cheque", methodeKey: "cheque", statut: "en_attente", delai: "3 jours", univers: "Carrosserie" },
  { id: 6, objet: "Vidange + filtres Clio V", montant: 180, date: "06/06/2026", client: "Ahmed K.", ref: "PAY-2026-0407", methode: "Especes", methodeKey: "especes", statut: "valide", delai: "Immediat", univers: "Garage" },
  { id: 7, objet: "Boost Premium Annonce #142", montant: 29, date: "06/06/2026", client: "Pierre K.", ref: "PAY-2026-0406", methode: "Stripe", methodeKey: "stripe", statut: "valide", delai: "Immediat", univers: "Publicite" },
  { id: 8, objet: "Remboursement reservation annulee", montant: -150, date: "05/06/2026", client: "Ahmed M.", ref: "PAY-2026-0405", methode: "Virement SEPA", methodeKey: "virement", statut: "rembourse", delai: "3 jours", univers: "Location" },
  { id: 9, objet: "Enchere Porsche 911 — acompte", montant: 5000, date: "05/06/2026", client: "Pierre K.", ref: "PAY-2026-0404", methode: "Virement SEPA", methodeKey: "virement", statut: "valide", delai: "1 jour", univers: "Encheres" },
  { id: 10, objet: "Paiement differe — BMW Serie 3", montant: 8200, date: "04/06/2026", client: "Marc D.", ref: "PAY-2026-0403", methode: "Paiement differe", methodeKey: "differe", statut: "en_attente", delai: "30 jours", univers: "Vente" },
  { id: 11, objet: "Location Citroen C3 — 3j", montant: 180, date: "04/06/2026", client: "Nadia B.", ref: "PAY-2026-0402", methode: "Carte bancaire", methodeKey: "cb", statut: "refuse", delai: "—", univers: "Location" },
  { id: 12, objet: "Pieces detachees — lot plaquettes", montant: 245, date: "03/06/2026", client: "Garage Meca Plus", ref: "PAY-2026-0401", methode: "Stripe", methodeKey: "stripe", statut: "valide", delai: "Immediat", univers: "Pieces" },
];

const STATUT_STYLE: Record<string, string> = {
  valide: "bg-green-50 text-green-700",
  en_attente: "bg-amber-50 text-amber-700",
  refuse: "bg-red-50 text-red-700",
  rembourse: "bg-blue-50 text-blue-700",
};

const STATUT_LABEL: Record<string, string> = {
  valide: "Valide",
  en_attente: "En attente",
  refuse: "Refuse",
  rembourse: "Rembourse",
};

const METHODE_LABELS: Record<string, string> = {
  tous: "Tous",
  stripe: "Stripe",
  virement: "Virement",
  cb: "CB",
  especes: "Especes",
  cheque: "Cheque",
  differe: "Differe",
};

export default function Paiements() {
  const [tab, setTab] = useState<Tab>("tous");
  const [methode, setMethode] = useState<Methode>("tous");
  const [search, setSearch] = useState("");
  const [modalPay, setModalPay] = useState<Paiement | null>(null);
  const [modalDoc, setModalDoc] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = PAIEMENTS.filter(p => {
    if (tab === "recus" && p.statut !== "valide") return false;
    if (tab === "en_attente" && p.statut !== "en_attente") return false;
    if (tab === "rembourses" && p.statut !== "rembourse") return false;
    if (methode !== "tous" && p.methodeKey !== methode) return false;
    if (search) {
      const s = search.toLowerCase();
      return p.objet.toLowerCase().includes(s) || p.client.toLowerCase().includes(s) || p.ref.toLowerCase().includes(s);
    }
    return true;
  });

  const totalRecus = PAIEMENTS.filter(p => p.statut === "valide").reduce((s, p) => s + p.montant, 0);
  const totalAttente = PAIEMENTS.filter(p => p.statut === "en_attente").reduce((s, p) => s + p.montant, 0);
  const totalRembourses = PAIEMENTS.filter(p => p.statut === "rembourse").reduce((s, p) => s + Math.abs(p.montant), 0);

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
        <h1 className="text-xl font-black text-white flex items-center gap-2"><CreditCard size={20} className="text-[#D4AF37]" /> Paiements</h1>
        <p className="mt-0.5 text-sm text-white/60">Suivi complet de tous les paiements</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2 mb-4">
        <button onClick={() => setTab("recus")} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm active:scale-[0.97] transition">
          <ArrowDownLeft size={14} className="text-green-500 mx-auto mb-1" />
          <p className="text-lg font-black text-green-600">{totalRecus.toLocaleString("fr-FR")} EUR</p>
          <p className="text-[9px] text-[#6B7280]">Recus</p>
        </button>
        <button onClick={() => setTab("en_attente")} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm active:scale-[0.97] transition">
          <Clock size={14} className="text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-black text-amber-600">{totalAttente.toLocaleString("fr-FR")} EUR</p>
          <p className="text-[9px] text-[#6B7280]">En attente</p>
        </button>
        <button onClick={() => setTab("rembourses")} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm active:scale-[0.97] transition">
          <ArrowUpRight size={14} className="text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-black text-blue-600">{totalRembourses.toLocaleString("fr-FR")} EUR</p>
          <p className="text-[9px] text-[#6B7280]">Rembourses</p>
        </button>
      </div>

      <div className="px-4 mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {(["tous", "recus", "en_attente", "rembourses"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {t === "tous" ? "Tous" : t === "recus" ? "Recus" : t === "en_attente" ? "En attente" : "Rembourses"}
          </button>
        ))}
      </div>

      <div className="px-4 mb-3 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {(Object.keys(METHODE_LABELS) as Methode[]).map(m => (
          <button key={m} onClick={() => setMethode(m)} className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${methode === m ? "bg-[#D4AF37] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {METHODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un paiement..." className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 py-2 text-xs text-[#111] placeholder:text-slate-400" />
        </div>
      </div>

      <div className="px-4 space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-8 text-center">
            <Wallet size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Aucun paiement trouve</p>
          </div>
        )}
        {filtered.map(p => (
          <button key={p.id} onClick={() => setModalPay(p)} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98] transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`h-10 w-10 rounded-lg shrink-0 grid place-items-center ${p.montant >= 0 ? "bg-green-50" : "bg-blue-50"}`}>
                  {p.montant >= 0 ? <ArrowDownLeft size={16} className="text-green-600" /> : <ArrowUpRight size={16} className="text-blue-600" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{p.objet}</p>
                  <p className="text-[10px] text-[#6B7280]">{p.client} · {p.methode} · {p.date}</p>
                </div>
              </div>
              <div className="text-right ml-2 shrink-0">
                <p className={`text-sm font-black ${p.montant >= 0 ? "text-green-600" : "text-blue-600"}`}>{p.montant >= 0 ? "+" : ""}{p.montant.toLocaleString()} EUR</p>
                <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${STATUT_STYLE[p.statut]}`}>{STATUT_LABEL[p.statut]}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
        <button onClick={() => showToast("Export Excel de tous les paiements")} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={14} /> Exporter les paiements</button>
      </div>

      {modalPay && (
        <Overlay onClose={() => setModalPay(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">{modalPay.objet}</h2>
            <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${STATUT_STYLE[modalPay.statut]}`}>{STATUT_LABEL[modalPay.statut]}</span>
            <div className="mt-4 rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-center mb-4">
              <p className="text-[10px] text-white/40 uppercase">Montant</p>
              <p className={`text-3xl font-black ${modalPay.montant >= 0 ? "text-green-400" : "text-blue-400"}`}>{modalPay.montant >= 0 ? "+" : ""}{modalPay.montant.toLocaleString()} EUR</p>
            </div>
            <div className="space-y-2 text-[10px] mb-4">
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Client</span><span className="font-bold text-[#111]">{modalPay.client}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Reference</span><span className="font-bold text-[#111]">{modalPay.ref}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Methode</span><span className="font-bold text-[#111]">{modalPay.methode}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Date</span><span className="font-bold text-[#111]">{modalPay.date}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Delai</span><span className="font-bold text-[#111]">{modalPay.delai}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Univers</span><span className="font-bold text-[#111]">{modalPay.univers}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setModalDoc(buildFactureData({ ref: modalPay.ref, objet: modalPay.univers, client: modalPay.client, montant: `${modalPay.montant} EUR`, date: modalPay.date, statut: STATUT_LABEL[modalPay.statut], type: modalPay.methode })); setModalPay(null); }} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Eye size={14} /> Voir la facture</button>
              <button onClick={() => { showToast(`Recu ${modalPay.ref} exporte en PDF`); setModalPay(null); }} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1"><Download size={14} /> PDF</button>
            </div>
          </div>
        </Overlay>
      )}

      {modalDoc && <DocumentView doc={modalDoc} onClose={() => setModalDoc(null)} />}

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
