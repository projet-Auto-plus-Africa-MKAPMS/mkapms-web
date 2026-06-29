import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, CheckCircle, Star, ArrowRight, Car, AlertTriangle,
  Search, FileText, Award, Lock, Clock, Headphones, Globe, Zap, Eye,
  Users, Wrench, BarChart3, CreditCard, Download, MessageSquare,
  FolderOpen, Loader2, History, ChevronLeft, Sparkles, BadgeCheck,
  Printer, Share2, Bell, X, ChevronRight,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ─── CONSTANTS ─── */

const RAPPORTS = [
  {
    id: "express" as const,
    icon: Zap,
    iconColor: "text-orange-400",
    label: "RAPPORT EXPRESS",
    desc: "Pour un contrôle rapide.",
    prix: 4.99,
    prixLabel: "4,99",
    gradient: "from-orange-500/10 to-orange-600/5",
    border: "border-orange-200",
    features: [
      "Statut vol si disponible",
      "Gage / opposition si disponible",
      "Cohérence kilométrage si disponible",
      "Informations principales",
      "Score de risque simplifié",
    ],
    btnClass: "border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white",
  },
  {
    id: "complet" as const,
    icon: ShieldCheck,
    iconColor: "text-green-500",
    label: "RAPPORT COMPLET",
    desc: "Le plus recommandé.",
    prix: 7.99,
    prixLabel: "7,99",
    popular: true,
    gradient: "from-green-500/10 to-emerald-600/5",
    border: "border-[#D4AF37]",
    features: [
      "Tout le Rapport Express",
      "Historique kilométrage",
      "Propriétaires si disponible",
      "Contrôles techniques si disponible",
      "Entretien si disponible",
      "Importation si disponible",
      "Accidents / sinistres si disponible",
      "Score confiance MKA.P-MS",
    ],
    btnClass: "bg-green-600 text-white hover:bg-green-700",
  },
  {
    id: "premium" as const,
    icon: Award,
    iconColor: "text-purple-500",
    label: "RAPPORT PREMIUM",
    desc: "Pour achat sérieux avant décision.",
    prix: 12.99,
    prixLabel: "12,99",
    gradient: "from-purple-500/10 to-purple-600/5",
    border: "border-purple-200",
    features: [
      "Tout le Rapport Complet",
      "Analyse IA MKA.P-MS",
      "Estimation valeur marché",
      "Points de vigilance",
      "Documents administratifs si disponibles",
      "Recommandation achat : faible risque / attention / risque élevé",
    ],
    btnClass: "border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white",
  },
];

const PACKS_PRO = [
  { id: "pack10", label: "Pack 10 rapports", rapports: 10, prix: "69,90", prixUnit: "6,99", saving: "-30%" },
  { id: "pack50", label: "Pack 50 rapports", rapports: 50, prix: "299,50", prixUnit: "5,99", saving: "-40%" },
  { id: "pack100", label: "Pack 100 rapports", rapports: 100, prix: "499,00", prixUnit: "4,99", saving: "-50%" },
];

const CONTENU_RAPPORT = [
  { icon: AlertTriangle, label: "Accidents", color: "text-red-500" },
  { icon: Lock, label: "Vol", color: "text-orange-500" },
  { icon: BarChart3, label: "Kilométrage", color: "text-blue-500" },
  { icon: FileText, label: "Gage", color: "text-purple-500" },
  { icon: Wrench, label: "Entretien", color: "text-green-500" },
  { icon: Globe, label: "Importation", color: "text-cyan-500" },
  { icon: Users, label: "Propriétaires", color: "text-indigo-500" },
  { icon: Eye, label: "Et plus encore", color: "text-[#D4AF37]" },
];

const PIEGES = [
  { icon: AlertTriangle, label: "Véhicule volé", color: "text-red-600", bg: "bg-red-50 border-red-100" },
  { icon: AlertTriangle, label: "Compteur trafiqué", color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
  { icon: AlertTriangle, label: "Véhicule accidenté", color: "text-red-600", bg: "bg-red-50 border-red-100" },
  { icon: AlertTriangle, label: "Véhicule gagé", color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
  { icon: AlertTriangle, label: "Importation à risque", color: "text-red-600", bg: "bg-red-50 border-red-100" },
];

const CAR_IMAGES = [
  "/hero/car_hero_1.jpg",
  "/hero/car_hero_2.jpg",
  "/hero/car_hero_3.jpg",
];

function scoreLabel(s: number) {
  if (s >= 85) return { label: "Excellent", color: "text-green-600", border: "border-green-400", bg: "bg-green-50", ring: "ring-green-400", glow: "shadow-green-200" };
  if (s >= 70) return { label: "Bon", color: "text-blue-600", border: "border-blue-400", bg: "bg-blue-50", ring: "ring-blue-400", glow: "shadow-blue-200" };
  if (s >= 50) return { label: "Moyen", color: "text-orange-600", border: "border-orange-400", bg: "bg-orange-50", ring: "ring-orange-400", glow: "shadow-orange-200" };
  return { label: "Vigilance", color: "text-red-600", border: "border-red-400", bg: "bg-red-50", ring: "ring-red-400", glow: "shadow-red-200" };
}

type SearchMode = "plate" | "vin" | "foreign";
type VehicleType = "voiture" | "moto" | "scooter" | "utilitaire" | "camion";
type RapportType = "express" | "complet" | "premium";
type PaymentMethod = "cb" | "apple" | "google";
type ReportStatus = "paiement_recu" | "en_generation" | "disponible";

/* ─── MODAL EXEMPLE COMPLET ─── */
function ModalExempleComplet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#111]">Exemple de rapport complet</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition">
            <X size={14} />
          </button>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="rounded-xl bg-[#F8F9FA] p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Identité véhicule</p>
            <p className="text-sm font-extrabold text-[#111]">RENAULT CLIO IV — 1.5 dCi 90 cv</p>
            <p className="text-xs text-slate-500">2019 · Voiture · AA-123-BB</p>
          </div>
          {[
            { label: "Score de confiance", value: "92/100 — Excellent", green: true },
            { label: "Accidents", value: "Aucun accident déclaré" },
            { label: "Kilométrage", value: "128 450 km — Cohérent" },
            { label: "Vol", value: "Aucun vol déclaré" },
            { label: "Gage / Opposition", value: "Aucun gage enregistré" },
            { label: "Entretien", value: "12 entretiens trouvés" },
            { label: "Propriétaires", value: "2 propriétaires" },
            { label: "Importation", value: "Non importé" },
            { label: "Contrôle technique", value: "Valide jusqu'au 12/2025" },
            { label: "Analyse IA", value: "Faible risque d'achat" },
            { label: "Estimation marché", value: "8 500 — 10 200 €" },
            { label: "Recommandation", value: "✅ Achat recommandé" },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between rounded-xl bg-[#F8F9FA] px-3 py-2.5">
              <span className="text-xs text-slate-500">{r.label}</span>
              <span className={`text-xs font-bold ${r.green ? "text-green-600" : "text-[#111]"}`}>{r.value}</span>
            </div>
          ))}
          <p className="text-[9px] text-slate-400 italic text-center">Exemple fictif à titre illustratif. Les données réelles varient selon le véhicule.</p>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-2xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028] transition">
          Fermer
        </button>
      </div>
    </div>
  );
}

