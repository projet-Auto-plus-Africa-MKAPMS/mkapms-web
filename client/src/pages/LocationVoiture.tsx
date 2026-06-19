import { Link } from "react-router-dom";
import { Search, Home, ChevronRight } from "lucide-react";
import MetaSEO from "../components/MetaSEO";

const TYPES = [
  { label: "Location particulier", to: "/location-particulier", desc: "Citadines, berlines, SUV pour vos trajets" },
  { label: "Location professionnelle", to: "/location-pro", desc: "Flottes, longue durée, entreprises" },
  { label: "Location VTC / Taxi", to: "/vtc-taxi", desc: "Véhicules adaptés VTC et Taxi" },
];

export default function LocationVoiture() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <MetaSEO title="Location voiture" description="Louez une voiture sur MKA.P-MS. Location particulier, professionnelle, VTC/Taxi. Réservation en ligne, assurance incluse." url="https://mkapms.com/location-voiture" />
      <div className="bg-[#3B82F6] px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Home size={20} /> Location voiture</h1>
        <p className="mt-1 text-sm text-white/80">Particulier · Professionnel · VTC / Taxi</p>
      </div>
      <div className="px-4 mt-4 space-y-2">{TYPES.map(t => (
        <Link key={t.label} to={t.to} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm active:scale-[0.99]">
          <div className="flex-1"><p className="text-sm font-bold text-[#111]">{t.label}</p><p className="text-[10px] text-[#6B7280]">{t.desc}</p></div><ChevronRight size={14} className="text-red-500" />
        </Link>
      ))}</div>
    </div>
  );
}
