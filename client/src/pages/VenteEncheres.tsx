import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ChevronDown, Gavel, Shield, Clock, Users,
  AlertCircle, Star, CheckCircle, ArrowRight, Eye, Lock, Building2,
  FileText, Filter, Search, MapPin, Truck, RefreshCcw, Car, Wrench,
  ArrowLeft, Info, Phone, MessageSquare, X, Camera, CreditCard, Package,
  Calendar, Bell, BarChart3, Download, ExternalLink, Settings, Zap,
  Heart, Share2, Bookmark, AlertTriangle, CheckCircle2, XCircle,
  MinusCircle, HelpCircle, Fuel, Gauge, Hash, Navigation, DollarSign,
  Receipt, ClipboardList, History, Award, TrendingUp, Activity,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { DocumentView, buildFactureData } from "../components/DocumentPDF";
import { imprimerFeuille } from "../lib/documents";
import { trpc } from "../lib/trpc";

/** Ligne réelle renvoyée par `auctionEngine.list`/`detail` (server/auction-engine/). */
interface AuctionRow {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  lotDetails: Record<string, unknown> | null;
  startPrice: string | number;
  increment: string | number | null;
  currentPrice?: number;
  bidCount: number;
  bidderCount?: number;
  startsAt: Date;
  endsAt: Date;
  photos: string[];
  city: string | null;
  countryCode: string;
  allowedProfiles: string[];
  sellerId: number;
  winnerId?: number | null;
  winningAmount?: string | number | null;
  status: string;
}

/* ═══════════════════════════════════════════════════════════
   ACHETEURS AUTORISÉS
   ═══════════════════════════════════════════════════════════ */
const ACHETEURS = [
  { id: "garage", label: "Garages", icon: Wrench },
  { id: "marchand", label: "Marchands automobiles", icon: Car },
  { id: "exportateur", label: "Exportateurs", icon: Truck },
  { id: "carrossier", label: "Carrossiers", icon: Building2 },
  { id: "casse", label: "Casse automobile agréée", icon: RefreshCcw },
  { id: "pro_valide", label: "Professionnels validés", icon: Shield },
];

/* ═══════════════════════════════════════════════════════════
   CATÉGORIES ENCHÈRES
   ═══════════════════════════════════════════════════════════ */
const CATEGORIES = [
  { id: "reprise", label: "Reprise client", color: "bg-amber-500", badge: "REPRISE CLIENT" },
  { id: "stock", label: "Stock MKA.P-MS", color: "bg-[#D4AF37]", badge: "STOCK MKA.P-MS" },
  { id: "flotte", label: "Flotte location", color: "bg-blue-500", badge: "FLOTTE" },
  { id: "accidente", label: "Véhicule accidenté", color: "bg-red-500", badge: "ACCIDENTÉ" },
  { id: "mecanique", label: "Véhicule mécanique", color: "bg-orange-500", badge: "MÉCANIQUE" },
  { id: "carrosserie", label: "Véhicule carrosserie", color: "bg-pink-500", badge: "CARROSSERIE" },
  { id: "export", label: "Export", color: "bg-emerald-500", badge: "EXPORT" },
  { id: "lot", label: "Lot professionnel", color: "bg-purple-600", badge: "LOT PRO" },
  { id: "roulant", label: "Véhicule roulant", color: "bg-green-500", badge: "ROULANT" },
  { id: "non_roulant", label: "Véhicule non roulant", color: "bg-slate-600", badge: "NON ROULANT" },
];

/* ═══════════════════════════════════════════════════════════
   ÉTAT VÉHICULE STATUTS
   ═══════════════════════════════════════════════════════════ */
type EtatStatut = "bon" | "moyen" | "a_prevoir" | "a_reparer" | "non_controle";
const ETAT_LABELS: Record<EtatStatut, { label: string; color: string; icon: typeof CheckCircle }> = {
  bon: { label: "Bon", color: "text-green-600 bg-green-50", icon: CheckCircle },
  moyen: { label: "Moyen", color: "text-amber-600 bg-amber-50", icon: MinusCircle },
  a_prevoir: { label: "À prévoir", color: "text-orange-600 bg-orange-50", icon: AlertTriangle },
  a_reparer: { label: "À réparer", color: "text-red-600 bg-red-50", icon: XCircle },
  non_controle: { label: "Non contrôlé", color: "text-slate-500 bg-slate-50", icon: HelpCircle },
};

/* ═══════════════════════════════════════════════════════════
   TYPES LOT (peuplés depuis l'Auction Engine, voir toLotType ci-dessous)
   ═══════════════════════════════════════════════════════════ */
interface VehiculeLot { marque: string; modele: string; annee: number; km: number; etat: string; }
interface EtatVehicule {
  mecanique: EtatStatut; carrosserie: EtatStatut; interieur: EtatStatut;
  pneus: EtatStatut; vitrage: EtatStatut; electronique: EtatStatut;
  documents: EtatStatut; roulage: EtatStatut;
}
interface LotType {
  id: number; titre: string; categorie: string; nbVehicules: number;
  miseDepart: number; offreActuelle: number; encheres: number; encherisseurs: number;
  heureDebut: string; heureFin: string; fin: string;
  photo: string; photos: string[];
  photosCategories: { exterieur: string[]; interieur: string[]; moteur: string[]; coffre: string[]; tableau_bord: string[]; dommages: string[]; documents: string[]; pneus: string[] };
  marque: string; modele: string; version: string; annee: string;
  km: string; energie: string; boite: string; puissance: string;
  typeVehicule: "auto" | "moto" | "utilitaire" | "camion" | "quad";
  cylindree?: string; nbRoues?: string; ptac?: string; nbEssieux?: string; hauteur?: string;
  vin: string; localisation: string;
  etatGeneral: string; roulant: boolean;
  etatDetail: EtatVehicule;
  description: string;
  rapportDefauts: string[]; rapportTravaux: string[]; rapportEstimation: number;
  rapportDocuments: string[]; rapportRemarques: string[];
  vehicules: VehiculeLot[];
  badges: string[];
  palier: number;
}

/**
 * Traduit une ligne réelle de l'Auction Engine (server/auction-engine/) vers
 * la forme d'écran `LotType`. Le contenu descriptif riche (véhicules
 * groupés, état par sous-système, galeries de photos catégorisées) vit dans
 * `lotDetails` (jsonb) côté serveur — un lot qui n'a pas encore renseigné un
 * champ optionnel affiche honnêtement une valeur vide, jamais une donnée
 * inventée. Le prix, les enchères et le palier viennent toujours des
 * colonnes réelles de `auctions`, jamais de `lotDetails`.
 */
