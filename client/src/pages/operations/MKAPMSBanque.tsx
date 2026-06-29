import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Landmark, ArrowDownLeft, ArrowUpRight,
  Download, CheckCircle, X,
  Clock, Search, Calendar
} from "lucide-react";

type Tab = "resume" | "encaissements" | "decaissements" | "rapprochement" | "previsions";

interface Transaction {
  id: number;
  libelle: string;
  montant: number;
  date: string;
  type: "encaissement" | "decaissement";
  categorie: string;
  ref: string;
  rapproche: boolean;
}

const TRANSACTIONS: Transaction[] = [
  { id: 1, libelle: "Vente Peugeot 3008 GT — Martin D.", montant: 28500, date: "09/06/2026", type: "encaissement", categorie: "Vente vehicule", ref: "BK-2026-1201", rapproche: true },
  { id: 2, libelle: "Location Mercedes E — Sophie L.", montant: 1350, date: "08/06/2026", type: "encaissement", categorie: "Location", ref: "BK-2026-1200", rapproche: true },
  { id: 3, libelle: "Salaires Juin 2026", montant: -18500, date: "05/06/2026", type: "decaissement", categorie: "Salaires", ref: "BK-2026-1199", rapproche: true },
  { id: 4, libelle: "Facture hebergement Railway", montant: -245, date: "04/06/2026", type: "decaissement", categorie: "Hebergement", ref: "BK-2026-1198", rapproche: true },
  { id: 5, libelle: "Abonnement Pro Premium — Garage 93", montant: 89, date: "01/06/2026", type: "encaissement", categorie: "Abonnement", ref: "BK-2026-1197", rapproche: true },
  { id: 6, libelle: "Enchere Porsche 911 — Acompte", montant: 5000, date: "05/06/2026", type: "encaissement", categorie: "Encheres", ref: "BK-2026-1196", rapproche: false },
  { id: 7, libelle: "Facture fournisseur Bosch", montant: -3200, date: "03/06/2026", type: "decaissement", categorie: "Fournisseur", ref: "BK-2026-1195", rapproche: false },
  { id: 8, libelle: "Remboursement Ahmed M.", montant: -150, date: "05/06/2026", type: "decaissement", categorie: "Remboursement", ref: "BK-2026-1194", rapproche: true },
  { id: 9, libelle: "Publicite Garage Auto Express", montant: 450, date: "01/06/2026", type: "encaissement", categorie: "Publicite", ref: "BK-2026-1193", rapproche: true },
  { id: 10, libelle: "Licence logiciel comptable", montant: -59, date: "01/06/2026", type: "decaissement", categorie: "Licence", ref: "BK-2026-1192", rapproche: true },
  { id: 11, libelle: "Commission encheres — semaine 22", montant: 1450, date: "02/06/2026", type: "encaissement", categorie: "Commission", ref: "BK-2026-1191", rapproche: true },
  { id: 12, libelle: "Marketing campagne Google Ads", montant: -1800, date: "01/06/2026", type: "decaissement", categorie: "Marketing", ref: "BK-2026-1190", rapproche: false },
];

const PREVISIONS = [
  { mois: "Juillet 2026", entrees: 68000, sorties: 42000, solde: 26000 },
  { mois: "Aout 2026", entrees: 55000, sorties: 38000, solde: 17000 },
  { mois: "Septembre 2026", entrees: 72000, sorties: 45000, solde: 27000 },
  { mois: "Octobre 2026", entrees: 78000, sorties: 48000, solde: 30000 },
  { mois: "Novembre 2026", entrees: 82000, sorties: 50000, solde: 32000 },
  { mois: "Decembre 2026", entrees: 95000, sorties: 55000, solde: 40000 },
];

