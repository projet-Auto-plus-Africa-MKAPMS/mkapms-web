import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, ChevronRight, ChevronDown, Car, Truck,
  X, SlidersHorizontal,
} from "lucide-react";

/* ── Icône moto (SVG custom car lucide n'a pas de moto) ── */
const MotoIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="5" cy="17" r="3" />
    <circle cx="19" cy="17" r="3" />
    <path d="M5 14l4-9h3" />
    <path d="M12 5l3 9h4" />
    <path d="M15 6h4l-1 3" />
    <path d="M9 5L8 2" />
  </svg>
);

/* ── types de véhicules par catégorie ── */
const VOITURE_TYPES = ["Citadine", "Berline", "SUV", "Coupé", "Cabriolet", "Break", "Monospace", "Pick-up", "Sans permis"];
const UTILITAIRE_TYPES = ["Fourgon", "Fourgonnette", "Châssis cabine", "Benne", "Plateau", "Camping-car"];
const MOTO_SOUS = ["Motos", "Scooter", "Quad"] as const;

const MARQUES_VOITURE = [
  "Peugeot", "Renault", "Citroën", "Volkswagen", "BMW", "Mercedes", "Audi", "Toyota",
  "Nissan", "Ford", "Opel", "Fiat", "Hyundai", "Kia", "Dacia", "Skoda", "Seat", "Volvo",
  "Mazda", "Honda", "Suzuki", "Mitsubishi", "Jeep", "Land Rover", "Porsche", "Tesla",
  "Mini", "Alfa Romeo", "DS", "Jaguar", "Lexus",
];

const CARBURANTS = ["Diesel", "Essence", "Électrique", "Hybride", "GPL", "Hydrogène"];
const BOITES = ["Automatique", "Manuelle"];
const INDICATEURS_PRIX = [
  { label: "Très bonne affaire", color: "text-green-600 border-green-400" },
  { label: "Bonne affaire", color: "text-green-600 border-green-400" },
  { label: "Offre équitable", color: "text-slate-700 border-slate-300" },
];

const COULEURS_EXT = ["Noir", "Blanc", "Gris", "Bleu", "Rouge", "Vert", "Marron", "Beige", "Orange", "Jaune", "Violet"];
const COULEURS_INT = ["Noir", "Beige", "Gris", "Marron", "Rouge", "Blanc"];

const EQUIPEMENTS = [
  "Climatisation", "GPS", "Régulateur de vitesse", "Caméra de recul", "Radar de stationnement",
  "Sièges chauffants", "Toit ouvrant", "Bluetooth", "Apple CarPlay", "Android Auto",
  "Aide au stationnement", "Détecteur d'angle mort", "Affichage tête haute",
];

