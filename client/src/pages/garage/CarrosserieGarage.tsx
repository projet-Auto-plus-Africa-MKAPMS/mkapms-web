import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ChevronDown, Paintbrush, Camera, FileText,
  Check, Clock, Star, MapPin, Phone, MessageSquare, Shield, Lock,
  CheckCircle, ArrowLeft, ArrowRight, Search, Info, Calendar, Eye,
  Headphones, Building2, Upload, Zap,
} from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import FileUpload from "../../components/FileUpload";

/* ═══════════════════════════════════════════════════════════
   TYPES DE TRAVAUX CARROSSERIE — Liste exhaustive
   ═══════════════════════════════════════════════════════════ */
const TRAVAUX_CARROSSERIE = [
  {
    id: "debosselage",
    label: "Débosselage",
    icon: "🔨",
    desc: "Réparation de bosses sans peinture (PDR) ou avec reprise",
    subTypes: [
      { label: "Débosselage sans peinture (petite bosse)", dureeMin: 30, dureeMax: 60 },
      { label: "Débosselage sans peinture (moyenne bosse)", dureeMin: 60, dureeMax: 120 },
      { label: "Débosselage avec reprise peinture", dureeMin: 120, dureeMax: 240 },
      { label: "Débosselage grêle (multiple)", dureeMin: 240, dureeMax: 480 },
    ],
    prixMin: 80, prixMax: 600,
  },
  {
    id: "peinture",
    label: "Peinture",
    icon: "🎨",
    desc: "Peinture complète ou partielle, retouches, vernis",
    subTypes: [
      { label: "Retouche locale (rayure)", dureeMin: 30, dureeMax: 60 },
      { label: "Peinture d'un élément (portière, aile, capot)", dureeMin: 180, dureeMax: 360 },
      { label: "Peinture complète véhicule", dureeMin: 1440, dureeMax: 2880 },
      { label: "Lustrage / Polissage carrosserie", dureeMin: 60, dureeMax: 120 },
      { label: "Traitement céramique", dureeMin: 120, dureeMax: 240 },
      { label: "Film de protection PPF", dureeMin: 240, dureeMax: 480 },
      { label: "Covering (wrapping complet)", dureeMin: 480, dureeMax: 960 },
    ],
    prixMin: 50, prixMax: 3500,
  },
  {
    id: "pare-chocs",
    label: "Pare-chocs",
    icon: "🛡️",
    desc: "Réparation ou remplacement pare-chocs avant/arrière",
    subTypes: [
      { label: "Réparation pare-chocs avant (fissure)", dureeMin: 60, dureeMax: 120 },
      { label: "Réparation pare-chocs arrière (fissure)", dureeMin: 60, dureeMax: 120 },
      { label: "Remplacement pare-chocs avant", dureeMin: 120, dureeMax: 240 },
      { label: "Remplacement pare-chocs arrière", dureeMin: 120, dureeMax: 240 },
      { label: "Peinture pare-chocs", dureeMin: 120, dureeMax: 180 },
    ],
    prixMin: 100, prixMax: 800,
  },
  {
    id: "ailes",
    label: "Ailes",
    icon: "🚗",
    desc: "Réparation ou remplacement d'ailes avant/arrière",
    subTypes: [
      { label: "Débosselage aile avant", dureeMin: 60, dureeMax: 120 },
      { label: "Débosselage aile arrière", dureeMin: 60, dureeMax: 120 },
      { label: "Remplacement aile avant", dureeMin: 120, dureeMax: 240 },
      { label: "Remplacement aile arrière", dureeMin: 180, dureeMax: 360 },
      { label: "Peinture aile", dureeMin: 120, dureeMax: 180 },
    ],
    prixMin: 120, prixMax: 900,
  },
  {
    id: "capot",
    label: "Capot",
    icon: "🔧",
    desc: "Réparation, remplacement ou peinture du capot",
    subTypes: [
      { label: "Débosselage capot", dureeMin: 60, dureeMax: 180 },
      { label: "Remplacement capot", dureeMin: 120, dureeMax: 240 },
      { label: "Peinture capot", dureeMin: 120, dureeMax: 240 },
      { label: "Réparation charnière/serrure capot", dureeMin: 30, dureeMax: 60 },
    ],
    prixMin: 80, prixMax: 1000,
  },
  {
    id: "portes",
    label: "Portes",
    icon: "🚪",
    desc: "Réparation, remplacement ou peinture de porte",
    subTypes: [
      { label: "Débosselage porte", dureeMin: 60, dureeMax: 120 },
      { label: "Remplacement porte complète", dureeMin: 180, dureeMax: 360 },
      { label: "Peinture porte", dureeMin: 120, dureeMax: 180 },
      { label: "Réparation mécanisme de porte", dureeMin: 60, dureeMax: 120 },
      { label: "Remplacement vitre de porte", dureeMin: 30, dureeMax: 60 },
    ],
    prixMin: 100, prixMax: 1200,
  },
  {
    id: "optiques",
    label: "Optiques",
    icon: "💡",
    desc: "Phares, feux arrière, clignotants, antibrouillards",
    subTypes: [
      { label: "Remplacement phare avant", dureeMin: 30, dureeMax: 60 },
      { label: "Remplacement feu arrière", dureeMin: 20, dureeMax: 45 },
      { label: "Rénovation optiques (polissage)", dureeMin: 30, dureeMax: 60 },
      { label: "Remplacement clignotant", dureeMin: 15, dureeMax: 30 },
      { label: "Remplacement antibrouillard", dureeMin: 20, dureeMax: 45 },
      { label: "Réglage phares", dureeMin: 15, dureeMax: 30 },
    ],
    prixMin: 30, prixMax: 500,
  },
  {
    id: "marbre",
    label: "Passage marbre",
    icon: "📐",
    desc: "Contrôle et redressage châssis sur banc de marbre",
    subTypes: [
      { label: "Contrôle géométrie châssis", dureeMin: 60, dureeMax: 120 },
      { label: "Redressage châssis (léger)", dureeMin: 240, dureeMax: 480 },
      { label: "Redressage châssis (important)", dureeMin: 480, dureeMax: 960 },
      { label: "Contrôle + rapport d'expertise", dureeMin: 60, dureeMax: 90 },
    ],
    prixMin: 150, prixMax: 2500,
  },
  {
    id: "remplacement",
    label: "Remplacement éléments",
    icon: "🔄",
    desc: "Rétroviseurs, poignées, moulures, badges, etc.",
    subTypes: [
      { label: "Remplacement rétroviseur", dureeMin: 20, dureeMax: 45 },
      { label: "Remplacement pare-brise", dureeMin: 60, dureeMax: 90 },
      { label: "Remplacement lunette arrière", dureeMin: 60, dureeMax: 90 },
      { label: "Remplacement moulure de porte", dureeMin: 15, dureeMax: 30 },
      { label: "Remplacement poignée de porte", dureeMin: 20, dureeMax: 45 },
      { label: "Remplacement grille de calandre", dureeMin: 20, dureeMax: 45 },
      { label: "Remplacement enjoliveur/cache-roue", dureeMin: 10, dureeMax: 15 },
      { label: "Remplacement toit ouvrant", dureeMin: 180, dureeMax: 360 },
      { label: "Autre remplacement", dureeMin: 30, dureeMax: 120 },
    ],
    prixMin: 20, prixMax: 800,
  },
];