export default function MKAPMSBanque() {
  const [tab, setTab] = useState<Tab>("resume");
  const [search, setSearch] = useState("");
  const [modalTx, setModalTx] = useState<Transaction | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const totalEncaiss = TRANSACTIONS.filter(t => t.type === "encaissement").reduce((s, t) => s + t.montant, 0);
  const totalDecaiss = TRANSACTIONS.filter(t => t.type === "decaissement").reduce((s, t) => s + Math.abs(t.montant), 0);
  const solde = totalEncaiss - totalDecaiss;
  const nonRapproches = TRANSACTIONS.filter(t => !t.rapproche).length;

  const filtered = TRANSACTIONS.filter(t => {
    if (tab === "encaissements" && t.type !== "encaissement") return false;
    if (tab === "decaissements" && t.type !== "decaissement") return false;
    if (tab === "rapprochement" && t.rapproche) return false;
    if (search) {
      const s = search.toLowerCase();
      return t.libelle.toLowerCase().includes(s) || t.ref.toLowerCase().includes(s);
    }
    return true;
  });

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
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Landmark size={20} className="text-[#D4AF37]" /> MKA.P-MS Banque</h1>
        <p className="mt-0.5 text-sm text-white/60">Connexion bancaire, rapprochement et previsions</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2 mb-4">
        <button onClick={() => setTab("encaissements")} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm active:scale-[0.97]">
          <ArrowDownLeft size={14} className="text-green-500 mx-auto mb-1" />
          <p className="text-lg font-black text-green-600">{totalEncaiss.toLocaleString("fr-FR")}</p>
          <p className="text-[8px] text-[#6B7280]">Encaissements</p>
        </button>
        <button onClick={() => setTab("decaissements")} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm active:scale-[0.97]">
          <ArrowUpRight size={14} className="text-red-500 mx-auto mb-1" />
          <p className="text-lg font-black text-red-500">{totalDecaiss.toLocaleString("fr-FR")}</p>
          <p className="text-[8px] text-[#6B7280]">Decaissements</p>
        </button>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <Landmark size={14} className="text-[#D4AF37] mx-auto mb-1" />
          <p className="text-lg font-black text-[#D4AF37]">{solde.toLocaleString("fr-FR")}</p>
          <p className="text-[8px] text-[#6B7280]">Solde</p>
        </div>
      </div>

      <div className="px-4 mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {(["resume", "encaissements", "decaissements", "rapprochement", "previsions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {t === "resume" ? "Resume" : t === "rapprochement" ? `Rapproch. (${nonRapproches})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === "previsions" ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <p className="text-[10px] text-white/40 uppercase mb-2">Prevision tresorerie — 6 prochains mois</p>
              <p className="text-2xl font-black text-[#D4AF37]">{PREVISIONS.reduce((s, p) => s + p.solde, 0).toLocaleString("fr-FR")} EUR</p>
              <p className="text-xs text-green-400">Solde cumule previsionnel</p>
            </div>
            {PREVISIONS.map(p => (
              <div key={p.mois} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <p className="text-sm font-bold text-[#111] mb-2">{p.mois}</p>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="rounded-lg bg-green-50 p-2"><span className="text-green-600">Entrees</span><p className="font-bold text-green-700">{p.entrees.toLocaleString()} EUR</p></div>
                  <div className="rounded-lg bg-red-50 p-2"><span className="text-red-600">Sorties</span><p className="font-bold text-red-700">{p.sorties.toLocaleString()} EUR</p></div>
                  <div className="rounded-lg bg-[#D4AF37]/10 p-2"><span className="text-[#D4AF37]">Solde</span><p className="font-bold text-[#111]">+{p.solde.toLocaleString()} EUR</p></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {tab !== "rapprochement" && (
              <div className="relative mb-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 py-2 text-xs text-[#111] placeholder:text-slate-400" />
              </div>
            )}
            {tab === "rapprochement" && nonRapproches === 0 && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
                <CheckCircle size={20} className="mx-auto text-green-500 mb-2" />
                <p className="text-sm font-bold text-green-700">Tout est rapproche !</p>
              </div>
            )}
            {filtered.map(t => (
              <button key={t.id} onClick={() => setModalTx(t)} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98] transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`h-9 w-9 rounded-lg shrink-0 grid place-items-center ${t.montant >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                      {t.montant >= 0 ? <ArrowDownLeft size={14} className="text-green-600" /> : <ArrowUpRight size={14} className="text-red-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#111] truncate">{t.libelle}</p>
                      <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
                        <span>{t.date}</span>
                        <span>{t.categorie}</span>
                        {!t.rapproche && <span className="rounded-full bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[8px] font-bold">Non rapproche</span>}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-black ${t.montant >= 0 ? "text-green-600" : "text-red-500"}`}>{t.montant >= 0 ? "+" : ""}{t.montant.toLocaleString()} EUR</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 mt-4 flex gap-2">
        <button onClick={() => showToast("Releve bancaire exporte en PDF")} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={14} /> Export PDF</button>
        <button onClick={() => showToast("Releve bancaire exporte en Excel")} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={14} /> Excel</button>
      </div>

      {modalTx && (
        <Overlay onClose={() => setModalTx(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">{modalTx.libelle}</h2>
            <div className="mt-3 rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-center mb-4">
              <p className="text-[10px] text-white/40 uppercase">Montant</p>
              <p className={`text-3xl font-black ${modalTx.montant >= 0 ? "text-green-400" : "text-red-400"}`}>{modalTx.montant >= 0 ? "+" : ""}{modalTx.montant.toLocaleString()} EUR</p>
            </div>
            <div className="space-y-2 text-[10px] mb-4">
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Reference</span><span className="font-bold text-[#111]">{modalTx.ref}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Date</span><span className="font-bold text-[#111]">{modalTx.date}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Categorie</span><span className="font-bold text-[#111]">{modalTx.categorie}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Rapproche</span><span className={`font-bold ${modalTx.rapproche ? "text-green-600" : "text-amber-600"}`}>{modalTx.rapproche ? "Oui" : "Non"}</span></div>
            </div>
            <div className="flex gap-2">
              {!modalTx.rapproche && (
                <button onClick={() => { showToast(`Transaction ${modalTx.ref} rapprochee`); setModalTx(null); }} className="flex-1 rounded-xl bg-green-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><CheckCircle size={14} /> Rapprocher</button>
              )}
              <button onClick={() => { showToast(`Export ${modalTx.ref}`); setModalTx(null); }} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1"><Download size={14} /> PDF</button>
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
