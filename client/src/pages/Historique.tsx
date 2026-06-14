import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, CheckCircle, Star, ArrowRight, ChevronDown,
  Car, AlertTriangle, Search, FileText, Award, Lock, Clock, Headphones,
  Globe, Zap, Eye, Users, Wrench, BarChart3, CreditCard, Download,
  MessageSquare, FolderOpen, X, Loader2, RefreshCw,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ─── CONSTANTS ─── */

const RAPPORTS = [
  {
    id: "express" as const,
    icon: Zap,
    iconColor: "text-orange-500",
    label: "RAPPORT EXPRESS",
    desc: "Pour un contrôle rapide.",
    prix: 4.99,
    prixLabel: "4,99",
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
  { id: "pack10", label: "Pack 10 rapports", rapports: 10, prix: "69,90", prixUnit: "6,99" },
  { id: "pack50", label: "Pack 50 rapports", rapports: 50, prix: "299,50", prixUnit: "5,99" },
  { id: "pack100", label: "Pack 100 rapports", rapports: 100, prix: "499,00", prixUnit: "4,99" },
];

const CONTENU_RAPPORT = [
  { icon: AlertTriangle, label: "Accidents" },
  { icon: Lock, label: "Vol" },
  { icon: BarChart3, label: "Kilométrage" },
  { icon: FileText, label: "Gage" },
  { icon: Wrench, label: "Entretien" },
  { icon: Globe, label: "Importation" },
  { icon: Users, label: "Propriétaires" },
  { icon: Eye, label: "Et plus encore" },
];

const PIEGES = [
  { icon: AlertTriangle, label: "Véhicule volé", color: "text-red-600" },
  { icon: AlertTriangle, label: "Compteur trafiqué", color: "text-orange-600" },
  { icon: AlertTriangle, label: "Véhicule accidenté", color: "text-red-600" },
  { icon: AlertTriangle, label: "Véhicule gagé", color: "text-orange-600" },
  { icon: AlertTriangle, label: "Importation à risque", color: "text-red-600" },
];

function scoreLabel(s: number) {
  if (s >= 85) return { label: "Excellent", color: "text-green-600", border: "border-green-400", bg: "bg-green-50" };
  if (s >= 70) return { label: "Bon", color: "text-blue-600", border: "border-blue-400", bg: "bg-blue-50" };
  if (s >= 50) return { label: "Moyen", color: "text-orange-600", border: "border-orange-400", bg: "bg-orange-50" };
  return { label: "Vigilance", color: "text-red-600", border: "border-red-400", bg: "bg-red-50" };
}

/* ─── TYPES ─── */
type SearchMode = "plate" | "vin" | "foreign";
type VehicleType = "voiture" | "moto" | "scooter" | "utilitaire" | "camion";
type RapportType = "express" | "complet" | "premium";
type PaymentMethod = "cb" | "apple" | "google" | "wallet";
type ReportStatus = "paiement_recu" | "en_generation" | "disponible" | "incomplet" | "indisponible" | "erreur";

/* step: 0=landing, 1=saisie, 2=résumé, 3=choix rapport, 4=paiement, 5=génération, 6=réception */

export default function Historique() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  /* Step 1 — Saisie */
  const [searchMode, setSearchMode] = useState<SearchMode>("plate");
  const [plaque, setPlaque] = useState("");
  const [vin, setVin] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("voiture");
  const [country, setCountry] = useState("France");

  /* Step 2 — Résumé détecté */
  const [detected, setDetected] = useState<{ marque: string; modele: string; annee: string } | null>(null);

  /* Step 3 — Choix rapport */
  const [selectedRapport, setSelectedRapport] = useState<RapportType | null>(null);

  /* Step 4 — Paiement */
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cb");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(false);

  /* Step 5/6 — Résultat */
  const [reportStatus, setReportStatus] = useState<ReportStatus>("paiement_recu");
  const [reportScore, setReportScore] = useState(92);

  /* Login check */
  const [showLogin, setShowLogin] = useState(false);

  /* Doublon */
  const [hasDuplicate, setHasDuplicate] = useState(false);

  const req = trpc.historique.requestReport.useMutation();

  function handleVerify() {
    const val = searchMode === "vin" ? vin : plaque;
    if (!val) return;

    if (!user) {
      setShowLogin(true);
      return;
    }

    /* Simulate detection */
    setDetected({ marque: "Renault", modele: "Clio IV", annee: "2019" });
    setHasDuplicate(Math.random() > 0.8);
    setStep(1);
  }

  function goToResume() {
    setStep(2);
  }

  function chooseRapport(id: RapportType) {
    setSelectedRapport(id);
    setStep(3);
  }

  function goToPaiement() {
    setStep(4);
  }

  function simulatePayment() {
    setPaying(true);
    setPayError(false);
    setTimeout(() => {
      setPaying(false);
      setReportStatus("paiement_recu");
      setStep(5);
      /* simulate generation */
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

  const rapportInfo = RAPPORTS.find((r) => r.id === selectedRapport);
  const sc = scoreLabel(reportScore);
  const searchVal = searchMode === "vin" ? vin : plaque;

  /* ═══ LOGIN MODAL ═══ */
  if (showLogin) {
    return (
      <div className="container-page py-16 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <ShieldCheck size={40} className="mx-auto text-[#D4AF37]" />
          <h2 className="mt-4 text-xl font-extrabold text-[#111]">Connectez-vous ou créez un compte pour continuer</h2>
          <p className="mt-2 text-sm text-slate-500">
            Un compte MKA.P-MS est obligatoire pour acheter un rapport historique véhicule.
          </p>
          {searchVal && (
            <p className="mt-3 rounded-lg bg-[#F8F9FA] p-2 text-xs text-slate-600">
              Votre recherche <strong>{searchVal}</strong> sera conservée après connexion.
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3">
            <Link to="/auth?redirect=/historique" className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028] block">
              Se connecter
            </Link>
            <Link to="/auth?mode=register&redirect=/historique" className="w-full rounded-xl border-2 border-[#111] py-3 text-sm font-bold text-[#111] hover:bg-[#111] hover:text-white block">
              Créer un compte
            </Link>
            <button onClick={() => setShowLogin(false)} className="text-xs text-slate-400 hover:text-slate-600 mt-2">
              ← Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ STEP 6 — RÉCEPTION DU RAPPORT ═══ */
  if (step === 6) {
    return (
      <div className="container-page py-8">
        <div className="mx-auto max-w-2xl">
          {/* Success header */}
          <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
            <CheckCircle size={40} className="mx-auto text-green-500" />
            <h2 className="mt-3 text-xl font-extrabold text-green-800">Votre rapport est disponible !</h2>
            <p className="mt-1 text-sm text-green-700">Rapport {rapportInfo?.label} pour le véhicule <strong>{searchVal}</strong></p>
          </div>

          {/* Rapport résumé */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#111]">{detected?.marque} {detected?.modele}</h3>
                <p className="text-xs text-slate-500">{detected?.annee} · {vehicleType}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                  <span className="flex h-3 w-3 items-center justify-center rounded-sm bg-blue-600 text-[6px] text-white">F</span> {searchVal}
                </span>
              </div>
              <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700">{rapportInfo?.label}</span>
            </div>

            {/* Score confiance */}
            <div className="mt-5 flex items-center gap-5">
              <div className="flex flex-col items-center">
                <p className="text-[8px] text-slate-400">Score de confiance MKA.P-MS</p>
                <div className={`mt-1 flex h-20 w-20 items-center justify-center rounded-full border-[3px] ${sc.border}`}>
                  <div className="text-center">
                    <span className="text-2xl font-extrabold text-[#111]">{reportScore}</span>
                    <p className="text-[8px] text-slate-400">/100</p>
                  </div>
                </div>
                <p className={`mt-1 text-sm font-bold ${sc.color}`}>{sc.label}</p>
                <p className="text-[8px] text-slate-400">
                  {reportScore >= 85 ? "Faible risque" : reportScore >= 70 ? "Risque modéré" : reportScore >= 50 ? "Vérifications recommandées" : "Risque élevé"}
                </p>
              </div>
              <div className="flex-1 space-y-1.5">
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
                  <div key={r.label} className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1 text-slate-600"><CheckCircle size={10} className="text-green-500" /> {r.label}</span>
                    <span className="font-semibold text-[#111]">{r.value}</span>
                  </div>
                ))}
                {selectedRapport === "premium" && (
                  <>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-slate-600"><Zap size={10} className="text-purple-500" /> Analyse IA</span>
                      <span className="font-semibold text-green-600">Faible risque</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-slate-600"><BarChart3 size={10} className="text-blue-500" /> Estimation marché</span>
                      <span className="font-semibold text-[#111]">8 500 — 10 200 €</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Info : données non disponibles */}
            <p className="mt-4 text-[9px] text-slate-400 italic">Si une donnée n'est pas disponible, elle est affichée "Donnée non disponible" et non laissée vide.</p>
          </div>

          {/* Actions */}
          <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-4">
            <button className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-4 text-center hover:border-[#D4AF37] transition">
              <Eye size={18} className="text-[#D4AF37]" />
              <span className="text-[10px] font-bold text-[#111]">Voir le rapport</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-4 text-center hover:border-[#D4AF37] transition">
              <Download size={18} className="text-[#D4AF37]" />
              <span className="text-[10px] font-bold text-[#111]">Télécharger PDF</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-4 text-center hover:border-[#D4AF37] transition">
              <MessageSquare size={18} className="text-[#D4AF37]" />
              <span className="text-[10px] font-bold text-[#111]">Messagerie</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-4 text-center hover:border-[#D4AF37] transition">
              <FolderOpen size={18} className="text-[#D4AF37]" />
              <span className="text-[10px] font-bold text-[#111]">Centre documents</span>
            </button>
          </div>

          {/* Rapport disponible dans */}
          <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4">
            <h4 className="text-xs font-bold text-blue-800">Votre rapport est disponible dans :</h4>
            <div className="mt-2 space-y-1 text-[10px] text-blue-700">
              <p className="flex items-center gap-1"><CheckCircle size={10} className="text-blue-500" /> Espace utilisateur → Mes rapports historiques</p>
              <p className="flex items-center gap-1"><CheckCircle size={10} className="text-blue-500" /> Messagerie interne MKA.P-MS (conversation créée)</p>
              <p className="flex items-center gap-1"><CheckCircle size={10} className="text-blue-500" /> Centre documents → Véhicules → Historiques</p>
              <p className="flex items-center gap-1"><CheckCircle size={10} className="text-blue-500" /> Facture et reçu dans votre espace</p>
            </div>
            <p className="mt-2 text-[9px] text-blue-500 italic">Un email de notification a été envoyé : "Votre rapport est disponible dans votre espace MKA.P-MS."</p>
          </div>

          {/* Confidentialité */}
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-[#111]">Confidentialité</h4>
            <p className="mt-1 text-[10px] text-slate-500">Ce rapport est privé. Visible uniquement par vous et les admins autorisés en cas de litige.</p>
            <button className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-4 py-2 text-[10px] font-bold text-white hover:bg-[#C5A028]">
              Ajouter ce rapport à mon annonce
            </button>
          </div>

          {/* Achat infos */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-bold text-[#111]">Détails de l'achat</h4>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-600">
              <div><span className="text-slate-400">Plaque :</span> {searchVal}</div>
              <div><span className="text-slate-400">Type rapport :</span> {rapportInfo?.label}</div>
              <div><span className="text-slate-400">Prix payé :</span> {rapportInfo?.prixLabel} €</div>
              <div><span className="text-slate-400">Date :</span> {new Date().toLocaleDateString("fr-FR")}</div>
              <div><span className="text-slate-400">Statut :</span> <span className="text-green-600 font-semibold">Disponible</span></div>
              <div><span className="text-slate-400">Facture :</span> <span className="text-[#D4AF37] font-semibold cursor-pointer">Télécharger</span></div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => { setStep(0); setSelectedRapport(null); }} className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Nouveau rapport
            </button>
            <Link to="/compte" className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-center text-sm font-bold text-white hover:bg-[#C5A028]">
              Mes rapports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ STEP 5 — GÉNÉRATION EN COURS ═══ */
  if (step === 5) {
    return (
      <div className="container-page py-16 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <Loader2 size={40} className="mx-auto animate-spin text-[#D4AF37]" />
          <h2 className="mt-4 text-xl font-extrabold text-[#111]">Génération du rapport en cours…</h2>
          <p className="mt-2 text-sm text-slate-500">Nous analysons les données pour <strong>{searchVal}</strong></p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle size={14} className="text-green-500" /> <span className="text-slate-600">Paiement reçu</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {reportStatus === "paiement_recu" ? <Loader2 size={14} className="animate-spin text-[#D4AF37]" /> : <CheckCircle size={14} className="text-green-500" />}
              <span className="text-slate-600">Appel API fournisseur historique</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {reportStatus !== "disponible" ? <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" /> : <CheckCircle size={14} className="text-green-500" />}
              <span className="text-slate-600">Analyse & génération PDF</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />
              <span className="text-slate-600">Rapport disponible dans votre espace</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ STEP 4 — PAIEMENT ═══ */
  if (step === 4) {
    return (
      <div className="container-page py-8">
        <div className="mx-auto max-w-md">
          <button onClick={() => setStep(3)} className="mb-4 flex items-center gap-1 text-xs text-slate-500 hover:text-[#D4AF37]">← Retour au choix du rapport</button>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-extrabold text-[#111]">Paiement</h2>
            <p className="mt-1 text-xs text-slate-500">Rapport {rapportInfo?.label} — <strong>{rapportInfo?.prixLabel} €</strong></p>

            <div className="mt-5 space-y-2">
              {([
                { id: "cb" as const, label: "Carte bancaire", icon: CreditCard, sub: "Visa, Mastercard, CB" },
                { id: "apple" as const, label: "Apple Pay", icon: CreditCard, sub: "Si disponible" },
                { id: "google" as const, label: "Google Pay", icon: CreditCard, sub: "Si disponible" },
              ]).map((m) => (
                <button key={m.id} onClick={() => setPayMethod(m.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${payMethod === m.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-slate-200 hover:border-slate-300"}`}>
                  <m.icon size={18} className={payMethod === m.id ? "text-[#D4AF37]" : "text-slate-400"} />
                  <div>
                    <p className="text-xs font-bold text-[#111]">{m.label}</p>
                    <p className="text-[9px] text-slate-400">{m.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-lg bg-[#F8F9FA] p-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Rapport</span>
                <span className="font-bold text-[#111]">{rapportInfo?.prixLabel} €</span>
              </div>
              <div className="mt-1 flex justify-between text-xs border-t border-slate-200 pt-1">
                <span className="font-bold text-[#111]">Total</span>
                <span className="font-extrabold text-[#111]">{rapportInfo?.prixLabel} €</span>
              </div>
            </div>

            {payError && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                Paiement échoué. Veuillez réessayer.
              </div>
            )}

            <button
              onClick={simulatePayment}
              disabled={paying}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-50"
            >
              {paying ? <><Loader2 size={16} className="animate-spin" /> Traitement en cours…</> : <>Payer {rapportInfo?.prixLabel} € <Lock size={14} /></>}
            </button>

            <div className="mt-3 flex items-center justify-center gap-2 text-[9px] text-slate-400">
              <Lock size={8} /> Paiement sécurisé via Stripe — SSL 256 bits
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ STEP 3 — CHOIX DU RAPPORT ═══ */
  if (step === 3) {
    return (
      <div className="container-page py-8">
        <button onClick={() => setStep(2)} className="mb-4 flex items-center gap-1 text-xs text-slate-500 hover:text-[#D4AF37]">← Retour au résumé</button>

        <h2 className="text-base font-extrabold uppercase text-[#111]">Choisissez votre rapport</h2>
        <p className="text-xs text-slate-500">Des informations claires pour une décision en toute confiance.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {RAPPORTS.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRapport === r.id;
            return (
              <div key={r.id} className={`relative rounded-2xl bg-white p-5 shadow-sm transition ${r.popular ? "border-2 border-[#D4AF37] shadow-lg ring-1 ring-[#D4AF37]/20" : "border border-slate-200"} ${isSelected ? "ring-2 ring-[#D4AF37]" : ""}`}>
                {r.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-orange-500 px-4 py-1 text-[9px] font-bold uppercase text-white shadow">Le plus populaire</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${r.iconColor}`}><Icon size={24} /></div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#111]">{r.label}</h3>
                    <p className="mt-0.5 text-[10px] text-slate-500">{r.desc}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-[#111]">{r.prixLabel} €</span>
                  <span className="ml-1 text-[10px] text-slate-400">par rapport</span>
                </div>
                <div className="mt-4 space-y-1.5">
                  {r.features.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-[#111]">
                      <CheckCircle size={12} className="shrink-0 text-green-500" /> {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setSelectedRapport(r.id); goToPaiement(); }}
                  className={`mt-5 w-full rounded-full py-2.5 text-xs font-bold transition ${r.btnClass}`}
                >
                  CHOISIR
                </button>
              </div>
            );
          })}
        </div>

        {/* Packs Pro */}
        {user && (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-[#111]">Packs Professionnels</h3>
            <p className="text-[10px] text-slate-500">Pour les comptes Pro VO, Garage+, Location Pro</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {PACKS_PRO.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="text-xs font-bold text-[#111]">{p.label}</h4>
                  <p className="mt-1 text-lg font-extrabold text-[#111]">{p.prix} €</p>
                  <p className="text-[9px] text-slate-400">{p.prixUnit} € / rapport</p>
                  <button className="mt-3 w-full rounded-lg border border-[#D4AF37] py-2 text-[10px] font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition">
                    Acheter le pack
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══ STEP 2 — RÉSUMÉ AVANT PAIEMENT ═══ */
  if (step === 2) {
    return (
      <div className="container-page py-8">
        <button onClick={() => setStep(1)} className="mb-4 flex items-center gap-1 text-xs text-slate-500 hover:text-[#D4AF37]">← Retour à la saisie</button>

        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <h2 className="text-lg font-extrabold text-[#111]">Résumé du véhicule</h2>
          <p className="mt-1 text-xs text-slate-500">Aperçu avant paiement — données sensibles masquées.</p>

          <div className="mt-5 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Plaque / VIN</span><span className="font-bold text-[#111]">{searchVal}</span></div>
            {detected && (
              <>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Marque détectée</span><span className="font-bold text-[#111]">{detected.marque}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Modèle détecté</span><span className="font-bold text-[#111]">{detected.modele}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Année</span><span className="font-bold text-[#111]">{detected.annee}</span></div>
              </>
            )}
            <div className="flex justify-between text-sm"><span className="text-slate-500">Pays</span><span className="font-bold text-[#111]">{country}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Type véhicule</span><span className="font-bold text-[#111] capitalize">{vehicleType}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Disponibilité</span><span className="font-bold text-green-600">Rapport disponible</span></div>
          </div>

          <div className="mt-5 rounded-lg bg-green-50 border border-green-200 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
              <CheckCircle size={12} /> Rapport disponible immédiatement après paiement.
            </p>
          </div>

          <button
            onClick={() => setStep(3)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028]"
          >
            Choisir mon rapport <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  /* ═══ STEP 1 — SAISIE VÉHICULE ═══ */
  if (step === 1) {
    return (
      <div className="container-page py-8">
        <button onClick={() => setStep(0)} className="mb-4 flex items-center gap-1 text-xs text-slate-500 hover:text-[#D4AF37]">← Retour</button>

        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <h2 className="text-lg font-extrabold text-[#111]">Informations du véhicule</h2>
          <p className="mt-1 text-xs text-slate-500">Complétez les informations pour générer votre rapport.</p>

          {/* Doublon warning */}
          {hasDuplicate && (
            <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 p-3">
              <p className="text-xs font-semibold text-orange-800">Un rapport récent existe déjà pour ce véhicule.</p>
              <div className="mt-2 flex gap-2">
                <button className="rounded-lg bg-orange-500 px-3 py-1.5 text-[10px] font-bold text-white">Voir le rapport</button>
                <button onClick={() => setHasDuplicate(false)} className="rounded-lg border border-orange-300 px-3 py-1.5 text-[10px] font-bold text-orange-700">Acheter un nouveau rapport</button>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#111]">Mode de recherche</label>
              <div className="mt-1 flex gap-2">
                {(["plate", "vin", "foreign"] as const).map((m) => (
                  <button key={m} onClick={() => setSearchMode(m)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${searchMode === m ? "bg-[#D4AF37] text-white" : "bg-slate-100 text-slate-600"}`}>
                    {m === "plate" ? "Par plaque" : m === "vin" ? "Par VIN" : "Étranger"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#111]">{searchMode === "vin" ? "Numéro VIN" : "Immatriculation"}</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]"
                value={searchMode === "vin" ? vin : plaque}
                onChange={(e) => searchMode === "vin" ? setVin(e.target.value.toUpperCase()) : setPlaque(e.target.value.toUpperCase())}
                placeholder={searchMode === "vin" ? "Ex: VF1KR1234567890" : "Ex: AB-123-CD"}
              />
            </div>

            {searchMode === "foreign" && (
              <div>
                <label className="text-xs font-bold text-[#111]">Pays d'immatriculation</label>
                <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option>France</option><option>Belgique</option><option>Allemagne</option><option>Espagne</option><option>Italie</option><option>Autre</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[#111]">Type de véhicule</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(["voiture", "moto", "scooter", "utilitaire", "camion"] as const).map((t) => (
                  <button key={t} onClick={() => setVehicleType(t)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-bold capitalize transition ${vehicleType === t ? "bg-[#111] text-white" : "bg-slate-100 text-slate-600"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {detected && (
              <div className="rounded-lg bg-[#F8F9FA] p-3">
                <p className="text-[10px] font-bold text-slate-500">Véhicule détecté :</p>
                <p className="text-sm font-bold text-[#111]">{detected.marque} {detected.modele} — {detected.annee}</p>
              </div>
            )}
          </div>

          <button
            onClick={goToResume}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028]"
          >
            Continuer <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  /* ═══ STEP 0 — PAGE D'ATTERRISSAGE (LANDING) ═══ */
  return (
    <div>
      {/* ═══ 1. HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460]">
        <div className="border-b border-white/10">
          <div className="container-page flex items-center justify-between py-2">
            <div className="flex flex-wrap items-center gap-4 text-[9px] text-white/60">
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-400" /> Données officielles — Sources sécurisées</span>
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-400" /> Paiement 100% sécurisé — Stripe & protocole SSL</span>
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-400" /> Rapport instantané — Disponible en quelques secondes</span>
            </div>
          </div>
        </div>

        <div className="container-page py-8 lg:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-lg">
              <h1 className="text-2xl font-extrabold uppercase leading-tight text-white sm:text-3xl lg:text-4xl">
                Vérifiez l'historique<br /><span className="italic text-[#D4AF37]">d'un véhicule</span>
              </h1>
              <p className="mt-3 text-sm text-white/60">Évitez les mauvaises surprises et achetez en toute confiance.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-lg bg-white/10 px-3 py-2">
                  <div className="flex items-center gap-1.5"><Star size={12} className="text-[#D4AF37]" fill="#D4AF37" /><span className="text-sm font-bold text-white">+ 537 842</span></div>
                  <p className="text-[8px] text-white/40">rapports générés ce mois-ci</p>
                </div>
                <div className="rounded-lg bg-white/10 px-3 py-2">
                  <div className="flex items-center gap-1.5"><span className="text-sm font-bold text-white">4,8/5</span></div>
                  <p className="text-[8px] text-white/40">basé sur 12 684 avis ★★★★★</p>
                </div>
                <div className="rounded-lg bg-white/10 px-3 py-2">
                  <p className="text-[10px] font-semibold text-white/70">Garantie satisfait</p>
                  <p className="text-[8px] text-white/40">ou remboursé sous 14 jours</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center backdrop-blur">
              <p className="text-[9px] font-semibold text-white/50">Score de confiance</p>
              <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-green-400">
                <div className="text-center"><span className="text-2xl font-extrabold text-white">92</span><p className="text-[8px] text-white/40">/100</p></div>
              </div>
              <p className="mt-2 text-sm font-bold text-green-400">Excellent</p>
              <p className="mt-0.5 text-[9px] text-white/40">Ce véhicule présente<br />un faible risque</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="border-t border-white/10 bg-white/5">
          <div className="container-page py-4">
            <div className="flex gap-1">
              {([
                { id: "plate", label: "Par plaque" },
                { id: "vin", label: "Par VIN" },
                { id: "foreign", label: "Immatriculation étrangère" },
              ] as const).map((t) => (
                <button key={t.id} onClick={() => setSearchMode(t.id as SearchMode)}
                  className={`rounded-full px-4 py-1.5 text-[10px] font-bold transition ${searchMode === t.id ? "bg-[#D4AF37] text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border-2 border-blue-500 bg-white px-2 py-2">
                <span className="flex h-8 w-6 items-center justify-center rounded-sm bg-blue-700 text-[9px] font-bold text-white">F</span>
                <input className="w-28 bg-transparent text-center text-lg font-extrabold text-[#111] outline-none placeholder-slate-300"
                  placeholder="AA - 123 - BB" value={plaque} onChange={(e) => setPlaque(e.target.value.toUpperCase())} />
                <div className="flex flex-col items-center"><span className="text-[7px]">🇪🇺</span><span className="rounded bg-blue-700 px-1 text-[7px] font-bold text-white">75</span></div>
              </div>
              <span className="text-xs font-bold text-white/40">ou</span>
              <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <span className="text-[10px] text-white/30">||||||||</span>
                <input className="w-36 bg-transparent text-sm text-white outline-none placeholder-white/30"
                  placeholder="Entrez le numéro VIN" value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} />
              </div>
              <button onClick={handleVerify} disabled={!plaque && !vin}
                className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#C5A028] disabled:opacity-40">
                VÉRIFIER L'HISTORIQUE <ArrowRight size={14} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-[9px] text-white/40">
              <span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Rapport instantané en quelques secondes</span>
              <span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Paiement 100% sécurisé</span>
              <span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Données officielles et vérifiées</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. RAPPORTS ═══ */}
      <section className="bg-[#F8F9FA] py-8">
        <div className="container-page">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold uppercase text-[#111]">Choisissez votre rapport</h2>
              <p className="text-xs text-slate-500">Des informations claires pour une décision en toute confiance.</p>
            </div>
            <span className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[9px] font-semibold text-green-700">
              <CheckCircle size={10} /> Garantie satisfait ou remboursé 14 jours
            </span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {RAPPORTS.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.id} className={`relative rounded-2xl bg-white p-5 shadow-sm ${r.popular ? "border-2 border-[#D4AF37] shadow-lg ring-1 ring-[#D4AF37]/20" : "border border-slate-200"}`}>
                  {r.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="rounded-full bg-orange-500 px-4 py-1 text-[9px] font-bold uppercase text-white shadow">Le plus populaire</span></div>}
                  <div className="flex items-start gap-3"><div className={`mt-1 ${r.iconColor}`}><Icon size={24} /></div><div><h3 className="text-sm font-extrabold text-[#111]">{r.label}</h3><p className="mt-0.5 text-[10px] text-slate-500">{r.desc}</p></div></div>
                  <div className="mt-4"><span className="text-2xl font-extrabold text-[#111]">{r.prixLabel} €</span><span className="ml-1 text-[10px] text-slate-400">par rapport</span></div>
                  <div className="mt-4 space-y-1.5">{r.features.map((f) => (<div key={f} className="flex items-center gap-1.5 text-xs text-[#111]"><CheckCircle size={12} className="shrink-0 text-green-500" /> {f}</div>))}</div>
                  <button onClick={() => { handleVerify(); chooseRapport(r.id); }} className={`mt-5 w-full rounded-full py-2.5 text-xs font-bold transition ${r.btnClass}`}>CHOISIR</button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ 3. BANDEAU ═══ */}
      <section className="bg-[#FFF3CD] py-4">
        <div className="container-page text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B6914]">Économisez des milliers d'euros et évitez les pièges</p>
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            {PIEGES.map((p) => (<span key={p.label} className={`flex items-center gap-1 text-[10px] font-semibold ${p.color}`}><p.icon size={12} /> {p.label}</span>))}
          </div>
        </div>
      </section>

      {/* ═══ 4. CE QUE CONTIENT ═══ */}
      <section className="bg-white py-8">
        <div className="container-page">
          <h2 className="text-center text-sm font-extrabold uppercase tracking-wide text-[#111]">Ce que contient votre rapport</h2>
          <div className="mx-auto mt-5 grid max-w-2xl grid-cols-4 gap-4 sm:grid-cols-8">
            {CONTENU_RAPPORT.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="flex flex-col items-center gap-1.5 text-center">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <Icon size={18} className="text-slate-600" />
                    <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500"><CheckCircle size={8} className="text-white" /></div>
                  </div>
                  <span className="text-[9px] font-bold text-[#111]">{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ 5. EXEMPLE + POURQUOI + ANALYSE IA ═══ */}
      <section className="bg-[#F8F9FA] py-8">
        <div className="container-page">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2"><Star size={14} className="text-[#D4AF37]" fill="#D4AF37" /><h3 className="text-sm font-extrabold text-[#111]">EXEMPLE DE RAPPORT</h3></div>
              <div className="mt-3 flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-[#111]">RENAULT CLIO IV</h4>
                  <p className="text-[10px] text-slate-500">1.5 dCi 90 cv</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700"><span className="flex h-3 w-3 items-center justify-center rounded-sm bg-blue-600 text-[6px] text-white">F</span> AA-123-BB</span>
                  <p className="mt-1 text-[8px] text-slate-400">Rapport généré le 28/05/2024 à 21:10</p>
                </div>
                <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-[8px] font-bold text-green-700">RAPPORT COMPLET</span>
              </div>
              <div className="mt-4 flex gap-4">
                <div className="flex flex-col items-center">
                  <p className="text-[8px] text-slate-400">Score de confiance</p>
                  <div className="mt-1 flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-green-400"><div className="text-center"><span className="text-xl font-extrabold text-[#111]">92</span><p className="text-[7px] text-slate-400">/100</p></div></div>
                  <p className="mt-1 text-[10px] font-bold text-green-600">Excellent</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[
                    { l: "Accidents", v: "Aucun accident déclaré" }, { l: "Kilométrage", v: "128 450 km Cohérent" },
                    { l: "Vol", v: "Aucun vol déclaré" }, { l: "Gage", v: "Aucun gage enregistré" },
                    { l: "Entretien", v: "12 entretiens trouvés" }, { l: "Propriétaires", v: "2 propriétaires" },
                    { l: "Importation", v: "Non importé" }, { l: "Contrôle technique", v: "Valide jusqu'au 12/2025" },
                  ].map((r) => (
                    <div key={r.l} className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-slate-600"><CheckCircle size={10} className="text-green-500" /> {r.l}</span>
                      <span className="font-semibold text-[#111]">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="mt-4 flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50">VOIR UN EXEMPLE COMPLET <ArrowRight size={10} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <h3 className="text-sm font-extrabold text-red-800">POURQUOI VÉRIFIER L'HISTORIQUE ?</h3>
                <div className="mt-3 space-y-3">
                  {[
                    { t: "Achetez en toute confiance", d: "Évitez les mauvaises surprises et les vices cachés." },
                    { t: "Protégez votre investissement", d: "Un historique clair = une meilleure valeur." },
                    { t: "Gagnez du temps", d: "Rapport instantané disponible 24H/24 et 7J/7." },
                  ].map((p) => (
                    <div key={p.t} className="flex items-start gap-2">
                      <ShieldCheck size={14} className="mt-0.5 shrink-0 text-red-600" />
                      <div><p className="text-xs font-bold text-red-800">{p.t}</p><p className="text-[10px] text-red-700">{p.d}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[#1A1A2E] to-[#2D2D3A] p-5">
                <h3 className="text-sm font-extrabold text-[#D4AF37]">ANALYSE INTELLIGENTE MKA.P-MS</h3>
                <p className="mt-2 text-xs text-white/60">Notre IA analyse des millions de données pour vous fournir un rapport fiable et objectif.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 6. BADGES BAS ═══ */}
      <section className="border-t border-slate-200 bg-white py-6">
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
                <div key={b.label} className="flex flex-col items-center gap-1.5 text-center">
                  <Icon size={18} className="text-[#111]" />
                  <h4 className="text-[10px] font-bold text-[#111]">{b.label}</h4>
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
