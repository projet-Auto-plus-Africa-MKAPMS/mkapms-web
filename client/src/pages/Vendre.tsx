import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getAnnonceUrl } from "../lib/annonceUrl";
import { ALL_BRANDS_AUTO, getModelsForBrand, getVersionsForModel, getVersionSpec } from "../lib/vehicleData";
import {
  Search, Camera, CheckCircle, Shield, Eye, Zap, Lock,
  ChevronRight, ChevronDown, Upload, Star, Car, Bike, Truck, Bus,
  Headphones, FileText, ArrowLeft, ArrowRight, Info, X, Video,
  Crown, Building2, User as UserIcon, ClipboardList, Pencil,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth, getToken } from "../lib/auth";
import { normalizeImages } from "../lib/imageUpload";
import { readPhotoDraft, clearPhotoDraft } from "../lib/photoDraft";
import { useLearnedValues, mergeWithLearned } from "../lib/learnedValues";
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

const MARQUES_AUTO = [...ALL_BRANDS_AUTO, "Autre"].filter((v, i, a) => a.indexOf(v) === i);
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

/* ─────────────────────────────────────────────────────────────────────────
 * DÉTECTION AUTOMATIQUE DE L'UNIVERS DE LOCATION
 * Le vendeur ne choisit rien manuellement : on déduit le mode véhicule
 * à partir de la categorieAnnonce (officielle/pro/particulier) et de la
 * catégorie du véhicule choisie (Utilitaire, Camping-car, Minibus, etc.).
 * ───────────────────────────────────────────────────────────────────────── */
type LocationMode = "particulier" | "pro" | "utilitaires" | "camions" | "minibus" | "mkapms" | "vtc_taxi";

function detectLocationMode(
  categorieAnnonce: "officielle" | "professionnelle" | "particulier",
  categorie: string | undefined | null,
  segmentLocation?: string,
): LocationMode {
  if (segmentLocation === "vtc_taxi") return "vtc_taxi";
  if (categorieAnnonce === "officielle") return "mkapms";
  const c = (categorie ?? "").toLowerCase();
  if (c.includes("minibus")) return "minibus";
  if (c.includes("utilitaire") || c.includes("camping-car")) return "utilitaires";
  if (c.includes("camion") || c.includes("pick-up")) return "camions";
  if (categorieAnnonce === "professionnelle") return "pro";
  return "particulier";
}

const LOCATION_MODE_CONFIG: Record<LocationMode, {
  label: string;
  emoji: string;
  color: string;
  kmDefault: number;
  extras: Array<"assurance" | "tva" | "hayon" | "chauffeur" | "places_permis" | "entretien">;
}> = {
  particulier: { label: "Particulier", emoji: "👤", color: "#D4AF37", kmDefault: 200, extras: ["assurance"] },
  pro: { label: "Pro / Entreprise", emoji: "💼", color: "#3B82F6", kmDefault: 300, extras: ["assurance", "tva"] },
  utilitaires: { label: "Utilitaires", emoji: "🚐", color: "#F97316", kmDefault: 100, extras: ["assurance", "hayon"] },
  camions: { label: "Camions", emoji: "🚛", color: "#DC2626", kmDefault: 150, extras: ["assurance", "chauffeur"] },
  minibus: { label: "Minibus", emoji: "🚌", color: "#0EA5E9", kmDefault: 200, extras: ["assurance", "places_permis"] },
  mkapms: { label: "MKAPMS Officiel", emoji: "⭐", color: "#111", kmDefault: 200, extras: ["assurance", "entretien"] },
  vtc_taxi: { label: "VTC / Taxi", emoji: "🚕", color: "#F59E0B", kmDefault: 400, extras: ["assurance"] },
};

const COULEURS = [
  "Noir", "Blanc", "Gris", "Argent", "Bleu", "Rouge", "Vert", "Beige",
  "Marron", "Orange", "Jaune", "Bordeaux", "Violet", "Rose", "Or", "Autre",
];

const SELLERIES = ["Tissu", "Cuir", "Cuir partiel", "Alcantara", "Simili cuir", "Mixte tissu/cuir"];
const CLASSES_EMISSION = ["EURO 1", "EURO 2", "EURO 3", "EURO 4", "EURO 5", "EURO 6", "EURO 6d", "EURO 6d-TEMP", "EURO 7"];
const CRITAIRS = ["Crit'Air 0 (électrique)", "Crit'Air 1", "Crit'Air 2", "Crit'Air 3", "Crit'Air 4", "Crit'Air 5"];

/* ── Photo categories (1 case par catégorie, aligné avec page produit) ── */
const PHOTO_CATS_AUTO = [
  { key: "exterieur", label: "Extérieur" },
  { key: "interieur", label: "Intérieur" },
  { key: "sieges", label: "Sièges" },
  { key: "tableau_de_bord", label: "Tableau de bord" },
  { key: "coffre", label: "Coffre" },
  { key: "moteur", label: "Moteur" },
  { key: "roues", label: "Roues" },
  { key: "documents", label: "Documents" },
  { key: "autres", label: "Autres" },
];
const PHOTO_CATS_MOTO_V = [
  { key: "exterieur", label: "Extérieur" },
  { key: "interieur", label: "Intérieur" },
  { key: "moteur", label: "Moteur" },
  { key: "roues", label: "Roues" },
  { key: "documents", label: "Documents" },
  { key: "autres", label: "Autres" },
];

