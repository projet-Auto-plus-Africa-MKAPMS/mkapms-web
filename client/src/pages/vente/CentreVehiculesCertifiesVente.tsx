import { Link } from "react-router-dom";
import { ChevronLeft, Star, Check, Shield } from "lucide-react";
const CONDITIONS = ["Contrôle complet 150 points", "Historique vérifié", "Documents certifiés", "Entretien à jour", "Kilométrage garanti", "Photos certifiées"];
const CERTIFIES = [
  { nom: "BMW X5 xDrive 30d", prix: "42 000 €", score: 148, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&h=130&fit=crop" },
  { nom: "Mercedes GLC 300", prix: "38 500 €", score: 145, photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=200&h=130&fit=crop" },
];
export default function CentreVehiculesCertifiesVente() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Star size={20} className="text-[#D4AF37]" /> Véhicules certifiés</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3"><h3 className="text-sm font-bold text-[#111]">⭐ Badge Certifié MKA.P-MS</h3>{CONDITIONS.map(c => (<div key={c} className="flex items-center gap-2 mt-1"><Check size={10} className="text-[#D4AF37]" /><span className="text-xs text-[#6B7280]">{c}</span></div>))}</div>
      <div className="px-4 mt-4 space-y-2">{CERTIFIES.map(v => (
        <div key={v.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden flex"><img src={v.photo} alt="" className="w-24 h-20 object-cover" /><div className="flex-1 p-3"><div className="flex items-center gap-1"><Star size={10} className="text-[#D4AF37]" /><span className="text-[8px] font-bold text-[#D4AF37]">{v.score}/150</span></div><h3 className="text-sm font-bold text-[#111]">{v.nom}</h3><p className="text-sm font-black text-[#D4AF37]">{v.prix}</p></div></div>))}</div>
    </div>
  );
}
