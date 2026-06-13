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
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", profileType: "particulier" });
  const googleDiv = useRef<HTMLDivElement>(null);

  const loginM = trpc.auth.login.useMutation({
    onSuccess: (r) => { login(r.token, r.user as any); navigate("/compte"); },
  });
  const registerM = trpc.auth.register.useMutation({
    onSuccess: (r) => {
      login(r.token, r.user as any);
      const prof = getProfile(r.profileType);
      // Profils pro : on les envoie soumettre leurs documents (validation requise).
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
      width: 320,
      text: "continue_with",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const err = loginM.error || registerM.error || googleM.error;

  return (
    <div className="container-page py-12">
      <div className="card mx-auto max-w-md p-8">
        <h1 className="text-center text-2xl font-extrabold text-slate-900">
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h1>

        <div className="mt-6 space-y-3">
          {mode === "register" && (
            <>
              <input className="input" placeholder="Nom complet" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Type de compte</label>
                <select className="input" value={form.profileType} onChange={(e) => setForm((f) => ({ ...f, profileType: e.target.value }))}>
                  {PROFILE_LIST.map((p) => (
                    <option key={p.type} value={p.type}>{p.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">{getProfile(form.profileType)?.description}</p>
              </div>
            </>
          )}
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <input className="input" type="password" placeholder="Mot de passe" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />

          {err && <p className="text-sm text-red-600">{err.message}</p>}

          {mode === "login" ? (
            <button className="btn-primary w-full" disabled={loginM.isPending} onClick={() => loginM.mutate({ email: form.email, password: form.password })}>
              {loginM.isPending ? "Connexion…" : "Se connecter"}
            </button>
          ) : (
            <button className="btn-primary w-full" disabled={registerM.isPending} onClick={() => registerM.mutate({ email: form.email, password: form.password, name: form.name, phone: form.phone || undefined, profileType: form.profileType as any })}>
              {registerM.isPending ? "Création…" : "Créer mon compte"}
            </button>
          )}
        </div>

        {GOOGLE_CLIENT_ID && (
          <div className="mt-6">
            <div className="relative my-4 text-center text-xs text-slate-400">
              <span className="bg-white px-2">ou</span>
              <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-slate-200" />
            </div>
            <div ref={googleDiv} className="flex justify-center" />
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
          <button className="font-semibold text-gold-dark" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Créer un compte" : "Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
}