/* ═══════════════════════════════════════════════════════════
   CARROSSIERS PARTENAIRES (demo)
   ═══════════════════════════════════════════════════════════ */
const CARROSSIERS = [
  {
    id: 1, nom: "Carrosserie AutoPlus", adresse: "15 Rue de l'Industrie, 92000 Nanterre",
    note: 4.9, avis: 156, tel: "01 42 00 10 01", distance: "1.5 km",
    photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&q=80",
    services: ["Débosselage", "Peinture complète", "Pare-chocs", "Passage marbre", "Traitement céramique", "Photos avant/après"],
    horaires: "Ouvert · Ferme à 18h00", certifie: true, garantie: "Garantie peinture 3 ans",
    specialites: ["Toutes marques", "Véhicules premium", "Expertise assurance"],
  },
  {
    id: 2, nom: "AD Carrosserie Boulogne", adresse: "28 Avenue du Général Leclerc, 92100 Boulogne",
    note: 4.7, avis: 98, tel: "01 46 00 10 02", distance: "2.3 km",
    photo: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400&q=80",
    services: ["Peinture", "Débosselage", "Remplacement éléments", "Lustrage", "Covering"],
    horaires: "Ouvert · Ferme à 18h30", certifie: true, garantie: "Pièces garanties 24 mois",
    specialites: ["Réseau AD", "Véhicule de courtoisie"],
  },
  {
    id: 3, nom: "Fix Auto Courbevoie", adresse: "5 Boulevard de la Défense, 92400 Courbevoie",
    note: 4.8, avis: 112, tel: "01 47 00 10 03", distance: "3.1 km",
    photo: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80",
    services: ["Réparation collision", "Peinture", "Marbre", "Optiques", "Expertise"],
    horaires: "Ouvert · Ferme à 19h00", certifie: true, garantie: "Garantie constructeur préservée",
    specialites: ["Agréé assurances", "Véhicules électriques", "PPF"],
  },
  {
    id: 4, nom: "Carrosserie du Parc", adresse: "42 Rue du Parc, 92300 Levallois",
    note: 4.6, avis: 74, tel: "01 45 00 10 04", distance: "4.0 km",
    photo: "https://images.unsplash.com/photo-1632823471565-1ecdf5c6da20?w=400&q=80",
    services: ["Débosselage sans peinture", "Retouches", "Polissage", "Ailes", "Capot"],
    horaires: "Ouvert · Ferme à 17h30", certifie: false, garantie: "Peinture garantie 12 mois",
    specialites: ["Débosselage PDR", "Petites réparations rapides"],
  },
];

