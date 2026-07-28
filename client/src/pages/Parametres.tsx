import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Lock, Trash2, Bell, Shield, FileText,
  Cookie, Eye, Info, LogOut, User, Settings, Smartphone, HelpCircle,
  AlertTriangle, CheckCircle2, X, KeyRound
} from "lucide-react";
import { useAuth } from "../lib/auth";

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
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  to?: string;
  danger?: boolean;
  iconColor?: string;
  iconBg?: string;
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
    // Fonctionnalité à implémenter côté serveur — simulation UI
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
            <button onClick={onClose} className="btn-primary w-full">Fermer</button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="label">Mot de passe actuel</label>
                <input type="password" className="input" value={form.current} onChange={(e) => setForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" />
              </div>
              <div>
                <label className="label">Nouveau mot de passe</label>
                <input type="password" className="input" value={form.next} onChange={(e) => setForm(f => ({ ...f, next: e.target.value }))} placeholder="8 caractères minimum" />
              </div>
              <div>
                <label className="label">Confirmer le nouveau mot de passe</label>
                <input type="password" className="input" value={form.confirm} onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Annuler</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 btn-primary">
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
  const [step, setStep] = useState<"warn" | "confirm">("warn");
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (confirmText !== "SUPPRIMER") return;
    setLoading(true);
    // Fonctionnalité à implémenter côté serveur — redirection pour l'instant
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    logout();
    navigate("/");
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
                <p>Toutes vos données (annonces, messages, favoris, historique) seront définitivement supprimées. Votre abonnement actif sera annulé sans remboursement.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Annuler</button>
              <button onClick={() => setStep("confirm")} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition">Continuer</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :</p>
            <input className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="SUPPRIMER" />
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Annuler</button>
              <button
                disabled={confirmText !== "SUPPRIMER" || loading}
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-40"
              >
                {loading ? "Suppression…" : "Supprimer définitivement"}
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
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const isPro = user?.accountType === "professionnel" || user?.role === "admin" || user?.role === "superadmin";
  const twoFactorEnabled = !!(user as any)?.twoFactorEnabled;

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
            sublabel={twoFactorEnabled ? "Activée" : "Désactivée — recommandé pour sécuriser votre compte"}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            to="/compte?tab=profil"
          />
          <SettingsItem
            icon={Shield}
            label="Sessions actives"
            sublabel="Gérer les appareils connectés à votre compte"
            iconBg="bg-green-50"
            iconColor="text-green-600"
            to="/compte?tab=profil"
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
            to="/compte?tab=profil"
          />
          {isPro && (
            <SettingsItem
              icon={Settings}
              label="Informations professionnelles"
              sublabel="SIREN, SIRET, TVA, logo entreprise"
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              to="/compte?tab=profil"
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
            to="/notifications/parametres-notifications"
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
            to="/aide#rgpd"
          />
          <SettingsItem
            icon={Cookie}
            label="Gestion des cookies"
            sublabel="Préférences cookies et traceurs"
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
            to="/aide#cookies"
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
            to="/aide"
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
            to="/aide#cgv"
          />
          <SettingsItem
            icon={FileText}
            label="Mentions légales"
            iconBg="bg-slate-100"
            iconColor="text-slate-500"
            to="/aide#mentions"
          />
          <SettingsItem
            icon={Info}
            label="Information sur le classement"
            sublabel="Critères de classement des annonces"
            iconBg="bg-slate-100"
            iconColor="text-slate-500"
            to="/aide#classement"
          />
          <SettingsItem
            icon={Cookie}
            label="Charte cookies"
            iconBg="bg-slate-100"
            iconColor="text-slate-500"
            to="/aide#cookies"
          />
          <SettingsItem
            icon={Shield}
            label="Politique de confidentialité"
            iconBg="bg-slate-100"
            iconColor="text-slate-500"
            to="/aide#rgpd"
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
        <p className="text-center text-xs text-slate-400 py-6">Version : 13.6.6</p>
      </div>

      {/* Modals */}
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      {showDeleteAccount && <DeleteAccountModal onClose={() => setShowDeleteAccount(false)} />}
    </div>
  );
}
