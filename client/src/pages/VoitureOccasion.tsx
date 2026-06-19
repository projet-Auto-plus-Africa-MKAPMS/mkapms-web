import { Link } from "react-router-dom";
import { Search, Car, ChevronRight, Star, Shield, MapPin } from "lucide-react";
import MetaSEO from "../components/MetaSEO";

const MARQUES = [
  { nom: "Peugeot", modeles: "208, 308, 3008, 5008", count: 1250 },
  { nom: "Renault", modeles: "Clio, Captur, Mégane, Arkana", count: 1180 },
  { nom: "Citroën", modeles: "C3, C4, C5 Aircross", count: 890 },
  { nom: "Volkswagen", modeles: "Golf, Polo, Tiguan, T-Roc", count: 750 },
  { nom: "BMW", modeles: "Série 1, 3, X1, X3", count: 620 },
  { nom: "Mercedes", modeles: "Classe A, C, GLA, GLC", count: 580 },
  { nom: "Audi", modeles: "A3, A4, Q3, Q5", count: 520 },
  { nom: "Toyota", modeles: "Yaris, C-HR, RAV4, Corolla", count: 480 },
  { nom: "Ford", modeles: "Fiesta, Focus, Puma, Kuga", count: 420 },
  { nom: "Dacia", modeles: "Sandero, Duster, Jogger", count: 380 },
];

const CATEGORIES = [
  { label: "Citadines", to: "/vente-particulier", count: 3200 },
  { label: "SUV & 4x4", to: "/vente-particulier", count: 2800 },
  { label: "Berlines", to: "/vente-particulier", count: 1900 },
  { label: "Breaks", to: "/vente-particulier", count: 850 },
  { label: "Monospaces", to: "/vente-particulier", count: 620 },
  { label: "Cabriolets", to: "/vente-particulier", count: 340 },
  { label: "Utilitaires", to: "/vente-utilitaires", count: 1100 },
  { label: "Camions", to: "/vente-camions", count: 280 },
];

export default function VoitureOccasion() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <MetaSEO title="Voiture occasion" description="Achetez votre voiture d'occasion sur MKA.P-MS. Des milliers d'annonces vérifiées : Peugeot, Renault, BMW, Mercedes, Audi. Prix, photos, historique." url="https://mkapms.com/voiture-occasion" />
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} className="text-[#D4AF37]" /> Voiture occasion</h1>
        <p className="mt-1 text-sm text-white/60">Des milliers d'annonces vérifiées sur MKA.P-MS</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="Marque, modèle, ville…" className="w-full bg-transparent text-sm outline-none" /></div>
      </div>
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Par marque</h2>
        <div className="mt-3 space-y-1.5">{MARQUES.map(m => (
          <Link key={m.nom} to="/vente-particulier" className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm active:scale-[0.99]">
            <div className="flex-1"><p className="text-sm font-bold text-[#111]">{m.nom}</p><p className="text-[9px] text-[#6B7280]">{m.modeles}</p></div>
            <span className="text-[10px] font-bold text-[#D4AF37]">{m.count.toLocaleString("fr-FR")}</span><ChevronRight size={16} className="text-red-500" />
          </Link>
        ))}</div>
      </div>
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Par catégorie</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">{CATEGORIES.map(c => (
          <Link key={c.label} to={c.to} className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm text-center active:scale-[0.98]">
            <p className="text-sm font-bold text-[#111]">{c.label}</p><p className="text-[10px] text-[#D4AF37] font-bold">{c.count.toLocaleString("fr-FR")} annonces</p>
          </Link>
        ))}</div>
      </div>
    </div>
  );
}
