import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Megaphone, ChevronDown, Download, Eye, CheckCircle,
  X, Search, MousePointer2, Eye as Views, Clock, TrendingUp
} from "lucide-react";

type Tab = "resume" | "campagnes" | "emplacements";

interface Campagne {
  id: number;
  client: string;
  emplacement: string;
  dateDebut: string;
  dateFin: string;
  prix: number;
  vues: number;
  clics: number;
  taux: string;
  statut: "active" | "terminee" | "programmee";
}

const CAMPAGNES: Campagne[] = [
  { id: 1, client: "Garage Auto Express", emplacement: "Banniere top page accueil", dateDebut: "01/06/2026", dateFin: "30/06/2026", prix: 450, vues: 12500, clics: 380, taux: "3.04%", statut: "active" },
  { id: 2, client: "Top Auto Paris", emplacement: "Sidebar resultats recherche", dateDebut: "01/06/2026", dateFin: "30/06/2026", prix: 320, vues: 8900, clics: 210, taux: "2.36%", statut: "active" },
  { id: 3, client: "Rent Express", emplacement: "Banniere page location", dateDebut: "15/05/2026", dateFin: "15/06/2026", prix: 280, vues: 6200, clics: 145, taux: "2.34%", statut: "active" },
  { id: 4, client: "Meca Pro Service", emplacement: "Carte sponsorisee garage", dateDebut: "01/06/2026", dateFin: "30/06/2026", prix: 180, vues: 4500, clics: 98, taux: "2.18%", statut: "active" },
  { id: 5, client: "Pierre K.", emplacement: "Boost Premium annonce #142", dateDebut: "06/06/2026", dateFin: "06/07/2026", prix: 29, vues: 1200, clics: 45, taux: "3.75%", statut: "active" },
  { id: 6, client: "EV Motors", emplacement: "Banniere Electric+", dateDebut: "01/05/2026", dateFin: "31/05/2026", prix: 350, vues: 9800, clics: 290, taux: "2.96%", statut: "terminee" },
  { id: 7, client: "Credit Auto Plus", emplacement: "Sidebar Finance+", dateDebut: "15/05/2026", dateFin: "15/06/2026", prix: 220, vues: 5400, clics: 120, taux: "2.22%", statut: "terminee" },
  { id: 8, client: "Assurance MKA", emplacement: "Banniere top page accueil", dateDebut: "01/07/2026", dateFin: "31/07/2026", prix: 500, vues: 0, clics: 0, taux: "—", statut: "programmee" },
];

const EMPLACEMENTS = [
  { nom: "Banniere top page accueil", prix: "450 EUR/mois", vues: "15 000/mois", ctr: "3.1%", disponible: false },
  { nom: "Sidebar resultats recherche", prix: "320 EUR/mois", vues: "10 000/mois", ctr: "2.4%", disponible: false },
  { nom: "Banniere page location", prix: "280 EUR/mois", vues: "7 000/mois", ctr: "2.3%", disponible: true },
  { nom: "Carte sponsorisee garage", prix: "180 EUR/mois", vues: "5 000/mois", ctr: "2.2%", disponible: false },
  { nom: "Boost Premium annonce", prix: "29 EUR/30j", vues: "1 200/mois", ctr: "3.8%", disponible: true },
  { nom: "Banniere Electric+", prix: "350 EUR/mois", vues: "10 000/mois", ctr: "3.0%", disponible: true },
  { nom: "Sidebar Finance+", prix: "220 EUR/mois", vues: "6 000/mois", ctr: "2.2%", disponible: true },
  { nom: "Footer page detail vehicule", prix: "150 EUR/mois", vues: "8 000/mois", ctr: "1.5%", disponible: true },
  { nom: "Banniere page encheres", prix: "250 EUR/mois", vues: "4 000/mois", ctr: "2.8%", disponible: true },
];

const STATUT_STYLE: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  terminee: "bg-slate-100 text-slate-600",
  programmee: "bg-blue-50 text-blue-700",
};

