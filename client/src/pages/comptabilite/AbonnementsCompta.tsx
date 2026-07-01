import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, CreditCard, ChevronDown, Download, Eye, CheckCircle,
  X, Search, Users, Clock, AlertTriangle, RefreshCw, Ban
} from "lucide-react";

type Tab = "tous" | "actifs" | "suspendus" | "expires" | "renouvellements";

interface Abonnement {
  id: number;
  plan: string;
  client: string;
  prix: string;
  statut: "actif" | "suspendu" | "expire" | "renouvellement";
  dateDebut: string;
  dateFin: string;
  methode: string;
  univers: string;
  dernierPaiement: string;
}

const ABONNEMENTS: Abonnement[] = [
  { id: 1, plan: "Pro Vente Premium", client: "Garage Auto 93", prix: "89 EUR/mois", statut: "actif", dateDebut: "01/01/2026", dateFin: "01/01/2027", methode: "CB", univers: "Vente", dernierPaiement: "01/06/2026" },
  { id: 2, plan: "Pro Vente Elite", client: "Top Auto", prix: "179 EUR/mois", statut: "actif", dateDebut: "15/03/2026", dateFin: "15/03/2027", methode: "Prelevement SEPA", univers: "Vente", dernierPaiement: "15/05/2026" },
  { id: 3, plan: "Location Pro", client: "Rent Express", prix: "89 EUR/mois", statut: "actif", dateDebut: "01/06/2025", dateFin: "01/06/2026", methode: "CB", univers: "Location", dernierPaiement: "01/06/2026" },
  { id: 4, plan: "Garage Pro Premium", client: "Garage Central", prix: "89 EUR/mois", statut: "actif", dateDebut: "01/04/2026", dateFin: "01/04/2027", methode: "CB", univers: "Garage", dernierPaiement: "01/06/2026" },
  { id: 5, plan: "Atelier Pro", client: "Atelier 93", prix: "89 EUR/mois", statut: "suspendu", dateDebut: "01/01/2026", dateFin: "01/01/2027", methode: "CB", univers: "Garage", dernierPaiement: "01/04/2026" },
  { id: 6, plan: "Encheres Pro", client: "Enchere Auto", prix: "49 EUR/mois", statut: "actif", dateDebut: "01/02/2026", dateFin: "01/02/2027", methode: "Stripe", univers: "Encheres", dernierPaiement: "01/06/2026" },
  { id: 7, plan: "Comptabilite Premium", client: "Cabinet Martin", prix: "59 EUR/mois", statut: "actif", dateDebut: "15/01/2026", dateFin: "15/01/2027", methode: "Prelevement SEPA", univers: "Comptabilite", dernierPaiement: "15/05/2026" },
  { id: 8, plan: "Carrosserie Pro", client: "Carrosserie Express", prix: "59 EUR/mois", statut: "expire", dateDebut: "01/06/2025", dateFin: "01/06/2026", methode: "CB", univers: "Carrosserie", dernierPaiement: "01/05/2026" },
  { id: 9, plan: "Pieces Pro", client: "Auto Pieces 93", prix: "59 EUR/mois", statut: "actif", dateDebut: "01/03/2026", dateFin: "01/03/2027", methode: "CB", univers: "Pieces", dernierPaiement: "01/06/2026" },
  { id: 10, plan: "Depannage Pro", client: "SOS Depannage IDF", prix: "49 EUR/mois", statut: "renouvellement", dateDebut: "01/06/2025", dateFin: "01/06/2026", methode: "Stripe", univers: "Depannage", dernierPaiement: "01/06/2026" },
  { id: 11, plan: "VTC Pro", client: "VTC Express Paris", prix: "89 EUR/mois", statut: "actif", dateDebut: "01/05/2026", dateFin: "01/05/2027", methode: "CB", univers: "VTC", dernierPaiement: "01/06/2026" },
  { id: 12, plan: "Finance+", client: "Credit Auto Plus", prix: "129 EUR/mois", statut: "actif", dateDebut: "15/04/2026", dateFin: "15/04/2027", methode: "Prelevement SEPA", univers: "Finance+", dernierPaiement: "15/05/2026" },
  { id: 13, plan: "Electric+", client: "EV Motors", prix: "99 EUR/mois", statut: "actif", dateDebut: "01/04/2026", dateFin: "01/04/2027", methode: "CB", univers: "Electric+", dernierPaiement: "01/06/2026" },
  { id: 14, plan: "Livraison Pro", client: "Livraison Rapide", prix: "69 EUR/mois", statut: "suspendu", dateDebut: "01/02/2026", dateFin: "01/02/2027", methode: "CB", univers: "Livraison", dernierPaiement: "01/03/2026" },
  { id: 15, plan: "Franchise Nationale", client: "MKA Franchise Lyon", prix: "499 EUR/mois", statut: "actif", dateDebut: "01/01/2026", dateFin: "01/01/2027", methode: "Virement", univers: "Franchise", dernierPaiement: "01/06/2026" },
  { id: 16, plan: "VO Pro", client: "AutoVO Paris", prix: "79 EUR/mois", statut: "expire", dateDebut: "01/12/2025", dateFin: "01/06/2026", methode: "CB", univers: "VO", dernierPaiement: "01/05/2026" },
];

