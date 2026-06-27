import { Link } from "react-router-dom";
import { Search, Bike, ChevronRight } from "lucide-react";
import MetaSEO from "../components/MetaSEO";

const CATEGORIES = [
  { label: "Roadster", count: 850 }, { label: "Sportive", count: 620 }, { label: "Trail", count: 540 },
  { label: "Adventure", count: 380 }, { label: "Custom", count: 420 }, { label: "Cruiser", count: 280 },
  { label: "Touring", count: 190 }, { label: "Naked", count: 710 }, { label: "Café Racer", count: 150 },
  { label: "Scrambler", count: 120 }, { label: "Enduro", count: 340 }, { label: "Supermotard", count: 210 },
  { label: "Cross", count: 280 }, { label: "Trial", count: 90 }, { label: "Scooter", count: 980 },
  { label: "Scooter GT", count: 320 }, { label: "125 cm³", count: 1200 }, { label: "50 cm³", count: 450 },
  { label: "Électrique", count: 80 }, { label: "3 roues", count: 60 }, { label: "Quad", count: 240 },
];

const MARQUES = ["Honda", "Yamaha", "Kawasaki", "Suzuki", "BMW", "KTM", "Ducati", "Harley-Davidson", "Triumph", "Aprilia"];

export default function MotoOccasion() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <MetaSEO title="Moto occasion" description="Achetez votre moto d'occasion sur MKA.P-MS. 21 catégories : Roadster, Sportive, Trail, Custom, Scooter, 125cc. 30+ marques. Photos et prix vérifiés." url="https://mkapms.com/moto-occasion" />
      <div className="bg-red-600 px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Bike size={20} /> Moto occasion</h1>
        <p className="mt-1 text-sm text-white/80">21 catégories · 30+ marques · Toutes cylindrées</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="Marque, modèle, cylindrée…" className="w-full bg-transparent text-sm outline-none" /></div>
      </div>
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Par catégorie ({CATEGORIES.length})</h2>
        <div className="mt-3 grid grid-cols-2 gap-1.5">{CATEGORIES.map(c => (
          <Link key={c.label} to="/vente-moto" className="flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5 shadow-sm active:scale-[0.98]">
            <span className="text-xs font-bold text-[#111]">{c.label}</span><span className="text-[9px] font-bold text-red-600">{c.count}</span>
          </Link>
        ))}</div>
      </div>
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Par marque</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">{MARQUES.map(m => (
          <Link key={m} to="/vente-moto" className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[10px] font-bold text-[#111] active:bg-red-600 active:text-white">{m}</Link>
        ))}</div>
      </div>
    </div>
  );
}