export default function PublicitesRevenu() {
  const [tab, setTab] = useState<Tab>("resume");
  const [modalCamp, setModalCamp] = useState<Campagne | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const totalRevenu = CAMPAGNES.reduce((s, c) => s + c.prix, 0);
  const totalVues = CAMPAGNES.reduce((s, c) => s + c.vues, 0);
  const totalClics = CAMPAGNES.reduce((s, c) => s + c.clics, 0);

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
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Megaphone size={20} className="text-[#D4AF37]" /> Publicites</h1>
        <p className="mt-0.5 text-sm text-white/60">Suivi des revenus publicitaires</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <TrendingUp size={14} className="text-[#D4AF37] mx-auto mb-1" />
          <p className="text-lg font-black text-[#D4AF37]">{totalRevenu.toLocaleString()} EUR</p>
          <p className="text-[9px] text-[#6B7280]">Revenu total</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <Views size={14} className="text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-black text-blue-600">{(totalVues / 1000).toFixed(1)}k</p>
          <p className="text-[9px] text-[#6B7280]">Impressions</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <MousePointer2 size={14} className="text-green-500 mx-auto mb-1" />
          <p className="text-lg font-black text-green-600">{totalClics.toLocaleString()}</p>
          <p className="text-[9px] text-[#6B7280]">Clics</p>
        </div>
      </div>

      <div className="px-4 mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {(["resume", "campagnes", "emplacements"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {t === "resume" ? "Resume" : t === "campagnes" ? "Campagnes" : "Emplacements"}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === "resume" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37]">Campagnes actives</h3></div>
              {CAMPAGNES.filter(c => c.statut === "active").map(c => (
                <button key={c.id} onClick={() => setModalCamp(c)} className="w-full flex items-center justify-between px-3 py-2.5 border-b border-[#F3F4F6] last:border-0 text-left active:bg-[#F5F3EF] transition">
                  <div>
                    <p className="text-sm font-semibold text-[#111]">{c.client}</p>
                    <p className="text-[10px] text-[#6B7280]">{c.emplacement}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#D4AF37]">{c.prix} EUR</p>
                    <p className="text-[10px] text-[#6B7280]">{c.vues.toLocaleString()} vues</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <p className="text-[10px] text-white/40 uppercase mb-3">Performance globale</p>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-[10px] text-white/50">CTR moyen</p><p className="text-lg font-black text-[#D4AF37]">{totalVues > 0 ? (totalClics / totalVues * 100).toFixed(2) : 0}%</p></div>
                <div><p className="text-[10px] text-white/50">CPC moyen</p><p className="text-lg font-black text-white">{totalClics > 0 ? (totalRevenu / totalClics).toFixed(2) : 0} EUR</p></div>
                <div><p className="text-[10px] text-white/50">CPM</p><p className="text-lg font-black text-green-400">{totalVues > 0 ? (totalRevenu / totalVues * 1000).toFixed(2) : 0} EUR</p></div>
                <div><p className="text-[10px] text-white/50">Campagnes actives</p><p className="text-lg font-black text-blue-400">{CAMPAGNES.filter(c => c.statut === "active").length}</p></div>
              </div>
            </div>
          </div>
        )}

        {tab === "campagnes" && (
          <div className="space-y-2">
            {CAMPAGNES.map(c => (
              <button key={c.id} onClick={() => setModalCamp(c)} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98] transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-[#111] truncate">{c.client}</p>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${STATUT_STYLE[c.statut]}`}>{c.statut}</span>
                    </div>
                    <p className="text-[10px] text-[#6B7280]">{c.emplacement} · {c.dateDebut} — {c.dateFin}</p>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <p className="text-sm font-black text-[#D4AF37]">{c.prix} EUR</p>
                    <p className="text-[10px] text-[#6B7280]">{c.vues.toLocaleString()} vues · {c.clics} clics</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === "emplacements" && (
          <div className="space-y-2">
            {EMPLACEMENTS.map(e => (
              <div key={e.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-[#111]">{e.nom}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${e.disponible ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{e.disponible ? "Disponible" : "Occupe"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Prix</span><p className="font-bold text-[#D4AF37]">{e.prix}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Vues est.</span><p className="font-bold text-[#111]">{e.vues}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">CTR moy.</span><p className="font-bold text-[#111]">{e.ctr}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 mt-4">
        <button onClick={() => showToast("Rapport publicitaire exporte")} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={14} /> Exporter le rapport</button>
      </div>

      {modalCamp && (
        <Overlay onClose={() => setModalCamp(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">{modalCamp.client}</h2>
            <p className="text-xs text-slate-500 mb-1">{modalCamp.emplacement}</p>
            <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${STATUT_STYLE[modalCamp.statut]}`}>{modalCamp.statut}</span>
            <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
              <div className="rounded-xl bg-[#D4AF37]/10 p-3"><p className="text-[10px] text-[#D4AF37]">Prix</p><p className="text-lg font-black text-[#111]">{modalCamp.prix} EUR</p></div>
              <div className="rounded-xl bg-blue-50 p-3"><p className="text-[10px] text-blue-600">Impressions</p><p className="text-lg font-black text-blue-700">{modalCamp.vues.toLocaleString()}</p></div>
              <div className="rounded-xl bg-green-50 p-3"><p className="text-[10px] text-green-600">Clics</p><p className="text-lg font-black text-green-700">{modalCamp.clics.toLocaleString()}</p></div>
              <div className="rounded-xl bg-purple-50 p-3"><p className="text-[10px] text-purple-600">CTR</p><p className="text-lg font-black text-purple-700">{modalCamp.taux}</p></div>
            </div>
            <div className="space-y-2 text-[10px] mb-4">
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Debut</span><span className="font-bold text-[#111]">{modalCamp.dateDebut}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Fin</span><span className="font-bold text-[#111]">{modalCamp.dateFin}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">CPC</span><span className="font-bold text-[#111]">{modalCamp.clics > 0 ? (modalCamp.prix / modalCamp.clics).toFixed(2) : "—"} EUR</span></div>
            </div>
            <button onClick={() => { showToast(`Rapport ${modalCamp.client} exporte`); setModalCamp(null); }} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Download size={14} /> Rapport detaille</button>
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
