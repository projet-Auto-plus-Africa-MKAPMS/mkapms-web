import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Wrench, ChevronDown, Eye, Trash2, CheckCircle, Ban, AlertTriangle, Search, Clock, User, Car } from "lucide-react";

const INTERVENTIONS = [
  { id: 1, vehicule: "BMW X3 30d", client: "Martin D.", type: "Revision complete", statut: "en_cours", mecanicien: "Karim M.", dateEntree: "08/06/2026", dateSortie: "11/06/2026", montant: 850 },
  { id: 2, vehicule: "Peugeot 308 HDi", client: "Sophie L.", type: "Freins AV+AR", statut: "termine", mecanicien: "Omar L.", dateEntree: "05/06/2026", dateSortie: "06/06/2026", montant: 420 },
  { id: 3, vehicule: "Renault Megane", client: "Ahmed K.", type: "Distribution", statut: "en_attente", mecanicien: "Karim M.", dateEntree: "10/06/2026", dateSortie: "14/06/2026", montant: 1200 },
  { id: 4, vehicule: "Audi A4 2.0 TDI", client: "Julie P.", type: "Climatisation", statut: "en_cours", mecanicien: "Omar L.", dateEntree: "09/06/2026", dateSortie: "10/06/2026", montant: 380 },
  { id: 5, vehicule: "Citroen C4", client: "Pierre M.", type: "Embrayage", statut: "annule", mecanicien: "—", dateEntree: "07/06/2026", dateSortie: "—", montant: 0 },
];

const STATUT_STYLE: Record<string, string> = { en_cours: "bg-orange-50 text-orange-700", termine: "bg-green-50 text-green-700", en_attente: "bg-blue-50 text-blue-700", annule: "bg-red-50 text-red-700" };
const STATUT_LABEL: Record<string, string> = { en_cours: "En cours", termine: "Termine", en_attente: "En attente", annule: "Annule" };

export default function AdminGarage() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState(INTERVENTIONS);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; action: "supprimer" | "annuler" | "terminer" } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = data.filter((i) => i.vehicule.toLowerCase().includes(search.toLowerCase()) || i.client.toLowerCase().includes(search.toLowerCase()));

  function doAction() {
    if (!confirm) return;
    if (confirm.action === "supprimer") setData((p) => p.filter((i) => i.id !== confirm.id));
    else setData((p) => p.map((i) => i.id === confirm.id ? { ...i, statut: confirm.action === "annuler" ? "annule" : "termine" } : i));
    setToast(confirm.action === "supprimer" ? "Intervention supprimee" : confirm.action === "annuler" ? "Intervention annulee" : "Intervention terminee");
    setConfirm(null);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} className="text-[#D4AF37]" /> Gestion Garage</h1>
        <p className="mt-1 text-xs text-white/50">{data.length} interventions</p>
      </div>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2"><CheckCircle size={16} /> {toast}</div>}
      <div className="px-4 mt-4 grid grid-cols-4 gap-2">
        {[
          { l: "Total", v: String(data.length), c: "text-[#D4AF37]" },
          { l: "En cours", v: String(data.filter((i) => i.statut === "en_cours").length), c: "text-orange-500" },
          { l: "En attente", v: String(data.filter((i) => i.statut === "en_attente").length), c: "text-blue-500" },
          { l: "Termines", v: String(data.filter((i) => i.statut === "termine").length), c: "text-green-500" },
        ].map((s) => (<div key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-center"><p className={`text-lg font-black ${s.c}`}>{s.v}</p><p className="text-[8px] text-[#6B7280]">{s.l}</p></div>))}
      </div>
      <div className="px-4 mt-3"><div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="flex-1 text-sm outline-none" /></div></div>
      <div className="px-4 mt-3 space-y-2">
        {filtered.map((i) => {
          const isExp = expanded === i.id;
          return (
            <div key={i.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : i.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#D4AF37]/10 grid place-items-center shrink-0"><Car size={16} className="text-[#D4AF37]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111] truncate">{i.vehicule}</p>
                  <p className="text-[9px] text-[#6B7280]">{i.type} · {i.client}</p>
                  {i.montant > 0 && <p className="text-xs font-black text-[#D4AF37]">{i.montant} EUR</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[7px] font-bold ${STATUT_STYLE[i.statut] || ""}`}>{STATUT_LABEL[i.statut] || i.statut}</span>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 flex items-center gap-1"><User size={10} className="text-[#D4AF37]" /><div><p className="text-[7px] text-[#6B7280]">Mecanicien</p><p className="font-bold text-[#111]">{i.mecanicien}</p></div></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 flex items-center gap-1"><Clock size={10} className="text-[#D4AF37]" /><div><p className="text-[7px] text-[#6B7280]">Entree</p><p className="font-bold text-[#111]">{i.dateEntree}</p></div></div>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Eye size={12} /> Details</button>
                    {i.statut === "en_cours" && <button onClick={() => setConfirm({ id: i.id, action: "terminer" })} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><CheckCircle size={12} /> Terminer</button>}
                    {(i.statut === "en_cours" || i.statut === "en_attente") && <button onClick={() => setConfirm({ id: i.id, action: "annuler" })} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-amber-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Ban size={12} /> Annuler</button>}
                    <button onClick={() => setConfirm({ id: i.id, action: "supprimer" })} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Trash2 size={12} /> Supprimer</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setConfirm(null)}>
          <div className="w-[85%] max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-[#111]">{confirm.action === "supprimer" ? "Supprimer ?" : confirm.action === "annuler" ? "Annuler ?" : "Marquer comme termine ?"}</h3>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirm(null)} className="flex-1 rounded-xl border border-[#E5E7EB] py-2.5 text-xs font-bold text-[#6B7280]">Non</button>
              <button onClick={doAction} className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white ${confirm.action === "supprimer" ? "bg-red-500" : confirm.action === "annuler" ? "bg-amber-500" : "bg-green-500"}`}>Oui</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
