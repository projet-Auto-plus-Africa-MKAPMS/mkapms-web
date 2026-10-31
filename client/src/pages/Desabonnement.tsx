import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { trpc } from "../lib/trpc";

export default function Desabonnement() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const unsubscribeM = trpc.marketing.unsubscribe.useMutation({
    onSuccess: (r) => setStatus(r.ok ? "success" : "error"),
    onError: () => setStatus("error"),
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    unsubscribeM.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-5">
        <img src="/logo-open.png" alt="MKA.P-MS" className="mx-auto h-14 w-auto" draggable={false} />

        {status === "loading" && (
          <>
            <Loader2 size={40} className="mx-auto animate-spin text-[#D4AF37]" />
            <p className="text-sm font-medium text-slate-600">Traitement de votre demande…</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 size={48} className="mx-auto text-green-500" />
            <h1 className="text-lg font-bold text-slate-800">Désabonnement confirmé</h1>
            <p className="text-sm text-slate-500">
              Vous ne recevrez plus d'e-mails de la lettre d'information MKA.P-MS.
            </p>
            <Link to="/" className="inline-block w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-white hover:bg-[#C5A028] transition">
              Retour à l'accueil
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={48} className="mx-auto text-red-500" />
            <h1 className="text-lg font-bold text-slate-800">Lien invalide</h1>
            <p className="text-sm text-slate-500">Ce lien de désabonnement n'est plus valable ou a déjà été utilisé.</p>
            <Link to="/" className="inline-block w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
              Retour à l'accueil
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
