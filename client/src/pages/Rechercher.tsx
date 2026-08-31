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

/* ── types de véhicules par catégorie ──
   Chaque libellé porte la valeur réellement enregistrée sur l'annonce : un
   filtre affiché sans valeur correspondante ne rendrait jamais rien. */
const VOITURE_TYPES: readonly { label: string; value: string }[] = [
  { label: "Citadine", value: "citadine" },
  { label: "Berline", value: "berline" },
  { label: "SUV", value: "suv" },
  { label: "Coupé", value: "coupe" },
  { label: "Cabriolet", value: "cabriolet" },
  { label: "Break", value: "break" },
  { label: "Monospace", value: "monospace" },
  { label: "Luxe", value: "luxe" },
];
const MOTO_SOUS: readonly { label: string; value: string }[] = [
  { label: "Motos", value: "moto" },
  { label: "Scooter", value: "scooter" },
  { label: "Quad", value: "quad" },
];

const MARQUES_VOITURE = [
  "Peugeot", "Renault", "Citroën", "Volkswagen", "BMW", "Mercedes", "Audi", "Toyota",
  "Nissan", "Ford", "Opel", "Fiat", "Hyundai", "Kia", "Dacia", "Skoda", "Seat", "Volvo",
  "Mazda", "Honda", "Suzuki", "Mitsubishi", "Jeep", "Land Rover", "Porsche", "Tesla",
  "Mini", "Alfa Romeo", "DS", "Jaguar", "Lexus",
];

const CARBURANTS: readonly { label: string; value: string }[] = [
  { label: "Diesel", value: "diesel" },
  { label: "Essence", value: "essence" },
  { label: "Électrique", value: "electrique" },
  { label: "Hybride", value: "hybride" },
  { label: "Hybride rechargeable", value: "hybride_rechargeable" },
  { label: "GPL", value: "gpl" },
  { label: "Hydrogène", value: "hydrogene" },
  { label: "Éthanol", value: "ethanol" },
];
const BOITES: readonly { label: string; value: string }[] = [
  { label: "Automatique", value: "automatique" },
  { label: "Manuelle", value: "manuelle" },
  { label: "Semi-automatique", value: "semi_automatique" },
];

const COULEURS_EXT = ["Noir", "Blanc", "Gris", "Bleu", "Rouge", "Vert", "Marron", "Beige", "Orange", "Jaune", "Violet"];

const EQUIPEMENTS = [
  "Climatisation", "GPS", "Régulateur de vitesse", "Caméra de recul", "Radar de stationnement",
  "Sièges chauffants", "Toit ouvrant", "Bluetooth", "Apple CarPlay", "Android Auto",
  "Aide au stationnement", "Détecteur d'angle mort", "Affichage tête haute",
];