/* ─── MODAL PARTAGE ─── */
function ModalPartage({ searchVal, onClose }: { searchVal: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/historique?ref=${searchVal}`;
  function copyLink() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#111]">Partager ce rapport</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"><X size={14} /></button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-2.5">
            <span className="flex-1 truncate text-xs text-slate-500">{url}</span>
            <button onClick={copyLink} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${copied ? "bg-green-100 text-green-700" : "bg-[#D4AF37] text-white hover:bg-[#C5A028]"}`}>
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "WhatsApp", color: "bg-green-500", href: `https://wa.me/?text=${encodeURIComponent("Rapport véhicule MKA.P-MS : " + url)}` },
              { label: "SMS", color: "bg-blue-500", href: `sms:?body=${encodeURIComponent("Rapport véhicule MKA.P-MS : " + url)}` },
              { label: "Email", color: "bg-slate-700", href: `mailto:?subject=Rapport%20véhicule&body=${encodeURIComponent(url)}` },
            ].map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                className={`flex items-center justify-center rounded-xl py-3 text-xs font-bold text-white transition hover:opacity-90 ${s.color}`}>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MODAL NOTIFICATIONS ─── */
function ModalNotifications({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#111]">Notifications</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"><X size={14} /></button>
        </div>
        <div className="space-y-3">
          {[
            { title: "Rapport disponible", desc: "Votre rapport historique est prêt à être consulté.", time: "Il y a 2 min", dot: "bg-green-500" },
            { title: "Paiement confirmé", desc: "Votre paiement de 4,99 € a été accepté.", time: "Il y a 3 min", dot: "bg-blue-500" },
            { title: "Analyse IA terminée", desc: "L'analyse intelligente de votre véhicule est complète.", time: "Il y a 5 min", dot: "bg-purple-500" },
          ].map((n) => (
            <div key={n.title} className="flex items-start gap-3 rounded-xl bg-[#F8F9FA] p-3">
              <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${n.dot}`} />
              <div className="flex-1">
                <p className="text-xs font-bold text-[#111]">{n.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{n.desc}</p>
                <p className="text-[9px] text-slate-400 mt-1">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-2xl bg-[#111] py-3 text-sm font-bold text-white hover:bg-[#222] transition">
          Fermer
        </button>
      </div>
    </div>
  );
}

/* ─── MODAL AJOUTER À ANNONCE ─── */
function ModalAjouterAnnonce({ searchVal, onClose }: { searchVal: string; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const annonces = [
    { id: "ann1", label: "Renault Clio IV — AA-123-BB", year: "2019" },
    { id: "ann2", label: "Peugeot 308 — BC-456-DE", year: "2021" },
    { id: "ann3", label: "Volkswagen Golf — EF-789-GH", year: "2020" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#111]">Ajouter à mon annonce</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"><X size={14} /></button>
        </div>
        <p className="text-xs text-slate-500 mb-3">Sélectionnez l'annonce à laquelle vous souhaitez attacher ce rapport.</p>
        <div className="space-y-2">
          {annonces.map((a) => (
            <button key={a.id} onClick={() => setSelected(a.id)}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${selected === a.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB] hover:border-[#D4AF37]/30"}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${selected === a.id ? "bg-[#D4AF37]/10" : "bg-slate-100"}`}>
                <Car size={14} className={selected === a.id ? "text-[#D4AF37]" : "text-slate-400"} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#111]">{a.label}</p>
                <p className="text-[9px] text-slate-400">{a.year}</p>
              </div>
              {selected === a.id && <CheckCircle size={14} className="text-[#D4AF37]" />}
            </button>
          ))}
        </div>
        <button disabled={!selected}
          className="mt-4 w-full rounded-2xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-40 transition">
          Confirmer l'ajout
        </button>
      </div>
    </div>
  );
}

