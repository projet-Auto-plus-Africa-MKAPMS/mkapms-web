import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Camera, CheckCircle, Shield, Eye, Zap, Lock,
  ChevronRight, ChevronDown, Upload, Star, Car, Bike, Truck, Bus,
  Headphones, FileText, ArrowLeft, ArrowRight, Info, X, Video,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import FileUpload from "../components/FileUpload";

/* ═══════════════════════════════════════════════════════════
   ÉQUIPEMENTS EXHAUSTIFS — classés par catégorie
   (Inspiré Leboncoin / La Centrale — liste complète)
   ═══════════════════════════════════════════════════════════ */
const EQUIPEMENTS_AUTO: Record<string, string[]> = {
  "Confort": [
    "Climatisation manuelle", "Climatisation automatique", "Climatisation bi-zone",
    "Climatisation tri-zone", "Sièges chauffants avant", "Sièges chauffants arrière",
    "Sièges ventilés", "Sièges électriques", "Sièges massants", "Sièges sport",
    "Sièges mémoire conducteur", "Sièges mémoire passager",
    "Volant chauffant", "Volant cuir", "Volant multifonction",
    "Accoudoir central avant", "Accoudoir central arrière",
    "Vitres électriques avant", "Vitres électriques arrière", "Vitres surteintées",
    "Rétroviseurs électriques", "Rétroviseurs rabattables électriquement",
    "Rétroviseurs chauffants", "Rétroviseur intérieur électrochrome",
    "Direction assistée", "Direction assistée variable",
    "Régulateur de vitesse", "Limiteur de vitesse", "Régulateur adaptatif (ACC)",
    "Toit ouvrant", "Toit panoramique", "Toit panoramique ouvrant",
    "Hayon électrique", "Coffre mains libres",
    "Démarrage sans clé (Keyless)", "Carte mains libres",
    "Suspensions pilotées", "Suspension pneumatique",
    "Banquette arrière rabattable 1/3 - 2/3", "Banquette arrière coulissante",
    "Palettes au volant", "Volant réglable en hauteur et profondeur",
  ],
  "Sécurité": [
    "ABS", "ESP (contrôle de stabilité)", "ASR (antipatinage)",
    "Airbags frontaux", "Airbags latéraux avant", "Airbags latéraux arrière",
    "Airbags rideaux", "Airbag genoux conducteur",
    "Aide au freinage d'urgence (AFU)", "Freinage automatique d'urgence (AEB)",
    "Détecteur de fatigue", "Reconnaissance panneaux de signalisation",
    "Alerte franchissement de ligne", "Maintien actif dans la voie",
    "Détection piétons", "Détection cyclistes",
    "Surveillance angle mort (BSM)", "Alerte trafic arrière (RCTA)",
    "Caméra de recul", "Caméra 360°", "Radar de recul", "Radar avant",
    "Aide au stationnement automatique", "Park Assist",
    "Phares automatiques", "Feux de route automatiques (commutation auto)",
    "Feux LED", "Feux xénon", "Feux Matrix LED", "Feux laser",
    "Feux de jour LED", "Clignotants dynamiques", "Antibrouillards",
    "Capteur de pluie", "Capteur de luminosité", "Essuie-glaces automatiques",
    "Contrôle de pression des pneus (TPMS)",
    "Alarme anti-intrusion", "Verrouillage centralisé",
    "Frein de stationnement électrique", "Auto-Hold",
    "Aide au démarrage en côte (Hill Assist)",
    "Fixations Isofix", "Rétroviseur de surveillance bébé",
  ],
  "Multimédia & Connectivité": [
    "Écran tactile", "Écran tactile 7\"", "Écran tactile 10\"", "Écran tactile 12\"+",
    "GPS / Navigation intégrée", "Navigation connectée temps réel",
    "Apple CarPlay", "Android Auto", "MirrorLink",
    "Bluetooth", "Bluetooth audio (streaming)", "Kit mains-libres Bluetooth",
    "Prise USB", "Prises USB avant", "Prises USB arrière", "Prise USB-C",
    "Prise AUX", "Prise 12V",
    "Chargeur sans fil (induction)", "Chargeur rapide USB",
    "Système audio premium (Bose)", "Système audio JBL",
    "Système audio Harman Kardon", "Système audio Bang & Olufsen",
    "Système audio Burmester", "Système audio Focal",
    "Affichage tête haute (HUD)", "Tableau de bord numérique (cockpit digital)",
    "Compteur numérique reconfigurable",
    "Commandes au volant", "Commande vocale",
    "Radio DAB+", "Radio numérique", "Tuner AM/FM",
    "Connectivité 4G/5G embarquée", "Hotspot Wi-Fi embarqué",
    "Télématique / application constructeur",
    "Services connectés (info trafic, météo, parking)",
  ],
  "Extérieur": [
    "Jantes alliage", "Jantes alliage 16\"", "Jantes alliage 17\"",
    "Jantes alliage 18\"", "Jantes alliage 19\"", "Jantes alliage 20\"+",
    "Peinture métallisée", "Peinture nacrée", "Peinture mate",
    "Barres de toit", "Rails de toit", "Galerie de toit",
    "Becquet arrière", "Diffuseur arrière sport",
    "Pack carrosserie (élargisseurs d'ailes)",
    "Vitres teintées", "Vitres teintées surteintées arrière",
    "Rétroviseurs couleur carrosserie",
    "Poignées de porte chromées", "Poignées de porte affleurantes",
    "Calandre chromée", "Calandre sportive",
    "Attelage / Crochet d'attelage", "Marchepied latéral",
  ],
  "Aide à la conduite": [
    "Régulateur de vitesse adaptatif (ACC)", "Cruise Control",
    "Start & Stop automatique", "Mode ECO",
    "Sélecteur de mode de conduite (Sport, Confort, Eco, etc.)",
    "Transmission intégrale (4x4)", "Différentiel à glissement limité",
    "Direction 4 roues directrices",
    "Conduite semi-autonome niveau 2", "Autopilot / Pilot Assist",
    "Affichage angle mort dans rétroviseur",
    "Vision nocturne infrarouge",
    "Détection de somnolence",
  ],
  "Intérieur": [
    "Sellerie tissu", "Sellerie cuir", "Sellerie cuir partiel",
    "Sellerie Alcantara", "Sellerie simili cuir", "Sellerie mixte (cuir/tissu)",
    "Plancher de coffre modulable", "Filet de coffre", "Cache-bagages",
    "Éclairage d'ambiance", "Éclairage d'ambiance multicolore",
    "Rétroviseur intérieur jour/nuit automatique",
    "Ciel de toit noir (pavillon noir)",
    "Pédalier aluminium", "Seuils de porte lumineux",
    "Boîte à gants réfrigérée", "Vide-poches éclairés",
    "Pare-soleil avec miroir éclairé",
  ],
};

