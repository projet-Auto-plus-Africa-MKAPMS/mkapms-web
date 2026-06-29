import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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

/* ═══════════════════════════════════════════════════════════
   GARAGES PARTENAIRES (demo)
   ═══════════════════════════════════════════════════════════ */
const GARAGES = [
  {
    id: 1, nom: "Garage AutoPlus", adresse: "12 Rue de la République, 92000 Nanterre",
    note: 4.8, avis: 128, tel: "01 42 00 00 01", distance: "1.2 km",
    photo: "/categories/loc_berline.jpg",
    services: ["Révision et entretien", "Freinage", "Pneumatiques", "Climatisation", "Diagnostic électronique"],
    horaires: "Ouvert · Ferme à 18h30", certifie: true, garantie: "Garantie constructeur préservée",
    prixMin: 180,
  },
  {
    id: 2, nom: "Speedy Service", adresse: "45 Avenue Jean Jaurès, 92100 Boulogne",
    note: 4.6, avis: 96, tel: "01 46 00 00 02", distance: "2.1 km",
    photo: "/categories/loc_suv.jpg",
    services: ["Freinage", "Pneus", "Révision", "Échappement", "Batterie"],
    horaires: "Ouvert · Ferme à 19h00", certifie: true, garantie: "Pièces garanties 24 mois",
    prixMin: 160,
  },
  {
    id: 3, nom: "Techni Auto", adresse: "8 Boulevard de la Défense, 92400 Courbevoie",
    note: 4.7, avis: 75, tel: "01 47 00 00 03", distance: "2.8 km",
    photo: "/categories/util_grand_fourgon.jpg",
    services: ["Diagnostic avancé", "Électricité", "Moteur", "Turbo", "Boîte de vitesse"],
    horaires: "Ouvert · Ferme à 18h00", certifie: true, garantie: "Garantie 12 mois pièces et main-d'œuvre",
    prixMin: 190,
  },
  {
    id: 4, nom: "MécaPro Express", adresse: "22 Rue de Sèvres, 92310 Sèvres",
    note: 4.5, avis: 62, tel: "01 45 00 00 04", distance: "4.5 km",
    photo: "/categories/loc_citadine.jpg",
    services: ["Révision", "Freinage", "Suspension", "Carrosserie", "Climatisation"],
    horaires: "Ouvert · Ferme à 18h00", certifie: false, garantie: "Pièces garanties 12 mois",
    prixMin: 150,
  },
  {
    id: 5, nom: "Garage du Pont", adresse: "3 Rue du Commerce, 75015 Paris",
    note: 4.9, avis: 204, tel: "01 48 00 00 05", distance: "5.2 km",
    photo: "/categories/pro_premium.jpg",
    services: ["Toutes marques", "Véhicules premium", "Hybrides & Électriques", "Diagnostic", "Entretien"],
    horaires: "Ouvert · Ferme à 19h30", certifie: true, garantie: "Garantie constructeur préservée",
    prixMin: 200,
  },
];

const CRENEAUX = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

