import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, FileText, Download, CheckCircle, X, Eye,
  Calendar, Clock, BarChart3, ChevronDown, Mail, Printer
} from "lucide-react";

type Frequence = "quotidien" | "hebdomadaire" | "mensuel" | "trimestriel" | "annuel";
type Tab = "generer" | "historique" | "automatiques";

interface Rapport {
  id: number;
  titre: string;
  frequence: Frequence;
  date: string;
  taille: string;
  format: string;
  statut: "disponible" | "en_cours" | "programme";
}

const RAPPORTS: Rapport[] = [
  { id: 1, titre: "Rapport quotidien — 09/06/2026", frequence: "quotidien", date: "09/06/2026", taille: "1.2 MB", format: "PDF", statut: "en_cours" },
  { id: 2, titre: "Rapport quotidien — 08/06/2026", frequence: "quotidien", date: "08/06/2026", taille: "1.1 MB", format: "PDF", statut: "disponible" },
  { id: 3, titre: "Rapport hebdomadaire — S23 2026", frequence: "hebdomadaire", date: "08/06/2026", taille: "3.4 MB", format: "PDF", statut: "disponible" },
  { id: 4, titre: "Rapport mensuel — Mai 2026", frequence: "mensuel", date: "01/06/2026", taille: "8.2 MB", format: "PDF + Excel", statut: "disponible" },
  { id: 5, titre: "Rapport mensuel — Avril 2026", frequence: "mensuel", date: "01/05/2026", taille: "7.8 MB", format: "PDF + Excel", statut: "disponible" },
  { id: 6, titre: "Rapport trimestriel — Q1 2026", frequence: "trimestriel", date: "01/04/2026", taille: "15.6 MB", format: "PDF + Excel", statut: "disponible" },
  { id: 7, titre: "Rapport annuel — 2025", frequence: "annuel", date: "01/01/2026", taille: "42.3 MB", format: "PDF + Excel", statut: "disponible" },
  { id: 8, titre: "Rapport trimestriel — Q2 2026", frequence: "trimestriel", date: "01/07/2026", taille: "—", format: "PDF + Excel", statut: "programme" },
];

const FREQ_STYLE: Record<Frequence, string> = {
  quotidien: "bg-blue-50 text-blue-700",
  hebdomadaire: "bg-purple-50 text-purple-700",
  mensuel: "bg-green-50 text-green-700",
  trimestriel: "bg-amber-50 text-amber-700",
  annuel: "bg-red-50 text-red-700",
};

const FREQ_LABEL: Record<Frequence, string> = {
  quotidien: "Quotidien",
  hebdomadaire: "Hebdo",
  mensuel: "Mensuel",
  trimestriel: "Trimestriel",
  annuel: "Annuel",
};

const AUTO_RAPPORTS = [
  { label: "Rapport quotidien", heure: "08:00", prochaine: "10/06/2026", actif: true, destinataires: "pdg@mkapms.fr" },
  { label: "Rapport hebdomadaire", heure: "Lundi 09:00", prochaine: "15/06/2026", actif: true, destinataires: "pdg@mkapms.fr, direction@mkapms.fr" },
  { label: "Rapport mensuel", heure: "1er du mois 08:00", prochaine: "01/07/2026", actif: true, destinataires: "pdg@mkapms.fr, comptabilite@mkapms.fr" },
  { label: "Rapport trimestriel", heure: "1er du trimestre 08:00", prochaine: "01/07/2026", actif: true, destinataires: "pdg@mkapms.fr, direction@mkapms.fr" },
  { label: "Rapport annuel", heure: "1er Janvier 08:00", prochaine: "01/01/2027", actif: true, destinataires: "pdg@mkapms.fr, conseil@mkapms.fr" },
];