const EQUIPEMENTS_MOTO: Record<string, string[]> = {
  "Motorisation & Performances": [
    "ABS", "ABS en courbe (cornering ABS)", "Contrôle de traction",
    "Anti-wheeling", "Launch Control", "Quickshifter (up)",
    "Quickshifter bidirectionnel (up & down)", "Ride-by-wire",
    "Modes de conduite (Rain, Road, Sport, Track)",
    "Contrôle de motricité (TC)", "Régulateur de vitesse",
    "Régulateur de vitesse adaptatif",
  ],
  "Confort": [
    "Selle chauffante", "Selle réglable en hauteur",
    "Poignées chauffantes", "Pare-brise réglable", "Pare-brise électrique",
    "Bulle sport", "Protège-mains",
    "Repose-pieds réglables", "Repose-pieds passager",
    "Béquille centrale", "Béquille latérale",
    "Suspension réglable avant", "Suspension réglable arrière",
    "Suspension électronique (ESA)", "Amortisseur de direction",
  ],
  "Multimédia & Connectivité": [
    "Tableau de bord TFT", "Tableau de bord TFT couleur",
    "Compteur analogique", "Compteur LCD",
    "Bluetooth", "Navigation GPS intégrée",
    "Connectivité smartphone", "Application dédiée",
    "Prise USB / 12V",
  ],
  "Sécurité": [
    "Feux LED", "Feux adaptatifs en courbe",
    "Clignotants LED", "Feux de jour (DRL)",
    "Alarme antivol", "Antidémarrage électronique",
    "Capteur de pression des pneus (TPMS)",
    "Capteur de renversement",
  ],
  "Bagagerie & Accessoires": [
    "Top case", "Valises latérales", "Sacoches souples",
    "Support top case", "Platine porte-bagages",
    "Protections moteur (crash bars)", "Protections de carénage",
    "Protège-réservoir",
  ],
};

const MARQUES_AUTO = [
  "Renault", "Peugeot", "Citroën", "Volkswagen", "BMW", "Mercedes-Benz", "Audi",
  "Toyota", "Nissan", "Ford", "Opel", "Fiat", "Hyundai", "Kia", "Dacia",
  "Skoda", "Seat", "Cupra", "Volvo", "Mazda", "Honda", "Suzuki", "Mitsubishi",
  "Jeep", "Land Rover", "Porsche", "Tesla", "Mini", "Alfa Romeo", "DS Automobiles",
  "Jaguar", "Lexus", "Chevrolet", "Dodge", "Ferrari", "Lamborghini", "Maserati",
  "Bentley", "Rolls-Royce", "Aston Martin", "McLaren", "Bugatti",
  "MG", "BYD", "Lynk & Co", "Genesis", "Polestar", "Aiways", "Autre",
];
const MARQUES_MOTO = [
  "Yamaha", "Honda", "Kawasaki", "Suzuki", "BMW", "Ducati", "KTM",
  "Triumph", "Harley-Davidson", "Indian", "Aprilia", "Piaggio", "Vespa",
  "MV Agusta", "Benelli", "Royal Enfield", "Husqvarna", "Gas Gas",
  "CF Moto", "Sym", "Kymco", "Peugeot", "MBK", "Autre",
];

const CATEGORIES_AUTO = [
  "Citadine", "Berline", "Break", "SUV / Crossover", "Coupé", "Cabriolet",
  "Monospace", "Ludospace", "Pick-up", "Utilitaire", "Camping-car",
  "4x4", "Limousine", "Luxe / Prestige",
];
const CATEGORIES_MOTO = [
  "Roadster / Naked", "Sportive", "Trail / Adventure", "Custom / Cruiser",
  "Touring / GT", "Scooter", "Scooter 125", "Scooter 3 roues",
  "Enduro", "Supermotard", "Café Racer", "Scrambler",
  "Quad", "Trike", "Électrique",
];

const COULEURS = [
  "Noir", "Blanc", "Gris", "Argent", "Bleu", "Rouge", "Vert", "Beige",
  "Marron", "Orange", "Jaune", "Bordeaux", "Violet", "Rose", "Or", "Autre",
];

const SELLERIES = ["Tissu", "Cuir", "Cuir partiel", "Alcantara", "Simili cuir", "Mixte tissu/cuir"];
const CLASSES_EMISSION = ["EURO 1", "EURO 2", "EURO 3", "EURO 4", "EURO 5", "EURO 6", "EURO 6d", "EURO 6d-TEMP", "EURO 7"];
const CRITAIRS = ["Crit'Air 0 (électrique)", "Crit'Air 1", "Crit'Air 2", "Crit'Air 3", "Crit'Air 4", "Crit'Air 5"];

/* ── Photo categories par type ── */
const PHOTO_CATS_AUTO = [
  { key: "ext", label: "Extérieures", slots: ["Face avant", "3/4 avant gauche", "Profil gauche", "3/4 arrière gauche", "Face arrière", "3/4 arrière droit", "Profil droit", "3/4 avant droit"] },
  { key: "int", label: "Intérieures", slots: ["Tableau de bord", "Compteur", "Écran multimédia", "Sièges avant", "Sièges arrière", "Console centrale", "Volant", "Ciel de toit"] },
  { key: "coffre", label: "Coffre", slots: ["Coffre ouvert", "Coffre chargé", "Plancher coffre"] },
  { key: "moteur", label: "Moteur", slots: ["Moteur", "Compartiment moteur"] },
  { key: "roues", label: "Roues & Pneus", slots: ["Roue avant gauche", "Roue arrière gauche", "Roue avant droite", "Roue arrière droite"] },
  { key: "defauts", label: "Défauts / Imperfections", slots: ["Défaut 1", "Défaut 2", "Défaut 3", "Défaut 4"] },
];
const PHOTO_CATS_MOTO_V = [
  { key: "ext", label: "Extérieures", slots: ["Face avant", "Profil gauche", "Face arrière", "Profil droit", "Vue plongeante"] },
  { key: "details", label: "Détails", slots: ["Tableau de bord", "Moteur", "Pot échappement", "Réservoir", "Selle"] },
  { key: "roues", label: "Pneus", slots: ["Roue avant", "Roue arrière"] },
  { key: "defauts", label: "Défauts", slots: ["Défaut 1", "Défaut 2"] },
];

