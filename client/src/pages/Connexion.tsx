import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { PROFILE_LIST, getProfile } from "@shared/profiles";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export default function Connexion() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", profileType: "particulier" });
  const [forgotSent, setForgotSent] = useState(false);
  const googleDiv = useRef<HTMLDivElement>(null);

  const loginM = trpc.auth.login.useMutation({
    onSuccess: (r) => { login(r.token, r.user as any); navigate("/compte"); },
  });
  const registerM = trpc.auth.register.useMutation({
    onSuccess: (r) => {
      login(r.token, r.user as any);
      const prof = getProfile(r.profileType);
      navigate(prof?.needsValidation ? "/compte/validation" : "/compte");
    },
  });
  const googleM = trpc.auth.googleLogin.useMutation({
    onSuccess: (r) => { login(r.token, r.user as any); navigate("/compte"); },
  });

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google || !googleDiv.current) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp: { credential: string }) => googleM.mutate({ idToken: resp.credential }),
    });
    window.google.accounts.id.renderButton(googleDiv.current, {
      theme: "outline",
      size: "large",
      width: 360,
      text: "continue_with",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const err = loginM.error || registerM.error || googleM.error;

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#FAFAFA] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo + Bienvenue */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#111]">
            <span className="text-2xl font-extrabold text-[#D4AF37]">M</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">
            MK<span className="text-[#D4AF37]">A</span>.P-MS
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">La Marketplace Automobile</p>
          <p className="mt-3 text-[#374151]">
            {mode === "login" && "Bienvenue ! Connectez-vous pour accéder à votre espace."}
            {mode === "register" && "Créez votre compte et rejoignez la communauté MKA.P-MS."}
            {mode === "forgot" && "Entrez votre email pour réinitialiser votre mot de passe."}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
          {/* Google */}
          {mode !== "forgot" && (
            <>
              {GOOGLE_CLIENT_ID ? (
                <div ref={googleDiv} className="flex justify-center" />
              ) : (
                <button
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#374151] transition hover:bg-[#F9FAFB] hover:shadow-sm"
                  onClick={() => {/* Google login would go here */}}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuer avec Google
                </button>
              )}

              <div className="relative my-6 text-center">
                <div className="absolute inset-x-0 top-1/2 h-px bg-[#E5E7EB]" />
                <span className="relative bg-white px-4 text-xs font-medium text-[#9CA3AF]">ou par email</span>
              </div>
            </>
          )}

          {/* Form */}
          <div className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#374151]">Nom complet</label>
                  <input
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm text-[#111] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    placeholder="Prénom et nom"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#374151]">Type de compte</label>
                  <select
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm text-[#111] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    value={form.profileType}
                    onChange={(e) => setForm((f) => ({ ...f, profileType: e.target.value }))}
                  >
                    {PROFILE_LIST.map((p) => (
                      <option key={p.type} value={p.type}>{p.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-[#9CA3AF]">{getProfile(form.profileType)?.description}</p>
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#374151]">Adresse email</label>
              <input
                className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm text-[#111] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                type="email"
                placeholder="votre@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#374151]">Mot de passe</label>
                <input
                  className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm text-[#111] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
            )}

            {err && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {err.message}
              </div>
            )}

            {mode === "forgot" && forgotSent && (
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.
              </div>
            )}

            {mode === "login" && (
              <>
                <button
                  className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#C5A028] disabled:opacity-50"
                  disabled={loginM.isPending}
                  onClick={() => loginM.mutate({ email: form.email, password: form.password })}
                >
                  {loginM.isPending ? "Connexion…" : "Se connecter"}
                </button>
                <button
                  className="w-full text-center text-sm font-medium text-[#D4AF37] hover:underline"
                  onClick={() => setMode("forgot")}
                >
                  Mot de passe oublié ?
                </button>
              </>
            )}

            {mode === "register" && (
              <button
                className="w-full rounded-xl bg-[#111] px-4 py-3 text-sm font-bold text-[#D4AF37] transition hover:bg-[#222] disabled:opacity-50"
                disabled={registerM.isPending}
                onClick={() => registerM.mutate({
                  email: form.email,
                  password: form.password,
                  name: form.name,
                  phone: form.phone || undefined,
                  profileType: form.profileType as any,
                })}
              >
                {registerM.isPending ? "Création…" : "Créer mon compte"}
              </button>
            )}

            {mode === "forgot" && (
              <button
                className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#C5A028]"
                onClick={() => setForgotSent(true)}
              >
                Envoyer le lien de réinitialisation
              </button>
            )}
          </div>
        </div>

        {/* Switch mode */}
        <div className="mt-6 text-center">
          {mode === "forgot" ? (
            <button className="text-sm font-medium text-[#6B7280] hover:text-[#111]" onClick={() => setMode("login")}>
              ← Retour à la connexion
            </button>
          ) : (
            <p className="text-sm text-[#6B7280]">
              {mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
              <button
                className="font-semibold text-[#D4AF37] hover:underline"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Créer un compte" : "Se connecter"}
              </button>
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-[#9CA3AF]">
          En continuant, vous acceptez les{" "}
          <a href="/aide#cgv" className="underline hover:text-[#6B7280]">conditions d'utilisation</a>
          {" "}et la{" "}
          <a href="/aide#rgpd" className="underline hover:text-[#6B7280]">politique de confidentialité</a>
          {" "}de MKA.P-MS.
        </p>
      </div>
    </div>
  );
}
