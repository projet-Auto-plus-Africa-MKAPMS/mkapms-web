import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Home, ChevronDown, Eye, Edit3, Trash2, CheckCircle, Ban, AlertTriangle, Search, Calendar, MapPin, User } from "lucide-react";
import { DocumentView, buildContratData } from "../../components/DocumentPDF";

const LOCATIONS = [
  { id: 1, vehicule: "Renault Clio V", client: "Martin D.", debut: "10/06/2026", fin: "17/06/2026", prix: 280, ville: "Paris", statut: "en_cours", photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=200&h=120&fit=crop" },
  { id: 2, vehicule: "Peugeot 3008", client: "Sophie L.", debut: "15/06/2026", fin: "22/06/2026", prix: 420, ville: "Lyon", statut: "reservee", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=200&h=120&fit=crop" },
  { id: 3, vehicule: "Citroen C3", client: "Ahmed K.", debut: "01/06/2026", fin: "08/06/2026", prix: 210, ville: "Marseille", statut: "terminee", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=200&h=120&fit=crop" },
  { id: 4, vehicule: "BMW Serie 1", client: "Julie P.", debut: "20/06/2026", fin: "30/06/2026", prix: 650, ville: "Bordeaux", statut: "reservee", photo: "https://images.unsplash.com/photo-1606611013016-969c19ba27f5?w=200&h=120&fit=crop" },
  { id: 5, vehicule: "Dacia Sandero", client: "Pierre M.", debut: "05/06/2026", fin: "06/06/2026", prix: 35, ville: "Toulouse", statut: "annulee", photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=200&h=120&fit=crop" },
];

const STATUT_STYLE: Record<string, string> = { en_cours: "bg-green-50 text-green-700", reservee: "bg-blue-50 text-blue-700", terminee: "bg-slate-100 text-slate-600", annulee: "bg-red-50 text-red-700" };
const STATUT_LABEL: Record<string, string> = { en_cours: "En cours", reservee: "Reservee", terminee: "Terminee", annulee: "Annulee" };

export default function AdminLocation() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState(LOCATIONS);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; action: "supprimer" | "annuler" } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewContrat, setViewContrat] = useState<typeof LOCATIONS[0] | null>(null);

  const filtered = data.filter((l) => l.vehicule.toLowerCase().includes(search.toLowerCase()) || l.client.toLowerCase().includes(search.toLowerCase()));

  function doAction() {
    if (!confirm) return;
    if (confirm.action === "supprimer") setData((p) => p.filter((l) => l.id !== confirm.id));
    else setData((p) => p.map((l) => l.id === confirm.id ? { ...l, statut: "annulee" } : l));
    setToast(confirm.action === "supprimer" ? "Location supprimee" : "Location annulee");
    setConfirm(null);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Home size={20} className="text-[#D4AF37]" /> Gestion Location</h1>
        <p className="mt-1 text-xs text-white/50">{data.length} contrats</p>
      </div>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2"><CheckCircle size={16} /> {toast}</div>}
      <div className="px-4 mt-4 grid grid-cols-4 gap-2">
        {[
          { l: "Total", v: String(data.length), c: "text-[#D4AF37]" },
          { l: "En cours", v: String(data.filter((l) => l.statut === "en_cours").length), c: "text-green-500" },
          { l: "Reservees", v: String(data.filter((l) => l.statut === "reservee").length), c: "text-blue-500" },
          { l: "Annulees", v: String(data.filter((l) => l.statut === "annulee").length), c: "text-red-500" },
        ].map((s) => (<div key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-center"><p className={`text-lg font-black ${s.c}`}>{s.v}</p><p className="text-[8px] text-[#6B7280]">{s.l}</p></div>))}
      </div>
      <div className="px-4 mt-3"><div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="flex-1 text-sm outline-none" /></div></div>
      <div className="px-4 mt-3 space-y-2">
        {filtered.map((l) => {
          const isExp = expanded === l.id;
          return (
            <div key={l.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : l.id)} className="w-full text-left p-2 flex items-center gap-2.5">
                <img src={l.photo} alt={l.vehicule} className="w-16 h-12 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111] truncate">{l.vehicule}</p>
                  <p className="text-[9px] text-[#6B7280]">{l.client} · {l.ville}</p>
                  <p className="text-xs font-black text-[#D4AF37]">{l.prix} EUR</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[7px] font-bold ${STATUT_STYLE[l.statut] || ""}`}>{STATUT_LABEL[l.statut] || l.statut}</span>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 flex items-center gap-1"><Calendar size={10} className="text-[#D4AF37]" /><div><p className="text-[7px] text-[#6B7280]">Debut</p><p className="font-bold text-[#111]">{l.debut}</p></div></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 flex items-center gap-1"><Calendar size={10} className="text-[#D4AF37]" /><div><p className="text-[7px] text-[#6B7280]">Fin</p><p className="font-bold text-[#111]">{l.fin}</p></div></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 flex items-center gap-1"><User size={10} className="text-[#D4AF37]" /><div><p className="text-[7px] text-[#6B7280]">Client</p><p className="font-bold text-[#111]">{l.client}</p></div></div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setViewContrat(l)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Eye size={12} /> Contrat PDF</button>
                    {l.statut !== "annulee" && l.statut !== "terminee" && (
                      <button onClick={() => setConfirm({ id: l.id, action: "annuler" })} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-amber-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Ban size={12} /> Annuler</button>
                    )}
                    <button onClick={() => setConfirm({ id: l.id, action: "supprimer" })} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Trash2 size={12} /> Supprimer</button>
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
            <div className={`mx-auto h-14 w-14 rounded-full grid place-items-center mb-3 ${confirm.action === "supprimer" ? "bg-red-50" : "bg-amber-50"}`}>
              {confirm.action === "supprimer" ? <Trash2 size={24} className="text-red-500" /> : <Ban size={24} className="text-amber-500" />}
            </div>
            <h3 className="text-sm font-bold text-[#111]">{confirm.action === "supprimer" ? "Supprimer cette location ?" : "Annuler cette location ?"}</h3>
            {confirm.action === "supprimer" && <p className="text-[10px] text-red-500 mt-2 font-semibold flex items-center justify-center gap-1"><AlertTriangle size={12} /> Action irreversible</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirm(null)} className="flex-1 rounded-xl border border-[#E5E7EB] py-2.5 text-xs font-bold text-[#6B7280]">Annuler</button>
              <button onClick={doAction} className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white ${confirm.action === "supprimer" ? "bg-red-500" : "bg-amber-500"}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
      {viewContrat && (
        <DocumentView
          doc={buildContratData({ vehicule: viewContrat.vehicule, client: viewContrat.client, type: "Location", duree: `Du ${viewContrat.debut} au ${viewContrat.fin}`, prix: `${viewContrat.prix} EUR`, ref: `LOC-${viewContrat.id}` })}
          onClose={() => setViewContrat(null)}
        />
      )}
    </div>
  );
}
