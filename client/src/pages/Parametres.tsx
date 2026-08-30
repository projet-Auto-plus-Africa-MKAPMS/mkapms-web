import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Lock, Trash2, Bell, Shield, FileText,
  Cookie, Eye, Info, LogOut, User, Settings, Smartphone, HelpCircle,
  AlertTriangle, CheckCircle2, X, KeyRound, Mail, Phone, ToggleLeft,
  ToggleRight, BookOpen, Scale, Star, MessageSquare, GraduationCap,
  Monitor, Vibrate, Volume2, BellOff, BellRing, ChevronDown, ChevronUp
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { trpc } from "../lib/trpc";
import { ecrireConsentement, lireConsentement } from "../lib/consentementCookies";

// ─── Types ───────────────────────────────────────────────────────────────────
type SubPage =
  | null
  | "2fa"
  | "sessions"
  | "profil"
  | "infos-pro"
  | "notifications"
  | "confidentialite"
  | "cookies"
  | "coaching"
  | "faq"
  | "cgu"
  | "mentions"
  | "classement"
  | "charte-cookies"
  | "politique-confidentialite"
  | "password";

// ─── Composant item de liste ────────────────────────────────────────────────
function SettingsItem({
  icon: Icon,
  label,
  sublabel,
  onClick,
  to,
  danger = false,
  iconColor = "text-slate-500",
  iconBg = "bg-slate-100",
  badge,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  to?: string;
  danger?: boolean;
  iconColor?: string;
  iconBg?: string;
  badge?: string;
}) {
  const inner = (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition cursor-pointer select-none ${danger ? "text-red-600" : "text-slate-800"}`}
      onClick={onClick}
    >
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={18} className={danger ? "text-red-500" : iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${danger ? "text-red-600" : "text-slate-800"}`}>{label}</p>
        {sublabel && <p className="text-xs text-slate-400 mt-0.5 leading-tight">{sublabel}</p>}
      </div>
      {badge && (
        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{badge}</span>
      )}
      <ChevronRight size={16} className="shrink-0 text-slate-300" />
    </div>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  return inner;
}

// ─── Séparateur de section ───────────────────────────────────────────────────
function SectionTitle({ title }: { title: string }) {
  return (
    <p className="px-4 pt-5 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
      {title}
    </p>
  );
}

// ─── Carte de groupe ─────────────────────────────────────────────────────────
function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 rounded-2xl bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
      {children}
    </div>
  );
}

// ─── Header sous-page ────────────────────────────────────────────────────────
function SubPageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100">
      <div className="flex items-center gap-3 px-4 py-3.5 max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="p-2 -ml-1 rounded-full hover:bg-slate-100 transition"
        >
          <ChevronLeft size={20} className="text-slate-700" />
        </button>
        <h1 className="text-base font-bold text-slate-800">{title}</h1>
      </div>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-amber-500" : "bg-slate-200"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

// ─── Préférences de compte réellement persistées ──────────────────────────────
// Confidentialité, coaching et charte cookies n'étaient que des états d'écran :
// le bouton « Enregistrer » ne sauvegardait rien. Les trois écrans passent
// maintenant par le moteur de préférences (`preferencesUtilisateur`), seule
// source consultée par les autres moteurs.
type EspacePreferences = "confidentialite" | "coaching" | "cookies";

function usePreferences(espace: EspacePreferences) {
  const lecture = trpc.preferencesUtilisateur.get.useQuery({ espace });
  const [brouillon, setBrouillon] = useState<Record<string, boolean> | null>(null);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const enregistrement = trpc.preferencesUtilisateur.set.useMutation({
    onSuccess: (valeurs) => {
      setErreur("");
      setMessage("Préférences enregistrées.");
      setBrouillon(valeurs);
      void lecture.refetch();
    },
    onError: (e) => {
      setMessage("");
      setErreur(e.message);
    },
  });

  const valeurs = brouillon ?? lecture.data ?? null;

  return {
    valeurs,
    chargement: lecture.isLoading,
    enPlace: enregistrement.isPending,
    message,
    erreur,
    basculer: (cle: string) => (v: boolean) => {
      setMessage("");
      setBrouillon({ ...(valeurs ?? {}), [cle]: v });
    },
    enregistrer: () => {
      if (!valeurs) return;
      enregistrement.mutate({ espace, valeurs });
    },
  };
}

function BoutonEnregistrer({
  onClick,
  enPlace,
  message,
  erreur,
  libelle = "Enregistrer",
}: {
  onClick: () => void;
  enPlace: boolean;
  message: string;
  erreur: string;
  libelle?: string;
}) {
  return (
    <div className="px-4 pt-4">
      {erreur && <p className="mb-2 text-xs font-semibold text-red-600">{erreur}</p>}
      {message && <p className="mb-2 text-xs font-semibold text-green-700">{message}</p>}
      <button
        onClick={onClick}
        disabled={enPlace}
        className="w-full py-3 rounded-2xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition shadow disabled:opacity-60"
      >
        {enPlace ? "Enregistrement…" : libelle}
      </button>
    </div>
  );
}

