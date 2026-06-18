import { Link } from "react-router-dom";
import { ChevronLeft, Users, Search, ChevronRight, Star } from "lucide-react";
const CLIENTS = [
  { nom: "Marie L.", achats: 2, reservations: 1, dernierContact: "15/03" },
  { nom: "Jean D.", achats: 1, reservations: 0, dernierContact: "10/03" },
  { nom: "SAS Logistique+", achats: 5, reservations: 2, dernierContact: "14/03" },
  { nom: "Ahmed B.", achats: 0, reservations: 1, dernierContact: "12/03" },
];
export default function CentreClientsVente() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} /> Centre Clients</h1></div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-0"><div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="Rechercher un client…" className="w-full bg-transparent text-sm outline-none" /></div></div>
      <div className="px-4 mt-3 space-y-2">{CLIENTS.map(c => (
        <div key={c.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">{c.nom[0]}</div>
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{c.nom}</h3><p className="text-[9px] text-[#6B7280]">{c.achats} achats · {c.reservations} réserv. · Dernier: {c.dernierContact}</p></div>
          <ChevronRight size={14} className="text-[#D4D4D4]" />
        </div>))}</div>
    </div>
  );
}