export default function CarrosserieGarage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<"landing" | "flow">("landing");
  const [step, setStep] = useState(1);

  /* Identification */
  const [identTab, setIdentTab] = useState<"plaque" | "vin">("plaque");
  const [plaque, setPlaque] = useState("");
  const [vin, setVin] = useState("");
  const [plateLoading, setPlateLoading] = useState(false);
  const [vehicule, setVehicule] = useState({
    marque: "", modele: "", version: "", annee: "",
    carburant: "", boite: "",
  });

  /* Travaux */
  const [selectedTravauxId, setSelectedTravauxId] = useState("");
  const [selectedSubType, setSelectedSubType] = useState("");
  const [descriptionLibre, setDescriptionLibre] = useState("");

  /* Photos avant/après */
  const [photosAvant, setPhotosAvant] = useState<string[]>([]);
  const [photosApres, setPhotosApres] = useState<string[]>([]);

  /* Carrossier */
  const [selectedCarrossierId, setSelectedCarrossierId] = useState<number | null>(null);
  const [positionSearch, setPositionSearch] = useState("");

  /* RDV */
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCreneau, setSelectedCreneau] = useState("");

  const selectedTravaux = TRAVAUX_CARROSSERIE.find((t) => t.id === selectedTravauxId);
  const selectedCarrossier = CARROSSIERS.find((c) => c.id === selectedCarrossierId);

  const create = trpc.devis.create.useMutation({
    onSuccess: () => setStep(8),
  });

  async function identifierVehicule() {
    const query = plaque.trim() || vin.trim();
    const type = plaque.trim() ? "plaque" : "vin";
    if (!query) return;
    setPlateLoading(true);
    try {
      const r = await utils.annonces.lookupPlate.fetch({ type, query });
      if (r) {
        setVehicule({
          marque: r.marque || "", modele: r.modele || "",
          version: r.version || "", annee: r.annee ? String(r.annee) : "",
          carburant: r.carburant || "", boite: r.boite || "",
        });
        setStep(3);
      }
    } catch {} finally { setPlateLoading(false); }
  }

  function submit() {
    if (!user) return;
    create.mutate({
      contactNom: user.name,
      contactEmail: user.email,
      vehiculeMarque: vehicule.marque || undefined,
      vehiculeModele: vehicule.modele || undefined,
      vehiculeAnnee: vehicule.annee ? Number(vehicule.annee) : undefined,
      immatriculation: plaque || undefined,
      typeIntervention: `Carrosserie — ${selectedTravaux?.label || "Autre"}`,
      description: `${selectedSubType}${descriptionLibre ? ` — ${descriptionLibre}` : ""}`,
      ville: positionSearch || undefined,
      photos: [...photosAvant, ...photosApres],
      devisType: "pieces_main_oeuvre",
    });
  }

  const availableDates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= 21 && availableDates.length < 14; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) availableDates.push(d.toISOString().split("T")[0]);
  }
  const CRENEAUX = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

  const STEPS_LABELS = [
    { num: 1, label: "Véhicule" },
    { num: 2, label: "Travaux" },
    { num: 3, label: "Photos" },
    { num: 4, label: "Devis" },
    { num: 5, label: "Carrossier" },
    { num: 6, label: "Réservation" },
  ];

  /* ════════════════════════════════════════════════════════════
     LANDING PAGE
     ════════════════════════════════════════════════════════════ */
  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-[#F5F3EF]">
        {/* HERO */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#2d2d2d]">
          <div className="absolute inset-0 opacity-25">
            <img src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="relative px-4 py-10 md:py-16 md:px-8 max-w-6xl mx-auto">
            <div className="md:flex md:items-center md:justify-between md:gap-12">
              <div className="md:max-w-xl">
                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                  CARROSSERIE<br /><span className="text-[#D4AF37]">PROFESSIONNELLE</span>
                </h1>
                <p className="mt-3 text-sm md:text-base text-white/70 max-w-md">
                  Débosselage, peinture, réparation — des carrossiers certifiés près de chez vous.
                </p>
              </div>
              <div className="mt-6 md:mt-0 space-y-2">
                {[
                  { text: "Devis carrosserie gratuit" },
                  { text: "Photos avant / après" },
                  { text: "Carrossiers certifiés" },
                  { text: "Garantie peinture" },
                  { text: "Prise en charge assurance" },
                  { text: "Véhicule de courtoisie" },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-[#D4AF37] shrink-0" />
                    <span className="text-sm text-white/90">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DEUX CARTES */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto -mt-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                  <Paintbrush size={22} className="text-[#D4AF37]" />
                </div>
                <h2 className="text-lg font-extrabold text-[#111]">DEVIS CARROSSERIE</h2>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">Décrivez les dégâts et recevez une estimation de réparation.</p>
              <ul className="space-y-2 mb-5">
                {["Estimation immédiate", "Photos avant/après", "Devis transparent", "Sans engagement"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-[#374151]">
                    <CheckCircle size={14} className="text-green-500 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <button
                className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] transition"
                onClick={() => { if (!user) { navigate("/connexion"); return; } setMode("flow"); setStep(1); }}
              >
                Obtenir un devis carrosserie
              </button>
            </div>

            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                  <Building2 size={22} className="text-[#D4AF37]" />
                </div>
                <h2 className="text-lg font-extrabold text-[#111]">TROUVER UN CARROSSIER</h2>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">Trouvez un carrossier certifié près de chez vous.</p>
              <ul className="space-y-2 mb-5">
                {["Carrossiers agréés assurance", "Avis vérifiés", "Garantie peinture", "Véhicule de courtoisie"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-[#374151]">
                    <CheckCircle size={14} className="text-green-500 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <button
                className="w-full rounded-xl border-2 border-[#D4AF37] py-3.5 text-sm font-bold text-[#D4AF37] hover:bg-[#FFFBEB] transition"
                onClick={() => { if (!user) { navigate("/connexion"); return; } setMode("flow"); setStep(1); }}
              >
                Rechercher
              </button>
            </div>
          </div>
        </div>

        {/* TYPES DE TRAVAUX */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-10">
          <h2 className="text-xl font-extrabold text-[#111] text-center mb-6">NOS SPÉCIALITÉS CARROSSERIE</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {TRAVAUX_CARROSSERIE.slice(0, 10).map((t) => (
              <div key={t.id} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xl">{t.icon}</div>
                <h3 className="mt-2 text-xs font-bold text-[#111]">{t.label}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-10 mb-10">
          <div className="rounded-2xl bg-[#111] p-6 md:p-8 text-center">
            <h2 className="text-lg md:text-xl font-extrabold text-white">BESOIN D'UNE RÉPARATION CARROSSERIE ?</h2>
            <p className="mt-2 text-sm text-white/60 max-w-md mx-auto">Devis gratuit, carrossiers certifiés, garantie peinture.</p>
            <button
              className="mt-5 rounded-xl bg-[#D4AF37] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#C5A028] transition"
              onClick={() => { if (!user) { navigate("/connexion"); return; } setMode("flow"); setStep(1); }}
            >
              Obtenir mon devis gratuit
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     FLUX CARROSSERIE — 7 ÉTAPES
     ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <span className="text-lg font-extrabold tracking-tight">MK<span className="text-[#D4AF37]">A</span>.P-MS</span>
          <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">Carrosserie</span>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 md:gap-4">
          {STEPS_LABELS.map((s, i) => {
            const done = step > s.num + 1;
            const active = step === s.num + 1;
            return (
              <div key={s.num} className="flex items-center gap-2 md:gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${done ? "bg-green-500 text-white" : active ? "bg-[#D4AF37] text-white" : "bg-[#E5E7EB] text-[#9CA3AF]"}`}>
                    {done ? <CheckCircle size={16} /> : s.num}
                  </div>
                  <span className={`mt-1 text-[10px] font-semibold ${active ? "text-[#111]" : "text-[#9CA3AF]"}`}>{s.label}</span>
                </div>
                {i < STEPS_LABELS.length - 1 && <div className={`h-0.5 w-6 md:w-12 ${done ? "bg-green-400" : "bg-[#E5E7EB]"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Retour */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <button className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#111]" onClick={() => { if (step <= 2) setMode("landing"); else setStep(step - 1); }}>
          <ArrowLeft size={14} /> {step <= 2 ? "Retour" : "Retour"}
        </button>
      </div>

      {/* ÉTAPE 2 — IDENTIFICATION VÉHICULE */}
      {step <= 2 && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <h1 className="text-2xl font-black text-[#111] text-center">IDENTIFIEZ VOTRE <span className="text-[#D4AF37]">VÉHICULE</span></h1>
          <p className="mt-2 text-sm text-[#6B7280] text-center max-w-lg mx-auto">Renseignez votre plaque ou VIN pour identifier automatiquement votre véhicule.</p>

          <div className="mt-6 max-w-lg mx-auto rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
            <div className="flex border-b border-[#E5E7EB] mb-4">
              <button onClick={() => setIdentTab("plaque")} className={`flex-1 py-2.5 text-sm font-bold text-center border-b-2 transition ${identTab === "plaque" ? "border-[#D4AF37] text-[#111]" : "border-transparent text-[#9CA3AF]"}`}>PLAQUE D'IMMATRICULATION</button>
              <button onClick={() => setIdentTab("vin")} className={`flex-1 py-2.5 text-sm font-bold text-center border-b-2 transition ${identTab === "vin" ? "border-[#D4AF37] text-[#111]" : "border-transparent text-[#9CA3AF]"}`}>NUMÉRO VIN</button>
            </div>

            {identTab === "plaque" ? (
              <div className="flex items-center gap-2 rounded-xl border-2 border-[#E5E7EB] p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-[#003399] text-white text-[10px] font-bold shrink-0">FR</div>
                <input className="flex-1 text-lg font-bold text-[#111] outline-none placeholder:text-[#D1D5DB] bg-transparent" placeholder="Ex : AB-123-CD" value={plaque} onChange={(e) => setPlaque(e.target.value.toUpperCase())} />
              </div>
            ) : (
              <input className="w-full rounded-xl border-2 border-[#E5E7EB] p-3 text-sm font-bold text-[#111] outline-none placeholder:text-[#D1D5DB]" placeholder="Ex : VF1XXXXXXXXXX" value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} maxLength={17} />
            )}

            <button className="mt-4 w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2 transition" disabled={(!plaque.trim() && !vin.trim()) || plateLoading} onClick={identifierVehicule}>
              <Search size={16} /> {plateLoading ? "Recherche..." : "Identifier mon véhicule"}
            </button>
            <div className="mt-3 text-center">
              <button className="text-sm font-semibold text-[#D4AF37] hover:underline" onClick={() => setStep(3)}>Saisir manuellement →</button>
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 — TYPE DE TRAVAUX CARROSSERIE */}
      {step === 3 && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <h1 className="text-2xl font-black text-[#111] text-center">QUEL TYPE DE <span className="text-[#D4AF37]">TRAVAUX ?</span></h1>
          <p className="mt-2 text-sm text-[#6B7280] text-center">Sélectionnez le type de réparation carrosserie dont vous avez besoin.</p>

          {vehicule.marque && (
            <div className="mt-4 rounded-2xl bg-white border border-green-200 p-4 shadow-sm max-w-lg mx-auto">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🚗</div>
                <div>
                  <p className="text-base font-extrabold text-[#111]">{vehicule.marque} {vehicule.modele}</p>
                  <p className="text-xs text-[#6B7280]">{vehicule.annee} · {vehicule.carburant} · {vehicule.boite}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-3 md:grid-cols-5 gap-3">
            {TRAVAUX_CARROSSERIE.map((t) => (
              <button key={t.id} onClick={() => { setSelectedTravauxId(t.id); setSelectedSubType(t.subTypes[0]?.label || ""); }}
                className={`rounded-2xl border-2 p-4 text-center transition hover:shadow-md ${selectedTravauxId === t.id ? "border-[#D4AF37] bg-[#FFFBEB] shadow-md" : "border-[#E5E7EB] bg-white"}`}>
                <div className="mx-auto text-2xl mb-2">{t.icon}</div>
                <h3 className="text-xs font-bold text-[#111]">{t.label}</h3>
                <p className="mt-0.5 text-[9px] text-[#6B7280] leading-tight">{t.desc}</p>
              </button>
            ))}
          </div>

          {selectedTravaux && (
            <div className="mt-6 rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider">Précisez votre besoin</h3>
              <div className="grid grid-cols-2 gap-2">
                {selectedTravaux.subTypes.map((st) => (
                  <button key={st.label} onClick={() => setSelectedSubType(st.label)}
                    className={`rounded-xl border-2 p-3 text-left text-xs font-semibold transition ${selectedSubType === st.label ? "border-[#D4AF37] bg-[#FFFBEB] text-[#111]" : "border-[#E5E7EB] text-[#6B7280]"}`}>
                    {st.label}
                  </button>
                ))}
              </div>
              <textarea className="w-full rounded-xl border border-[#E5E7EB] p-3 text-sm text-[#111] outline-none placeholder:text-[#D1D5DB] min-h-20" placeholder="Décrivez les dégâts en détail..." value={descriptionLibre} onChange={(e) => setDescriptionLibre(e.target.value)} />
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(2)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#F3F4F6]"><ArrowLeft size={14} /> Retour</button>
            <button onClick={() => setStep(4)} disabled={!selectedTravauxId} className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2 transition">
              Continuer <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 4 — PHOTOS AVANT / APRÈS */}
      {step === 4 && (
        <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          <h1 className="text-2xl font-black text-[#111] text-center">PHOTOS <span className="text-[#D4AF37]">AVANT / APRÈS</span></h1>
          <p className="text-sm text-[#6B7280] text-center">Ajoutez des photos des dégâts pour un devis plus précis.</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white border-2 border-dashed border-red-300 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2"><Camera size={16} /> Photos AVANT (dégâts)</h3>
              <FileUpload label={`Ajouter des photos (${photosAvant.length}/10)`} accept="image/*" multiple maxFiles={10 - photosAvant.length}
                onUploaded={(files) => setPhotosAvant((prev) => [...prev, ...files.map((f) => f.url)].slice(0, 10))} />
              {photosAvant.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {photosAvant.map((p, i) => (
                    <div key={i} className="relative">
                      <img src={p} alt="" className="aspect-square w-full rounded-xl object-cover border border-red-200" />
                      <button onClick={() => setPhotosAvant((arr) => arr.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-[10px] text-white hover:bg-red-600">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white border-2 border-dashed border-green-300 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-green-600 mb-3 flex items-center gap-2"><Camera size={16} /> Photos APRÈS (optionnel)</h3>
              <p className="text-xs text-[#6B7280] mb-3">Pour un suivi complet, ajoutez les photos après réparation.</p>
              <FileUpload label={`Ajouter des photos (${photosApres.length}/10)`} accept="image/*" multiple maxFiles={10 - photosApres.length}
                onUploaded={(files) => setPhotosApres((prev) => [...prev, ...files.map((f) => f.url)].slice(0, 10))} />
              {photosApres.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {photosApres.map((p, i) => (
                    <div key={i} className="relative">
                      <img src={p} alt="" className="aspect-square w-full rounded-xl object-cover border border-green-200" />
                      <button onClick={() => setPhotosApres((arr) => arr.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-[10px] text-white hover:bg-red-600">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#F3F4F6]"><ArrowLeft size={14} /> Retour</button>
            <button onClick={() => setStep(5)} className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] flex items-center justify-center gap-2 transition">
              Voir le devis <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 5 — DEVIS / ESTIMATION */}
      {step === 5 && selectedTravaux && (
        <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          <h1 className="text-2xl font-black text-[#111] text-center">ESTIMATION <span className="text-[#D4AF37]">CARROSSERIE</span></h1>

          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
            {vehicule.marque && (
              <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB]">
                <div className="text-2xl">🚗</div>
                <div>
                  <p className="text-sm font-extrabold text-[#111]">{vehicule.marque} {vehicule.modele}</p>
                  <p className="text-[10px] text-[#6B7280]">{vehicule.annee} · {vehicule.carburant}</p>
                </div>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xl">{selectedTravaux.icon}</span>
              <div>
                <p className="text-sm font-bold text-[#111]">{selectedTravaux.label}</p>
                <p className="text-xs text-[#6B7280]">{selectedSubType}</p>
              </div>
            </div>

            <div className="mt-4 text-center rounded-xl bg-[#FFFBEB] border-2 border-[#D4AF37] p-5">
              <p className="text-xs text-[#6B7280]">Estimation carrosserie</p>
              <p className="text-2xl font-black text-[#D4AF37]">{selectedTravaux.prixMin} € – {selectedTravaux.prixMax} € <span className="text-sm font-normal text-[#6B7280]">TTC</span></p>
              <p className="text-xs text-[#6B7280] mt-1">
                Durée estimée : {Math.floor((selectedTravaux.subTypes.find((s) => s.label === selectedSubType)?.dureeMin || 60) / 60)}h{((selectedTravaux.subTypes.find((s) => s.label === selectedSubType)?.dureeMin || 60) % 60).toString().padStart(2, "0")} à {Math.floor((selectedTravaux.subTypes.find((s) => s.label === selectedSubType)?.dureeMax || 120) / 60)}h{((selectedTravaux.subTypes.find((s) => s.label === selectedSubType)?.dureeMax || 120) % 60).toString().padStart(2, "0")}
              </p>
            </div>

            {photosAvant.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-[#111] mb-2">Photos des dégâts ({photosAvant.length})</p>
                <div className="flex gap-2 overflow-x-auto">
                  {photosAvant.map((p, i) => <img key={i} src={p} alt="" className="h-16 w-16 rounded-lg object-cover border border-[#E5E7EB] shrink-0" />)}
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-[#9CA3AF] text-center flex items-center justify-center gap-1">
            <Info size={10} /> Le prix final peut varier selon le carrossier et l'étendue réelle des dégâts.
          </p>

          <div className="flex gap-3">
            <button onClick={() => setStep(4)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#F3F4F6]"><ArrowLeft size={14} /> Retour</button>
            <button onClick={() => setStep(6)} className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] flex items-center justify-center gap-2 transition">
              Trouver un carrossier <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 6 — RECHERCHE CARROSSIER */}
      {step === 6 && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <h1 className="text-2xl font-black text-[#111] text-center">TROUVEZ UN <span className="text-[#D4AF37]">CARROSSIER</span></h1>

          <div className="mt-4 flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5">
              <MapPin size={16} className="text-[#9CA3AF]" />
              <input className="flex-1 text-sm text-[#111] outline-none placeholder:text-[#D1D5DB]" placeholder="Votre ville" value={positionSearch} onChange={(e) => setPositionSearch(e.target.value)} />
            </div>
            <button className="rounded-xl bg-[#111] px-4 py-2.5 text-sm font-bold text-white">Rechercher</button>
          </div>

          <div className="mt-4 space-y-3">
            {CARROSSIERS.map((c) => (
              <div key={c.id} className={`rounded-2xl border-2 bg-white p-4 cursor-pointer transition hover:shadow-md ${selectedCarrossierId === c.id ? "border-[#D4AF37] shadow-md" : "border-[#E5E7EB]"}`} onClick={() => setSelectedCarrossierId(c.id)}>
                <div className="flex items-start gap-3">
                  <img src={c.photo} alt={c.nom} className="h-16 w-20 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#111] truncate">{c.nom}</h3>
                      {c.certifie && <Shield size={12} className="text-green-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
                      <span className="text-xs font-bold">{c.note}</span>
                      <span className="text-[10px] text-[#6B7280]">({c.avis} avis) · {c.distance}</span>
                    </div>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">{c.horaires}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.specialites.map((s) => <span key={s} className="rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[9px] font-semibold text-[#111]">{s}</span>)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <button className="rounded-lg bg-[#D4AF37] py-2 text-[10px] font-bold text-white" onClick={(e) => { e.stopPropagation(); setSelectedCarrossierId(c.id); setStep(7); }}>Devis</button>
                  <button className="rounded-lg bg-[#111] py-2 text-[10px] font-bold text-white" onClick={(e) => { e.stopPropagation(); setSelectedCarrossierId(c.id); setStep(7); }}>Réserver</button>
                  <a href={`tel:${c.tel}`} className="rounded-lg border border-[#E5E7EB] py-2 text-[10px] font-semibold text-[#111] text-center" onClick={(e) => e.stopPropagation()}>Appeler</a>
                  <button className="rounded-lg border border-[#E5E7EB] py-2 text-[10px] font-semibold text-[#111]" onClick={(e) => { e.stopPropagation(); navigate("/messages"); }}>Message</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ÉTAPE 7 — CONFIRMATION */}
      {step === 7 && (
        <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          <h1 className="text-2xl font-black text-[#111] text-center">CONFIRMATION DE VOTRE <span className="text-[#D4AF37]">DEMANDE</span></h1>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
              <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Résumé</h3>
              {vehicule.marque && <p className="text-sm font-extrabold text-[#111]">{vehicule.marque} {vehicule.modele} — {vehicule.annee}</p>}
              {selectedTravaux && (
                <div className="mt-2">
                  <p className="text-sm font-bold text-[#111]">{selectedTravaux.icon} {selectedTravaux.label}</p>
                  <p className="text-xs text-[#6B7280]">{selectedSubType}</p>
                  <p className="mt-1 text-lg font-black text-[#D4AF37]">{selectedTravaux.prixMin} – {selectedTravaux.prixMax} € TTC</p>
                </div>
              )}
              {photosAvant.length > 0 && (
                <div className="mt-3 flex gap-1.5 overflow-x-auto">
                  {photosAvant.map((p, i) => <img key={i} src={p} alt="" className="h-12 w-12 rounded-lg object-cover border border-[#E5E7EB] shrink-0" />)}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {selectedCarrossier && (
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Carrossier</h3>
                  <p className="text-sm font-bold text-[#111]">{selectedCarrossier.nom}</p>
                  <p className="text-[10px] text-[#6B7280]">{selectedCarrossier.adresse}</p>
                  <div className="flex items-center gap-1 mt-1"><Star size={8} className="text-[#D4AF37] fill-[#D4AF37]" /><span className="text-[10px] font-bold">{selectedCarrossier.note}</span></div>
                </div>
              )}

              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
                <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Rendez-vous</h3>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {availableDates.slice(0, 8).map((d) => {
                    const date = new Date(d);
                    return (
                      <button key={d} onClick={() => setSelectedDate(d)} className={`rounded-lg border p-2 text-center text-xs transition ${selectedDate === d ? "border-[#D4AF37] bg-[#FFFBEB] font-bold" : "border-[#E5E7EB]"}`}>
                        <p className="text-[10px] text-[#9CA3AF]">{date.toLocaleDateString("fr-FR", { weekday: "short" })}</p>
                        <p className="font-bold text-[#111]">{date.getDate()}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {CRENEAUX.map((c) => (
                    <button key={c} onClick={() => setSelectedCreneau(c)} className={`rounded-lg border p-2 text-center text-xs transition ${selectedCreneau === c ? "border-[#D4AF37] bg-[#FFFBEB] font-bold" : "border-[#E5E7EB]"}`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(6)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#F3F4F6]"><ArrowLeft size={14} /> Retour</button>
            <button onClick={submit} disabled={create.isPending || !selectedDate || !selectedCreneau} className="flex-1 rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2 transition">
              {create.isPending ? "Envoi..." : "Confirmer ma demande"} <CheckCircle size={16} />
            </button>
          </div>
          {create.error && <p className="text-sm text-red-600 text-center">{create.error.message}</p>}
        </div>
      )}

      {/* ÉTAPE 8 — SUCCÈS */}
      {step === 8 && (
        <div className="max-w-md mx-auto px-4 mt-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100"><CheckCircle size={40} className="text-green-500" /></div>
          <h1 className="mt-6 text-2xl font-black text-[#111]">Demande envoyée !</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Votre demande de devis carrosserie a été transmise{selectedCarrossier ? ` à ${selectedCarrossier.nom}` : ""}.</p>
          <div className="mt-6 space-y-3">
            <button onClick={() => navigate("/compte")} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white">Suivre ma demande</button>
            <button onClick={() => { setMode("landing"); setStep(1); }} className="w-full rounded-xl border border-[#E5E7EB] py-3 text-sm font-semibold text-[#111]">Nouvelle demande</button>
          </div>
        </div>
      )}
    </div>
  );
}
