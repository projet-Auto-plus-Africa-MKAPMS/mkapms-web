import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, Wrench, ShoppingCart, MapPin, Calendar, Bell, ChevronRight, ChevronDown,
  Check, Star, Clock, Building2, Phone, Mail, Shield, Lock, CheckCircle,
  ArrowLeft, ArrowRight, Info, MessageSquare, FileText, Settings, Zap,
  Thermometer, Eye, Headphones, Navigation,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ═══════════════════════════════════════════════════════════
   TYPES DE RÉPARATION
   ═══════════════════════════════════════════════════════════ */
const REPAIR_TYPES = [
  {
    id: "revision",
    label: "Révision",
    icon: "wrench",
    desc: "Entretien complet, vidange, filtres, etc.",
    subTypes: [
      { label: "Révision complète", dureeMin: 90, dureeMax: 120 },
      { label: "Vidange + filtre à huile", dureeMin: 30, dureeMax: 45 },
      { label: "Entretien constructeur", dureeMin: 60, dureeMax: 120 },
      { label: "Révision intermédiaire", dureeMin: 45, dureeMax: 60 },
    ],
    pieces: [
      { nom: "Filtre à huile", prixMin: 8, prixMax: 15 },
      { nom: "Filtre à air", prixMin: 12, prixMax: 25 },
      { nom: "Huile moteur 5W30 (5L)", prixMin: 30, prixMax: 45 },
      { nom: "Filtre habitacle", prixMin: 10, prixMax: 20 },
      { nom: "Liquide de frein", prixMin: 8, prixMax: 15 },
    ],
    mainOeuvreMin: 80, mainOeuvreMax: 150,
  },
  {
    id: "freinage",
    label: "Freinage",
    icon: "disc",
    desc: "Plaquettes, disques, liquide de frein, etc.",
    subTypes: [
      { label: "Plaquettes avant", dureeMin: 30, dureeMax: 45 },
      { label: "Plaquettes arrière", dureeMin: 30, dureeMax: 45 },
      { label: "Disques + plaquettes avant", dureeMin: 60, dureeMax: 90 },
      { label: "Disques + plaquettes arrière", dureeMin: 60, dureeMax: 90 },
      { label: "Liquide de frein", dureeMin: 20, dureeMax: 30 },
      { label: "Freinage complet (avant + arrière)", dureeMin: 120, dureeMax: 180 },
    ],
    pieces: [
      { nom: "Plaquettes de frein avant", prixMin: 25, prixMax: 55 },
      { nom: "Plaquettes de frein arrière", prixMin: 20, prixMax: 45 },
      { nom: "Disques de frein avant (x2)", prixMin: 50, prixMax: 95 },
      { nom: "Disques de frein arrière (x2)", prixMin: 40, prixMax: 80 },
      { nom: "Liquide de frein DOT4 (1L)", prixMin: 8, prixMax: 15 },
    ],
    mainOeuvreMin: 60, mainOeuvreMax: 150,
  },
  {
    id: "pneus",
    label: "Pneus",
    icon: "tire",
    desc: "Montage, équilibrage, géométrie, etc.",
    subTypes: [
      { label: "Montage 4 pneus + équilibrage", dureeMin: 45, dureeMax: 60 },
      { label: "Montage 2 pneus + équilibrage", dureeMin: 25, dureeMax: 35 },
      { label: "Permutation des pneus", dureeMin: 20, dureeMax: 30 },
      { label: "Géométrie (parallélisme)", dureeMin: 30, dureeMax: 45 },
      { label: "Réparation crevaison", dureeMin: 15, dureeMax: 25 },
    ],
    pieces: [
      { nom: "Pneu été 205/55 R16", prixMin: 50, prixMax: 90 },
      { nom: "Pneu hiver 205/55 R16", prixMin: 60, prixMax: 100 },
      { nom: "Pneu 4 saisons 205/55 R16", prixMin: 55, prixMax: 95 },
      { nom: "Valve TPMS capteur", prixMin: 20, prixMax: 35 },
      { nom: "Équilibrage (x4 roues)", prixMin: 25, prixMax: 40 },
    ],
    mainOeuvreMin: 30, mainOeuvreMax: 80,
  },
  {
    id: "electricite",
    label: "Électricité",
    icon: "zap",
    desc: "Batterie, alternateur, démarreur, etc.",
    subTypes: [
      { label: "Remplacement batterie", dureeMin: 20, dureeMax: 30 },
      { label: "Remplacement alternateur", dureeMin: 90, dureeMax: 120 },
      { label: "Remplacement démarreur", dureeMin: 60, dureeMax: 120 },
      { label: "Diagnostic électrique", dureeMin: 30, dureeMax: 60 },
      { label: "Remplacement ampoules/feux", dureeMin: 15, dureeMax: 30 },
    ],
    pieces: [
      { nom: "Batterie 12V 60Ah", prixMin: 80, prixMax: 130 },
      { nom: "Alternateur", prixMin: 150, prixMax: 250 },
      { nom: "Démarreur", prixMin: 120, prixMax: 200 },
      { nom: "Ampoule H7 (x2)", prixMin: 12, prixMax: 25 },
    ],
    mainOeuvreMin: 30, mainOeuvreMax: 120,
  },
  {
    id: "moteur",
    label: "Moteur",
    icon: "engine",
    desc: "Distribution, courroie, turbo, etc.",
    subTypes: [
      { label: "Kit courroie de distribution", dureeMin: 180, dureeMax: 300 },
      { label: "Courroie d'accessoires", dureeMin: 30, dureeMax: 60 },
      { label: "Joint de culasse", dureeMin: 300, dureeMax: 480 },
      { label: "Pompe à eau", dureeMin: 60, dureeMax: 120 },
      { label: "Thermostat", dureeMin: 30, dureeMax: 60 },
      { label: "Turbo (échange standard)", dureeMin: 180, dureeMax: 360 },
      { label: "Vanne EGR", dureeMin: 60, dureeMax: 120 },
    ],
    pieces: [
      { nom: "Kit distribution complet", prixMin: 150, prixMax: 280 },
      { nom: "Courroie d'accessoires", prixMin: 20, prixMax: 40 },
      { nom: "Joint de culasse", prixMin: 70, prixMax: 120 },
      { nom: "Pompe à eau", prixMin: 50, prixMax: 90 },
      { nom: "Turbo (échange std)", prixMin: 500, prixMax: 900 },
    ],
    mainOeuvreMin: 80, mainOeuvreMax: 350,
  },
  {
    id: "climatisation",
    label: "Climatisation",
    icon: "snowflake",
    desc: "Recharge, entretien, diagnostic, etc.",
    subTypes: [
      { label: "Recharge de climatisation", dureeMin: 30, dureeMax: 45 },
      { label: "Diagnostic clim complet", dureeMin: 30, dureeMax: 60 },
      { label: "Remplacement compresseur", dureeMin: 120, dureeMax: 180 },
      { label: "Remplacement condenseur", dureeMin: 90, dureeMax: 120 },
      { label: "Nettoyage circuit", dureeMin: 30, dureeMax: 45 },
    ],
    pieces: [
      { nom: "Recharge gaz clim R134a", prixMin: 35, prixMax: 60 },
      { nom: "Filtre habitacle", prixMin: 10, prixMax: 20 },
      { nom: "Compresseur de clim", prixMin: 280, prixMax: 450 },
      { nom: "Condenseur de clim", prixMin: 120, prixMax: 200 },
    ],
    mainOeuvreMin: 40, mainOeuvreMax: 150,
  },
  {
    id: "diagnostic",
    label: "Diagnostic",
    icon: "search",
    desc: "Lecture défauts, valise électronique, etc.",
    subTypes: [
      { label: "Diagnostic électronique complet", dureeMin: 30, dureeMax: 60 },
      { label: "Lecture des codes défauts", dureeMin: 15, dureeMax: 30 },
      { label: "Diagnostic moteur", dureeMin: 30, dureeMax: 60 },
      { label: "Diagnostic boîte de vitesse", dureeMin: 30, dureeMax: 60 },
      { label: "Contrôle pré-achat", dureeMin: 60, dureeMax: 90 },
    ],
    pieces: [],
    mainOeuvreMin: 40, mainOeuvreMax: 90,
  },
  {
    id: "autre",
    label: "Autre réparation",
    icon: "tool",
    desc: "Carrosserie, vitrage, échappement, etc.",
    subTypes: [
      { label: "Remplacement pare-brise", dureeMin: 60, dureeMax: 90 },
      { label: "Pot d'échappement", dureeMin: 45, dureeMax: 90 },
      { label: "Embrayage complet", dureeMin: 180, dureeMax: 360 },
      { label: "Suspension (amortisseurs)", dureeMin: 90, dureeMax: 180 },
      { label: "Géométrie + parallélisme", dureeMin: 30, dureeMax: 45 },
      { label: "Autre (décrire ci-dessous)", dureeMin: 30, dureeMax: 120 },
    ],
    pieces: [
      { nom: "Pare-brise avant", prixMin: 220, prixMax: 400 },
      { nom: "Pot d'échappement", prixMin: 80, prixMax: 150 },
      { nom: "Kit embrayage complet", prixMin: 200, prixMax: 400 },
      { nom: "Amortisseur avant", prixMin: 60, prixMax: 100 },
    ],
    mainOeuvreMin: 40, mainOeuvreMax: 250,
  },
];


