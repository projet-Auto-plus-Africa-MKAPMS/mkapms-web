import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { user, refreshUser } = useAuth() as any;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verifyM = trpc.identity.email.verify.useMutation({
    onSuccess: () => {
      setStatus("success");
      // Rafraîchir le profil si connecté pour mettre à jour emailVerified
      if (refreshUser) refreshUser().catch(() => {});
    },
    onError: (e) => {
      setStatus("error");
      setMessage(e.message || "Lien invalide ou expiré.");
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Aucun token de vérification trouvé dans l'URL.");
      return;
    }
    verifyM.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-5">
        {/* Logo */}
        <img src="/logo-open.png" alt="MKA.P-MS" className="mx-auto h-14 w-auto" draggable={false} />

        {status === "loading" && (
          <>
            <Loader2 size={40} className="mx-auto animate-spin text-[#D4AF37]" />
            <p className="text-sm font-medium text-slate-600">Vérification de votre adresse email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 size={48} className="mx-auto text-green-500" />
            <h1 className="text-lg font-bold text-slate-800">Email vérifié !</h1>
            <p className="text-sm text-slate-500">
              Votre adresse email a bien été confirmée. Un badge vert apparaît maintenant sur votre profil.
            </p>
            <Link
              to="/compte"
              className="inline-block w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-white hover:bg-[#C5A028] transition"
            >
              Accéder à mon compte
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={48} className="mx-auto text-red-500" />
            <h1 className="text-lg font-bold text-slate-800">Lien invalide</h1>
            <p className="text-sm text-slate-500">{message}</p>
            <p className="text-xs text-slate-400">
              Le lien a peut-être expiré (valable 24h). Vous pouvez en demander un nouveau depuis votre espace compte.
            </p>
            <Link
              to="/connexion"
              className="inline-block w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
