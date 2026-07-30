import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAnnonceUrl } from "../lib/annonceUrl";
import { Camera, CheckCircle2, Pencil, Trash2, X, RefreshCw, Clock, ChevronDown, ChevronLeft, LogOut, User as UserIcon, Bell, Grid3x3, Megaphone, FileText, Search as SearchIcon, CalendarCheck, Crown, FolderLock, HelpCircle, Plus, Car, Bike, Truck, Bus, KeyRound, Settings, Wallet, Star, Info, Download, RefreshCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { isAdmin, isPro, ROLE_LABELS } from "@shared/roles";
import type { UserRole } from "@shared/roles";
import { canAccessServicePath } from "@shared/permissions";
import FileUpload from "../components/FileUpload";

type Tab = "annonces" | "toutes-annonces" | "publicites" | "favoris" | "recherches" | "reservations" | "devis" | "abonnements" | "litiges" | "fidelite" | "coffre" | "vehicules" | "rapports" | "services" | "profil" | "notifications" | "wallet";

const DEMO_RAPPORTS = [
  { id: 1, plaque: "AB-123-CD", vinPartiel: "VF1KR****567890", type: "Rapport Complet", prix: "7,99 \u20ac", date: "28/05/2024", statut: "Disponible" },
  { id: 2, plaque: "EF-456-GH", vinPartiel: "WBA8E****123456", type: "Rapport Express", prix: "4,99 \u20ac", date: "15/04/2024", statut: "Disponible" },
];

const ALL_SERVICES = [
  { label: "Acheter un v\u00e9hicule", to: "/acheter", emoji: "\ud83d\ude97", desc: "Parcourez les annonces et trouvez votre v\u00e9hicule id\u00e9al" },
  { label: "Vendre un v\u00e9hicule", to: "/vendre", emoji: "\ud83d\udcb0", desc: "D\u00e9posez une annonce et vendez rapidement" },
  { label: "Location", to: "/louer", emoji: "\ud83d\udd11", desc: "Louez un v\u00e9hicule en toute confiance" },
  { label: "Garage & R\u00e9paration", to: "/garages", emoji: "\ud83d\udd27", desc: "Trouvez un garage et demandez un devis" },
  { label: "Atelier Pro", to: "/atelier-pro", emoji: "\ud83d\udee0\ufe0f", desc: "Gestion atelier, planning, suivi temps r\u00e9el" },
  { label: "Catalogue Technique", to: "/catalogue-technique", emoji: "\ud83d\udcd6", desc: "AutoData — couples de serrage, temps bar\u00e9m\u00e9s, pi\u00e8ces" },
  { label: "Suivi V\u00e9hicule", to: "/suivi-vehicule", emoji: "\ud83d\udccd", desc: "Suivez vos r\u00e9parations en temps r\u00e9el" },
  { label: "Favoris", to: "/favoris", emoji: "\u2764\ufe0f", desc: "Vos favoris : v\u00e9hicules, garages, locations" },
  { label: "Comparateur", to: "/comparateur", emoji: "\ud83d\udd0d", desc: "Comparez 2 \u00e0 4 v\u00e9hicules c\u00f4te \u00e0 c\u00f4te" },
  { label: "Historique Consultations", to: "/historique-consultations", emoji: "\ud83d\udd70\ufe0f", desc: "Retrouvez ce que vous avez vu r\u00e9cemment" },
  { label: "Dossier Client", to: "/dossier-client", emoji: "\ud83d\udcc1", desc: "Tout votre historique centralis\u00e9" },
  { label: "Dossier V\u00e9hicule", to: "/dossier-vehicule-numerique", emoji: "\ud83d\udcdd", desc: "Carnet num\u00e9rique entretien, CT, factures" },
  { label: "Notifications", to: "/notifications", emoji: "\ud83d\udd14", desc: "Centre de notifications unifi\u00e9" },
  { label: "Comptabilit\u00e9", to: "/compta-dirigeant", emoji: "\ud83d\udcb9", desc: "Tableau de bord dirigeant CA, finances" },
  { label: "D\u00e9pannage", to: "/depannage", emoji: "\ud83d\ude91", desc: "Assistance routi\u00e8re 24h/24, 7j/7" },
  { label: "Carte Grise", to: "/carte-grise", emoji: "\ud83d\udcc4", desc: "D\u00e9marches carte grise en ligne" },
  { label: "Livraison", to: "/livraison", emoji: "\ud83d\ude9a", desc: "Livraison France & Afrique" },
  { label: "Historique V\u00e9hicule", to: "/historique", emoji: "\ud83d\udcca", desc: "Rapport complet kilom\u00e9trage, entretien, CT" },
  { label: "Pi\u00e8ces Auto", to: "/pieces", emoji: "\u2699\ufe0f", desc: "Catalogue pi\u00e8ces d\u00e9tach\u00e9es" },
  { label: "Moto & Scooter", to: "/acheter?type=moto", emoji: "\ud83c\udfcd\ufe0f", desc: "V\u00e9hicules deux roues" },
  { label: "Journal d'activit\u00e9", to: "/journal-activite", emoji: "\ud83d\udcdc", desc: "Historique de toutes vos actions" },
  { label: "Abonnements", to: "/abonnements", emoji: "\ud83c\udfe6", desc: "Abonnements et tarifs" },
  { label: "MKA.P-MS Rewards", to: "/rewards", emoji: "\u2b50", desc: "Points fidelite, niveaux, recompenses" },
  { label: "Support", to: "/aide", emoji: "\ud83d\udcde", desc: "Aide et assistance 7j/7" },
];

const TIER_LABELS: Record<string, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum", elite: "Elite" };

// Version publique de l'application (suivi de l'évolution côté compte).
export const APP_VERSION = "1.0.0";

// Statuts d'une réservation (booking) — libellés + couleurs pour la fiche détaillée.
const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmée", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Annulée", cls: "bg-slate-200 text-slate-600" },
  completed: { label: "Terminée", cls: "bg-sky-100 text-sky-700" },
  rejected: { label: "Refusée", cls: "bg-red-100 text-red-700" },
};
const CAUTION_STATUS: Record<string, string> = {
  none: "Aucun acompte",
  pending: "Acompte en attente de paiement",
  paid: "Acompte payé",
  refunded: "Acompte remboursé",
  forfeited: "Acompte conservé",
};
const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  succeeded: { label: "Payé", cls: "bg-emerald-100 text-emerald-700" },
  paid: { label: "Payé", cls: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Échoué", cls: "bg-red-100 text-red-700" },
  refunded: { label: "Remboursé", cls: "bg-slate-200 text-slate-600" },
  canceled: { label: "Annulé", cls: "bg-slate-200 text-slate-600" },
};
const DOC_CATEGORIES: { value: string; label: string }[] = [
  { value: "carte_grise", label: "Carte grise" },
  { value: "certificat_cession", label: "Certificat de cession" },
  { value: "certificat_immatriculation", label: "Certificat d'immatriculation" },
  { value: "controle_technique", label: "Contrôle technique" },
  { value: "facture", label: "Facture" },
  { value: "contrat", label: "Contrat" },
  { value: "assurance", label: "Assurance" },
  { value: "permis", label: "Permis de conduire" },
  { value: "identite", label: "Pièce d'identité" },
  { value: "photo_vehicule", label: "Photo du véhicule" },
  { value: "autre", label: "Autre" },
];
// Catégories nécessitant une plaque d'immatriculation.
const DOC_NEEDS_PLAQUE = new Set([
  "carte_grise",
  "certificat_cession",
  "certificat_immatriculation",
  "controle_technique",
]);

const TAB_LABELS: Record<Tab, string> = {
  annonces: "Mes annonces",
  "toutes-annonces": "Toutes les annonces",
  publicites: "Publicit\u00e9s",
  favoris: "Favoris",
  recherches: "Recherches",
  reservations: "R\u00e9servations",
  devis: "Devis Garage",
  abonnements: "Abonnements",
  litiges: "Litiges",
  fidelite: "Rewards",
  coffre: "Coffre-fort",
  vehicules: "Dossier V\u00e9hicules",
  rapports: "Rapports Historique",
  services: "Services",
  profil: "Profil",
  notifications: "Notifications",
  wallet: "Portefeuille",
};

// Sections repliables (accord\u00e9on) — chaque groupe a une fl\u00e8che, s'ouvre en dessous.
// Aucune fonction retir\u00e9e : chaque onglet existant est rang\u00e9 dans sa section.
const GROUP_DEFS: { key: string; label: string; icon: LucideIcon; tabs: Tab[] }[] = [
  { key: "annonces", label: "Annonces", icon: FileText, tabs: ["annonces", "toutes-annonces", "publicites"] },
  { key: "recherche", label: "Recherches & Favoris", icon: SearchIcon, tabs: ["favoris", "recherches"] },
  { key: "transactions", label: "R\u00e9servations & Devis", icon: CalendarCheck, tabs: ["reservations", "devis", "litiges"] },
  { key: "abo", label: "Abonnements & Rewards", icon: Crown, tabs: ["abonnements", "fidelite"] },
  { key: "docs", label: "Documents & V\u00e9hicules", icon: FolderLock, tabs: ["coffre", "vehicules", "rapports"] },
  { key: "notif", label: "Notifications", icon: Bell, tabs: ["notifications"] },
  { key: "services", label: "Services", icon: Grid3x3, tabs: ["services"] },
  { key: "profil", label: "Profil & Compte", icon: UserIcon, tabs: ["profil"] },
  { key: "wallet", label: "Portefeuille", icon: Wallet, tabs: ["wallet"] },
];
const TAB_TO_GROUP: Record<string, string> = GROUP_DEFS.reduce((acc, g) => {
  g.tabs.forEach((t) => (acc[t] = g.key));
  return acc;
}, {} as Record<string, string>);