const ESTIMATION_SERVICE_CATALOG = [
  { id: "mecanicien-domicile", label: "Mécanicien à domicile", description: "Intervention mécanique sur place, selon le véhicule et la zone", repairId: "autre", segment: "mecanique", manual: true },
  { id: "nouveau", label: "Nouveau", description: "Une prestation récente ou non listée", repairId: "autre", segment: "mecanique", manual: true },
  { id: "revision", label: "Révisions et vidange", description: "Entretien périodique, vidange et filtres", repairId: "revision", segment: "mecanique" },
  { id: "freinage", label: "Freinage", description: "Plaquettes, disques et liquide de frein", repairId: "freinage", segment: "mecanique" },
  { id: "distribution", label: "Distribution", description: "Courroie, chaîne et pompe à eau", repairId: "moteur", segment: "mecanique" },
  { id: "pieces-moteur", label: "Pièces moteur", description: "Moteur, turbo, EGR et pièces associées", repairId: "moteur", segment: "mecanique" },
  { id: "embrayage", label: "Embrayage", description: "Embrayage et transmission de puissance", repairId: "autre", segment: "mecanique" },
  { id: "suspension", label: "Suspension", description: "Amortisseurs, ressorts et liaisons au sol", repairId: "autre", segment: "mecanique" },
  { id: "geometrie", label: "Géométrie", description: "Parallélisme et réglage des trains roulants", repairId: "pneus", segment: "mecanique" },
  { id: "demarrage-charge", label: "Démarrage et charge", description: "Batterie, alternateur et démarreur", repairId: "electricite", segment: "mecanique" },
  { id: "echappement-fap", label: "Échappement et FAP", description: "Échappement, filtre à particules et antipollution", repairId: "autre", segment: "mecanique" },
  { id: "climatisation", label: "Climatisation", description: "Recharge, entretien et diagnostic", repairId: "climatisation", segment: "mecanique" },
  { id: "pneumatiques", label: "Pneumatiques (hors achat)", description: "Montage, équilibrage et crevaison", repairId: "pneus", segment: "mecanique" },
  { id: "direction", label: "Direction", description: "Direction, crémaillère et assistance", repairId: "autre", segment: "mecanique" },
  { id: "transmission", label: "Transmission", description: "Boîte, cardans et transmission", repairId: "autre", segment: "mecanique" },
  { id: "carrosserie-esthetique", label: "Carrosserie et esthétique", description: "Tôlerie, peinture et remise en état", repairId: "autre", segment: "carrosserie" },
  { id: "vision-parebrise", label: "Vision et pare-brise", description: "Pare-brise, vitrages et visibilité", repairId: "autre", segment: "carrosserie" },
  { id: "pare-brise", label: "Remplacement pare-brise", description: "Pare-brise avant, capteurs et recalibrage", repairId: "autre", segment: "carrosserie" },
  { id: "vitres-laterales", label: "Vitres latérales", description: "Vitres de portes et mécanismes de lève-vitre", repairId: "autre", segment: "carrosserie" },
  { id: "lunette-arriere", label: "Lunette arrière", description: "Remplacement et dégivrage de lunette arrière", repairId: "autre", segment: "carrosserie" },
  { id: "pare-chocs", label: "Pare-chocs", description: "Réparation, remplacement et peinture des pare-chocs", repairId: "autre", segment: "carrosserie" },
  { id: "ailes", label: "Ailes et passages de roue", description: "Réparation ou remplacement des ailes", repairId: "autre", segment: "carrosserie" },
  { id: "portes", label: "Portières et serrures", description: "Portière, serrure, charnière et lève-vitre", repairId: "autre", segment: "carrosserie" },
  { id: "capot-coffre", label: "Capot et coffre", description: "Réglage, remplacement et réparation", repairId: "autre", segment: "carrosserie" },
  { id: "peinture", label: "Peinture carrosserie", description: "Peinture complète, élément ou retouche", repairId: "autre", segment: "carrosserie" },
  { id: "debosselage", label: "Débosselage sans peinture", description: "Petits impacts, grêle et bosses", repairId: "autre", segment: "carrosserie" },
  { id: "tolerie", label: "Tôlerie et redressage", description: "Redressage, soudure et remise en ligne", repairId: "autre", segment: "carrosserie" },
  { id: "retroviseurs", label: "Rétroviseurs", description: "Coque, miroir, clignotant et réglage", repairId: "autre", segment: "carrosserie" },
  { id: "phares-feux", label: "Phares et feux", description: "Optiques, feux arrière et éclairage extérieur", repairId: "autre", segment: "carrosserie" },
  { id: "jantes-esthetique", label: "Jantes et esthétique", description: "Jantes, plastiques et finitions extérieures", repairId: "autre", segment: "carrosserie" },
  { id: "diagnostics", label: "Contrôles et diagnostics", description: "Contrôle électronique et diagnostic", repairId: "diagnostic", segment: "mecanique" },
  { id: "recherche-pannes", label: "Recherche de pannes", description: "Identifier l'origine d'un problème", repairId: "diagnostic", segment: "mecanique" },
  { id: "rdv-autre", label: "Prise de RDV (autre problème)", description: "Décrire une demande qui n'est pas listée", repairId: "autre", segment: "mecanique", manual: true },
] as const;

const CRENEAUX = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