function toLotType(row: AuctionRow): LotType {
  const d = (row.lotDetails ?? {}) as Record<string, any>;
  const photosCategoriesVides = { exterieur: [], interieur: [], moteur: [], coffre: [], tableau_bord: [], dommages: [], documents: [], pneus: [] };
  const etatDetailVide = { mecanique: "non_controle", carrosserie: "non_controle", interieur: "non_controle", pneus: "non_controle", vitrage: "non_controle", electronique: "non_controle", documents: "non_controle", roulage: "non_controle" };
  const finMs = new Date(row.endsAt).getTime() - Date.now();
  const finLabel = finMs <= 0 ? "Terminée" : `${Math.floor(finMs / 86400000)}j ${Math.floor((finMs % 86400000) / 3600000)}h`;
  return {
    id: row.id,
    titre: row.title,
    categorie: row.category ?? "",
    nbVehicules: d.nbVehicules ?? 1,
    miseDepart: Number(row.startPrice),
    offreActuelle: row.currentPrice ?? Number(row.startPrice),
    encheres: row.bidCount ?? 0,
    encherisseurs: row.bidderCount ?? 0,
    heureDebut: new Date(row.startsAt).toLocaleString("fr-FR"),
    heureFin: new Date(row.endsAt).toLocaleString("fr-FR"),
    fin: finLabel,
    photo: row.photos?.[0] ?? "",
    photos: row.photos ?? [],
    photosCategories: { ...photosCategoriesVides, ...(d.photosCategories ?? {}) },
    marque: d.marque ?? "", modele: d.modele ?? "", version: d.version ?? "", annee: d.annee ?? "",
    km: d.km ?? "", energie: d.energie ?? "", boite: d.boite ?? "", puissance: d.puissance ?? "",
    typeVehicule: d.typeVehicule ?? "auto",
    cylindree: d.cylindree, nbRoues: d.nbRoues, ptac: d.ptac, nbEssieux: d.nbEssieux, hauteur: d.hauteur,
    vin: d.vin ?? "",
    localisation: [row.city, row.countryCode].filter(Boolean).join(" — "),
    etatGeneral: d.etatGeneral ?? "Non renseigné",
    roulant: d.roulant ?? true,
    etatDetail: { ...etatDetailVide, ...(d.etatDetail ?? {}) },
    description: row.description ?? "",
    rapportDefauts: d.rapportDefauts ?? [],
    rapportTravaux: d.rapportTravaux ?? [],
    rapportEstimation: d.rapportEstimation ?? 0,
    rapportDocuments: d.rapportDocuments ?? [],
    rapportRemarques: d.rapportRemarques ?? [],
    vehicules: d.vehicules ?? [],
    badges: d.badges ?? [],
    palier: Number(row.increment ?? 100),
  };
}


/* Enchère remportée par l'utilisateur (issue de auctionEngine.myWonAuctions) */
interface EnchereRemportee {
  lotId: number; titre: string; montant: number; date: string;
  statut: "remportee" | "paiement_attente" | "paye" | "retrait_programme" | "livre" | "cloture";
}

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  remportee: { label: "Enchère remportée", color: "text-green-700 bg-green-50" },
  paiement_attente: { label: "Paiement en attente", color: "text-amber-700 bg-amber-50" },
  paye: { label: "Payé", color: "text-blue-700 bg-blue-50" },
  retrait_programme: { label: "Retrait programmé", color: "text-purple-700 bg-purple-50" },
  livre: { label: "Livré", color: "text-green-700 bg-green-50" },
  cloture: { label: "Dossier clôturé", color: "text-slate-600 bg-slate-100" },
};