export default function Devis() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  /* Mode : landing vs flow (7 steps) */
  const [mode, setMode] = useState<"landing" | "flow">("landing");
  const [step, setStep] = useState(1);
  const [entryPoint, setEntryPoint] = useState<"devis" | "garage">("devis");

  /* Identification véhicule */
  const [identTab, setIdentTab] = useState<"plaque" | "vin">("plaque");
  const [plaque, setPlaque] = useState("");
  const [vin, setVin] = useState("");
  const [plateLoading, setPlateLoading] = useState(false);
  const [vehicule, setVehicule] = useState({
    marque: "", modele: "", version: "", annee: "",
    carburant: "", boite: "", puissance: "", portes: "",
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

  const selectedRepair = REPAIR_TYPES.find((r) => r.id === selectedRepairId);
  const selectedGarage = GARAGES.find((g) => g.id === selectedGarageId);

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
          portes: r.portes ? String(r.portes) : "",
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
     LANDING PAGE — Page vitrine Réparer
     ════════════════════════════════════════════════════════════ */
  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-[#F5F3EF]">
        {/* HERO */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#2d2d2d]">
          <div className="absolute inset-0 opacity-25">
            <img src="/categories/loc_berline.jpg" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="relative px-4 py-10 md:py-16 md:px-8 max-w-6xl mx-auto">
            <div className="md:flex md:items-center md:justify-between md:gap-12">
              <div className="md:max-w-xl">
                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                  RÉPAREZ VOTRE<br />VÉHICULE EN TOUTE <span className="text-[#D4AF37]">CONFIANCE</span>
                </h1>
                <p className="mt-3 text-sm md:text-base text-white/70 max-w-md">
                  Devis rapide, garages de confiance, réservation en quelques clics.
                </p>
              </div>
              <div className="mt-6 md:mt-0 space-y-2">
                {[
                  { icon: FileText, text: "Devis en ligne" },
                  { icon: Building2, text: "Garages partenaires" },
                  { icon: ShoppingCart, text: "Comparaison des offres" },
                  { icon: Calendar, text: "Réservation rapide" },
                  { icon: Lock, text: "Paiement sécurisé" },
                  { icon: CheckCircle, text: "Satisfaction garantie" },
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

        {/* DEUX CARTES : Obtenir un devis / Trouver un garage */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto -mt-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Carte Devis */}
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                  <FileText size={22} className="text-[#D4AF37]" />
                </div>
                <h2 className="text-lg font-extrabold text-[#111]">OBTENIR UN DEVIS</h2>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">
                Décrivez votre besoin et recevez une estimation personnalisée.
              </p>
              <ul className="space-y-2 mb-5">
                {["Simple et rapide", "Devis transparents", "Garages certifiés", "Service client 7/7"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-[#374151]">
                    <CheckCircle size={14} className="text-green-500 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <button
                className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] transition"
                onClick={() => {
                  if (!user) { navigate("/connexion"); return; }
                  setEntryPoint("devis");
                  setMode("flow");
                  setStep(1);
                }}
              >
                Commencer
              </button>
            </div>

            {/* Carte Garage */}
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                  <Building2 size={22} className="text-[#D4AF37]" />
                </div>
                <h2 className="text-lg font-extrabold text-[#111]">TROUVER UN GARAGE</h2>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">
                Recherchez un garage partenaire près de chez vous.
              </p>
              <ul className="space-y-2 mb-5">
                {["Garages certifiés", "Avis clients vérifiés", "Devis gratuit", "Réservation en ligne"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-[#374151]">
                    <CheckCircle size={14} className="text-green-500 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <button
                className="w-full rounded-xl border-2 border-[#D4AF37] py-3.5 text-sm font-bold text-[#D4AF37] hover:bg-[#FFFBEB] transition"
                onClick={() => {
                  if (!user) { navigate("/connexion"); return; }
                  setEntryPoint("garage");
                  setMode("flow");
                  setStep(1);
                }}
              >
                Rechercher
              </button>
            </div>
          </div>
        </div>

        {/* AVANTAGES */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "Simple et rapide", desc: "Processus en ligne en quelques minutes", icon: Zap },
              { title: "Garages certifiés", desc: "Des professionnels de confiance", icon: Shield },
              { title: "Devis transparents", desc: "Aucun frais caché, prix clairs", icon: Eye },
              { title: "Service client 7/7", desc: "Nous sommes là pour vous aider", icon: Headphones },
            ].map((a) => (
              <div key={a.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10">
                  <a.icon size={22} className="text-[#D4AF37]" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-[#111]">{a.title}</h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA FINAL */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-10 mb-10">
          <div className="rounded-2xl bg-[#111] p-6 md:p-8 text-center">
            <h2 className="text-lg md:text-xl font-extrabold text-white">
              BESOIN D'UNE RÉPARATION ?
            </h2>
            <p className="mt-2 text-sm text-white/60 max-w-md mx-auto">
              Obtenez un devis gratuit et trouvez le meilleur garage en quelques clics.
            </p>
            <button
              className="mt-5 rounded-xl bg-[#D4AF37] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#C5A028] transition"
              onClick={() => {
                if (!user) { navigate("/connexion"); return; }
                setMode("flow");
                setStep(1);
              }}
            >
              Obtenir mon devis gratuit
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     FLUX 7 ÉTAPES — Réparation / Devis
     ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold tracking-tight text-noir">
              MK<span className="text-[#D4AF37]">A</span>.P-MS
            </span>
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
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
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
                <Info size={10} /> {identTab === "plaque" ? "Entrez votre plaque d'immatriculation française." : "Le numéro VIN se trouve sur la carte grise ou sur le châssis."}
              </p>

              <button
                className="mt-4 w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2 transition"
                disabled={(!plaque.trim() && !vin.trim()) || plateLoading}
                onClick={identifierVehicule}
              >
                <Search size={16} />
                {plateLoading ? "Recherche en cours..." : "Identifier mon véhicule"}
              </button>

              <div className="mt-4 text-center">
                <button className="text-sm font-semibold text-[#D4AF37] hover:underline" onClick={() => setStep(3)}>
                  Saisir manuellement →
                </button>
              </div>

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
            <button className="rounded-xl bg-[#111] px-4 py-2.5 text-sm font-bold text-white">Filtrer</button>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            {/* Carte */}
            <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm h-72 md:h-auto">
              <img
                src="/categories/loc_suv.jpg"
                alt="Carte garages"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Liste garages */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {GARAGES.map((g) => (
                <div
                  key={g.id}
                  className={`rounded-2xl border-2 bg-white p-4 cursor-pointer transition hover:shadow-md ${
                    selectedGarageId === g.id ? "border-[#D4AF37] shadow-md" : "border-[#E5E7EB]"
                  }`}
                  onClick={() => setSelectedGarageId(g.id)}
                >
                  <div className="flex items-start gap-3">
                    <img src={g.photo} alt={g.nom} className="h-16 w-20 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#111] truncate">{g.nom}</h3>
                        {g.certifie && <Shield size={12} className="text-green-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-xs font-bold text-[#111]">{g.note}</span>
                        <span className="text-[10px] text-[#6B7280]">({g.avis} avis)</span>
                        <span className="text-[10px] text-[#6B7280] ml-2">{g.distance}</span>
                      </div>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{g.horaires}</p>
                      {estimation && <p className="text-xs font-bold text-[#111] mt-1">À partir de {g.prixMin} €</p>}
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
              <button className="w-full rounded-xl border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#6B7280] hover:bg-[#F3F4F6]">
                Voir plus de garages
              </button>
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
            {/* Photo + infos */}
            <div className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-sm">
              <img src={selectedGarage.photo} alt={selectedGarage.nom} className="w-full h-48 object-cover" />
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-[#111]">{selectedGarage.nom}</h2>
                  {selectedGarage.certifie && <Shield size={16} className="text-green-500" />}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={12} className="text-[#D4AF37] fill-[#D4AF37]" />
                  <span className="text-sm font-bold text-[#111]">{selectedGarage.note}</span>
                  <span className="text-xs text-[#6B7280]">({selectedGarage.avis} avis) · Garage certifié</span>
                </div>
                <p className="mt-2 text-xs text-[#6B7280] flex items-center gap-1"><MapPin size={12} className="text-red-500" /> {selectedGarage.adresse}</p>
                <p className="mt-1 text-xs text-[#6B7280]">{selectedGarage.distance} de votre position</p>
                <p className="mt-1 text-xs text-green-600 font-semibold">{selectedGarage.horaires}</p>
                {selectedGarage.garantie && (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold text-green-700">
                    <CheckCircle size={10} /> {selectedGarage.garantie}
                  </p>
                )}
              </div>
            </div>

            {/* Services + boutons */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#111] mb-3">Services proposés</h3>
                <ul className="space-y-2">
                  {selectedGarage.services.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-xs text-[#374151]">
                      <CheckCircle size={12} className="text-[#D4AF37] shrink-0" /> {s}
                    </li>
                  ))}
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
                  <a href={`tel:${selectedGarage.tel}`} className="rounded-xl border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#111] flex items-center justify-center gap-2">
                    <Phone size={14} className="text-red-500" /> Appeler
                  </a>
                  <button className="rounded-xl border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#111] flex items-center justify-center gap-2" onClick={() => navigate("/messages")}>
                    <MessageSquare size={14} className="text-red-500" /> Message
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                {[
                  { icon: FileText, text: "Devis gratuit" },
                  { icon: Eye, text: "Prix transparents" },
                  { icon: Shield, text: "Pièces de qualité" },
                  { icon: Shield, text: "Garantie 12 mois" },
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
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Garage sélectionné</h3>
                  <div className="flex items-center gap-3">
                    <img src={selectedGarage.photo} alt={selectedGarage.nom} className="h-14 w-20 rounded-xl object-cover shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-[#111]">{selectedGarage.nom}</p>
                      <p className="text-[10px] text-[#6B7280]">{selectedGarage.adresse}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={8} className="text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-[10px] font-bold">{selectedGarage.note}</span>
                        <span className="text-[10px] text-[#6B7280]">({selectedGarage.avis} avis) · {selectedGarage.distance}</span>
                      </div>
                    </div>
                  </div>
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
            Votre demande de devis a été transmise{selectedGarage ? ` à ${selectedGarage.nom}` : ""}. Vous serez notifié dès qu'un garage répond.
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