export default function Devis() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const utils = trpc.useUtils();

  /* Mode : landing vs flow (7 steps) */
  const [mode, setMode] = useState<"landing" | "flow" | "estimation">(() => searchParams.get("estimation") === "1" ? "estimation" : "landing");
  const [step, setStep] = useState(1);
  const [estimationStep, setEstimationStep] = useState(1);
  const [entryPoint, setEntryPoint] = useState<"devis" | "garage">("devis");
  const [estimationCategory, setEstimationCategory] = useState<"mecanique" | "carrosserie">("mecanique");
  const [estimationExpanded, setEstimationExpanded] = useState<string | null>(() => searchParams.get("service") === "mecanicien-domicile" ? "service:mecanicien-domicile" : null);
  const [estimationSelections, setEstimationSelections] = useState<string[]>([]);
  const [estimationVehicleIdentified, setEstimationVehicleIdentified] = useState(false);
  const [estimationMode, setEstimationMode] = useState<"repair" | "tires">("repair");
  const [tireSection, setTireSection] = useState<"registration" | "dimensions">("registration");
  const [tirePlate, setTirePlate] = useState("");
  const [tireWidth, setTireWidth] = useState("");
  const [tireAspect, setTireAspect] = useState("45");
  const [tireRim, setTireRim] = useState("17");
  const [showMoreTireWidths, setShowMoreTireWidths] = useState(false);
  const [estimationServiceSearch, setEstimationServiceSearch] = useState("");
  const [tireDimensions, setTireDimensions] = useState({ largeur: "", hauteur: "", jante: "" });

  // Synchronise l’affichage avec les navigations internes (?estimation=1), notamment le bouton d’estimation.
  useEffect(() => {
    if (mode === "flow") return;
    setMode(searchParams.get("estimation") === "1" ? "estimation" : "landing");
  }, [searchParams, mode]);

  /* Identification véhicule */
  const [identTab, setIdentTab] = useState<"plaque" | "vin">("plaque");
  const [plaque, setPlaque] = useState("");
  const [vin, setVin] = useState("");
  const [plateLoading, setPlateLoading] = useState(false);
  const [saisieManuelle, setSaisieManuelle] = useState(false);
  const [flowManualOpen, setFlowManualOpen] = useState(false);
  const [vehicule, setVehicule] = useState({
    marque: "", modele: "", version: "", annee: "",
    carburant: "", boite: "", puissance: "", portes: "", kilometrage: "",
  });

  /* Réparation */
  const [selectedRepairId, setSelectedRepairId] = useState("");
  const [selectedSubType, setSelectedSubType] = useState("");
  const [descriptionLibre, setDescriptionLibre] = useState("");

  /* Garage */
  const [positionSearch, setPositionSearch] = useState("");
  const [rayonKm, setRayonKm] = useState("10");
  const [selectedGarageId, setSelectedGarageId] = useState<number | null>(null);

  /* Rendez-vous */
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCreneau, setSelectedCreneau] = useState("");

  // Média publicitaire d'origine : cinq vidéos, rotation de 8 secondes.
  // Cette zone est volontairement séparée du contenu de la landing page.
  const HERO_VIDEOS = [
    { src: "/videos/garage/garage_voiture_complete.mp4", label: "Véhicule" },
    { src: "/videos/garage/garage_moteur.mp4", label: "Moteur" },
    { src: "/videos/garage/garage_suspension.mp4", label: "Suspension" },
    { src: "/videos/garage/garage_freins.mp4", label: "Freinage" },
    { src: "/videos/garage/garage_carrosserie.mp4", label: "Carrosserie" },
  ];
  const [heroVidIdx, setHeroVidIdx] = useState(0);
  const [heroProgress, setHeroProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const startHeroProgress = () => {
    setHeroProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setHeroProgress((p) => {
        if (p >= 100) { clearInterval(progressRef.current!); return 100; }
        return p + 100 / 80;
      });
    }, 100);
  };

  useEffect(() => {
    const timer = setInterval(() => setHeroVidIdx((i) => (i + 1) % HERO_VIDEOS.length), 8000);
    startHeroProgress();
    return () => { clearInterval(timer); if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  const prevHeroVidIdx = useRef<number | null>(null);
  useEffect(() => {
    // En React.StrictMode (développement), cet effet est invoqué deux fois au
    // montage sans démontage réel entre les deux : relancer currentTime=0 puis
    // play() à chaque invocation interrompt la requête vidéo déjà en cours et
    // peut déclencher une erreur de décodage (DEMUXER_ERROR_NO_SUPPORTED_STREAMS).
    // On ignore donc la ré-invocation qui ne correspond pas à un vrai changement
    // d'index — l'attribut autoPlay natif se charge déjà du tout premier départ.
    if (prevHeroVidIdx.current === heroVidIdx) { prevHeroVidIdx.current = heroVidIdx; return; }
    prevHeroVidIdx.current = heroVidIdx;
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === heroVidIdx) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else video.pause();
    });
    startHeroProgress();
  }, [heroVidIdx]);

  const selectedRepair = REPAIR_TYPES.find((r) => r.id === selectedRepairId);

  /* Garages partenaires réels (server/routers/garages.ts) — jamais une liste inventée. */
  const garagesQuery = trpc.garages.list.useQuery(
    { city: positionSearch || undefined, limit: 20 },
    { enabled: mode === "landing" || mode === "estimation" || step >= 5 },
  );
  const garages = garagesQuery.data?.items ?? [];
  const selectedGarage = garages.find((g) => g.id === selectedGarageId);

  /* Estimation */
  const estimation = useMemo(() => {
    if (!selectedRepair) return null;
    const sub = selectedRepair.subTypes.find((s) => s.label === selectedSubType);
    const piecesTotal = selectedRepair.pieces.reduce((sum, p) => ({
      min: sum.min + p.prixMin,
      max: sum.max + p.prixMax,
    }), { min: 0, max: 0 });
    const moMin = selectedRepair.mainOeuvreMin;
    const moMax = selectedRepair.mainOeuvreMax;
    return {
      totalMin: piecesTotal.min + moMin,
      totalMax: piecesTotal.max + moMax,
      moMin, moMax,
      piecesMin: piecesTotal.min,
      piecesMax: piecesTotal.max,
      dureeMin: sub?.dureeMin || 30,
      dureeMax: sub?.dureeMax || 120,
    };
  }, [selectedRepair, selectedSubType]);

  const estimationSelectionData = useMemo(() => estimationSelections.map((key) => {
    const [serviceId, ...subParts] = key.split("::");
    const service = ESTIMATION_SERVICE_CATALOG.find((item) => item.id === serviceId);
    const repair = REPAIR_TYPES.find((item) => item.id === service?.repairId);
    const subType = subParts.join("::");
    const sub = repair?.subTypes.find((item) => item.label === subType) || repair?.subTypes[0];
    if (!service || !repair || !sub) return null;
    const pieces = repair.pieces.reduce((sum, piece) => ({ min: sum.min + piece.prixMin, max: sum.max + piece.prixMax }), { min: 0, max: 0 });
    return { key, repair, sub, min: pieces.min + repair.mainOeuvreMin, max: pieces.max + repair.mainOeuvreMax };
  }).filter(Boolean) as Array<{ key: string; repair: typeof REPAIR_TYPES[number]; sub: typeof REPAIR_TYPES[number]["subTypes"][number]; min: number; max: number }>, [estimationSelections]);

  const estimationTotals = useMemo(() => estimationSelectionData.reduce((sum, item) => ({
    min: sum.min + item.min,
    max: sum.max + item.max,
    durationMin: sum.durationMin + item.sub.dureeMin,
    durationMax: sum.durationMax + item.sub.dureeMax,
  }), { min: 0, max: 0, durationMin: 0, durationMax: 0 }), [estimationSelectionData]);

  const create = trpc.devis.create.useMutation({
    onSuccess: () => setStep(8),
  });

  /* Identification par plaque/VIN */
  async function identifierVehicule() {
    const query = plaque.trim() || vin.trim();
    const type = plaque.trim() ? "plaque" : "vin";
    if (!query) return;
    setPlateLoading(true);
    try {
      const r = await utils.annonces.lookupPlate.fetch({ type, query });
      if (r) {
        setVehicule({
          marque: r.marque || "",
          modele: r.modele || "",
          version: r.version || "",
          annee: r.annee ? String(r.annee) : "",
          carburant: r.carburant || "",
          boite: r.boite || "",
          puissance: r.puissance ? String(r.puissance) : "",
          portes: (r as { portes?: number | null }).portes ? String((r as { portes?: number | null }).portes) : "",
          kilometrage: vehicule.kilometrage,
        });
        setStep(3);
      }
    } catch {
      // manual entry
    } finally {
      setPlateLoading(false);
    }
  }

  /* Submit */
  function submit() {
    if (!user) return;
    create.mutate({
      contactNom: user.name,
      contactEmail: user.email,
      vehiculeMarque: vehicule.marque || undefined,
      vehiculeModele: vehicule.modele || undefined,
      vehiculeAnnee: vehicule.annee ? Number(vehicule.annee) : undefined,
      immatriculation: plaque || undefined,
      typeIntervention: selectedRepair?.label || "Autre",
      description: `${selectedSubType}${descriptionLibre ? ` — ${descriptionLibre}` : ""}`,
      ville: positionSearch || undefined,
    });
  }

  /* Dates disponibles (14 prochains jours ouvrés) */
  const availableDates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= 21 && availableDates.length < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) availableDates.push(d.toISOString().split("T")[0]);
  }

  const STEPS_LABELS = [
    { num: 1, label: "Véhicule" },
    { num: 2, label: "Réparation" },
    { num: 3, label: "Devis" },
    { num: 4, label: "Garage" },
    { num: 5, label: "Réservation" },
  ];

  /* Icône par type de réparation */
  function repairIcon(id: string, size: number = 28) {
    switch (id) {
      case "revision": return <Wrench size={size} />;
      case "freinage": return <Shield size={size} />;
      case "pneus": return <Settings size={size} />;
      case "electricite": return <Zap size={size} />;
      case "moteur": return <Settings size={size} />;
      case "climatisation": return <Thermometer size={size} />;
      case "diagnostic": return <Search size={size} />;
      case "autre": return <Wrench size={size} />;
      default: return <Wrench size={size} />;
    }
  }

  /* ════════════════════════════════════════════════════════════
     ESTIMATION — détail rapide, sélection multiple et comparaison
     ════════════════════════════════════════════════════════════ */
  if (mode === "estimation") {
    const estimateServices = ESTIMATION_SERVICE_CATALOG.filter((service) => service.segment === estimationCategory);
    const normalizeEstimateSearch = (value: string) => value.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    const visibleEstimateServices = estimateServices.filter((service) => {
      const repair = REPAIR_TYPES.find((item) => item.id === service.repairId);
      const searchable = [service.label, service.description, ...(repair?.subTypes.map((item) => item.label) || [])].join(" ");
      const query = normalizeEstimateSearch(estimationServiceSearch.trim());
      return !query || normalizeEstimateSearch(searchable).includes(query);
    });
    const estimateGarages = estimationCategory === "carrosserie"
      ? garages.filter((garage) => /carross|peinture|vitrage|pare-brise/i.test(garage.services || ""))
      : garages;

    const toggleEstimateService = (serviceId: string, subType: string) => {
      const key = `${serviceId}::${subType}`;
      setEstimationSelections((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
      const service = ESTIMATION_SERVICE_CATALOG.find((item) => item.id === serviceId);
      if (service) { setSelectedRepairId(service.repairId); setSelectedSubType(subType); }
    };

    const identifyEstimationVehicle = async (type: "plaque" | "vin") => {
      const query = type === "plaque" ? plaque.trim() : vin.trim();
      if (!query) return;
      setPlateLoading(true);
      try {
        const result = await utils.annonces.lookupPlate.fetch({ type, query });
        if (result) {
          setVehicule({ marque: result.marque || "", modele: result.modele || "", version: result.version || "", annee: result.annee ? String(result.annee) : "", carburant: result.carburant || "", boite: result.boite || "", puissance: result.puissance ? String(result.puissance) : "", portes: (result as { portes?: number | null }).portes ? String((result as { portes?: number | null }).portes) : "", kilometrage: vehicule.kilometrage });
          setEstimationVehicleIdentified(true); setEstimationExpanded(null);
        }
      } catch { setEstimationVehicleIdentified(false); } finally { setPlateLoading(false); }
    };

    const validateManualVehicle = () => {
      if (vehicule.marque.trim() && vehicule.modele.trim() && vehicule.annee.trim()) {
        setEstimationVehicleIdentified(true); setEstimationExpanded(null);
      }
    };

    const selectedServiceCount = estimationSelections.length;
    const canSeeTariffs = estimationVehicleIdentified && positionSearch.trim().length > 0 && selectedServiceCount > 0;

    return (
      <div className="min-h-screen bg-[#E8F7FB] pb-24">
        <div className="border-b border-white/20 bg-white px-4 py-4">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <button type="button" onClick={() => navigate("/devis")} className="rounded-full p-2 text-[#64748B] hover:bg-[#F1F5F9]" aria-label="Retour"><ArrowLeft size={20} /></button>
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#08A9C4]">Estimation rapide</p><h1 className="text-lg font-black text-[#102A43]">Comparez les garages, réservez au meilleur prix</h1></div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-3 py-6">
          <div className="mb-5 flex items-center justify-center gap-2 text-xs font-black text-[#9A4B12]">
            {["Détails", "Voir les tarifs"].map((label, index) => (
              <button key={label} type="button" onClick={() => index === 1 && canSeeTariffs && setEstimationStep(2)} className={`rounded-full px-4 py-2 ${estimationStep === index + 1 ? "bg-[#FF8A1F] text-white" : "bg-[#FFE0C2] text-[#9A4B12]"}`}>{index + 1}. {label}</button>
            ))}
          </div>

          {estimationMode === "tires" && (
            <section className="rounded-[28px] bg-white p-5 shadow-2xl">
              <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#E5E7EB]">
                <button type="button" onClick={() => { setEstimationMode("repair"); setEstimationStep(1); }} className="bg-white px-3 py-3 text-sm font-black text-[#08A9C4]">ENTRETENIR MON VÉHICULE</button>
                <button type="button" onClick={() => setEstimationMode("tires")} className="bg-[#F3F3F3] px-3 py-3 text-sm font-black text-[#08A9C4]">CHANGER MES PNEUS <span className="ml-1 inline-flex rounded-full bg-[#D92D35] px-2 py-1 text-[9px] text-white">NOUVEAU</span></button>
              </div>
              <h2 className="mb-1 text-center text-2xl font-black text-[#08A9C4]">Trouver mes pneus</h2>
              <p className="mb-5 text-center text-sm text-[#64748B]">Achetez vos pneus ou demandez leur montage auprès d’un garage partenaire.</p>
              <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-full border border-[#E5E7EB] bg-[#F8FAFC] p-1">
                <button type="button" onClick={() => setTireSection("registration")} className={`rounded-full px-3 py-3 text-xs font-black transition ${tireSection === "registration" ? "bg-[#08A9C4] text-white shadow-md" : "text-[#64748B]"}`}>IMMATRICULATION</button>
                <button type="button" onClick={() => setTireSection("dimensions")} className={`rounded-full px-3 py-3 text-xs font-black transition ${tireSection === "dimensions" ? "bg-[#08A9C4] text-white shadow-md" : "text-[#64748B]"}`}>DIMENSIONS</button>
              </div>

              {tireSection === "registration" ? (
                <div>
                  <h3 className="mb-4 text-xl font-black text-[#08A9C4]">Identifiez votre véhicule</h3>
                  <div className="overflow-hidden rounded-3xl border border-[#B7DCE5] bg-gradient-to-br from-[#F8FDFF] to-[#E8F7FB] p-4 shadow-inner">
                    <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#64748B]">Recherche pneus</p><p className="text-base font-black text-[#102A43]">Par immatriculation</p></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-[#08A9C4] shadow-sm">FR · RAPIDE</span></div>
                    <div className="overflow-hidden rounded-2xl border-2 border-[#94A3B8] bg-white shadow-sm focus-within:border-[#08A9C4] focus-within:ring-4 focus-within:ring-[#08A9C4]/15">
                      <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-4 py-4"><span className="text-2xl">🚗</span><span className="min-w-0 flex-1"><span className="block text-sm font-black text-[#30343B]">Renseignez votre immatriculation</span><span className="block text-xs text-[#64748B]">Nous trouvons automatiquement la bonne dimension</span></span></div>
                      <div className="flex items-center gap-3 px-4 py-4"><span className="rounded-lg bg-[#164B7A] px-2 py-3 text-xs font-black text-white">F</span><input aria-label="Immatriculation pour trouver mes pneus" className="min-w-0 flex-1 px-1 py-3 text-center text-2xl font-black uppercase tracking-wider outline-none placeholder:text-[#CBD5E1]" placeholder="AB-123-CD" value={tirePlate} onChange={(event) => setTirePlate(event.target.value.toUpperCase())} /></div>
                    </div>
                    <p className="mt-3 text-center text-xs text-[#64748B]">Aucune donnée enregistrée sans votre validation.</p>
                  </div>
                  <button type="button" disabled={!tirePlate.trim()} className="mt-5 w-full rounded-2xl bg-[#FF8A1F] py-4 text-base font-black text-white shadow-lg disabled:opacity-40">VALIDER</button>
                </div>
              ) : (
                <div>
                  <h3 className="mb-4 text-xl font-black text-[#08A9C4]">Comprenez votre dimension</h3>
                  <div className="mb-5 rounded-3xl border-2 border-[#B7DCE5] bg-gradient-to-br from-[#F8FDFF] to-[#E8F7FB] p-4 shadow-inner">
                    <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#64748B]">Votre dimension</p><p className="text-2xl font-black tracking-tight text-[#102A43]">{tireWidth || "225"}<span className="text-[#08A9C4]"> / {tireAspect} R{tireRim}</span></p></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-[#08A9C4] shadow-sm">LECTURE GUIDÉE</span></div>
                    <div className="relative mx-auto h-44 max-w-[330px] overflow-hidden rounded-2xl bg-[#102A43] p-2">
                      <svg viewBox="0 0 320 170" className="h-full w-full" role="img" aria-label="Indicateur de largeur de pneu">
                        <path d="M35 150 A125 125 0 0 1 285 150" fill="none" stroke="#071827" strokeWidth="34" strokeLinecap="round" />
                        <path d="M35 150 A125 125 0 0 1 285 150" fill="none" stroke="#08A9C4" strokeWidth="3" strokeLinecap="round" opacity="0.95" />
                        <path d="M67 150 A93 93 0 0 1 253 150" fill="none" stroke="#294459" strokeWidth="4" strokeDasharray="2 9" />
                        <line x1="160" y1="150" x2="160" y2="45" stroke="#FF8A1F" strokeWidth="5" strokeLinecap="round" style={{ transformOrigin: "160px 150px", transform: `rotate(${Math.max(-58, Math.min(58, ((Number(tireWidth || 225) - 145) / 110) * 116 - 58))}deg)` }} />
                        <circle cx="160" cy="150" r="10" fill="#FF8A1F" stroke="white" strokeWidth="4" />
                        <text x="34" y="137" fill="#D7F7FB" fontSize="13" fontWeight="800">145</text><text x="143" y="34" fill="white" fontSize="15" fontWeight="900">225</text><text x="267" y="137" fill="#D7F7FB" fontSize="13" fontWeight="800">255</text>
                      </svg>
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 text-[10px] font-bold text-white/80"><span className="rounded-full bg-white/10 px-2 py-1">gomme : {tireWidth || "225"} mm</span><span className="rounded-full bg-white/10 px-2 py-1">jante : R{tireRim}</span></div>
                    </div>
                    <p className="mt-3 text-center text-xs leading-5 text-[#475569]">L’aiguille suit votre choix et vous montre immédiatement la largeur de gomme. La hauteur et la jante sont choisies juste après.</p>
                  </div>
                  <button type="button" className="mb-5 w-full text-center text-sm font-semibold text-[#08A9C4] underline">Lire mes dimensions de pneus</button>
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-[#64748B]">1 · Largeur de gomme</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[145, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255].slice(0, showMoreTireWidths ? 12 : 8).map((width) => <button key={width} type="button" onClick={() => setTireWidth(String(width))} className={`rounded-xl border px-2 py-3 text-sm font-black transition ${tireWidth === String(width) ? "border-[#08A9C4] bg-[#08A9C4] text-white shadow-md" : "border-[#D9E3E8] bg-white text-[#102A43]"}`}>{width}</button>)}
                  </div>
                  <button type="button" onClick={() => setShowMoreTireWidths((current) => !current)} className="mt-5 w-full text-center text-sm text-[#64748B] underline">{showMoreTireWidths ? "Afficher moins" : "Afficher plus de valeurs"}</button>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <label className="rounded-2xl border border-[#D9E3E8] bg-white p-3"><span className="block text-[10px] font-black uppercase text-[#64748B]">2 · Hauteur</span><select value={tireAspect} onChange={(event) => setTireAspect(event.target.value)} className="mt-2 w-full bg-transparent text-lg font-black text-[#102A43] outline-none">{[35,40,45,50,55,60,65].map((value) => <option key={value}>{value}</option>)}</select></label>
                    <label className="rounded-2xl border border-[#D9E3E8] bg-white p-3"><span className="block text-[10px] font-black uppercase text-[#64748B]">3 · Jante</span><select value={tireRim} onChange={(event) => setTireRim(event.target.value)} className="mt-2 w-full bg-transparent text-lg font-black text-[#102A43] outline-none">{[14,15,16,17,18,19,20].map((value) => <option key={value}>{value}</option>)}</select></label>
                  </div>
                </div>
              )}
              <div className="my-5 border-t border-[#E5E7EB]" />
              <p className="text-center text-sm text-[#475569]">Vous avez déjà vos pneus ?</p>
              <button type="button" onClick={() => { setEstimationMode("repair"); setEstimationCategory("mecanique"); setEstimationExpanded("service"); const key = "pneumatiques::Montage 4 pneus + équilibrage"; setEstimationSelections((current) => current.includes(key) ? current : [...current, key]); setSelectedRepairId("pneus"); setSelectedSubType("Montage 4 pneus + équilibrage"); }} className="mt-2 w-full text-center text-lg font-black text-[#08A9C4] underline">Faire monter mes pneus</button>
              <button type="button" onClick={() => navigate("/pieces?search=pneus")} className="mt-5 w-full rounded-2xl bg-[#FF8A1F] py-4 text-base font-black text-white shadow-lg">ACHETER MES PNEUS</button>
            </section>
          )}

          {estimationMode === "repair" && estimationStep === 1 && (
            <section className="rounded-[28px] bg-white p-5 shadow-2xl">
              <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#E5E7EB]">
                <button type="button" onClick={() => { setEstimationMode("repair"); setEstimationStep(1); }} className={`bg-white px-3 py-3 text-sm font-black ${estimationMode === "repair" ? "text-[#08A9C4]" : "text-[#64748B]"}`}>ENTRETENIR MON VÉHICULE</button>
                <button type="button" onClick={() => { setEstimationMode("tires"); setEstimationStep(1); setEstimationExpanded(null); }} className="bg-[#F3F3F3] px-3 py-3 text-sm font-black text-[#374151]">CHANGER MES PNEUS <span className="ml-1 inline-flex rounded-full bg-[#D92D35] px-2 py-1 text-[9px] text-white">NOUVEAU</span></button>
              </div>

              <div className="space-y-3">
                <div className={`overflow-hidden rounded-2xl border-2 transition-all duration-300 ${estimationExpanded === "vehicle" ? "border-[#08A9C4] shadow-[0_0_0_4px_rgba(8,169,196,0.14)]" : "border-[#B7BDC4]"}`}>
                  <button type="button" onClick={() => setEstimationExpanded(estimationExpanded === "vehicle" ? null : "vehicle")} className="flex w-full items-center gap-3 px-4 py-4 text-left">
                    <span className="text-2xl">🚗</span><span className="min-w-0 flex-1"><span className="block text-base font-black text-[#30343B]">{estimationVehicleIdentified ? `${vehicule.marque} ${vehicule.modele}`.trim() || "Véhicule identifié" : "Identifier mon véhicule"}</span><span className="block text-xs text-[#64748B]">{estimationVehicleIdentified ? `${plaque || vin || "Saisie manuelle"} · ${vehicule.annee}` : "Plaque, VIN ou saisie manuelle"}</span></span>
                    {estimationVehicleIdentified && <CheckCircle size={21} className="text-[#16806A]" />}<ChevronDown size={22} className={`text-[#FF8A1F] transition ${estimationExpanded === "vehicle" ? "rotate-180" : ""}`} />
                  </button>
                  {estimationExpanded === "vehicle" && (
                    <div className="border-t border-[#E5E7EB] bg-[#FAFAFA] px-4 py-4">
                      <div className="mb-3 flex gap-2">
                        {([["plaque", "Plaque d'immatriculation"], ["vin", "Numéro VIN"], ["manual", "Saisie manuelle"]] as const).map(([tab, label]) => (
                          <button key={tab} type="button" onClick={() => tab === "manual" ? setSaisieManuelle(true) : (setSaisieManuelle(false), setIdentTab(tab))} className={`flex-1 rounded-lg border px-2 py-2 text-[10px] font-bold ${(tab === "manual" ? saisieManuelle : !saisieManuelle && identTab === tab) ? "border-[#08A9C4] bg-[#E8FAFD] text-[#087B91]" : "border-[#E5E7EB] bg-white text-[#64748B]"}`}>{label}</button>
                        ))}
                      </div>
                      {!saisieManuelle && identTab === "plaque" && <div className="flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm uppercase outline-none" placeholder="Plaque d’immatriculation" value={plaque} onChange={(event) => { setPlaque(event.target.value.toUpperCase()); setEstimationVehicleIdentified(false); }} /><button type="button" disabled={plateLoading || !plaque.trim()} onClick={() => identifyEstimationVehicle("plaque")} className="rounded-lg bg-[#08A9C4] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{plateLoading ? "…" : "Identifier"}</button></div>}
                      {!saisieManuelle && identTab === "vin" && <div className="flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm uppercase outline-none" placeholder="Saisir le numéro VIN" value={vin} onChange={(event) => { setVin(event.target.value.toUpperCase()); setEstimationVehicleIdentified(false); }} /><button type="button" disabled={plateLoading || !vin.trim()} onClick={() => identifyEstimationVehicle("vin")} className="rounded-lg bg-[#08A9C4] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{plateLoading ? "…" : "Identifier"}</button></div>}
                      {saisieManuelle && <div className="space-y-2"><div className="grid grid-cols-2 gap-2">{([["marque", "Marque"], ["modele", "Modèle"], ["annee", "Année"], ["carburant", "Carburant"]] as const).map(([field, label]) => <input key={field} className="rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm outline-none" placeholder={label} value={vehicule[field]} onChange={(event) => { setVehicule((current) => ({ ...current, [field]: event.target.value })); setEstimationVehicleIdentified(false); }} />)}</div><button type="button" onClick={validateManualVehicle} className="w-full rounded-lg bg-[#08A9C4] py-2.5 text-xs font-bold text-white">Valider le véhicule</button></div>}
                    </div>
                  )}
                </div>

                <div className={`overflow-hidden rounded-2xl border-2 transition-all duration-300 ${estimationExpanded === "location" ? "border-[#08A9C4] shadow-[0_0_0_4px_rgba(8,169,196,0.14)]" : "border-[#B7BDC4]"}`}>
                  <button type="button" onClick={() => setEstimationExpanded(estimationExpanded === "location" ? null : "location")} className="flex w-full items-center gap-3 px-4 py-4 text-left"><MapPin size={25} className="text-[#08A9C4]" /><span className="min-w-0 flex-1"><span className="block text-base font-black text-[#30343B]">{positionSearch || "Ajouter ma localisation"}</span><span className="block text-xs text-[#64748B]">Ville ou code postal</span></span><ChevronDown size={22} className={`text-[#FF8A1F] transition ${estimationExpanded === "location" ? "rotate-180" : ""}`} /></button>
                  {estimationExpanded === "location" && <div className="border-t border-[#E5E7EB] bg-[#FAFAFA] px-4 py-4"><input className="w-full rounded-lg border border-[#CBD5E1] px-3 py-3 text-sm outline-none" placeholder="Ex. 95100 Argenteuil" value={positionSearch} onChange={(event) => setPositionSearch(event.target.value)} /></div>}
                </div>

                <div className={`overflow-hidden rounded-2xl border-2 transition-all duration-300 ${estimationExpanded === "service" || estimationExpanded?.startsWith("service:") ? "border-[#08A9C4] shadow-[0_0_0_4px_rgba(8,169,196,0.14)]" : "border-[#B7BDC4]"}`}>
                  <button type="button" onClick={() => setEstimationExpanded(estimationExpanded === "service" ? null : "service")} className="flex w-full items-center gap-3 px-4 py-4 text-left"><Wrench size={27} className="text-[#08A9C4]" /><span className="min-w-0 flex-1"><span className="block text-base font-black text-[#30343B]">{selectedServiceCount ? `${selectedServiceCount} prestation${selectedServiceCount > 1 ? "s" : ""} sélectionnée${selectedServiceCount > 1 ? "s" : ""}` : "Choisissez votre prestation"}</span><span className="block text-xs text-[#64748B]">Sélection multiple possible</span></span><ChevronDown size={22} className={`text-[#FF8A1F] transition ${estimationExpanded === "service" ? "rotate-180" : ""}`} /></button>
                  {(estimationExpanded === "service" || estimationExpanded?.startsWith("service:")) && <div className="border-t border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2">
                    <div className="mb-3">
                        <label className="flex items-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-3 py-2.5 text-sm text-[#64748B]">
                          <Search size={17} className="shrink-0 text-[#08A9C4]" />
                          <input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Rechercher : plaquettes, distribution, amortisseur…" value={estimationServiceSearch} onChange={(event) => setEstimationServiceSearch(event.target.value)} />
                        </label>
                      </div>
                      <div className="mb-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => setEstimationCategory("mecanique")} className={`rounded-lg px-2 py-2 text-xs font-black ${estimationCategory === "mecanique" ? "bg-[#08A9C4] text-white" : "bg-white text-[#64748B]"}`}>Mécanique & entretien</button><button type="button" onClick={() => setEstimationCategory("carrosserie")} className={`rounded-lg px-2 py-2 text-xs font-black ${estimationCategory === "carrosserie" ? "bg-[#08A9C4] text-white" : "bg-white text-[#64748B]"}`}>Carrosserie & vitrage</button></div>
                    <div className="max-h-[440px] overflow-y-auto">
                      {visibleEstimateServices.map((service) => {
                        const isOpen = estimationExpanded === `service:${service.id}`;
                        const count = estimationSelections.filter((key) => key.startsWith(`${service.id}::`)).length;
                        const repair = REPAIR_TYPES.find((item) => item.id === service.repairId);
                        return <div key={service.id} className="border-b border-[#E5E7EB] last:border-0">
                          <button type="button" onClick={() => setEstimationExpanded(isOpen ? "service" : `service:${service.id}`)} className="flex w-full items-center gap-3 px-2 py-3 text-left"><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#30343B]">{service.label} {service.id === "nouveau" && <span className="ml-1 rounded bg-[#D92D35] px-1.5 py-0.5 text-[9px] text-white">NOUVEAU</span>}</span><span className="block text-[11px] text-[#64748B]">{service.description}</span></span>{count > 0 && <span className="rounded-full bg-[#DDF4F0] px-2 py-1 text-[10px] font-black text-[#16806A]">{count}</span>}<ChevronDown size={19} className={`shrink-0 text-[#FF8A1F] transition ${isOpen ? "rotate-180" : ""}`} /></button>
                          {isOpen && repair && <div className="mb-2 rounded-lg bg-white px-2">
                            {(service as { manual?: boolean }).manual ? <div className="space-y-2 px-2 py-2"><input className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm outline-none" placeholder="Décrivez votre besoin" value={descriptionLibre} onChange={(event) => setDescriptionLibre(event.target.value)} /><button type="button" onClick={() => toggleEstimateService(service.id, repair.subTypes[repair.subTypes.length - 1].label)} className="w-full rounded-lg bg-[#08A9C4] py-2 text-xs font-bold text-white">Ajouter cette demande</button></div> : repair.subTypes.map((subType) => { const key = `${service.id}::${subType.label}`; const checked = estimationSelections.includes(key); return <button key={subType.label} type="button" onClick={() => toggleEstimateService(service.id, subType.label)} className="flex w-full items-center gap-3 border-b border-[#EEF2F4] px-2 py-3 text-left last:border-0"><span className="min-w-0 flex-1 text-sm text-[#334155]">{subType.label}</span><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${checked ? "border-[#08A9C4] bg-[#08A9C4] text-white" : "border-[#CBD5E1] bg-white"}`}>{checked && <Check size={15} />}</span></button>; })}
                          </div>}
                        </div>;
                      })}
                    </div>
                  </div>}
                </div>
              </div>

              <div className="mt-5 border-t border-[#E5E7EB] pt-4"><p className="mb-3 text-center text-xs text-[#64748B]">Véhicule identifié · zone renseignée · prestations sélectionnées</p><button type="button" disabled={!canSeeTariffs} onClick={() => setEstimationStep(2)} className="w-full rounded-2xl bg-[#FF8A1F] py-4 text-base font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40">VOIR LES TARIFS</button></div>
            </section>
          )}

          {estimationStep === 2 && (
            <section className="space-y-4">
              <div className="rounded-[28px] bg-gradient-to-br from-[#063B5C] to-[#087B91] p-5 text-white shadow-2xl"><p className="text-xs font-bold uppercase tracking-wider text-white/70">Estimation indicative</p><h2 className="mt-2 text-3xl font-black">{estimationTotals.min} – {estimationTotals.max} €</h2><p className="mt-1 text-sm text-white/80">{selectedServiceCount} prestation{selectedServiceCount > 1 ? "s" : ""} sélectionnée{selectedServiceCount > 1 ? "s" : ""} · {positionSearch || "Zone à préciser"}</p><p className="mt-3 text-xs text-white/70">Durée indicative cumulée : {Math.floor(estimationTotals.durationMin / 60)}h{(estimationTotals.durationMin % 60).toString().padStart(2, "0")} à {Math.floor(estimationTotals.durationMax / 60)}h{(estimationTotals.durationMax % 60).toString().padStart(2, "0")}</p></div>
              <div className="rounded-[28px] border border-white/60 bg-white p-5 shadow-2xl"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-[#102A43]">Garages compatibles</h2><p className="text-xs text-[#64748B]">{estimationCategory === "carrosserie" ? "Carrosserie, peinture et vitrage" : "Mécanique et entretien"} · classés par note.</p></div><button type="button" onClick={() => setEstimationStep(1)} className="text-xs font-bold text-[#087B91]">Modifier les détails</button></div>
                <div className="mt-4 space-y-3">{garagesQuery.isFetching && <p className="py-5 text-center text-sm text-[#64748B]">Recherche des garages partenaires…</p>}{!garagesQuery.isFetching && estimateGarages.length === 0 && <p className="py-5 text-center text-sm text-[#64748B]">Aucun garage compatible trouvé pour cette zone.</p>}{estimateGarages.slice(0, 10).map((garage) => <div key={garage.id} className="rounded-2xl border border-[#E5E7EB] p-4"><div className="flex items-start gap-3"><img src={garage.coverUrl || "/categories/loc_berline.jpg"} alt="" className="h-14 w-16 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-[#102A43]">{garage.name}</p><p className="mt-1 text-xs text-[#64748B]">{[garage.city, garage.addressLine].filter(Boolean).join(" · ")}</p><div className="mt-1 flex items-center gap-1 text-xs"><Star size={12} className="fill-[#D4AF37] text-[#D4AF37]" /><b>{Number(garage.rating || 0).toFixed(1)}</b><span className="text-[#94A3B8]">({garage.reviewCount || 0} avis)</span></div></div><div className="text-right"><p className="text-xs font-black text-[#0B6B8F]">{estimationTotals.min} – {estimationTotals.max} €</p><p className="text-[10px] text-[#94A3B8]">indicatif</p></div></div><p className="mt-3 rounded-lg bg-[#F8FAFC] px-3 py-2 text-[11px] text-[#64748B]">Coordonnées protégées. La réservation, les échanges et le paiement restent dans MKA.P-MS.</p><button type="button" onClick={() => navigate(`/garages?devis=1&garage=${garage.id}&source=estimation`)} className="mt-3 w-full rounded-xl bg-[#087B91] py-3 text-xs font-bold text-white">Choisir ce garage et continuer</button></div>)}</div>
                <p className="mt-4 text-[11px] leading-relaxed text-[#64748B]">Les coordonnées directes du garage ne sont pas affichées dans l'estimation. Toute réservation, annulation, messagerie et paiement passent par la plateforme afin de protéger le client et le garage.</p>
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     LANDING PAGE — Page vitrine Réparer
     ════════════════════════════════════════════════════════════ */

  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-[#F5F3EF]">
        {/* MÉDIA PUBLICITAIRE D'ORIGINE — contenu vidéo conservé */}
        <div className="relative overflow-hidden bg-[#111]" style={{ height: 320 }}>
          {HERO_VIDEOS.map((video, i) => (
            <video
              key={video.src}
              ref={(el) => { videoRefs.current[i] = el; }}
              // Ne charger que la vidéo active : les 5 vidéos (plusieurs Mo chacune)
              // demandées en même temps saturaient la connexion et empêchaient la
              // première de démarrer (constaté même hors React, 5 <video> statiques
              // suffisent à le reproduire). Chaque vidéo n'est récupérée qu'au
              // moment où le carrousel l'affiche.
              src={i === heroVidIdx ? video.src : undefined}
              autoPlay={i === 0}
              muted
              playsInline
              loop
              className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-700"
              style={{ opacity: i === heroVidIdx ? 0.7 : 0, zIndex: i === heroVidIdx ? 1 : 0 }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-[#111]/30 via-[#111]/10 to-[#111]/50" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
              <Wrench size={12} /> Réparation &amp; Entretien
            </span>
            <h1 className="text-[26px] font-black leading-tight text-white md:text-4xl">
              Réseau de réparation <span className="text-[#D4AF37]">MKA.P-MS</span>
            </h1>
            <p className="mt-2 max-w-sm text-sm text-white/70">Garages certifiés, devis instantané, catalogue complet de pièces.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {[
                { val: garagesQuery.data ? `${garagesQuery.data.total}` : "...", label: "garages certifiés" },
                { val: "4,8/5", label: "satisfaction client" },
                { val: "2 min", label: "devis instantané" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center rounded-xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
                  <span className="text-base font-black text-[#D4AF37]">{stat.val}</span>
                  <span className="mt-0.5 text-[9px] text-white/60">{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {HERO_VIDEOS.map((video, i) => (
                <button key={video.label} onClick={() => setHeroVidIdx(i)} className={`flex flex-col items-center gap-1 transition-all duration-300 ${i === heroVidIdx ? "opacity-100" : "opacity-35 hover:opacity-60"}`}>
                  <div className="relative h-[3px] overflow-hidden rounded-full" style={{ width: i === heroVidIdx ? 40 : 20, background: "rgba(255,255,255,0.25)", transition: "width 0.3s" }}>
                    {i === heroVidIdx && <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${heroProgress}%`, background: "linear-gradient(90deg, #D4AF37, #F5D76E)", boxShadow: "0 0 6px #D4AF37", transition: "width 0.1s linear" }} />}
                  </div>
                  <span className={`text-[8px] font-semibold tracking-wide ${i === heroVidIdx ? "text-[#D4AF37]" : "text-white/50"}`}>{video.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENU SOUS LE MÉDIA — média/hero conservé intact */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-8 space-y-8">
          <section className="text-center max-w-2xl mx-auto">
            <div className="mx-auto mb-3 h-1 w-16 rounded-full bg-[#0B6B8F]" />
            <h2 className="text-2xl md:text-3xl font-black text-[#102A43]">
              Une réparation claire, au juste prix
            </h2>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-[#64748B]">
              Des informations transparentes, des professionnels vérifiés et un suivi complet de votre réparation, de la prise de rendez-vous jusqu’à la fin des travaux.
            </p>
          </section>

          <section>
            <button
              type="button"
              className="group w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#063B5C] via-[#075985] to-[#0B6B8F] p-5 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              onClick={() => {
                navigate("/devis?estimation=1");
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/25">
                  <Settings size={28} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-black">Simuler le prix</h2>
                  <p className="mt-1 text-sm text-white/80">
                    Choisissez vos prestations et comparez les prix des garages.
                  </p>
                </div>
                <ArrowRight size={24} className="shrink-0 transition group-hover:translate-x-1" />
              </div>
            </button>
          </section>

          <section className="mx-auto grid max-w-[900px] grid-cols-3 gap-2 md:gap-3" aria-label="Services de réparation">
            {[
              {
                title: "Garage",
                desc: "Mécanique et réparation",
                to: "/garage",
                image: "/images/services/garage.jpg",
                icon: Wrench,
              },
              {
                title: "Carrosserie",
                desc: "Peinture et réparation",
                to: "/garage/carrosserie-garage",
                image: "/images/services/carrosserie.jpg",
                icon: Shield,
              },
              {
                title: "Diagnostic",
                desc: "Contrôle et entretien",
                to: "/garage/diagnostic-garage",
                image: "/images/services/diagnostic.jpg",
                icon: Search,
              },
            ].map((service) => (
              <Link
                key={service.title}
                to={service.to}
                className="group overflow-hidden rounded-xl border border-[#DCE6EE] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-[1.12] overflow-hidden bg-[#EAF2F7]">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#062B40]/85 via-transparent to-transparent" />
                  <div className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-[#0B6B8F]">
                    <service.icon size={14} />
                  </div>
                  <ArrowRight size={14} className="absolute right-1.5 top-1.5 text-white" />
                </div>
                <div className="p-2 md:p-2.5">
                  <h3 className="text-xs md:text-sm font-black text-[#102A43]">{service.title}</h3>
                  <p className="mt-0.5 text-[9px] md:text-[10px] leading-snug text-[#64748B]">{service.desc}</p>
                </div>
              </Link>
            ))}
          </section>

          <section>
            <button
              type="button"
              className="group flex w-full items-center gap-4 rounded-2xl border border-[#D6D0F2] bg-gradient-to-r from-[#20233A] via-[#2D3150] to-[#3F4670] p-5 text-left text-white shadow-lg shadow-[#20233A]/15 transition hover:-translate-y-0.5 hover:shadow-xl"
              onClick={() => {
                navigate("/garages?devis=1");
              }}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#DCD8FF] ring-1 ring-white/20">
                <FileText size={28} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black text-white">Obtenir un devis</h2>
                <p className="mt-1 text-sm text-white/75">
                  Décrivez votre besoin et recevez des propositions de garages vérifiés.
                </p>
              </div>
              <ArrowRight size={24} className="shrink-0 text-[#DCD8FF] transition group-hover:translate-x-1" />
            </button>
          </section>

          <section className="grid grid-cols-2 gap-4 pb-10 md:grid-cols-4">
            {[
              { title: "Garages vérifiés", icon: Shield },
              { title: "Prix transparents", icon: CheckCircle },
              { title: "Suivi jusqu’à la fin", icon: Calendar },
              { title: "Service client 7J/7", icon: Headphones },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#E7F6F1] text-[#16806A]">
                  <item.icon size={20} />
                </div>
                <p className="mt-2 text-xs font-bold text-[#102A43]">{item.title}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     FLUX 7 ÉTAPES — Réparation / Devis
     ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#F6F4FB] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo FERMÉ (Version 1 – Terre) : surface interne */}
            <img src="/logo-closed.png" alt="MKA.P-MS" className="h-8 w-auto" draggable={false} />
            <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Réparer / Garage
            </span>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 md:gap-4">
          {STEPS_LABELS.map((s, i) => {
            const done = step > s.num + 1;
            const active = step === s.num + 1;
            const realStep = s.num;
            return (
              <div key={s.num} className="flex items-center gap-2 md:gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition
                      ${done ? "bg-green-500 text-white" : active ? "bg-[#D4AF37] text-white" : "bg-[#E5E7EB] text-[#9CA3AF]"}`}
                  >
                    {done ? <CheckCircle size={16} /> : realStep}
                  </div>
                  <span className={`mt-1 text-[10px] font-semibold ${active ? "text-[#111]" : "text-[#9CA3AF]"}`}>{s.label}</span>
                </div>
                {i < STEPS_LABELS.length - 1 && (
                  <div className={`h-0.5 w-8 md:w-16 ${done ? "bg-green-400" : "bg-[#E5E7EB]"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Retour */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <button
          className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#111]"
          onClick={() => {
            if (step <= 2) setMode("landing");
            else setStep(step - 1);
          }}
        >
          <ArrowLeft size={14} /> {step <= 2 ? "Retour à l'accueil" : "Retour"}
        </button>
      </div>

      {/* ═══════════════════════════════════════
          ÉTAPE 2 — IDENTIFICATION VÉHICULE
         ═══════════════════════════════════════ */}
      {step <= 2 && (
      <div className="max-w-4xl mx-auto px-4 mt-6">
          <h1 className="text-2xl font-black text-[#111] text-center">
            IDENTIFIEZ VOTRE <span className="text-[#D4AF37]">VÉHICULE</span>
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] text-center max-w-lg mx-auto">
            Renseignez votre plaque d'immatriculation ou votre numéro VIN.
            Nous récupérerons automatiquement les informations de votre véhicule.
          </p>

          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {/* Formulaire */}
            <div className="rounded-[28px] border border-[#DCD8F2] bg-gradient-to-br from-white to-[#F3F1FC] p-6 shadow-[0_18px_50px_rgba(48,43,95,0.10)]">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#6658D9] text-white shadow-lg shadow-[#6658D9]/20">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6658D9]">Devis personnalisé</p>
                  <h2 className="mt-1 text-xl font-black text-[#20233A]">Identifiez votre véhicule</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">Une identification rapide pour préparer un devis adapté à votre garage, carrosserie ou entretien.</p>
                </div>
              </div>
              {/* Tabs Plaque / VIN */}
              <div className="mb-4 flex rounded-xl bg-[#E9E7F8] p-1">
                <button
                  onClick={() => setIdentTab("plaque")}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold text-center transition ${identTab === "plaque" ? "bg-white text-[#312E81] shadow-sm" : "text-[#6B7280]"}`}
                >
                  PLAQUE D'IMMATRICULATION
                </button>
                <button
                  onClick={() => setIdentTab("vin")}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold text-center transition ${identTab === "vin" ? "bg-white text-[#312E81] shadow-sm" : "text-[#6B7280]"}`}
                >
                  NUMÉRO VIN
                </button>
              </div>

              {identTab === "plaque" ? (
                <div className="flex items-center gap-2 rounded-xl border-2 border-[#E5E7EB] p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-[#312E81] text-white text-[10px] font-bold shrink-0">FR</div>
                  <input
                    className="flex-1 bg-transparent text-lg font-bold text-[#20233A] outline-none placeholder:text-[#B8B8C8]"
                    placeholder="Ex : AB-123-CD"
                    value={plaque}
                    onChange={(e) => setPlaque(e.target.value.toUpperCase())}
                  />
                </div>
              ) : (
                <input
                  className="w-full rounded-xl border-2 border-[#DCD8F2] bg-white/80 p-3 text-sm font-bold text-[#20233A] outline-none placeholder:text-[#B8B8C8]"
                  placeholder="Ex : VF1XXXXXXXXXX"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  maxLength={17}
                />
              )}

              <p className="mt-2 text-[10px] text-[#9CA3AF] flex items-center gap-1">
                <Info size={10} /> {identTab === "plaque" ? "Entrez votre plaque d'immatriculation française." : "Le numéro VIN se trouve sur la carte grise ou sur le châssis."}
              </p>

              <button
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6658D9] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6658D9]/20 transition hover:bg-[#5548C4] disabled:opacity-50"
                disabled={(!plaque.trim() && !vin.trim()) || plateLoading}
                onClick={identifierVehicule}
              >
                <Search size={16} />
                {plateLoading ? "Recherche en cours..." : "Identifier mon véhicule"}
              </button>

              <div className="mt-4">
                <button className="flex w-full items-center justify-between rounded-xl border border-[#DCD8F2] bg-white/70 px-4 py-3 text-left text-sm font-bold text-[#312E81] transition hover:bg-white" onClick={() => setFlowManualOpen((v) => !v)}>
                  <span className="flex items-center gap-2"><Settings size={16} /> Saisie manuelle</span>
                  <ChevronDown size={18} className={`transition ${flowManualOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {flowManualOpen && (
                <div className="mt-3 space-y-3 rounded-2xl border border-[#DCD8F2] bg-white/80 p-4">
                  <p className="text-xs leading-relaxed text-[#6B7280]">Complétez les informations si l’identification automatique n’est pas disponible.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="rounded-lg border border-[#DCD8F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#6658D9]" placeholder="Marque *" value={vehicule.marque} onChange={(e) => setVehicule({ ...vehicule, marque: e.target.value })} />
                    <input className="rounded-lg border border-[#DCD8F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#6658D9]" placeholder="Modèle *" value={vehicule.modele} onChange={(e) => setVehicule({ ...vehicule, modele: e.target.value })} />
                    <input className="rounded-lg border border-[#DCD8F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#6658D9]" placeholder="Année" inputMode="numeric" value={vehicule.annee} onChange={(e) => setVehicule({ ...vehicule, annee: e.target.value })} />
                    <input className="rounded-lg border border-[#DCD8F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#6658D9]" placeholder="Kilométrage actuel" inputMode="numeric" value={vehicule.kilometrage} onChange={(e) => setVehicule({ ...vehicule, kilometrage: e.target.value })} />
                    <input className="col-span-2 rounded-lg border border-[#DCD8F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#6658D9]" placeholder="Énergie" value={vehicule.carburant} onChange={(e) => setVehicule({ ...vehicule, carburant: e.target.value })} />
                  </div>
                  <button
                    className="w-full rounded-xl bg-[#20233A] py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50"
                    disabled={!vehicule.marque.trim() || !vehicule.modele.trim()}
                    onClick={() => setStep(3)}
                  >
                    Continuer avec ce véhicule
                  </button>
                </div>
              )}

              <div className="mt-5 flex items-center gap-2 text-[#9CA3AF]">
                <Shield size={14} />
                <p className="text-[10px]">Vos données sont sécurisées et confidentielles. Nous ne stockons aucune information sans votre accord.</p>
              </div>
            </div>

            {/* Infos récupérées (exemple) */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#111] mb-3">Exemple d'informations récupérées automatiquement</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Marque", value: "Peugeot", icon: "🚗" },
                    { label: "Modèle", value: "308 II", icon: "🏷️" },
                    { label: "Durée", value: "2020", icon: "📅" },
                    { label: "Énergie", value: "Diesel", icon: "⛽" },
                    { label: "Boîte", value: "Manuelle", icon: "⚙️" },
                    { label: "Portes", value: "5", icon: "🚪" },
                  ].map((info) => (
                    <div key={info.label} className="text-center rounded-xl bg-[#F9FAFB] p-3">
                      <p className="text-lg">{info.icon}</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-1">{info.label}</p>
                      <p className="text-xs font-bold text-[#111]">{info.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl overflow-hidden">
                <img src="/categories/loc_berline.jpg" alt="Véhicule" className="w-full h-40 object-cover rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          ÉTAPE 3 — TYPE DE RÉPARATION
         ═══════════════════════════════════════ */}
      {step === 3 && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <h1 className="text-2xl font-black text-[#111] text-center">
            QUEL TYPE DE <span className="text-[#D4AF37]">RÉPARATION ?</span>
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] text-center">
            Sélectionnez le type de réparation ou d'entretien dont vous avez besoin.
          </p>

          {/* Véhicule identifié */}
          {vehicule.marque && (
            <div className="mt-4 rounded-2xl bg-white border border-green-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-14 w-20 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">🚗</div>
                <div>
                  <p className="text-base font-extrabold text-[#111]">{vehicule.marque} {vehicule.modele}</p>
                  <p className="text-xs text-[#6B7280]">{vehicule.version}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {vehicule.annee && <span className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold">{vehicule.annee}</span>}
                    {vehicule.carburant && <span className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold">{vehicule.carburant}</span>}
                    {vehicule.boite && <span className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold">{vehicule.boite}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grille 8 types */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {REPAIR_TYPES.map((rt) => (
              <button
                key={rt.id}
                onClick={() => { setSelectedRepairId(rt.id); setSelectedSubType(rt.subTypes[0]?.label || ""); }}
                className={`rounded-2xl border-2 p-5 text-center transition hover:shadow-md ${
                  selectedRepairId === rt.id
                    ? "border-[#D4AF37] bg-[#FFFBEB] shadow-md"
                    : "border-[#E5E7EB] bg-white"
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3EF] text-[#D4AF37]">
                  {repairIcon(rt.id)}
                </div>
                <h3 className="mt-3 text-sm font-bold text-[#111]">{rt.label}</h3>
                <p className="mt-1 text-[10px] text-[#6B7280] leading-tight">{rt.desc}</p>
              </button>
            ))}
          </div>

          {/* Sous-type + description */}
          {selectedRepair && (
            <div className="mt-6 rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider">Précisez votre besoin</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedRepair.subTypes.map((st) => (
                  <button
                    key={st.label}
                    onClick={() => setSelectedSubType(st.label)}
                    className={`rounded-xl border-2 p-3 text-left text-xs font-semibold transition ${
                      selectedSubType === st.label ? "border-[#D4AF37] bg-[#FFFBEB] text-[#111]" : "border-[#E5E7EB] text-[#6B7280]"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Décrivez votre besoin en détail (optionnel)</label>
                <textarea
                  className="w-full rounded-xl border border-[#E5E7EB] p-3 text-sm text-[#111] outline-none placeholder:text-[#D1D5DB] min-h-20"
                  placeholder="Décrivez votre problème ou besoin..."
                  value={descriptionLibre}
                  onChange={(e) => setDescriptionLibre(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(2)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#F3F4F6]">
              <ArrowLeft size={14} /> Retour
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!selectedRepairId}
              className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              Obtenir mon devis <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          ÉTAPE 4 — DEVIS / ESTIMATION
         ═══════════════════════════════════════ */}
      {step === 4 && selectedRepair && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <h1 className="text-2xl font-black text-[#111] text-center">
            VOTRE DEVIS EST <span className="text-[#D4AF37]">PRÊT</span>
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] text-center">
            Voici une estimation basée sur les informations de votre véhicule et le type de réparation sélectionné.
          </p>

          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {/* Véhicule + intervention */}
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
              {vehicule.marque && (
                <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB]">
                  <div className="h-16 w-24 rounded-xl bg-slate-100 flex items-center justify-center text-3xl">🚗</div>
                  <div>
                    <p className="text-sm font-extrabold text-[#111]">{vehicule.marque} {vehicule.modele}</p>
                    <p className="text-[10px] text-[#6B7280]">{vehicule.version}</p>
                    <p className="text-[10px] text-[#6B7280]">{vehicule.annee} · {vehicule.carburant} · {vehicule.boite}</p>
                  </div>
                </div>
              )}
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                    {repairIcon(selectedRepair.id, 20)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111]">{selectedRepair.label}</p>
                    <p className="text-xs text-[#6B7280]">{selectedSubType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Estimation */}
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider mb-3">Estimation du devis</h3>
              {estimation && (
                <>
                  <div className="text-center rounded-xl bg-[#FFFBEB] border-2 border-[#D4AF37] p-4 mb-4">
                    <p className="text-2xl font-black text-[#D4AF37]">{estimation.totalMin} € – {estimation.totalMax} € <span className="text-sm font-normal text-[#6B7280]">TTC</span></p>
                    <p className="text-xs text-[#6B7280] mt-1">Durée estimée : {Math.floor(estimation.dureeMin / 60)}h{(estimation.dureeMin % 60).toString().padStart(2, "0")} à {Math.floor(estimation.dureeMax / 60)}h{(estimation.dureeMax % 60).toString().padStart(2, "0")}</p>
                  </div>

                  <h4 className="text-xs font-bold text-[#111] mb-2">Détail de l'estimation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Main d'œuvre</span>
                      <span className="font-semibold">{estimation.moMin} – {estimation.moMax} €</span>
                    </div>
                    {selectedRepair.pieces.length > 0 && (
                      <>
                        <p className="text-xs font-bold text-[#111] mt-2">Pièces et filtres :</p>
                        {selectedRepair.pieces.map((p) => (
                          <div key={p.nom} className="flex justify-between text-xs">
                            <span className="text-[#6B7280]">{p.nom}</span>
                            <span className="font-semibold">{p.prixMin} – {p.prixMax} €</span>
                          </div>
                        ))}
                      </>
                    )}
                    <div className="border-t border-[#E5E7EB] pt-2 mt-2 flex justify-between font-bold">
                      <span>Total estimé</span>
                      <span className="text-[#D4AF37]">{estimation.totalMin} – {estimation.totalMax} €</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Avantages */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: FileText, text: "Devis gratuit", sub: "Sans engagement" },
              { icon: Eye, text: "Prix transparents", sub: "Aucun frais caché" },
              { icon: Shield, text: "Garages partenaires", sub: "Certifiés et vérifiés" },
              { icon: Calendar, text: "Réservation en ligne", sub: "24h/24 et 7/7" },
            ].map((a) => (
              <div key={a.text} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
                <a.icon size={18} className="text-[#D4AF37] mx-auto" />
                <p className="mt-1 text-xs font-bold text-[#111]">{a.text}</p>
                <p className="text-[10px] text-[#6B7280]">{a.sub}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[10px] text-[#9CA3AF] text-center flex items-center justify-center gap-1">
            <Info size={10} /> Le prix final peut varier selon le garage et l'état réel de votre véhicule.
          </p>

          {/* Navigation */}
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(3)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#F3F4F6]">
              <ArrowLeft size={14} /> Retour
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] flex items-center justify-center gap-2 transition"
            >
              Trouver un garage <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          ÉTAPE 5 — CARTE INTERACTIVE / GARAGES
         ═══════════════════════════════════════ */}
      {step === 5 && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <h1 className="text-2xl font-black text-[#111] text-center">
            TROUVEZ UN GARAGE <span className="text-[#D4AF37]">PRÈS DE CHEZ VOUS</span>
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] text-center">
            Sélectionnez un garage partenaire pour continuer.
          </p>

          {/* Barre de recherche */}
          <div className="mt-4 flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5">
              <MapPin size={16} className="text-[#9CA3AF]" />
              <input
                className="flex-1 text-sm text-[#111] outline-none placeholder:text-[#D1D5DB]"
                placeholder="Ma position"
                value={positionSearch}
                onChange={(e) => setPositionSearch(e.target.value)}
              />
            </div>
            <select className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#111]" value={rayonKm} onChange={(e) => setRayonKm(e.target.value)}>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
              <option value="50">50 km</option>
            </select>
            <button onClick={() => garagesQuery.refetch()} className="rounded-xl bg-[#111] px-4 py-2.5 text-sm font-bold text-white">Filtrer</button>
          </div>
          <p className="mt-2 text-[10px] text-[#9CA3AF] text-center">Le rayon de recherche n'est pas encore un filtre réel côté moteur : la ville, oui.</p>

          <div className="mt-4">
            {/* Liste garages — annuaire réel trpc.garages.list, jamais une liste inventée */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {garagesQuery.isFetching && <p className="text-sm text-[#6B7280] text-center py-6">Recherche des garages partenaires…</p>}
              {!garagesQuery.isFetching && garages.length === 0 && (
                <p className="text-sm text-[#6B7280] text-center py-6">Aucun garage partenaire trouvé pour le moment{positionSearch ? ` à « ${positionSearch} »` : ""}.</p>
              )}
              {garages.map((g) => (
                <div
                  key={g.id}
                  className={`rounded-2xl border-2 bg-white p-4 cursor-pointer transition hover:shadow-md ${
                    selectedGarageId === g.id ? "border-[#D4AF37] shadow-md" : "border-[#E5E7EB]"
                  }`}
                  onClick={() => setSelectedGarageId(g.id)}
                >
                  <div className="flex items-start gap-3">
                    <img src={g.coverUrl || "/categories/loc_berline.jpg"} alt={g.name} className="h-16 w-20 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#111] truncate">{g.name}</h3>
                        {g.featured && <Shield size={12} className="text-green-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-xs font-bold text-[#111]">{Number(g.rating).toFixed(1)}</span>
                        <span className="text-[10px] text-[#6B7280]">({g.reviewCount} avis)</span>
                      </div>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{g.city ?? g.addressLine ?? ""}</p>
                      {g.hours && <p className="text-[10px] text-[#6B7280] mt-0.5">{g.hours}</p>}
                    </div>
                    <button
                      className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-[10px] font-bold text-white shrink-0"
                      onClick={(e) => { e.stopPropagation(); setSelectedGarageId(g.id); setStep(6); }}
                    >
                      Voir le garage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          ÉTAPE 6 — PROFIL GARAGE
         ═══════════════════════════════════════ */}
      {step === 6 && selectedGarage && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <h1 className="text-2xl font-black text-[#111] text-center">
            PROFIL DU <span className="text-[#D4AF37]">GARAGE</span>
          </h1>

          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {/* Photo + infos réelles (garages_publics) */}
            <div className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-sm">
              <img src={selectedGarage.coverUrl || "/categories/loc_berline.jpg"} alt={selectedGarage.name} className="w-full h-48 object-cover" />
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-[#111]">{selectedGarage.name}</h2>
                  {selectedGarage.featured && <Shield size={16} className="text-green-500" />}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={12} className="text-[#D4AF37] fill-[#D4AF37]" />
                  <span className="text-sm font-bold text-[#111]">{Number(selectedGarage.rating).toFixed(1)}</span>
                  <span className="text-xs text-[#6B7280]">({selectedGarage.reviewCount} avis)</span>
                </div>
                {(selectedGarage.addressLine || selectedGarage.city) && (
                  <p className="mt-2 text-xs text-[#6B7280] flex items-center gap-1"><MapPin size={12} className="text-red-500" /> {[selectedGarage.addressLine, selectedGarage.city].filter(Boolean).join(", ")}</p>
                )}
                {selectedGarage.hours && <p className="mt-1 text-xs text-green-600 font-semibold">{selectedGarage.hours}</p>}
                {selectedGarage.description && <p className="mt-2 text-xs text-[#6B7280]">{selectedGarage.description}</p>}
              </div>
            </div>

            {/* Services + boutons */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#111] mb-3">Services proposés</h3>
                <ul className="space-y-2">
                  {(selectedGarage.services ?? "").split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                    <li key={s} className="flex items-center gap-2 text-xs text-[#374151]">
                      <CheckCircle size={12} className="text-[#D4AF37] shrink-0" /> {s}
                    </li>
                  ))}
                  {!selectedGarage.services && <li className="text-xs text-[#9CA3AF]">Ce garage n'a pas encore renseigné ses services.</li>}
                </ul>
              </div>

              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm space-y-2">
                <h3 className="text-sm font-bold text-[#111] mb-3">Actions</h3>
                <button
                  className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2"
                  onClick={() => setStep(7)}
                >
                  <FileText size={16} /> Demander un devis
                </button>
                <button
                  className="w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white flex items-center justify-center gap-2"
                  onClick={() => setStep(7)}
                >
                  <Calendar size={16} /> Réserver un rendez-vous
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {selectedGarage.phone ? (
                    <a href={`tel:${selectedGarage.phone}`} className="rounded-xl border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#111] flex items-center justify-center gap-2">
                      <Phone size={14} className="text-red-500" /> Appeler
                    </a>
                  ) : (
                    <span className="rounded-xl border border-[#E5E7EB] py-2.5 text-xs text-[#9CA3AF] flex items-center justify-center">Pas de téléphone renseigné</span>
                  )}
                  <button className="rounded-xl border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#111] flex items-center justify-center gap-2" onClick={() => navigate("/messages")}>
                    <MessageSquare size={14} className="text-red-500" /> Message
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                {[
                  { icon: FileText, text: "Devis gratuit" },
                  { icon: Eye, text: "Prix transparents" },
                ].map((a) => (
                  <div key={a.text} className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-center">
                    <a.icon size={14} className="text-[#D4AF37] mx-auto" />
                    <p className="mt-1 text-[10px] font-semibold text-[#111]">{a.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          ÉTAPE 7 — CONFIRMATION & PAIEMENT
         ═══════════════════════════════════════ */}
      {step === 7 && (
        <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          <h1 className="text-2xl font-black text-[#111] text-center">
            CONFIRMATION DE VOTRE <span className="text-[#D4AF37]">DEMANDE</span>
          </h1>

          {/* Stepper inline */}
          <div className="flex items-center justify-center gap-2 text-[10px] font-semibold">
            {["Véhicule", "Réparation", "Devis", "Réservation"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${i < 3 ? "bg-green-500 text-white" : "bg-[#D4AF37] text-white"}`}>
                  {i < 3 ? <Check size={10} /> : <span>{i + 1}</span>}
                </div>
                <span className="text-[#6B7280]">{s}</span>
                {i < 3 && <div className="h-0.5 w-6 bg-green-300" />}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Résumé véhicule */}
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
              <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Résumé de votre demande</h3>
              {vehicule.marque && (
                <div className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB]">
                  <div className="h-14 w-20 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">🚗</div>
                  <div>
                    <p className="text-sm font-extrabold text-[#111]">{vehicule.marque} {vehicule.modele}</p>
                    <p className="text-[10px] text-[#6B7280]">{vehicule.version}</p>
                    <p className="text-[10px] text-[#6B7280]">{vehicule.annee} · {vehicule.carburant} · {vehicule.boite}</p>
                  </div>
                </div>
              )}
              {selectedRepair && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
                      {repairIcon(selectedRepair.id, 16)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111]">{selectedRepair.label}</p>
                      <p className="text-[10px] text-[#6B7280]">{selectedSubType}</p>
                    </div>
                  </div>
                  {estimation && (
                    <div className="mt-2 rounded-xl bg-[#F9FAFB] p-3">
                      <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Estimation</span><span className="font-bold text-[#D4AF37]">{estimation.totalMin} – {estimation.totalMax} € TTC</span></div>
                      <div className="flex justify-between text-xs mt-1"><span className="text-[#6B7280]">Durée estimée</span><span className="font-semibold">{Math.floor(estimation.dureeMin / 60)}h{(estimation.dureeMin % 60).toString().padStart(2, "0")} – {Math.floor(estimation.dureeMax / 60)}h{(estimation.dureeMax % 60).toString().padStart(2, "0")}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Garage + RDV */}
            <div className="space-y-4">
              {selectedGarage && (
              <div className="rounded-2xl border border-[#DCD8F2] bg-white/80 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Garage consulté</h3>
                  <div className="flex items-center gap-3">
                    <img src={selectedGarage.coverUrl || "/categories/loc_berline.jpg"} alt={selectedGarage.name} className="h-14 w-20 rounded-xl object-cover shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-[#111]">{selectedGarage.name}</p>
                      <p className="text-[10px] text-[#6B7280]">{[selectedGarage.addressLine, selectedGarage.city].filter(Boolean).join(", ")}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={8} className="text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-[10px] font-bold">{Number(selectedGarage.rating).toFixed(1)}</span>
                        <span className="text-[10px] text-[#6B7280]">({selectedGarage.reviewCount} avis)</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-[#9CA3AF]">Votre demande sera transmise à l'ensemble des garages partenaires de votre secteur, celui-ci compris.</p>
                </div>
              )}

              {/* Rendez-vous */}
              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
                <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Votre rendez-vous</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] mb-1">Date</label>
                  <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
                    {availableDates.slice(0, 8).map((d) => {
                      const date = new Date(d);
                      const dayName = date.toLocaleDateString("fr-FR", { weekday: "short" });
                      const dayNum = date.getDate();
                      const month = date.toLocaleDateString("fr-FR", { month: "short" });
                      return (
                        <button
                          key={d}
                          onClick={() => setSelectedDate(d)}
                          className={`rounded-lg border p-2 text-center text-xs transition ${
                            selectedDate === d ? "border-[#D4AF37] bg-[#FFFBEB] font-bold" : "border-[#E5E7EB]"
                          }`}
                        >
                          <p className="text-[10px] text-[#9CA3AF]">{dayName}</p>
                          <p className="font-bold text-[#111]">{dayNum}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{month}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-[#6B7280] mb-1">Heure</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CRENEAUX.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCreneau(c)}
                        className={`rounded-lg border p-2 text-center text-xs transition ${
                          selectedCreneau === c ? "border-[#D4AF37] bg-[#FFFBEB] font-bold" : "border-[#E5E7EB]"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Paiement */}
              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
                <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Paiement sécurisé</h3>
                {estimation && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-[#111]">Total estimé</span>
                    <span className="text-lg font-black text-[#D4AF37]">{estimation.totalMin} – {estimation.totalMax} € TTC</span>
                  </div>
                )}
                <p className="text-[10px] text-[#6B7280]">Le paiement se fera après l'intervention au garage.</p>
                <div className="mt-2 flex items-center gap-3">
                  <Shield size={14} className="text-[#D4AF37]" />
                  <span className="text-[10px] text-[#6B7280]">Paiement sécurisé</span>
                  <Lock size={14} className="text-[#D4AF37]" />
                  <span className="text-[10px] text-[#6B7280]">Données protégées</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button onClick={() => setStep(6)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#F3F4F6]">
              <ArrowLeft size={14} /> Retour
            </button>
            <button
              onClick={submit}
              disabled={create.isPending || !selectedDate || !selectedCreneau}
              className="flex-1 rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              {create.isPending ? "Envoi en cours..." : "Confirmer ma demande"} <CheckCircle size={16} />
            </button>
          </div>
          {create.error && <p className="text-sm text-red-600 text-center">{create.error.message}</p>}

          {/* Aide */}
          <div className="rounded-xl bg-[#F9FAFB] p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#111]">Besoin d'aide ?</p>
              <p className="text-xs text-[#6B7280]">Notre équipe est disponible pour vous accompagner.</p>
            </div>
            <button className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white" onClick={() => navigate("/aide")}>
              Assistance en ligne
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          ÉTAPE 8 — SUCCÈS
         ═══════════════════════════════════════ */}
      {step === 8 && (
        <div className="max-w-md mx-auto px-4 mt-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="mt-6 text-2xl font-black text-[#111]">Demande envoyée !</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Votre demande de devis a été transmise aux garages partenaires de votre secteur{selectedGarage ? ` (dont ${selectedGarage.name})` : ""}. Vous serez notifié dès qu'un garage répond.
          </p>
          <div className="mt-6 space-y-3">
            <button onClick={() => navigate("/compte")} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white">
              Suivre ma demande
            </button>
            <button onClick={() => { setMode("landing"); setStep(1); }} className="w-full rounded-xl border border-[#E5E7EB] py-3 text-sm font-semibold text-[#111]">
              Nouvelle demande
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
