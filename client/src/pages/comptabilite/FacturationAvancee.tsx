import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, FileText, Plus, Download, Eye, CheckCircle,
  X, Search, Filter, Printer, Send, Ban, RefreshCw, ChevronDown
} from "lucide-react";
import { DocumentView, buildFactureData, buildDevisData } from "../../components/DocumentPDF";

type Tab = "toutes" | "creees" | "automatiques" | "avoirs" | "brouillons";

interface Facture {
  id: number;
  ref: string;
  objet: string;
  client: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  date: string;
  echeance: string;
  statut: "payee" | "envoyee" | "brouillon" | "avoir" | "annulee" | "en_retard";
  type: "manuelle" | "automatique" | "avoir" | "annulation";
  univers: string;
}

const FACTURES: Facture[] = [
  { id: 1, ref: "FA-2026-0501", objet: "Vente Peugeot 3008 GT", client: "Martin D.", montantHT: 23750, tva: 4750, montantTTC: 28500, date: "09/06/2026", echeance: "09/07/2026", statut: "payee", type: "manuelle", univers: "Vente" },
  { id: 2, ref: "FA-2026-0500", objet: "Location Mercedes E Break — 7j", client: "Sophie L.", montantHT: 1125, tva: 225, montantTTC: 1350, date: "08/06/2026", echeance: "08/06/2026", statut: "payee", type: "automatique", univers: "Location" },
  { id: 3, ref: "FA-2026-0499", objet: "Abonnement Pro Premium — Juin", client: "Garage Auto 93", montantHT: 74.17, tva: 14.83, montantTTC: 89, date: "01/06/2026", echeance: "01/06/2026", statut: "payee", type: "automatique", univers: "Abonnement" },
  { id: 4, ref: "FA-2026-0498", objet: "Reparation freins BMW 530", client: "Thomas R.", montantHT: 766.67, tva: 153.33, montantTTC: 920, date: "08/06/2026", echeance: "08/07/2026", statut: "envoyee", type: "manuelle", univers: "Garage" },
  { id: 5, ref: "AV-2026-0012", objet: "Avoir — Reservation annulee", client: "Ahmed M.", montantHT: -125, tva: -25, montantTTC: -150, date: "05/06/2026", echeance: "—", statut: "avoir", type: "avoir", univers: "Location" },
  { id: 6, ref: "FA-2026-0497", objet: "Devis Carrosserie Golf VII", client: "Jean-Pierre D.", montantHT: 1316.67, tva: 263.33, montantTTC: 1580, date: "06/06/2026", echeance: "06/06/2026", statut: "en_retard", type: "manuelle", univers: "Carrosserie" },
  { id: 7, ref: "FA-2026-0496", objet: "Boost Annonce Premium #142", client: "Pierre K.", montantHT: 24.17, tva: 4.83, montantTTC: 29, date: "06/06/2026", echeance: "06/06/2026", statut: "payee", type: "automatique", univers: "Publicite" },
  { id: 8, ref: "BR-2026-0015", objet: "Brouillon — Enchere Porsche 911", client: "Pierre K.", montantHT: 37500, tva: 7500, montantTTC: 45000, date: "08/06/2026", echeance: "—", statut: "brouillon", type: "manuelle", univers: "Encheres" },
  { id: 9, ref: "AN-2026-0003", objet: "Annulation — Double facturation", client: "Sophie L.", montantHT: -650, tva: -130, montantTTC: -780, date: "07/06/2026", echeance: "—", statut: "annulee", type: "annulation", univers: "Garage" },
  { id: 10, ref: "FA-2026-0495", objet: "Pieces detachees — lot plaquettes", client: "Garage Meca Plus", montantHT: 204.17, tva: 40.83, montantTTC: 245, date: "03/06/2026", echeance: "03/07/2026", statut: "envoyee", type: "manuelle", univers: "Pieces" },
];

const STATUT_STYLE: Record<string, string> = {
  payee: "bg-green-50 text-green-700",
  envoyee: "bg-blue-50 text-blue-700",
  brouillon: "bg-slate-100 text-slate-600",
  avoir: "bg-purple-50 text-purple-700",
  annulee: "bg-red-50 text-red-700",
  en_retard: "bg-red-50 text-red-700",
};

const STATUT_LABEL: Record<string, string> = {
  payee: "Payee",
  envoyee: "Envoyee",
  brouillon: "Brouillon",
  avoir: "Avoir",
  annulee: "Annulee",
  en_retard: "En retard",
};

