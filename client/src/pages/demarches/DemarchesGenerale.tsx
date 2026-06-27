import { Link } from "react-router-dom";
import { FileText, Users, Shield, Car, Copy, MapPin, Globe, Layers, Key, Award, Phone, Star, ChevronRight } from "lucide-react";
const SERVICES = [
  { label: "Carte grise", icon: FileText, to: "/demarches/carte-grise", color: "bg-[#D4AF37]" },
  { label: "Changement titulaire", icon: Users, to: "/demarches/changement-titulaire", color: "bg-blue-600" },
  { label: "Déclaration cession", icon: Shield, to: "/demarches/cession", color: "bg-green-600" },
  { label: "Immatriculation provisoire", icon: Car, to: "/demarches/immatriculation-provisoire", color: "bg-purple-600" },
  { label: "WW Garage", icon: Key, to: "/demarches/ww-garage", color: "bg-gray-700" },
  { label: "Duplicata", icon: Copy, to: "/demarches/duplicata", color: "bg-orange-600" },
  { label: "Changement adresse", icon: MapPin, to: "/demarches/changement-adresse", color: "bg-cyan-600" },
  { label: "Véhicule importé", icon: Globe, to: "/demarches/importation", color: "bg-red-600" },
  { label: "Succession", icon: Layers, to: "/demarches/succession", color: "bg-indigo-600" },
  { label: "Plaques", icon: Award, to: "/demarches/plaques", color: "bg-pink-600" },
];
export default function DemarchesGenerale() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><FileText size={22} className="text-[#D4AF37]" /> Démarches <span className="text-[#D4AF37]">MKA.P-MS</span></h1>
        <p className="mt-1 text-sm text-white/60">Carte grise · Cession · Import · Plaques · Duplicata</p>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-white/40"><Phone size={10} /> 99 70 70 50 50 · 7/7 de 8h à 20h</div>
      </div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-2 gap-2">{SERVICES.map(s => { const Icon = s.icon; return (
        <Link key={s.label} to={s.to} className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center active:scale-[0.98] transition shadow-sm">
          <div className={`flex h-10 w-10 mx-auto items-center justify-center rounded-lg ${s.color}`}><Icon size={18} className="text-white" /></div>
          <p className="text-xs font-bold text-[#111] mt-2">{s.label}</p>
        </Link>); })}</div>
      <div className="mx-4 mt-6 rounded-xl bg-[#111] p-4 text-center"><p className="text-sm font-bold text-white">Besoin d'aide ?</p><p className="text-xs text-[#D4AF37] mt-1 font-semibold">99 70 70 50 50 · 7/7 de 8h à 20h</p></div>
    </div>
  );
}
