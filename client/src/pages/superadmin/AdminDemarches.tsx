import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileText, ChevronDown, Eye, Trash2, CheckCircle, Search, Clock, User, Ban } from "lucide-react";

const DOSSIERS = [
  { id: 1, type: "Carte grise", client: "Martin D.", vehicule: "Peugeot 308", statut: "en_cours", dateDemande: "05/06/2026", ref: "CG-2026-001", montant: 250 },
  { id: 2, type: "Cession", client: "Sophie L.", vehicule: "Renault Clio", statut: "termine", dateDemande: "01/06/2026", ref: "CES-2026-015", montant: 80 },
  { id: 3, type: "Duplicata CG", client: "Ahmed K.", vehicule: "BMW 320d", statut: "en_attente", dateDemande: "08/06/2026", ref: "DUP-2026-003", montant: 120 },
  { id: 4, type: "Changement adresse", client: "Julie P.", vehicule: "Audi A4", statut: "en_cours", dateDemande: "07/06/2026", ref: "ADR-2026-009", montant: 0 },
  { id: 5, type: "Import vehicule", client: "Garage Auto 93", vehicule: "Mercedes GLE", statut: "en_attente", dateDemande: "03/06/2026", ref: "IMP-2026-002", montant: 450 },
];

const STATUT_STYLE: Record<string, string> = { en_cours: "bg-orange-50 text-orange-700", termine: "bg-green-50 text-green-700", en_attente: "bg-blue-50 text-blue-700", annule: "bg-red-50 text-red-700" };
const STATUT_LABEL: Record<string, string> = { en_cours: "En cours", termine: "Termine", en_attente: "En attente", annule: "Annule" };

export default function AdminDemarches() {
  const [data, setData] = useState(DOSSIERS);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = data.filter((d) => d.client.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase()) || d.ref.toLowerCase().includes(search.toLowerCase()));

  function changeStatut(id: number, s: string) { setData((p) => p.map((d) => d.id === id ? { ...d, statut: s } : d)); setToast("Statut mis a jour"); setTimeout(() => setToast(null), 2000); }
  function remove(id: number) { setData((p) => p.filter((d) => d.id !== id)); setToast("Dossier supprime"); setTimeout(() => setToast(null), 2000); }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Gestion Demarches</h1>
        <p className="mt-1 text-xs text-white/50">{data.length} dossiers</p>
      </div>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2"><CheckCircle size={16} /> {toast}</div>}
      <div className="px-4 mt-3"><div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un dossier..." className="flex-1 text-sm outline-none" /></div></div>
      <div className="px-4 mt-3 space-y-2">
        {filtered.map((d) => {
          const isExp = expanded === d.id;
          return (
            <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : d.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#D4AF37]/10 grid place-items-center shrink-0"><FileText size={16} className="text-[#D4AF37]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111]">{d.type}</p>
                  <p className="text-[9px] text-[#6B7280]">{d.client} · {d.vehicule} · {d.ref}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[7px] font-bold ${STATUT_STYLE[d.statut] || ""}`}>{STATUT_LABEL[d.statut] || d.statut}</span>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 flex items-center gap-1"><Clock size={10} className="text-[#D4AF37]" /><div><p className="text-[7px] text-[#6B7280]">Demande</p><p className="font-bold text-[#111]">{d.dateDemande}</p></div></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 flex items-center gap-1"><User size={10} className="text-[#D4AF37]" /><div><p className="text-[7px] text-[#6B7280]">Montant</p><p className="font-bold text-[#D4AF37]">{d.montant > 0 ? `${d.montant} EUR` : "Gratuit"}</p></div></div>
                  </div>
                  <div className="flex gap-1.5">
                    {d.statut === "en_attente" && <button onClick={() => changeStatut(d.id, "en_cours")} className="flex-1 rounded-lg bg-orange-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Demarrer</button>}
                    {d.statut === "en_cours" && <button onClick={() => changeStatut(d.id, "termine")} className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Terminer</button>}
                    {d.statut !== "termine" && d.statut !== "annule" && <button onClick={() => changeStatut(d.id, "annule")} className="flex-1 rounded-lg bg-amber-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Annuler</button>}
                    <button onClick={() => remove(d.id)} className="flex-1 rounded-lg bg-red-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Supprimer</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