export default function FacturationAvancee() {
  const [tab, setTab] = useState<Tab>("toutes");
  const [search, setSearch] = useState("");
  const [modalFacture, setModalFacture] = useState<Facture | null>(null);
  const [modalDoc, setModalDoc] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const [newClient, setNewClient] = useState("");
  const [newObjet, setNewObjet] = useState("");
  const [newMontant, setNewMontant] = useState("");
  const [newTaux, setNewTaux] = useState("20");

  const filtered = FACTURES.filter(f => {
    if (tab === "creees" && f.type !== "manuelle") return false;
    if (tab === "automatiques" && f.type !== "automatique") return false;
    if (tab === "avoirs" && f.type !== "avoir" && f.type !== "annulation") return false;
    if (tab === "brouillons" && f.statut !== "brouillon") return false;
    if (search) {
      const s = search.toLowerCase();
      return f.objet.toLowerCase().includes(s) || f.client.toLowerCase().includes(s) || f.ref.toLowerCase().includes(s);
    }
    return true;
  });

  const totalFacture = FACTURES.filter(f => f.montantTTC > 0).reduce((s, f) => s + f.montantTTC, 0);
  const totalAvoirs = FACTURES.filter(f => f.montantTTC < 0).reduce((s, f) => s + Math.abs(f.montantTTC), 0);

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
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Facturation</h1>
        <p className="mt-0.5 text-sm text-white/60">Creation, gestion et export des factures</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <p className="text-lg font-black text-green-600">{totalFacture.toLocaleString("fr-FR")} EUR</p>
          <p className="text-[9px] text-[#6B7280]">Total facture</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <p className="text-lg font-black text-red-500">{totalAvoirs.toLocaleString("fr-FR")} EUR</p>
          <p className="text-[9px] text-[#6B7280]">Avoirs / Annulations</p>
        </div>
      </div>

      <div className="px-4 mb-3">
        <button onClick={() => setShowCreate(true)} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Plus size={14} /> Creer une facture</button>
      </div>

      <div className="px-4 mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {(["toutes", "creees", "automatiques", "avoirs", "brouillons"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {t === "toutes" ? "Toutes" : t === "creees" ? "Manuelles" : t === "automatiques" ? "Auto" : t === "avoirs" ? "Avoirs" : "Brouillons"}
          </button>
        ))}
      </div>

      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une facture..." className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 py-2 text-xs text-[#111] placeholder:text-slate-400" />
        </div>
      </div>

      <div className="px-4 space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-8 text-center">
            <FileText size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Aucune facture trouvee</p>
          </div>
        )}
        {filtered.map(f => (
          <button key={f.id} onClick={() => setModalFacture(f)} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98] transition">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-[#111] truncate">{f.objet}</p>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${STATUT_STYLE[f.statut]}`}>{STATUT_LABEL[f.statut]}</span>
                </div>
                <p className="text-[10px] text-[#6B7280]">{f.ref} · {f.client} · {f.date}</p>
              </div>
              <div className="text-right ml-2 shrink-0">
                <p className={`text-sm font-black ${f.montantTTC >= 0 ? "text-green-600" : "text-red-500"}`}>{f.montantTTC >= 0 ? "+" : ""}{f.montantTTC.toLocaleString()} EUR</p>
                <p className="text-[10px] text-[#6B7280]">{f.type === "automatique" ? "Auto" : f.type === "avoir" ? "Avoir" : f.type === "annulation" ? "Annul." : "Manuelle"}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 flex gap-2">
        <button onClick={() => showToast("Export PDF de toutes les factures")} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={14} /> PDF</button>
        <button onClick={() => showToast("Export Excel de toutes les factures")} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={14} /> Excel</button>
      </div>

      {modalFacture && (
        <Overlay onClose={() => setModalFacture(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">{modalFacture.ref}</h2>
            <p className="text-xs text-slate-500 mb-1">{modalFacture.objet}</p>
            <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${STATUT_STYLE[modalFacture.statut]}`}>{STATUT_LABEL[modalFacture.statut]}</span>
            <div className="grid grid-cols-3 gap-3 mt-4 mb-4">
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-[#6B7280]">HT</p><p className="text-lg font-black text-[#111]">{modalFacture.montantHT.toLocaleString()} EUR</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-[#6B7280]">TVA</p><p className="text-lg font-black text-amber-600">{modalFacture.tva.toLocaleString()} EUR</p></div>
              <div className="rounded-xl bg-[#D4AF37]/10 p-3"><p className="text-[10px] text-[#D4AF37]">TTC</p><p className="text-lg font-black text-[#111]">{modalFacture.montantTTC.toLocaleString()} EUR</p></div>
            </div>
            <div className="space-y-2 text-[10px] mb-4">
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Client</span><span className="font-bold text-[#111]">{modalFacture.client}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Date</span><span className="font-bold text-[#111]">{modalFacture.date}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Echeance</span><span className="font-bold text-[#111]">{modalFacture.echeance}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Univers</span><span className="font-bold text-[#111]">{modalFacture.univers}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button onClick={() => { setModalDoc(buildFactureData({ ref: modalFacture.ref, objet: modalFacture.univers, client: modalFacture.client, montant: `${modalFacture.montantTTC} EUR`, date: modalFacture.date, statut: STATUT_LABEL[modalFacture.statut], type: modalFacture.type })); setModalFacture(null); }} className="rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Eye size={12} /> Apercu</button>
              <button onClick={() => { showToast(`PDF ${modalFacture.ref} telecharge`); setModalFacture(null); }} className="rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1"><Download size={12} /> PDF</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => { showToast(`Facture ${modalFacture.ref} envoyee au client`); setModalFacture(null); }} className="rounded-xl border border-[#E5E7EB] py-2 text-xs font-bold text-[#111] flex items-center justify-center gap-1"><Send size={11} /> Envoyer</button>
              <button onClick={() => { showToast(`Impression ${modalFacture.ref}`); setModalFacture(null); }} className="rounded-xl border border-[#E5E7EB] py-2 text-xs font-bold text-[#111] flex items-center justify-center gap-1"><Printer size={11} /> Imprimer</button>
              {modalFacture.statut !== "annulee" && modalFacture.statut !== "avoir" && (
                <button onClick={() => { showToast(`Avoir cree pour ${modalFacture.ref}`); setModalFacture(null); }} className="rounded-xl border border-red-200 py-2 text-xs font-bold text-red-600 flex items-center justify-center gap-1"><Ban size={11} /> Avoir</button>
              )}
            </div>
          </div>
        </Overlay>
      )}

      {showCreate && (
        <Overlay onClose={() => setShowCreate(false)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-4">Creer une facture</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase mb-1 block">Client</label>
                <input value={newClient} onChange={e => setNewClient(e.target.value)} placeholder="Nom du client" className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-sm font-semibold text-[#111]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase mb-1 block">Objet</label>
                <input value={newObjet} onChange={e => setNewObjet(e.target.value)} placeholder="Description de la facture" className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-sm font-semibold text-[#111]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase mb-1 block">Montant HT (EUR)</label>
                <input type="number" value={newMontant} onChange={e => setNewMontant(e.target.value)} placeholder="0" className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-sm font-semibold text-[#111]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase mb-1 block">Taux TVA</label>
                <div className="flex gap-2">
                  {["5.5", "10", "20"].map(t => (
                    <button key={t} onClick={() => setNewTaux(t)} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${newTaux === t ? "bg-[#D4AF37] text-white" : "bg-[#F5F3EF] text-[#6B7280] border border-[#E5E7EB]"}`}>{t}%</button>
                  ))}
                </div>
              </div>
              {newMontant && (
                <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-3 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-[9px] text-white/40">HT</p><p className="text-sm font-black text-white">{Number(newMontant).toLocaleString()} EUR</p></div>
                  <div><p className="text-[9px] text-white/40">TVA</p><p className="text-sm font-black text-amber-400">{Math.round(Number(newMontant) * Number(newTaux) / 100).toLocaleString()} EUR</p></div>
                  <div><p className="text-[9px] text-white/40">TTC</p><p className="text-sm font-black text-[#D4AF37]">{Math.round(Number(newMontant) * (1 + Number(newTaux) / 100)).toLocaleString()} EUR</p></div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => { showToast("Facture sauvegardee en brouillon"); setShowCreate(false); }} className="flex-1 rounded-xl border border-[#E5E7EB] py-2.5 text-xs font-bold text-[#6B7280]">Brouillon</button>
                <button onClick={() => { showToast("Facture creee et envoyee"); setShowCreate(false); }} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><CheckCircle size={14} /> Creer et envoyer</button>
              </div>
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
