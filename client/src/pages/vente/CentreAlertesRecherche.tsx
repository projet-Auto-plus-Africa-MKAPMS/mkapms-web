import { Link } from "react-router-dom";
import { ChevronLeft, Bell, Plus, Trash2, Check } from "lucide-react";
const ALERTES = [
  { recherche: "BMW X5 < 25 000 €", resultats: 3, active: true },
  { recherche: "Peugeot 3008 diesel auto", resultats: 8, active: true },
  { recherche: "Mercedes GLC < 30 000 km", resultats: 1, active: false },
];
export default function CentreAlertesRecherche() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Bell size={20} className="text-[#D4AF37]" /> Alertes recherche</h1></div>
      <div className="px-4 mt-4 space-y-2">{ALERTES.map(a => (
        <div key={a.recherche} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
          <Bell size={14} className={a.active ? "text-[#D4AF37]" : "text-[#9CA3AF]"} />
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{a.recherche}</h3><p className="text-[9px] text-[#6B7280]">{a.resultats} résultats · {a.active ? "Active" : "Désactivée"}</p></div>
          <Trash2 size={14} className="text-[#9CA3AF]" />
        </div>))}</div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <h3 className="text-sm font-bold text-[#111] mb-2">Nouvelle alerte</h3>
        <input type="text" placeholder="Ex: BMW X5 moins de 25 000 €" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm mb-2" />
        <button className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white active:scale-[0.98] flex items-center justify-center gap-2"><Plus size={14} /> Créer l'alerte</button>
      </div>
    </div>
  );
}
