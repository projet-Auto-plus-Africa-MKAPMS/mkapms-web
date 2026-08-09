import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bike } from "lucide-react";
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

const CYLINDREES = ["50", "125", "250", "400", "500", "650", "750", "900", "1000", "1300"];
const ANNEES = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i));

export default function MotoOccasion() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [marque, setMarque] = useState("");
  const [categorie, setCategorie] = useState("");
  const [cyl, setCyl] = useState("");
  const [annee, setAnnee] = useState("");
  const [kmMax, setKmMax] = useState("");
  const [prixMax, setPrixMax] = useState("");

  // Les résultats motos vivent sur /vente-moto : cette page d'entrée transmet
  // les critères au lieu d'afficher une liste inventée.
  function rechercher() {
    const p = new URLSearchParams();
    const texte = [q, marque].filter(Boolean).join(" ").trim();
    if (texte) p.set("q", texte);
    if (categorie) p.set("categorie", categorie);
    if (cyl) p.set("cylindree", cyl);
    if (annee) p.set("anneeMin", annee);
    if (kmMax) p.set("kmMax", kmMax);
    if (prixMax) p.set("prixMax", prixMax);
    navigate(`/vente-moto${p.toString() ? `?${p}` : ""}`);
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <MetaSEO title="Moto occasion" description="Achetez votre moto d'occasion sur MKA.P-MS. 21 catégories : Roadster, Sportive, Trail, Custom, Scooter, 125cc. 30+ marques. Photos et prix vérifiés." url="https://mkapms.com/moto-occasion" />
      <div className="bg-red-600 px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Bike size={20} /> Moto occasion</h1>
        <p className="mt-1 text-sm text-white/80">21 catégories · 30+ marques · Toutes cylindrées</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && rechercher()}
            placeholder="Marque, modèle, cylindrée…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select value={marque} onChange={(e) => setMarque(e.target.value)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
            <option value="">Toutes les marques</option>
            {MARQUES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map((c) => <option key={c.label} value={c.label}>{c.label}</option>)}
          </select>
          <select value={cyl} onChange={(e) => setCyl(e.target.value)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
            <option value="">Toutes cylindrées</option>
            {CYLINDREES.map((c) => <option key={c} value={c}>Jusqu'à {c} cm³</option>)}
          </select>
          <select value={annee} onChange={(e) => setAnnee(e.target.value)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
            <option value="">Toutes les années</option>
            {ANNEES.map((a) => <option key={a} value={a}>À partir de {a}</option>)}
          </select>
          <select value={kmMax} onChange={(e) => setKmMax(e.target.value)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
            <option value="">Kilométrage : sans limite</option>
            <option value="10000">Jusqu'à 10 000 km</option>
            <option value="20000">Jusqu'à 20 000 km</option>
            <option value="50000">Jusqu'à 50 000 km</option>
            <option value="100000">Jusqu'à 100 000 km</option>
          </select>
          <input
            type="number"
            value={prixMax}
            onChange={(e) => setPrixMax(e.target.value)}
            placeholder="Prix max (€)"
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
          />
        </div>
        <button
          type="button"
          onClick={rechercher}
          className="mt-2 w-full rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white active:scale-[0.98] transition"
        >
          Rechercher
        </button>
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