export default function Rechercher() {
  const navigate = useNavigate();

  /* ── onglets principaux ── */
  const [mainTab, setMainTab] = useState<"voiture" | "utilitaire" | "moto">("voiture");
  const [motoSub, setMotoSub] = useState("moto");

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
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");

  /* ── localisation ── */
  const [codePostal, setCodePostal] = useState("");

  /* ── type vendeur ── */
  const [vendeurType, setVendeurType] = useState("");

  /* ── couleurs ── */
  const [couleurExt, setCouleurExt] = useState("");

  /* ── performance ── */
  const [puissanceMin, setPuissanceMin] = useState("");
  const [puissanceMax, setPuissanceMax] = useState("");

  /* ── places & portes ── */
  const [places, setPlaces] = useState("");
  const [portes, setPortes] = useState("");

  /* ── autres critères ── */
  const [moins24h, setMoins24h] = useState(false);
  const [avecPhotos, setAvecPhotos] = useState(false);
  const [avecVideo, setAvecVideo] = useState(false);

  /* ── cylindrées moto ── */
  const [cylindreeMin, setCylindreeMin] = useState("");
  const [cylindreeMax, setCylindreeMax] = useState("");

  /* ── équipements ── */
  const [equipements, setEquipements] = useState<string[]>([]);

  /* ── sections expand ── */
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleCarburant = (c: string) => setCarburants(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleEquipement = (e: string) => setEquipements(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  /**
   * Tous les critères choisis partent dans l'adresse de la liste : un critère
   * saisi puis abandonné en route rendrait une liste qui ne correspond pas à
   * la demande, et l'acheteur croirait le stock vide ou mal filtré.
   */
  function doSearch() {
    const p = new URLSearchParams();
    if (marque) p.set("marque", marque);
    if (modele) p.set("modele", modele);
    if (mainTab === "moto") {
      p.set("famille", "moto");
      p.set("categorie", motoSub);
    } else if (mainTab === "utilitaire") {
      p.set("categorie", "utilitaire");
    } else if (typeVehicule) {
      p.set("categorie", typeVehicule);
    }
    if (anneeMin) p.set("anneeMin", anneeMin);
    if (anneeMax) p.set("anneeMax", anneeMax);
    if (kmMin) p.set("kmMin", kmMin);
    if (kmMax) p.set("kmMax", kmMax);
    if (neufUniquement) p.set("etat", "neuf");
    if (carburants.length) p.set("carburants", carburants.join(","));
    if (boite) p.set("boite", boite);
    if (prixMin) p.set("prixMin", prixMin);
    if (prixMax) p.set("prixMax", prixMax);
    if (codePostal) p.set("codePostal", codePostal);
    if (vendeurType) p.set("categorieAnnonce", vendeurType);
    if (couleurExt) p.set("couleur", couleurExt);
    if (puissanceMin) p.set("puissanceMin", puissanceMin);
    if (puissanceMax) p.set("puissanceMax", puissanceMax);
    if (cylindreeMin) p.set("cylindreeMin", cylindreeMin);
    if (cylindreeMax) p.set("cylindreeMax", cylindreeMax);
    if (equipements.length) p.set("equipements", equipements.join(","));
    if (places) p.set("places", places);
    if (portes) p.set("portes", portes);
    if (moins24h) p.set("publieDepuisHeures", "24");
    if (avecPhotos) p.set("avecPhotos", "1");
    if (avecVideo) p.set("avecVideo", "1");
    navigate(`/acheter?${p.toString()}`);
  }

  function resetAll() {
    setTypeVehicule(""); setMarque(""); setModele("");
    setAnneeMin(""); setAnneeMax(""); setKmMin(""); setKmMax("");
    setNeufUniquement(false); setCarburants([]); setBoite("");
    setPrixMin(""); setPrixMax("");
    setCodePostal(""); setVendeurType("");
    setCouleurExt(""); setPuissanceMin(""); setPuissanceMax("");
    setPlaces(""); setPortes("");
    setMoins24h(false); setAvecPhotos(false); setAvecVideo(false);
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
              <button key={s.value} onClick={() => setMotoSub(s.value)}
                className={`flex-1 py-2.5 text-sm font-medium transition ${motoSub === s.value ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-slate-500 hover:bg-slate-50"}`}>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Type de véhicule ── */}
        {mainTab === "voiture" && (
          <FilterSection title="Type de véhicule" expanded={expandedSections["type"]} onToggle={() => toggleSection("type")}>
            <div className="flex flex-wrap gap-2">
              {VOITURE_TYPES.map(t => (
                <button key={t.value} onClick={() => setTypeVehicule(typeVehicule === t.value ? "" : t.value)} className={chipClass(typeVehicule === t.value)}>{t.label}</button>
              ))}
            </div>
          </FilterSection>
        )}

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
              <button key={c.value} onClick={() => toggleCarburant(c.value)} className={chipClass(carburants.includes(c.value))}>{c.label}</button>
            ))}
          </div>
        </div>

        {/* ── Boîte de vitesse ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Boîte de vitesse</h3>
          <div className="mt-3 flex gap-3">
            {BOITES.map(b => (
              <button key={b.value} onClick={() => setBoite(boite === b.value ? "" : b.value)}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition ${boite === b.value ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Prix ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Prix</h3>
          <div className="mt-3 flex gap-3">
            <input value={prixMin} onChange={e => setPrixMin(e.target.value)} placeholder="Prix min" className={inputClass} />
            <input value={prixMax} onChange={e => setPrixMax(e.target.value)} placeholder="Prix max" className={inputClass} />
          </div>
        </div>

        {/* ── Localisation véhicules ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Localisation véhicules</h3>
          <div className="relative mt-3">
            <span className="absolute left-3 top-2.5 text-slate-400">📍</span>
            <input value={codePostal} onChange={e => setCodePostal(e.target.value)} placeholder="Code postal" className={inputClass + " pl-8"} />
          </div>
        </div>

        {/* ── Type d'annonce ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Type d'annonce</h3>
          <div className="mt-3 flex gap-2">
            {[
              { label: "Officiel MKA.P-MS", value: "officielle", color: "#D4AF37" },
              { label: "Professionnel", value: "professionnelle", color: "#3B82F6" },
              { label: "Particulier", value: "particulier", color: "#22C55E" },
            ].map(v => (
              <button key={v.value} onClick={() => setVendeurType(vendeurType === v.value ? "" : v.value)}
                className={`flex-1 rounded-lg border py-2.5 text-xs font-medium transition ${vendeurType === v.value ? `border-[${v.color}] bg-[${v.color}]/10 text-[${v.color}]` : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
                style={vendeurType === v.value ? { borderColor: v.color, backgroundColor: v.color + "1A", color: v.color } : {}}>
                {v.label}
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
            Couleurs extérieur <ChevronRight size={16} className={`text-red-500 transition ${expandedSections["couleurExt"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["couleurExt"] && (
            <div className="mt-2 flex flex-wrap gap-2">
              {COULEURS_EXT.map(c => (
                <button key={c} onClick={() => setCouleurExt(couleurExt === c ? "" : c)} className={chipClass(couleurExt === c)}>{c}</button>
              ))}
            </div>
          )}
        </div>

        {/* ── Puissance ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Puissance fiscale</h3>
          <div className="mt-3 flex gap-3">
            <input value={puissanceMin} onChange={e => setPuissanceMin(e.target.value)} placeholder="CV min" className={inputClass} />
            <input value={puissanceMax} onChange={e => setPuissanceMax(e.target.value)} placeholder="CV max" className={inputClass} />
          </div>
        </div>

        {/* ── Places & Portes ── */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Places & Portes</h3>
          <button onClick={() => toggleSection("nbPlaces")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Nombre de places <ChevronRight size={16} className={`text-red-500 transition ${expandedSections["nbPlaces"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["nbPlaces"] && (
            <div className="mt-2 flex flex-wrap gap-2">
              {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button key={n} onClick={() => setPlaces(places === String(n) ? "" : String(n))} className={chipClass(places === String(n))}>{n}</button>
              ))}
            </div>
          )}
          <button onClick={() => toggleSection("nbPortes")} className="mt-3 flex w-full items-center justify-between text-sm text-slate-600">
            Nombre de portes <ChevronRight size={16} className={`text-red-500 transition ${expandedSections["nbPortes"] ? "rotate-90" : ""}`} />
          </button>
          {expandedSections["nbPortes"] && (
            <div className="mt-2 flex flex-wrap gap-2">
              {[2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setPortes(portes === String(n) ? "" : String(n))} className={chipClass(portes === String(n))}>{n}</button>
              ))}
            </div>
          )}
        </div>

        {/* ── Autres critères ── */}
        <div className="mx-4 mt-3 mb-4 rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-bold text-[#111]">Autres critères</h3>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Moins de 24h</span>
            <input type="checkbox" checked={moins24h} onChange={e => setMoins24h(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-[#D4AF37] accent-[#D4AF37]" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Avec photos uniquement</span>
            <input type="checkbox" checked={avecPhotos} onChange={e => setAvecPhotos(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-[#D4AF37] accent-[#D4AF37]" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Avec vidéo</span>
            <input type="checkbox" checked={avecVideo} onChange={e => setAvecVideo(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-[#D4AF37] accent-[#D4AF37]" />
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
        <ChevronRight size={16} className={`text-red-500 transition ${expanded ? "rotate-90" : ""}`} />
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
