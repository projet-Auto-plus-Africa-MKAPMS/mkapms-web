import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Truck, ChevronDown, Eye, Trash2, CheckCircle, Ban, Search, Phone, MapPin, Clock } from "lucide-react";

const INTERVENTIONS = [
  { id: 1, client: "Martin D.", tel: "06 12 34 56 78", lieu: "A6 km 42, Evry", vehicule: "Peugeot 308", panne: "Pneu crevé", depanneur: "Flash Depannage", statut: "en_route", heure: "14:30" },
  { id: 2, client: "Sophie L.", tel: "06 23 45 67 89", lieu: "Rue de la Paix, Lyon", vehicule: "Renault Clio", panne: "Batterie HS", depanneur: "SOS Auto Lyon", statut: "termine", heure: "09:15" },
  { id: 3, client: "Ahmed K.", tel: "06 34 56 78 90", lieu: "Bd Michelet, Marseille", vehicule: "BMW 320d", panne: "Moteur ne demarre pas", depanneur: "—", statut: "en_attente", heure: "16:00" },
  { id: 4, client: "Julie P.", tel: "06 45 67 89 01", lieu: "Rocade Bordeaux sortie 4", vehicule: "Audi A3", panne: "Accident léger", depanneur: "Rapid Dep 33", statut: "en_route", heure: "11:45" },
];

const STATUT_STYLE: Record<string, string> = { en_route: "bg-orange-50 text-orange-700", termine: "bg-green-50 text-green-700", en_attente: "bg-blue-50 text-blue-700", annule: "bg-red-50 text-red-700" };
const STATUT_LABEL: Record<string, string> = { en_route: "En route", termine: "Termine", en_attente: "En attente", annule: "Annule" };

export default function AdminDepannage() {
  const [data, setData] = useState(INTERVENTIONS);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function remove(id: number) { setData((p) => p.filter((i) => i.id !== id)); setToast("Supprime"); setTimeout(() => setToast(null), 2000); }
  function changeStatut(id: number, s: string) { setData((p) => p.map((i) => i.id === id ? { ...i, statut: s } : i)); setToast("Statut mis a jour"); setTimeout(() => setToast(null), 2000); }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} className="text-[#D4AF37]" /> Gestion Depannage</h1>
        <p className="mt-1 text-xs text-white/50">{data.length} interventions</p>
      </div>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2"><CheckCircle size={16} /> {toast}</div>}
      <div className="px-4 mt-4 space-y-2">
        {data.map((i) => {
          const isExp = expanded === i.id;
          return (
            <div key={i.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : i.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#D4AF37]/10 grid place-items-center shrink-0"><Truck size={16} className="text-[#D4AF37]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111]">{i.client} — {i.vehicule}</p>
                  <p className="text-[9px] text-[#6B7280]">{i.panne} · {i.heure}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[7px] font-bold ${STATUT_STYLE[i.statut] || ""}`}>{STATUT_LABEL[i.statut] || i.statut}</span>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.lieu)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#F5F3EF] p-1.5 flex items-center gap-1 active:bg-[#E5E7EB] transition"><MapPin size={10} className="text-[#D4AF37]" /><p className="font-bold text-[#111] text-[9px]">{i.lieu}</p></a>
                    <a href={`tel:${i.tel.replace(/ /g, "")}`} className="rounded-lg bg-[#F5F3EF] p-1.5 flex items-center gap-1 active:bg-[#E5E7EB] transition"><Phone size={10} className="text-[#D4AF37]" /><p className="font-bold text-[#111] text-[9px]">{i.tel}</p></a>
                  </div>
                  <p className="text-[9px] text-[#6B7280]">Depanneur : <span className="font-bold text-[#111]">{i.depanneur}</span></p>
                  <div className="flex gap-1.5">
                    {i.statut === "en_attente" && <button onClick={() => changeStatut(i.id, "en_route")} className="flex-1 rounded-lg bg-orange-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Envoyer depanneur</button>}
                    {i.statut === "en_route" && <button onClick={() => changeStatut(i.id, "termine")} className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Terminer</button>}
                    {i.statut !== "annule" && i.statut !== "termine" && <button onClick={() => changeStatut(i.id, "annule")} className="flex-1 rounded-lg bg-amber-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Annuler</button>}
                    <button onClick={() => remove(i.id)} className="flex-1 rounded-lg bg-red-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Supprimer</button>
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