const STATUT_STYLE: Record<string, string> = {
  actif: "bg-green-50 text-green-700",
  suspendu: "bg-amber-50 text-amber-700",
  expire: "bg-red-50 text-red-700",
  renouvellement: "bg-blue-50 text-blue-700",
};

const STATUT_LABEL: Record<string, string> = {
  actif: "Actif",
  suspendu: "Suspendu",
  expire: "Expire",
  renouvellement: "Renouvellement",
};

const PLANS_PRIX = [
  { plan: "Comptabilite Start", prix: "29 EUR/mois", features: ["Tableau de bord", "20 clients", "Facturation", "Rapports simples", "Messagerie"] },
  { plan: "Comptabilite Premium", prix: "59 EUR/mois", features: ["Tout Start +", "100 clients", "Facturation auto", "Gestion documentaire", "Statistiques avancees", "Multi-utilisateurs"] },
  { plan: "Comptabilite Elite", prix: "99 EUR/mois", features: ["Tout Premium +", "Clients illimites", "API", "Multi-collaborateurs", "Rapports avances", "Export auto", "Gestionnaire dedie"] },
  { plan: "Comptabilite Entreprise", prix: "199+ EUR/mois", features: ["Multi-societes", "Consolidation comptable", "Comptabilite internationale", "Multi-devises", "Multi-pays", "API ERP", "Support prioritaire"] },
];

