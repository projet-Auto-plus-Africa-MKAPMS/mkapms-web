import { Link } from "react-router-dom";
import { ChevronLeft, Star, MessageSquare } from "lucide-react";
const CRITERES = ["Accueil", "Réactivité", "Description véhicule", "Respect délais", "Livraison", "Satisfaction globale"];
const AVIS = [
  { client: "Marie L.", note: 5, texte: "Excellent ! Véhicule conforme, livraison rapide.", date: "15/03" },
  { client: "Jean D.", note: 4, texte: "Bon véhicule, petite attente à la livraison.", date: "10/03" },
  { client: "SAS Logistique+", note: 5, texte: "Professionnel sérieux, je recommande.", date: "05/03" },
];
export default function AvisVendeurs() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Star size={20} /> Avis Vendeurs</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 text-center"><p className="text-3xl font-black text-[#D4AF37]">4.8</p><div className="flex gap-0.5 justify-center mt-1">{[1,2,3,4,5].map(n => <Star key={n} size={14} className="text-[#D4AF37]" fill="#D4AF37" />)}</div><p className="text-xs text-[#6B7280] mt-1">{AVIS.length} avis · 6 critères</p></div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-3 space-y-1">{CRITERES.map(c => (<div key={c} className="flex items-center justify-between"><span className="text-xs text-[#6B7280]">{c}</span><div className="flex gap-0.5">{[1,2,3,4,5].map(n => <Star key={n} size={10} className="text-[#D4AF37]" fill="#D4AF37" />)}</div></div>))}</div>
      <div className="px-4 mt-4 space-y-2">{AVIS.map((a, i) => (<div key={i} className="rounded-xl bg-white border border-[#E5E7EB] p-4"><div className="flex justify-between"><span className="text-sm font-bold text-[#111]">{a.client}</span><div className="flex gap-0.5">{Array.from({length: a.note}, (_, n) => <Star key={n} size={10} className="text-[#D4AF37]" fill="#D4AF37" />)}</div></div><p className="text-xs text-[#6B7280] mt-1">{a.texte}</p><p className="text-[9px] text-red-500 mt-1">{a.date}</p></div>))}</div>
    </div>
  );
}
