import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Calculator, TrendingUp, TrendingDown, Euro, BarChart3,
  X, Eye, Download, Edit3, Printer, CheckCircle, Search
} from "lucide-react";

const REVENUS = [
  { source: "Vente", montant: "45 200 €", pct: "+12%", transactions: 34, moyenne: "1 329 €", derniere: "09/06/2025" },
  { source: "Location", montant: "28 300 €", pct: "+8%", transactions: 67, moyenne: "422 €", derniere: "09/06/2025" },
  { source: "Garage", montant: "18 700 €", pct: "+15%", transactions: 89, moyenne: "210 €", derniere: "08/06/2025" },
  { source: "Pièces", montant: "12 400 €", pct: "+22%", transactions: 156, moyenne: "79 €", derniere: "09/06/2025" },
  { source: "Démarches", montant: "8 900 €", pct: "+5%", transactions: 45, moyenne: "198 €", derniere: "07/06/2025" },
  { source: "Publicité", montant: "6 200 €", pct: "+30%", transactions: 78, moyenne: "79 €", derniere: "09/06/2025" },
];

const DEPENSES = [
  { poste: "Salaires", montant: "35 000 €", detail: "28 employés · Masse salariale mensuelle", modifiable: false },
  { poste: "Publicité", montant: "8 500 €", detail: "Campagnes Google Ads + réseaux sociaux", modifiable: true },
  { poste: "Fournisseurs", montant: "12 000 €", detail: "Pièces auto, consommables, outillage", modifiable: true },
  { poste: "Logiciels", montant: "2 200 €", detail: "Hébergement, licences, SaaS", modifiable: true },
  { poste: "Serveurs", montant: "1 800 €", detail: "Railway, base de données, CDN", modifiable: false },
];

const FACTURES = [
  { ref: "FA-2025-0412", objet: "Peugeot 3008 GT", client: "Martin D.", montant: "+28 500 €", date: "09/06/2025", statut: "Payée", type: "Vente" },
  { ref: "LO-2025-0189", objet: "Location Mercedes E Break", client: "Sophie L.", montant: "+1 350 €", date: "08/06/2025", statut: "Payée", type: "Location" },
  { ref: "AB-2025-0089", objet: "Abonnement Pro Premium x12", client: "Garage Auto 93", montant: "+1 068 €", date: "07/06/2025", statut: "Payée", type: "Abonnement" },
  { ref: "DV-2025-0156", objet: "Devis Garage Auto Express", client: "Auto Express", montant: "+389 €", date: "06/06/2025", statut: "En attente", type: "Garage" },
  { ref: "PUB-2025-0042", objet: "Boost Premium Annonce #142", client: "Pierre K.", montant: "+29 €", date: "06/06/2025", statut: "Payée", type: "Publicité" },
  { ref: "RB-2025-0008", objet: "Remboursement réservation", client: "Ahmed M.", montant: "-50 €", date: "05/06/2025", statut: "Traitée", type: "Remboursement" },
];

