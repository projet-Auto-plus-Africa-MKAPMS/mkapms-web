import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   ACCES PDG DISCRET
   Route cach\u00e9e \u2014 aucun lien vers cette page dans l'application.
   Seul le PDG conna\u00eet l'URL.
   ══════════════════════════════════════════════════════════════════════════ */

export default function AccesPDG() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("mka.garageauto@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginM = trpc.auth.login.useMutation({
    onSuccess: (r) => {
      login(r.token, r.user as any);
      navigate("/superadmin");
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30">
            <span className="text-xl font-black text-[#D4AF37]">M</span>
          </div>
          <p className="text-[10px] text-white/20 tracking-[0.3em] uppercase">Administration</p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter" && password) loginM.mutate({ email, password }); }}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
            placeholder="Mot de passe"
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={() => loginM.mutate({ email, password })}
            disabled={loginM.isPending || !password}
            className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-[#111] transition hover:bg-[#C5A028] disabled:opacity-40"
          >
            {loginM.isPending ? "..." : "Acc\u00e9der"}
          </button>
        </div>
      </div>
    </div>
  );
}
