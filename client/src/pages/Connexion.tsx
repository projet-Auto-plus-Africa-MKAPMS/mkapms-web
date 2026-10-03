import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { PROFILE_LIST, getProfile } from "@shared/profiles";
import { homePathForSession } from "../lib/accountRoute";
import { isNativeApp } from "../lib/native";

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

  // Account Routing Engine : chaque compte revient dans son univers, pas
  // systématiquement sur l'espace particulier.
  const loginM = trpc.auth.login.useMutation({
    onSuccess: (r) => {
      login(r.token, r.user as any);
      navigate(homePathForSession(r.user as any));
    },
  });
  const registerM = trpc.auth.register.useMutation({
    onSuccess: (r) => {
      login(r.token, r.user as any);
      const prof = getProfile(r.profileType);
      navigate(prof?.needsValidation ? "/compte/validation" : homePathForSession(r.user as any));
    },
  });
  const googleM = trpc.auth.googleLogin.useMutation({
    onSuccess: (r) => {
      login(r.token, r.user as any);
      navigate(homePathForSession(r.user as any));
    },
  });
  // Applications Android : Google refuse son bouton dans la WebView, la connexion passe par le navigateur du téléphone.
  const enApplication = isNativeApp();
  const [googleAppErreur, setGoogleAppErreur] = useState("");
  const googleTicketM = trpc.auth.googleTicket.useMutation({
    onSuccess: (r) => {
      login(r.token, r.user as any);
      navigate(homePathForSession(r.user as any));
    },
  });
  const googleTicketCallback = useRef(googleTicketM.mutate);
  googleTicketCallback.current = googleTicketM.mutate;
  useEffect(() => {
    if (!enApplication) return;
    let retirer: (() => void) | undefined;
    let annule = false;
    void (async () => {
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");
      const ecouteur = await App.addListener("appUrlOpen", ({ url }) => {
        if (!url.includes("://auth/google")) return;
        const params = new URL(url.replace(/^[^:]+:\/\//, "https://app/")).searchParams;
        void Browser.close().catch(() => undefined);
        const ticket = params.get("ticket");
        if (ticket) {
          setGoogleAppErreur("");
          googleTicketCallback.current({ ticket });
        } else {
          setGoogleAppErreur(params.get("erreur") || "La connexion Google a échoué. Réessayez.");
        }
      });
      if (annule) void ecouteur.remove();
      else retirer = () => void ecouteur.remove();
    })().catch((e) => console.warn("[connexion] google application", e));
    return () => {
      annule = true;
      retirer?.();
    };
  }, [enApplication]);
  // Site sur un domaine dont le retour Google est déclaré : le ticket revient sur /connexion.
  useEffect(() => {
    if (enApplication) return;
    const params = new URLSearchParams(window.location.search);
    const ticket = params.get("google_ticket");
    const erreur = params.get("google_erreur");
    if (!ticket && !erreur) return;
    params.delete("google_ticket");
    params.delete("google_erreur");
    const reste = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${reste ? `?${reste}` : ""}`);
    if (ticket) googleTicketCallback.current({ ticket });
    else setGoogleAppErreur(erreur || "La connexion Google a échoué. Réessayez.");
  }, [enApplication]);
  async function ouvrirGoogleApplication() {
    setGoogleAppErreur("");
    try {
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");
      const { id } = await App.getInfo();
      await Browser.open({ url: `${window.location.origin}/api/auth/google/app/demarrer?app=${encodeURIComponent(id)}` });
    } catch {
      setGoogleAppErreur("Le navigateur du téléphone n'a pas pu s'ouvrir. Utilisez votre adresse email.");
    }
  }

  // Mot de passe oublié — appel réel au serveur (anti-énumération : toujours afficher succès)
  const forgotM = trpc.identity.password.forgot.useMutation({
    onSuccess: () => setForgotSent(true),
    onError: () => setForgotSent(true),
  });

  // Identifiant client Google : variable de construction si elle existe, sinon celle du serveur (lue à l'exécution).
  const googleConfig = trpc.auth.googleConfig.useQuery(undefined, { staleTime: Infinity, retry: 1 });
  const googleClientId = GOOGLE_CLIENT_ID || googleConfig.data?.clientId || null;
  const [googleEtat, setGoogleEtat] = useState<"chargement" | "pret" | "indisponible">("chargement");
  const googleCallback = useRef(googleM.mutate);
  googleCallback.current = googleM.mutate;

  useEffect(() => {
    // Pas de bouton Google dans « mot de passe oublié » ; il revient (et se redessine) quand on repasse en connexion ou inscription.
    if (!googleClientId || mode === "forgot" || enApplication || googleConfig.isLoading || googleConfig.data?.site) return;
    setGoogleEtat("chargement");
    let annule = false;
    let essais = 0;
    // Le script de Google est chargé en différé : on attend qu'il soit là au lieu de renoncer au premier rendu.
    const tenter = () => {
      if (annule) return;
      const gsi = window.google?.accounts?.id;
      const conteneur = googleDiv.current;
      if (gsi && conteneur) {
        gsi.initialize({
          client_id: googleClientId,
          callback: (resp: { credential: string }) => googleCallback.current({ idToken: resp.credential }),
        });
        conteneur.innerHTML = "";
        gsi.renderButton(conteneur, {
          theme: "outline",
          size: "large",
          width: Math.min(400, Math.max(200, conteneur.offsetWidth || 320)),
          text: "continue_with",
          locale: "fr",
        });
        setGoogleEtat("pret");
        return;
      }
      essais += 1;
      if (essais > 50) {
        setGoogleEtat("indisponible");
        return;
      }
      window.setTimeout(tenter, 200);
    };
    tenter();
    return () => {
      annule = true;
    };
  }, [googleClientId, mode, enApplication, googleConfig.isLoading, googleConfig.data?.site]);

  const err = loginM.error || registerM.error || googleM.error || googleTicketM.error;

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#FAFAFA] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo + Bienvenue — logo OUVERT (Version 2 – Lune) : surface app principale */}
        <div className="mb-8 text-center">
          <img
            src="/logo-open.png"
            alt="MKA.P-MS"
            className="mx-auto mb-3 h-16 w-auto"
            draggable={false}
          />
          {/* Nom officiel de marque (image charte) — remplace l'ancien texte */}
          <img
            src="/brand/wordmark.png"
            alt="MKA.P-MS"
            className="mx-auto h-7 w-auto"
            draggable={false}
          />
          {/* Slogan officiel (image charte) */}
          <img
            src="/brand/slogan.png"
            alt="PROTÉGER · RELIER · SERVIR LE MONDE ENTIER"
            className="mx-auto mt-2 h-3 w-auto"
            draggable={false}
          />
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
              {enApplication ? (
                googleConfig.data?.application ? (
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void ouvrirGoogleApplication()}
                      disabled={googleTicketM.isPending}
                      className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-full border border-[#DADCE0] bg-white px-4 text-sm font-medium text-[#3C4043] disabled:opacity-60"
                      data-testid="google-bouton-application"
                    >
                      <span className="text-base font-bold text-[#4285F4]">G</span>
                      {mode === "register" ? "S'inscrire avec Google" : "Continuer avec Google"}
                    </button>
                    {googleTicketM.isPending && <p className="text-xs text-[#9CA3AF]">Connexion en cours…</p>}
                    {googleAppErreur && <p className="text-center text-xs text-red-600">{googleAppErreur}</p>}
                  </div>
                ) : googleConfig.isLoading ? (
                  <p className="text-center text-xs text-[#9CA3AF]">Chargement de la connexion Google…</p>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#E5E7EB] px-4 py-3 text-center text-sm text-[#6B7280]" data-testid="google-non-configure">
                    La connexion avec Google n'est pas encore activée dans l'application. Utilisez votre adresse email ci-dessous.
                  </div>
                )
              ) : googleConfig.data?.site ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.location.assign("/api/auth/google/app/site")}
                    disabled={googleTicketM.isPending}
                    className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-full border border-[#DADCE0] bg-white px-4 text-sm font-medium text-[#3C4043] disabled:opacity-60"
                    data-testid="google-bouton-site"
                  >
                    <span className="text-base font-bold text-[#4285F4]">G</span>
                    {mode === "register" ? "S'inscrire avec Google" : "Continuer avec Google"}
                  </button>
                  {googleTicketM.isPending && <p className="text-xs text-[#9CA3AF]">Connexion en cours…</p>}
                  {googleAppErreur && <p className="text-center text-xs text-red-600">{googleAppErreur}</p>}
                </div>
              ) : googleClientId ? (
                <div className="flex flex-col items-center gap-2">
                  <div ref={googleDiv} className="flex min-h-[44px] w-full justify-center" data-testid="google-bouton" />
                  {googleEtat === "chargement" && <p className="text-xs text-[#9CA3AF]">Chargement de la connexion Google…</p>}
                  {googleEtat === "indisponible" && (
                    <p className="text-xs text-red-600" role="alert">
                      Google n'a pas pu se charger sur ce navigateur (bloqueur de contenu ou réseau). Utilisez votre adresse email.
                    </p>
                  )}
                  {googleM.isPending && <p className="text-xs text-[#9CA3AF]">Connexion en cours…</p>}
                </div>
              ) : googleConfig.isLoading ? (
                <p className="text-center text-xs text-[#9CA3AF]">Chargement de la connexion Google…</p>
              ) : (
                // Aucun identifiant Google configuré : on le dit, on ne montre pas un bouton qui ne fait rien.
                <div className="rounded-xl border border-dashed border-[#E5E7EB] px-4 py-3 text-center text-sm text-[#6B7280]" data-testid="google-non-configure">
                  La connexion avec Google n'est pas encore activée sur ce site. Utilisez votre adresse email ci-dessous.
                </div>
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
                className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#C5A028] disabled:opacity-50"
                disabled={forgotM.isPending || !form.email || forgotSent}
                onClick={() => forgotM.mutate({ email: form.email })}
              >
                {forgotM.isPending ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
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
