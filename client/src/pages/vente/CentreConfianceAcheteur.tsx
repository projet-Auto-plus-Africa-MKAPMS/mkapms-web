import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Star, Check, Clock, Users } from "lucide-react";
const INFOS = [
  { label: "Vendeur vérifié", value: "Oui", icon: Shield },
  { label: "Ancienneté", value: "3 ans", icon: Clock },
  { label: "Ventes réalisées", value: "142", icon: Users },
  { label: "Note moyenne", value: "4.8/5", icon: Star },
  { label: "Taux satisfaction", value: "98%", icon: Check },
];
export default function CentreConfianceAcheteur() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Confiance acheteur</h1><p className="mt-1 text-sm text-white/60">Auto Premium — Pro vérifié</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-center"><Shield size={24} className="mx-auto text-green-600" /><p className="text-base font-bold text-green-700 mt-1">Vendeur de confiance</p><div className="flex gap-0.5 justify-center mt-1">{[1,2,3,4,5].map(n => <Star key={n} size={14} className="text-[#D4AF37]" fill="#D4AF37" />)}</div></div>
      <div className="px-4 mt-4 space-y-2">{INFOS.map(info => { const Icon = info.icon; return (
        <div key={info.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          <Icon size={14} className="text-[#D4AF37]" /><span className="flex-1 text-sm text-[#6B7280]">{info.label}</span><span className="text-sm font-bold text-[#111]">{info.value}</span>
        </div>); })}</div>
    </div>
  );
}
