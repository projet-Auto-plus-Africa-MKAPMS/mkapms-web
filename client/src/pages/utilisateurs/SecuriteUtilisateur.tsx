import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Lock, Smartphone, Monitor, Check } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   SÉCURITÉ (/utilisateurs/securite)
   Données réelles : server/identity-os/router.ts — changePassword,
   mfa.status/setup/enable/disable, sessions.list/revoke, audit.recent.
   Moteur déjà entièrement construit côté serveur, jamais utilisé par un
   écran client jusqu'ici. Aucun second système de sécurité inventé.
   ══════════════════════════════════════════════════════════════════════════ */

export default function SecuriteUtilisateur() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changed, setChanged] = useState(false);
  const changePassword = trpc.identity.changePassword.useMutation({
    onSuccess: () => { setChanged(true); setCurrentPassword(""); setNewPassword(""); },
  });

  const mfaStatus = trpc.identity.mfa.status.useQuery();
  const [mfaSetup, setMfaSetup] = useState<{ otpauth: string; secret: string; backupCodes: string[] } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaDisablePassword, setMfaDisablePassword] = useState("");
  const setup = trpc.identity.mfa.setup.useMutation({
    onSuccess: (r) => {
      if (r.otpauth && r.secret && r.backupCodes) setMfaSetup({ otpauth: r.otpauth, secret: r.secret, backupCodes: r.backupCodes });
    },
  });
  const enable = trpc.identity.mfa.enable.useMutation({
    onSuccess: () => { setMfaSetup(null); setMfaCode(""); mfaStatus.refetch(); },
  });
  const disable = trpc.identity.mfa.disable.useMutation({
    onSuccess: () => { setMfaDisablePassword(""); mfaStatus.refetch(); },
  });

  const sessions = trpc.identity.sessions.list.useQuery();
  const revoke = trpc.identity.sessions.revoke.useMutation({ onSuccess: () => sessions.refetch() });

  const audit = trpc.identity.audit.recent.useQuery({ limit: 15 });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Sécurité</h1>
        <p className="mt-1 text-sm text-white/60">Mot de passe, double authentification, sessions actives</p>
      </div>

      {/* Mot de passe */}
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#111] flex items-center gap-2"><Lock size={14} /> Mot de passe</h3>
        <input type="password" placeholder="Mot de passe actuel" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
        <input type="password" placeholder="Nouveau mot de passe (8 caractères min.)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
        <button
          onClick={() => { setChanged(false); changePassword.mutate({ currentPassword, newPassword }); }}
          disabled={changePassword.isPending || currentPassword.length < 6 || newPassword.length < 8}
          className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {changePassword.isPending ? "Modification…" : "Changer mon mot de passe"}
        </button>
        {changed && <p className="text-xs text-green-600 text-center">Mot de passe modifié.</p>}
        {changePassword.error && <p className="text-xs text-red-600 text-center">{changePassword.error.message}</p>}
      </div>

      {/* MFA */}
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#111] flex items-center gap-2"><Smartphone size={14} /> Double authentification</h3>
        {mfaStatus.data?.activated ? (
          <div className="space-y-2">
            <p className="text-xs text-green-600 flex items-center gap-1"><Check size={12} /> Activée</p>
            <input type="password" placeholder="Mot de passe actuel pour désactiver" value={mfaDisablePassword} onChange={(e) => setMfaDisablePassword(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            <button
              onClick={() => disable.mutate({ currentPassword: mfaDisablePassword })}
              disabled={disable.isPending || mfaDisablePassword.length < 6}
              className="w-full rounded-xl border-2 border-red-200 py-2.5 text-sm font-bold text-red-600 disabled:opacity-50"
            >
              {disable.isPending ? "Désactivation…" : "Désactiver la double authentification"}
            </button>
            {disable.error && <p className="text-xs text-red-600 text-center">{disable.error.message}</p>}
          </div>
        ) : mfaSetup ? (
          <div className="space-y-2">
            <p className="text-xs text-[#6B7280]">Ajoutez cette clé dans votre application d'authentification, puis saisissez le code à 6 chiffres :</p>
            <p className="text-[10px] font-mono bg-[#F5F3EF] rounded-lg p-2 break-all">{mfaSetup.secret}</p>
            <p className="text-[10px] text-[#6B7280]">Codes de secours (à conserver) : {mfaSetup.backupCodes.join(", ")}</p>
            <input type="text" placeholder="Code à 6 chiffres" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} maxLength={6} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            <button
              onClick={() => enable.mutate({ code: mfaCode })}
              disabled={enable.isPending || mfaCode.length !== 6}
              className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {enable.isPending ? "Activation…" : "Confirmer et activer"}
            </button>
            {enable.error && <p className="text-xs text-red-600 text-center">{enable.error.message}</p>}
          </div>
        ) : (
          <button onClick={() => setup.mutate()} disabled={setup.isPending} className="w-full rounded-xl bg-[#111] py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {setup.isPending ? "Préparation…" : "Activer la double authentification"}
          </button>
        )}
      </div>

      {/* Sessions actives */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-bold text-[#111] flex items-center gap-2"><Monitor size={14} /> Sessions actives</h3>
        <div className="mt-2 space-y-2">
          {(sessions.data ?? []).map((s) => (
            <div key={s.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#111]">{s.userAgent ?? "Appareil inconnu"}</p>
                <p className="text-[10px] text-[#9CA3AF]">{s.ipAddress ?? ""} · Actif {new Date(s.lastActiveAt).toLocaleString("fr-FR")}</p>
              </div>
              <button onClick={() => revoke.mutate({ sessionId: s.id })} disabled={revoke.isPending} className="text-xs font-bold text-red-500 disabled:opacity-50">Déconnecter</button>
            </div>
          ))}
          {!sessions.isLoading && (sessions.data ?? []).length === 0 && <p className="text-xs text-[#6B7280]">Aucune session active.</p>}
        </div>
      </div>

      {/* Activité récente */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-[#111]">Activité récente</h3>
        <div className="mt-2 space-y-1.5">
          {(audit.data ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg bg-white border border-[#E5E7EB] px-3 py-2">
              <span className="text-xs text-[#374151]">{a.action}</span>
              <span className="text-[10px] text-[#9CA3AF]">{new Date(a.createdAt).toLocaleString("fr-FR")}</span>
            </div>
          ))}
          {!audit.isLoading && (audit.data ?? []).length === 0 && <p className="text-xs text-[#6B7280]">Aucune activité récente.</p>}
        </div>
      </div>
    </div>
  );
}