export default function VenteEncheres() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ── Données réelles (Auction Engine) ─────────────────────────────────
  const catalogueQuery = trpc.auctionEngine.list.useQuery({ audience: "professionnel", status: "en_cours" });
  const prochainesQuery = trpc.auctionEngine.list.useQuery({ audience: "professionnel", status: "programmee" });
  const wonAuctionsQuery = trpc.auctionEngine.myWonAuctions.useQuery(undefined, { enabled: !!user });
  const myBidsQuery = trpc.auctionEngine.myBids.useQuery(undefined, { enabled: !!user });

  const lots = useMemo<LotType[]>(() => ((catalogueQuery.data ?? []) as AuctionRow[]).map(toLotType), [catalogueQuery.data]);
  const prochainesLots = useMemo<LotType[]>(() => ((prochainesQuery.data ?? []) as AuctionRow[]).map(toLotType), [prochainesQuery.data]);

  /**
   * Lots remportés : `myWonAuctions` est scopée côté serveur
   * (`winnerId = moi`), jamais reconstruite depuis des données publiques —
   * `winnerId` n'apparaît jamais dans le catalogue public. Sans virement/
   * livraison suivis par un moteur aujourd'hui, le statut reste honnêtement
   * "remportee" — jamais "livre"/"retrait_programme" : rien ne le prouve
   * encore (voir Document Custody Engine, LOT 6, à terme).
   */
  const mesEncheres = useMemo<EnchereRemportee[]>(() => {
    return ((wonAuctionsQuery.data ?? []) as AuctionRow[]).map((a) => ({
      lotId: a.id,
      titre: a.title,
      montant: Number(a.winningAmount ?? 0),
      date: new Date(a.endsAt).toLocaleDateString("fr-FR"),
      statut: "remportee" as const,
    }));
  }, [wonAuctionsQuery.data]);

  /**
   * Bordereau du lot remporté : les pièces d'origine (carte grise, PV) ne sont
   * pas archivées dans la plateforme, on édite donc le bordereau réellement
   * connu et on le dit, au lieu d'annoncer un fichier qui n'existe pas.
   */
  function imprimerBordereau(e: EnchereRemportee) {
    const lot = lots.find((l) => l.id === e.lotId);
    const ok = imprimerFeuille({
      typeDocument: "bordereau_enchere",
      titre: "Bordereau d'adjudication",
      reference: `LOT-${e.lotId}`,
      sousTitre: e.titre,
      informations: [
        { libelle: "Adjudicataire", valeur: user?.email ?? "Compte MKA.P-MS" },
        { libelle: "Date d'adjudication", valeur: e.date },
        { libelle: "Statut du dossier", valeur: STATUT_LABELS[e.statut]?.label ?? e.statut },
        ...(lot ? [{ libelle: "Localisation", valeur: lot.localisation }] : []),
        ...(lot ? [{ libelle: "VIN", valeur: lot.vin }] : []),
      ],
      colonnes: [
        { cle: "designation", titre: "Designation" },
        { cle: "montant", titre: "Montant", numerique: true },
      ],
      lignes: [{ designation: e.titre, montant: `${e.montant.toLocaleString("fr-FR")} EUR` }],
      totaux: [{ libelle: "Prix d'adjudication", valeur: `${e.montant.toLocaleString("fr-FR")} EUR` }],
      mentions: [
        "MKA.P-MS — Auto Plus Africa. Bordereau edite depuis le journal des encheres.",
        lot
          ? `Pieces annoncees au lot : ${lot.rapportDocuments.join(", ")}.`
          : "Le detail du lot n'est plus disponible en ligne.",
        "Les pieces originales du vehicule ne sont pas archivees dans la plateforme : elles sont remises lors du retrait. Ce bordereau ne les remplace pas.",
      ],
      entiteLiee: { type: "enchere", id: e.lotId },
    });
    showToast(ok ? `Bordereau du lot ${e.lotId} ouvert — enregistrable en PDF` : "Le navigateur a bloque la fenetre d'impression");
  }

  /** Rapport d'expertise du lot, construit depuis les constats réels du lot. */
  function imprimerRapportLot(lot: LotType) {
    const ok = imprimerFeuille({
      typeDocument: "bordereau_enchere",
      titre: "Rapport d'expertise du lot",
      reference: `LOT-${lot.id}`,
      sousTitre: lot.titre,
      informations: [
        { libelle: "Vehicule", valeur: `${lot.marque} ${lot.modele} ${lot.version}` },
        { libelle: "Annee", valeur: lot.annee },
        { libelle: "Kilometrage", valeur: lot.km },
        { libelle: "Energie / boite", valeur: `${lot.energie} — ${lot.boite}` },
        { libelle: "VIN", valeur: lot.vin },
        { libelle: "Localisation", valeur: lot.localisation },
        { libelle: "Etat general", valeur: lot.etatGeneral },
        { libelle: "Roulant", valeur: lot.roulant ? "Oui" : "Non" },
      ],
      colonnes: [
        { cle: "poste", titre: "Poste" },
        { cle: "constat", titre: "Constat" },
      ],
      lignes: [
        ...(Object.keys(lot.etatDetail) as (keyof EtatVehicule)[]).map((poste) => ({
          poste,
          constat: ETAT_LABELS[lot.etatDetail[poste]].label,
        })),
        ...lot.rapportDefauts.map((d) => ({ poste: "Defaut releve", constat: d })),
        ...lot.rapportTravaux.map((t) => ({ poste: "Travaux a prevoir", constat: t })),
        ...lot.rapportRemarques.map((r) => ({ poste: "Remarque", constat: r })),
      ],
      totaux: [
        { libelle: "Mise a prix", valeur: `${lot.miseDepart.toLocaleString("fr-FR")} EUR` },
        { libelle: "Offre actuelle", valeur: `${lot.offreActuelle.toLocaleString("fr-FR")} EUR` },
        { libelle: "Travaux estimes", valeur: `${lot.rapportEstimation.toLocaleString("fr-FR")} EUR` },
      ],
      mentions: [
        `Documents annonces : ${lot.rapportDocuments.join(", ")}.`,
        "Rapport etabli sur les constats declares au lot. Il ne remplace pas une expertise contradictoire sur place.",
      ],
      entiteLiee: { type: "enchere", id: lot.id },
    });
    showToast(ok ? `Rapport du lot ${lot.id} ouvert — enregistrable en PDF` : "Le navigateur a bloque la fenetre d'impression");
  }

  const [mode, setMode] = useState<"landing" | "lots" | "detail" | "mes_encheres" | "remportes" | "conditions" | "prochaines" | "photos" | "vehicule_detail">("landing");
  const [viewFactureEnchere, setViewFactureEnchere] = useState<EnchereRemportee | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [watchList, setWatchList] = useState<number[]>([]);

  /* Filtres */
  const [filterCat, setFilterCat] = useState("");
  const [filterMarque, setFilterMarque] = useState("");
  const [filterEnergie, setFilterEnergie] = useState("");
  const [filterRoulant, setFilterRoulant] = useState("");
  const [filterPrixMax, setFilterPrixMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  /* Enchère */
  const [enchereInput, setEnchereInput] = useState("");
  const [showBidConfirm, setShowBidConfirm] = useState(false);

  /* Photo viewer */
  const [photoIdx, setPhotoIdx] = useState(0);
  const [photoCat, setPhotoCat] = useState("exterieur");
  const [selectedVehiculeIdx, setSelectedVehiculeIdx] = useState<number | null>(null);

  const selectedLot = lots.find((l) => l.id === selectedLotId) ?? prochainesLots.find((l) => l.id === selectedLotId);
  const isPro = user?.accountType === "professionnel" || user?.accountType === "admin";

  /**
   * Historique des offres du lot ouvert — issu de `auctionDetail`, jamais
   * fabriqué. Le serveur ne renvoie que les offres acceptées ; `bidderId`
   * reste le seul identifiant disponible, affiché comme un numéro anonyme.
   */
  const detailQuery = trpc.auctionEngine.detail.useQuery(
    { id: selectedLotId ?? 0 },
    { enabled: selectedLotId !== null },
  );
  const bidHistory = useMemo(() => {
    const bids = (detailQuery.data?.bids ?? []) as { bidderId: number; amount: string | number; createdAt: Date }[];
    return bids.map((b) => ({
      montant: Number(b.amount),
      heure: new Date(b.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      pro: `Enchérisseur #${b.bidderId}`,
    }));
  }, [detailQuery.data]);

  const bidMutation = trpc.auctionEngine.bid.useMutation({
    onSuccess: (result) => {
      if (result.accepted) {
        showToast(`Enchere de ${Number(result.amount ?? 0).toLocaleString("fr-FR")} EUR confirmee !`);
        setEnchereInput("");
        catalogueQuery.refetch();
        detailQuery.refetch();
      } else {
        showToast(result.reason ?? "Enchere refusee.");
      }
    },
    onError: (err) => showToast(err.message || "Erreur lors de l'enchere."),
  });

  const filteredLots = useMemo(() => {
    return lots.filter((l) => {
      if (filterCat && l.categorie !== filterCat) return false;
      if (filterMarque && !l.marque.toLowerCase().includes(filterMarque.toLowerCase())) return false;
      if (filterEnergie && !l.energie.toLowerCase().includes(filterEnergie.toLowerCase())) return false;
      if (filterRoulant === "roulant" && !l.roulant) return false;
      if (filterRoulant === "non_roulant" && l.roulant) return false;
      if (filterPrixMax && l.miseDepart > Number(filterPrixMax)) return false;
      return true;
    });
  }, [lots, filterCat, filterMarque, filterEnergie, filterRoulant, filterPrixMax]);

  /**
   * Stats du tableau de bord "Mes enchères" — dérivées des offres réelles de
   * l'utilisateur (`myBids`) croisées avec le catalogue actif et les lots
   * remportés. "En cours" = offre acceptée sur un lot toujours actif,
   * "Perdue" = offre acceptée sur un lot clos que l'utilisateur n'a pas
   * remporté. Aucune de ces valeurs n'est déclarée sans preuve serveur.
   */
  const mesEncheresStats = useMemo(() => {
    const accepted = ((myBidsQuery.data ?? []) as { auctionId: number; status: string }[]).filter(
      (b) => b.status === "acceptee",
    );
    const auctionIdsBid = new Set(accepted.map((b) => b.auctionId));
    const wonIds = new Set(mesEncheres.map((e) => e.lotId));
    const activeIds = new Set(lots.map((l) => l.id));
    let enCours = 0;
    let perdues = 0;
    auctionIdsBid.forEach((id) => {
      if (wonIds.has(id)) return;
      if (activeIds.has(id)) enCours++;
      else perdues++;
    });
    return { suivies: watchList.length, enCours, gagnees: mesEncheres.length, perdues };
  }, [myBidsQuery.data, mesEncheres, lots, watchList]);

  const ToastEl = toast ? (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-2xl animate-pulse max-w-sm text-center">{toast}</div>
  ) : null;

  /* ════════════════════════════════════════════════════════════
     PAGE D'ACCUEIL — MKA.P-MS Enchères Pro
     ════════════════════════════════════════════════════════════ */
  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-[#0a0a14]">{ToastEl}
        {/* HERO */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f3c] via-[#0d0820] to-[#0a0a14]" />
          <div className="absolute inset-0 opacity-10">
            <img src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="relative px-4 py-12 md:py-20 md:px-8 max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 mb-6">
              <Lock size={12} className="text-purple-400" />
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Espace professionnel réservé</span>
            </div>
            <img
              src="/logo-open.png"
              alt="MKA.P-MS"
              className="mx-auto mb-4 h-14 md:h-20 w-auto drop-shadow-[0_4px_18px_rgba(212,175,55,0.35)]"
              draggable={false}
            />
            <h1 className="flex flex-col items-center gap-2 text-4xl md:text-6xl font-black text-white leading-tight">
              <img
                src="/brand/wordmark.png"
                alt="MKA.P-MS"
                className="h-9 md:h-14 w-auto"
                draggable={false}
              />
              <span className="text-purple-400">ENCHÈRES PRO</span>
            </h1>
            <p className="mt-4 text-sm md:text-base text-white/50 max-w-lg mx-auto">
              Véhicules professionnels, reprises, flottes et lots réservés aux professionnels validés.
            </p>
          </div>
        </div>

        {/* 5 BOUTONS PRINCIPAUX */}
        <div className="px-4 md:px-8 max-w-4xl mx-auto -mt-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Enchères en cours", icon: Gavel, mode: "lots" as const, color: "from-purple-600 to-purple-800" },
              { label: "Prochaines ventes", icon: Calendar, mode: "prochaines" as const, color: "from-blue-600 to-blue-800" },
              { label: "Mes enchères", icon: Activity, mode: "mes_encheres" as const, color: "from-amber-600 to-amber-800" },
              { label: "Véhicules remportés", icon: Award, mode: "remportes" as const, color: "from-green-600 to-green-800" },
              { label: "Conditions d'accès", icon: FileText, mode: "conditions" as const, color: "from-slate-600 to-slate-800" },
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => {
                  if (!user) { navigate("/connexion"); return; }
                  setMode(b.mode);
                }}
                className={`rounded-2xl bg-gradient-to-br ${b.color} p-5 text-left hover:opacity-90 transition shadow-lg`}
              >
                <b.icon size={22} className="text-white/80 mb-2" />
                <h3 className="text-sm font-bold text-white">{b.label}</h3>
              </button>
            ))}
          </div>
        </div>

        {/* CATÉGORIES */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-12">
          <h2 className="text-lg font-extrabold text-white text-center mb-6">CATÉGORIES DE VÉHICULES</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => { setFilterCat(c.id); setMode("lots"); }}
                className="rounded-xl bg-white/5 border border-white/10 p-4 text-center hover:bg-white/10 transition">
                <span className={`inline-block rounded-full ${c.color} px-3 py-1 text-[9px] font-bold text-white mb-2`}>{c.badge}</span>
                <p className="text-xs text-white/70">{c.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ACCÈS AUTORISÉ */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-12">
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 md:p-8">
            <h2 className="text-lg font-extrabold text-white text-center mb-4">QUI PEUT ENCHÉRIR ?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ACHETEURS.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  <a.icon size={18} className="text-purple-400 shrink-0" />
                  <span className="text-sm text-white/80">{a.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
              <p className="text-xs text-red-400 font-bold">❌ Particuliers non autorisés — Vérification SIRET/KBIS obligatoire</p>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-12 mb-12">
          <div className="grid grid-cols-4 gap-4">
            {[
              { val: `${lots.length}`, label: "Lots en cours" },
              { val: `${lots.reduce((s, l) => s + l.encherisseurs, 0)}`, label: "Enchérisseurs" },
              { val: `${lots.reduce((s, l) => s + l.nbVehicules, 0)}`, label: "Véhicules" },
              { val: `${Math.round(lots.reduce((s, l) => s + l.offreActuelle, 0) / 1000)}k €`, label: "Volume" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-[#D4AF37]">{s.val}</p>
                <p className="text-[10px] text-white/40 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     CONDITIONS D'ACCÈS
     ════════════════════════════════════════════════════════════ */
  if (mode === "conditions") {
    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => setMode("landing")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-purple-400" /> Conditions d'accès</h1>
        </div>
        <div className="px-4 mt-6 max-w-3xl mx-auto space-y-4">
          {[
            { title: "Qui peut participer ?", items: ["Garages et ateliers mécaniques validés", "Marchands automobiles avec SIRET/KBIS", "Carrossiers agréés", "Exportateurs avec licence", "Centres de recyclage agréés (casse)", "Tout professionnel avec documents vérifiés"], icon: Users },
            { title: "Documents requis", items: ["SIRET ou KBIS valide", "Pièce d'identité du gérant", "Justificatif de domicile professionnel", "Attestation d'assurance RC Pro", "RIB professionnel", "Acceptation des CGV enchères"], icon: FileText },
            { title: "Règles d'enchère", items: ["Enchère minimum = prix de départ", "Palier d'enchère par lot (100€ à 500€)", "Surenchère automatique possible", "Clôture automatique à l'heure prévue", "Prolongation de 5 min si enchère dans la dernière minute", "Enchère irrévocable une fois placée"], icon: Gavel },
            { title: "Après enchère remportée", items: ["Paiement sous 48h obligatoire", "Enlèvement sous 72h après paiement", "Transport possible (frais en sus)", "Facture automatique", "Véhicule vendu en l'état — sans garantie", "Aucune vente à particulier autorisée"], icon: CreditCard },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><s.icon size={16} className="text-purple-400" /> {s.title}</h3>
              <ul className="space-y-2">
                {s.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-white/60"><CheckCircle size={12} className="text-purple-400 mt-0.5 shrink-0" /> {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     MES ENCHÈRES (Tableau de bord pro)
     ════════════════════════════════════════════════════════════ */
  if (mode === "mes_encheres") {
    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => setMode("landing")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Activity size={20} className="text-purple-400" /> Tableau de bord</h1>
        </div>

        {/* Stats */}
        <div className="px-4 mt-6 grid grid-cols-4 gap-2">
          {[
            { val: `${mesEncheresStats.suivies}`, label: "Suivies", color: "text-blue-400" },
            { val: `${mesEncheresStats.enCours}`, label: "En cours", color: "text-purple-400" },
            { val: `${mesEncheresStats.gagnees}`, label: "Gagnées", color: "text-green-400" },
            { val: `${mesEncheresStats.perdues}`, label: "Perdues", color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-[9px] text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="px-4 mt-6 space-y-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Enchères suivies</h3>
            {lots.filter((l) => watchList.includes(l.id)).length === 0 && (
              <p className="text-xs text-white/30 py-2">Aucun lot ajouté à votre liste de suivi.</p>
            )}
            {lots.filter((l) => watchList.includes(l.id)).map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 cursor-pointer" onClick={() => { setSelectedLotId(l.id); setMode("detail"); }}>
                <img src={l.photo} alt="" className="h-10 w-14 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-xs font-bold text-white truncate">{l.titre}</p><p className="text-[10px] text-white/40">{l.fin} restant</p></div>
                <p className="text-xs font-bold text-purple-400">{l.offreActuelle.toLocaleString("fr-FR")} €</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Paiements à effectuer</h3>
            <div className="flex items-center gap-3 py-2">
              <DollarSign size={16} className="text-amber-400" />
              <div className="flex-1"><p className="text-xs font-bold text-white">Aucun paiement en attente</p><p className="text-[10px] text-white/40">Vos paiements sont à jour</p></div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Factures et documents</h3>
            {mesEncheres.length === 0 && <p className="text-xs text-white/30 py-2">Aucune enchère remportée pour le moment.</p>}
            {mesEncheres.filter((e) => e.statut !== "paiement_attente").map((e) => (
              <div key={e.lotId} onClick={() => setMode("remportes")} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 transition rounded-lg px-2">
                <Receipt size={14} className="text-white/40" />
                <div className="flex-1"><p className="text-xs font-bold text-white">{e.titre}</p><p className="text-[10px] text-white/40">{e.date} — {e.montant.toLocaleString("fr-FR")} €</p></div>
                <button onClick={(ev) => { ev.stopPropagation(); setViewFactureEnchere(e); }} className="text-[10px] text-purple-400 font-bold hover:text-purple-300 transition">PDF</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     VÉHICULES REMPORTÉS
     ════════════════════════════════════════════════════════════ */
  if (mode === "remportes") {
    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => setMode("landing")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Award size={20} className="text-[#D4AF37]" /> Véhicules remportés</h1>
        </div>
        <div className="px-4 mt-6 space-y-3">
          {mesEncheres.length === 0 && (
            <p className="text-center text-white/30 py-12">Aucun véhicule remporté pour le moment.</p>
          )}
          {mesEncheres.map((e) => {
            const st = STATUT_LABELS[e.statut];
            return (
              <div key={e.lotId} className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{e.titre}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{e.date}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[9px] font-bold ${st.color}`}>{st.label}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-black text-[#D4AF37]">{e.montant.toLocaleString("fr-FR")} €</p>
                  <div className="flex gap-2">
                    <button onClick={() => setViewFactureEnchere(e)} className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/20 transition">Facture</button>
                    <button onClick={() => imprimerBordereau(e)} className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/20 transition">Documents</button>
                  </div>
                </div>
                {e.statut === "paye" && (
                  <div className="mt-3 rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                    <p className="text-xs text-blue-400">Retrait disponible · Contactez-nous pour programmer l'enlèvement.</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => showToast('Demande de retrait envoyee — nous vous contacterons sous 24h')} className="rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-blue-700 transition">Programmer retrait</button>
                      <button onClick={() => showToast('Demande de livraison envoyee — devis transport sous 24h')} className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/20 transition">Demander livraison</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     PROCHAINES VENTES
     ════════════════════════════════════════════════════════════ */
  if (mode === "prochaines") {
    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => setMode("landing")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-blue-400" /> Prochaines ventes</h1>
        </div>
        <div className="px-4 mt-6 space-y-4">
          {prochainesLots.length === 0 && (
            <p className="text-center text-white/30 py-12">Aucune vente programmée pour le moment.</p>
          )}
          {prochainesLots.map((v) => (
            <div key={v.id} className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{v.titre}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{v.localisation}</p>
                </div>
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-bold text-blue-400">{v.heureDebut}</span>
              </div>
              <div className="mt-3 flex gap-4 text-xs">
                <span className="text-white/60">{v.nbVehicules} véhicule(s)</span>
                <span className="text-white/60">Mise à prix : {v.miseDepart.toLocaleString("fr-FR")} €</span>
              </div>
              <button onClick={() => { setSelectedLotId(v.id); setMode("detail"); }} className="mt-3 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition">Voir le lot</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     LISTE DES LOTS — avec filtres
     ════════════════════════════════════════════════════════════ */
  if (mode === "lots") {
    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => { setMode("landing"); setFilterCat(""); }} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <div className="flex items-center gap-2">
            <Gavel size={20} className="text-purple-400" />
            <h1 className="text-xl font-black text-white">Enchères en cours</h1>
          </div>
          <p className="mt-1 text-sm text-white/50">{filteredLots.length} lot(s) disponible(s)</p>
        </div>

        {!isPro && (
          <div className="mx-4 mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-300"><span className="font-bold">Accès restreint.</span> Les enchères sont réservées aux professionnels validés (SIRET/KBIS).</p>
          </div>
        )}

        {/* Filtres catégorie */}
        <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setFilterCat("")} className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-bold transition ${!filterCat ? "bg-purple-600 text-white" : "bg-white/5 border border-white/10 text-white/60"}`}>Tous</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setFilterCat(filterCat === c.id ? "" : c.id)} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-bold transition ${filterCat === c.id ? `${c.color} text-white` : "bg-white/5 border border-white/10 text-white/60"}`}>{c.badge}</button>
          ))}
        </div>

        {/* Filtres avancés */}
        <div className="px-4 mt-2">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 text-xs text-purple-400 font-semibold">
            <Filter size={12} /> Filtres avancés {showFilters ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {showFilters && (
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              <input className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none" placeholder="Marque" value={filterMarque} onChange={(e) => setFilterMarque(e.target.value)} />
              <select className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none" value={filterEnergie} onChange={(e) => setFilterEnergie(e.target.value)}>
                <option value="">Énergie</option>
                <option value="diesel">Diesel</option>
                <option value="essence">Essence</option>
              </select>
              <select className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none" value={filterRoulant} onChange={(e) => setFilterRoulant(e.target.value)}>
                <option value="">Roulant / Non</option>
                <option value="roulant">Roulant</option>
                <option value="non_roulant">Non roulant</option>
              </select>
              <input className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none" placeholder="Prix max (€)" type="number" value={filterPrixMax} onChange={(e) => setFilterPrixMax(e.target.value)} />
            </div>
          )}
        </div>

        {/* Lots */}
        <div className="px-4 mt-4 space-y-3">
          {filteredLots.map((l) => {
            const cat = CATEGORIES.find((c) => c.id === l.categorie);
            return (
              <div key={l.id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/[0.08] transition cursor-pointer" onClick={() => { setSelectedLotId(l.id); setMode("detail"); setPhotoIdx(0); }}>
                <div className="relative h-[160px]">
                  <img src={l.photo} alt={l.titre} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    {l.badges.map((b) => {
                      const bc = CATEGORIES.find((c) => c.badge === b);
                      return <span key={b} className={`rounded-full ${bc?.color || "bg-purple-600"} px-2.5 py-1 text-[8px] font-bold text-white`}>{b}</span>;
                    })}
                  </div>
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold text-white flex items-center gap-1"><Clock size={10} /> {l.fin}</span>
                  {l.nbVehicules > 1 && <span className="absolute bottom-3 left-3 rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] font-bold text-white">{l.nbVehicules} véhicules</span>}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white">{l.titre}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-white/40">
                    <span>{l.km} km</span>
                    <span>·</span>
                    <span>{l.energie}</span>
                    <span>·</span>
                    <span>{l.annee}</span>
                    <span>·</span>
                    <span>{l.localisation}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-white/40">{l.etatGeneral}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white/5 p-2.5 text-center"><p className="text-[8px] text-white/40">Départ</p><p className="text-sm font-bold text-white">{l.miseDepart.toLocaleString("fr-FR")} €</p></div>
                    <div className="rounded-lg bg-purple-500/10 p-2.5 text-center"><p className="text-[8px] text-purple-400">Offre actuelle</p><p className="text-sm font-black text-purple-400">{l.offreActuelle.toLocaleString("fr-FR")} €</p></div>
                    <div className="rounded-lg bg-white/5 p-2.5 text-center"><p className="text-[8px] text-white/40">Enchérisseurs</p><p className="text-sm font-bold text-white">{l.encherisseurs}</p></div>
                  </div>
                  {l.rapportEstimation > 0 && (
                    <p className="mt-2 text-[10px] text-white/30 flex items-center gap-1"><FileText size={10} /> Rapport disponible · Travaux estimés : {l.rapportEstimation.toLocaleString("fr-FR")} €</p>
                  )}
                </div>
              </div>
            );
          })}
          {filteredLots.length === 0 && <p className="text-center text-white/30 py-12">Aucun lot trouvé avec ces filtres.</p>}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     PAGE PRODUIT ENCHÈRE — 6 blocs
     ════════════════════════════════════════════════════════════ */
  if (mode === "detail" && selectedLot) {
    const nextBid = selectedLot.offreActuelle + selectedLot.palier;

    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => setMode("lots")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedLot.badges.map((b) => {
              const bc = CATEGORIES.find((c) => c.badge === b);
              return <span key={b} className={`rounded-full ${bc?.color || "bg-purple-600"} px-2.5 py-1 text-[8px] font-bold text-white`}>{b}</span>;
            })}
          </div>
          <h1 className="text-xl font-black text-white">{selectedLot.titre}</h1>
        </div>

        {/* Photo principale — click ouvre galerie */}
        <div className="px-4 mt-4">
          <div className="rounded-2xl overflow-hidden border border-white/10 relative cursor-pointer" onClick={() => { setPhotoCat("exterieur"); setMode("photos"); }}>
            <img src={selectedLot.photo} alt="" className="w-full h-56 md:h-72 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <Camera size={16} className="text-white" />
              <span className="text-sm font-bold text-white">Voir toutes les photos</span>
            </div>
            <span className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold text-white">{selectedLot.photos.length} photos</span>
          </div>
        </div>

        <div className="px-4 mt-4 space-y-4">

          {/* ═══ BLOC 1 — ENCHÈRE EN COURS ═══ */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gavel size={18} className="text-purple-400" />
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Enchère en cours</h2>
              <span className="ml-auto flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-[10px] font-bold text-red-400"><Clock size={10} /> {selectedLot.fin}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="rounded-xl bg-white/5 p-3"><p className="text-[9px] text-white/40">Prix de départ</p><p className="text-lg font-bold text-white">{selectedLot.miseDepart.toLocaleString("fr-FR")} €</p></div>
              <div className="rounded-xl bg-purple-500/20 border border-purple-500/30 p-3"><p className="text-[9px] text-purple-300">Meilleure offre</p><p className="text-xl font-black text-purple-300">{selectedLot.offreActuelle.toLocaleString("fr-FR")} €</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-[9px] text-white/40">Offres</p><p className="text-lg font-bold text-white">{selectedLot.encheres}</p></div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-white/40 mb-4">
              <span>Prochaine mise min. : {nextBid.toLocaleString("fr-FR")} €</span>
              <span>{selectedLot.encherisseurs} pro intéressés</span>
            </div>

            {isPro ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                    <span className="text-sm font-bold text-white/40 mr-2">€</span>
                    <input className="flex-1 text-lg font-bold text-white outline-none bg-transparent placeholder:text-white/20 min-w-0" placeholder={`Min. ${nextBid.toLocaleString("fr-FR")}`} value={enchereInput} onChange={(e) => setEnchereInput(e.target.value.replace(/[^\d]/g, ""))} />
                  </div>
                  <button className="w-full sm:w-auto rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shrink-0" disabled={!enchereInput || Number(enchereInput) < nextBid} onClick={() => setShowBidConfirm(true)}>
                    <Gavel size={16} /> Enchérir
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { if (selectedLot) { setWatchList(prev => prev.includes(selectedLot.id) ? prev.filter(x => x !== selectedLot.id) : [...prev, selectedLot.id]); showToast(watchList.includes(selectedLot.id) ? 'Retiree de votre liste' : 'Ajoutee a votre liste de suivi'); } }} className={`flex-1 rounded-xl py-2.5 text-[10px] font-bold flex items-center justify-center gap-1 ${selectedLot && watchList.includes(selectedLot.id) ? 'bg-purple-600 text-white' : 'bg-white/5 border border-white/10 text-white/60'}`}><Bookmark size={12} /> {selectedLot && watchList.includes(selectedLot.id) ? 'Dans ma liste' : 'Ajouter a ma liste'}</button>
                  <button onClick={() => { if (selectedLot) imprimerRapportLot(selectedLot); }} className="flex-1 rounded-xl bg-white/5 border border-white/10 py-2.5 text-[10px] font-bold text-white/60 flex items-center justify-center gap-1"><FileText size={12} /> Voir rapport complet</button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
                <Lock size={18} className="text-red-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-red-300">Réservé aux professionnels validés</p>
                <p className="text-[10px] text-red-400/60 mt-1">SIRET/KBIS obligatoire pour enchérir</p>
              </div>
            )}
          </div>

          {/* ═══ BLOC 2 — IDENTITÉ VÉHICULE (adapté par type) ═══ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><Car size={16} className="text-[#D4AF37]" /> Identité du véhicule</h2>
            <div className="grid grid-cols-2 gap-2">
              {(() => {
                const base = [
                  { label: "Marque", val: selectedLot.marque },
                  { label: "Modèle", val: selectedLot.modele },
                  { label: "Version", val: selectedLot.version },
                  { label: "Année", val: selectedLot.annee },
                  { label: "Kilométrage", val: `${selectedLot.km} km` },
                  { label: "Énergie", val: selectedLot.energie },
                ];
                const tv = selectedLot.typeVehicule;
                if (tv === "moto" || tv === "quad") {
                  base.push(
                    { label: "Cylindrée", val: selectedLot.cylindree || "—" },
                    { label: "Nombre de roues", val: selectedLot.nbRoues || (tv === "quad" ? "4" : "2") },
                    { label: "Puissance", val: selectedLot.puissance },
                    { label: "Type", val: tv === "quad" ? "Quad" : "Moto" },
                  );
                } else if (tv === "camion") {
                  base.push(
                    { label: "Boîte", val: selectedLot.boite },
                    { label: "Puissance", val: selectedLot.puissance },
                    { label: "PTAC", val: selectedLot.ptac || "—" },
                    { label: "Nombre d'essieux", val: selectedLot.nbEssieux || "—" },
                    { label: "Hauteur", val: selectedLot.hauteur || "—" },
                  );
                } else if (tv === "utilitaire") {
                  base.push(
                    { label: "Boîte", val: selectedLot.boite },
                    { label: "Puissance", val: selectedLot.puissance },
                    { label: "PTAC", val: selectedLot.ptac || "—" },
                    { label: "Volume utile", val: selectedLot.hauteur || "—" },
                  );
                } else {
                  base.push(
                    { label: "Boîte", val: selectedLot.boite },
                    { label: "Puissance", val: selectedLot.puissance },
                  );
                }
                base.push(
                  { label: "VIN", val: selectedLot.vin },
                  { label: "Localisation", val: selectedLot.localisation },
                );
                return base;
              })().filter(f => f.val && f.val !== "—").map((f) => (
                <div key={f.label} className="rounded-lg bg-white/5 p-2.5">
                  <p className="text-[9px] text-white/30">{f.label}</p>
                  <p className="text-xs font-bold text-white">{f.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ BLOC 3 — ÉTAT DU VÉHICULE ═══ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><ClipboardList size={16} className="text-[#D4AF37]" /> État du véhicule</h2>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(selectedLot.etatDetail) as [string, EtatStatut][]).map(([key, val]) => {
                const e = ETAT_LABELS[val];
                const labels: Record<string, string> = {
                  mecanique: "Mécanique", carrosserie: "Carrosserie", interieur: "Intérieur",
                  pneus: "Pneus", vitrage: "Vitrage", electronique: "Électronique",
                  documents: "Documents", roulage: "Roulage",
                };
                return (
                  <div key={key} className="rounded-lg bg-white/5 p-3 flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${e.color}`}>
                      <e.icon size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] text-white/30">{labels[key] || key}</p>
                      <p className={`text-xs font-bold ${e.color.split(" ")[0]}`}>{e.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ BLOC 4 — RAPPORT MKA.P-MS ═══ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><FileText size={16} className="text-[#D4AF37]" /> Rapport MKA.P-MS</h2>

            <div className="space-y-3">
              <div>
                <h4 className="text-[10px] font-bold text-red-400 uppercase mb-1">Défauts visibles</h4>
                <ul className="space-y-1">{selectedLot.rapportDefauts.map((d) => <li key={d} className="flex items-start gap-2 text-xs text-white/60"><XCircle size={10} className="text-red-400 mt-0.5 shrink-0" /> {d}</li>)}</ul>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-amber-400 uppercase mb-1">Travaux connus</h4>
                <ul className="space-y-1">{selectedLot.rapportTravaux.map((t) => <li key={t} className="flex items-start gap-2 text-xs text-white/60"><Wrench size={10} className="text-amber-400 mt-0.5 shrink-0" /> {t}</li>)}</ul>
              </div>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <p className="text-[10px] text-amber-400/60">Estimation travaux</p>
                <p className="text-lg font-black text-amber-400">{selectedLot.rapportEstimation.toLocaleString("fr-FR")} €</p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-1">Documents disponibles</h4>
                <ul className="space-y-1">{selectedLot.rapportDocuments.map((d) => <li key={d} className="flex items-start gap-2 text-xs text-white/60"><FileText size={10} className="text-blue-400 mt-0.5 shrink-0" /> {d}</li>)}</ul>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-green-400 uppercase mb-1">Remarques</h4>
                <ul className="space-y-1">{selectedLot.rapportRemarques.map((r) => <li key={r} className="flex items-start gap-2 text-xs text-white/60"><Info size={10} className="text-green-400 mt-0.5 shrink-0" /> {r}</li>)}</ul>
              </div>
            </div>
          </div>

          {/* ═══ BLOC 5 — VÉHICULES DU LOT (cliquables) ═══ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><Car size={16} className="text-[#D4AF37]" /> Véhicules ({selectedLot.vehicules.length})</h2>
            <div className="space-y-2">
              {selectedLot.vehicules.map((v, i) => (
                <div key={i} onClick={() => { setSelectedVehiculeIdx(i); setMode("vehicule_detail"); }}
                  className="rounded-xl bg-white/5 p-3 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-lg shrink-0">🚗</div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">{v.marque} {v.modele}</p>
                    <p className="text-[10px] text-white/40">{v.annee} · {v.km.toLocaleString("fr-FR")} km</p>
                    <p className="text-[10px] text-amber-400">{v.etat}</p>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-purple-400 transition shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* ═══ HISTORIQUE DES OFFRES ═══ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><History size={16} className="text-purple-400" /> Historique des offres</h2>
            <div className="space-y-1.5">
              {bidHistory.map((b, i) => (
                <div key={i} className={`rounded-lg p-2.5 flex items-center justify-between ${i === 0 ? "bg-purple-500/10 border border-purple-500/20" : "bg-white/5"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30">{b.heure}</span>
                    <span className="text-xs text-white/60">{b.pro}</span>
                  </div>
                  <span className={`text-xs font-bold ${i === 0 ? "text-purple-400" : "text-white/60"}`}>{b.montant.toLocaleString("fr-FR")} €</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ BLOC 6 — CONDITIONS DE VENTE ═══ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><Shield size={16} className="text-[#D4AF37]" /> Conditions de vente</h2>
            <ul className="space-y-2">
              {[
                "Vente réservée aux professionnels validés",
                "Véhicule vendu en l'état — aucune garantie",
                "Paiement intégral sous 48h après adjudication",
                `Palier d'enchère : ${selectedLot.palier} €`,
                "Retrait sous 72h après paiement",
                "Frais de dossier : 150 € HT / lot",
                "Transport possible (frais en sus)",
                "Aucune vente à particulier",
                "Véhicule vendu sans contrôle technique (sauf mention)",
                "Visite sur rendez-vous uniquement",
              ].map((c) => (
                <li key={c} className="flex items-start gap-2 text-xs text-white/50"><Info size={10} className="text-white/30 mt-0.5 shrink-0" /> {c}</li>
              ))}
            </ul>
          </div>

        </div>

        {/* Confirmation enchère modal */}
        {showBidConfirm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowBidConfirm(false)}>
            <div className="bg-[#1a1a2e] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-500/30" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-extrabold text-white">Confirmer votre enchère</h3>
                <button onClick={() => setShowBidConfirm(false)}><X size={20} className="text-white/40" /></button>
              </div>
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-5 text-center mb-4">
                <p className="text-xs text-purple-300/60">Votre enchère</p>
                <p className="text-3xl font-black text-purple-300">{Number(enchereInput).toLocaleString("fr-FR")} €</p>
              </div>
              <p className="text-sm font-bold text-white mb-1">{selectedLot.titre}</p>
              <p className="text-xs text-white/40 mb-4">{selectedLot.etatGeneral}</p>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 mb-4">
                <p className="text-[10px] text-amber-400 flex items-start gap-1"><AlertTriangle size={10} className="mt-0.5 shrink-0" /> En confirmant, votre enchère est irrévocable. Si vous remportez le lot, le paiement est obligatoire sous 48h.</p>
              </div>
              <div className="space-y-2">
                <button className="w-full rounded-xl bg-purple-600 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition"
                  disabled={bidMutation.isPending}
                  onClick={() => {
                    if (!selectedLot) return;
                    setShowBidConfirm(false);
                    bidMutation.mutate({ auctionId: selectedLot.id, amount: Number(enchereInput) });
                  }}>
                  {bidMutation.isPending ? "Envoi…" : `Confirmer l'enchère — ${Number(enchereInput).toLocaleString("fr-FR")} €`}
                </button>
                <button className="w-full rounded-xl bg-white/5 border border-white/10 py-3 text-sm font-semibold text-white/60" onClick={() => setShowBidConfirm(false)}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     GALERIE PHOTOS — par catégorie (extérieur, intérieur, moteur, dommages, etc.)
     ════════════════════════════════════════════════════════════ */
  if (mode === "photos" && selectedLot) {
    const PHOTO_CATS = [
      { id: "exterieur", label: "Extérieur", icon: Car },
      { id: "interieur", label: "Intérieur", icon: Eye },
      { id: "moteur", label: "Moteur", icon: Settings },
      { id: "coffre", label: "Coffre", icon: Package },
      { id: "tableau_bord", label: "Tableau de bord", icon: Gauge },
      { id: "dommages", label: "Dommages", icon: AlertTriangle },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "pneus", label: "Pneus", icon: Navigation },
    ];
    const currentPhotos = selectedLot.photosCategories[photoCat as keyof typeof selectedLot.photosCategories] || [];
    const allPhotosCount = Object.values(selectedLot.photosCategories).reduce((s, arr) => s + arr.length, 0);

    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => { setMode("detail"); setPhotoIdx(0); }} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Camera size={20} className="text-purple-400" /> Photos professionnelles</h1>
          <p className="text-xs text-white/40 mt-1">{allPhotosCount} photos · {selectedLot.titre}</p>
        </div>

        {/* Catégories */}
        <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-2">
          {PHOTO_CATS.map((c) => {
            const count = (selectedLot.photosCategories[c.id as keyof typeof selectedLot.photosCategories] || []).length;
            return (
              <button key={c.id} onClick={() => { setPhotoCat(c.id); setPhotoIdx(0); }}
                className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-bold transition flex items-center gap-1.5 ${photoCat === c.id ? (c.id === "dommages" ? "bg-red-600 text-white" : "bg-purple-600 text-white") : "bg-white/5 border border-white/10 text-white/60"}`}>
                <c.icon size={12} /> {c.label} {count > 0 && <span className="rounded-full bg-white/20 px-1.5 text-[8px]">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Photos grille */}
        <div className="px-4 mt-4">
          {currentPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {currentPhotos.map((p, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-purple-500/50 transition" onClick={() => setPhotoIdx(i)}>
                  <img src={p} alt={`${photoCat} ${i + 1}`} className="w-full h-36 md:h-48 object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Camera size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">Aucune photo dans cette catégorie</p>
            </div>
          )}
        </div>

        {/* Photo plein écran */}
        {currentPhotos.length > 0 && photoIdx < currentPhotos.length && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4" onClick={() => setPhotoIdx(-1)}>
            {photoIdx >= 0 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(-1); }} className="absolute top-4 right-4 z-50"><X size={24} className="text-white/60" /></button>
                <img src={currentPhotos[photoIdx]} alt="" className="max-h-[80vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
                <div className="mt-4 flex gap-4">
                  <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(Math.max(0, photoIdx - 1)); }} className="rounded-full bg-white/10 p-2"><ChevronLeft size={20} className="text-white" /></button>
                  <span className="text-white/60 text-sm self-center">{photoIdx + 1} / {currentPhotos.length}</span>
                  <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(Math.min(currentPhotos.length - 1, photoIdx + 1)); }} className="rounded-full bg-white/10 p-2"><ChevronRight size={20} className="text-white" /></button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     DÉTAIL VÉHICULE INDIVIDUEL (cliqué depuis le lot)
     ════════════════════════════════════════════════════════════ */
  if (mode === "vehicule_detail" && selectedLot && selectedVehiculeIdx !== null) {
    const v = selectedLot.vehicules[selectedVehiculeIdx];
    if (!v) { setMode("detail"); return null; }

    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => setMode("detail")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour au lot</button>
          <h1 className="text-xl font-black text-white">{v.marque} {v.modele}</h1>
          <p className="text-xs text-white/40 mt-1">Lot : {selectedLot.titre}</p>
        </div>

        <div className="px-4 mt-6 space-y-4">
          {/* Identité */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><Car size={16} className="text-[#D4AF37]" /> Identité</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Marque", val: v.marque },
                { label: "Modèle", val: v.modele },
                { label: "Année", val: String(v.annee) },
                { label: "Kilométrage", val: `${v.km.toLocaleString("fr-FR")} km` },
              ].map((f) => (
                <div key={f.label} className="rounded-lg bg-white/5 p-2.5">
                  <p className="text-[9px] text-white/30">{f.label}</p>
                  <p className="text-xs font-bold text-white">{f.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* État */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><ClipboardList size={16} className="text-[#D4AF37]" /> État</h2>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
              <p className="text-sm font-bold text-amber-400">{v.etat}</p>
            </div>
          </div>

          {/* Lien VO → Enchères */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-900/30 to-blue-900/20 border border-purple-500/20 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><RefreshCcw size={16} className="text-purple-400" /> Circuit de décision</h2>
            <div className="space-y-2">
              {[
                { label: "Vente classique MKA.P-MS", desc: "Véhicule en bon état → vente directe", icon: Car, color: "bg-green-500/10 border-green-500/20 text-green-400" },
                { label: "Préparation VO", desc: "Remise en état avant vente", icon: Wrench, color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
                { label: "Enchères Pro", desc: "Véhicule à gros travaux → enchère professionnelle", icon: Gavel, color: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
              ].map((opt) => (
                <div key={opt.label} className={`rounded-xl ${opt.color} border p-3 flex items-center gap-3 cursor-pointer hover:opacity-80 transition`}>
                  <opt.icon size={16} className="shrink-0" />
                  <div>
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] opacity-60">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={() => setMode("detail")} className="flex-1 rounded-xl bg-white/5 border border-white/10 py-3 text-xs font-bold text-white/60 flex items-center justify-center gap-2">
              <ArrowLeft size={14} /> Retour au lot
            </button>
            <button onClick={() => { setPhotoCat("exterieur"); setMode("photos"); }} className="flex-1 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white flex items-center justify-center gap-2">
              <Camera size={14} /> Voir les photos
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Document viewer for factures encheres - rendered as portal-style overlay */
  if (viewFactureEnchere) {
    return (
      <DocumentView
        doc={buildFactureData({ ref: `FA-ENCH-${viewFactureEnchere.lotId}`, objet: viewFactureEnchere.titre, client: "Acheteur MKA.P-MS", montant: `${viewFactureEnchere.montant.toLocaleString("fr-FR")} EUR`, date: viewFactureEnchere.date, statut: viewFactureEnchere.statut === "paye" ? "Paye" : "En attente", type: "Enchere" })}
        onClose={() => setViewFactureEnchere(null)}
      />
    );
  }

  return null;
}