export default function Rapports() {
  const [tab, setTab] = useState<Tab>("generer");
  const [freqFilter, setFreqFilter] = useState<Frequence | "tous">("tous");
  const [modalRapport, setModalRapport] = useState<Rapport | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [genType, setGenType] = useState<Frequence>("mensuel");
  const [genFormat, setGenFormat] = useState<"pdf" | "excel" | "both">("both");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = RAPPORTS.filter(r => freqFilter === "tous" || r.frequence === freqFilter);

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
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Rapports</h1>
        <p className="mt-0.5 text-sm text-white/60">Rapports automatiques et manuels — PDF & Excel</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <p className="text-lg font-black text-[#D4AF37]">{RAPPORTS.filter(r => r.statut === "disponible").length}</p>
          <p className="text-[9px] text-[#6B7280]">Disponibles</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <p className="text-lg font-black text-blue-600">{RAPPORTS.filter(r => r.statut === "en_cours").length}</p>
          <p className="text-[9px] text-[#6B7280]">En cours</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <p className="text-lg font-black text-green-600">{AUTO_RAPPORTS.filter(r => r.actif).length}</p>
          <p className="text-[9px] text-[#6B7280]">Automatises</p>
        </div>
      </div>

      <div className="px-4 mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {(["generer", "historique", "automatiques"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {t === "generer" ? "Generer" : t === "historique" ? "Historique" : "Automatiques"}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === "generer" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <h3 className="text-sm font-bold text-[#111] mb-3">Generer un rapport</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-[#6B7280] uppercase mb-1 block">Type de rapport</label>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(FREQ_LABEL) as Frequence[]).map(f => (
                      <button key={f} onClick={() => setGenType(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${genType === f ? "bg-[#111] text-[#D4AF37]" : "bg-[#F5F3EF] text-[#6B7280] border border-[#E5E7EB]"}`}>{FREQ_LABEL[f]}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#6B7280] uppercase mb-1 block">Format</label>
                  <div className="flex gap-2">
                    {([["pdf", "PDF"], ["excel", "Excel"], ["both", "PDF + Excel"]] as const).map(([k, l]) => (
                      <button key={k} onClick={() => setGenFormat(k)} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${genFormat === k ? "bg-[#D4AF37] text-white" : "bg-[#F5F3EF] text-[#6B7280] border border-[#E5E7EB]"}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => showToast(`Rapport ${FREQ_LABEL[genType]} en cours de generation...`)} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97]"><BarChart3 size={14} /> Generer maintenant</button>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <p className="text-[10px] text-white/40 uppercase mb-2">Contenu du rapport {FREQ_LABEL[genType]}</p>
              <div className="space-y-1.5">
                {[
                  "Resume financier (CA, Benefice, Tresorerie)",
                  "Revenus par univers",
                  "Depenses detaillees",
                  "Paiements recus / en attente",
                  "TVA collectee / deductible",
                  "Abonnements actifs / expiration",
                  "Performance par pays / agence",
                  ...(genType !== "quotidien" ? ["Graphiques d'evolution", "Comparaison periode precedente"] : []),
                  ...(genType === "annuel" || genType === "trimestriel" ? ["Analyse tendancielle", "Previsions"] : []),
                ].map(c => (
                  <div key={c} className="flex items-center gap-2 text-[10px] text-white/60"><CheckCircle size={10} className="text-green-400 shrink-0" /> {c}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "historique" && (
          <div className="space-y-3">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {(["tous", ...Object.keys(FREQ_LABEL)] as (Frequence | "tous")[]).map(f => (
                <button key={f} onClick={() => setFreqFilter(f)} className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${freqFilter === f ? "bg-[#D4AF37] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
                  {f === "tous" ? "Tous" : FREQ_LABEL[f as Frequence]}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filtered.map(r => (
                <button key={r.id} onClick={() => setModalRapport(r)} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98] transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#111] truncate">{r.titre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${FREQ_STYLE[r.frequence]}`}>{FREQ_LABEL[r.frequence]}</span>
                        <span className="text-[10px] text-[#6B7280]">{r.format} · {r.taille}</span>
                      </div>
                    </div>
                    <div className="ml-2 shrink-0">
                      {r.statut === "disponible" && <Download size={14} className="text-[#D4AF37]" />}
                      {r.statut === "en_cours" && <Clock size={14} className="text-blue-500 animate-spin" />}
                      {r.statut === "programme" && <Calendar size={14} className="text-slate-400" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "automatiques" && (
          <div className="space-y-2">
            {AUTO_RAPPORTS.map(r => (
              <div key={r.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-[#111]">{r.label}</p>
                  <div className={`h-5 w-9 rounded-full flex items-center px-0.5 transition ${r.actif ? "bg-green-500 justify-end" : "bg-slate-300 justify-start"}`}>
                    <div className="h-4 w-4 rounded-full bg-white shadow" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Programmation</span><p className="font-bold text-[#111]">{r.heure}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Prochaine</span><p className="font-bold text-[#111]">{r.prochaine}</p></div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-[#6B7280]">
                  <Mail size={10} /> {r.destinataires}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalRapport && (
        <Overlay onClose={() => setModalRapport(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">{modalRapport.titre}</h2>
            <div className="flex items-center gap-2 mb-4">
              <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${FREQ_STYLE[modalRapport.frequence]}`}>{FREQ_LABEL[modalRapport.frequence]}</span>
              <span className="text-[10px] text-[#6B7280]">{modalRapport.format} · {modalRapport.taille}</span>
            </div>
            <div className="space-y-2 text-[10px] mb-4">
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Date</span><span className="font-bold text-[#111]">{modalRapport.date}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Format</span><span className="font-bold text-[#111]">{modalRapport.format}</span></div>
              <div className="flex justify-between rounded-lg bg-[#F5F3EF] p-2.5"><span className="text-[#6B7280]">Taille</span><span className="font-bold text-[#111]">{modalRapport.taille}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => { showToast(`Telechargement PDF ${modalRapport.titre}`); setModalRapport(null); }} className="rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Download size={12} /> PDF</button>
              <button onClick={() => { showToast(`Telechargement Excel ${modalRapport.titre}`); setModalRapport(null); }} className="rounded-xl bg-green-600 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Download size={12} /> Excel</button>
              <button onClick={() => { showToast(`Email envoye avec le rapport`); setModalRapport(null); }} className="rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1"><Mail size={12} /> Email</button>
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