export default function AbonnementsCompta() {
  const [tab, setTab] = useState<Tab>("tous");
  const [search, setSearch] = useState("");
  const [modalAbo, setModalAbo] = useState<Abonnement | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = ABONNEMENTS.filter(a => {
    if (tab === "actifs" && a.statut !== "actif") return false;
    if (tab === "suspendus" && a.statut !== "suspendu") return false;
    if (tab === "expires" && a.statut !== "expire") return false;
    if (tab === "renouvellements" && a.statut !== "renouvellement") return false;
    if (search) {
      const s = search.toLowerCase();
      return a.plan.toLowerCase().includes(s) || a.client.toLowerCase().includes(s) || a.univers.toLowerCase().includes(s);
    }
    return true;
  });

  const actifs = ABONNEMENTS.filter(a => a.statut === "actif").length;
  const suspendus = ABONNEMENTS.filter(a => a.statut === "suspendu").length;
  const expires = ABONNEMENTS.filter(a => a.statut === "expire").length;
  const revenuMensuel = ABONNEMENTS.filter(a => a.statut === "actif").reduce((s, a) => s + parseInt(a.prix), 0);

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
        <h1 className="text-xl font-black text-white flex items-center gap-2"><CreditCard size={20} className="text-[#D4AF37]" /> Abonnements</h1>
        <p className="mt-0.5 text-sm text-white/60">Gestion de tous les abonnements MKA.P-MS</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 grid grid-cols-4 gap-2 mb-4">
        <button onClick={() => setTab("actifs")} className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-center shadow-sm active:scale-[0.97]">
          <p className="text-lg font-black text-green-600">{actifs}</p>
          <p className="text-[8px] text-[#6B7280]">Actifs</p>
        </button>
        <button onClick={() => setTab("suspendus")} className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-center shadow-sm active:scale-[0.97]">
          <p className="text-lg font-black text-amber-600">{suspendus}</p>
          <p className="text-[8px] text-[#6B7280]">Suspendus</p>
        </button>
        <button onClick={() => setTab("expires")} className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-center shadow-sm active:scale-[0.97]">
          <p className="text-lg font-black text-red-600">{expires}</p>
          <p className="text-[8px] text-[#6B7280]">Expires</p>
        </button>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-center shadow-sm">
          <p className="text-lg font-black text-[#D4AF37]">{revenuMensuel.toLocaleString()}</p>
          <p className="text-[8px] text-[#6B7280]">EUR/mois</p>
        </div>
      </div>

      <div className="px-4 mb-3">
        <button onClick={() => setShowPlans(true)} className="w-full rounded-xl bg-[#D4AF37] py-2 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97]"><Eye size={14} /> Voir les plans comptabilite</button>
      </div>

      <div className="px-4 mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {(["tous", "actifs", "suspendus", "expires", "renouvellements"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {t === "tous" ? "Tous" : t === "actifs" ? "Actifs" : t === "suspendus" ? "Suspendus" : t === "expires" ? "Expires" : "Renouvellements"}
          </button>
        ))}
      </div>

      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un abonnement..." className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 py-2 text-xs text-[#111] placeholder:text-slate-400" />
        </div>
      </div>

      <div className="px-4 space-y-2">
        {filtered.map(a => (
          <button key={a.id} onClick={() => setModalAbo(a)} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98] transition">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-[#111] truncate">{a.plan}</p>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${STATUT_STYLE[a.statut]}`}>{STATUT_LABEL[a.statut]}</span>
                </div>
                <p className="text-[10px] text-[#6B7280]">{a.client} · {a.univers}</p>
              </div>
              <div className="text-right ml-2 shrink-0">
                <p className="text-sm font-black text-[#D4AF37]">{a.prix}</p>
                <p className="text-[10px] text-[#6B7280]">{a.methode}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
        <button onClick={() => showToast("Export Excel de tous les abonnements")} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={14} /> Exporter</button>
      </div>

      {modalAbo && (
        <Overlay onClose={() => setModalAbo(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">{modalAbo.plan}</h2>
            <p className="text-xs text-slate-500 mb-1">{modalAbo.client}</p>
            <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${STATUT_STYLE[modalAbo.statut]}`}>{STATUT_LABEL[modalAbo.statut]}</span>
            <div className="mt-4 rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-center mb-4">
              <p className="text-[10px] text-white/40 uppercase">Tarif mensuel</p>
              <p className="text-3xl font-black text-[#D4AF37]">{modalAbo.prix}</p>
            </div>
            <div className="space-y-2 text-[10px] mb-4">
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Univers</span><span className="font-bold text-[#111]">{modalAbo.univers}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Date debut</span><span className="font-bold text-[#111]">{modalAbo.dateDebut}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Date fin</span><span className="font-bold text-[#111]">{modalAbo.dateFin}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Methode</span><span className="font-bold text-[#111]">{modalAbo.methode}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Dernier paiement</span><span className="font-bold text-[#111]">{modalAbo.dernierPaiement}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {modalAbo.statut === "actif" && <button onClick={() => { showToast(`Abonnement ${modalAbo.plan} suspendu`); setModalAbo(null); }} className="rounded-xl border border-amber-200 py-2.5 text-xs font-bold text-amber-600 flex items-center justify-center gap-1"><Ban size={12} /> Suspendre</button>}
              {modalAbo.statut === "suspendu" && <button onClick={() => { showToast(`Abonnement ${modalAbo.plan} reactive`); setModalAbo(null); }} className="rounded-xl bg-green-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><RefreshCw size={12} /> Reactiver</button>}
              {modalAbo.statut === "expire" && <button onClick={() => { showToast(`Renouvellement ${modalAbo.plan} lance`); setModalAbo(null); }} className="rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><RefreshCw size={12} /> Renouveler</button>}
              <button onClick={() => { showToast(`Historique paiements ${modalAbo.client}`); setModalAbo(null); }} className="rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1"><Eye size={12} /> Historique</button>
            </div>
          </div>
        </Overlay>
      )}

      {showPlans && (
        <Overlay onClose={() => setShowPlans(false)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-4">Plans Comptabilite MKA.P-MS</h2>
            <div className="space-y-3">
              {PLANS_PRIX.map(p => (
                <div key={p.plan} className="rounded-xl border border-[#E5E7EB] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-[#111]">{p.plan}</h3>
                    <span className="text-sm font-black text-[#D4AF37]">{p.prix}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.features.map(f => (
                      <span key={f} className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[9px] font-medium text-[#6B7280]">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
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
