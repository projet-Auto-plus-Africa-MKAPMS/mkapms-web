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
  {
    id: "pare-brise",
    label: "Pare-brise",
    icon: "🪟",
    desc: "Remplacement, capteurs et recalibrage ADAS",
    subTypes: [
      { label: "Remplacement pare-brise avant", dureeMin: 60, dureeMax: 120 },
      { label: "Réparation impact pare-brise", dureeMin: 30, dureeMax: 60 },
      { label: "Recalibrage caméra / ADAS", dureeMin: 30, dureeMax: 60 },
    ],
    prixMin: 90, prixMax: 900,
  },
  {
    id: "vitres-laterales",
    label: "Vitres latérales",
    icon: "🔳",
    desc: "Vitres de portes et mécanismes de lève-vitre",
    subTypes: [
      { label: "Remplacement vitre latérale", dureeMin: 45, dureeMax: 90 },
      { label: "Réparation mécanisme lève-vitre", dureeMin: 45, dureeMax: 120 },
      { label: "Remplacement joint de vitre", dureeMin: 30, dureeMax: 60 },
    ],
    prixMin: 80, prixMax: 500,
  },
  {
    id: "lunette-arriere",
    label: "Lunette arrière",
    icon: "🪟",
    desc: "Remplacement et dégivrage de lunette arrière",
    subTypes: [
      { label: "Remplacement lunette arrière", dureeMin: 60, dureeMax: 120 },
      { label: "Réparation dégivrage lunette", dureeMin: 30, dureeMax: 90 },
    ],
    prixMin: 120, prixMax: 700,
  },
  {
    id: "retroviseurs",
    label: "Rétroviseurs",
    icon: "🪞",
    desc: "Coque, miroir, clignotant et réglage",
    subTypes: [
      { label: "Remplacement miroir", dureeMin: 15, dureeMax: 45 },
      { label: "Remplacement coque", dureeMin: 30, dureeMax: 60 },
      { label: "Remplacement rétroviseur complet", dureeMin: 45, dureeMax: 120 },
    ],
    prixMin: 30, prixMax: 500,
  },
  {
    id: "phares-feux",
    label: "Phares et feux",
    icon: "💡",
    desc: "Optiques, feux arrière et éclairage extérieur",
    subTypes: [
      { label: "Remplacement phare avant", dureeMin: 30, dureeMax: 90 },
      { label: "Remplacement feu arrière", dureeMin: 30, dureeMax: 60 },
      { label: "Rénovation optiques", dureeMin: 60, dureeMax: 120 },
    ],
    prixMin: 30, prixMax: 900,
  },
  {
    id: "tolerie",
    label: "Tôlerie et redressage",
    icon: "🔧",
    desc: "Redressage, soudure et remise en ligne",
    subTypes: [
      { label: "Redressage d’un élément", dureeMin: 120, dureeMax: 360 },
      { label: "Réparation structurelle", dureeMin: 240, dureeMax: 960 },
      { label: "Passage au marbre", dureeMin: 240, dureeMax: 720 },
    ],
    prixMin: 250, prixMax: 2500,
  },
];

/* Carrossiers : données réelles via trpc.garages.list (table garages_publics,
   déjà utilisée par PriseRendezVous.tsx — jamais un second annuaire). Aucun
   calcul de distance : pas de clé Google Maps configurée (tâche #50). */