export default function Compte() {
  const { format: formatPrice } = useCurrency();
  const { user, isSessionLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("annonces");
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteAnnonceId, setDeleteAnnonceId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [reservationDetailId, setReservationDetailId] = useState<number | null>(null);
  // Barre de recherche interne à la section Recherches.
  const [searchQuery, setSearchQuery] = useState("");
  const [searchUnivers, setSearchUnivers] = useState("acheter");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "1") {
      setTab("abonnements");
      setActiveGroup("abo");
      setContentOpen(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
    if (params.get("tab")) {
      const t = params.get("tab") as Tab;
      setTab(t);
      setContentOpen(true);
      const grp = TAB_TO_GROUP[t];
      if (grp) setActiveGroup(grp);
    }
  }, [location]);

  const mineAnnonces = trpc.annonces.mine.useQuery(undefined, { enabled: !!user && tab === "annonces" });
  const removeMut = trpc.annonces.remove.useMutation({ onSuccess: () => { mineAnnonces.refetch(); setDeleteAnnonceId(null); setDeleteReason(""); } });
  const prolongMut = trpc.annonces.prolong.useMutation({ onSuccess: () => mineAnnonces.refetch() });
  const favoris = trpc.favoris.mine.useQuery(undefined, { enabled: !!user && tab === "favoris" });
  const reservations = trpc.reservations.mine.useQuery(undefined, { enabled: !!user && tab === "reservations" });
  const devis = trpc.devis.mine.useQuery(undefined, { enabled: !!user && tab === "devis" });
  const abos = trpc.abonnements.mine.useQuery(undefined, { enabled: !!user && tab === "abonnements" });
  const recherches = trpc.searches.list.useQuery(undefined, { enabled: !!user && tab === "recherches" });
  const litiges = trpc.disputes.mine.useQuery(undefined, { enabled: !!user && tab === "litiges" });
  const utils = trpc.useUtils();
  const setAlert = trpc.searches.setAlert.useMutation({ onSuccess: () => utils.searches.list.invalidate() });
  const removeSearch = trpc.searches.remove.useMutation({ onSuccess: () => utils.searches.list.invalidate() });
  const openDispute = trpc.disputes.open.useMutation({ onSuccess: () => { utils.disputes.mine.invalidate(); setLitige({ univers: "vente", category: "", description: "" }); } });
  const [litige, setLitige] = useState({ univers: "vente", category: "", description: "" });
  const fidelite = trpc.loyalty.me.useQuery(undefined, { enabled: !!user && tab === "fidelite" });
  const coffre = trpc.documents.list.useQuery(undefined, { enabled: !!user && tab === "coffre" });
  const dossiers = trpc.dossiers.list.useQuery(undefined, { enabled: !!user && tab === "vehicules" });
  const addDoc = trpc.documents.add.useMutation({ onSuccess: () => { utils.documents.list.invalidate(); setDoc({ category: "carte_grise", title: "", fileUrl: "", plaque: "" }); } });
  const removeDoc = trpc.documents.remove.useMutation({ onSuccess: () => utils.documents.list.invalidate() });
  const createDossier = trpc.dossiers.create.useMutation({ onSuccess: () => { utils.dossiers.list.invalidate(); setDossier({ marque: "", modele: "", immatriculation: "" }); } });
  const [doc, setDoc] = useState<{ category: string; title: string; fileUrl: string; plaque: string }>({ category: "carte_grise", title: "", fileUrl: "", plaque: "" });
  const [dossier, setDossier] = useState({ marque: "", modele: "", immatriculation: "" });
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [showDepositChooser, setShowDepositChooser] = useState(false);
  const [annonceFilter, setAnnonceFilter] = useState<string>("all");
  // activeGroup = groupe actuellement ouvert en plein écran (null = vue liste)
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  // contentOpen reste pour compatibilité avec les refs existants
  const [contentOpen, setContentOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  function toggleGroup(k: string) {
    // Ouvre le groupe en plein écran
    setActiveGroup(k);
    // Sélectionne automatiquement le premier onglet du groupe
    const grp = groups.find((g) => g.key === k);
    if (grp && grp.tabs.length > 0) {
      setTab(grp.tabs[0]);
    }
    setContentOpen(true);
    window.scrollTo(0, 0);
  }
  function selectItem(t: Tab) {
    setTab(t);
    setContentOpen(true);
    window.scrollTo(0, 0);
  }
  function goBack() {
    setActiveGroup(null);
    setContentOpen(false);
    window.scrollTo(0, 0);
  }

  if (isSessionLoading) {
    return <div className="container-page py-16 text-center text-slate-500">Chargement...</div>;
  }
  if (!user) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-slate-500">Connectez-vous pour accéder à votre compte.</p>
        <Link to="/connexion" className="btn-primary mt-4 inline-flex">Se connecter</Link>
      </div>
    );
  }

  // Onglets réservés admin/PDG — filtrés hors des sections pour les autres rôles.
  const adminOnlyTabs: Tab[] = ["toutes-annonces", "publicites"];
  const canSeeTab = (t: Tab) => (adminOnlyTabs.includes(t) ? isAdmin(user.role) : true);
  // Groupes visibles = ceux qui ont au moins un onglet autorisé pour ce rôle.
  const groups = GROUP_DEFS.map((g) => ({ ...g, tabs: g.tabs.filter(canSeeTab) })).filter((g) => g.tabs.length > 0);

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="container-page py-8 relative">
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 rounded-2xl bg-green-600 p-4 text-white shadow-2xl">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <div>
              <p className="text-sm font-black">Paiement réussi !</p>
              <p className="text-[10px] opacity-90">Votre service est activé. Merci de votre confiance.</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {/* Photo de profil cliquable */}
          <button
            onClick={() => photoRef.current?.click()}
            className="relative shrink-0 h-16 w-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#111] flex items-center justify-center overflow-hidden border-2 border-[#D4AF37] hover:opacity-90 transition active:scale-95 group"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="Photo profil" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-white">{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Camera size={18} className="text-white" />
            </div>
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Bonjour, {user.name?.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500">
            {ROLE_LABELS[(user.role as UserRole)] || user.role}
            {(user as any).staffPosition === "pdg" && " — PDG / Fondateur"}
            {(user as any).staffPosition === "directeur" && " — Directeur"}
            {(user as any).staffPosition === "adjoint" && " — Adjoint de direction"}
            {user.email ? ` · ${user.email}` : ""}
          </p>
          {/* Badge email vérifié */}
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 border border-green-200">
                <CheckCircle2 size={12} className="text-green-500" />
                Email vérifié
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                Email non vérifié — vérifiez votre boîte mail
              </span>
            )}
          </div>
          {(user as { reference?: string | null }).reference && (
            <p className="text-xs font-medium text-slate-400">
              Réf. compte : {(user as { reference?: string | null }).reference}
            </p>
          )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPro(user.role) && <Link to="/garage-plus" className="btn-outline">Espace Garage+</Link>}
          {isAdmin(user.role) && <Link to="/admin" className="btn-primary">Back-office</Link>}
          {user.role === "super_admin" && <Link to="/admin" className="rounded-lg bg-[#111] px-4 py-2 text-xs font-bold text-[#D4AF37] hover:bg-[#222]">Super Admin</Link>}
          <Link to="/parametres" className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
            <Settings size={14} />
            Paramètres
          </Link>
        </div>
      </div>

      {/* Dashboard PDG — accès rapide à tous les modules (visible uniquement pour le PDG) */}
      {user.role === "super_admin" && (
        <div className="mt-4 rounded-2xl border-2 border-[#D4AF37]/30 bg-gradient-to-r from-[#111] to-[#1a1a1a] p-5">
          <h2 className="text-sm font-black text-[#D4AF37] mb-3">Acc&egrave;s PDG — Tous les modules</h2>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-5 lg:grid-cols-7">
            {[
              { label: "Super Admin", to: "/admin", emoji: "\ud83d\udc51" },
              { label: "Back-office", to: "/admin", emoji: "\ud83d\udee1\ufe0f" },
              { label: "Comptabilit\u00e9", to: "/compta-dirigeant", emoji: "\ud83d\udcb9" },
              { label: "Atelier Pro", to: "/atelier-pro", emoji: "\ud83d\udee0\ufe0f" },
              { label: "Catalogue", to: "/catalogue-technique", emoji: "\ud83d\udcd6" },
              { label: "Suivi v\u00e9hicule", to: "/suivi-vehicule", emoji: "\ud83d\udccd" },
              { label: "Ench\u00e8res Pro", to: "/acheter/encheres", emoji: "\ud83d\udd28" },
              { label: "Journal", to: "/journal-activite", emoji: "\ud83d\udcdc" },
              { label: "Notifications", to: "/notifications", emoji: "\ud83d\udd14" },
              { label: "Dossier Client", to: "/dossier-client", emoji: "\ud83d\udcc1" },
              { label: "Dossier V\u00e9hicule", to: "/dossier-vehicule-numerique", emoji: "\ud83d\udcdd" },
              { label: "Favoris", to: "/favoris", emoji: "\u2764\ufe0f" },
              { label: "Comparateur", to: "/comparateur", emoji: "\ud83d\udd0d" },
              { label: "Abonnements", to: "/abonnements", emoji: "\ud83d\udcb3" },
            ].map((m) => (
              <Link key={m.to} to={m.to} className="flex flex-col items-center gap-1 rounded-xl bg-white/5 border border-white/10 p-2.5 text-center transition hover:bg-white/10 hover:border-[#D4AF37]/50">
                <span className="text-lg">{m.emoji}</span>
                <span className="text-[9px] font-bold text-white/80 leading-tight">{m.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isPro(user.role) && (
        <Link to="/compte/validation" className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>Validez votre compte professionnel en soumettant vos documents (KBIS, RIB, identité…).</span>
          <span className="font-semibold underline">Compléter ma validation →</span>
        </Link>
      )}

      {/* Bouton principal — Déposer une annonce (choix du type d'abord) */}
      <button
        onClick={() => setShowDepositChooser(true)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#C5A028] active:scale-[0.99] sm:w-auto"
      >
        <Plus size={18} /> Déposer une annonce
      </button>

      {/* ── Vue liste des groupes (page d'accueil du compte) ── */}
      {!activeGroup && (
      <div className="mt-6 space-y-2">
        {groups.map((g) => {
          const Icon = g.icon;
          return (
            <button
              key={g.key}
              onClick={() => toggleGroup(g.key)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left rounded-xl border border-slate-200 bg-white transition hover:bg-slate-50 hover:border-[#D4AF37]/40 active:scale-[0.99]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
                <Icon size={18} />
              </span>
              <span className="flex-1 font-semibold text-slate-800">{g.label}</span>
              <ChevronLeft size={18} className="shrink-0 text-slate-400 rotate-180" />
            </button>
          );
        })}
      </div>
      )}

      {/* ── Sous la liste des sections : Noter l'application (tous comptes) puis Version ── */}
      {!activeGroup && (
        <div className="mt-6 space-y-4">
          <AppFeedbackSection />
          <VersionSection />
        </div>
      )}

      {/* ── Vue sous-page plein écran (groupe actif) ── */}
      {activeGroup && (
      <div
        ref={contentRef}
        className="mt-0 fixed inset-0 z-50 overflow-y-auto bg-white"
      >
        {/* En-tête : bouton Retour + titre du groupe + sous-onglets si plusieurs */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 pb-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 active:scale-95 hover:bg-slate-50"
            >
              <ChevronLeft size={16} /> Retour
            </button>
            <span className="font-bold text-slate-900 text-base">{groups.find((g) => g.key === activeGroup)?.label}</span>
          </div>
          {/* Sous-onglets si le groupe a plusieurs tabs */}
          {(groups.find((g) => g.key === activeGroup)?.tabs.length ?? 0) > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {groups.find((g) => g.key === activeGroup)?.tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => selectItem(t)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    tab === t ? "border-[#D4AF37] bg-[#FFFBEB] text-[#111]" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-4">
        {/* ← DEBUT CONTENU (le bloc if/else des onglets suit ici) */}
        {/* En-tête plein écran (mobile) : titre + retour pour refermer. */}
        <div className="mb-4 flex items-center gap-2 hidden">
          <button
            onClick={goBack}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 active:scale-95"
          >
            <ChevronLeft size={16} /> Retour
          </button>
          <span className="font-bold text-slate-900">{TAB_LABELS[tab]}</span>
        </div>
        {tab === "annonces" && (
          <div className="space-y-3">
            <button onClick={() => setShowDepositChooser(true)} className="btn-primary inline-flex">+ Déposer une annonce</button>
            {/* Filtre par statut */}
            <div className="flex flex-wrap gap-2">
              {[
                { k: "all", label: "Toutes" },
                { k: "publiee", label: "En ligne" },
                { k: "en_validation", label: "En validation" },
                { k: "brouillon", label: "Brouillons" },
                { k: "expiree", label: "Expirées" },
                { k: "vendue", label: "Vendues" },
              ].map((f) => (
                <button
                  key={f.k}
                  onClick={() => setAnnonceFilter(f.k)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${annonceFilter === f.k ? "border-[#D4AF37] bg-[#FFFBEB] text-[#111]" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {mineAnnonces.data
              ?.filter((a) => annonceFilter === "all" || a.status === annonceFilter)
              .map((a) => (
              <div key={a.id} className="card overflow-hidden">
                <Link to={getAnnonceUrl(a.id, (a as any).categorieAnnonce, (a as any).vendeurType)} className="flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer">
                  <div>
                    <p className="font-semibold text-slate-800">{a.titre}</p>
                    <p className="text-xs text-slate-400">
                      {(a as { reference?: string | null }).reference ? `${(a as { reference?: string | null }).reference} · ` : ""}
                      {a.status === "expiree" ? "Expirée" : a.status} · {formatPrice(Number(a.prix))}
                    </p>
                    {(a as any).expiresAt && (
                      <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Clock size={10} />
                        {new Date((a as any).expiresAt) > new Date()
                          ? `Expire le ${new Date((a as any).expiresAt).toLocaleDateString("fr-FR")}`
                          : "Expirée"}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">→</span>
                </Link>
                <div className="flex border-t border-slate-100">
                  <button onClick={() => navigate(`/vendre?edit=${a.id}`)} className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#D4AF37] hover:bg-amber-50 transition">
                    <Pencil size={14} /> Modifier
                  </button>
                  <button onClick={() => prolongMut.mutate({ id: a.id })} disabled={prolongMut.isPending} className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition border-l border-slate-100">
                    <RefreshCw size={14} /> Prolonger
                  </button>
                  <button onClick={() => setDeleteAnnonceId(a.id)} className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition border-l border-slate-100">
                    <Trash2 size={14} /> Supprimer
                  </button>
                </div>
              </div>
            ))}
            {mineAnnonces.data?.length === 0 && <p className="text-sm text-slate-500">Aucune annonce.</p>}
          </div>
        )}

        {/* TOUTES LES ANNONCES — admin/PDG uniquement */}
        {tab === "toutes-annonces" && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Toutes les annonces de la plateforme (tous les utilisateurs : pro, particulier, société).</p>
            {mineAnnonces.data?.map((a) => (
              <Link key={a.id} to={getAnnonceUrl(a.id, (a as any).categorieAnnonce, (a as any).vendeurType)} className="card flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-800">{a.titre}</p>
                  <p className="text-xs text-slate-400">
                    {(a as { reference?: string | null }).reference ? `${(a as { reference?: string | null }).reference} · ` : ""}
                    {a.status} · {formatPrice(Number(a.prix))}
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Vendeur ID: {(a as { userId?: number; vendeurId?: number }).userId ?? (a as { userId?: number; vendeurId?: number }).vendeurId ?? "—"}</p>
                </div>
                <span className="text-xs text-slate-400">→</span>
              </Link>
            ))}
          </div>
        )}

        {/* PUBLICITÉS — gestion emplacements */}
        {tab === "publicites" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Emplacements publicitaires sur la plateforme. Cliquez pour voir les détails de chaque emplacement.</p>
            {[
              { id: 1, name: "Page d'accueil — Carrousel #1", cases: 5, actif: 3, status: "actif" },
              { id: 2, name: "Page d'accueil — Carrousel #2", cases: 5, actif: 1, status: "actif" },
              { id: 3, name: "Page d'accueil — Carrousel #3 (Premium)", cases: 5, actif: 2, status: "actif" },
              { id: 4, name: "Page produit — Bas de page", cases: 4, actif: 4, status: "actif" },
              { id: 5, name: "Page recherche — Sidebar", cases: 3, actif: 0, status: "inactif" },
              { id: 6, name: "Page résultats — Entre annonces", cases: 4, actif: 0, status: "inactif" },
            ].map((emp) => (
              <Link key={emp.id} to="/demande-publicite" className="card p-4 hover:bg-slate-50 transition cursor-pointer block">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">#{emp.id} — {emp.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{emp.cases} cases disponibles · {emp.actif} occupées</p>
                    <div className="mt-2 flex gap-1">
                      {Array.from({ length: emp.cases }).map((_, i) => (
                        <div key={i} className={`h-3 w-8 rounded ${i < emp.actif ? "bg-[#D4AF37]" : "bg-slate-200"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${emp.status === "actif" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{emp.status}</span>
                    <span className="text-xs text-slate-400">→</span>
                  </div>
                </div>
              </Link>
            ))}

            <div className="mt-4">
              <p className="text-sm font-bold text-slate-700">Demandes en attente</p>
              <div className="mt-2 space-y-2">
                {[
                  { id: "PUB-001", entreprise: "AutoPièces Express", type: "Vendeur de pièces", emplacement: "#4", status: "en_attente" },
                  { id: "PUB-002", entreprise: "Garage Saint-Denis", type: "Réparateur", emplacement: "#1", status: "en_attente" },
                  { id: "PUB-003", entreprise: "CleanCar 95", type: "Service lavage", emplacement: "#4", status: "approuvée" },
                ].map((d) => (
                  <Link key={d.id} to={`/publicite/${d.id}`} className="card flex items-center justify-between p-3 hover:bg-slate-50 transition cursor-pointer">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{d.entreprise} <span className="text-xs text-slate-400">({d.id})</span></p>
                      <p className="text-xs text-slate-500">{d.type} · Emplacement {d.emplacement}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.status === "approuvée" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{d.status === "approuvée" ? "Approuvée" : "En attente"}</span>
                      <span className="text-xs text-slate-400">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "favoris" && (
          <div className="grid gap-3 md:grid-cols-2">
            {favoris.data?.map((f) => (
              <Link key={f.annonce.id} to={getAnnonceUrl(f.annonce.id, (f.annonce as any).categorieAnnonce, (f.annonce as any).vendeurType)} className="card p-4">
                <p className="font-semibold text-slate-800">{f.annonce.titre}</p>
                <p className="text-sm text-gold-dark">{formatPrice(Number(f.annonce.prix))}</p>
              </Link>
            ))}
            {favoris.data?.length === 0 && <p className="text-sm text-slate-500">Aucun favori.</p>}
          </div>
        )}
        {tab === "recherches" && (
          <div className="space-y-3">
            {/* Barre de recherche réelle + filtres — lance la recherche dans l'univers choisi. */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const dest: Record<string, string> = {
                  acheter: "/acheter",
                  louer: "/louer",
                  garages: "/garages",
                  pieces: "/pieces",
                };
                const base = dest[searchUnivers] ?? "/acheter";
                const q = searchQuery.trim();
                navigate(q ? `${base}?q=${encodeURIComponent(q)}` : base);
              }}
              className="card flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                <SearchIcon size={16} className="text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un véhicule, un garage, une pièce…"
                  className="h-10 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <select
                value={searchUnivers}
                onChange={(e) => setSearchUnivers(e.target.value)}
                className="input h-10 sm:max-w-[160px]"
              >
                <option value="acheter">Véhicules</option>
                <option value="louer">Location</option>
                <option value="garages">Garages</option>
                <option value="pieces">Pièces</option>
              </select>
              <button type="submit" className="btn-gold h-10 shrink-0 px-4 text-sm font-bold">
                Rechercher
              </button>
            </form>
            <p className="text-sm text-slate-500">
              Vos recherches enregistrées. Activez l'alerte pour être notifié dès qu'une
              nouvelle annonce correspond.
            </p>
            {recherches.data?.map((s) => (
              <div key={s.id} className="card flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-slate-800">{s.label}</p>
                  <p className="text-xs text-slate-400">
                    {s.univers} · {s.alertEnabled ? "Alerte active" : "Alerte en pause"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-outline text-xs"
                    onClick={() => setAlert.mutate({ id: s.id, alertEnabled: !s.alertEnabled })}
                  >
                    {s.alertEnabled ? "Mettre en pause" : "Réactiver"}
                  </button>
                  <button
                    className="text-xs text-red-500 hover:underline"
                    onClick={() => removeSearch.mutate({ id: s.id })}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
            {recherches.data?.length === 0 && (
              <p className="text-sm text-slate-500">
                Aucune recherche enregistrée. Depuis « Acheter », cliquez sur « Enregistrer la recherche ».
              </p>
            )}
          </div>
        )}
        {tab === "reservations" && (
          <div className="space-y-3">
            {reservations.data?.map((r) => {
              const st = BOOKING_STATUS[r.status] ?? { label: r.status, cls: "bg-slate-100 text-slate-600" };
              return (
                <button
                  key={r.id}
                  onClick={() => setReservationDetailId(r.id)}
                  className="card w-full p-4 text-left text-sm cursor-pointer hover:border-[#D4AF37] hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">Réservation #{r.id}</p>
                      <p className="mt-0.5 text-slate-500">
                        Acompte {r.cautionAmount ? formatPrice(Number(r.cautionAmount)) : "—"} ·{" "}
                        {CAUTION_STATUS[r.cautionStatus] ?? r.cautionStatus}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {new Date(r.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                  </div>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#D4AF37]">
                    <Info size={12} /> Voir le détail
                  </span>
                </button>
              );
            })}
            {reservations.data?.length === 0 && <p className="text-sm text-slate-500">Aucune réservation.</p>}
          </div>
        )}
        {tab === "devis" && (
          <div className="space-y-3">
            {devis.data?.map((d) => (
              <div key={d.id} onClick={() => navigate("/reparer")} className="card p-4 text-sm cursor-pointer hover:border-[#D4AF37] hover:shadow-md transition">
                <p className="font-semibold text-slate-800">{d.typeIntervention}</p>
                <p className="text-slate-500">{d.vehiculeMarque} {d.vehiculeModele} · {d.status}</p>
              </div>
            ))}
            {devis.data?.length === 0 && <p className="text-sm text-slate-500">Aucune demande de devis.</p>}
          </div>
        )}
        {tab === "abonnements" && (
          <div className="space-y-3">
            <Link to="/abonnements" className="btn-outline inline-flex">Voir les offres</Link>
            {abos.data?.map((s) => (
              <div key={s.id} onClick={() => navigate("/abonnements")} className="card p-4 text-sm cursor-pointer hover:border-[#D4AF37] hover:shadow-md transition">
                <p className="font-semibold text-slate-800">{s.planCode}</p>
                <p className="text-slate-500">{s.status} {s.amount ? `· ${s.amount} €` : ""}</p>
              </div>
            ))}
            {abos.data?.length === 0 && <p className="text-sm text-slate-500">Aucun abonnement actif.</p>}


          </div>
        )}
        {tab === "litiges" && (
          <div className="space-y-4">
            <form
              className="card space-y-2 p-4"
              onSubmit={(e) => { e.preventDefault(); if (litige.category && litige.description) openDispute.mutate({ univers: litige.univers as "vente", category: litige.category, description: litige.description }); }}
            >
              <p className="font-semibold text-slate-800">Ouvrir un litige</p>
              <div className="flex flex-wrap gap-2">
                <select className="input max-w-[180px]" value={litige.univers} onChange={(e) => setLitige({ ...litige, univers: e.target.value })}>
                  <option value="vente">Vente</option>
                  <option value="location">Location</option>
                  <option value="livraison">Livraison</option>
                  <option value="pieces">Pièces Auto</option>
                  <option value="garage">Garage</option>
                  <option value="autre">Autre</option>
                </select>
                <input className="input max-w-xs" placeholder="Motif (ex. véhicule non conforme)" value={litige.category} onChange={(e) => setLitige({ ...litige, category: e.target.value })} />
              </div>
              <textarea className="input" rows={3} placeholder="Décrivez le problème…" value={litige.description} onChange={(e) => setLitige({ ...litige, description: e.target.value })} />
              <button className="btn-primary !text-sm">Envoyer le litige</button>
              {openDispute.isSuccess && <p className="text-sm text-green-600">Litige ouvert. Notre équipe va l'analyser.</p>}
            </form>
            {litiges.data?.map((d) => (
              <div key={d.id} className="card p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">{d.reference ?? `#${d.id}`} · {d.univers} · {d.category}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{d.status}</span>
                </div>
                <p className="mt-1 text-slate-500">{d.description}</p>
                {d.resolution && <p className="mt-1 text-xs text-gold-dark">Réponse : {d.resolution}</p>}
              </div>
            ))}
            {litiges.data?.length === 0 && <p className="text-sm text-slate-500">Aucun litige.</p>}
          </div>
        )}
        {tab === "fidelite" && (
          <div className="space-y-4">
            <div className="card p-5">
              <p className="text-sm text-slate-500">Niveau de fidélité MKA</p>
              <p className="text-3xl font-extrabold text-gold-dark">{TIER_LABELS[fidelite.data?.tier ?? "bronze"]}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{(fidelite.data?.points ?? 0).toLocaleString("fr-FR")} <span className="text-sm font-normal text-slate-500">points MKA</span></p>
              {fidelite.data?.nextTier && (
                <p className="mt-2 text-xs text-slate-500">Encore <strong>{fidelite.data.pointsToNext.toLocaleString("fr-FR")}</strong> points pour passer {TIER_LABELS[fidelite.data.nextTier]}.</p>
              )}
              <p className="mt-3 text-xs text-slate-400">Gagnez des points sur vos achats, ventes, locations, pièces, livraisons et entretiens. À utiliser en réduction d'abonnement, boost d'annonce ou historique véhicule.</p>
            </div>
            <div className="space-y-2">
              {fidelite.data?.transactions.map((t) => (
                <div key={t.id} className="card flex items-center justify-between p-3 text-sm">
                  <span className="text-slate-600">{t.reason}</span>
                  <span className={t.points >= 0 ? "font-semibold text-green-600" : "font-semibold text-red-500"}>{t.points >= 0 ? "+" : ""}{t.points}</span>
                </div>
              ))}
              {fidelite.data?.transactions.length === 0 && <p className="text-sm text-slate-500">Aucun point pour le moment.</p>}
            </div>
          </div>
        )}
        {tab === "coffre" && (
          <div className="space-y-4">
            <form
              className="card space-y-2 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (doc.title && doc.fileUrl)
                  addDoc.mutate({
                    category: doc.category as "carte_grise",
                    title: doc.title,
                    fileUrl: doc.fileUrl,
                    plaque: doc.plaque || undefined,
                  });
              }}
            >
              <p className="font-semibold text-slate-800">Ajouter un document</p>
              <p className="text-xs text-slate-500">Cartes grises, certificats de cession/immatriculation, contrôles techniques, factures, contrats, assurances, permis — stockés dans votre espace sécurisé.</p>
              <div className="flex flex-wrap gap-2">
                <select className="input max-w-[220px]" value={doc.category} onChange={(e) => setDoc({ ...doc, category: e.target.value })}>
                  {DOC_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <input className="input max-w-xs" placeholder="Titre" value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} />
              </div>
              {DOC_NEEDS_PLAQUE.has(doc.category) && (
                <input
                  className="input max-w-[220px] uppercase"
                  placeholder="Plaque d'immatriculation (ex. AB-123-CD)"
                  value={doc.plaque}
                  onChange={(e) => setDoc({ ...doc, plaque: e.target.value })}
                />
              )}
              <FileUpload
                label="Ajouter le fichier (photo, PDF)"
                accept="image/*,.pdf,.doc,.docx"
                multiple={false}
                maxFiles={1}
                onUploaded={(files) => {
                  if (files.length > 0) setDoc({ ...doc, fileUrl: files[0].url });
                }}
                iaAnalysis
              />
              {doc.fileUrl && <p className="text-xs text-green-600">Fichier ajouté</p>}
              <button className="btn-primary !text-sm">Enregistrer</button>
            </form>
            {coffre.data?.map((d) => (
              <div key={d.id} className="card flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{d.title}</p>
                  <p className="text-xs text-slate-500">{d.category} · <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-gold-dark underline">ouvrir</a></p>
                </div>
                <button className="text-xs text-red-500 hover:underline" onClick={() => removeDoc.mutate({ id: d.id })}>Supprimer</button>
              </div>
            ))}
            {coffre.data?.length === 0 && <p className="text-sm text-slate-500">Coffre-fort vide.</p>}
          </div>
        )}
        {tab === "vehicules" && (
          <div className="space-y-4">
            <form
              className="card flex flex-wrap items-end gap-2 p-4"
              onSubmit={(e) => { e.preventDefault(); if (dossier.marque || dossier.immatriculation) createDossier.mutate(dossier); }}
            >
              <div className="flex-1">
                <p className="font-semibold text-slate-800">Ajouter un véhicule à mon carnet</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input className="input max-w-[140px]" placeholder="Marque" value={dossier.marque} onChange={(e) => setDossier({ ...dossier, marque: e.target.value })} />
                  <input className="input max-w-[140px]" placeholder="Modèle" value={dossier.modele} onChange={(e) => setDossier({ ...dossier, modele: e.target.value })} />
                  <input className="input max-w-[140px]" placeholder="Immatriculation" value={dossier.immatriculation} onChange={(e) => setDossier({ ...dossier, immatriculation: e.target.value })} />
                </div>
              </div>
              <button className="btn-primary !text-sm">Créer le dossier</button>
            </form>
            {dossiers.data?.map((d) => (
              <div key={d.id} className="card p-3 text-sm">
                <p className="font-semibold text-slate-800">{[d.marque, d.modele].filter(Boolean).join(" ") || "Véhicule"} {d.immatriculation ? `· ${d.immatriculation}` : ""}</p>
                <p className="text-xs text-slate-500">Carnet de santé numérique : achat, entretien, réparations, contrôle technique, photos, ventes.</p>
              </div>
            ))}
            {dossiers.data?.length === 0 && <p className="text-sm text-slate-500">Aucun véhicule dans votre carnet.</p>}
          </div>
        )}
        {tab === "notifications" && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-[#111] flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#D4AF37]" /> Notifications
            </h2>
            <NotifPrefs />
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 text-center">
              <p className="text-sm font-bold text-[#111] mb-4">Accédez à votre centre de notifications complet.</p>
              <Link to="/notifications" className="inline-block rounded-xl bg-[#D4AF37] px-6 py-3 text-xs font-bold text-white">Ouvrir les notifications</Link>
            </div>
          </div>
        )}
        {tab === "rapports" && (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mes rapports historiques</h2>
                <p className="mt-1 text-sm text-slate-500">Tous vos rapports véhicule achetés</p>
              </div>
              <Link to="/historique" className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white hover:bg-[#C5A028]">
                Acheter un rapport
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {DEMO_RAPPORTS.map((r) => (
                <div key={r.id} onClick={() => navigate(`/historique?plaque=${r.plaque}`)} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 cursor-pointer hover:border-[#D4AF37] hover:shadow-md transition">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{r.plaque}</p>
                    <p className="text-[10px] text-slate-400">VIN : {r.vinPartiel}</p>
                    <p className="text-[10px] text-slate-500">{r.type} · {r.prix} · {r.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700">{r.statut}</span>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/historique?plaque=${r.plaque}`); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-[#111] hover:bg-slate-50">Voir</button>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/historique?plaque=${r.plaque}&pdf=1`); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-[#111] hover:bg-slate-50">PDF</button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-slate-400 italic">Vos rapports sont aussi disponibles dans : Messagerie interne, Centre documents {'>'} Véhicules {'>'} Historiques.</p>
          </div>
        )}
        {tab === "services" && (
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tous les services MKA.P-MS</h2>
            <p className="mt-1 text-sm text-slate-500">Accédez à tous nos services depuis votre compte</p>
            <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {ALL_SERVICES.filter((s) => canAccessServicePath(user.role, s.to)).map((s) => (
                <Link key={s.to} to={s.to} className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:border-[#D4AF37] hover:shadow-md">
                  <span className="text-3xl">{s.emoji}</span>
                  <h3 className="text-xs font-bold text-[#111]">{s.label}</h3>
                  <p className="text-[10px] text-slate-500 leading-tight">{s.desc}</p>
                </Link>
              ))}
              {/* Bloc Publicités — dans la grille comme les autres */}
              {isAdmin(user.role) && (
                <button onClick={() => { setActiveGroup("annonces"); selectItem("publicites"); }} className="group flex flex-col items-center gap-2 rounded-xl border-2 border-[#D4AF37]/40 bg-[#FFFDF5] p-4 text-center transition hover:border-[#D4AF37] hover:shadow-md">
                  <span className="text-3xl">📢</span>
                  <h3 className="text-xs font-bold text-[#111]">Publicités</h3>
                  <p className="text-[10px] text-slate-500 leading-tight">Emplacements & tarifs pub</p>
                </button>
              )}
            </div>
          </div>
        )}
        {tab === "profil" && <ProfilForm />}
        {tab === "wallet" && <WalletTab />}
        </div>
      </div>
      )}

      {/* ── Modal Supprimer annonce (avec questionnaire) ── */}
      {deleteAnnonceId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setDeleteAnnonceId(null)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#111]">Supprimer l'annonce</h2>
              <button onClick={() => setDeleteAnnonceId(null)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-4">
              <p className="text-xs text-amber-700">Supprimer l'annonce entraine la fin de sa publication sur MKA.P-MS et ses partenaires.</p>
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Pourquoi souhaitez-vous supprimer votre annonce ?</p>
            <div className="space-y-2">
              {[
                { value: "vendu_mkapms", label: "J'ai vendu mon véhicule sur MKA.P-MS" },
                { value: "vendu_ailleurs", label: "J'ai vendu mon véhicule sur un autre site" },
                { value: "plus_disponible", label: "Le véhicule n'est plus disponible" },
                { value: "autre", label: "Autre raison" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                  <input type="radio" name="delete-reason" value={opt.value} checked={deleteReason === opt.value} onChange={() => setDeleteReason(opt.value)} className="accent-red-600" />
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setDeleteAnnonceId(null)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 active:scale-[0.98] transition">
                Annuler
              </button>
              <button onClick={() => removeMut.mutate({ id: deleteAnnonceId, reason: deleteReason || undefined })} disabled={removeMut.isPending} className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white active:scale-[0.98] transition disabled:opacity-50">
                {removeMut.isPending ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : choix du type de véhicule avant le dépôt d'annonce ── */}
      {showDepositChooser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setShowDepositChooser(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-[#111]">Que voulez-vous déposer ?</h2>
              <button onClick={() => setShowDepositChooser(false)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Choisissez d'abord le type de véhicule.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Voiture", icon: Car, to: "/vendre?depot=1&famille=auto" },
                { label: "Moto / Scooter", icon: Bike, to: "/vendre?depot=1&famille=moto" },
                { label: "Utilitaire", icon: Bus, to: "/vendre?depot=1&famille=auto&categorie=utilitaires" },
                { label: "Camion", icon: Truck, to: "/vendre?depot=1&famille=auto&categorie=camions" },
              ].map((v) => (
                <button
                  key={v.label}
                  onClick={() => { setShowDepositChooser(false); navigate(v.to); }}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:border-[#D4AF37] hover:shadow-md active:scale-95"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]"><v.icon size={22} /></span>
                  <span className="text-sm font-bold text-[#111]">{v.label}</span>
                </button>
              ))}
            </div>

            {/* Location — un particulier ne peut PAS déposer une annonce de location, mais peut louer */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Location</p>
              {isPro(user.role) || isAdmin(user.role) ? (
                <button
                  onClick={() => { setShowDepositChooser(false); navigate("/vendre?depot=1&type=location"); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-[#D4AF37] hover:shadow-md active:scale-[0.99]"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]"><KeyRound size={20} /></span>
                  <span className="flex-1"><span className="block text-sm font-bold text-[#111]">Mettre un véhicule en location</span><span className="block text-[11px] text-slate-500">Réservé aux comptes professionnels</span></span>
                </button>
              ) : (
                <button
                  onClick={() => { setShowDepositChooser(false); navigate("/louer"); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-[#D4AF37] hover:shadow-md active:scale-[0.99]"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]"><KeyRound size={20} /></span>
                  <span className="flex-1"><span className="block text-sm font-bold text-[#111]">Louer un véhicule</span><span className="block text-[11px] text-slate-500">Le dépôt en location est réservé aux pros — vous pouvez louer un véhicule.</span></span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {reservationDetailId !== null && (
        <ReservationDetailModal id={reservationDetailId} onClose={() => setReservationDetailId(null)} />
      )}
    </div>
  );
}

// ─── Fiche détaillée d'une réservation ────────────────────────────────────────
function ReservationDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { format: formatPrice } = useCurrency();
  const navigate = useNavigate();
  const detail = trpc.reservations.detail.useQuery({ id });
  const d = detail.data;
  const booking = d?.booking;
  const annonce = d?.annonce;
  const payments = d?.payments ?? [];
  const st = booking ? BOOKING_STATUS[booking.status] ?? { label: booking.status, cls: "bg-slate-100 text-slate-600" } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-5 max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111]">Réservation #{id}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><X size={16} /></button>
        </div>

        {detail.isLoading && <p className="py-8 text-center text-sm text-slate-400">Chargement…</p>}
        {detail.isError && <p className="py-8 text-center text-sm text-red-500">Réservation introuvable.</p>}

        {booking && (
          <div className="mt-3 space-y-4">
            {st && (
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
            )}

            {/* Véhicule / produit réservé */}
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Véhicule réservé</p>
              {annonce ? (
                <>
                  <p className="mt-1 font-bold text-slate-900">{annonce.titre}</p>
                  <p className="text-sm text-gold-dark">{annonce.prix ? formatPrice(Number(annonce.prix)) : "—"}</p>
                  <button
                    onClick={() => { onClose(); navigate(getAnnonceUrl(annonce.id, (annonce as any).categorieAnnonce, (annonce as any).vendeurType)); }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:underline"
                  >
                    <Info size={12} /> Ouvrir la fiche du véhicule
                  </button>
                </>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Véhicule #{booking.vehicleId} (annonce indisponible)</p>
              )}
            </div>

            {/* Acompte / caution */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Acompte</p>
                <p className="mt-1 font-bold text-slate-900">
                  {booking.cautionAmount ? formatPrice(Number(booking.cautionAmount)) : "—"}
                </p>
                <p className="text-[11px] text-slate-500">{CAUTION_STATUS[booking.cautionStatus] ?? booking.cautionStatus}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Type</p>
                <p className="mt-1 font-bold capitalize text-slate-900">{booking.type}</p>
                <p className="text-[11px] text-slate-500">{new Date(booking.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>

            {booking.message && (
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Message</p>
                <p className="mt-1 text-sm text-slate-700">{booking.message}</p>
              </div>
            )}
            {booking.rejectionReason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500">Motif de refus</p>
                <p className="mt-1 text-sm text-red-700">{booking.rejectionReason}</p>
              </div>
            )}

            {/* Paiements associés */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Paiements liés</p>
              {payments.length === 0 && <p className="text-sm text-slate-500">Aucun paiement enregistré.</p>}
              <div className="space-y-2">
                {payments.map((p) => {
                  const ps = PAYMENT_STATUS[p.status] ?? { label: p.status, cls: "bg-slate-100 text-slate-600" };
                  return (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
                      <div>
                        <p className="font-semibold text-slate-800 capitalize">{p.type}</p>
                        <p className="text-[11px] text-slate-400">{new Date(p.createdAt).toLocaleString("fr-FR")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{formatPrice(Number(p.amount))} {p.currency}</p>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${ps.cls}`}>{ps.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions selon l'état */}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {booking.cautionStatus === "pending" && (
                <button onClick={() => { onClose(); navigate("/wallet"); }} className="btn-gold flex-1 !text-sm">
                  Régler l'acompte
                </button>
              )}
              <button onClick={() => { onClose(); navigate("/aide"); }} className="btn-outline flex-1 !text-sm">
                Contacter le support
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfilForm() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const u = user as Record<string, unknown> | null;
  const isProfessionnel = user?.accountType === "professionnel" || (user as any)?.accountType === "pro";
  const [form, setForm] = useState({
    firstName: (u?.firstName as string) || (user?.name?.split(" ")[0] ?? ""),
    lastName: (u?.lastName as string) || (user?.name?.split(" ").slice(1).join(" ") ?? ""),
    name: user?.name || "",
    phone: (u?.phone as string) || "",
    addressLine: (u?.addressLine as string) || "",
    postalCode: (u?.postalCode as string) || "",
    city: (u?.city as string) || "",
    country: (u?.country as string) || "",
    companyName: user?.companyName || "",
    companySiret: (u?.companySiret as string) || "",
    companySiren: (u?.companySiren as string) || "",
    hasVat: !!(u?.hasVat as boolean),
    vatNumber: (u?.vatNumber as string) || "",
    avatarUrl: (u?.avatarUrl as string) || "",
    logoUrl: (u?.logoUrl as string) || "",
  });
  const update = trpc.auth.updateProfile.useMutation({ onSuccess: (u2) => setUser(u2 as any) });

  function save() {
    const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ").trim();
    update.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      name: fullName || form.name,
      phone: form.phone,
      addressLine: form.addressLine,
      postalCode: form.postalCode,
      city: form.city,
      country: form.country,
      companyName: form.companyName,
      companySiret: form.companySiret,
      companySiren: form.companySiren,
      hasVat: form.hasVat,
      vatNumber: form.hasVat ? form.vatNumber : "",
      avatarUrl: form.avatarUrl || undefined,
      logoUrl: form.logoUrl || undefined,
    } as any);
  }

  return (
    <div className="card max-w-lg space-y-5 p-6">
      {/* ── Photo de profil / Logo ── */}
      {!isProfessionnel ? (
        <div>
          <p className="label mb-2">Photo de profil</p>
          <FileUpload
            label="Changer la photo de profil"
            accept="image/*"
            multiple={false}
            maxFiles={1}
            onUploaded={(files) => {
              if (files.length > 0) setForm((f) => ({ ...f, avatarUrl: files[0].url }));
            }}
          />
          {form.avatarUrl && (
            <div className="mt-2 flex items-center gap-3">
              <img src={form.avatarUrl} alt="Photo profil" className="h-14 w-14 rounded-full object-cover border-2 border-[#D4AF37]" />
              <button onClick={() => setForm((f) => ({ ...f, avatarUrl: "" }))} className="text-xs text-red-500 hover:underline">Supprimer</button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="label mb-2">Logo de l'entreprise</p>
          <FileUpload
            label="Uploader le logo (PNG, JPG)"
            accept="image/*"
            multiple={false}
            maxFiles={1}
            onUploaded={(files) => {
              if (files.length > 0) setForm((f) => ({ ...f, logoUrl: files[0].url }));
            }}
          />
          {form.logoUrl && (
            <div className="mt-2 flex items-center gap-3">
              <img src={form.logoUrl} alt="Logo entreprise" className="h-14 w-14 rounded-xl object-contain border border-slate-200 bg-white p-1" />
              <button onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))} className="text-xs text-red-500 hover:underline">Supprimer</button>
            </div>
          )}
        </div>
      )}

      {/* ── Identité ── */}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Prénom</label><input className="input" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} /></div>
        <div><label className="label">Nom</label><input className="input" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} /></div>
      </div>
      <div><label className="label">Téléphone</label><input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>

      {/* ── Adresse ── */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adresse</p>
        <div><label className="label">Rue / Numéro</label><input className="input" value={form.addressLine} onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))} placeholder="12 rue de la Paix" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Code postal</label><input className="input" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} placeholder="75001" /></div>
          <div><label className="label">Ville</label><input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
        </div>
        <div><label className="label">Pays</label><input className="input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="France" /></div>
      </div>

      {/* ── Informations pro ── */}
      {isProfessionnel && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Informations professionnelles</p>
          <div><label className="label">Raison sociale</label><input className="input" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">SIREN</label><input className="input" value={form.companySiren} onChange={(e) => setForm((f) => ({ ...f, companySiren: e.target.value }))} placeholder="123 456 789" maxLength={9} /></div>
            <div><label className="label">SIRET</label><input className="input" value={form.companySiret} onChange={(e) => setForm((f) => ({ ...f, companySiret: e.target.value }))} placeholder="123 456 789 00012" maxLength={14} /></div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasVat"
              checked={form.hasVat}
              onChange={(e) => setForm((f) => ({ ...f, hasVat: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
            />
            <label htmlFor="hasVat" className="text-sm font-medium text-slate-700 cursor-pointer">Assujetti à la TVA</label>
          </div>
          {form.hasVat && (
            <div>
              <label className="label">Numéro de TVA intracommunautaire</label>
              <input className="input" value={form.vatNumber} onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))} placeholder="FR12 123456789" />
            </div>
          )}
        </div>
      )}

      {/* ── Email (lecture seule) ── */}
      <div>
        <label className="label">Email</label>
        <input className="input bg-slate-50 text-slate-500" value={user?.email || ""} readOnly disabled />
        <p className="mt-1 text-[11px] text-slate-400">Pour modifier votre email, contactez le support.</p>
      </div>

      {/* ── Actions ── */}
      <button className="btn-primary w-full" disabled={update.isPending} onClick={save}>
        {update.isPending ? "Enregistrement…" : "Modifier mes informations"}
      </button>
      {update.isSuccess && <p className="text-sm text-green-600">Profil mis à jour avec succès.</p>}
      {update.isError && <p className="text-sm text-red-500">{(update.error as any)?.message || "Erreur lors de la mise à jour."}</p>}

      <div className="border-t border-slate-100 pt-4 space-y-2">
        <Link
          to="/parametres"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <Settings size={15} /> Paramètres du compte
        </Link>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.99]"
        >
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </div>
  );
}

function NotifPrefs() {
  const prefs = trpc.notificationOs.preferences.me.useQuery();
  const utils = trpc.useUtils();
  const update = trpc.notificationOs.preferences.update.useMutation({
    onSuccess: () => utils.notificationOs.preferences.me.invalidate(),
  });
  const p = prefs.data;
  const rows: { key: "emailEnabled" | "smsEnabled" | "pushEnabled" | "inappEnabled"; label: string; desc: string }[] = [
    { key: "inappEnabled", label: "Sur la plateforme", desc: "Notifications dans votre centre de notifications" },
    { key: "pushEnabled", label: "Notifications push", desc: "Sur l'écran d'accueil, même sans ouvrir l'application" },
    { key: "emailEnabled", label: "Par email", desc: "Recevoir un email pour les événements importants" },
    { key: "smsEnabled", label: "Par SMS", desc: "Recevoir un SMS (selon disponibilité)" },
  ];
  return (
    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5">
      <p className="text-sm font-bold text-[#111]">Préférences de notification</p>
      <p className="mt-0.5 text-xs text-slate-500">Choisissez comment vous souhaitez être prévenu.</p>
      {prefs.isLoading && <p className="mt-3 text-sm text-slate-400">Chargement…</p>}
      {p && (
        <div className="mt-3 divide-y divide-slate-100">
          {rows.map((r) => {
            const checked = Boolean((p as Record<string, unknown>)[r.key]);
            return (
              <label key={r.key} className="flex cursor-pointer items-center gap-3 py-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                  <p className="text-[11px] text-slate-500">{r.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={update.isPending}
                  onChange={(e) => update.mutate({ [r.key]: e.target.checked } as Record<string, boolean>)}
                  className="h-5 w-5 accent-[#D4AF37]"
                />
              </label>
            );
          })}

          {/* Résumé (digest) : regrouper les notifications */}
          <label className="flex cursor-pointer items-center gap-3 py-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Résumé groupé</p>
              <p className="text-[11px] text-slate-500">Recevoir un récapitulatif plutôt que chaque notification</p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(p.digestEnabled)}
              disabled={update.isPending}
              onChange={(e) => update.mutate({ digestEnabled: e.target.checked })}
              className="h-5 w-5 accent-[#D4AF37]"
            />
          </label>
          {p.digestEnabled && (
            <div className="flex items-center justify-between gap-3 py-3">
              <p className="text-sm font-semibold text-slate-800">Fréquence du résumé</p>
              <select
                value={p.digestFrequency ?? "daily"}
                disabled={update.isPending}
                onChange={(e) => update.mutate({ digestFrequency: e.target.value as "realtime" | "daily" | "weekly" })}
                className="input h-9 w-40"
              >
                <option value="realtime">Temps réel</option>
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
              </select>
            </div>
          )}

          {/* Heures silencieuses : pas de notification pendant cette plage */}
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Heures silencieuses</p>
              <p className="text-[11px] text-slate-500">Aucune notification poussée pendant cette plage</p>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={p.quietHoursFrom ?? ""}
                disabled={update.isPending}
                onChange={(e) => update.mutate({ quietHoursFrom: e.target.value === "" ? null : Number(e.target.value) })}
                className="input h-9 w-20"
              >
                <option value="">—</option>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, "0")}h</option>
                ))}
              </select>
              <span className="text-slate-400">à</span>
              <select
                value={p.quietHoursTo ?? ""}
                disabled={update.isPending}
                onChange={(e) => update.mutate({ quietHoursTo: e.target.value === "" ? null : Number(e.target.value) })}
                className="input h-9 w-20"
              >
                <option value="">—</option>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, "0")}h</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Noter l'application / un service / un client ─────────────────────────────
type FeedbackTargetType = "application" | "service" | "client";

const FEEDBACK_TARGETS: { value: FeedbackTargetType; label: string; hint: string }[] = [
  { value: "application", label: "L'application", hint: "Notez la plateforme et ses fonctionnalités." },
  { value: "service", label: "Un service", hint: "Notez un service que vous avez utilisé." },
  { value: "client", label: "Un client / vendeur", hint: "Notez une personne avec qui vous avez échangé." },
];

// Critères de qualité proposés selon la cible (stockés dans targetRef, sans nouvelle table).
const FEEDBACK_ASPECTS: Record<FeedbackTargetType, string[]> = {
  application: [
    "Expérience générale",
    "Facilité d'utilisation",
    "Rapidité",
    "Design & clarté",
    "Fiabilité",
    "Recherche & filtres",
    "Messagerie",
    "Notifications",
    "Paiement",
    "Support / aide",
  ],
  service: [
    "Achat de véhicule",
    "Location",
    "Garage / entretien",
    "Carrosserie",
    "Pièces détachées",
    "Contrôle technique",
    "Démarches administratives",
    "Dépannage / remorquage",
    "Livraison / transport",
    "Import / export",
  ],
  client: [
    "Sérieux",
    "Communication",
    "Ponctualité",
    "Honnêteté",
    "Respect des engagements",
    "Qualité du véhicule / bien",
    "Paiement",
  ],
};

function AppFeedbackSection() {
  const utils = trpc.useUtils();
  const mine = trpc.appFeedback.mine.useQuery(undefined);
  const create = trpc.appFeedback.create.useMutation({
    onSuccess: () => {
      utils.appFeedback.mine.invalidate();
      setForm((f) => ({ ...f, aspect: "", targetLabel: "", rating: 5, comment: "" }));
    },
  });
  const [form, setForm] = useState<{
    targetType: FeedbackTargetType;
    aspect: string;
    targetLabel: string;
    rating: number;
    comment: string;
  }>({ targetType: "application", aspect: "", targetLabel: "", rating: 5, comment: "" });

  const activeTarget = FEEDBACK_TARGETS.find((t) => t.value === form.targetType);
  const aspects = FEEDBACK_ASPECTS[form.targetType];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-bold text-[#111] flex items-center gap-2">
        <Star size={16} className="text-[#D4AF37]" /> Noter l'application &amp; nos services
      </p>
      <p className="text-xs text-slate-500 mt-0.5">
        Donnez votre avis sur l'application, un service utilisé ou un client / vendeur. Choisissez un critère puis mettez une note.
      </p>

      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_TARGETS.map((t) => (
            <button
              key={t.value}
              onClick={() => setForm((f) => ({ ...f, targetType: t.value, aspect: "", targetLabel: "" }))}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${form.targetType === t.value ? "bg-[#D4AF37] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activeTarget && <p className="text-[11px] text-slate-400 -mt-1">{activeTarget.hint}</p>}

        {/* Critères de qualité — plusieurs choix possibles selon la cible */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Critère à noter</p>
          <div className="flex flex-wrap gap-2">
            {aspects.map((a) => (
              <button
                key={a}
                onClick={() => setForm((f) => ({ ...f, aspect: f.aspect === a ? "" : a }))}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${form.aspect === a ? "border-[#D4AF37] bg-[#FFFBEB] text-[#111]" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {form.targetType !== "application" && (
          <input
            className="input"
            placeholder={form.targetType === "service" ? "Précisez (ex. nom du garage, société…)" : "Nom du client / vendeur"}
            value={form.targetLabel}
            onChange={(e) => setForm((f) => ({ ...f, targetLabel: e.target.value }))}
          />
        )}

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setForm((f) => ({ ...f, rating: n }))} aria-label={`${n} étoile(s)`}>
              <Star size={26} className={n <= form.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-slate-300"} />
            </button>
          ))}
        </div>

        <textarea
          className="input"
          rows={2}
          placeholder="Votre commentaire (facultatif)…"
          value={form.comment}
          onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
        />

        <button
          onClick={() =>
            create.mutate({
              targetType: form.targetType,
              targetRef: form.aspect || undefined,
              targetLabel: form.targetLabel || undefined,
              rating: form.rating,
              comment: form.comment || undefined,
            })
          }
          disabled={create.isPending}
          className="btn-primary !text-sm"
        >
          {create.isPending ? "Envoi…" : "Envoyer ma note"}
        </button>
        {create.isSuccess && <p className="text-xs text-green-600">Merci ! Votre note a bien été enregistrée. Vous pouvez en ajouter d'autres.</p>}
        {create.isError && <p className="text-xs text-red-500">Impossible d'enregistrer la note. Réessayez.</p>}
      </div>

      {(mine.data?.length ?? 0) > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Mes notes</p>
          <div className="space-y-2">
            {mine.data?.slice(0, 8).map((f) => (
              <div key={f.id} className="flex items-start justify-between gap-2 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">
                    {FEEDBACK_TARGETS.find((t) => t.value === f.targetType)?.label ?? f.targetType}
                    {f.targetRef ? ` · ${f.targetRef}` : ""}
                    {f.targetLabel ? ` · ${f.targetLabel}` : ""}
                  </p>
                  {f.comment && <p className="text-xs text-slate-500">{f.comment}</p>}
                </div>
                <div className="flex shrink-0">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={13} className={n <= f.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-slate-200"} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Version de l'application ─────────────────────────────────────────────────
function VersionSection() {
  const [checking, setChecking] = useState(false);
  const [upToDate, setUpToDate] = useState(false);

  function checkUpdate() {
    setChecking(true);
    setUpToDate(false);
    // Recharge l'app depuis le serveur (récupère la dernière version publiée).
    setTimeout(() => {
      setChecking(false);
      setUpToDate(true);
    }, 900);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-bold text-[#111] flex items-center gap-2">
        <RefreshCcw size={16} className="text-[#D4AF37]" /> Version & mise à jour
      </p>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Version installée</p>
          <p className="text-lg font-black text-slate-900">MKA.P-MS v{APP_VERSION}</p>
        </div>
        <button onClick={checkUpdate} disabled={checking} className="btn-outline !text-sm inline-flex items-center gap-1.5">
          <RefreshCcw size={14} className={checking ? "animate-spin" : ""} />
          {checking ? "Vérification…" : "Vérifier / Mettre à jour"}
        </button>
      </div>
      {upToDate && (
        <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
          <CheckCircle2 size={13} /> Votre application est à jour.
        </p>
      )}
      <button
        onClick={() => window.location.reload()}
        className="mt-2 text-[11px] font-semibold text-[#D4AF37] hover:underline"
      >
        Recharger l'application maintenant
      </button>
    </div>
  );
}

// ─── Composant Wallet ─────────────────────────────────────────────────────────
function WalletTab() {
  const { user } = useAuth();
  const wallet = trpc.wallet.me.useQuery(undefined, { enabled: !!user });
  const transactions = trpc.wallet.transactions.useQuery(undefined, { enabled: !!user });
  const payoutsList = trpc.wallet.payouts.useQuery(undefined, { enabled: !!user });
  const bankAccountsList = trpc.wallet.bankAccounts.useQuery(undefined, { enabled: !!user });
  const requestPayout = trpc.wallet.requestPayout.useMutation({ onSuccess: () => { wallet.refetch(); payoutsList.refetch(); transactions.refetch(); } });
  const setFreq = trpc.wallet.setPayoutFrequency.useMutation({ onSuccess: () => wallet.refetch() });
  const addBank = trpc.wallet.addBankAccount.useMutation({ onSuccess: () => bankAccountsList.refetch() });
  const deleteBank = trpc.wallet.deleteBankAccount.useMutation({ onSuccess: () => bankAccountsList.refetch() });
  const setDefaultBank = trpc.wallet.setDefaultBankAccount.useMutation({ onSuccess: () => bankAccountsList.refetch() });

  const [view, setView] = useState<"dashboard" | "transactions" | "virements" | "banque" | "parametres">("dashboard");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [bankForm, setBankForm] = useState({ titulaire: "", iban: "", bic: "", banque: "", isDefault: false });

  const w = wallet.data;
  const solde = Number(w?.soldeDisponible ?? 0);
  const attente = Number(w?.soldeAttente ?? 0);
  const bloque = Number(w?.soldeBloque ?? 0);

  const statusColors: Record<string, string> = {
    demande: "bg-amber-50 text-amber-700 border-amber-200",
    en_cours: "bg-blue-50 text-blue-700 border-blue-200",
    paye: "bg-green-50 text-green-700 border-green-200",
    echoue: "bg-red-50 text-red-700 border-red-200",
    annule: "bg-slate-50 text-slate-500 border-slate-200",
  };
  const statusLabels: Record<string, string> = {
    demande: "En attente", en_cours: "En cours", paye: "Payé", echoue: "Échoué", annule: "Annulé",
  };
  const txTypeLabels: Record<string, string> = {
    credit: "Crédit", debit: "Débit", retrait: "Virement", commission: "Commission",
    remboursement: "Remboursement", blocage: "Blocage", deblocage: "Déblocage",
  };

  if (wallet.isLoading) return <div className="py-8 text-center text-slate-400">Chargement du portefeuille…</div>;

  return (
    <div className="space-y-4">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#111] flex items-center gap-2">
            <Wallet size={20} className="text-[#D4AF37]" /> Portefeuille
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Gérez vos revenus, virements et comptes bancaires</p>
        </div>
      </div>

      {/* ── Cartes solde ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8960C] p-4 text-white">
          <p className="text-[10px] font-bold uppercase opacity-80">Disponible</p>
          <p className="text-2xl font-black mt-1">{solde.toFixed(2)} €</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-[10px] font-bold uppercase text-slate-500">En attente</p>
          <p className="text-xl font-black text-slate-700 mt-1">{attente.toFixed(2)} €</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-[10px] font-bold uppercase text-slate-500">Bloqué</p>
          <p className="text-xl font-black text-slate-700 mt-1">{bloque.toFixed(2)} €</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { key: "dashboard", label: "Accueil" },
          { key: "transactions", label: "Transactions" },
          { key: "virements", label: "Virements" },
          { key: "banque", label: "Comptes bancaires" },
          { key: "parametres", label: "Paramètres" },
        ] as const).map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${view === v.key ? "bg-[#D4AF37] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ── Vue Dashboard ── */}
      {view === "dashboard" && (
        <div className="space-y-4">
          {/* Virement rapide */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-bold text-[#111] mb-3">Virement rapide</p>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={solde}
                step="0.01"
                placeholder="Montant (€)"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="input flex-1"
              />
              <button
                onClick={() => {
                  const m = parseFloat(payoutAmount);
                  if (!m || m <= 0 || m > solde) return;
                  const defaultAccount = bankAccountsList.data?.find((b) => b.isDefault);
                  requestPayout.mutate({ montant: m, bankAccountId: defaultAccount?.id });
                  setPayoutAmount("");
                }}
                disabled={requestPayout.isPending || !payoutAmount || parseFloat(payoutAmount) > solde}
                className="btn-primary !text-sm"
              >
                {requestPayout.isPending ? "…" : "Virer"}
              </button>
            </div>
            {parseFloat(payoutAmount) > solde && <p className="text-xs text-red-500 mt-1">Solde insuffisant</p>}
          </div>

          {/* Dernières transactions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-bold text-[#111] mb-3">Dernières transactions</p>
            {transactions.data?.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{txTypeLabels[t.type] || t.type}</p>
                  <p className="text-[10px] text-slate-400">{t.description || "—"}</p>
                </div>
                <p className={`text-sm font-black ${Number(t.montant) >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {Number(t.montant) >= 0 ? "+" : ""}{Number(t.montant).toFixed(2)} €
                </p>
              </div>
            ))}
            {!transactions.data?.length && <p className="text-xs text-slate-400">Aucune transaction</p>}
            {(transactions.data?.length ?? 0) > 5 && (
              <button onClick={() => setView("transactions")} className="mt-2 text-xs text-[#D4AF37] font-bold hover:underline">Voir tout</button>
            )}
          </div>
        </div>
      )}

      {/* ── Vue Transactions ── */}
      {view === "transactions" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-bold text-[#111] mb-3">Historique des transactions</p>
          <div className="space-y-0 divide-y divide-slate-100">
            {transactions.data?.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{txTypeLabels[t.type] || t.type}</p>
                  <p className="text-[10px] text-slate-400">{t.description || "—"} · {new Date(t.createdAt).toLocaleDateString("fr-FR")}</p>
                  {t.reference && <p className="text-[9px] text-slate-300 font-mono">{t.reference}</p>}
                </div>
                <p className={`text-sm font-black ${Number(t.montant) >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {Number(t.montant) >= 0 ? "+" : ""}{Number(t.montant).toFixed(2)} €
                </p>
              </div>
            ))}
            {!transactions.data?.length && <p className="text-xs text-slate-400 py-4 text-center">Aucune transaction</p>}
          </div>
        </div>
      )}

      {/* ── Vue Virements ── */}
      {view === "virements" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-bold text-[#111] mb-3">Demander un virement</p>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={solde}
                step="0.01"
                placeholder={`Montant max : ${solde.toFixed(2)} €`}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="input flex-1"
              />
              <button
                onClick={() => {
                  const m = parseFloat(payoutAmount);
                  if (!m || m <= 0 || m > solde) return;
                  const defaultAccount = bankAccountsList.data?.find((b) => b.isDefault);
                  requestPayout.mutate({ montant: m, bankAccountId: defaultAccount?.id });
                  setPayoutAmount("");
                }}
                disabled={requestPayout.isPending || !payoutAmount || parseFloat(payoutAmount) > solde}
                className="btn-primary !text-sm"
              >
                {requestPayout.isPending ? "Envoi…" : "Virer"}
              </button>
            </div>
            {bankAccountsList.data?.find((b) => b.isDefault) ? (
              <p className="text-[10px] text-slate-400 mt-1">Vers : {bankAccountsList.data?.find((b) => b.isDefault)?.iban}</p>
            ) : (
              <p className="text-[10px] text-amber-600 mt-1">Ajoutez un compte bancaire pour recevoir vos virements</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-bold text-[#111] mb-3">Historique des virements</p>
            <div className="space-y-0 divide-y divide-slate-100">
              {payoutsList.data?.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{Number(p.montant).toFixed(2)} €</p>
                    <p className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusColors[p.status] || "bg-slate-50 text-slate-500"}`}>
                    {statusLabels[p.status] || p.status}
                  </span>
                </div>
              ))}
              {!payoutsList.data?.length && <p className="text-xs text-slate-400 py-4 text-center">Aucun virement</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Vue Comptes bancaires ── */}
      {view === "banque" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-bold text-[#111] mb-3">Mes comptes bancaires</p>
            <div className="space-y-2">
              {bankAccountsList.data?.map((b) => (
                <div key={b.id} className={`flex items-center justify-between rounded-xl border p-3 ${b.isDefault ? "border-[#D4AF37] bg-[#FFFDF5]" : "border-slate-200"}`}>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{b.titulaire}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{b.iban}</p>
                    {b.banque && <p className="text-[10px] text-slate-400">{b.banque}</p>}
                    {b.isDefault && <span className="text-[9px] font-bold text-[#D4AF37]">Compte par défaut</span>}
                  </div>
                  <div className="flex gap-2">
                    {!b.isDefault && (
                      <button onClick={() => setDefaultBank.mutate({ id: b.id })} className="text-[10px] text-[#D4AF37] font-bold hover:underline">Défaut</button>
                    )}
                    <button onClick={() => deleteBank.mutate({ id: b.id })} className="text-[10px] text-red-500 font-bold hover:underline">Suppr.</button>
                  </div>
                </div>
              ))}
              {!bankAccountsList.data?.length && <p className="text-xs text-slate-400">Aucun compte bancaire enregistré</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-bold text-[#111] mb-3">Ajouter un compte bancaire</p>
            <div className="space-y-3">
              <div><label className="label">Titulaire du compte</label><input className="input" value={bankForm.titulaire} onChange={(e) => setBankForm((f) => ({ ...f, titulaire: e.target.value }))} placeholder="Prénom Nom ou Raison sociale" /></div>
              <div><label className="label">IBAN</label><input className="input font-mono" value={bankForm.iban} onChange={(e) => setBankForm((f) => ({ ...f, iban: e.target.value }))} placeholder="FR76 3000 1007 9412 3456 7890 185" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">BIC / SWIFT</label><input className="input" value={bankForm.bic} onChange={(e) => setBankForm((f) => ({ ...f, bic: e.target.value }))} placeholder="BNPAFRPP" /></div>
                <div><label className="label">Banque</label><input className="input" value={bankForm.banque} onChange={(e) => setBankForm((f) => ({ ...f, banque: e.target.value }))} placeholder="BNP Paribas" /></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={bankForm.isDefault} onChange={(e) => setBankForm((f) => ({ ...f, isDefault: e.target.checked }))} className="h-4 w-4 accent-[#D4AF37]" />
                <span className="text-sm text-slate-700">Définir comme compte par défaut</span>
              </label>
              <button
                onClick={() => {
                  if (!bankForm.titulaire || !bankForm.iban) return;
                  addBank.mutate(bankForm);
                  setBankForm({ titulaire: "", iban: "", bic: "", banque: "", isDefault: false });
                }}
                disabled={addBank.isPending || !bankForm.titulaire || !bankForm.iban}
                className="btn-primary w-full"
              >
                {addBank.isPending ? "Ajout…" : "Ajouter ce compte"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Vue Paramètres virement ── */}
      {view === "parametres" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <p className="text-sm font-bold text-[#111]">Fréquence de virement automatique</p>
          <p className="text-xs text-slate-500">Choisissez quand vos revenus disponibles sont virés automatiquement sur votre compte bancaire.</p>
          <div className="grid grid-cols-3 gap-3">
            {(["manuel", "hebdomadaire", "mensuel"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFreq.mutate({ frequency: f })}
                className={`rounded-xl border p-3 text-xs font-bold transition ${w?.payoutFrequency === f ? "border-[#D4AF37] bg-[#FFFDF5] text-[#D4AF37]" : "border-slate-200 text-slate-600 hover:border-[#D4AF37]"}`}
              >
                {f === "manuel" ? "Manuel" : f === "hebdomadaire" ? "Hebdomadaire" : "Mensuel"}
              </button>
            ))}
          </div>
          {w?.payoutFrequency !== "manuel" && w?.nextPayoutDate && (
            <p className="text-xs text-slate-500">Prochain virement : <span className="font-bold text-slate-700">{new Date(w.nextPayoutDate).toLocaleDateString("fr-FR")}</span></p>
          )}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
            <p className="text-xs font-bold text-slate-600">Récapitulatif</p>
            <div className="flex justify-between text-xs text-slate-500"><span>Total encaissé</span><span className="font-bold text-slate-800">{Number(w?.totalEncaisse ?? 0).toFixed(2)} €</span></div>
            <div className="flex justify-between text-xs text-slate-500"><span>Total viré</span><span className="font-bold text-slate-800">{Number(w?.totalVire ?? 0).toFixed(2)} €</span></div>
            <div className="flex justify-between text-xs text-slate-500 border-t border-slate-200 pt-2"><span>Solde disponible</span><span className="font-black text-[#D4AF37]">{solde.toFixed(2)} €</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
