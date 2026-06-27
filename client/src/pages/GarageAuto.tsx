import { Link } from "react-router-dom";
import { Search, Wrench, ChevronRight, Star, MapPin } from "lucide-react";
import MetaSEO from "../components/MetaSEO";

const SERVICES = [
  { label: "Réparation", to: "/garage" }, { label: "Entretien", to: "/garage" },
  { label: "Contrôle technique", to: "/garage" }, { label: "Carrosserie", to: "/garage" },
  { label: "Pneumatiques", to: "/garage" }, { label: "Dépannage", to: "/depannage" },
];

export default function GarageAuto() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <MetaSEO title="Garage auto" description="Trouvez un garage auto sur MKA.P-MS. Réparation, entretien, contrôle technique, carrosserie, pneumatiques. Garages vérifiés et notés." url="https://mkapms.com/garage-auto" />
      <div className="bg-[#F59E0B] px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} /> Garage auto</h1>
        <p className="mt-1 text-sm text-white/80">Garages vérifiés · Devis en ligne · Suivi temps réel</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="Ville, code postal…" className="w-full bg-transparent text-sm outline-none" /></div>
      </div>
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">{SERVICES.map(s => (
        <Link key={s.label} to={s.to} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm active:scale-[0.98]">
          <p className="text-sm font-bold text-[#111]">{s.label}</p>
        </Link>
      ))}</div>
    </div>
  );
}