export default function CarrosserieGarage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<"landing" | "flow">("landing");
  const [landingCard, setLandingCard] = useState<"devis" | "estimation" | null>(null);
  const [step, setStep] = useState(1);
  const [carrosserieCategory, setCarrosserieCategory] = useState<"carrosserie" | "vitrage">("carrosserie");
  const [carrosserieSearch, setCarrosserieSearch] = useState("");

  /* Identification */
  const [identTab, setIdentTab] = useState<"plaque" | "vin">("plaque");
  const [plaque, setPlaque] = useState("");
  const [vin, setVin] = useState("");
  const [plateLoading, setPlateLoading] = useState(false);
  const [saisieManuelle, setSaisieManuelle] = useState(false);
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
  const [priseEnChargeAssurance, setPriseEnChargeAssurance] = useState<"non" | "oui" | "a-confirmer">("a-confirmer");
  const [vehiculeCourtoisie, setVehiculeCourtoisie] = useState<"non" | "oui">("non");
  const [urgence, setUrgence] = useState<"standard" | "rapide">("standard");

  /* Carrossier */
  const [selectedCarrossierId, setSelectedCarrossierId] = useState<number | null>(null);
  const [positionSearch, setPositionSearch] = useState("");
  const [rechercheVille, setRechercheVille] = useState("");
  const carrossiers = trpc.garages.list.useQuery({ city: rechercheVille || undefined, limit: 20 }, { enabled: step === 6 });
  const CARROSSIERS = carrossiers.data?.items ?? [];

  /* RDV */
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCreneau, setSelectedCreneau] = useState("");

  const selectedTravaux = TRAVAUX_CARROSSERIE.find((t) => t.id === selectedTravauxId);
  const vitrageIds = new Set(["pare-brise", "vitres-laterales", "lunette-arriere", "retroviseurs", "phares-feux"]);
  const visibleTravaux = TRAVAUX_CARROSSERIE.filter((t) => (carrosserieCategory === "vitrage" ? vitrageIds.has(t.id) : !vitrageIds.has(t.id))).filter((t) => !carrosserieSearch.trim() || `${t.label} ${t.desc}`.toLowerCase().includes(carrosserieSearch.toLowerCase()));
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
      description: `${selectedSubType}${descriptionLibre ? ` — ${descriptionLibre}` : ""} — Assurance : ${priseEnChargeAssurance} — Véhicule de courtoisie : ${vehiculeCourtoisie === "oui" ? "oui" : "non"} — Délai : ${urgence}`,
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
    { num: 7, label: "Suivi" },
  ];

  /* ════════════════════════════════════════════════════════════
     LANDING PAGE
     ════════════════════════════════════════════════════════════ */
  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F3EF] via-white to-[#EEF7F8]">
        {/* HERO */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#102A43] via-[#123E56] to-[#0B6B8F]">
          <div className="absolute inset-0 opacity-20">
            <img src="/images/services/carrosserie.jpg" alt="Atelier de carrosserie automobile" className="h-full w-full object-cover" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-12 text-center md:px-8 md:py-16">
            <div className="mx-auto max-w-3xl">
                <h1 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">
                  CARROSSERIE<br /><span className="text-[#D4AF37]">PROFESSIONNELLE</span>
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/80 md:text-lg">
                  Débosselage, peinture, réparation — des carrossiers certifiés près de chez vous.
                </p>
              <div className="mx-auto mt-7 grid max-w-3xl gap-2 text-left sm:grid-cols-2 md:gap-x-8">
                {[
                  { text: "Devis carrosserie gratuit" },
                  { text: "Photos avant / après" },
                  { text: "Carrossiers certifiés" },
                  { text: "Garantie peinture" },
                  { text: "Prise en charge assurance" },
                  { text: "Véhicule de courtoisie" },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-2 rounded-xl bg-black/10 px-3 py-2">
                    <CheckCircle size={17} className="shrink-0 text-[#F6D76B]" />
                    <span className="text-sm text-white/90">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DEUX ACCÈS COMPACTS : le contenu s’ouvre dans la carte choisie. */}
        <div className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 md:px-8">
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            {([
              { id: "devis" as const, title: "DEVIS CARROSSERIE", icon: Paintbrush, text: "Décrivez les dégâts et préparez votre demande." },
              { id: "estimation" as const, title: "ESTIMATION CARROSSERIE", icon: Building2, text: "Identifiez votre véhicule et comparez les solutions." },
            ]).map((card) => {
              const Icon = card.icon;
              const open = landingCard === card.id;
              return (
                <div key={card.id} className={`rounded-3xl border bg-white shadow-[0_10px_28px_rgba(16,42,67,0.08)] transition ${open ? "border-[#0B6B8F] md:col-span-2" : "border-[#DCE6EE]"}`}>
                  <button type="button" onClick={() => setLandingCard(open ? null : card.id)} className="flex w-full items-center gap-3 p-4 text-left sm:p-5">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${open ? "bg-[#0B6B8F] text-white" : "bg-[#D4AF37]/10 text-[#D4AF37]"}`}><Icon size={21} /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-black text-[#102A43] sm:text-base">{card.title}</span><span className="mt-0.5 block text-xs text-[#64748B]">{card.text}</span></span>
                    <ChevronDown size={19} className={`shrink-0 text-[#64748B] transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <div className="border-t border-[#DCE6EE] px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                      <div className="grid grid-cols-2 border-b border-[#DCE6EE]">
                        <button type="button" onClick={() => setIdentTab("plaque")} className={`py-2 text-xs font-black ${identTab === "plaque" ? "border-b-2 border-[#D4AF37] text-[#102A43]" : "text-[#94A3B8]"}`}>PLAQUE D’IMMATRICULATION</button>
                        <button type="button" onClick={() => setIdentTab("vin")} className={`py-2 text-xs font-black ${identTab === "vin" ? "border-b-2 border-[#D4AF37] text-[#102A43]" : "text-[#94A3B8]"}`}>NUMÉRO VIN</button>
                      </div>
                      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#DCE6EE] bg-[#F8FBFC] px-3 py-2.5">
                        <span className="rounded-lg bg-[#0B6B8F] px-2 py-1 text-xs font-black text-white">{identTab === "plaque" ? "FR" : "VIN"}</span>
                        <input value={identTab === "plaque" ? plaque : vin} onChange={(event) => identTab === "plaque" ? setPlaque(event.target.value.toUpperCase()) : setVin(event.target.value.toUpperCase())} placeholder={identTab === "plaque" ? "Ex. AB-123-CD" : "Saisir le numéro VIN"} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#102A43] outline-none placeholder:text-[#A0AEC0]" />
                      </div>
                      <button type="button" disabled={!plaque.trim() && !vin.trim()} onClick={() => { if (card.id === "devis") { if (!user) { navigate("/connexion"); return; } setMode("flow"); setStep(1); } else { navigate("/devis?estimation=1&service=carrosserie-esthetique"); } }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#C5A028] disabled:cursor-not-allowed disabled:opacity-40">
                        {card.id === "devis" ? "Continuer vers le devis" : "Voir l’estimation"}<ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TYPES DE TRAVAUX */}
        <div className="mx-auto mt-12 max-w-6xl px-4 md:px-8">
          <h2 className="mb-6 text-center text-xl font-extrabold text-[#111]">NOS SPÉCIALITÉS CARROSSERIE</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {TRAVAUX_CARROSSERIE.slice(0, 10).map((t) => (
              <div key={t.id} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xl">{t.icon}</div>
                <h3 className="mt-2 text-xs font-bold text-[#111]">{t.label}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* ACCÈS EN BAS DE PAGE */}
        <div className="mx-auto mb-10 mt-12 max-w-6xl px-4 md:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#102A43] via-[#123E56] to-[#0B6B8F] p-6 md:p-9">
            <h2 className="text-center text-lg font-extrabold text-white md:text-xl">BESOIN D'UNE RÉPARATION CARROSSERIE ?</h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-white/60">Devis gratuit, carrossiers certifiés, garantie peinture.</p>
            <div className="mt-5 text-center">
              <button
                className="rounded-2xl bg-[#D4AF37] px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#C5A028]"
                onClick={() => navigate("/devis?estimation=1&service=carrosserie-esthetique")}
              >
                Obtenir mon devis gratuit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     FLUX CARROSSERIE — 7 ÉTAPES
     ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F3EF] via-white to-[#EEF7F8] pb-24">
      {/* Header */}
      <div className="bg-white/95 border-b border-[#DCE6EE] shadow-sm px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {/* Logo FERMÉ (Version 1 – Terre) : surface interne */}
          <img src="/logo-closed.png" alt="MKA.P-MS" className="h-8 w-auto" draggable={false} />
          <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">Carrosserie</span>
        </div>
      </div>

      {/* Stepper : défilement horizontal volontaire sur mobile pour garder chaque libellé lisible. */}
      <div className="bg-white/95 border-b border-[#DCE6EE] shadow-sm px-4 py-3">
        <div className="mx-auto max-w-4xl overflow-x-auto overscroll-x-contain scrollbar-thin scrollbar-thumb-[#D4AF37]/50">
          <div className="flex min-w-max items-start justify-start gap-2 px-1 md:justify-center md:gap-4">
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
        <p className="mx-auto mt-2 max-w-4xl text-center text-[10px] text-[#9CA3AF] md:hidden">Faites glisser pour voir toutes les étapes</p>
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

          <div className="mt-6 max-w-lg mx-auto rounded-2xl bg-white/95 border border-[#DCE6EE] shadow-[0_8px_24px_rgba(16,42,67,0.06)] p-6 shadow-sm">
            <div className="flex border-b border-[#DCE6EE] mb-4">
              <button onClick={() => setIdentTab("plaque")} className={`flex-1 py-2.5 text-sm font-bold text-center border-b-2 transition ${identTab === "plaque" ? "border-[#D4AF37] text-[#111]" : "border-transparent text-[#9CA3AF]"}`}>PLAQUE D'IMMATRICULATION</button>
              <button onClick={() => setIdentTab("vin")} className={`flex-1 py-2.5 text-sm font-bold text-center border-b-2 transition ${identTab === "vin" ? "border-[#D4AF37] text-[#111]" : "border-transparent text-[#9CA3AF]"}`}>NUMÉRO VIN</button>
            </div>

            {identTab === "plaque" ? (
              <div className="flex items-center gap-2 rounded-xl border-2 border-[#DCE6EE] p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-[#003399] text-white text-[10px] font-bold shrink-0">FR</div>
                <input className="flex-1 text-lg font-bold text-[#111] outline-none placeholder:text-[#D1D5DB] bg-transparent" placeholder="Ex : AB-123-CD" value={plaque} onChange={(e) => setPlaque(e.target.value.toUpperCase())} />
              </div>
            ) : (
              <input className="w-full rounded-xl border-2 border-[#DCE6EE] p-3 text-sm font-bold text-[#111] outline-none placeholder:text-[#D1D5DB]" placeholder="Ex : VF1XXXXXXXXXX" value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} maxLength={17} />
            )}

            <button className="mt-4 w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2 transition" disabled={(!plaque.trim() && !vin.trim()) || plateLoading} onClick={identifierVehicule}>
              <Search size={16} /> {plateLoading ? "Recherche..." : "Identifier mon véhicule"}
            </button>
            <div className="mt-3 text-center">
              <button className="text-sm font-semibold text-[#D4AF37] hover:underline" onClick={() => setSaisieManuelle((v) => !v)}>
                {saisieManuelle ? "Masquer la saisie manuelle" : "Saisir manuellement →"}
              </button>
            </div>

            {saisieManuelle && (
              <div className="mt-3 space-y-2 rounded-xl border border-[#DCE6EE] p-3">
                <div className="grid grid-cols-2 gap-2">
                  <input className="rounded-lg border border-[#DCE6EE] px-3 py-2 text-sm" placeholder="Marque *" value={vehicule.marque} onChange={(e) => setVehicule({ ...vehicule, marque: e.target.value })} />
                  <input className="rounded-lg border border-[#DCE6EE] px-3 py-2 text-sm" placeholder="Modèle *" value={vehicule.modele} onChange={(e) => setVehicule({ ...vehicule, modele: e.target.value })} />
                  <input className="rounded-lg border border-[#DCE6EE] px-3 py-2 text-sm" placeholder="Année" inputMode="numeric" value={vehicule.annee} onChange={(e) => setVehicule({ ...vehicule, annee: e.target.value })} />
                  <input className="rounded-lg border border-[#DCE6EE] px-3 py-2 text-sm" placeholder="Énergie" value={vehicule.carburant} onChange={(e) => setVehicule({ ...vehicule, carburant: e.target.value })} />
                </div>
                <button
                  className="w-full rounded-xl bg-gradient-to-br from-[#102A43] via-[#123E56] to-[#0B6B8F] py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  disabled={!vehicule.marque.trim() || !vehicule.modele.trim()}
                  onClick={() => setStep(3)}
                >
                  Continuer avec ce véhicule
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ÉTAPE 3 — ESTIMATION CARROSSERIE SÉPARÉE */}
      {step === 3 && (
        <div className="mx-auto mt-6 max-w-4xl px-4">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B9DB5]">Estimation carrosserie</p>
            <h1 className="mt-2 text-2xl font-black text-[#102A43] sm:text-3xl">Choisissez votre prestation</h1>
            <p className="mt-2 text-sm text-[#64748B]">Sélectionnez les éléments concernés pour transmettre une demande précise aux carrossiers.</p>
          </div>

          {vehicule.marque && (
            <div className="mx-auto mt-5 max-w-lg rounded-2xl border border-[#B7E3E8] bg-[#EAF8FA] p-4 shadow-sm">
              <div className="flex items-center gap-3"><div className="text-2xl">🚗</div><div><p className="text-base font-extrabold text-[#102A43]">{vehicule.marque} {vehicule.modele}</p><p className="text-xs text-[#64748B]">{vehicule.annee} · {vehicule.carburant} · {vehicule.boite}</p></div></div>
            </div>
          )}

          <div className="mt-6 rounded-3xl border-2 border-[#0BA6BD] bg-white p-4 shadow-[0_12px_32px_rgba(11,166,189,0.12)] sm:p-6">
            <div className="flex items-center gap-3 border-b border-[#DCE6EE] pb-4"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF8FA] text-2xl">🔧</span><div><h2 className="text-lg font-black text-[#102A43]">Choisissez votre prestation</h2><p className="text-xs text-[#64748B]">Sélection multiple possible</p></div></div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#DCE6EE] bg-[#F8FBFC] px-4 py-3"><Search size={20} className="text-[#0BA6BD]" /><input value={carrosserieSearch} onChange={(e) => setCarrosserieSearch(e.target.value)} className="w-full bg-transparent text-sm text-[#102A43] outline-none placeholder:text-[#94A3B8]" placeholder="Rechercher : aile, pare-chocs, peinture, vitrage…" /></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setCarrosserieCategory("carrosserie")} className={`rounded-xl px-3 py-3 text-sm font-black transition ${carrosserieCategory === "carrosserie" ? "bg-[#0BA6BD] text-white" : "bg-[#F5F8FA] text-[#64748B]"}`}>Carrosserie & esthétique</button><button type="button" onClick={() => setCarrosserieCategory("vitrage")} className={`rounded-xl px-3 py-3 text-sm font-black transition ${carrosserieCategory === "vitrage" ? "bg-[#0BA6BD] text-white" : "bg-[#F5F8FA] text-[#64748B]"}`}>Carrosserie & vitrage</button></div>
            <div className="mt-4 divide-y divide-[#DCE6EE]">
              {visibleTravaux.map((t) => (
                <div key={t.id} className="py-3">
                  <button type="button" onClick={() => { setSelectedTravauxId(t.id); setSelectedSubType(t.subTypes[0]?.label || ""); }} className="flex w-full items-center justify-between gap-3 text-left"><span><span className="block text-sm font-extrabold text-[#102A43]">{t.label}</span><span className="mt-0.5 block text-xs text-[#64748B]">{t.desc}</span></span><span className={`text-xl transition ${selectedTravauxId === t.id ? "rotate-180 text-[#0BA6BD]" : "text-[#F28C28]"}`}>⌄</span></button>
                  {selectedTravauxId === t.id && <div className="mt-3 rounded-2xl bg-[#F3F8FA] p-3"><div className="grid gap-2 sm:grid-cols-2">{t.subTypes.map((st) => <button key={st.label} type="button" onClick={() => setSelectedSubType(st.label)} className={`rounded-xl border-2 p-3 text-left text-xs font-semibold transition ${selectedSubType === st.label ? "border-[#0BA6BD] bg-white text-[#102A43]" : "border-transparent bg-white text-[#64748B]"}`}>{st.label}</button>)}</div><textarea className="mt-3 min-h-20 w-full rounded-xl border border-[#DCE6EE] bg-white p-3 text-sm text-[#102A43] outline-none placeholder:text-[#94A3B8]" placeholder="Décrivez les dégâts ou les éléments à remplacer…" value={descriptionLibre} onChange={(e) => setDescriptionLibre(e.target.value)} /></div>}
                </div>
              ))}
              {visibleTravaux.length === 0 && <p className="py-6 text-center text-sm text-[#64748B]">Aucune prestation ne correspond à votre recherche.</p>}
            </div>
          </div>

          <div className="mt-5 flex gap-3"><button onClick={() => setStep(2)} className="rounded-xl border border-[#D1D5DB] px-5 py-3 text-sm font-medium text-[#374151]"><ArrowLeft size={14} /></button><button onClick={() => setStep(4)} disabled={!selectedTravauxId} className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white shadow-md disabled:opacity-50">Continuer vers les photos <ArrowRight size={14} className="ml-1 inline" /></button></div>
        </div>
      )}

      {/* ÉTAPE 4 — PHOTOS AVANT / APRÈS */}
      {step === 4 && (
        <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          <h1 className="text-2xl font-black text-[#111] text-center">PHOTOS <span className="text-[#D4AF37]">AVANT / APRÈS</span></h1>
          <p className="text-sm text-[#6B7280] text-center">Ajoutez des vues larges et rapprochées : elles aident les carrossiers à distinguer réparation, peinture et remplacement.</p>

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
              <p className="mt-3 text-[11px] leading-5 text-[#6B7280]">Conseil : photographiez le véhicule de face, de côté et le détail de chaque impact, dans une zone bien éclairée.</p>
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
              <p className="mt-3 text-[11px] leading-5 text-[#6B7280]">Les photos après réparation pourront être ajoutées par le carrossier pour le suivi du dossier.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="rounded-xl border border-[#DCE6EE] bg-white p-3 text-xs text-[#374151]">
              <span className="mb-2 block font-bold text-[#111]">Prise en charge assurance</span>
              <select value={priseEnChargeAssurance} onChange={(e) => setPriseEnChargeAssurance(e.target.value as typeof priseEnChargeAssurance)} className="w-full rounded-lg border border-[#D1D5DB] bg-white px-2 py-2 text-xs">
                <option value="a-confirmer">À confirmer</option><option value="oui">Oui, sinistre déclaré</option><option value="non">Non</option>
              </select>
            </label>
            <label className="rounded-xl border border-[#DCE6EE] bg-white p-3 text-xs text-[#374151]">
              <span className="mb-2 block font-bold text-[#111]">Véhicule de courtoisie</span>
              <select value={vehiculeCourtoisie} onChange={(e) => setVehiculeCourtoisie(e.target.value as typeof vehiculeCourtoisie)} className="w-full rounded-lg border border-[#D1D5DB] bg-white px-2 py-2 text-xs">
                <option value="non">Pas nécessaire</option><option value="oui">Oui, si disponible</option>
              </select>
            </label>
            <label className="rounded-xl border border-[#DCE6EE] bg-white p-3 text-xs text-[#374151]">
              <span className="mb-2 block font-bold text-[#111]">Délai souhaité</span>
              <select value={urgence} onChange={(e) => setUrgence(e.target.value as typeof urgence)} className="w-full rounded-lg border border-[#D1D5DB] bg-white px-2 py-2 text-xs">
                <option value="standard">Standard</option><option value="rapide">Le plus rapidement possible</option>
              </select>
            </label>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#EAF4F6]"><ArrowLeft size={14} /> Retour</button>
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

          <div className="rounded-2xl bg-white/95 border border-[#DCE6EE] shadow-[0_8px_24px_rgba(16,42,67,0.06)] p-6 shadow-sm">
            {vehicule.marque && (
              <div className="flex items-center gap-3 pb-4 border-b border-[#DCE6EE]">
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
                  {photosAvant.map((p, i) => <img key={i} src={p} alt="" className="h-16 w-16 rounded-lg object-cover border border-[#DCE6EE] shrink-0" />)}
                </div>
              </div>
            )}
            <div className="mt-5 rounded-xl border border-[#DCE6EE] bg-[#F3F8FA] p-4">
              <p className="text-xs font-bold text-[#111]">Détail indicatif du devis</p>
              <div className="mt-3 grid gap-2 text-xs text-[#6B7280] sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3"><span>Main-d’œuvre carrosserie</span><span className="font-semibold text-[#374151]">Incluse</span></div>
                <div className="flex items-center justify-between gap-3"><span>Peinture / finition</span><span className="font-semibold text-[#374151]">Selon le dommage</span></div>
                <div className="flex items-center justify-between gap-3"><span>Pièce à réparer ou remplacer</span><span className="font-semibold text-[#374151]">À confirmer</span></div>
                <div className="flex items-center justify-between gap-3"><span>Assurance</span><span className="font-semibold text-[#374151]">{priseEnChargeAssurance === "oui" ? "Demandée" : "À confirmer"}</span></div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-[#9CA3AF] text-center flex items-center justify-center gap-1">
            <Info size={10} /> Le prix final peut varier selon le carrossier et l'étendue réelle des dégâts.
          </p>

          <div className="flex gap-3">
            <button onClick={() => setStep(4)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#EAF4F6]"><ArrowLeft size={14} /> Retour</button>
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
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-[#DCE6EE] bg-white px-3 py-2.5">
              <MapPin size={16} className="text-[#9CA3AF]" />
              <input className="flex-1 text-sm text-[#111] outline-none placeholder:text-[#D1D5DB]" placeholder="Votre ville" value={positionSearch} onChange={(e) => setPositionSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setRechercheVille(positionSearch)} />
            </div>
            <button className="rounded-xl bg-gradient-to-br from-[#102A43] via-[#123E56] to-[#0B6B8F] px-4 py-2.5 text-sm font-bold text-white" onClick={() => setRechercheVille(positionSearch)}>Rechercher</button>
          </div>

          {carrossiers.isLoading && <p className="mt-4 text-center text-sm text-[#6B7280]">Recherche…</p>}
          {!carrossiers.isLoading && CARROSSIERS.length === 0 && (
            <p className="mt-4 rounded-xl border border-[#DCE6EE] bg-white p-4 text-center text-sm text-[#6B7280]">Aucun garage trouvé{rechercheVille ? ` pour « ${rechercheVille} »` : ""}.</p>
          )}

          <div className="mt-4 space-y-3">
            {CARROSSIERS.map((c) => {
              const specialites = c.specialites ? c.specialites.split(",").map((s) => s.trim()).filter(Boolean) : [];
              return (
              <div key={c.id} className={`rounded-2xl border-2 bg-white p-4 cursor-pointer transition hover:shadow-md ${selectedCarrossierId === c.id ? "border-[#D4AF37] shadow-md" : "border-[#DCE6EE]"}`} onClick={() => setSelectedCarrossierId(c.id)}>
                <div className="flex items-start gap-3">
                  {c.coverUrl && <img src={c.coverUrl} alt={c.name} className="h-16 w-20 rounded-xl object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#111] truncate">{c.name}</h3>
                      {c.featured && <Shield size={12} className="text-green-500 shrink-0" />}
                    </div>
                    {Number(c.rating) > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-xs font-bold">{c.rating}</span>
                        <span className="text-[10px] text-[#6B7280]">({c.reviewCount} avis)</span>
                      </div>
                    )}
                    <p className="text-[10px] text-[#6B7280] mt-0.5">{c.addressLine || c.city}{c.hours ? ` · ${c.hours}` : ""}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {specialites.map((s) => <span key={s} className="rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[9px] font-semibold text-[#111]">{s}</span>)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <button className="rounded-lg bg-[#D4AF37] py-2 text-[10px] font-bold text-white" onClick={(e) => { e.stopPropagation(); setSelectedCarrossierId(c.id); setStep(7); }}>Devis</button>
                  <button className="rounded-lg bg-gradient-to-br from-[#102A43] via-[#123E56] to-[#0B6B8F] py-2 text-[10px] font-bold text-white" onClick={(e) => { e.stopPropagation(); setSelectedCarrossierId(c.id); setStep(7); }}>Réserver</button>
                  {c.phone && <a href={`tel:${c.phone}`} className="rounded-lg border border-[#DCE6EE] py-2 text-[10px] font-semibold text-[#111] text-center" onClick={(e) => e.stopPropagation()}>Appeler</a>}
                  <button className="rounded-lg border border-[#DCE6EE] py-2 text-[10px] font-semibold text-[#111]" onClick={(e) => { e.stopPropagation(); navigate("/messages"); }}>Message</button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ÉTAPE 7 — CONFIRMATION */}
      {step === 7 && (
        <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          <h1 className="text-2xl font-black text-[#111] text-center">CONFIRMATION DE VOTRE <span className="text-[#D4AF37]">DEMANDE</span></h1>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/95 border border-[#DCE6EE] shadow-[0_8px_24px_rgba(16,42,67,0.06)] p-5 shadow-sm">
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
                  {photosAvant.map((p, i) => <img key={i} src={p} alt="" className="h-12 w-12 rounded-lg object-cover border border-[#DCE6EE] shrink-0" />)}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {selectedCarrossier && (
                <div className="rounded-2xl bg-white/95 border border-[#DCE6EE] shadow-[0_8px_24px_rgba(16,42,67,0.06)] p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Carrossier</h3>
                  <p className="text-sm font-bold text-[#111]">{selectedCarrossier.name}</p>
                  <p className="text-[10px] text-[#6B7280]">{selectedCarrossier.addressLine || selectedCarrossier.city}</p>
                  {Number(selectedCarrossier.rating) > 0 && (
                    <div className="flex items-center gap-1 mt-1"><Star size={8} className="text-[#D4AF37] fill-[#D4AF37]" /><span className="text-[10px] font-bold">{selectedCarrossier.rating}</span></div>
                  )}
                </div>
              )}

              <div className="rounded-2xl bg-white/95 border border-[#DCE6EE] shadow-[0_8px_24px_rgba(16,42,67,0.06)] p-5 shadow-sm">
                <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Rendez-vous</h3>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {availableDates.slice(0, 8).map((d) => {
                    const date = new Date(d);
                    return (
                      <button key={d} onClick={() => setSelectedDate(d)} className={`rounded-lg border p-2 text-center text-xs transition ${selectedDate === d ? "border-[#D4AF37] bg-[#FFFBEB] font-bold" : "border-[#DCE6EE]"}`}>
                        <p className="text-[10px] text-[#9CA3AF]">{date.toLocaleDateString("fr-FR", { weekday: "short" })}</p>
                        <p className="font-bold text-[#111]">{date.getDate()}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {CRENEAUX.map((c) => (
                    <button key={c} onClick={() => setSelectedCreneau(c)} className={`rounded-lg border p-2 text-center text-xs transition ${selectedCreneau === c ? "border-[#D4AF37] bg-[#FFFBEB] font-bold" : "border-[#DCE6EE]"}`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(6)} className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-medium text-[#374151] flex items-center gap-2 hover:bg-[#EAF4F6]"><ArrowLeft size={14} /> Retour</button>
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
          <p className="mt-2 text-sm text-[#6B7280]">Votre demande de devis carrosserie a été transmise{selectedCarrossier ? ` à ${selectedCarrossier.name}` : ""}.</p>
          <div className="mt-6 space-y-3">
            <button onClick={() => navigate("/compte")} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white">Suivre ma demande</button>
            <button onClick={() => { setMode("landing"); setStep(1); }} className="w-full rounded-xl border border-[#DCE6EE] py-3 text-sm font-semibold text-[#111]">Nouvelle demande</button>
          </div>
        </div>
      )}
    </div>
  );
}