// ─── Sous-page : Notifications ──────────────────────────────────────
// Les préférences étaient de simples états d'écran : « Enregistrer mes préférences »
// ne faisait rien et tout était perdu au retour. L'écran lit et écrit maintenant
// les préférences réelles du Notification OS (canaux + catégories coupées), qui
// sont celles que le moteur consulte avant d'envoyer quoi que ce soit.
const CATEGORIES_NOTIF = [
  { code: "annonces", label: "Nouvelles annonces", sub: "Alertes pour vos recherches enregistrées" },
  { code: "messages", label: "Messages reçus", sub: "Alerte à chaque nouveau message" },
  { code: "offres", label: "Offres et promotions", sub: "Réductions et offres spéciales MKA.P-MS" },
  { code: "newsletter", label: "Newsletter", sub: "Actualités et nouveautés de la plateforme" },
  { code: "systeme", label: "Notifications système", sub: "Mises à jour importantes du compte" },
] as const;

const CANAUX_NOTIF = [
  { cle: "emailEnabled", label: "Email", sub: "Notifications envoyées par email", icon: Mail },
  { cle: "inappEnabled", label: "Dans l'application", sub: "Badge et alerte dans MKA.P-MS", icon: BellRing },
  { cle: "pushEnabled", label: "Push (téléphone et ordinateur)", sub: "Même lorsque l'application est fermée", icon: Smartphone },
  { cle: "smsEnabled", label: "SMS", sub: "Notifications envoyées par SMS", icon: Phone },
] as const;

type CleCanal = (typeof CANAUX_NOTIF)[number]["cle"];