export default function ComptabiliteComplete() {
  const [tab, setTab] = useState<"resume" | "revenus" | "depenses" | "factures">("resume");
  const [modalRevenu, setModalRevenu] = useState<typeof REVENUS[0] | null>(null);
  const [modalDepense, setModalDepense] = useState<typeof DEPENSES[0] | null>(null);
  const [modalFacture, setModalFacture] = useState<typeof FACTURES[0] | null>(null);
  const [editDepenseVal, setEditDepenseVal] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [searchFacture, setSearchFacture] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const totalRevenus = 119700;
  const totalDepenses = 59500;
  const benefice = totalRevenus - totalDepenses;

  const filteredFactures = FACTURES.filter(f =>
    f.objet.toLowerCase().includes(searchFacture.toLowerCase()) ||
    f.client.toLowerCase().includes(searchFacture.toLowerCase()) ||
    f.ref.toLowerCase().includes(searchFacture.toLowerCase())
  );

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
      {/* Header */}
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Calculator size={20} className="text-[#D4AF37]" /> Comptabilité</h1>
        <p className="mt-0.5 text-sm text-white/50">Gestion financière complète MKA.P-MS</p>
      </div>

      {/* Summary cards */}
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2 mb-4">
        <button onClick={() => setTab("revenus")} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm active:scale-[0.97] transition">
          <TrendingUp size={16} className="text-green-500 mx-auto mb-1" />
          <p className="text-lg font-black text-green-600">{totalRevenus.toLocaleString("fr-FR")} €</p>
          <p className="text-[9px] text-[#6B7280]">CA mensuel</p>
        </button>
        <button onClick={() => setTab("depenses")} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm active:scale-[0.97] transition">
          <TrendingDown size={16} className="text-red-500 mx-auto mb-1" />
          <p className="text-lg font-black text-red-500">{totalDepenses.toLocaleString("fr-FR")} €</p>
          <p className="text-[9px] text-[#6B7280]">Charges</p>
        </button>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <Euro size={16} className="text-[#D4AF37] mx-auto mb-1" />
          <p className="text-lg font-black text-[#D4AF37]">{benefice.toLocaleString("fr-FR")} €</p>
          <p className="text-[9px] text-[#6B7280]">Bénéfice</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {(["resume", "revenus", "depenses", "factures"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {t === "resume" ? "Résumé" : t === "revenus" ? "Revenus" : t === "depenses" ? "Dépenses" : "Factures"}
          </button>
        ))}
      </div>

      <div className="px-4">
        {/* -------- RESUME -------- */}
        {tab === "resume" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37]">Revenus par service</h3></div>
              {REVENUS.map(r => (
                <button key={r.source} onClick={() => setModalRevenu(r)} className="w-full flex items-center justify-between px-3 py-2.5 border-b border-[#F3F4F6] last:border-0 text-left active:bg-[#F5F3EF] transition">
                  <span className="text-sm font-semibold text-[#111]">{r.source}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#111]">{r.montant}</span>
                    <span className="text-[10px] text-green-500 ml-2">{r.pct}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37]">Dépenses</h3></div>
              {DEPENSES.map(d => (
                <button key={d.poste} onClick={() => { setModalDepense(d); setEditDepenseVal(d.montant); setEditMode(false); }} className="w-full flex items-center justify-between px-3 py-2.5 border-b border-[#F3F4F6] last:border-0 text-left active:bg-[#F5F3EF] transition">
                  <div>
                    <span className="text-sm font-semibold text-[#111]">{d.poste}</span>
                    {d.modifiable && <span className="ml-1 text-[8px] text-[#D4AF37] font-bold">MODIFIABLE</span>}
                  </div>
                  <span className="text-sm font-bold text-red-500">{d.montant}</span>
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#D4AF37]">Dernières factures</h3>
                <button onClick={() => setTab("factures")} className="text-[9px] text-white/50">Tout voir →</button>
              </div>
              {FACTURES.slice(0, 3).map(f => (
                <button key={f.ref} onClick={() => setModalFacture(f)} className="w-full flex items-center justify-between px-3 py-2 border-b border-[#F3F4F6] last:border-0 text-left active:bg-[#F5F3EF] transition">
                  <div>
                    <p className="text-xs font-bold text-[#111]">{f.objet}</p>
                    <p className="text-[10px] text-slate-400">{f.client} · {f.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${f.montant.startsWith("-") ? "text-red-500" : "text-green-600"}`}>{f.montant}</p>
                    <span className={`text-[8px] font-bold ${f.statut === "Payée" ? "text-green-600" : f.statut === "En attente" ? "text-amber-600" : "text-blue-600"}`}>{f.statut}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* -------- REVENUS -------- */}
        {tab === "revenus" && (
          <div className="space-y-2">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 mb-3">
              <p className="text-[10px] text-white/40 uppercase">Total revenus mensuels</p>
              <p className="text-2xl font-black text-[#D4AF37]">{totalRevenus.toLocaleString("fr-FR")} €</p>
              <p className="text-xs text-green-400 mt-0.5">+14.2% vs mois précédent</p>
            </div>
            {REVENUS.map(r => (
              <button key={r.source} onClick={() => setModalRevenu(r)} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98] transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{r.source}</p>
                    <p className="text-[10px] text-slate-400">{r.transactions} transactions · Moy. {r.moyenne}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#111]">{r.montant}</p>
                    <p className="text-[10px] text-green-500 font-bold">{r.pct}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* -------- DEPENSES -------- */}
        {tab === "depenses" && (
          <div className="space-y-2">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 mb-3">
              <p className="text-[10px] text-white/40 uppercase">Total charges mensuelles</p>
              <p className="text-2xl font-black text-red-400">{totalDepenses.toLocaleString("fr-FR")} €</p>
            </div>
            {DEPENSES.map(d => (
              <button key={d.poste} onClick={() => { setModalDepense(d); setEditDepenseVal(d.montant); setEditMode(false); }} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98] transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{d.poste}</p>
                    <p className="text-[10px] text-slate-400">{d.detail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-red-500">{d.montant}</p>
                    {d.modifiable && <span className="text-[8px] text-[#D4AF37] font-bold">MODIFIABLE</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* -------- FACTURES -------- */}
        {tab === "factures" && (
          <div className="space-y-2">
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchFacture} onChange={e => setSearchFacture(e.target.value)} placeholder="Rechercher une facture..." className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 py-2 text-xs text-[#111] placeholder:text-slate-400" />
            </div>
            {filteredFactures.map(f => (
              <button key={f.ref} onClick={() => setModalFacture(f)} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98] transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{f.objet}</p>
                    <p className="text-[10px] text-slate-400">{f.client} · {f.ref} · {f.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${f.montant.startsWith("-") ? "text-red-500" : "text-green-600"}`}>{f.montant}</p>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${f.statut === "Payée" ? "bg-green-50 text-green-700" : f.statut === "En attente" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{f.statut}</span>
                  </div>
                </div>
              </button>
            ))}
            <button onClick={() => showToast("Export PDF de toutes les factures")} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97] transition"><Download size={14} /> Exporter toutes les factures</button>
          </div>
        )}
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* Revenu Detail */}
      {modalRevenu && (
        <Overlay onClose={() => setModalRevenu(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">{modalRevenu.source}</h2>
            <p className="text-xs text-slate-500 mb-4">Détails des revenus — {modalRevenu.source}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">CA mensuel</p><p className="text-lg font-black text-green-600">{modalRevenu.montant}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Évolution</p><p className="text-lg font-black text-green-600">{modalRevenu.pct}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Transactions</p><p className="text-lg font-black text-[#111]">{modalRevenu.transactions}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Moyenne</p><p className="text-lg font-black text-[#111]">{modalRevenu.moyenne}</p></div>
            </div>
            <div className="rounded-xl bg-[#F5F3EF] p-3 mb-3">
              <p className="text-[10px] text-slate-400">Dernière transaction</p>
              <p className="text-sm font-bold text-[#111]">{modalRevenu.derniere}</p>
            </div>
            <button onClick={() => { showToast(`Rapport ${modalRevenu.source} exporté`); setModalRevenu(null); }} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Download size={14} /> Exporter le rapport {modalRevenu.source}</button>
          </div>
        </Overlay>
      )}

      {/* Depense Detail */}
      {modalDepense && (
        <Overlay onClose={() => { setModalDepense(null); setEditMode(false); }}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">{modalDepense.poste}</h2>
            <p className="text-xs text-slate-500 mb-4">{modalDepense.detail}</p>
            <div className="rounded-xl bg-[#F5F3EF] p-4 text-center mb-4">
              <p className="text-[10px] text-slate-400">Montant mensuel</p>
              {editMode && modalDepense.modifiable ? (
                <input value={editDepenseVal} onChange={e => setEditDepenseVal(e.target.value)} className="mt-1 text-center text-lg font-black text-red-500 bg-white border border-[#E5E7EB] rounded-lg px-3 py-1 w-full" />
              ) : (
                <p className="text-2xl font-black text-red-500">{modalDepense.montant}</p>
              )}
            </div>
            {modalDepense.modifiable ? (
              <div className="space-y-2">
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Edit3 size={14} /> Modifier le budget</button>
                ) : (
                  <button onClick={() => { showToast(`Budget ${modalDepense.poste} modifié: ${editDepenseVal}`); setModalDepense(null); setEditMode(false); }} className="w-full rounded-xl bg-green-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><CheckCircle size={14} /> Enregistrer</button>
                )}
                <button onClick={() => { showToast(`Historique ${modalDepense.poste} ouvert`); setModalDepense(null); }} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97] transition"><Eye size={14} /> Voir l'historique</button>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
                <p className="text-xs text-amber-700">Ce poste de dépense n'est pas modifiable directement. Contactez la direction.</p>
              </div>
            )}
          </div>
        </Overlay>
      )}

      {/* Facture Detail */}
      {modalFacture && (
        <Overlay onClose={() => setModalFacture(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">{modalFacture.objet}</h2>
            <p className="text-xs text-slate-500 mb-4">Ref: {modalFacture.ref}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Montant</p><p className={`text-lg font-black ${modalFacture.montant.startsWith("-") ? "text-red-500" : "text-green-600"}`}>{modalFacture.montant}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Date</p><p className="text-sm font-black text-[#111]">{modalFacture.date}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Client</p><p className="text-sm font-bold text-[#111]">{modalFacture.client}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Statut</p><p className={`text-sm font-bold ${modalFacture.statut === "Payée" ? "text-green-600" : modalFacture.statut === "En attente" ? "text-amber-600" : "text-blue-600"}`}>{modalFacture.statut}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3 col-span-2"><p className="text-[10px] text-slate-400">Type</p><p className="text-sm font-bold text-[#111]">{modalFacture.type}</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { showToast(`Facture ${modalFacture.ref} imprimée`); setModalFacture(null); }} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Printer size={14} /> Imprimer</button>
              <button onClick={() => { showToast(`PDF ${modalFacture.ref} téléchargé`); setModalFacture(null); }} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97] transition"><Download size={14} /> PDF</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[90%]">
          <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-xl flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400 shrink-0" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-white/40 hover:text-white">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