export default function Rechercher() {
  const navigate = useNavigate();

  /* ── onglets principaux ── */
  const [mainTab, setMainTab] = useState<"voiture" | "utilitaire" | "moto">("voiture");
  const [motoSub, setMotoSub] = useState<typeof MOTO_SOUS[number]>("Motos");

  /* ── filtres de base ── */
  const [typeVehicule, setTypeVehicule] = useState("");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [anneeMin, setAnneeMin] = useState("");
  const [anneeMax, setAnneeMax] = useState("");
  const [kmMin, setKmMin] = useState("");
  const [kmMax, setKmMax] = useState("");
  const [neufUniquement, setNeufUniquement] = useState(false);
  const [carburants, setCarburants] = useState<string[]>([]);
  const [boite, setBoite] = useState("");

  /* ── prix ── */
  const [prixTab, setPrixTab] = useState<"total" | "loa">("total");
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");
  const [indicateurs, setIndicateurs] = useState<string[]>([]);

  /* ── localisation ── */
  const [codePostal, setCodePostal] = useState("");
  const [avecLivraison, setAvecLivraison] = useState(false);

  /* ── type vendeur ── */
  const [vendeurType, setVendeurType] = useState("");

  /* ── couleurs ── */
  const [couleurExt, setCouleurExt] = useState("");
  const [couleurInt, setCouleurInt] = useState("");

  /* ── performance ── */
  const [quatreRoues, setQuatreRoues] = useState(false);

  /* ── historique ── */
  const [premiereMain, setPremiereMain] = useState(false);
  const [historiqueVehicule, setHistoriqueVehicule] = useState(false);

  /* ── cylindrées moto ── */
  const [cylindreeMin, setCylindreeMin] = useState("");
  const [cylindreeMax, setCylindreeMax] = useState("");

  /* ── équipements ── */
  const [equipements, setEquipements] = useState<string[]>([]);

  /* ── sections expand ── */
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleCarburant = (c: string) => setCarburants(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleIndicateur = (i: string) => setIndicateurs(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  const toggleEquipement = (e: string) => setEquipements(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  function doSearch() {
    const p = new URLSearchParams();
    if (marque) p.set("q", marque + (modele ? " " + modele : ""));
    if (prixMax) p.set("prixMax", prixMax);
    if (codePostal) p.set("ville", codePostal);
    if (mainTab === "moto") p.set("famille", "moto");
    if (mainTab === "utilitaire") p.set("categorie", "utilitaire");
    if (vendeurType) p.set("vendeurType", vendeurType);
    navigate(`/acheter?${p.toString()}`);
  }

  function resetAll() {
    setTypeVehicule(""); setMarque(""); setModele("");
    setAnneeMin(""); setAnneeMax(""); setKmMin(""); setKmMax("");
    setNeufUniquement(false); setCarburants([]); setBoite("");
    setPrixTab("total"); setPrixMin(""); setPrixMax(""); setIndicateurs([]);
    setCodePostal(""); setAvecLivraison(false); setVendeurType("");
    setCouleurExt(""); setCouleurInt(""); setQuatreRoues(false);
    setPremiereMain(false); setHistoriqueVehicule(false);
    setCylindreeMin(""); setCylindreeMax(""); setEquipements([]);
  }

  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#111] placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none";
  const toggleClass = (on: boolean) => `relative w-11 h-6 rounded-full transition cursor-pointer ${on ? "bg-[#D4AF37]" : "bg-slate-200"}`;
  const toggleDot = (on: boolean) => `absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition ${on ? "translate-x-5" : ""}`;
  const chipClass = (active: boolean) => `rounded-full border px-4 py-2 text-sm font-medium transition cursor-pointer ${active ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`;
  const navItemClass = (active: boolean) => `flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${active ? "border-b-2 border-[#D4AF37] text-[#D4AF37]" : "text-slate-500 hover:text-[#111]"}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#F9F9F9]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-slate-100">
          <ArrowLeft size={20} className="text-[#111]" />
        </button>
        <h1 className="text-base font-bold text-[#111]">Filtrer</h1>
        <button onClick={resetAll} className="rounded-full p-2 hover:bg-slate-100" title="Réinitialiser">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      {/* ── Tabs voiture / utilitaire / moto ── */}
      <div className="flex items-center justify-around border-b border-slate-100 bg-white">
        {([
          { key: "voiture" as const, icon: Car, label: "Voitures" },
          { key: "utilitaire" as const, icon: Truck, label: "Utilitaires" },
          { key: "moto" as const, icon: MotoIcon, label: "2 roues" },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setMainTab(tab.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium border-b-2 transition ${mainTab === tab.key ? "border-[#D4AF37] text-[#D4AF37]" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
            <tab.icon size={20} />
          </button>
        ))}
      </div>

      {/* ── Contenu scrollable ── */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* Sous-tabs moto */}
        {mainTab === "moto" && (
          <div className="mx-4 mt-4 flex gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {MOTO_SOUS.map(s => (
              <button key={s} onClick={() => setMotoSub(s)}
                className={`flex-1 py-2.5 text-sm font-medium transition ${motoSub === s ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-slate-500 hover:bg-slate-50"}`}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Type de véhicule ── */}
        <FilterSection title="Type de véhicule" expanded={expandedSections["type"]} onToggle={() => toggleSection("type")}>
          <div className="flex flex-wrap gap-2">
            {(mainTab === "utilitaire" ? UTILITAIRE_TYPES : VOITURE_TYPES).map(t => (
              <button key={t} onClick={() => setTypeVehicule(typeVehicule === t ? "" : t)} className={chipClass(typeVehicule === t)}>{t}</button>
            ))}
          </div>
        </FilterSection>

        {/* ── Marque ── */}
        <FilterSection title="Marque" expanded={expandedSections["marque"]} onToggle={() => toggleSection("marque")}>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {MARQUES_VOITURE.map(m => (
              <button key={m} onClick={() => setMarque(marque === m ? "" : m)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${marque === m ? "bg-[#D4AF37]/10 text-[#D4AF37] font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
                {m}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* ── Modèle ── */}
        <FilterSection title="Modèle" expanded={expandedSections["modele"]} onToggle={() => toggleSection("modele")}>
          <input value={modele} onChange={e => setModele(e.target.value)} placeholder="Ex: 308, Clio, Golf..." className={inputClass} />
        </FilterSection>

        {/* ── Année ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Année</h3>
          <div className="mt-3 flex gap-3">
            <input value={anneeMin} onChange={e => setAnneeMin(e.target.value)} placeholder="Année min" className={inputClass} />
            <input value={anneeMax} onChange={e => setAnneeMax(e.target.value)} placeholder="Année max" className={inputClass} />
          </div>
        </div>

        {/* ── Kilométrage ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Kilométrage</h3>
          <div className="mt-3 flex gap-3">
            <input value={kmMin} onChange={e => setKmMin(e.target.value)} placeholder="km min" className={inputClass} />
            <input value={kmMax} onChange={e => setKmMax(e.target.value)} placeholder="km max" className={inputClass} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Neuf uniquement</span>
            <button onClick={() => setNeufUniquement(!neufUniquement)} className={toggleClass(neufUniquement)}>
              <div className={toggleDot(neufUniquement)} />
            </button>
          </div>
        </div>

        {/* ── Cylindrées (moto only) ── */}
        {mainTab === "moto" && (
          <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
            <h3 className="text-sm font-bold text-[#111]">Cylindrées</h3>
            <div className="mt-3 flex gap-3">
              <input value={cylindreeMin} onChange={e => setCylindreeMin(e.target.value)} placeholder="cm³ min" className={inputClass} />
              <input value={cylindreeMax} onChange={e => setCylindreeMax(e.target.value)} placeholder="cm³ max" className={inputClass} />
            </div>
          </div>
        )}

        {/* ── Carburant ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Carburant</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {CARBURANTS.map(c => (
              <button key={c} onClick={() => toggleCarburant(c)} className={chipClass(carburants.includes(c))}>{c}</button>
            ))}
          </div>
        </div>

        {/* ── Boîte de vitesse ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Boîte de vitesse</h3>
          <div className="mt-3 flex gap-3">
            {BOITES.map(b => (
              <button key={b} onClick={() => setBoite(boite === b ? "" : b)}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition ${boite === b ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* ── Prix et mensualités ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Prix et mensualités</h3>
          <div className="mt-3 flex overflow-hidden rounded-lg border border-slate-200">
            <button onClick={() => setPrixTab("total")}
              className={`flex-1 py-2.5 text-sm font-medium transition ${prixTab === "total" ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-slate-500"}`}>
              Prix total
            </button>
            <button onClick={() => setPrixTab("loa")}
              className={`flex-1 py-2.5 text-sm font-medium transition ${prixTab === "loa" ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-slate-500"}`}>
              Leasing (LOA)
            </button>
          </div>
          <div className="mt-3 flex gap-3">
            <input value={prixMin} onChange={e => setPrixMin(e.target.value)} placeholder="Prix min" className={inputClass} />
            <input value={prixMax} onChange={e => setPrixMax(e.target.value)} placeholder="Prix max" className={inputClass} />
          </div>
        </div>

        {/* ── Indicateur de prix ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Indicateur de prix</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {INDICATEURS_PRIX.map(ind => (
              <button key={ind.label} onClick={() => toggleIndicateur(ind.label)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${indicateurs.includes(ind.label) ? ind.color + " bg-opacity-10" : "border-slate-200 text-slate-500"}`}>
                <span className="text-xs">€</span> {ind.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Localisation véhicules ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Localisation véhicules</h3>
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-400">📍</span>
              <input value={codePostal} onChange={e => setCodePostal(e.target.value)} placeholder="Code postal" className={inputClass + " pl-8"} />
            </div>
            <button className="rounded-lg border border-slate-200 px-3 text-slate-400 hover:border-slate-400">⊕</button>
          </div>
          <button onClick={() => toggleSection("regions")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Régions et pays voisins <ChevronRight size={16} className={`text-slate-400 transition ${expandedSections["regions"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["regions"] && (
            <div className="mt-2 flex flex-wrap gap-2">
              {["Île-de-France", "PACA", "Auvergne-Rhône-Alpes", "Occitanie", "Nouvelle-Aquitaine", "Hauts-de-France", "Grand Est", "Bretagne", "Normandie", "Belgique", "Luxembourg", "Suisse"].map(r => (
                <button key={r} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[#D4AF37] hover:text-[#D4AF37] transition">{r}</button>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Avec livraison</span>
            <button onClick={() => setAvecLivraison(!avecLivraison)} className={toggleClass(avecLivraison)}>
              <div className={toggleDot(avecLivraison)} />
            </button>
          </div>
        </div>

        {/* ── Type de vendeur ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Type de vendeur</h3>
          <div className="mt-3 flex gap-3">
            {["Particulier", "Professionnel"].map(v => (
              <button key={v} onClick={() => setVendeurType(vendeurType === v.toLowerCase() ? "" : v.toLowerCase())}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition ${vendeurType === v.toLowerCase() ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* ── Équipements & options ── */}
        <FilterSection title="Équipements & options" expanded={expandedSections["equip"]} onToggle={() => toggleSection("equip")}>
          <div className="flex flex-wrap gap-2">
            {EQUIPEMENTS.map(e => (
              <button key={e} onClick={() => toggleEquipement(e)} className={chipClass(equipements.includes(e))}>{e}</button>
            ))}
          </div>
        </FilterSection>

        {/* ── Couleurs ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Couleurs</h3>
          <button onClick={() => toggleSection("couleurExt")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Couleurs extérieur <ChevronRight size={16} className={`text-slate-400 transition ${expandedSections["couleurExt"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["couleurExt"] && (
            <div className="mt-2 flex flex-wrap gap-2">
              {COULEURS_EXT.map(c => (
                <button key={c} onClick={() => setCouleurExt(couleurExt === c ? "" : c)} className={chipClass(couleurExt === c)}>{c}</button>
              ))}
            </div>
          )}
          <button onClick={() => toggleSection("couleurInt")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Couleurs intérieur <ChevronRight size={16} className={`text-slate-400 transition ${expandedSections["couleurInt"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["couleurInt"] && (
            <div className="mt-2 flex flex-wrap gap-2">
              {COULEURS_INT.map(c => (
                <button key={c} onClick={() => setCouleurInt(couleurInt === c ? "" : c)} className={chipClass(couleurInt === c)}>{c}</button>
              ))}
            </div>
          )}
        </div>

        {/* ── Performance ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Performance</h3>
          <button onClick={() => toggleSection("puissanceFiscale")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Puissance fiscale <ChevronRight size={16} className={`text-slate-400 transition ${expandedSections["puissanceFiscale"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["puissanceFiscale"] && (
            <div className="mt-2 flex gap-3">
              <input placeholder="CV min" className={inputClass} />
              <input placeholder="CV max" className={inputClass} />
            </div>
          )}
          <button onClick={() => toggleSection("puissanceDin")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Puissance DIN (ch) <ChevronRight size={16} className={`text-slate-400 transition ${expandedSections["puissanceDin"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["puissanceDin"] && (
            <div className="mt-2 flex gap-3">
              <input placeholder="ch min" className={inputClass} />
              <input placeholder="ch max" className={inputClass} />
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">4 roues motrices</span>
            <button onClick={() => setQuatreRoues(!quatreRoues)} className={toggleClass(quatreRoues)}>
              <div className={toggleDot(quatreRoues)} />
            </button>
          </div>
        </div>

        {/* ── Consommation ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Consommation</h3>
          <button onClick={() => toggleSection("consMax")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Consommation max <ChevronRight size={16} className={`text-slate-400 transition ${expandedSections["consMax"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["consMax"] && (
            <div className="mt-2">
              <input placeholder="L/100km max" className={inputClass} />
            </div>
          )}
          <button onClick={() => toggleSection("emissionCo2")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Emission de CO2 <ChevronRight size={16} className={`text-slate-400 transition ${expandedSections["emissionCo2"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["emissionCo2"] && (
            <div className="mt-2">
              <input placeholder="g CO₂/km max" className={inputClass} />
            </div>
          )}
        </div>

        {/* ── Historique ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Historique</h3>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Première main</span>
            <button onClick={() => setPremiereMain(!premiereMain)} className={toggleClass(premiereMain)}>
              <div className={toggleDot(premiereMain)} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Historique du véhicule</span>
            <button onClick={() => setHistoriqueVehicule(!historiqueVehicule)} className={toggleClass(historiqueVehicule)}>
              <div className={toggleDot(historiqueVehicule)} />
            </button>
          </div>
        </div>

        {/* ── Places & Portes ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Places & Portes</h3>
          <button onClick={() => toggleSection("nbPlaces")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Nombre de places <ChevronRight size={16} className={`text-slate-400 transition ${expandedSections["nbPlaces"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["nbPlaces"] && (
            <div className="mt-2 flex flex-wrap gap-2">
              {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button key={n} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-[#D4AF37] hover:text-[#D4AF37] transition">{n}</button>
              ))}
            </div>
          )}
          <button onClick={() => toggleSection("nbPortes")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Nombre de portes <ChevronRight size={16} className={`text-slate-400 transition ${expandedSections["nbPortes"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["nbPortes"] && (
            <div className="mt-2 flex flex-wrap gap-2">
              {[2, 3, 4, 5].map(n => (
                <button key={n} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-[#D4AF37] hover:text-[#D4AF37] transition">{n}</button>
              ))}
            </div>
          )}
        </div>

        {/* ── Dimensions ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Dimensions</h3>
          <button onClick={() => toggleSection("dimVehicule")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Dimensions du véhicule <ChevronRight size={16} className={`text-slate-400 transition ${expandedSections["dimVehicule"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["dimVehicule"] && (
            <div className="mt-2 space-y-2">
              <input placeholder="Longueur max (cm)" className={inputClass} />
              <input placeholder="Largeur max (cm)" className={inputClass} />
              <input placeholder="Hauteur max (cm)" className={inputClass} />
            </div>
          )}
          <button onClick={() => toggleSection("volumeCoffre")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Volume du coffre <ChevronRight size={16} className={`text-slate-400 transition ${expandedSections["volumeCoffre"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["volumeCoffre"] && (
            <div className="mt-2 flex gap-3">
              <input placeholder="Litres min" className={inputClass} />
              <input placeholder="Litres max" className={inputClass} />
            </div>
          )}
        </div>

        {/* ── Autres critères ── */}
        <div className="mx-4 mt-3 mb-4 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Autres critères</h3>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Moins de 24h</span>
            <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-[#D4AF37] accent-[#D4AF37]" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Avec photos uniquement</span>
            <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-[#D4AF37] accent-[#D4AF37]" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Avec vidéo</span>
            <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-[#D4AF37] accent-[#D4AF37]" />
          </div>
        </div>
      </div>

      {/* ── Bouton fixe en bas ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-100 bg-white px-4 py-3">
        <button onClick={doSearch}
          className="w-full rounded-full bg-[#D4AF37] py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#C5A028] transition">
          <Search size={14} className="mr-1 inline" /> Voir les annonces
        </button>
      </div>
    </div>
  );
}

/* ── Composant section pliable ── */
function FilterSection({ title, expanded, onToggle, children }: {
  title: string; expanded?: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white">
      <button onClick={onToggle} className="flex w-full items-center justify-between p-4">
        <h3 className="text-sm font-bold text-[#111]">{title}</h3>
        <ChevronRight size={16} className={`text-slate-400 transition ${expanded ? "rotate-90" : ""}`} />
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