export default function Vendre() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { format: formatPrice } = useCurrency();
  const utils = trpc.useUtils();

  /* ── Mode : landing (page vitrine) vs deposit (flux 4 étapes) ── */
  const [mode, setMode] = useState<"landing" | "deposit">("landing");
  const [step, setStep] = useState(1);
  const [identTab, setIdentTab] = useState<"plaque" | "vin">("plaque");
  const [plaque, setPlaque] = useState("");
  const [vin, setVin] = useState("");
  const [plateLoading, setPlateLoading] = useState(false);
  const [plateResult, setPlateResult] = useState<any>(null);

  /* ── Formulaire complet ── */
  const [typeAnnonce, setTypeAnnonce] = useState<"vente" | "location">("vente");
  const [famille, setFamille] = useState<"auto" | "moto">("auto");
  const [form, setForm] = useState({
    titre: "", marque: "", modele: "", version: "",
    annee: "2024", kilometrage: "", prix: "",
    carburant: "essence", boite: "manuelle",
    categorie: "berline",
    ville: "", codePostal: "", contactTelephone: "",
    description: "",
    couleur: "", sellerie: "",
    portes: "5", places: "5",
    cylindree: "", puissanceCv: "",
    consommation: "", classeEmission: "EURO 6",
    critair: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [videos360, setVideos360] = useState<string[]>([]);
  const [videosNormales, setVideosNormales] = useState<string[]>([]);
  const [selectedEquipements, setSelectedEquipements] = useState<string[]>([]);
  const [pointsForts, setPointsForts] = useState<string[]>([]);
  const [pfInput, setPfInput] = useState("");
  const [imperfections, setImperfections] = useState<string[]>([]);
  const [impInput, setImpInput] = useState("");
  const [openEqCats, setOpenEqCats] = useState<string[]>([]);

  /* Estimation */
  const [estim, setEstim] = useState<{ low: number; mid: number; high: number; method: string; sampleSize: number } | null>(null);
  const [estimLoading, setEstimLoading] = useState(false);

  const maxPhotos = user?.accountType === "professionnel" ? 20 : 4;
  const isPro = user?.accountType === "professionnel" || user?.role === "admin" || user?.role === "directeur";

  const equipRef = famille === "moto" ? EQUIPEMENTS_MOTO : EQUIPEMENTS_AUTO;
  const marquesRef = famille === "moto" ? MARQUES_MOTO : MARQUES_AUTO;
  const categoriesRef = famille === "moto" ? CATEGORIES_MOTO : CATEGORIES_AUTO;
  const photoCatsRef = famille === "moto" ? PHOTO_CATS_MOTO_V : PHOTO_CATS_AUTO;

  // Derive flat photos array from categorized photoUrls
  const allPhotos = useMemo(() => Object.values(photoUrls), [photoUrls]);

  function set<K extends keyof typeof form>(k: K, val: string) {
    setForm((f) => ({ ...f, [k]: val }));
  }

  function toggleEquip(eq: string) {
    setSelectedEquipements((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  }

  function toggleEqCat(cat: string) {
    setOpenEqCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function onFilesUploaded(files: { url: string; originalName: string }[]) {
    setPhotos((prev) => [...prev, ...files.map((f) => f.url)].slice(0, maxPhotos));
  }

  /* Identification par plaque / VIN */
  async function identifierVehicule() {
    const query = plaque.trim() || vin.trim();
    const type = plaque.trim() ? "plaque" : "vin";
    if (!query) return;
    setPlateLoading(true);
    try {
      const r = await utils.annonces.lookupPlate.fetch({ type, query });
      if (r) {
        setPlateResult(r);
        if (r.marque) set("marque", r.marque);
        if (r.modele) set("modele", r.modele);
        if (r.version) set("version", r.version);
        if (r.annee) set("annee", String(r.annee));
        if (r.carburant) set("carburant", r.carburant);
        if (r.boite) set("boite", r.boite);
        if (r.categorie) set("categorie", r.categorie);
        setStep(2);
      }
    } catch {
      // lookup failed — user fills manually
    } finally {
      setPlateLoading(false);
    }
  }

  /* Estimation du prix */
  async function estimerPrix() {
    if (!form.marque) return;
    setEstimLoading(true);
    try {
      const r = await utils.annonces.estimate.fetch({
        marque: form.marque,
        modele: form.modele || "standard",
        annee: form.annee ? Number(form.annee) : undefined,
        kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
        carburant: form.carburant || undefined,
        boite: form.boite || undefined,
      });
      setEstim(r);
    } finally {
      setEstimLoading(false);
    }
  }

  const create = trpc.annonces.create.useMutation({
    onSuccess: (a) => navigate(`/vehicule/${a.id}`),
  });

  function submit() {
    const confortList = selectedEquipements.filter((e) => (equipRef["Confort"] || []).includes(e));
    const multiList = selectedEquipements.filter((e) => (equipRef["Multimédia & Connectivité"] || equipRef["Multimédia & Connectivité"] || []).includes(e));
    const secuList = selectedEquipements.filter((e) => (equipRef["Sécurité"] || []).includes(e));
    const restList = selectedEquipements.filter((e) => !confortList.includes(e) && !multiList.includes(e) && !secuList.includes(e));

    create.mutate({
      type: typeAnnonce,
      titre: form.titre || `${form.marque} ${form.modele}`.trim(),
      marque: form.marque,
      modele: form.modele,
      version: form.version || undefined,
      annee: form.annee ? Number(form.annee) : undefined,
      kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
      prix: form.prix ? Number(form.prix) : 0,
      carburant: form.carburant,
      boite: form.boite,
      categorie: form.categorie as any,
      famille: famille,
      ville: form.ville || undefined,
      codePostal: form.codePostal || undefined,
      contactTelephone: form.contactTelephone || undefined,
      description: form.description || undefined,
      photos: allPhotos.length > 0 ? allPhotos : photos,
      couleur: form.couleur || undefined,
      portes: form.portes ? Number(form.portes) : undefined,
      places: form.places ? Number(form.places) : undefined,
      sellerie: form.sellerie || undefined,
      cylindree: form.cylindree || undefined,
      puissanceCv: form.puissanceCv ? Number(form.puissanceCv) : undefined,
      consommation: form.consommation || undefined,
      classeEmission: form.classeEmission || undefined,
      pointsForts,
      equipements: restList,
      imperfections,
      confort: confortList,
      multimedia: multiList,
      securite: secuList,
      videos360,
      videosNormales,
    });
  }

  /* ════════════════════════════════════════════════════════════
     LANDING PAGE — Page vitrine Vendre
     ════════════════════════════════════════════════════════════ */
  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-[#F5F3EF]">
        {/* ── HERO ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#2d2d2d]">
          <div className="absolute inset-0 opacity-30">
            <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="relative px-4 py-10 md:py-16 md:px-8 max-w-6xl mx-auto">
            <div className="md:flex md:items-center md:justify-between md:gap-12">
              <div className="md:max-w-xl">
                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                  VENDEZ FACILEMENT<br />VOTRE <span className="text-[#D4AF37]">VÉHICULE</span>
                </h1>
                <p className="mt-3 text-sm md:text-base text-white/70 max-w-md">
                  Des milliers d'acheteurs vous font déjà confiance.<br />
                  Déposez votre annonce en quelques minutes et vendez au meilleur prix.
                </p>
              </div>
              <div className="mt-6 md:mt-0 space-y-2">
                {[
                  { icon: CheckCircle, text: "100% Gratuit pour les particuliers" },
                  { icon: Zap, text: "Publication rapide" },
                  { icon: Eye, text: "Visibilité maximale" },
                  { icon: Lock, text: "Messagerie sécurisée" },
                  { icon: Shield, text: "Paiement sécurisé" },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-2">
                    <b.icon size={16} className="text-[#D4AF37] shrink-0" />
                    <span className="text-sm text-white/90">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── DEUX CARTES : Déposer / Estimer ── */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto -mt-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Carte Déposer */}
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                  <Upload size={22} className="text-[#D4AF37]" />
                </div>
                <h2 className="text-lg font-extrabold text-[#111]">DÉPOSER MON ANNONCE</h2>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">
                Déposez gratuitement votre annonce et vendez votre véhicule rapidement.
              </p>
              <ul className="space-y-2 mb-5">
                {["4 photos gratuites incluses", "Publication rapide", "Visibilité maximale", "Messagerie sécurisée"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-[#374151]">
                    <CheckCircle size={14} className="text-green-500 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <button
                className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] transition"
                onClick={() => {
                  if (!user) { navigate("/connexion"); return; }
                  setMode("deposit");
                  setStep(1);
                }}
              >
                Déposer mon annonce gratuite
                <span className="block text-[10px] font-normal mt-0.5 text-white/70">Particuliers · 4 photos incluses</span>
              </button>
            </div>

            {/* Carte Estimer */}
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                  <Car size={22} className="text-[#D4AF37]" />
                </div>
                <h2 className="text-lg font-extrabold text-[#111]">ESTIMER MON VÉHICULE</h2>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">
                Obtenez une estimation gratuite de la valeur de votre véhicule.
              </p>
              <ul className="space-y-2 mb-5">
                {["Estimation précise et gratuite", "Basée sur le marché actuel", "Sans engagement"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-[#374151]">
                    <CheckCircle size={14} className="text-green-500 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <button
                className="w-full rounded-xl border-2 border-[#D4AF37] py-3.5 text-sm font-bold text-[#D4AF37] hover:bg-[#FFFBEB] transition"
                onClick={() => {
                  if (!user) { navigate("/connexion"); return; }
                  setMode("deposit");
                  setStep(1);
                }}
              >
                Estimer mon véhicule
              </button>
            </div>
          </div>
        </div>

        {/* ── COMMENT ÇA MARCHE ? ── */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-10">
          <h2 className="text-xl font-extrabold text-[#111] text-center mb-6">COMMENT ÇA MARCHE ?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: 1, title: "Déposez votre annonce", desc: "Remplissez les informations et ajoutez jusqu'à 4 photos gratuites.", color: "#D4AF37" },
              { num: 2, title: "Nous vérifions", desc: "Votre annonce est vérifiée et mise en ligne rapidement.", color: "#D4AF37" },
              { num: 3, title: "Recevez des offres", desc: "Les acheteurs vous contactent directement via la plateforme.", color: "#D4AF37" },
              { num: 4, title: "Vendez en sécurité", desc: "Finalisez la vente en toute simplicité et en toute sécurité.", color: "#D4AF37" },
            ].map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white font-bold text-lg" style={{ backgroundColor: s.color }}>{s.num}</div>
                <h3 className="mt-3 text-sm font-bold text-[#111]">{s.title}</h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA FINAL ── */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-10 mb-10">
          <div className="rounded-2xl bg-[#111] p-6 md:p-8 text-center">
            <h2 className="text-lg md:text-xl font-extrabold text-white">
              PRÊT À VENDRE VOTRE VÉHICULE ?
            </h2>
            <p className="mt-2 text-sm text-white/60 max-w-md mx-auto">
              Rejoignez la marketplace automobile la plus fiable et sécurisée.
            </p>
            <button
              className="mt-5 rounded-xl bg-[#D4AF37] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#C5A028] transition"
              onClick={() => {
                if (!user) { navigate("/connexion"); return; }
                setMode("deposit");
                setStep(1);
              }}
            >
              Déposer mon annonce gratuite
              <span className="block text-[10px] font-normal mt-0.5 text-white/70">Particuliers · 4 photos incluses</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     FLUX DÉPÔT D'ANNONCE — 4 ÉTAPES
     ════════════════════════════════════════════════════════════ */
  const STEPS = [
    { num: 1, label: "Identification" },
    { num: 2, label: "Informations" },
    { num: 3, label: "Détails & Photos" },
    { num: 4, label: "Publication" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* ── Header ── */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold tracking-tight text-noir">
              MK<span className="text-[#D4AF37]">A</span>.P-MS
            </span>
            <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              La marketplace automobile
            </span>
          </div>
        </div>
      </div>

      {/* ── Stepper 4 étapes ── */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 md:gap-4">
          {STEPS.map((s, i) => {
            const done = step > s.num;
            const active = step === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2 md:gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition
                      ${done ? "bg-green-500 text-white" : active ? "bg-[#D4AF37] text-white" : "bg-[#E5E7EB] text-[#9CA3AF]"}`}
                  >
                    {done ? <CheckCircle size={16} /> : s.num}
                  </div>
                  <span className={`mt-1 text-[10px] font-semibold ${active ? "text-[#111]" : "text-[#9CA3AF]"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 md:w-16 ${done ? "bg-green-400" : "bg-[#E5E7EB]"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Retour ── */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <button
          className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#111]"
          onClick={() => {
            if (step === 1) { setMode("landing"); }
            else setStep(step - 1);
          }}
        >
          <ArrowLeft size={14} /> {step === 1 ? "Retour à l'accueil" : "Retour"}
        </button>
      </div>

      {/* ═══════════════════════════════════════
          ÉTAPE 1 — IDENTIFICATION
         ═══════════════════════════════════════ */}
      {step === 1 && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <h1 className="text-2xl font-black text-[#111] text-center">
            IDENTIFIEZ VOTRE <span className="text-[#D4AF37]">VÉHICULE</span>
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] text-center max-w-lg mx-auto">
            Renseignez votre plaque d'immatriculation ou votre numéro VIN.
            Nous remplirons automatiquement les informations de votre véhicule.
          </p>

          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {/* Côté gauche — Formulaire */}
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
              {/* Choix type */}
              {isPro && (
                <div className="mb-4 flex gap-2">
                  <button onClick={() => setTypeAnnonce("vente")} className={`flex-1 rounded-xl border-2 p-2.5 text-center text-sm font-bold transition ${typeAnnonce === "vente" ? "border-[#D4AF37] bg-[#FFFBEB] text-[#111]" : "border-[#E5E7EB] text-[#6B7280]"}`}>Vendre</button>
                  <button onClick={() => setTypeAnnonce("location")} className={`flex-1 rounded-xl border-2 p-2.5 text-center text-sm font-bold transition ${typeAnnonce === "location" ? "border-[#D4AF37] bg-[#FFFBEB] text-[#111]" : "border-[#E5E7EB] text-[#6B7280]"}`}>Location</button>
                </div>
              )}

              {/* Choix famille */}
              <div className="mb-4 flex gap-2">
                <button onClick={() => setFamille("auto")} className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 p-2.5 text-sm font-bold transition ${famille === "auto" ? "border-[#D4AF37] bg-[#FFFBEB] text-[#111]" : "border-[#E5E7EB] text-[#6B7280]"}`}>
                  <Car size={16} /> Auto
                </button>
                <button onClick={() => setFamille("moto")} className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 p-2.5 text-sm font-bold transition ${famille === "moto" ? "border-[#D4AF37] bg-[#FFFBEB] text-[#111]" : "border-[#E5E7EB] text-[#6B7280]"}`}>
                  <Bike size={16} /> Moto / Scooter
                </button>
              </div>

              {/* Tabs Plaque / VIN */}
              <div className="flex border-b border-[#E5E7EB] mb-4">
                <button
                  onClick={() => setIdentTab("plaque")}
                  className={`flex-1 py-2.5 text-sm font-bold text-center transition border-b-2 ${identTab === "plaque" ? "border-[#D4AF37] text-[#111]" : "border-transparent text-[#9CA3AF]"}`}
                >
                  PLAQUE D'IMMATRICULATION
                </button>
                <button
                  onClick={() => setIdentTab("vin")}
                  className={`flex-1 py-2.5 text-sm font-bold text-center transition border-b-2 ${identTab === "vin" ? "border-[#D4AF37] text-[#111]" : "border-transparent text-[#9CA3AF]"}`}
                >
                  NUMÉRO VIN
                </button>
              </div>

              {identTab === "plaque" ? (
                <div className="flex items-center gap-2 rounded-xl border-2 border-[#E5E7EB] p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-[#003399] text-white text-[10px] font-bold shrink-0">FR</div>
                  <input
                    className="flex-1 text-lg font-bold text-[#111] outline-none placeholder:text-[#D1D5DB] bg-transparent"
                    placeholder="Ex : AB-123-CD"
                    value={plaque}
                    onChange={(e) => setPlaque(e.target.value.toUpperCase())}
                  />
                </div>
              ) : (
                <input
                  className="w-full rounded-xl border-2 border-[#E5E7EB] p-3 text-sm font-bold text-[#111] outline-none placeholder:text-[#D1D5DB]"
                  placeholder="Ex : VF1XXXXXXXXXX"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  maxLength={17}
                />
              )}

              <p className="mt-2 text-[10px] text-[#9CA3AF] flex items-center gap-1">
                <Info size={10} /> {identTab === "plaque" ? "Entrez votre plaque d'immatriculation française pour identifier votre véhicule." : "Le numéro VIN se trouve sur la carte grise ou sur le châssis."}
              </p>

              {/* Bouton Rechercher */}
              <button
                className="mt-4 w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2 transition"
                disabled={(!plaque.trim() && !vin.trim()) || plateLoading}
                onClick={identifierVehicule}
              >
                <Search size={16} />
                {plateLoading ? "Recherche en cours..." : "Rechercher mon véhicule"}
              </button>

              {/* Saisie manuelle */}
              <div className="mt-4 text-center">
                <button
                  className="text-sm font-semibold text-[#D4AF37] hover:underline"
                  onClick={() => setStep(2)}
                >
                  Saisir manuellement les informations →
                </button>
              </div>

              {/* Sécurité */}
              <div className="mt-5 flex items-center gap-2 text-[#9CA3AF]">
                <Shield size={14} />
                <p className="text-[10px]">Vos données sont sécurisées et confidentielles. Nous ne stockons aucune information sans votre accord.</p>
              </div>
            </div>

            {/* Côté droit — Avantages */}
            <div className="flex flex-col justify-center">
              <h3 className="text-base font-bold text-[#111] mb-4">Pourquoi utiliser l'identification automatique ?</h3>
              <ul className="space-y-3">
                {[
                  "Gain de temps : remplissage en moins de 2 minutes",
                  "Informations précises et complètes",
                  "Moins d'erreurs, plus de confiance",
                  "Meilleure estimation et meilleure visibilité",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-[#374151]">{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl overflow-hidden">
                <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&q=80" alt="Véhicule" className="w-full h-40 object-cover rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          ÉTAPE 2 — INFORMATIONS
         ═══════════════════════════════════════ */}
      {step === 2 && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <h1 className="text-2xl font-black text-[#111] text-center">
            VOTRE VÉHICULE <span className="text-[#D4AF37]">IDENTIFIÉ</span>
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] text-center">
            {plateResult ? "Les informations de votre véhicule ont été récupérées automatiquement. Vérifiez et complétez si nécessaire." : "Remplissez les informations de votre véhicule."}
          </p>

          {/* Résultat identification */}
          {plateResult && (
            <div className="mt-4 rounded-2xl bg-white border border-green-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-20 w-28 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                  <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=200&q=80" alt="" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-[#111]">{form.marque} {form.modele}</p>
                  <p className="text-xs text-[#6B7280]">{form.version}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {form.carburant && <span className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold text-[#111]">{form.carburant}</span>}
                    {form.boite && <span className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold text-[#111]">{form.boite}</span>}
                    {form.portes && <span className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold text-[#111]">{form.portes} Portes</span>}
                    {form.places && <span className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold text-[#111]">{form.places} Places</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire informations */}
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider">Informations principales</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Marque *</label>
                  <select className="input" value={form.marque} onChange={(e) => set("marque", e.target.value)}>
                    <option value="">Choisir</option>
                    {marquesRef.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Modèle *</label>
                  <input className="input" value={form.modele} onChange={(e) => set("modele", e.target.value)} placeholder="Ex : 308, Clio..." />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Version</label>
                <input className="input" value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="Ex : GT Line, RS, Active..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Année *</label>
                  <select className="input" value={form.annee} onChange={(e) => set("annee", e.target.value)}>
                    {Array.from({ length: 40 }, (_, i) => 2026 - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Kilométrage (km)</label>
                  <input className="input" type="number" value={form.kilometrage} onChange={(e) => set("kilometrage", e.target.value)} placeholder="50 000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Énergie</label>
                  <select className="input" value={form.carburant} onChange={(e) => set("carburant", e.target.value)}>
                    {["essence", "diesel", "electrique", "hybride", "hybride rechargeable", "gpl", "ethanol", "hydrogene"].map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Boîte de vitesse</label>
                  <select className="input" value={form.boite} onChange={(e) => set("boite", e.target.value)}>
                    <option value="manuelle">Manuelle</option>
                    <option value="automatique">Automatique</option>
                    <option value="semi-automatique">Semi-automatique</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Nombre de portes</label>
                  <select className="input" value={form.portes} onChange={(e) => set("portes", e.target.value)}>
                    {["2", "3", "4", "5"].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Nombre de places</label>
                  <select className="input" value={form.places} onChange={(e) => set("places", e.target.value)}>
                    {["1", "2", "4", "5", "6", "7", "8", "9"].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Catégorie</label>
                <select className="input" value={form.categorie} onChange={(e) => set("categorie", e.target.value)}>
                  {categoriesRef.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Panneau droit — Informations récupérées + aide */}
            <div className="space-y-4">
              {plateResult && (
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#111] mb-3">Informations récupérées automatiquement</h3>
                  <ul className="space-y-1.5">
                    {[
                      form.marque && `Marque : ${form.marque}`,
                      form.modele && `Modèle : ${form.modele}`,
                      form.version && `Version : ${form.version}`,
                      form.annee && `Année : ${form.annee}`,
                      form.carburant && `Énergie : ${form.carburant}`,
                      form.boite && `Boîte de vitesse : ${form.boite}`,
                    ].filter(Boolean).map((t) => (
                      <li key={t} className="flex items-center gap-2 text-sm text-[#374151]">
                        <CheckCircle size={14} className="text-green-500 shrink-0" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#111] mb-2">Besoin d'aide ?</h3>
                <p className="text-xs text-[#6B7280] mb-3">Notre équipe est là pour vous accompagner.</p>
                <button className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2" onClick={() => navigate("/aide")}>
                  <Headphones size={16} /> Assistance en ligne
                </button>
              </div>

              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#111] mb-2">Sécurisé et confidentiel</h3>
                <p className="text-xs text-[#6B7280]">Vos informations sont protégées et utilisées uniquement pour vous offrir le meilleur service.</p>
                <div className="mt-2 flex items-center gap-1 text-[#9CA3AF]">
                  <Shield size={12} /> <span className="text-[10px]">Données chiffrées SSL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex gap-3 max-w-4xl mx-auto">
            <button onClick={() => setStep(1)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#F3F4F6]">
              <ArrowLeft size={14} /> Retour
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!form.marque || !form.modele}
              className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              Continuer la vente <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          ÉTAPE 3 — DÉTAILS & PHOTOS
         ═══════════════════════════════════════ */}
      {step === 3 && (
        <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          <h1 className="text-2xl font-black text-[#111] text-center">
            DÉTAILS & <span className="text-[#D4AF37]">PHOTOS</span>
          </h1>

          {/* ── Caractéristiques techniques ── */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider mb-4">Caractéristiques techniques</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Couleur</label>
                <select className="input" value={form.couleur} onChange={(e) => set("couleur", e.target.value)}>
                  <option value="">Choisir</option>
                  {COULEURS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Sellerie</label>
                <select className="input" value={form.sellerie} onChange={(e) => set("sellerie", e.target.value)}>
                  <option value="">Choisir</option>
                  {SELLERIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Puissance (CV)</label>
                <input className="input" type="number" value={form.puissanceCv} onChange={(e) => set("puissanceCv", e.target.value)} placeholder="130" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Cylindrée</label>
                <input className="input" value={form.cylindree} onChange={(e) => set("cylindree", e.target.value)} placeholder="1598 cm³" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Consommation</label>
                <input className="input" value={form.consommation} onChange={(e) => set("consommation", e.target.value)} placeholder="5.2 L/100km" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Classe d'émission</label>
                <select className="input" value={form.classeEmission} onChange={(e) => set("classeEmission", e.target.value)}>
                  {CLASSES_EMISSION.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Vignette Crit'Air</label>
                <select className="input" value={form.critair} onChange={(e) => set("critair", e.target.value)}>
                  <option value="">Choisir</option>
                  {CRITAIRS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Équipements — checkboxes par catégorie ── */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider mb-1">Équipements et options</h3>
            <p className="text-xs text-[#9CA3AF] mb-4">Sélectionnez tous les équipements présents sur votre véhicule. {selectedEquipements.length > 0 && <span className="font-bold text-[#D4AF37]">{selectedEquipements.length} sélectionné(s)</span>}</p>

            <div className="space-y-2">
              {Object.entries(equipRef).map(([cat, items]) => (
                <div key={cat} className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F9FAFB] transition"
                    onClick={() => toggleEqCat(cat)}
                  >
                    <span className="text-sm font-bold text-[#111]">{cat}</span>
                    <div className="flex items-center gap-2">
                      {selectedEquipements.filter((e) => items.includes(e)).length > 0 && (
                        <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold text-white">
                          {selectedEquipements.filter((e) => items.includes(e)).length}
                        </span>
                      )}
                      <ChevronDown size={16} className={`text-red-500 transition-transform ${openEqCats.includes(cat) ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {openEqCats.includes(cat) && (
                    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {items.map((eq) => (
                        <label key={eq} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F5F3EF] cursor-pointer transition">
                          <input
                            type="checkbox"
                            checked={selectedEquipements.includes(eq)}
                            onChange={() => toggleEquip(eq)}
                            className="h-4 w-4 rounded border-[#D1D5DB] text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                          />
                          <span className="text-xs text-[#374151]">{eq}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Points forts ── */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider mb-3">Points forts</h3>
            <div className="flex gap-2">
              <input className="input flex-1" value={pfInput} onChange={(e) => setPfInput(e.target.value)} placeholder="Ex: Faible kilométrage, Premier propriétaire..." onKeyDown={(e) => { if (e.key === "Enter" && pfInput.trim()) { setPointsForts((prev) => [...prev, pfInput.trim()]); setPfInput(""); } }} />
              <button onClick={() => { if (pfInput.trim()) { setPointsForts((prev) => [...prev, pfInput.trim()]); setPfInput(""); } }} className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-white">+</button>
            </div>
            {pointsForts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pointsForts.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    {p} <button onClick={() => setPointsForts((arr) => arr.filter((_, j) => j !== i))} className="text-red-400 ml-1">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Imperfections ── */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider mb-3">Imperfections (optionnel)</h3>
            <div className="flex gap-2">
              <input className="input flex-1" value={impInput} onChange={(e) => setImpInput(e.target.value)} placeholder="Ex: Rayure pare-chocs, Usure pneus..." onKeyDown={(e) => { if (e.key === "Enter" && impInput.trim()) { setImperfections((prev) => [...prev, impInput.trim()]); setImpInput(""); } }} />
              <button onClick={() => { if (impInput.trim()) { setImperfections((prev) => [...prev, impInput.trim()]); setImpInput(""); } }} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white">+</button>
            </div>
            {imperfections.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {imperfections.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                    {p} <button onClick={() => setImperfections((arr) => arr.filter((_, j) => j !== i))} className="text-red-400 ml-1">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Photos par catégorie ── */}
          <div className="rounded-2xl bg-[#FFFDF5] border border-[#D4AF37]/30 p-4 flex items-start gap-2 shadow-sm">
            <Camera size={16} className="text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#111]">Photos de qualité = vente rapide</p>
              <p className="text-[10px] text-[#6B7280]">Les annonces avec 10+ photos se vendent 3x plus vite. Cliquez sur chaque emplacement.</p>
            </div>
          </div>

          {photoCatsRef.map(cat => (
            <div key={cat.key} className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wide mb-2">{cat.label}</h3>
              <div className="grid grid-cols-3 gap-2">
                {cat.slots.map(slot => {
                  const slotKey = `${cat.key}_${slot}`;
                  const url = photoUrls[slotKey];
                  return (
                    <div key={slot} className="relative aspect-square rounded-lg border-2 border-dashed border-[#D1D5DB] bg-[#FAFAFA] flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] hover:bg-[#FFFDF5] transition overflow-hidden"
                      onClick={() => {
                        if (url) return;
                        const inp = document.createElement("input");
                        inp.type = "file";
                        inp.accept = "image/*";
                        inp.onchange = async (ev) => {
                          const file = (ev.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append("files", file);
                          try {
                            const token = localStorage.getItem("token");
                            const resp = await fetch("/api/upload", { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {}, body: fd });
                            if (resp.ok) { const data = await resp.json(); if (data.files?.[0]) setPhotoUrls(p => ({ ...p, [slotKey]: data.files[0].url })); }
                          } catch {}
                        };
                        inp.click();
                      }}
                    >
                      {url ? (
                        <>
                          <img src={url} alt={slot} className="absolute inset-0 w-full h-full object-cover" />
                          <button onClick={(e) => { e.stopPropagation(); setPhotoUrls(p => { const n = { ...p }; delete n[slotKey]; return n; }); }} className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow z-10">
                            <X size={10} />
                          </button>
                        </>
                      ) : (
                        <>
                          <Camera size={16} className="text-[#D4AF37] mb-1" />
                          <span className="text-[9px] font-medium text-[#6B7280] text-center leading-tight px-1">{slot}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Compteur photos */}
          <div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <Camera size={14} className="text-[#D4AF37]" />
            <span className="text-xs text-[#374151] font-medium">{Object.keys(photoUrls).length} photo(s) ajoutée(s)</span>
            <span className="ml-auto text-[10px] font-bold text-[#D4AF37]">{Object.keys(photoUrls).length >= 10 ? "Excellent !" : Object.keys(photoUrls).length >= 5 ? "Bon score" : "Ajoutez plus de photos"}</span>
          </div>

          {/* ── Vidéos ── */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider mb-3">Vidéos (optionnel)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-[#D4AF37] mb-2">Vidéos 360° (jusqu'à 5)</p>
                <FileUpload label={`Vidéo 360° (${videos360.length}/5)`} accept="video/*" multiple maxFiles={5 - videos360.length} onUploaded={(files) => setVideos360((prev) => [...prev, ...files.map((f) => f.url)].slice(0, 5))} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#D4AF37] mb-2">Vidéos normales (jusqu'à 5)</p>
                <FileUpload label={`Vidéo (${videosNormales.length}/5)`} accept="video/*" multiple maxFiles={5 - videosNormales.length} onUploaded={(files) => setVideosNormales((prev) => [...prev, ...files.map((f) => f.url)].slice(0, 5))} />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#F3F4F6]">
              <ArrowLeft size={14} /> Retour
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] flex items-center justify-center gap-2 transition"
            >
              Continuer <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          ÉTAPE 4 — PUBLICATION
         ═══════════════════════════════════════ */}
      {step === 4 && (
        <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          <h1 className="text-2xl font-black text-[#111] text-center">
            RÉCAPITULATIF & <span className="text-[#D4AF37]">PUBLICATION</span>
          </h1>

          {/* ── Description & Prix ── */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider">Description & Prix</h3>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Titre de l'annonce</label>
              <input className="input" value={form.titre} onChange={(e) => set("titre", e.target.value)} placeholder={`${form.marque} ${form.modele} ${form.version}`.trim() || "Mon véhicule"} />
              <p className="mt-1 text-[10px] text-[#9CA3AF]">Laissez vide pour un titre automatique</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Description</label>
              <textarea className="input min-h-32" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Décrivez votre véhicule : état, équipements, historique d'entretien, raison de la vente..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">{typeAnnonce === "location" ? "Prix / jour (€) *" : "Prix de vente (€) *"}</label>
                <input className="input text-lg font-bold" type="number" value={form.prix} onChange={(e) => set("prix", e.target.value)} placeholder={typeAnnonce === "location" ? "45" : "12500"} />
              </div>
              <div className="flex items-end">
                <button
                  className="w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white hover:bg-[#333] disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={!form.marque || estimLoading}
                  onClick={estimerPrix}
                >
                  {estimLoading ? "Calcul..." : "Obtenir une estimation IA"}
                </button>
              </div>
            </div>
            {estim && (
              <div className="rounded-xl border-2 border-[#D4AF37] bg-[#FFFBEB] p-4 text-center">
                <p className="text-sm font-bold text-[#92400E]">Estimation IA MKA.P-MS</p>
                <p className="mt-1 text-2xl font-extrabold text-[#D4AF37]">{formatPrice(estim.low)} – {formatPrice(estim.high)}</p>
                <p className="mt-1 text-sm text-[#111]">Prix conseillé : <strong>{formatPrice(estim.mid)}</strong></p>
                <button className="mt-2 text-xs font-bold text-[#D4AF37] underline" onClick={() => set("prix", String(estim.mid))}>Utiliser ce prix</button>
              </div>
            )}
          </div>

          {/* ── Contact ── */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider">Coordonnées</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Ville</label>
                <input className="input" value={form.ville} onChange={(e) => set("ville", e.target.value)} placeholder="Paris" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Code postal</label>
                <input className="input" value={form.codePostal} onChange={(e) => set("codePostal", e.target.value)} placeholder="75001" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Téléphone de contact</label>
                <input className="input" value={form.contactTelephone} onChange={(e) => set("contactTelephone", e.target.value)} placeholder="+33 6 12 34 56 78" />
              </div>
            </div>
          </div>

          {/* ── Récapitulatif ── */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider mb-4">Récapitulatif</h3>
            <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <span className="font-bold text-[#111] text-lg">{form.marque} {form.modele} {form.version}</span>
                <span className="text-xl font-extrabold text-[#D4AF37]">{form.prix ? `${Number(form.prix).toLocaleString()} €` : "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {form.annee && <p><span className="text-[#6B7280]">Année :</span> {form.annee}</p>}
                {form.kilometrage && <p><span className="text-[#6B7280]">Km :</span> {Number(form.kilometrage).toLocaleString()}</p>}
                {form.carburant && <p><span className="text-[#6B7280]">Énergie :</span> {form.carburant}</p>}
                {form.boite && <p><span className="text-[#6B7280]">Boîte :</span> {form.boite}</p>}
                {form.couleur && <p><span className="text-[#6B7280]">Couleur :</span> {form.couleur}</p>}
                {form.puissanceCv && <p><span className="text-[#6B7280]">Puissance :</span> {form.puissanceCv} CV</p>}
                {form.ville && <p><span className="text-[#6B7280]">Ville :</span> {form.ville}</p>}
                {form.contactTelephone && <p><span className="text-[#6B7280]">Tél :</span> {form.contactTelephone}</p>}
              </div>
              {selectedEquipements.length > 0 && (
                <div className="pt-2 border-t border-[#E5E7EB]">
                  <p className="text-xs font-bold text-[#111] mb-1">{selectedEquipements.length} équipement(s) :</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedEquipements.slice(0, 8).map((e) => (
                      <span key={e} className="rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-medium text-[#111]">{e}</span>
                    ))}
                    {selectedEquipements.length > 8 && <span className="text-[10px] text-[#6B7280]">+{selectedEquipements.length - 8} autres</span>}
                  </div>
                </div>
              )}
              {allPhotos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-2 border-t border-[#E5E7EB]">
                  {allPhotos.map((p, i) => (
                    <img key={i} src={p} alt="" className="h-16 w-16 rounded-lg object-cover border border-[#E5E7EB] shrink-0" />
                  ))}
                </div>
              )}
              {form.description && <p className="text-sm text-[#6B7280] pt-2 border-t border-[#E5E7EB]">{form.description}</p>}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#F3F4F6]">
              <ArrowLeft size={14} /> Retour
            </button>
            <button
              onClick={submit}
              disabled={create.isPending || !form.marque || !form.modele || !form.prix}
              className="flex-1 rounded-xl bg-[#111] py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#333] disabled:opacity-50 transition"
            >
              {create.isPending ? "Publication en cours..." : "Publier l'annonce"}
            </button>
          </div>
          {create.error && <p className="text-sm text-red-600 text-center">{create.error.message}</p>}
          <p className="text-xs text-[#9CA3AF] text-center pb-6">
            Des options de mise en avant (Boost, Premium) seront proposées après la publication.
          </p>
        </div>
      )}
    </div>
  );
}