function NotificationsPage({ onBack }: { onBack: () => void }) {
  const prefs = trpc.notificationOs.preferences.me.useQuery();
  const [canaux, setCanaux] = useState<Record<CleCanal, boolean> | null>(null);
  const [coupees, setCoupees] = useState<string[] | null>(null);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const enregistrer = trpc.notificationOs.preferences.update.useMutation({
    onSuccess: () => {
      setErreur("");
      setMessage("Préférences enregistrées.");
      void prefs.refetch();
    },
    onError: (e) => {
      setMessage("");
      setErreur(e.message);
    },
  });

  const p = prefs.data;
  const valeurCanal = (cle: CleCanal): boolean =>
    canaux ? canaux[cle] : p ? !!p[cle] : false;
  const categoriesCoupees = coupees ?? p?.mutedCategories ?? [];

  const basculerCanal = (cle: CleCanal) => (v: boolean) => {
    const base: Record<CleCanal, boolean> = {
      emailEnabled: valeurCanal("emailEnabled"),
      inappEnabled: valeurCanal("inappEnabled"),
      pushEnabled: valeurCanal("pushEnabled"),
      smsEnabled: valeurCanal("smsEnabled"),
    };
    base[cle] = v;
    setCanaux(base);
    setMessage("");
  };

  const basculerCategorie = (code: string) => (v: boolean) => {
    const actuelles = categoriesCoupees;
    setCoupees(v ? actuelles.filter((c) => c !== code) : [...actuelles.filter((c) => c !== code), code]);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SubPageHeader title="Préférences de notification" onBack={onBack} />
      <div className="max-w-2xl mx-auto">

        {prefs.isLoading && <p className="px-4 pt-5 text-sm text-slate-400">Chargement de vos préférences…</p>}
        {prefs.error && (
          <p className="mx-4 mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            Préférences non chargées : {prefs.error.message}
          </p>
        )}

        <SectionTitle title="Par quel moyen vous prévenir" />
        <SettingsCard>
          {CANAUX_NOTIF.map(({ cle, label, sub, icon: Icon }) => (
            <div key={cle} className="flex items-center gap-3 px-4 py-3.5">
              <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50">
                <Icon size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <Toggle enabled={valeurCanal(cle)} onChange={basculerCanal(cle)} />
            </div>
          ))}
        </SettingsCard>

        <SectionTitle title="Ce que vous voulez recevoir" />
        <SettingsCard>
          {CATEGORIES_NOTIF.map(({ code, label, sub }) => (
            <div key={code} className="flex items-center gap-3 px-4 py-3.5">
              <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-purple-50">
                <BellRing size={18} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <Toggle
                enabled={!categoriesCoupees.includes(code)}
                onChange={basculerCategorie(code)}
              />
            </div>
          ))}
        </SettingsCard>

        <p className="mx-4 mt-3 text-[11px] text-slate-400">
          Le résumé groupé et les heures silencieuses se règlent dans Compte → Notifications.
        </p>

        {message && (
          <p className="mx-4 mt-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-semibold text-green-700">
            {message}
          </p>
        )}
        {erreur && (
          <p className="mx-4 mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {erreur}
          </p>
        )}

        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() =>
              enregistrer.mutate({
                emailEnabled: valeurCanal("emailEnabled"),
                inappEnabled: valeurCanal("inappEnabled"),
                pushEnabled: valeurCanal("pushEnabled"),
                smsEnabled: valeurCanal("smsEnabled"),
                mutedCategories: categoriesCoupees,
              })
            }
            disabled={enregistrer.isPending || prefs.isLoading}
            className="w-full py-3 rounded-2xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition shadow disabled:opacity-50"
          >
            {enregistrer.isPending ? "Enregistrement…" : "Enregistrer mes préférences"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sous-page : 2FA ──────────────────────────────────────────────────────────
function TwoFactorPage({ onBack }: { onBack: () => void }) {
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState<"info" | "setup" | "done">("info");
  const [code, setCode] = useState("");

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SubPageHeader title="Authentification à 2 facteurs" onBack={onBack} />
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">

        {/* Statut */}
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${enabled ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? "bg-green-100" : "bg-amber-100"}`}>
            <Shield size={20} className={enabled ? "text-green-600" : "text-amber-600"} />
          </div>
          <div>
            <p className={`text-sm font-bold ${enabled ? "text-green-800" : "text-amber-800"}`}>
              {enabled ? "Authentification à 2 facteurs activée" : "Authentification à 2 facteurs désactivée"}
            </p>
            <p className={`text-xs mt-0.5 ${enabled ? "text-green-600" : "text-amber-600"}`}>
              {enabled ? "Votre compte est sécurisé avec une double vérification." : "Recommandé pour protéger votre compte."}
            </p>
          </div>
        </div>

        {step === "info" && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Comment ça fonctionne ?</h3>
              {[
                { n: "1", t: "Installez une application d'authentification", s: "Google Authenticator, Authy, ou Microsoft Authenticator" },
                { n: "2", t: "Scannez le QR code", s: "Un code QR vous sera présenté à l'activation" },
                { n: "3", t: "Entrez le code à 6 chiffres", s: "À chaque connexion, un code temporaire vous sera demandé" },
              ].map(({ n, t, s }) => (
                <div key={n} className="flex gap-3">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">{n}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t}</p>
                    <p className="text-xs text-slate-400">{s}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep("setup")}
              className="w-full py-3 rounded-2xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition shadow"
            >
              {enabled ? "Désactiver la 2FA" : "Activer la 2FA"}
            </button>
          </>
        )}

        {step === "setup" && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Configurer l'authentification</h3>
            <div className="flex justify-center">
              <div className="w-40 h-40 bg-slate-100 rounded-2xl flex items-center justify-center">
                <p className="text-xs text-slate-400 text-center px-4">QR Code généré<br />après activation serveur</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Code de vérification (6 chiffres)</label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="000000"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("info")} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Annuler</button>
              <button
                disabled={code.length !== 6}
                onClick={() => { setEnabled(!enabled); setStep("done"); }}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition disabled:opacity-40"
              >
                Confirmer
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center gap-3">
            <CheckCircle2 size={44} className="text-green-500" />
            <p className="text-sm font-bold text-slate-800 text-center">
              {enabled ? "2FA activée avec succès !" : "2FA désactivée."}
            </p>
            <button onClick={() => setStep("info")} className="w-full py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition">
              Retour aux paramètres 2FA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sous-page : Confidentialité du profil ────────────────────────────────────
function ConfidentialitePage({ onBack }: { onBack: () => void }) {
  const prefs = usePreferences("confidentialite");
  const valeurs = prefs.valeurs;

  if (!valeurs) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <SubPageHeader title="Confidentialité du profil" onBack={onBack} />
        <p className="px-4 pt-6 text-sm text-slate-500">
          {prefs.chargement ? "Chargement de vos préférences…" : "Connectez-vous pour gérer votre confidentialité."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SubPageHeader title="Confidentialité du profil" onBack={onBack} />
      <div className="max-w-2xl mx-auto">
        <SectionTitle title="Informations visibles par les autres" />
        <SettingsCard>
          {[
            { key: "showPhone" as const, label: "Afficher mon numéro de téléphone", sub: "Visible sur vos annonces et votre profil" },
            { key: "showEmail" as const, label: "Afficher mon adresse email", sub: "Visible sur votre profil public" },
            { key: "showAddress" as const, label: "Afficher ma ville / adresse", sub: "Localisation approximative sur vos annonces" },
            { key: "showLastSeen" as const, label: "Afficher ma dernière connexion", sub: "Indique quand vous étiez en ligne" },
            { key: "showAnnonces" as const, label: "Profil public avec mes annonces", sub: "Les autres utilisateurs peuvent voir votre profil" },
          ].map(({ key, label, sub }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <Toggle enabled={valeurs[key] ?? false} onChange={prefs.basculer(key)} />
            </div>
          ))}
        </SettingsCard>

        <SectionTitle title="Interactions" />
        <SettingsCard>
          {[
            { key: "allowSearch" as const, label: "Apparaître dans les recherches", sub: "Votre profil peut être trouvé par d'autres utilisateurs" },
            { key: "allowContact" as const, label: "Autoriser les messages directs", sub: "Les utilisateurs peuvent vous envoyer des messages" },
          ].map(({ key, label, sub }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <Toggle enabled={valeurs[key] ?? false} onChange={prefs.basculer(key)} />
            </div>
          ))}
        </SettingsCard>

        <BoutonEnregistrer
          onClick={prefs.enregistrer}
          enPlace={prefs.enPlace}
          message={prefs.message}
          erreur={prefs.erreur}
        />
      </div>
    </div>
  );
}

// ─── Sous-page : Gestion de coaching ─────────────────────────────────────────
function CoachingPage({ onBack }: { onBack: () => void }) {
  const prefs = usePreferences("coaching");
  const valeurs = prefs.valeurs;

  if (!valeurs) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <SubPageHeader title="Gestion du coaching" onBack={onBack} />
        <p className="px-4 pt-6 text-sm text-slate-500">
          {prefs.chargement ? "Chargement de vos préférences…" : "Connectez-vous pour gérer votre coaching."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SubPageHeader title="Gestion du coaching" onBack={onBack} />
      <div className="max-w-2xl mx-auto">

        <div className="mx-4 mt-5 rounded-2xl bg-indigo-50 border border-indigo-200 p-4">
          <div className="flex items-start gap-3">
            <GraduationCap size={20} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-indigo-800">Coaching MKA.P-MS</p>
              <p className="text-xs text-indigo-600 mt-1">Le coaching vous aide à optimiser vos annonces, fixer les bons prix et maximiser vos chances de vente ou location.</p>
            </div>
          </div>
        </div>

        <SectionTitle title="Préférences de coaching" />
        <SettingsCard>
          {[
            { key: "coachingEnabled" as const, label: "Activer le coaching", sub: "Recevoir des conseils personnalisés" },
            { key: "coachingTips" as const, label: "Conseils et astuces", sub: "Recommandations pour améliorer votre expérience" },
            { key: "coachingAnnonce" as const, label: "Optimisation des annonces", sub: "Suggestions pour améliorer vos annonces" },
            { key: "coachingPrix" as const, label: "Estimation de prix", sub: "Conseils sur le prix de vente ou location" },
          ].map(({ key, label, sub }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <Toggle enabled={valeurs[key] ?? false} onChange={prefs.basculer(key)} />
            </div>
          ))}
        </SettingsCard>

        <SectionTitle title="Mon coach" />
        <SettingsCard>
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <GraduationCap size={22} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">Coach MKA.P-MS Intelligences</p>
              <p className="text-xs text-slate-400">Disponible 24h/24 — Répond à vos questions</p>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">Actif</span>
          </div>
        </SettingsCard>

        <BoutonEnregistrer
          onClick={prefs.enregistrer}
          enPlace={prefs.enPlace}
          message={prefs.message}
          erreur={prefs.erreur}
        />
      </div>
    </div>
  );
}

// ─── Sous-page : FAQ ──────────────────────────────────────────────────────────
function FAQPage({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    { q: "Comment déposer une annonce ?", a: "Cliquez sur 'Publier' en bas de l'écran, choisissez votre catégorie (vente, location, pièces…), remplissez les informations et publiez. Votre annonce sera visible immédiatement après validation." },
    { q: "Comment contacter un vendeur ?", a: "Sur la page d'une annonce, cliquez sur 'Contacter' ou 'Envoyer un message'. Vous pouvez aussi appeler directement si le vendeur a activé l'affichage de son numéro." },
    { q: "Comment fonctionne l'abonnement Pro ?", a: "L'abonnement Pro vous donne accès à des fonctionnalités avancées : annonces en vedette, statistiques détaillées, badge vérifié, accès au wallet et bien plus. Rendez-vous dans 'Abonnements' pour voir les offres." },
    { q: "Comment récupérer mon argent (Wallet) ?", a: "Dans l'onglet Wallet de votre compte, vous pouvez programmer un virement automatique (hebdomadaire ou mensuel) ou effectuer un virement manuel à tout moment vers votre compte bancaire." },
    { q: "Mon compte a été suspendu, que faire ?", a: "Contactez notre support via la messagerie ou par email à support@mkapms.co en indiquant votre identifiant. Notre équipe traitera votre demande sous 24h." },
    { q: "Comment signaler une annonce frauduleuse ?", a: "Sur la page de l'annonce, appuyez sur les 3 points (⋮) puis 'Signaler'. Précisez le motif et notre équipe de modération interviendra rapidement." },
    { q: "Puis-je utiliser MKA.P-MS depuis l'étranger ?", a: "Oui, la plateforme est accessible partout dans le monde. Les annonces peuvent être filtrées par pays et ville. Les paiements sont disponibles dans plusieurs devises." },
    { q: "Comment vérifier mon compte ?", a: "Après votre inscription, un email de vérification vous est envoyé. Cliquez sur le lien dans cet email. Une fois vérifié, un badge vert apparaît sur votre profil." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SubPageHeader title="Centre d'aide / FAQ" onBack={onBack} />
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="text-sm font-semibold text-slate-800 pr-4">{f.q}</span>
              {open === i ? <ChevronUp size={16} className="shrink-0 text-slate-400" /> : <ChevronDown size={16} className="shrink-0 text-slate-400" />}
            </button>
            {open === i && (
              <div className="px-4 pb-4">
                <p className="text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </div>
            )}
          </div>
        ))}

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <MessageSquare size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Vous n'avez pas trouvé votre réponse ?</p>
            <p className="text-xs text-amber-600 mt-1">Contactez notre support directement via la messagerie de la plateforme ou à <strong>support@mkapms.co</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sous-page : CGU ──────────────────────────────────────────────────────────
function CGUPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SubPageHeader title="Conditions générales d'utilisation" onBack={onBack} />
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <p className="text-xs text-slate-400">Dernière mise à jour : Juillet 2026</p>
          {[
            { t: "1. Objet", c: "Les présentes conditions générales d'utilisation régissent l'accès et l'utilisation de la plateforme MKA.P-MS, marketplace automobile accessible via les domaines mkapms.co, mkapms.fr, mkapms.pro et mkapms.site." },
            { t: "2. Inscription et compte", c: "L'inscription est gratuite. L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants. Tout compte créé avec de fausses informations pourra être suspendu." },
            { t: "3. Dépôt d'annonces", c: "Les annonces doivent être conformes à la réalité. Toute annonce frauduleuse, trompeuse ou illégale sera supprimée et pourra entraîner la suspension du compte. MKA.P-MS se réserve le droit de modérer tout contenu." },
            { t: "4. Transactions et paiements", c: "MKA.P-MS facilite la mise en relation entre acheteurs et vendeurs. Les transactions financières sont sécurisées via Stripe. MKA.P-MS prélève une commission sur chaque transaction réalisée via la plateforme." },
            { t: "5. Wallet et virements", c: "Les fonds disponibles dans le wallet peuvent être virés vers un compte bancaire à tout moment. Des frais de virement peuvent s'appliquer pour les virements instantanés. Les virements programmés sont gratuits." },
            { t: "6. Responsabilité", c: "MKA.P-MS ne peut être tenu responsable des transactions effectuées entre utilisateurs en dehors de la plateforme. Nous recommandons d'utiliser les outils de paiement intégrés pour bénéficier de la protection acheteur." },
            { t: "7. Données personnelles", c: "Vos données sont traitées conformément au RGPD. Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Consultez notre politique de confidentialité pour plus d'informations." },
          ].map(({ t, c }) => (
            <div key={t}>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{t}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{c}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sous-page : Mentions légales ─────────────────────────────────────────────
function MentionsPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SubPageHeader title="Mentions légales" onBack={onBack} />
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <p className="text-xs text-slate-400">Dernière mise à jour : Juillet 2026</p>
          {[
            { t: "Éditeur de la plateforme", c: "MKA.P-MS — Marketplace Automobile Plateforme\nSite web : www.mkapms.co\nContact : contact@mkapms.co" },
            { t: "Hébergement", c: "Railway Corp.\nSan Francisco, CA, USA\nwww.railway.com" },
            { t: "Directeur de la publication", c: "Le Directeur Général de MKA.P-MS" },
            { t: "Propriété intellectuelle", c: "Tous les contenus présents sur la plateforme MKA.P-MS (textes, images, logos, vidéos) sont protégés par le droit d'auteur. Toute reproduction sans autorisation est interdite." },
            { t: "Cookies", c: "La plateforme utilise des cookies techniques nécessaires au fonctionnement et des cookies analytiques pour améliorer l'expérience utilisateur. Vous pouvez gérer vos préférences dans les paramètres." },
          ].map(({ t, c }) => (
            <div key={t}>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{t}</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{c}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sous-page : Classement ───────────────────────────────────────────────────
function ClassementPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SubPageHeader title="Informations sur le classement" onBack={onBack} />
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">Le classement des annonces sur MKA.P-MS est déterminé par plusieurs critères transparents :</p>
          {[
            { icon: Star, title: "Pertinence", desc: "Les annonces les plus pertinentes par rapport à votre recherche apparaissent en premier (marque, modèle, prix, localisation)." },
            { icon: CheckCircle2, title: "Qualité de l'annonce", desc: "Les annonces avec photos de qualité, description complète et prix cohérent sont mieux classées." },
            { icon: Shield, title: "Fiabilité du vendeur", desc: "Les vendeurs vérifiés, avec un bon historique et des avis positifs, bénéficient d'un meilleur classement." },
            { icon: Bell, title: "Fraîcheur", desc: "Les annonces récentes et régulièrement mises à jour sont favorisées." },
            { icon: Star, title: "Annonces sponsorisées", desc: "Les annonces en vedette (abonnement Pro ou boost payant) apparaissent en tête de liste avec un badge 'Sponsorisé'." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Icon size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sous-page : Politique de confidentialité ─────────────────────────────────
function PolitiquePage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SubPageHeader title="Politique de confidentialité" onBack={onBack} />
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <p className="text-xs text-slate-400">Conforme au RGPD — Juillet 2026</p>
          {[
            { t: "Données collectées", c: "Nous collectons les informations que vous nous fournissez lors de votre inscription (nom, email, téléphone), ainsi que les données d'utilisation de la plateforme (annonces, recherches, messages)." },
            { t: "Utilisation des données", c: "Vos données sont utilisées pour : gérer votre compte, afficher vos annonces, vous envoyer des notifications, améliorer nos services et prévenir la fraude." },
            { t: "Partage des données", c: "Nous ne vendons jamais vos données. Elles peuvent être partagées avec nos prestataires techniques (hébergement, paiement) dans le strict cadre de nos services." },
            { t: "Vos droits", c: "Conformément au RGPD, vous avez le droit d'accéder à vos données, de les rectifier, de les supprimer, de vous opposer à leur traitement et de les exporter. Contactez-nous à privacy@mkapms.co." },
            { t: "Conservation", c: "Vos données sont conservées pendant la durée de votre compte. Après suppression du compte, les données sont effacées sous 30 jours, sauf obligations légales." },
            { t: "Sécurité", c: "Nous utilisons le chiffrement SSL/TLS, le hachage des mots de passe et des audits de sécurité réguliers pour protéger vos données." },
          ].map(({ t, c }) => (
            <div key={t}>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{t}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{c}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sous-page : Charte cookies ───────────────────────────────────────────────
function CharteCookiesPage({ onBack }: { onBack: () => void }) {
  // Le consentement s'applique d'abord dans le navigateur (il doit tenir même
  // sans compte), puis suit le compte lorsqu'il existe.
  const [prefs, setPrefs] = useState<{ essential: boolean; analytics: boolean; marketing: boolean }>(() => ({
    essential: true,
    ...lireConsentement(),
  }));
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const { user } = useAuth();

  const distant = trpc.preferencesUtilisateur.get.useQuery(
    { espace: "cookies" },
    { enabled: Boolean(user) },
  );
  useEffect(() => {
    if (!distant.data) return;
    const recu = { analytics: distant.data.analytics === true, marketing: distant.data.marketing === true };
    ecrireConsentement(recu);
    setPrefs({ essential: true, ...recu });
  }, [distant.data]);

  const enregistrement = trpc.preferencesUtilisateur.set.useMutation({
    onSuccess: () => setErreur(""),
    onError: (e) => setErreur(`Choix appliqué sur cet appareil, mais non enregistré sur le compte : ${e.message}`),
  });

  const set = (k: "analytics" | "marketing") => (v: boolean) => {
    setMessage("");
    setPrefs(p => ({ ...p, [k]: v }));
  };

  const enregistrer = () => {
    const valeurs = { analytics: prefs.analytics, marketing: prefs.marketing };
    ecrireConsentement(valeurs);
    setMessage("Choix appliqué sur cet appareil.");
    if (user) enregistrement.mutate({ espace: "cookies", valeurs });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SubPageHeader title="Gestion des cookies" onBack={onBack} />
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        <p className="text-sm text-slate-600">Nous utilisons des cookies pour améliorer votre expérience. Gérez vos préférences ci-dessous.</p>
        <p className="text-xs text-slate-500">La mesure d'audience interne de la plateforme reste anonyme et ne dépose pas de cookie publicitaire.</p>
        <SettingsCard>
          {[
            { key: "essential" as const, label: "Cookies essentiels", sub: "Nécessaires au fonctionnement du site (connexion, panier). Ne peuvent pas être désactivés.", disabled: true },
            { key: "analytics" as const, label: "Cookies analytiques", sub: "Autorisent un outil de mesure externe. Aucun n'est chargé aujourd'hui : votre choix est conservé et s'appliquera dès qu'un outil sera connecté.", disabled: false },
            { key: "marketing" as const, label: "Cookies marketing", sub: "Autorisent la personnalisation publicitaire par un tiers. Aucun régisseur n'est branché aujourd'hui.", disabled: false },
          ].map(({ key, label, sub, disabled }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <Toggle
                enabled={prefs[key]}
                onChange={disabled || key === "essential" ? () => {} : set(key)}
              />
            </div>
          ))}
        </SettingsCard>
        {erreur && <p className="text-xs font-semibold text-red-600">{erreur}</p>}
        {message && <p className="text-xs font-semibold text-green-700">{message}</p>}
        <button
          onClick={enregistrer}
          disabled={enregistrement.isPending}
          className="w-full py-3 rounded-2xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition shadow disabled:opacity-60"
        >
          {enregistrement.isPending ? "Enregistrement…" : "Enregistrer mes préférences"}
        </button>
      </div>
    </div>
  );
}

// ─── Modal Modifier mot de passe ─────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (form.next.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (form.next !== form.confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSuccess(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Modifier le mot de passe</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition"><X size={18} /></button>
        </div>
        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 size={40} className="text-green-500" />
            <p className="text-sm font-semibold text-slate-700">Demande envoyée — vous recevrez un email de confirmation.</p>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-amber-500 text-white text-sm font-bold">Fermer</button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe actuel</label>
                <input type="password" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={form.current} onChange={(e) => setForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nouveau mot de passe</label>
                <input type="password" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={form.next} onChange={(e) => setForm(f => ({ ...f, next: e.target.value }))} placeholder="8 caractères minimum" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Confirmer le nouveau mot de passe</label>
                <input type="password" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={form.confirm} onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Annuler</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition disabled:opacity-40">
                {loading ? "Envoi…" : "Modifier"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Modal Supprimer le compte ───────────────────────────────────────────────
function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [step, setStep] = useState<"warn" | "confirm">("warn");
  const { logout } = useAuth();
  const navigate = useNavigate();
  const conditions = trpc.suppressionCompte.conditions.useQuery();
  const supprimer = trpc.suppressionCompte.supprimerMonCompte.useMutation({
    onSuccess: () => {
      logout();
      navigate("/");
    },
  });

  function handleDelete() {
    if (confirmText !== "SUPPRIMER") return;
    supprimer.mutate({
      confirmation: "SUPPRIMER",
      motDePasse: motDePasse || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-red-600">Supprimer mon compte</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition"><X size={18} /></button>
        </div>
        {step === "warn" ? (
          <>
            <div className="flex items-start gap-3 bg-red-50 rounded-2xl p-4">
              <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 space-y-1">
                <p className="font-bold">Cette action est irréversible.</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {(conditions.data?.supprime ?? []).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
            {(conditions.data?.conserve ?? []).length > 0 && (
              <div className="bg-amber-50 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-bold text-amber-800">Ce que la loi nous impose de conserver</p>
                {(conditions.data?.conserve ?? []).map((c) => (
                  <div key={c.element}>
                    <p className="text-xs font-semibold text-amber-900">{c.element}</p>
                    <p className="text-xs text-amber-800">{c.raison}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Annuler</button>
              <button onClick={() => setStep("confirm")} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition">Continuer</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :</p>
            <input className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="SUPPRIMER" />
            <input
              type="password"
              autoComplete="current-password"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="Votre mot de passe"
            />
            {supprimer.error ? <p className="text-sm text-red-600">{supprimer.error.message}</p> : null}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Annuler</button>
              <button
                disabled={confirmText !== "SUPPRIMER" || supprimer.isPending}
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-40"
              >
                {supprimer.isPending ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page principale Paramètres ──────────────────────────────────────────────
export default function Parametres() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [subPage, setSubPage] = useState<SubPage>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const isPro = user?.accountType === "professionnel" || user?.role === "admin" || user?.role === "superadmin";
  const twoFactorEnabled = !!(user as any)?.twoFactorEnabled;

  // ── Rendu des sous-pages ──
  if (subPage === "2fa") return <TwoFactorPage onBack={() => setSubPage(null)} />;
  if (subPage === "notifications") return <NotificationsPage onBack={() => setSubPage(null)} />;
  if (subPage === "confidentialite") return <ConfidentialitePage onBack={() => setSubPage(null)} />;
  if (subPage === "coaching") return <CoachingPage onBack={() => setSubPage(null)} />;
  if (subPage === "faq") return <FAQPage onBack={() => setSubPage(null)} />;
  if (subPage === "cgu") return <CGUPage onBack={() => setSubPage(null)} />;
  if (subPage === "mentions") return <MentionsPage onBack={() => setSubPage(null)} />;
  if (subPage === "classement") return <ClassementPage onBack={() => setSubPage(null)} />;
  if (subPage === "politique-confidentialite") return <PolitiquePage onBack={() => setSubPage(null)} />;
  if (subPage === "charte-cookies") return <CharteCookiesPage onBack={() => setSubPage(null)} />;
  if (subPage === "cookies") return <CharteCookiesPage onBack={() => setSubPage(null)} />;

  // ── Sessions ──
  // L'écran affichait trois appareils inventés (iPhone à Paris, MacBook, Chrome à
  // Lyon) et un bouton « Déconnecter » sans action. Aucune session n'est
  // enregistrée côté serveur : on ne montre donc que l'appareil réel, celui-ci,
  // avec la seule action qui existe vraiment — s'en déconnecter.
  if (subPage === "sessions") return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SubPageHeader title="Sessions actives" onBack={() => setSubPage(null)} />
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Smartphone size={18} className="text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Cet appareil</p>
            <p className="truncate text-xs text-slate-400">{navigator.userAgent}</p>
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">Actuel</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800">
            La plateforme ne conserve pas encore la liste de vos autres appareils connectés :
            elle ne peut donc pas vous les montrer ni les déconnecter à distance. Pour couper
            l'accès partout, changez votre mot de passe.
          </p>
        </div>

        <button
          onClick={() => { logout(); navigate("/"); }}
          className="w-full py-3 rounded-2xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition"
        >
          Me déconnecter de cet appareil
        </button>
        <button
          onClick={() => { setSubPage(null); setShowChangePassword(true); }}
          className="w-full py-3 rounded-2xl bg-white text-slate-800 text-sm font-bold shadow-sm hover:bg-slate-50 transition"
        >
          Changer mon mot de passe
        </button>
      </div>
    </div>
  );

  // ── Page liste principale ──
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="flex items-center gap-3 px-4 py-3.5 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-1 rounded-full hover:bg-slate-100 transition"
          >
            <ChevronLeft size={20} className="text-slate-700" />
          </button>
          <h1 className="text-base font-bold text-slate-800">Paramètres</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">

        {/* ── Compte & Sécurité ── */}
        <SectionTitle title="Compte & Sécurité" />
        <SettingsCard>
          <SettingsItem
            icon={KeyRound}
            label="Modifier le mot de passe"
            sublabel="Changer votre mot de passe de connexion"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            onClick={() => setShowChangePassword(true)}
          />
          <SettingsItem
            icon={Smartphone}
            label="Authentification à 2 facteurs"
            sublabel={twoFactorEnabled ? "Activée" : "Désactivée — recommandé"}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            badge={twoFactorEnabled ? "ON" : "OFF"}
            onClick={() => setSubPage("2fa")}
          />
          <SettingsItem
            icon={Shield}
            label="Sessions actives"
            sublabel="Gérer les appareils connectés"
            iconBg="bg-green-50"
            iconColor="text-green-600"
            onClick={() => setSubPage("sessions")}
          />
        </SettingsCard>

        {/* ── Profil & Informations ── */}
        <SectionTitle title="Profil & Informations" />
        <SettingsCard>
          <SettingsItem
            icon={User}
            label="Modifier mon profil"
            sublabel="Nom, adresse, téléphone, photo"
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            to="/compte?tab=profil&section=infos"
          />
          {isPro && (
            <SettingsItem
              icon={Settings}
              label="Informations professionnelles"
              sublabel="SIREN, SIRET, TVA, logo entreprise"
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              to="/compte?tab=profil&section=pro"
            />
          )}
        </SettingsCard>

        {/* ── Notifications ── */}
        <SectionTitle title="Notifications" />
        <SettingsCard>
          <SettingsItem
            icon={Bell}
            label="Préférences de notification"
            sublabel="Email, SMS, push, in-app"
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            onClick={() => setSubPage("notifications")}
          />
        </SettingsCard>

        {/* ── Confidentialité & Données ── */}
        <SectionTitle title="Confidentialité & Données" />
        <SettingsCard>
          <SettingsItem
            icon={Eye}
            label="Confidentialité du profil"
            sublabel="Contrôler ce que les autres voient"
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
            onClick={() => setSubPage("confidentialite")}
          />
          <SettingsItem
            icon={Cookie}
            label="Gestion des cookies"
            sublabel="Préférences cookies et traceurs"
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
            onClick={() => setSubPage("cookies")}
          />
        </SettingsCard>

        {/* ── Coaching ── */}
        <SectionTitle title="Coaching & Assistance" />
        <SettingsCard>
          <SettingsItem
            icon={GraduationCap}
            label="Gestion du coaching"
            sublabel="Conseils personnalisés et optimisation"
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            onClick={() => setSubPage("coaching")}
          />
        </SettingsCard>

        {/* ── Aide & Support ── */}
        <SectionTitle title="Aide & Support" />
        <SettingsCard>
          <SettingsItem
            icon={HelpCircle}
            label="Centre d'aide / FAQ"
            sublabel="Réponses aux questions fréquentes"
            iconBg="bg-sky-50"
            iconColor="text-sky-600"
            onClick={() => setSubPage("faq")}
          />
        </SettingsCard>

        {/* ── Légal ── */}
        <SectionTitle title="Informations légales" />
        <SettingsCard>
          <SettingsItem
            icon={FileText}
            label="Conditions générales d'utilisation"
            iconBg="bg-slate-100"
            iconColor="text-slate-500"
            onClick={() => setSubPage("cgu")}
          />
          <SettingsItem
            icon={FileText}
            label="Mentions légales"
            iconBg="bg-slate-100"
            iconColor="text-slate-500"
            onClick={() => setSubPage("mentions")}
          />
          <SettingsItem
            icon={Info}
            label="Information sur le classement"
            sublabel="Critères de classement des annonces"
            iconBg="bg-slate-100"
            iconColor="text-slate-500"
            onClick={() => setSubPage("classement")}
          />
          <SettingsItem
            icon={Cookie}
            label="Charte cookies"
            iconBg="bg-slate-100"
            iconColor="text-slate-500"
            onClick={() => setSubPage("charte-cookies")}
          />
          <SettingsItem
            icon={Shield}
            label="Politique de confidentialité"
            iconBg="bg-slate-100"
            iconColor="text-slate-500"
            onClick={() => setSubPage("politique-confidentialite")}
          />
        </SettingsCard>

        {/* ── Déconnexion ── */}
        <SectionTitle title="Session" />
        <SettingsCard>
          <SettingsItem
            icon={LogOut}
            label="Se déconnecter"
            sublabel="Fermer la session sur cet appareil"
            iconBg="bg-slate-100"
            iconColor="text-slate-500"
            onClick={() => { logout(); navigate("/"); }}
          />
        </SettingsCard>

        {/* ── Zone dangereuse ── */}
        <SectionTitle title="Zone dangereuse" />
        <SettingsCard>
          <SettingsItem
            icon={Trash2}
            label="Supprimer mon compte"
            sublabel="Action irréversible — toutes vos données seront supprimées"
            danger
            onClick={() => setShowDeleteAccount(true)}
          />
        </SettingsCard>

        {/* Version */}
        <p className="text-center text-xs text-slate-400 py-6">MKA.P-MS · Version {__APP_VERSION__}</p>
      </div>

      {/* Modals */}
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      {showDeleteAccount && <DeleteAccountModal onClose={() => setShowDeleteAccount(false)} />}
    </div>
  );
}