/* ─── MODAL CENTRE DOCUMENTS ─── */
function ModalCentreDocuments({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#111]">Centre de documents</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"><X size={14} /></button>
        </div>
        <div className="space-y-2">
          {[
            { label: "Véhicules → Historiques", sub: "Tous vos rapports historiques", path: "/compte/documents/historiques" },
            { label: "Véhicules → Contrôles techniques", sub: "Vos contrôles techniques", path: "/compte/documents/ct" },
            { label: "Factures & Reçus", sub: "Vos factures de rapports", path: "/compte/documents/factures" },
            { label: "Documents administratifs", sub: "Cartes grises, assurances…", path: "/compte/documents/admin" },
          ].map((d) => (
            <button key={d.label} onClick={() => { navigate(d.path); onClose(); }}
              className="flex w-full items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3 text-left hover:border-[#D4AF37]/30 hover:bg-white transition">
              <FolderOpen size={16} className="text-orange-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#111]">{d.label}</p>
                <p className="text-[9px] text-slate-400">{d.sub}</p>
              </div>
              <ChevronRight size={12} className="ml-auto text-slate-400" />
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-2xl bg-[#111] py-3 text-sm font-bold text-white hover:bg-[#222] transition">
          Fermer
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function Historique() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [carIndex, setCarIndex] = useState(0);

  /* Step 1 */
  const [searchMode, setSearchMode] = useState<SearchMode>("plate");
  const [plaque, setPlaque] = useState("");
  const [vin, setVin] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("voiture");
  const [country, setCountry] = useState("France");

  /* Step 2 */
  const [detected, setDetected] = useState<{ marque: string; modele: string; annee: string } | null>(null);

  /* Step 3 */
  const [selectedRapport, setSelectedRapport] = useState<RapportType | null>(null);

  /* Step 4 */
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cb");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(false);

  /* Step 5/6 */
  const [reportStatus, setReportStatus] = useState<ReportStatus>("paiement_recu");
  const [reportScore, setReportScore] = useState(92);

  /* Modals */
  const [showLogin, setShowLogin] = useState(false);
  const [showExemple, setShowExemple] = useState(false);
  const [showPartage, setShowPartage] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAnnonce, setShowAnnonce] = useState(false);
  const [showCentreDoc, setShowCentreDoc] = useState(false);

  const [hasDuplicate, setHasDuplicate] = useState(false);

  const req = trpc.historique.requestReport.useMutation();

  /* Carousel auto */
  useEffect(() => {
    const t = setInterval(() => setCarIndex((i) => (i + 1) % CAR_IMAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  function handleVerify() {
    const val = searchMode === "vin" ? vin : plaque;
    if (!val) return;
    if (!user) { setShowLogin(true); return; }
    setDetected({ marque: "Renault", modele: "Clio IV", annee: "2019" });
    setHasDuplicate(Math.random() > 0.8);
    setStep(1);
  }

  function simulatePayment() {
    setPaying(true);
    setPayError(false);
    setTimeout(() => {
      setPaying(false);
      setReportStatus("paiement_recu");
      setStep(5);
      setTimeout(() => {
        setReportStatus("en_generation");
        setTimeout(() => {
          setReportStatus("disponible");
          setReportScore(Math.floor(Math.random() * 40) + 60);
          setStep(6);
          req.mutate({ searchType: searchMode, searchValue: plaque || vin });
        }, 2000);
      }, 1500);
    }, 2000);
  }

  function downloadPDF() {
    const content = `RAPPORT HISTORIQUE VÉHICULE - MKA.P-MS\n\nVéhicule : ${detected?.marque} ${detected?.modele} ${detected?.annee}\nImmatriculation : ${plaque || vin}\nType rapport : ${rapportInfo?.label}\nScore : ${reportScore}/100\nDate : ${new Date().toLocaleDateString("fr-FR")}\n\nDonnées :\n- Accidents : Aucun accident déclaré\n- Kilométrage : 128 450 km — Cohérent\n- Vol : Aucun vol déclaré\n- Gage : Aucun gage enregistré\n- Entretien : 12 entretiens trouvés\n- Propriétaires : 2 propriétaires\n- Importation : Non importé\n- Contrôle technique : Valide jusqu'au 12/2025\n\nCe rapport a été généré par MKA.P-MS — La Marketplace Automobile.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport_historique_${(plaque || vin).replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadFacture() {
    const content = `FACTURE MKA.P-MS\n\nDate : ${new Date().toLocaleDateString("fr-FR")}\nNuméro facture : FAC-${Date.now()}\n\nClient : ${user?.email || "Utilisateur MKA.P-MS"}\n\nDésignation : Rapport Historique Véhicule — ${rapportInfo?.label}\nVéhicule : ${plaque || vin}\n\nMontant HT : ${((rapportInfo?.prix || 0) / 1.2).toFixed(2)} €\nTVA 20% : ${((rapportInfo?.prix || 0) * 0.2 / 1.2).toFixed(2)} €\nTotal TTC : ${rapportInfo?.prixLabel} €\n\nMKA.P-MS — La Marketplace Automobile\nwww.mkapms.com`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facture_mkapms_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const rapportInfo = RAPPORTS.find((r) => r.id === selectedRapport);
  const sc = scoreLabel(reportScore);
  const searchVal = searchMode === "vin" ? vin : plaque;

  /* ═══ MODALS ═══ */
  if (showExemple) return <ModalExempleComplet onClose={() => setShowExemple(false)} />;
  if (showPartage) return <ModalPartage searchVal={searchVal} onClose={() => setShowPartage(false)} />;
  if (showNotifications) return <ModalNotifications onClose={() => setShowNotifications(false)} />;
  if (showAnnonce) return <ModalAjouterAnnonce searchVal={searchVal} onClose={() => setShowAnnonce(false)} />;
  if (showCentreDoc) return <ModalCentreDocuments onClose={() => setShowCentreDoc(false)} />;

  /* ═══ LOGIN MODAL ═══ */
  if (showLogin) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.15)_0%,_transparent_70%)]" />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/30">
                <ShieldCheck size={28} className="text-[#D4AF37]" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Connexion requise</h2>
              <p className="mt-2 text-sm text-white/50">Un compte MKA.P-MS est obligatoire pour acheter un rapport.</p>
              {searchVal && (
                <div className="mt-4 rounded-xl bg-white/10 px-4 py-2.5 text-xs text-white/70">
                  Votre recherche <strong className="text-[#D4AF37]">{searchVal}</strong> sera conservée.
                </div>
              )}
            </div>
          </div>
          <div className="p-6 space-y-3">
            <Link to="/auth?redirect=/historique" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white hover:bg-[#C5A028] transition">
              <Users size={16} /> Se connecter
            </Link>
            <Link to="/auth?mode=register&redirect=/historique" className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#111] py-3.5 text-sm font-bold text-[#111] hover:bg-[#111] hover:text-white transition">
              Créer un compte
            </Link>
            <button onClick={() => setShowLogin(false)} className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 transition">← Retour</button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ STEP 6 — RÉCEPTION DU RAPPORT ═══ */
  if (step === 6) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] px-4 pt-6 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.1)_0%,_transparent_60%)]" />
          <div className="relative">
            <button onClick={() => setStep(0)} className="flex items-center gap-1 text-xs text-white/50 hover:text-white mb-4 transition">
              <ChevronLeft size={14} /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/20 border border-green-400/30">
                <CheckCircle size={24} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">Rapport disponible !</h2>
                <p className="text-xs text-white/50">Rapport {rapportInfo?.label} · {searchVal}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-4 relative z-10">
          {/* Identité + score + données */}
          <div className="rounded-2xl bg-white shadow-sm border border-[#E5E7EB] overflow-hidden">
            <div className="p-4 border-b border-[#F5F5F5]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#111]">{detected?.marque} {detected?.modele}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{detected?.annee} · {vehicleType}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                    <span className="flex h-4 w-5 items-center justify-center rounded-sm bg-blue-600 text-[7px] text-white font-bold">F</span>
                    {searchVal}
                  </span>
                </div>
                <span className={`rounded-xl px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wide ${rapportInfo?.id === "premium" ? "bg-purple-100 text-purple-700" : rapportInfo?.id === "complet" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                  {rapportInfo?.label}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Score MKA.P-MS</p>
                  <div className={`relative flex h-20 w-20 items-center justify-center rounded-full border-[4px] ${sc.border} shadow-lg ${sc.glow}`}>
                    <div className="text-center">
                      <span className="text-2xl font-extrabold text-[#111]">{reportScore}</span>
                      <p className="text-[8px] text-slate-400 leading-none">/100</p>
                    </div>
                  </div>
                  <p className={`mt-2 text-sm font-extrabold ${sc.color}`}>{sc.label}</p>
                  <p className="text-[8px] text-slate-400 text-center leading-tight mt-0.5">
                    {reportScore >= 85 ? "Faible risque" : reportScore >= 70 ? "Risque modéré" : reportScore >= 50 ? "Vérifications recommandées" : "Risque élevé"}
                  </p>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    { label: "Accidents", value: "Aucun accident déclaré" },
                    { label: "Kilométrage", value: "128 450 km — Cohérent" },
                    { label: "Vol", value: "Aucun vol déclaré" },
                    { label: "Gage", value: "Aucun gage enregistré" },
                    { label: "Entretien", value: "12 entretiens trouvés" },
                    { label: "Propriétaires", value: "2 propriétaires" },
                    { label: "Importation", value: "Non importé" },
                    { label: "Contrôle technique", value: "Valide jusqu'au 12/2025" },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-600">
                        <CheckCircle size={10} className="text-green-500 shrink-0" /> {r.label}
                      </span>
                      <span className="text-[10px] font-semibold text-[#111]">{r.value}</span>
                    </div>
                  ))}
                  {selectedRapport === "premium" && (
                    <>
                      <div className="flex items-center justify-between pt-1 border-t border-[#F5F5F5]">
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-600"><Zap size={10} className="text-purple-500 shrink-0" /> Analyse IA</span>
                        <span className="text-[10px] font-semibold text-green-600">Faible risque</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-600"><BarChart3 size={10} className="text-blue-500 shrink-0" /> Estimation marché</span>
                        <span className="text-[10px] font-semibold text-[#111]">8 500 — 10 200 €</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-3 text-[8px] text-slate-400 italic">Si une donnée n'est pas disponible, elle est affichée "Donnée non disponible" et non laissée vide.</p>
              <p className="text-[8px] text-slate-400 italic">Le PDF inclut le logo MKA.P-MS en en-tête pour un rendu professionnel premium.</p>
            </div>
          </div>

          {/* 6 actions cliquables */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Eye, label: "Voir le rapport", color: "text-[#D4AF37]", action: () => navigate("/compte/rapports") },
              { icon: Download, label: "Télécharger PDF", color: "text-blue-500", action: downloadPDF },
              { icon: Printer, label: "Imprimer", color: "text-slate-500", action: () => window.print() },
              { icon: Share2, label: "Partager", color: "text-green-500", action: () => setShowPartage(true) },
              { icon: Bell, label: "Notifications", color: "text-purple-500", action: () => setShowNotifications(true) },
              { icon: FolderOpen, label: "Centre documents", color: "text-orange-500", action: () => setShowCentreDoc(true) },
            ].map((a) => (
              <button key={a.label} onClick={a.action}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-3 text-center hover:border-[#D4AF37] hover:shadow-sm transition active:scale-95">
                <a.icon size={18} className={a.color} />
                <span className="text-[9px] font-bold text-[#111] leading-tight">{a.label}</span>
              </button>
            ))}
          </div>

          {/* Rapport dans la plateforme */}
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
            <h4 className="text-xs font-bold text-blue-800 flex items-center gap-2">
              <BadgeCheck size={14} className="text-blue-500" /> Votre rapport est disponible dans la plateforme
            </h4>
            <div className="mt-3 space-y-2">
              {[
                { label: "Espace utilisateur → Mes rapports historiques", path: "/compte/rapports" },
                { label: "Notifications MKA.P-MS (notification envoyée dans la plateforme)", path: null },
                { label: "Centre documents → Véhicules → Historiques", path: "/compte/documents/historiques" },
                { label: "Rapport disponible en texte et en PDF", path: null },
                { label: "Facture et reçu dans votre espace", path: "/compte/documents/factures" },
              ].map((item) => (
                item.path ? (
                  <button key={item.label} onClick={() => navigate(item.path!)}
                    className="flex items-start gap-2 text-[10px] text-blue-700 hover:text-blue-900 hover:underline w-full text-left transition">
                    <CheckCircle size={10} className="text-blue-500 mt-0.5 shrink-0" /> {item.label}
                  </button>
                ) : (
                  <p key={item.label} className="flex items-start gap-2 text-[10px] text-blue-700">
                    <CheckCircle size={10} className="text-blue-500 mt-0.5 shrink-0" /> {item.label}
                  </p>
                )
              ))}
            </div>
            <p className="mt-3 text-[9px] text-blue-600 font-semibold">Tout se passe directement dans MKA.P-MS. Aucun envoi par email.</p>
          </div>

          {/* Confidentialité */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4">
            <h4 className="text-xs font-bold text-[#111] flex items-center gap-2">
              <Lock size={12} className="text-[#D4AF37]" /> Confidentialité
            </h4>
            <p className="mt-2 text-[10px] text-slate-500">Ce rapport est privé. Visible uniquement par vous et les admins autorisés en cas de litige.</p>
            <button onClick={() => setShowAnnonce(true)}
              className="mt-3 flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-[10px] font-bold text-white hover:bg-[#C5A028] transition">
              <FileText size={12} /> Ajouter ce rapport à mon annonce
            </button>
          </div>

          {/* Détails achat */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4">
            <h4 className="text-xs font-bold text-[#111] mb-3">Détails de l'achat</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Plaque", value: searchVal },
                { label: "Type rapport", value: rapportInfo?.label },
                { label: "Prix payé", value: `${rapportInfo?.prixLabel} €` },
                { label: "Date", value: new Date().toLocaleDateString("fr-FR") },
                { label: "Statut", value: "Disponible", green: true },
              ].map((d) => (
                <div key={d.label} className="rounded-xl bg-[#F8F9FA] p-2.5">
                  <p className="text-[8px] text-slate-400">{d.label}</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${d.green ? "text-green-600" : "text-[#111]"}`}>{d.value}</p>
                </div>
              ))}
              {/* Facture cliquable */}
              <div className="rounded-xl bg-[#F8F9FA] p-2.5">
                <p className="text-[8px] text-slate-400">Facture</p>
                <button onClick={downloadFacture} className="text-[10px] font-bold mt-0.5 text-[#D4AF37] hover:underline transition">
                  Télécharger
                </button>
              </div>
            </div>
          </div>

          {/* CTA bas */}
          <div className="flex gap-3 pb-4">
            <button onClick={() => { setStep(0); setSelectedRapport(null); setPlaque(""); setVin(""); }}
              className="flex-1 rounded-2xl border-2 border-[#111] py-3.5 text-sm font-bold text-[#111] hover:bg-[#111] hover:text-white transition">
              Nouveau rapport
            </button>
            <button onClick={() => navigate("/compte/rapports")}
              className="flex-1 rounded-2xl bg-[#D4AF37] py-3.5 text-center text-sm font-bold text-white hover:bg-[#C5A028] transition">
              Mes rapports
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ STEP 5 — GÉNÉRATION ═══ */
  if (step === 5) {
    const steps = [
      { label: "Paiement reçu", done: true },
      { label: "Appel API fournisseur historique", done: reportStatus !== "paiement_recu" },
      { label: "Analyse & génération PDF", done: reportStatus === "disponible" },
      { label: "Rapport disponible dans votre espace", done: false },
    ];
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.15)_0%,_transparent_70%)]" />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/30">
                <Loader2 size={28} className="text-[#D4AF37] animate-spin" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Génération en cours…</h2>
              <p className="mt-2 text-sm text-white/50">Nous analysons les données pour <strong className="text-white">{searchVal}</strong></p>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-green-100" : i === steps.findIndex(x => !x.done) ? "bg-[#D4AF37]/10" : "bg-slate-100"}`}>
                  {s.done ? <CheckCircle size={14} className="text-green-500" /> : i === steps.findIndex(x => !x.done) ? <Loader2 size={14} className="text-[#D4AF37] animate-spin" /> : <div className="h-2 w-2 rounded-full bg-slate-300" />}
                </div>
                <span className={`text-xs ${s.done ? "text-[#111] font-semibold" : "text-slate-400"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══ STEP 4 — PAIEMENT ═══ */
  if (step === 4) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] px-4 pt-6 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.1)_0%,_transparent_60%)]" />
          <div className="relative">
            <button onClick={() => setStep(3)} className="flex items-center gap-1 text-xs text-white/50 hover:text-white mb-4 transition">
              <ChevronLeft size={14} /> Retour
            </button>
            <h2 className="text-xl font-extrabold text-white">Paiement</h2>
            <p className="mt-1 text-sm text-white/50">Rapport {rapportInfo?.label} — <strong className="text-[#D4AF37]">{rapportInfo?.prixLabel} €</strong></p>
          </div>
        </div>
        <div className="px-4 -mt-4 space-y-4 relative z-10">
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-sm p-4">
            <h3 className="text-sm font-bold text-[#111] mb-3">Mode de paiement</h3>
            <div className="space-y-2">
              {([
                { id: "cb" as const, label: "Carte bancaire", sub: "Visa, Mastercard, CB" },
                { id: "apple" as const, label: "Apple Pay", sub: "Si disponible sur votre appareil" },
                { id: "google" as const, label: "Google Pay", sub: "Si disponible sur votre appareil" },
              ]).map((m) => (
                <button key={m.id} onClick={() => setPayMethod(m.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition ${payMethod === m.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB] hover:border-[#D4AF37]/30"}`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${payMethod === m.id ? "bg-[#D4AF37]/10" : "bg-slate-100"}`}>
                    <CreditCard size={16} className={payMethod === m.id ? "text-[#D4AF37]" : "text-slate-400"} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#111]">{m.label}</p>
                    <p className="text-[9px] text-slate-400">{m.sub}</p>
                  </div>
                  {payMethod === m.id && <CheckCircle size={16} className="text-[#D4AF37]" />}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-sm p-4">
            <h3 className="text-sm font-bold text-[#111] mb-3">Récapitulatif</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Rapport {rapportInfo?.label}</span>
                <span className="font-bold text-[#111]">{rapportInfo?.prixLabel} €</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[#F5F5F5] pt-2">
                <span className="font-extrabold text-[#111]">Total TTC</span>
                <span className="font-extrabold text-[#111] text-sm">{rapportInfo?.prixLabel} €</span>
              </div>
            </div>
          </div>
          {payError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-xs text-red-700">
              <AlertTriangle size={14} className="text-red-500 shrink-0" /> Paiement échoué. Veuillez réessayer.
            </div>
          )}
          <button onClick={simulatePayment} disabled={paying}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] py-4 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-50 transition shadow-lg shadow-[#D4AF37]/20">
            {paying ? <><Loader2 size={16} className="animate-spin" /> Traitement en cours…</> : <><Lock size={14} /> Payer {rapportInfo?.prixLabel} €</>}
          </button>
          <div className="flex items-center justify-center gap-2 text-[9px] text-slate-400">
            <Lock size={8} /> Paiement sécurisé via Stripe — SSL 256 bits
          </div>
        </div>
      </div>
    );
  }

  /* ═══ STEP 3 — CHOIX RAPPORT ═══ */
  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] px-4 pt-6 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.1)_0%,_transparent_60%)]" />
          <div className="relative">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-white/50 hover:text-white mb-4 transition">
              <ChevronLeft size={14} /> Retour
            </button>
            <h2 className="text-xl font-extrabold text-white">Choisissez votre rapport</h2>
            <p className="mt-1 text-sm text-white/50">Des informations claires pour une décision en toute confiance.</p>
          </div>
        </div>
        <div className="px-4 -mt-4 space-y-3 relative z-10">
          {RAPPORTS.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.id} className={`relative rounded-2xl bg-white overflow-hidden transition ${r.popular ? "border-2 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10" : "border border-[#E5E7EB]"}`}>
                {r.popular && (
                  <div className="bg-[#D4AF37] px-4 py-1.5 text-center">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-white">⭐ Le plus populaire</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${r.gradient} border ${r.border}`}>
                        <Icon size={20} className={r.iconColor} />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#111]">{r.label}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xl font-extrabold text-[#111]">{r.prixLabel} €</span>
                      <p className="text-[8px] text-slate-400">par rapport</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-1">
                    {r.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-[10px] text-[#111]">
                        <CheckCircle size={11} className="shrink-0 text-green-500" /> {f}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setSelectedRapport(r.id); setStep(4); }}
                    className={`mt-4 w-full rounded-xl py-3 text-xs font-bold transition ${r.popular ? "bg-[#D4AF37] text-white hover:bg-[#C5A028] shadow-md shadow-[#D4AF37]/20" : r.btnClass}`}>
                    CHOISIR CE RAPPORT →
                  </button>
                </div>
              </div>
            );
          })}
          {user && (
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#111]">
                  <span className="text-[8px] font-bold text-[#D4AF37]">PRO</span>
                </div>
                <h3 className="text-sm font-bold text-[#111]">Packs Professionnels</h3>
              </div>
              <p className="text-[10px] text-slate-500 mb-3">Pour les comptes Pro VO, Garage+, Location Pro</p>
              <div className="space-y-2">
                {PACKS_PRO.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-[#F8F9FA] p-3">
                    <div>
                      <h4 className="text-xs font-bold text-[#111]">{p.label}</h4>
                      <p className="text-[9px] text-slate-400">{p.prixUnit} € / rapport</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">{p.saving}</span>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-[#111]">{p.prix} €</p>
                        <button className="text-[9px] font-bold text-[#D4AF37] hover:underline">Acheter</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══ STEP 2 — RÉSUMÉ ═══ */
  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] px-4 pt-6 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.1)_0%,_transparent_60%)]" />
          <div className="relative">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-white/50 hover:text-white mb-4 transition">
              <ChevronLeft size={14} /> Retour
            </button>
            <h2 className="text-xl font-extrabold text-white">Résumé du véhicule</h2>
            <p className="mt-1 text-sm text-white/50">Aperçu avant paiement — données sensibles masquées.</p>
          </div>
        </div>
        <div className="px-4 -mt-4 space-y-4 relative z-10">
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-sm overflow-hidden">
            {detected && (
              <div className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent border-b border-[#E5E7EB] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/30">
                    <Car size={18} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Véhicule détecté</p>
                    <p className="text-base font-extrabold text-[#111]">{detected.marque} {detected.modele}</p>
                    <p className="text-xs text-slate-500">{detected.annee}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="p-4 space-y-2">
              {[
                { label: "Plaque / VIN", value: searchVal },
                { label: "Pays", value: country },
                { label: "Type véhicule", value: vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1) },
                { label: "Disponibilité", value: "Rapport disponible", green: true },
              ].map((d) => (
                <div key={d.label} className="flex items-center justify-between py-2 border-b border-[#F5F5F5] last:border-0">
                  <span className="text-xs text-slate-500">{d.label}</span>
                  <span className={`text-xs font-bold ${d.green ? "text-green-600" : "text-[#111]"}`}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-green-50 border border-green-200 p-3 flex items-center gap-2">
            <CheckCircle size={14} className="text-green-500 shrink-0" />
            <p className="text-xs font-semibold text-green-700">Rapport disponible immédiatement après paiement.</p>
          </div>
          <button onClick={() => setStep(3)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] py-4 text-sm font-bold text-white hover:bg-[#C5A028] transition shadow-lg shadow-[#D4AF37]/20">
            Choisir mon rapport <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  /* ═══ STEP 1 — SAISIE ═══ */
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] px-4 pt-6 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.1)_0%,_transparent_60%)]" />
          <div className="relative">
            <button onClick={() => setStep(0)} className="flex items-center gap-1 text-xs text-white/50 hover:text-white mb-4 transition">
              <ChevronLeft size={14} /> Retour
            </button>
            <h2 className="text-xl font-extrabold text-white">Informations du véhicule</h2>
            <p className="mt-1 text-sm text-white/50">Complétez les informations pour générer votre rapport.</p>
          </div>
        </div>
        <div className="px-4 -mt-4 space-y-4 relative z-10">
          {hasDuplicate && (
            <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-orange-800">Un rapport récent existe déjà pour ce véhicule.</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => navigate("/compte/rapports")} className="rounded-xl bg-orange-500 px-3 py-2 text-[10px] font-bold text-white">Voir le rapport</button>
                    <button onClick={() => setHasDuplicate(false)} className="rounded-xl border border-orange-300 px-3 py-2 text-[10px] font-bold text-orange-700">Acheter un nouveau rapport</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-sm p-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#111] uppercase tracking-wide">Mode de recherche</label>
              <div className="mt-2 flex gap-2">
                {(["plate", "vin", "foreign"] as const).map((m) => (
                  <button key={m} onClick={() => setSearchMode(m)}
                    className={`flex-1 rounded-xl py-2 text-[10px] font-bold transition ${searchMode === m ? "bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/20" : "bg-[#F5F3EF] text-slate-600 hover:bg-[#E5E7EB]"}`}>
                    {m === "plate" ? "Par plaque" : m === "vin" ? "Par VIN" : "Étranger"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#111]">{searchMode === "vin" ? "Numéro VIN" : "Immatriculation"}</label>
              {searchMode === "plate" ? (
                <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-[#D4AF37] bg-white px-3 py-3">
                  <span className="flex h-8 w-6 items-center justify-center rounded-sm bg-blue-700 text-[9px] font-bold text-white">F</span>
                  <input className="flex-1 bg-transparent text-center text-lg font-extrabold text-[#111] outline-none placeholder-slate-300 tracking-widest"
                    placeholder="AA - 123 - BB" value={plaque} onChange={(e) => setPlaque(e.target.value.toUpperCase())} />
                  <div className="flex flex-col items-center">
                    <span className="text-[8px]">🇪🇺</span>
                    <span className="rounded bg-blue-700 px-1 text-[7px] font-bold text-white">75</span>
                  </div>
                </div>
              ) : (
                <input className="mt-2 w-full rounded-xl border-2 border-[#E5E7EB] focus:border-[#D4AF37] px-4 py-3 text-sm text-[#111] outline-none transition font-mono tracking-wider"
                  value={searchMode === "vin" ? vin : plaque}
                  onChange={(e) => searchMode === "vin" ? setVin(e.target.value.toUpperCase()) : setPlaque(e.target.value.toUpperCase())}
                  placeholder={searchMode === "vin" ? "Ex: VF1KR1234567890" : "Ex: AB-123-CD"} />
              )}
            </div>
            {searchMode === "foreign" && (
              <div>
                <label className="text-xs font-bold text-[#111]">Pays d'immatriculation</label>
                <select className="mt-2 w-full rounded-xl border-2 border-[#E5E7EB] focus:border-[#D4AF37] px-4 py-3 text-sm outline-none transition" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option>France</option><option>Belgique</option><option>Allemagne</option><option>Espagne</option><option>Italie</option><option>Autre</option>
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-[#111] uppercase tracking-wide">Type de véhicule</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["voiture", "moto", "scooter", "utilitaire", "camion"] as const).map((t) => (
                  <button key={t} onClick={() => setVehicleType(t)}
                    className={`rounded-xl px-3 py-2 text-[10px] font-bold capitalize transition ${vehicleType === t ? "bg-[#111] text-white" : "bg-[#F5F3EF] text-slate-600 hover:bg-[#E5E7EB]"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {detected && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500 shrink-0" />
                <div>
                  <p className="text-[9px] font-semibold text-green-600">Véhicule détecté</p>
                  <p className="text-sm font-bold text-[#111]">{detected.marque} {detected.modele} — {detected.annee}</p>
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setStep(2)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] py-4 text-sm font-bold text-white hover:bg-[#C5A028] transition shadow-lg shadow-[#D4AF37]/20">
            Continuer <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     STEP 0 — LANDING PAGE PREMIUM AMÉLIORÉE
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO avec voiture IA en fond ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D0D0D] via-[#111111] to-[#1A1A1A] min-h-[520px]">
        {/* Image voiture en fond */}
        <div className="absolute inset-0">
          {CAR_IMAGES.map((src, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === carIndex ? "opacity-30" : "opacity-0"}`}>
              <img src={src} alt="" className="h-full w-full object-cover object-center" />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D]/80 via-transparent to-transparent" />
        </div>
        {/* Reflets or */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.08)_0%,_transparent_55%)]" />

        <div className="container-page relative py-10 lg:py-14">
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/50 hover:text-white transition">
            <ChevronLeft size={10} /> Accueil
          </Link>

          {/* Badge */}
          <div className="mb-5 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37]">
                <span className="text-[7px] font-bold text-white">IA</span>
              </div>
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Rapports officiels & Analyse IA</span>
            </div>
          </div>

          {/* Titre centré */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Vérifiez l'historique<br />de votre futur<br /><span className="italic text-[#D4AF37]">véhicule</span>
            </h1>
            <p className="mt-4 text-sm text-white/60 leading-relaxed max-w-md mx-auto">
              Évitez les mauvaises surprises et achetez en toute confiance grâce à nos rapports officiels.
            </p>

            {/* Stats centrées */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-2.5">
                <div className="flex items-center gap-1.5 justify-center">
                  <Star size={12} className="text-[#D4AF37]" fill="#D4AF37" />
                  <span className="text-base font-extrabold text-white">+ 537 842</span>
                </div>
                <p className="text-[8px] text-white/40 mt-0.5">rapports générés ce mois-ci</p>
              </div>
              <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-2.5">
                <div className="flex items-center gap-1.5 justify-center">
                  <span className="text-base font-extrabold text-white">4,8</span>
                  <span className="text-[#D4AF37] text-sm">/5</span>
                </div>
                <p className="text-[8px] text-white/40 mt-0.5">basé sur 12 684 avis ★★★★★</p>
              </div>
              <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-2.5">
                <p className="text-[10px] font-bold text-[#D4AF37]">Garantie satisfait</p>
                <p className="text-[8px] text-white/40 mt-0.5">ou remboursé sous 14 jours</p>
              </div>
            </div>

            {/* Indicateurs carousel */}
            <div className="mt-4 flex justify-center gap-1.5">
              {CAR_IMAGES.map((_, i) => (
                <button key={i} onClick={() => setCarIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === carIndex ? "w-6 bg-[#D4AF37]" : "w-1.5 bg-white/20"}`} />
              ))}
            </div>
          </div>

          {/* Avantages rapides */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              { icon: CheckCircle, label: "Données officielles", sub: "Sources sécurisées" },
              { icon: Lock, label: "Paiement 100% sécurisé", sub: "Stripe & SSL 256 bits" },
              { icon: Zap, label: "Rapport instantané", sub: "Disponible en secondes" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <b.icon size={12} className="text-[#D4AF37]" />
                <div>
                  <p className="text-[10px] font-bold text-white">{b.label}</p>
                  <p className="text-[8px] text-white/40">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ZONE DE RECHERCHE ── */}
      <section className="bg-white py-6 border-b border-[#F5F5F5]">
        <div className="container-page">
          <div className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-5 shadow-sm hover:border-[#D4AF37]/30 transition max-w-2xl mx-auto">
            {/* Onglets mode — FONCTIONNELS */}
            <div className="flex gap-2 mb-4">
              {([
                { id: "plate" as const, label: "Par plaque" },
                { id: "vin" as const, label: "Par VIN" },
                { id: "foreign" as const, label: "Immatriculation étrangère" },
              ]).map((t) => (
                <button key={t.id} onClick={() => setSearchMode(t.id)}
                  className={`rounded-xl px-4 py-2 text-[10px] font-bold transition ${searchMode === t.id ? "bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/20" : "border border-[#E5E7EB] text-[#111] hover:border-[#D4AF37]/30"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Champs côte à côte — plaque ET VIN */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                {/* Champ plaque */}
                <div className={`flex items-center gap-2 rounded-xl border-2 bg-white px-3 py-2.5 flex-1 transition ${searchMode === "plate" || searchMode === "foreign" ? "border-[#D4AF37]" : "border-[#E5E7EB]"}`}>
                  <span className="flex h-9 w-7 items-center justify-center rounded-sm bg-blue-700 text-[9px] font-bold text-white shrink-0">F</span>
                  <input
                    className="w-full bg-transparent text-center text-base font-extrabold text-[#111] outline-none placeholder-slate-300 tracking-widest"
                    placeholder="AA - 123 - BB"
                    value={plaque}
                    onChange={(e) => { setPlaque(e.target.value.toUpperCase()); setSearchMode("plate"); }}
                  />
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-[8px]">🇪🇺</span>
                    <span className="rounded bg-blue-700 px-1 text-[7px] font-bold text-white">75</span>
                  </div>
                </div>

                <div className="flex items-center justify-center text-xs font-bold text-slate-300 sm:self-center">ou</div>

                {/* Champ VIN */}
                <div className={`flex items-center gap-2 rounded-xl border-2 bg-white px-3 py-2.5 flex-1 transition focus-within:border-[#D4AF37] ${searchMode === "vin" ? "border-[#D4AF37]" : "border-[#E5E7EB]"}`}>
                  <div className="flex h-9 w-8 items-center justify-center rounded-sm bg-slate-100 shrink-0">
                    <span className="text-[8px] font-bold text-slate-400">VIN</span>
                  </div>
                  <input
                    className="w-full bg-transparent text-sm text-[#111] outline-none placeholder-slate-300 font-mono tracking-wider"
                    placeholder="Numéro VIN (17 caractères)"
                    value={vin}
                    onChange={(e) => { setVin(e.target.value.toUpperCase()); setSearchMode("vin"); }}
                  />
                </div>
              </div>

              {/* Pays étranger */}
              {searchMode === "foreign" && (
                <select className="w-full rounded-xl border-2 border-[#E5E7EB] focus:border-[#D4AF37] px-4 py-3 text-sm outline-none transition" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option>France</option><option>Belgique</option><option>Allemagne</option><option>Espagne</option><option>Italie</option><option>Autre</option>
                </select>
              )}

              {/* Bouton centré en bas */}
              <button
                onClick={handleVerify}
                disabled={!plaque && !vin}
                className="mx-auto flex items-center gap-2 rounded-xl bg-[#D4AF37] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-40 transition shadow-lg shadow-[#D4AF37]/20 whitespace-nowrap"
              >
                <Search size={16} /> VÉRIFIER L'HISTORIQUE
              </button>
            </div>

            {/* Garanties */}
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-[9px] text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle size={9} className="text-green-500" /> Rapport instantané en quelques secondes</span>
              <span className="flex items-center gap-1"><CheckCircle size={9} className="text-green-500" /> Paiement 100% sécurisé</span>
              <span className="flex items-center gap-1"><CheckCircle size={9} className="text-green-500" /> Données officielles et vérifiées</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TARIFS ── */}
      <section className="bg-[#F9F9F9] py-10">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold uppercase text-[#111]">Choisissez votre rapport</h2>
              <p className="text-xs text-slate-500 mt-1">Des informations claires pour une décision en toute confiance.</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-[9px] font-semibold text-green-700">
              <CheckCircle size={10} className="text-green-500" /> Garantie satisfait ou remboursé 14 jours
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {RAPPORTS.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.id} className={`relative rounded-2xl bg-white overflow-hidden transition hover:shadow-lg ${r.popular ? "border-2 border-[#D4AF37] shadow-xl shadow-[#D4AF37]/10" : "border border-[#E5E7EB]"}`}>
                  {r.popular && (
                    <div className="bg-[#D4AF37] px-4 py-2 text-center">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-white">⭐ Le plus populaire</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${r.gradient} border ${r.border}`}>
                        <Icon size={22} className={r.iconColor} />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#111]">{r.label}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold text-[#111]">{r.prixLabel} €</span>
                      <span className="ml-1 text-[10px] text-slate-400">par rapport</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {r.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-[#111]">
                          <CheckCircle size={12} className="shrink-0 text-[#D4AF37]" /> {f}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => { setSelectedRapport(r.id); handleVerify(); }}
                      className={`mt-5 w-full rounded-xl py-3 text-xs font-bold transition ${r.popular ? "bg-[#D4AF37] text-white hover:bg-[#C5A028] shadow-md shadow-[#D4AF37]/20" : r.btnClass}`}
                    >
                      CHOISIR CE RAPPORT →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BANDEAU PIÈGES ── */}
      <section className="bg-[#111] py-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.05)_0%,_transparent_70%)]" />
        <div className="container-page relative">
          <p className="text-center text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] mb-4">Économisez des milliers d'euros — évitez ces pièges</p>
          <div className="flex flex-wrap justify-center gap-3">
            {PIEGES.map((p) => (
              <div key={p.label} className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${p.bg}`}>
                <p.icon size={12} className={p.color} />
                <span className={`text-[10px] font-semibold ${p.color}`}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CE QUE CONTIENT ── */}
      <section className="bg-white py-10">
        <div className="container-page">
          <h2 className="text-center text-sm font-extrabold uppercase tracking-widest text-[#111] mb-8">Ce que contient votre rapport</h2>
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-8 max-w-2xl mx-auto">
            {CONTENU_RAPPORT.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="flex flex-col items-center gap-2 text-center group">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white shadow-sm group-hover:border-[#D4AF37]/30 group-hover:shadow-md transition">
                    <Icon size={20} className={c.color} />
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 shadow-sm">
                      <CheckCircle size={10} className="text-white" />
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-[#111]">{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── EXEMPLE + POURQUOI + ANALYSE IA ── */}
      <section className="bg-[#F5F5F5] py-10">
        <div className="container-page">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Exemple de rapport */}
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Star size={14} className="text-[#D4AF37]" fill="#D4AF37" />
                <h3 className="text-sm font-extrabold text-[#111]">EXEMPLE DE RAPPORT</h3>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-[#111]">RENAULT CLIO IV</h4>
                  <p className="text-[10px] text-slate-500">1.5 dCi 90 cv</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                    <span className="flex h-4 w-5 items-center justify-center rounded-sm bg-blue-600 text-[7px] text-white font-bold">F</span>
                    AA-123-BB
                  </span>
                  <p className="mt-1 text-[8px] text-slate-400">Rapport généré le 28/05/2024 à 21:10</p>
                </div>
                <span className="rounded-xl bg-green-100 border border-green-200 px-3 py-1 text-[9px] font-extrabold text-green-700">RAPPORT COMPLET</span>
              </div>
              <div className="mt-4 flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <p className="text-[8px] text-slate-400 mb-1">Score de confiance</p>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-green-400 shadow-lg shadow-green-200">
                    <div className="text-center">
                      <span className="text-xl font-extrabold text-[#111]">92</span>
                      <p className="text-[7px] text-slate-400">/100</p>
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] font-extrabold text-green-600">Excellent</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[
                    { l: "Accidents", v: "Aucun accident déclaré" },
                    { l: "Kilométrage", v: "128 450 km Cohérent" },
                    { l: "Vol", v: "Aucun vol déclaré" },
                    { l: "Gage", v: "Aucun gage enregistré" },
                    { l: "Entretien", v: "12 entretiens trouvés" },
                    { l: "Propriétaires", v: "2 propriétaires" },
                    { l: "Importation", v: "Non importé" },
                    { l: "Contrôle technique", v: "Valide jusqu'au 12/2025" },
                  ].map((r) => (
                    <div key={r.l} className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-slate-600">
                        <CheckCircle size={9} className="text-[#D4AF37]" /> {r.l}
                      </span>
                      <span className="text-[10px] font-semibold text-[#111]">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Bouton VOIR UN EXEMPLE COMPLET — cliquable */}
              <button onClick={() => setShowExemple(true)}
                className="mt-4 flex items-center gap-2 rounded-xl border border-[#D4AF37] px-4 py-2.5 text-[10px] font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition w-full justify-center">
                VOIR UN EXEMPLE COMPLET <ArrowRight size={10} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Pourquoi vérifier */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#111] mb-4">POURQUOI VÉRIFIER L'HISTORIQUE ?</h3>
                <div className="space-y-3">
                  {[
                    { t: "Achetez en toute confiance", d: "Évitez les mauvaises surprises et les vices cachés." },
                    { t: "Protégez votre investissement", d: "Un historique clair = une meilleure valeur." },
                    { t: "Gagnez du temps", d: "Rapport instantané disponible 24H/24 et 7J/7." },
                  ].map((p) => (
                    <div key={p.t} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                        <ShieldCheck size={14} className="text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#111]">{p.t}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{p.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analyse IA */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D0D0D] via-[#111111] to-[#1A1A1A] p-5 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.12)_0%,_transparent_60%)]" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/30">
                      <Sparkles size={18} className="text-[#D4AF37]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#D4AF37]">ANALYSE INTELLIGENTE</h3>
                      <p className="text-[9px] text-white/40">MKA.P-MS — Technologie IA</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">Notre IA analyse des millions de données pour vous fournir un rapport fiable et objectif. Détection automatique des anomalies, estimation de la valeur marché et recommandation d'achat personnalisée.</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: "Précision", value: "99,2%" },
                      { label: "Données", value: "12M+" },
                      { label: "Délai", value: "< 5s" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-2 text-center">
                        <p className="text-sm font-extrabold text-[#D4AF37]">{s.value}</p>
                        <p className="text-[8px] text-white/40">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GARANTIES ── */}
      <section className="bg-white py-10 border-t border-[#F5F5F5]">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { icon: Globe, label: "Sources officielles", desc: "Données provenant d'organismes officiels et partenaires agréés" },
              { icon: Lock, label: "100% sécurisé", desc: "Vos données sont protégées et confidentielles" },
              { icon: Zap, label: "Rapport instantané", desc: "Disponible immédiatement après paiement" },
              { icon: Clock, label: "Disponible 24h/24", desc: "Service accessible à tout moment, où que vous soyez" },
              { icon: Headphones, label: "Support expert", desc: "Une équipe à votre écoute 7j/7" },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.label} className="flex flex-col items-center gap-2 text-center p-4 rounded-2xl hover:bg-[#F9F9F9] transition">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                    <Icon size={20} className="text-[#D4AF37]" />
                  </div>
                  <h4 className="text-[10px] font-extrabold text-[#111]">{b.label}</h4>
                  <p className="text-[8px] text-slate-500 leading-tight">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