export default function Vendre() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit") ? Number(searchParams.get("edit")) : null;
  const { format: formatPrice } = useCurrency();
  const utils = trpc.useUtils();

  /* ── Mode : landing (page vitrine) vs deposit (flux 4 étapes) ── */
  const [mode, setMode] = useState<"landing" | "deposit">(editId ? "deposit" : "landing");
  const [step, setStep] = useState(1);
  const [identTab, setIdentTab] = useState<"plaque" | "vin">("plaque");
  const [plaque, setPlaque] = useState("");
  const [vin, setVin] = useState("");
  const [plateLoading, setPlateLoading] = useState(false);
  const [plateResult, setPlateResult] = useState<any>(null);

  /* ── Formulaire complet ── */
  const [typeAnnonce, setTypeAnnonce] = useState<"vente" | "location">("vente");
  const [onBehalfOfEmail, setOnBehalfOfEmail] = useState("");
  const [famille, setFamille] = useState<"auto" | "moto">("auto");
  const [form, setForm] = useState({
    titre: "", marque: "", modele: "", version: "",
    annee: "2024", kilometrage: "", prix: "",
    // Multi-tarifs location (utilisés uniquement si typeAnnonce === "location")
    // Les 3 tarifs intermédiaires (3 jours, 2 semaines, 3 mois) sont
    // calculés automatiquement côté affichage à partir de ces 3 valeurs.
    prixJour: "", prixSemaine: "", prixMois: "",
    kmInclusJour: "200",
    assuranceIncluse: "1",
    // Segment location : "particulier" | "professionnel" | "vtc_taxi"
    // Une case à cocher VTC/Taxi côté UI active la valeur "vtc_taxi".
    segmentLocation: "",
    carburant: "essence", boite: "manuelle",
    categorie: "berline",
    ville: "", codePostal: "", contactTelephone: "",
    description: "",
    couleur: "", sellerie: "",
    portes: "5", places: "5",
    cylindree: "", puissanceCv: "",
    consommation: "", classeEmission: "EURO 6",
    critair: "",
    typeBatterie: "", etatBatterie: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string[]>>({});
  const [videos360, setVideos360] = useState<string[]>([]);
  const [videosNormales, setVideosNormales] = useState<string[]>([]);
  const [selectedEquipements, setSelectedEquipements] = useState<string[]>([]);
  const [pointsForts, setPointsForts] = useState<string[]>([]);
  const [pfInput, setPfInput] = useState("");
  const [imperfections, setImperfections] = useState<string[]>([]);
  const [impInput, setImpInput] = useState("");
  // Garanties (professionnel / officiel MKA.P-MS uniquement) — cases à cocher + durée.
  type GarantieItem = { type: string; duree?: string; statut?: string };
  const [garanties, setGaranties] = useState<GarantieItem[]>([]);
  const [customGarantieInput, setCustomGarantieInput] = useState("");
  const [openEqCats, setOpenEqCats] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingCats, setUploadingCats] = useState<Record<string, boolean>>({});
  const photoInputs = useRef<Record<string, HTMLInputElement | null>>({});

  // Reprise des photos envoyées depuis l'écran de guidage photo du portail :
  // cet écran ne publie pas l'annonce, ses photos seraient sinon perdues.
  const draftTaken = useRef(false);
  useEffect(() => {
    if (draftTaken.current) return;
    const draft = readPhotoDraft();
    const cats = Object.keys(draft);
    if (!cats.length) return;
    draftTaken.current = true;
    setPhotoUrls(p => {
      const next = { ...p };
      for (const cat of cats) next[cat] = [...(next[cat] || []), ...draft[cat]];
      return next;
    });
    clearPhotoDraft();
  }, []);

  const uploadPhotos = useCallback(async (catKey: string, files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploadingCats(p => ({ ...p, [catKey]: true }));
    setUploadError(null);
    try {
      const prepared = await normalizeImages(list);
      const fd = new FormData();
      for (const f of prepared) fd.append("files", f);
      const token = getToken();
      const resp = await fetch("/api/upload", { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {}, body: fd });
      if (resp.ok) {
        const data = await resp.json();
        const urls = ((data.files || []) as { url: string }[]).map(f => f.url);
        setPhotoUrls(p => ({ ...p, [catKey]: [...(p[catKey] || []), ...urls] }));
        // Envoi partiel : les photos valides sont conservées,
        // on nomme précisément celles qui ont été refusées.
        const rejected = (data.errors || []) as { originalName: string; error: string }[];
        if (rejected.length) setUploadError(rejected.map(r => `${r.originalName} : ${r.error}`).join(" ; "));
      } else {
        const err = await resp.json().catch(() => ({}));
        setUploadError(err.error || "Erreur lors de l'upload des photos");
      }
    } catch (e) {
      setUploadError((e as Error).message || "Erreur réseau lors de l'upload");
    } finally {
      setUploadingCats(p => ({ ...p, [catKey]: false }));
    }
  }, []);

  /* Catégorie d'annonce (admin/employee only) */
  const isAdminOrEmployee = user?.role === "admin" || user?.role === "super_admin" || user?.role === "employee";
  const [categorieAnnonce, setCategorieAnnonce] = useState<"officielle" | "professionnelle" | "particulier">(
    isAdminOrEmployee ? "officielle" : (user?.accountType === "professionnel" ? "professionnelle" : "particulier")
  );

  /* Estimation */
  const [estim, setEstim] = useState<{ low: number; mid: number; high: number; method: string; sampleSize: number } | null>(null);
  const [estimLoading, setEstimLoading] = useState(false);

  const maxPhotos = user?.accountType === "professionnel" ? 20 : 4;
  const isPro = user?.accountType === "professionnel" || user?.role === "admin" || user?.role === "directeur";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isEmployee = isAdmin || user?.role === "employee";

  useEffect(() => {
    if (isAdmin) setCategorieAnnonce("officielle");
    else if (isPro) setCategorieAnnonce("professionnelle");
    else setCategorieAnnonce("particulier");
  }, [isAdmin, isPro]);

  // Pré-sélection depuis le compte : /vendre?depot=1&famille=..&categorie=..&type=..
  // (le choix du type de véhicule est fait en amont dans l'espace compte).
  const depotParamApplied = useRef(false);
  useEffect(() => {
    if (depotParamApplied.current || editId) return;
    const depot = searchParams.get("depot");
    const fam = searchParams.get("famille");
    const cat = searchParams.get("categorie");
    const typ = searchParams.get("type");
    if (!depot && !fam && !cat && !typ) return;
    depotParamApplied.current = true;
    if (fam === "moto" || fam === "auto") setFamille(fam);
    if (cat) setForm((f) => ({ ...f, categorie: cat }));
    // Location réservée aux pros/admin ; un particulier ne peut pas déposer en location.
    if (typ === "location" && (isPro || isAdmin)) setTypeAnnonce("location");
    else setTypeAnnonce("vente");
    if (user) { setMode("deposit"); setStep(1); }
  }, [searchParams, editId, isPro, isAdmin, user]);

  /* ── Mode édition : pré-remplir le formulaire avec les données existantes ── */
  const [editLoaded, setEditLoaded] = useState(false);
  const editQuery = trpc.annonces.get.useQuery({ id: editId! }, { enabled: !!editId && !editLoaded });
  useEffect(() => {
    if (!editId || editLoaded || !editQuery.data) return;
    const d = editQuery.data as any;
    setForm({
      titre: d.titre || "",
      marque: d.marque || "",
      modele: d.modele || "",
      version: d.version || "",
      annee: d.annee ? String(d.annee) : "2024",
      kilometrage: d.kilometrage ? String(d.kilometrage) : "",
      prix: d.prix ? String(Number(d.prix)) : "",
      // Multi-tarifs location — pré-remplissage lors de l'édition d'une annonce location
      prixJour: d.prixJour ? String(Number(d.prixJour)) : "",
      prixSemaine: d.prixSemaine ? String(Number(d.prixSemaine)) : "",
      prixMois: d.prixMois ? String(Number(d.prixMois)) : "",
      kmInclusJour: "200",
      assuranceIncluse: "1",
      carburant: d.carburant || "essence",
      boite: d.boite || "manuelle",
      categorie: d.categorie || "berline",
      ville: d.ville || "",
      codePostal: d.codePostal || "",
      contactTelephone: d.contactTelephone || "",
      description: d.description || "",
      couleur: d.couleur || "",
      sellerie: d.sellerie || "",
      portes: d.portes ? String(d.portes) : "5",
      places: d.places ? String(d.places) : "5",
      cylindree: d.cylindree || "",
      puissanceCv: d.puissanceCv ? String(d.puissanceCv) : "",
      consommation: d.consommation || "",
      classeEmission: d.classeEmission || "EURO 6",
      critair: "",
      typeBatterie: d.typeBatterie || "",
      etatBatterie: d.etatBatterie ? String(d.etatBatterie) : "",
    });
    if (d.famille) setFamille(d.famille);
    if (d.type) setTypeAnnonce(d.type);
    if (d.pointsForts?.length) setPointsForts(d.pointsForts);
    // Restaurer TOUS les équipements enregistrés, quelle que soit la colonne
    // (equipements + confort + multimédia + sécurité). Auparavant seul
    // `equipements` était relu, donc Confort/Multimédia/Sécurité disparaissaient.
    const allEquip = [
      ...(d.equipements ?? []),
      ...(d.confort ?? []),
      ...(d.multimedia ?? []),
      ...(d.securite ?? []),
    ].filter((x: unknown): x is string => typeof x === "string" && x.length > 0);
    if (allEquip.length) setSelectedEquipements(Array.from(new Set(allEquip)));
    if (d.imperfections?.length) setImperfections(d.imperfections);
    if (Array.isArray(d.garanties) && d.garanties.length) setGaranties(d.garanties);
    if (d.categorieAnnonce) setCategorieAnnonce(d.categorieAnnonce);
    if (d.photos?.length) {
      const grouped: Record<string, string[]> = {};
      for (const p of d.photos) {
        const cat = p.categorie || "autres";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(p.url);
      }
      setPhotoUrls(grouped);
    }
    setEditLoaded(true);
  }, [editId, editLoaded, editQuery.data]);

  // Hero carousel pour landing page
  const HERO_VIDEOS_VENDRE = [
    { src: "/videos/vendre/vendre_hero1.mp4", label: "Annonce" },
    { src: "/videos/vendre/vendre_hero2.mp4", label: "Photos" },
    { src: "/videos/vendre/vendre_hero3.mp4", label: "Publication" },
    { src: "/videos/vendre/vendre_hero4.mp4", label: "Contact" },
    { src: "/videos/vendre/vendre_hero5.mp4", label: "Vente" },
  ];
  const [heroIdxV, setHeroIdxV] = useState(0);
  const [heroProgressV, setHeroProgressV] = useState(0);
  const progressRefV = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRefsV = useRef<(HTMLVideoElement | null)[]>([]);
  useEffect(() => {
    if (progressRefV.current) clearInterval(progressRefV.current);
    setHeroProgressV(0);
    const step = 100 / (8000 / 50);
    progressRefV.current = setInterval(() => {
      setHeroProgressV((p) => {
        if (p + step >= 100) {
          setHeroIdxV((i) => (i + 1) % HERO_VIDEOS_VENDRE.length);
          return 0;
        }
        return p + step;
      });
    }, 50);
    return () => { if (progressRefV.current) clearInterval(progressRefV.current); };
  }, [heroIdxV]);
  useEffect(() => {
    videoRefsV.current.forEach((v, i) => {
      if (!v) return;
      if (i === heroIdxV) { v.currentTime = 0; v.play().catch(() => {}); }
      else { v.pause(); }
    });
  }, [heroIdxV]);

  const equipRef = famille === "moto" ? EQUIPEMENTS_MOTO : EQUIPEMENTS_AUTO;
  const marquesRef = famille === "moto" ? MARQUES_MOTO : MARQUES_AUTO;
  const categoriesRef = famille === "moto" ? CATEGORIES_MOTO : CATEGORIES_AUTO;
  const photoCatsRef = famille === "moto" ? PHOTO_CATS_MOTO_V : PHOTO_CATS_AUTO;

  /* ── Recherche marque ── */
  const [marqueSearch, setMarqueSearch] = useState("");
  const [marqueDropdownOpen, setMarqueDropdownOpen] = useState(false);
  const marqueDropdownRef = useRef<HTMLDivElement>(null);
  const marqueInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (marqueDropdownRef.current && !marqueDropdownRef.current.contains(e.target as Node)) {
        setMarqueDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const filteredMarques = useMemo(() => {
    if (!marqueSearch.trim()) return marquesRef;
    const q = marqueSearch.toLowerCase().trim();
    return marquesRef.filter((m: string) => m.toLowerCase().includes(q));
  }, [marqueSearch, marquesRef]);
  const selectMarque = useCallback((m: string) => {
    set("marque", m);
    set("modele", "");
    set("version", "");
    setVersionAutre(false);
    setMarqueSearch("");
    setMarqueDropdownOpen(false);
  }, []);

  /* ── Listes de modèles/versions dynamiques selon marque/modèle ── */
  const availableModels = useMemo(() => famille === "auto" && form.marque && form.marque !== "Autre" ? getModelsForBrand(form.marque) : [], [form.marque, famille]);
  const catalogueVersions = useMemo(() => famille === "auto" && form.marque && form.modele ? getVersionsForModel(form.marque, form.modele) : [], [form.marque, form.modele, famille]);
  // Versions retenues par le Système Intelligent : elles complètent le
  // catalogue, qui ne peut pas connaître toutes les versions du monde.
  const learnedVersions = useLearnedValues("version", form.marque, form.modele);
  const availableVersions = useMemo(
    () =>
      mergeWithLearned(catalogueVersions.map((v) => v.name), learnedVersions).map((name) => ({
        name,
        puissanceCv: catalogueVersions.find((v) => v.name === name)?.puissanceCv,
        apprise: !catalogueVersions.some((v) => v.name === name),
      })),
    [catalogueVersions, learnedVersions],
  );
  const [versionAutre, setVersionAutre] = useState(false);

  /* ── Auto-fill specs quand la version change ── */
  useEffect(() => {
    if (famille !== "auto" || !form.marque || !form.modele || !form.version) return;
    const spec = getVersionSpec(form.marque, form.modele, form.version);
    if (spec) {
      setForm(f => ({
        ...f,
        puissanceCv: spec.puissanceCv ? String(spec.puissanceCv) : f.puissanceCv,
        cylindree: spec.cylindree || f.cylindree,
        consommation: spec.consommation || f.consommation,
      }));
    }
  }, [form.marque, form.modele, form.version, famille]);

  /* ── Ville → Code postal auto ── */
  const [villeSuggestions, setVilleSuggestions] = useState<{nom: string; codePostal: string}[]>([]);
  const [villeDropdownOpen, setVilleDropdownOpen] = useState(false);
  const villeDropdownRef = useRef<HTMLDivElement>(null);
  const villeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    function handleClickOutsideVille(e: MouseEvent) {
      if (villeDropdownRef.current && !villeDropdownRef.current.contains(e.target as Node)) {
        setVilleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideVille);
    return () => document.removeEventListener("mousedown", handleClickOutsideVille);
  }, []);
  const handleVilleChange = useCallback((val: string) => {
    set("ville", val);
    if (villeTimerRef.current) clearTimeout(villeTimerRef.current);
    if (val.trim().length < 2) { setVilleSuggestions([]); setVilleDropdownOpen(false); return; }
    villeTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(val.trim())}&fields=nom,codesPostaux&boost=population&limit=8`);
        if (!res.ok) return;
        const data = await res.json();
        const suggestions: {nom: string; codePostal: string}[] = [];
        for (const c of data) {
          if (c.codesPostaux && c.codesPostaux.length > 0) {
            suggestions.push({ nom: c.nom, codePostal: c.codesPostaux[0] });
          }
        }
        setVilleSuggestions(suggestions);
        setVilleDropdownOpen(suggestions.length > 0);
      } catch { /* ignore network errors */ }
    }, 300);
  }, []);
  const selectVille = useCallback((nom: string, codePostal: string) => {
    set("ville", nom);
    set("codePostal", codePostal);
    setVilleSuggestions([]);
    setVilleDropdownOpen(false);
  }, []);

  /* ── Téléphone du compte ── */
  const [useAccountPhone, setUseAccountPhone] = useState(false);
  useEffect(() => {
    if (useAccountPhone && user?.phone) {
      setForm(f => ({ ...f, contactTelephone: user.phone! }));
    }
  }, [useAccountPhone, user?.phone]);

  const totalPhotos = useMemo(() => Object.values(photoUrls).reduce((acc, arr) => acc + arr.length, 0), [photoUrls]);

  // Derive flat photos array from categorized photoUrls (with category info for DB)
  const allPhotos = useMemo(() => Object.entries(photoUrls).flatMap(([cat, urls]) => urls.map(url => ({ url, categorie: cat }))), [photoUrls]);
  const allPhotoUrls = useMemo(() => Object.values(photoUrls).flat(), [photoUrls]);

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
    onSuccess: (a) => navigate(getAnnonceUrl(a.id, (a as any).categorieAnnonce, (a as any).vendeurType)),
  });

  const updateMut = trpc.annonces.update.useMutation({
    onSuccess: () => navigate(getAnnonceUrl(editId!, categorieAnnonce, categorieAnnonce === "particulier" ? "particulier" : "professionnel")),
  });

  function submit() {
    const confortList = selectedEquipements.filter((e) => (equipRef["Confort"] || []).includes(e));
    const multiList = selectedEquipements.filter((e) => (equipRef["Multimédia & Connectivité"] || equipRef["Multimédia & Connectivité"] || []).includes(e));
    const secuList = selectedEquipements.filter((e) => (equipRef["Sécurité"] || []).includes(e));
    const restList = selectedEquipements.filter((e) => !confortList.includes(e) && !multiList.includes(e) && !secuList.includes(e));

    if (editId) {
      updateMut.mutate({
        id: editId,
        titre: form.titre || `${form.marque} ${form.modele}`.trim(),
        marque: form.marque || undefined,
        modele: form.modele || undefined,
        version: form.version || undefined,
        annee: form.annee ? Number(form.annee) : undefined,
        kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
        prix: form.prix ? Number(form.prix) : undefined,
        // Multi-tarifs location — envoyés uniquement pour typeAnnonce=location
        prixJour: typeAnnonce === "location" && form.prixJour ? Number(form.prixJour) : undefined,
        prixSemaine: typeAnnonce === "location" && form.prixSemaine ? Number(form.prixSemaine) : undefined,
        prixMois: typeAnnonce === "location" && form.prixMois ? Number(form.prixMois) : undefined,
        segmentLocation: typeAnnonce === "location" && form.segmentLocation === "vtc_taxi" ? "vtc_taxi" as const : undefined,
        carburant: form.carburant || undefined,
        boite: form.boite || undefined,
        categorie: form.categorie || undefined,
        ville: form.ville || undefined,
        codePostal: form.codePostal || undefined,
        contactTelephone: form.contactTelephone || undefined,
        description: form.description || undefined,
        photos: allPhotos.length > 0 ? allPhotos : undefined,
        couleur: form.couleur || undefined,
        portes: form.portes ? Number(form.portes) : undefined,
        places: form.places ? Number(form.places) : undefined,
        sellerie: form.sellerie || undefined,
        cylindree: form.cylindree || undefined,
        puissanceCv: form.puissanceCv ? Number(form.puissanceCv) : undefined,
        consommation: form.consommation || undefined,
        classeEmission: form.classeEmission || undefined,
        pointsForts: pointsForts.length > 0 ? pointsForts : undefined,
        // Envoyés systématiquement (même vides) pour refléter les retraits et
        // ne plus perdre Confort / Multimédia / Sécurité à la modification.
        equipements: restList,
        confort: confortList,
        multimedia: multiList,
        securite: secuList,
        imperfections: imperfections.length > 0 ? imperfections : undefined,
        garanties: garanties.length > 0 ? garanties : undefined,
        typeBatterie: form.typeBatterie || undefined,
        etatBatterie: form.etatBatterie ? Number(form.etatBatterie) : undefined,
        categorieAnnonce: isAdminOrEmployee ? categorieAnnonce : undefined,
        status: "publiee",
      });
    } else {
      create.mutate({
        type: typeAnnonce,
        titre: form.titre || `${form.marque} ${form.modele}`.trim(),
        marque: form.marque,
        modele: form.modele,
        version: form.version || undefined,
        annee: form.annee ? Number(form.annee) : undefined,
        kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
        prix: form.prix ? Number(form.prix) : 0,
        // Multi-tarifs location — envoyés uniquement pour typeAnnonce=location
        prixJour: typeAnnonce === "location" && form.prixJour ? Number(form.prixJour) : undefined,
        prixSemaine: typeAnnonce === "location" && form.prixSemaine ? Number(form.prixSemaine) : undefined,
        prixMois: typeAnnonce === "location" && form.prixMois ? Number(form.prixMois) : undefined,
        segmentLocation: typeAnnonce === "location" && form.segmentLocation === "vtc_taxi" ? "vtc_taxi" as const : undefined,
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
        garanties,
        confort: confortList,
        multimedia: multiList,
        securite: secuList,
        videos360,
        videosNormales,
        typeBatterie: form.typeBatterie || undefined,
        etatBatterie: form.etatBatterie ? Number(form.etatBatterie) : undefined,
        categorieAnnonce: isAdminOrEmployee ? categorieAnnonce : undefined,
      });
    }
  }

  /* ════════════════════════════════════════════════════════════
     LANDING PAGE — Page vitrine Vendre
     ════════════════════════════════════════════════════════════ */
  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-[#F5F3EF]">
        {/* ── HERO PREMIUM VIDÉO CAROUSEL ── */}
        <div className="relative overflow-hidden bg-[#111]" style={{ height: "72vw", maxHeight: 420, minHeight: 280 }}>
          {/* Vidéos préchargées */}
          {HERO_VIDEOS_VENDRE.map((v, i) => (
            <video
              key={i}
              ref={(el) => { videoRefsV.current[i] = el; }}
              src={v.src}
              muted
              playsInline
              loop
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              style={{ opacity: i === heroIdxV ? 1 : 0 }}
            />
          ))}
          {/* Overlay sombre */}
          <div className="absolute inset-0 bg-black/55" />
          {/* Badge */}
          <div className="absolute top-4 left-0 right-0 z-10 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider backdrop-blur">
              <Upload size={12} /> Vendre votre véhicule
            </span>
          </div>
          {/* Titre + Sous-titre + Stats — bloc vertical centré */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 pt-10 pb-12 gap-2">
            <h1 className="text-[26px] md:text-3xl font-black text-white leading-tight text-center">
              Vendez facilement<br />
              votre <span className="text-[#D4AF37]">véhicule</span>
            </h1>
            <p className="text-sm text-white/70 leading-relaxed max-w-sm mx-auto text-center">
              Particulier ou professionnel — déposez votre annonce en quelques minutes.
            </p>
            {/* Stats */}
            <div className="flex items-center justify-center gap-2 flex-nowrap w-full mt-1">
              {[
                { val: "+120 000", label: "acheteurs actifs" },
                { val: "100%", label: "gratuit particuliers" },
                { val: "4,8/5", label: "satisfaction vendeurs" },
              ].map((s) => (
                <div key={s.val} className="flex flex-col items-center rounded-xl bg-white/10 backdrop-blur px-3 py-2 border border-white/10 flex-1 min-w-0">
                  <span className="text-sm font-black text-[#D4AF37] whitespace-nowrap">{s.val}</span>
                  <span className="text-[9px] text-white/60 mt-0.5 text-center leading-tight">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Indicateurs barre de progression */}
          <div className="absolute bottom-3 left-0 right-0 z-20 px-4">
            <div className="flex gap-1.5 justify-center mb-1">
              {HERO_VIDEOS_VENDRE.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIdxV(i)}
                  className="relative h-[3px] rounded-full overflow-hidden bg-white/30 flex-1 max-w-[60px]"
                  title={v.label}
                >
                  <div
                    className="absolute left-0 top-0 h-full bg-[#D4AF37] transition-none"
                    style={{ width: i === heroIdxV ? `${heroProgressV}%` : i < heroIdxV ? "100%" : "0%" }}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 justify-center">
              {HERO_VIDEOS_VENDRE.map((v, i) => (
                <span key={i} className={`flex-1 max-w-[60px] text-center text-[8px] font-semibold truncate ${
                  i === heroIdxV ? "text-[#D4AF37]" : "text-white/40"
                }`}>{v.label}</span>
              ))}
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
        <div className="max-w-4xl lg:max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo FERMÉ (Version 1 – Terre) : surface interne */}
            <img src="/logo-closed.png" alt="MKA.P-MS" className="h-8 w-auto" draggable={false} />
            <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              La marketplace automobile
            </span>
          </div>
        </div>
      </div>

      {/* ── Bandeau mode édition ── */}
      {editId && (
        <div className="bg-[#FFFBEB] border-b border-[#D4AF37]/30 px-4 py-3 text-center">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#D4AF37]">
            <Pencil size={14} /> Modification de l'annonce
          </span>
        </div>
      )}

      {/* ── Stepper 4 étapes ── */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-4">
        <div className="max-w-4xl lg:max-w-3xl mx-auto flex items-center justify-center gap-2 md:gap-4">
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
      <div className="max-w-4xl lg:max-w-3xl mx-auto px-4 mt-4">
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
        <div className="max-w-4xl lg:max-w-3xl mx-auto px-4 mt-6">
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
              {/* Sélecteur catégorie annonce (admin/employee only) */}
              {isAdminOrEmployee && (
                <div className="mb-4 rounded-xl border-2 border-[#D4AF37]/30 bg-[#FFFBEB] p-3">
                  <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider mb-2 block">Publier en tant que</label>
                  <div className="flex gap-2">
                    <button onClick={() => setCategorieAnnonce("officielle")} className={`flex-1 rounded-lg border-2 p-2 text-center text-xs font-bold transition ${categorieAnnonce === "officielle" ? "border-[#D4AF37] bg-[#D4AF37] text-white" : "border-[#E5E7EB] bg-white text-[#6B7280]"}`}>Officielle MKA.P-MS</button>
                    <button onClick={() => setCategorieAnnonce("professionnelle")} className={`flex-1 rounded-lg border-2 p-2 text-center text-xs font-bold transition ${categorieAnnonce === "professionnelle" ? "border-blue-500 bg-blue-500 text-white" : "border-[#E5E7EB] bg-white text-[#6B7280]"}`}>Professionnelle</button>
                    <button onClick={() => setCategorieAnnonce("particulier")} className={`flex-1 rounded-lg border-2 p-2 text-center text-xs font-bold transition ${categorieAnnonce === "particulier" ? "border-green-500 bg-green-500 text-white" : "border-[#E5E7EB] bg-white text-[#6B7280]"}`}>Particulier</button>
                  </div>
                </div>
              )}

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
        <div className="max-w-4xl lg:max-w-3xl mx-auto px-4 mt-6">
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
                <div ref={marqueDropdownRef} className="relative">
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Marque *</label>
                  <div
                    className="input flex items-center cursor-pointer"
                    onClick={() => { setMarqueDropdownOpen(!marqueDropdownOpen); setTimeout(() => marqueInputRef.current?.focus(), 50); }}
                  >
                    <span className={form.marque ? "text-[#111]" : "text-[#9CA3AF]"}>{form.marque || "Choisir"}</span>
                    <ChevronDown className="ml-auto h-4 w-4 text-[#9CA3AF]" />
                  </div>
                  {marqueDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl bg-white border border-[#E5E7EB] shadow-lg max-h-64 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-[#E5E7EB]">
                        <div className="flex items-center gap-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-2">
                          <Search className="h-4 w-4 text-[#9CA3AF]" />
                          <input
                            ref={marqueInputRef}
                            type="text"
                            value={marqueSearch}
                            onChange={(e) => setMarqueSearch(e.target.value)}
                            placeholder="Rechercher une marque..."
                            className="w-full bg-transparent text-sm outline-none placeholder-[#9CA3AF]"
                            autoFocus
                          />
                          {marqueSearch && (
                            <button onClick={() => setMarqueSearch("")} className="text-[#9CA3AF] hover:text-[#374151]">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="overflow-y-auto max-h-48">
                        {filteredMarques.length === 0 ? (
                          <p className="p-3 text-xs text-[#9CA3AF] text-center">Aucune marque trouvée</p>
                        ) : (
                          filteredMarques.map((m: string) => (
                            <button
                              key={m}
                              onClick={() => selectMarque(m)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#FFFBEB] hover:text-[#D4AF37] transition ${
                                form.marque === m ? "bg-[#FFFBEB] text-[#D4AF37] font-semibold" : "text-[#374151]"
                              }`}
                            >
                              {m}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Modèle *</label>
                  {famille === "auto" && availableModels.length > 0 ? (
                    <select className="input" value={form.modele} onChange={(e) => { set("modele", e.target.value); set("version", ""); setVersionAutre(false); }}>
                      <option value="">Choisir</option>
                      {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
                      <option value="__autre">Autre modèle</option>
                    </select>
                  ) : (
                    <input className="input" value={form.modele} onChange={(e) => set("modele", e.target.value)} placeholder="Ex : 308, Clio..." />
                  )}
                  {form.modele === "__autre" && (
                    <input className="input mt-2" value="" onChange={(e) => set("modele", e.target.value)} placeholder="Saisir le modèle..." autoFocus />
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Version</label>
                {famille === "auto" && availableVersions.length > 0 && !versionAutre ? (
                  <select className="input" value={form.version} onChange={(e) => {
                    if (e.target.value === "__autre") {
                      setVersionAutre(true);
                      set("version", "");
                    } else {
                      set("version", e.target.value);
                    }
                  }}>
                    <option value="">Choisir</option>
                    {availableVersions.map((v) => <option key={v.name} value={v.name}>{v.name}{v.puissanceCv ? ` (${v.puissanceCv} CV)` : v.apprise ? " — mémorisée" : ""}</option>)}
                    <option value="__autre">Autre version</option>
                  </select>
                ) : (
                  <input className="input" value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="Ex : GT Line, RS, Active..." />
                )}
                {versionAutre && (
                  <button type="button" onClick={() => { setVersionAutre(false); set("version", ""); }} className="mt-1 text-xs text-[#D4AF37] hover:underline">← Revenir à la liste</button>
                )}
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

              {/* Batterie — visible pour hybride, électrique, hybride rechargeable */}
              {(form.carburant === "electrique" || form.carburant === "hybride" || form.carburant === "hybride rechargeable") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Type de batterie</label>
                    <select className="input" value={form.typeBatterie} onChange={(e) => set("typeBatterie", e.target.value)}>
                      <option value="">— Choisir —</option>
                      <option value="electrique">100% Électrique</option>
                      <option value="hybride">Hybride</option>
                      <option value="hybride_rechargeable">Hybride rechargeable</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#6B7280]">État batterie (%)</label>
                    <input type="number" min="0" max="100" className="input" placeholder="ex: 97" value={form.etatBatterie} onChange={(e) => set("etatBatterie", e.target.value)} />
                  </div>
                </div>
              )}

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
          <div className="mt-6 flex gap-3 max-w-4xl lg:max-w-3xl mx-auto">
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
        <div className="max-w-4xl lg:max-w-3xl mx-auto px-4 mt-6 space-y-6">
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
                <select className="input" value={form.puissanceCv} onChange={(e) => set("puissanceCv", e.target.value)}>
                  <option value="">Choisir</option>
                  {[50,60,65,70,75,80,85,90,95,100,105,110,115,120,125,130,135,140,145,150,155,160,165,170,175,180,185,190,195,200,210,220,225,230,240,245,250,260,265,270,280,286,290,300,310,320,330,340,350,360,370,380,390,400,420,440,450,460,470,480,490,500,510,520,530,540,550,560,575,580,600,620,640,650,660,670,680,700,750,800,850,900,1000,1020].map(cv => (
                    <option key={cv} value={cv}>{cv} CV</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Cylindrée</label>
                <select className="input" value={form.cylindree} onChange={(e) => set("cylindree", e.target.value)}>
                  <option value="">Choisir</option>
                  {["Électrique","660 cm³","799 cm³","898 cm³","999 cm³","998 cm³","1049 cm³","1124 cm³","1193 cm³","1197 cm³","1199 cm³","1242 cm³","1332 cm³","1353 cm³","1373 cm³","1395 cm³","1396 cm³","1461 cm³","1482 cm³","1490 cm³","1496 cm³","1497 cm³","1498 cm³","1499 cm³","1560 cm³","1580 cm³","1596 cm³","1598 cm³","1749 cm³","1798 cm³","1950 cm³","1968 cm³","1969 cm³","1984 cm³","1991 cm³","1993 cm³","1995 cm³","1996 cm³","1997 cm³","1998 cm³","1999 cm³","2143 cm³","2179 cm³","2360 cm³","2393 cm³","2480 cm³","2487 cm³","2488 cm³","2497 cm³","2694 cm³","2755 cm³","2891 cm³","2894 cm³","2925 cm³","2967 cm³","2979 cm³","2981 cm³","2992 cm³","2993 cm³","2995 cm³","2996 cm³","2998 cm³","2999 cm³","3283 cm³","3456 cm³","3470 cm³","3745 cm³","3799 cm³","3956 cm³","3982 cm³","3996 cm³","4395 cm³","4951 cm³","4999 cm³","5000 cm³","5204 cm³","5461 cm³","5998 cm³","6208 cm³"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Consommation</label>
                <select className="input" value={form.consommation} onChange={(e) => set("consommation", e.target.value)}>
                  <option value="">Choisir</option>
                  {["0.8 L/100km","0.9 L/100km","1.0 L/100km","1.1 L/100km","1.2 L/100km","1.3 L/100km","1.4 L/100km","1.5 L/100km","1.6 L/100km","1.7 L/100km","1.8 L/100km","1.9 L/100km","2.0 L/100km","2.5 L/100km","2.8 L/100km","3.0 L/100km","3.5 L/100km","3.8 L/100km","4.0 L/100km","4.1 L/100km","4.2 L/100km","4.3 L/100km","4.4 L/100km","4.5 L/100km","4.6 L/100km","4.7 L/100km","4.8 L/100km","4.9 L/100km","5.0 L/100km","5.1 L/100km","5.2 L/100km","5.3 L/100km","5.4 L/100km","5.5 L/100km","5.6 L/100km","5.7 L/100km","5.8 L/100km","5.9 L/100km","6.0 L/100km","6.1 L/100km","6.2 L/100km","6.3 L/100km","6.4 L/100km","6.5 L/100km","6.6 L/100km","6.7 L/100km","6.8 L/100km","6.9 L/100km","7.0 L/100km","7.1 L/100km","7.2 L/100km","7.5 L/100km","7.6 L/100km","7.8 L/100km","7.9 L/100km","8.0 L/100km","8.1 L/100km","8.2 L/100km","8.4 L/100km","8.5 L/100km","9.0 L/100km","9.2 L/100km","9.5 L/100km","10.0 L/100km","10.5 L/100km","11.0 L/100km","11.5 L/100km","12.0 L/100km","12.4 L/100km","12.5 L/100km","13.0 L/100km","14.0 L/100km","12.9 kWh/100km","13.0 kWh/100km","13.8 kWh/100km","13.9 kWh/100km","14.0 kWh/100km","14.3 kWh/100km","14.6 kWh/100km","14.7 kWh/100km","14.9 kWh/100km","15.0 kWh/100km","15.5 kWh/100km","15.7 kWh/100km","15.8 kWh/100km","15.9 kWh/100km","16.0 kWh/100km","16.1 kWh/100km","16.2 kWh/100km","16.3 kWh/100km","16.5 kWh/100km","16.7 kWh/100km","16.8 kWh/100km","17.0 kWh/100km","17.1 kWh/100km","17.2 kWh/100km","17.3 kWh/100km","17.5 kWh/100km","17.7 kWh/100km","17.8 kWh/100km","18.0 kWh/100km","18.1 kWh/100km","18.4 kWh/100km","18.5 kWh/100km","18.6 kWh/100km","18.7 kWh/100km","19.0 kWh/100km","19.4 kWh/100km","19.5 kWh/100km","19.6 kWh/100km","19.8 kWh/100km","20.0 kWh/100km","20.2 kWh/100km","20.6 kWh/100km","21.0 kWh/100km","21.3 kWh/100km","21.9 kWh/100km","22.0 kWh/100km","24.4 kWh/100km","26.1 kWh/100km"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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

          {/* ── Garanties (pro / officielle MKA.P-MS uniquement) ── */}
          {(isPro || isEmployee) && (
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm" data-testid="garanties-section">
              <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider mb-1">Garanties (optionnel)</h3>
              <p className="text-xs text-slate-500 mb-3">Ces garanties s'afficheront sur la fiche véhicule et rassurent l'acheteur.</p>

              {/* Presets courants — cases à cocher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { type: "Garantie constructeur", duree: "24 mois" },
                  { type: "Extension de garantie", duree: "12 mois" },
                  { type: "Garantie vices cachés", duree: "6 mois" },
                  { type: "Garantie mécanique", duree: "12 mois" },
                  { type: "Contrôle technique récent", duree: "" },
                  { type: "Assistance dépannage", duree: "12 mois" },
                ].map((preset) => {
                  const checked = garanties.some((g) => g.type === preset.type);
                  return (
                    <label
                      key={preset.type}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition ${
                        checked ? "border-[#D4AF37] bg-[#FFFDF5]" : "border-slate-200 hover:border-[#D4AF37]/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#D4AF37]"
                        data-testid={`garantie-checkbox-${preset.type.replace(/\s+/g, "-").toLowerCase()}`}
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGaranties((prev) => [
                              ...prev,
                              { type: preset.type, duree: preset.duree || undefined, statut: "Active" },
                            ]);
                          } else {
                            setGaranties((prev) => prev.filter((g) => g.type !== preset.type));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#111]">{preset.type}</p>
                        {preset.duree && (
                          <p className="text-[10px] text-slate-500">{preset.duree}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Ajout d'une garantie personnalisée */}
              <div className="mt-4 flex gap-2">
                <input
                  className="input flex-1"
                  value={customGarantieInput}
                  onChange={(e) => setCustomGarantieInput(e.target.value)}
                  placeholder="Autre garantie (ex: Garantie 100 000 km)"
                  data-testid="garantie-custom-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customGarantieInput.trim()) {
                      e.preventDefault();
                      setGaranties((prev) => [...prev, { type: customGarantieInput.trim(), statut: "Active" }]);
                      setCustomGarantieInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  data-testid="garantie-custom-add-btn"
                  onClick={() => {
                    if (customGarantieInput.trim()) {
                      setGaranties((prev) => [...prev, { type: customGarantieInput.trim(), statut: "Active" }]);
                      setCustomGarantieInput("");
                    }
                  }}
                  className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-white"
                >
                  +
                </button>
              </div>

              {/* Récap garanties personnalisées ajoutées */}
              {garanties.filter((g) => !["Garantie constructeur","Extension de garantie","Garantie vices cachés","Garantie mécanique","Contrôle technique récent","Assistance dépannage"].includes(g.type)).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5" data-testid="garanties-custom-list">
                  {garanties
                    .filter((g) => !["Garantie constructeur","Extension de garantie","Garantie vices cachés","Garantie mécanique","Contrôle technique récent","Assistance dépannage"].includes(g.type))
                    .map((g, i) => (
                      <span key={`${g.type}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-[#FFFDF5] border border-[#D4AF37]/40 px-3 py-1 text-xs font-medium text-[#111]">
                        {g.type}
                        <button
                          type="button"
                          onClick={() => setGaranties((arr) => arr.filter((x) => x.type !== g.type))}
                          className="text-red-400 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ── Photos par catégorie ── */}
          <div className="rounded-2xl bg-[#FFFDF5] border border-[#D4AF37]/30 p-4 flex items-start gap-2 shadow-sm">
            <Camera size={16} className="text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#111]">Photos de qualité = vente rapide</p>
              <p className="text-[10px] text-[#6B7280]">Les annonces avec 10+ photos se vendent 3x plus vite. Cliquez sur chaque emplacement.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {photoCatsRef.map(cat => {
              const catPhotos = photoUrls[cat.key] || [];
              const isUploading = uploadingCats[cat.key] || false;
              return (
                <div key={cat.key} className={`relative aspect-square rounded-xl border-2 border-dashed ${isUploading ? "border-[#D4AF37] bg-[#FFFDF5]" : "border-[#D1D5DB] bg-[#FAFAFA]"} flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] hover:bg-[#FFFDF5] transition overflow-hidden`}
                  onClick={() => {
                    if (isUploading) return;
                    photoInputs.current[cat.key]?.click();
                  }}
                >
                  {/* L'input reste monté : un input détaché du document perd son
                      événement « change » sur iOS Safari — la photo choisie
                      n'arrivait jamais jusqu'à l'envoi. */}
                  <input
                    ref={el => { photoInputs.current[cat.key] = el; }}
                    type="file"
                    accept="image/*,.heic,.heif"
                    multiple
                    className="hidden"
                    onChange={e => {
                      const files = e.target.files;
                      e.target.value = "";
                      if (files?.length) void uploadPhotos(cat.key, files);
                    }}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-6 w-6 animate-spin text-[#D4AF37]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
                      <span className="text-[10px] font-semibold text-[#D4AF37]">Upload…</span>
                    </div>
                  ) : catPhotos.length > 0 ? (
                    <>
                      <img src={catPhotos[0]} alt={cat.label} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                        <span className="text-white text-xs font-bold">{catPhotos.length} photo{catPhotos.length > 1 ? "s" : ""}</span>
                        <span className="text-white/80 text-[9px] mt-0.5">{cat.label}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setPhotoUrls(p => { const n = { ...p }; delete n[cat.key]; return n; }); }} className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow z-10">
                        <X size={10} />
                      </button>
                    </>
                  ) : (
                    <>
                      <Camera size={20} className="text-[#D4AF37] mb-1" />
                      <span className="text-[10px] font-semibold text-[#374151] text-center leading-tight px-1">{cat.label}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Galerie photos uploadées — détails par catégorie */}
          {totalPhotos > 0 && (
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-[#111] uppercase tracking-wider">Photos ajoutées ({totalPhotos})</h4>
              {photoCatsRef.map(cat => {
                const catPhotos = photoUrls[cat.key] || [];
                if (catPhotos.length === 0) return null;
                return (
                  <div key={cat.key}>
                    <p className="text-[10px] font-bold text-[#6B7280] mb-1">{cat.label} ({catPhotos.length})</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {catPhotos.map((url, i) => (
                        <div key={i} className="relative shrink-0 h-16 w-16 rounded-lg border border-[#E5E7EB] overflow-hidden group">
                          <img src={url} alt="" className="h-full w-full object-cover" onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = "none"; img.parentElement!.classList.add("bg-slate-100"); }} />
                          <button
                            onClick={() => setPhotoUrls(p => ({ ...p, [cat.key]: (p[cat.key] || []).filter((_, j) => j !== i) }))}
                            className="absolute top-0.5 right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition"
                          ><X size={8} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Erreur upload */}
          {uploadError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3">
              <p className="text-xs text-red-700 font-medium">{uploadError}</p>
            </div>
          )}

          {/* Compteur photos */}
          <div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <Camera size={14} className="text-[#D4AF37]" />
            <span className="text-xs text-[#374151] font-medium">{totalPhotos} photo(s) ajoutée(s)</span>
            <span className="ml-auto text-[10px] font-bold text-[#D4AF37]">{totalPhotos >= 10 ? "Excellent !" : totalPhotos >= 5 ? "Bon score" : "Ajoutez plus de photos"}</span>
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
        <div className="max-w-4xl lg:max-w-3xl mx-auto px-4 mt-6 space-y-6">
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
                <input className="input text-lg font-bold" type="number" value={form.prix} onChange={(e) => { set("prix", e.target.value); if (typeAnnonce === "location") set("prixJour", e.target.value); }} placeholder={typeAnnonce === "location" ? "45" : "12500"} />
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

            {/* Multi-tarifs LOCATION — additifs, uniquement si typeAnnonce=location */}
            {typeAnnonce === "location" && (() => {
              // Détection automatique de l'univers de location.
              // Le vendeur ne choisit rien manuellement : le système reconnaît
              // le mode véhicule à partir de categorieAnnonce + form.categorie.
              const locMode = detectLocationMode(categorieAnnonce, form.categorie, form.segmentLocation);
              const cfg = LOCATION_MODE_CONFIG[locMode];
              return (
              <div className="rounded-2xl border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#FFFDF5] to-white p-4 space-y-4">
                {/* Case à cocher VTC / Taxi — bascule le segmentLocation */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${form.segmentLocation === "vtc_taxi" ? "bg-[#F59E0B] border-[#F59E0B]" : "bg-white border-[#E5E7EB]"}`}
                  >
                    {form.segmentLocation === "vtc_taxi" && <span className="text-white text-sm font-bold">✓</span>}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={form.segmentLocation === "vtc_taxi"}
                    onChange={(e) => set("segmentLocation", e.target.checked ? "vtc_taxi" : "")}
                  />
                  <div>
                    <span className="text-sm font-bold text-[#111] group-hover:text-[#F59E0B]">🚕 Véhicule VTC / Taxi</span>
                    <p className="text-[10px] text-[#6B7280]">Coche cette case si ton véhicule est destiné à l'univers VTC & Taxi.</p>
                  </div>
                </label>

                {/* Badge Mode auto-détecté */}
                <div
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-white"
                  style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}dd)` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cfg.emoji}</span>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">Mode détecté</p>
                      <p className="text-sm font-black">{cfg.label}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 rounded-full px-2 py-0.5">Auto</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#D4AF37]"></span>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#111]">
                    Tarifs de location — modifiables à tout moment
                  </p>
                </div>
                <p className="text-[10px] text-[#6B7280] -mt-2">
                  Renseigne les 3 tarifs de base (jour, semaine, mois). Le système calcule automatiquement les tarifs intermédiaires (3 jours, 2 semaines, 3 mois) affichés au client.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-[#374151] uppercase tracking-wider">Jour</label>
                    <input className="input text-base font-bold" type="number" value={form.prixJour} onChange={(e) => { set("prixJour", e.target.value); set("prix", e.target.value); }} placeholder="52" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-[#374151] uppercase tracking-wider">Semaine</label>
                    <input className="input text-base font-bold" type="number" value={form.prixSemaine} onChange={(e) => set("prixSemaine", e.target.value)} placeholder="312" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-[#374151] uppercase tracking-wider">Mois</label>
                    <input className="input text-base font-bold" type="number" value={form.prixMois} onChange={(e) => set("prixMois", e.target.value)} placeholder="1050" />
                  </div>
                </div>

                {/* Aperçu des tarifs intermédiaires calculés automatiquement */}
                {(form.prixJour || form.prixSemaine || form.prixMois) && (
                  <div className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-2">Aperçu tarifs affichés au client</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {(() => {
                        const j = Number(form.prixJour) || 0;
                        const s = Number(form.prixSemaine) || Math.round(j * 6);
                        const m = Number(form.prixMois) || Math.round(j * 22);
                        // Coefficients dégressifs (comme les grandes plateformes de location)
                        const p3j = Math.round(j * 2.7); // -10% vs 3×jour
                        const p2s = Math.round(s * 1.8); // -10% vs 2×semaine
                        const p3m = Math.round(m * 2.7); // -10% vs 3×mois
                        const cells: Array<[string, number]> = [
                          ["3 jours", p3j], ["2 sem.", p2s], ["3 mois", p3m],
                        ];
                        return cells.map(([label, val]) => (
                          <div key={label} className="rounded-lg bg-[#F5F3EF] py-2">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">{label}</p>
                            <p className="text-sm font-black text-[#111]">{val} €</p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-[#374151] uppercase tracking-wider">Km / jour inclus</label>
                    <input className="input text-sm font-semibold" type="number" value={form.kmInclusJour || String(cfg.kmDefault)} onChange={(e) => set("kmInclusJour", e.target.value)} placeholder={String(cfg.kmDefault)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-[#374151] uppercase tracking-wider">Assurance TR</label>
                    <select className="input text-sm font-semibold" value={form.assuranceIncluse} onChange={(e) => set("assuranceIncluse", e.target.value)}>
                      <option value="1">Incluse</option>
                      <option value="0">En option</option>
                    </select>
                  </div>
                </div>
              </div>
              );
            })()}
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
              <div ref={villeDropdownRef} className="relative">
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Ville</label>
                <input
                  className="input"
                  value={form.ville}
                  onChange={(e) => handleVilleChange(e.target.value)}
                  placeholder="Tapez une ville..."
                  onFocus={() => { if (villeSuggestions.length > 0) setVilleDropdownOpen(true); }}
                />
                {villeDropdownOpen && villeSuggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl bg-white border border-[#E5E7EB] shadow-lg max-h-48 overflow-y-auto">
                    {villeSuggestions.map((s, i) => (
                      <button
                        key={`${s.nom}-${s.codePostal}-${i}`}
                        onClick={() => selectVille(s.nom, s.codePostal)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-[#FFFBEB] hover:text-[#D4AF37] transition text-[#374151] flex items-center justify-between"
                      >
                        <span>{s.nom}</span>
                        <span className="text-xs text-[#9CA3AF]">{s.codePostal}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Code postal</label>
                <input className="input" value={form.codePostal} onChange={(e) => set("codePostal", e.target.value)} placeholder="75001" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Téléphone de contact</label>
                <label className="flex items-center gap-2 mb-2 cursor-pointer rounded-lg bg-[#FFFBEB] border border-[#D4AF37]/30 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={useAccountPhone}
                    onChange={(e) => {
                      setUseAccountPhone(e.target.checked);
                      if (e.target.checked && user?.phone) set("contactTelephone", user.phone);
                      else if (!e.target.checked) set("contactTelephone", "");
                    }}
                    className="h-4 w-4 rounded border-[#D1D5DB] text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                  />
                  <span className="text-xs font-semibold text-[#374151]">Utiliser le numéro de mon compte</span>
                  {user?.phone && <span className="ml-auto text-xs text-[#6B7280]">{user.phone}</span>}
                  {!user?.phone && <span className="ml-auto text-xs text-[#9CA3AF] italic">Aucun n° enregistré</span>}
                </label>
                {useAccountPhone && !user?.phone && (
                  <p className="text-xs text-[#F59E0B] mb-2">Ajoutez un numéro de téléphone dans votre compte pour l'utiliser ici automatiquement.</p>
                )}
                <input className="input" value={form.contactTelephone} onChange={(e) => { set("contactTelephone", e.target.value); if (useAccountPhone) setUseAccountPhone(false); }} placeholder="+33 6 12 34 56 78" readOnly={useAccountPhone && !!user?.phone} />
              </div>
            </div>
          </div>

          {/* ── Récapitulatif ── */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider mb-4">Récapitulatif</h3>
            <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
              {/* Badge catégorie */}
              <div className="flex items-center gap-2">
                {categorieAnnonce === "officielle" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] font-bold text-white"><Crown size={10} /> OFFICIEL MKA.P-MS</span>
                )}
                {categorieAnnonce === "professionnelle" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-[10px] font-bold text-white"><Building2 size={10} /> PROFESSIONNEL</span>
                )}
                {categorieAnnonce === "particulier" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-[10px] font-bold text-white"><UserIcon size={10} /> PARTICULIER</span>
                )}
                <span className="text-[9px] text-[#9CA3AF]">
                  {categorieAnnonce === "officielle" && "→ Univers Officiel MKA.P-MS"}
                  {categorieAnnonce === "professionnelle" && "→ Univers Professionnel"}
                  {categorieAnnonce === "particulier" && "→ Univers Particulier"}
                </span>
              </div>
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
              {allPhotoUrls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-2 border-t border-[#E5E7EB]">
                  {allPhotoUrls.map((p, i) => (
                    <div key={i} className="h-16 w-16 shrink-0 rounded-lg border border-[#E5E7EB] overflow-hidden bg-slate-50">
                      <img src={p} alt="" className="h-full w-full object-cover" onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = "none"; }} />
                    </div>
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
              disabled={create.isPending || updateMut.isPending || !form.marque || !form.modele || !form.prix}
              className="flex-1 rounded-xl bg-[#111] py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#333] disabled:opacity-50 transition"
            >
              {editId
                ? (updateMut.isPending ? "Modification en cours..." : "Enregistrer les modifications")
                : (create.isPending ? "Publication en cours..." : "Publier l'annonce")}
            </button>
          </div>
          {(create.error || updateMut.error) && <p className="text-sm text-red-600 text-center">{(create.error || updateMut.error)!.message}</p>}
          <p className="text-xs text-[#9CA3AF] text-center pb-6">
            Des options de mise en avant (Boost, Premium) seront proposées après la publication.
          </p>
        </div>
      )}
    </div>
  );
}
