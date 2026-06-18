import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, Bike, Star, Heart, MapPin, Filter, ChevronDown, ChevronRight, Shield, SlidersHorizontal } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE MOTO — Univers complet
   TOUTES les catégories moto : Roadster, Sportive, Trail, Custom, Naked,
   Café Racer, Scrambler, Adventure, Touring, Cruiser, Enduro, Supermotard,
   Cross, Trial, Quad, Scooter, Scooter GT, 125 cm³, 50 cm³, Électrique, 3 roues
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES_MOTO = [
  { label: "Roadster", desc: "MT-07, CB500F, Z650, Street Triple", photo: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop" },
  { label: "Sportive", desc: "Ninja ZX-6R, CBR600RR, R6, Panigale", photo: "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=300&h=200&fit=crop" },
  { label: "Trail", desc: "R1250GS, Africa Twin, Ténéré 700", photo: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&h=200&fit=crop" },
  { label: "Adventure", desc: "Multistrada, Tiger, Super Adventure", photo: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=300&h=200&fit=crop" },
  { label: "Custom", desc: "Sportster, Shadow, Intruder", photo: "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=300&h=200&fit=crop" },
  { label: "Cruiser", desc: "Fat Boy, Indian Scout, Vulcan", photo: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop" },
  { label: "Touring", desc: "Gold Wing, K1600GT, FJR1300", photo: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&h=200&fit=crop" },
  { label: "Naked", desc: "Duke 890, MT-09, Z900, CB1000R", photo: "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=300&h=200&fit=crop" },
  { label: "Café Racer", desc: "Continental GT, R nineT, Thruxton", photo: "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=300&h=200&fit=crop" },
  { label: "Scrambler", desc: "Scrambler Ducati, XSR700, Leoncino", photo: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=300&h=200&fit=crop" },
  { label: "Enduro", desc: "CRF300L, KTM EXC, WR450F", photo: "https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=300&h=200&fit=crop" },
  { label: "Supermotard", desc: "690 SMC R, DRZ400SM, Husqvarna 701", photo: "https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=300&h=200&fit=crop" },
  { label: "Cross", desc: "CRF250R, KX250, YZ250F, SX-F", photo: "https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=300&h=200&fit=crop" },
  { label: "Trial", desc: "Beta EVO, Montesa Cota, TXT", photo: "https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=300&h=200&fit=crop" },
  { label: "Scooter", desc: "Vespa, PCX 125, XMAX 125, Forza", photo: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop" },
  { label: "Scooter GT", desc: "TMAX, Burgman 400, X-ADV, C650", photo: "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=300&h=200&fit=crop" },
  { label: "125 cm³", desc: "CBR125R, MT-125, Duke 125, PCX", photo: "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=300&h=200&fit=crop" },
  { label: "50 cm³", desc: "AM6, Derbi Senda, MBK Booster", photo: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop" },
  { label: "Électrique", desc: "Zero SR/F, LiveWire, Energica", photo: "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=300&h=200&fit=crop" },
  { label: "3 roues", desc: "Can-Am Spyder, Yamaha Niken, MP3", photo: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&h=200&fit=crop" },
  { label: "Quad", desc: "Yamaha Raptor, Can-Am Outlander", photo: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=300&h=200&fit=crop" },
];

const MARQUES_MOTO = [
  "Honda", "Yamaha", "Kawasaki", "Suzuki", "BMW", "KTM", "Ducati", "Harley-Davidson",
  "Triumph", "Aprilia", "Husqvarna", "Royal Enfield", "Indian", "Moto Guzzi", "MV Agusta",
  "Vespa", "Piaggio", "Kymco", "SYM", "Benelli", "CFMOTO", "GasGas", "Beta",
  "Can-Am", "Zero", "Energica", "LiveWire", "Derbi", "MBK", "Peugeot",
];

const CYLINDREES = ["50 cm³", "125 cm³", "250 cm³", "300 cm³", "400 cm³", "500 cm³", "600 cm³", "650 cm³", "700 cm³", "750 cm³", "800 cm³", "900 cm³", "1000 cm³", "1100 cm³", "1200 cm³", "1300 cm³+"];

const ANNONCES = [
  { id: 1, nom: "Yamaha MT-07", annee: 2023, km: 8000, prix: 6500, cat: "Roadster", cyl: "689 cm³", photo: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=260&fit=crop" },
  { id: 2, nom: "Honda CB 500F", annee: 2022, km: 12000, prix: 5200, cat: "Roadster", cyl: "471 cm³", photo: "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=400&h=260&fit=crop" },
  { id: 3, nom: "BMW R 1250 GS Adventure", annee: 2023, km: 15000, prix: 16500, cat: "Trail", cyl: "1254 cm³", photo: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=260&fit=crop" },
  { id: 4, nom: "Kawasaki Ninja ZX-6R", annee: 2024, km: 3000, prix: 11900, cat: "Sportive", cyl: "636 cm³", photo: "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=400&h=260&fit=crop" },
  { id: 5, nom: "Vespa Primavera 125", annee: 2023, km: 5000, prix: 3800, cat: "Scooter", cyl: "125 cm³", photo: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=300&h=200&fit=crop" },
  { id: 6, nom: "Harley-Davidson Sportster S", annee: 2023, km: 6000, prix: 14500, cat: "Custom", cyl: "1252 cm³", photo: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=260&fit=crop" },
  { id: 7, nom: "KTM 890 Duke R", annee: 2024, km: 2000, prix: 11500, cat: "Naked", cyl: "890 cm³", photo: "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=400&h=260&fit=crop" },
  { id: 8, nom: "Ducati Scrambler Icon", annee: 2023, km: 7000, prix: 8900, cat: "Scrambler", cyl: "803 cm³", photo: "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=400&h=260&fit=crop" },
];

const PERMIS = [
  { type: "AM", desc: "Cyclomoteur 50 cm³ dès 14 ans" },
  { type: "A1", desc: "125 cm³ / 11 kW dès 16 ans" },
  { type: "A2", desc: "≤ 35 kW (47,5 ch) dès 18 ans" },
  { type: "A", desc: "Toutes motos, 2 ans après A2" },
];

export default function VenteMoto() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [showAllCats, setShowAllCats] = useState(false);

  const displayedCats = showAllCats ? CATEGORIES_MOTO : CATEGORIES_MOTO.slice(0, 9);
  const filtered = selectedCat ? ANNONCES.filter(a => a.cat === selectedCat) : ANNONCES;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-red-600 px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">MOTO & SCOOTER</span>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Bike size={20} /> Achat Moto</h1>
        <p className="mt-1 text-sm text-white/80">21 catégories · 30+ marques · Toutes cylindrées</p>
      </div>

      {/* Recherche */}
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input type="text" placeholder="Marque, modèle, cylindrée…" className="w-full bg-transparent text-sm outline-none" />
          <button onClick={() => setShowFilters(!showFilters)} className="shrink-0"><SlidersHorizontal size={16} className="text-[#6B7280]" /></button>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="mx-4 mt-2 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm space-y-3">
          <div>
            <label className="text-[10px] font-bold text-[#6B7280] uppercase">Marque</label>
            <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
              <option value="">Toutes les marques</option>
              {MARQUES_MOTO.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#6B7280] uppercase">Cylindrée</label>
            <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
              <option value="">Toutes</option>
              {CYLINDREES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] font-bold text-[#6B7280] uppercase">Prix min</label><input placeholder="0 €" className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" /></div>
            <div><label className="text-[10px] font-bold text-[#6B7280] uppercase">Prix max</label><input placeholder="50 000 €" className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" /></div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#6B7280] uppercase">Permis requis</label>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {PERMIS.map(p => (
                <button key={p.type} className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-[10px] font-semibold text-[#6B7280] active:bg-red-600 active:text-white active:border-red-600">{p.type} — {p.desc}</button>
              ))}
            </div>
          </div>
          <button className="w-full py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold">Rechercher</button>
        </div>
      )}

      {/* Catégories complètes */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#111]">Catégories ({CATEGORIES_MOTO.length})</h2>
          <button onClick={() => { setShowAllCats(!showAllCats); setSelectedCat(null); }} className="text-[10px] font-bold text-red-600">{showAllCats ? "Réduire" : "Voir tout"}</button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {displayedCats.map((c) => (
            <button key={c.label} onClick={() => setSelectedCat(selectedCat === c.label ? null : c.label)} className={`rounded-xl overflow-hidden border-2 active:scale-[0.98] ${selectedCat === c.label ? "border-red-600" : "border-[#E5E7EB]"}`}>
              <img src={c.photo} alt={c.label} className="w-full h-[50px] object-cover" loading="lazy" />
              <div className="p-1.5 bg-white"><p className="text-[10px] font-bold text-[#111] leading-tight">{c.label}</p><p className="text-[7px] text-[#6B7280] leading-tight truncate">{c.desc}</p></div>
            </button>
          ))}
        </div>
        {!showAllCats && <button onClick={() => setShowAllCats(true)} className="w-full mt-2 flex items-center justify-center gap-1 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[10px] font-bold text-red-600"><ChevronDown size={12} /> Voir les {CATEGORIES_MOTO.length - 9} autres catégories</button>}
      </div>

      {/* Annonces */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">{selectedCat ? `Annonces ${selectedCat}` : "Toutes les annonces"} ({filtered.length})</h2>
        <div className="mt-3 space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="relative h-[130px]">
                <img src={a.photo} alt={a.nom} className="w-full h-full object-cover" loading="lazy" />
                <button className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"><Heart size={14} className="text-[#6B7280]" /></button>
                <span className="absolute top-2 left-2 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white">{a.cat}</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#111]">{a.nom}</h3>
                <p className="text-[10px] text-[#6B7280] mt-0.5">{a.annee} · {a.km.toLocaleString("fr-FR")} km · {a.cyl}</p>
                <p className="mt-2 text-lg font-black text-red-600">{a.prix.toLocaleString("fr-FR")} €</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA dépôt */}
      <div className="px-4 mt-6">
        <Link to="/depot-annonce" className="block w-full py-3 bg-red-600 text-white rounded-xl text-sm font-bold text-center active:scale-[0.98]">Vendre ma moto sur MKA.P-MS</Link>
      </div>
    </div>
  );
}
