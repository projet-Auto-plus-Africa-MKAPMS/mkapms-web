import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const heal = trpc.redirectionEngine.resolvePath.useMutation();
  const handled = useRef<string | null>(null);
  const [healing, setHealing] = useState(true);

  // Auto-résolution des 404 par le Moteur de Redirection (§5) : on demande au
  // moteur s'il connaît un correctif pour ce chemin ; si oui, il nous redirige
  // automatiquement vers la bonne page. Sinon il journalise le 404.
  useEffect(() => {
    const path = location.pathname;
    if (handled.current === path) return;
    handled.current = path;
    setHealing(true);
    heal.mutate(
      { path },
      {
        onSuccess: (r) => {
          if (r.healed && r.target) navigate(r.target, { replace: true });
          else setHealing(false);
        },
        onError: () => setHealing(false),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (healing) {
    return (
      <div className="container-page py-24 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#D4AF37]" />
        <p className="mt-4 text-slate-500">Un instant, nous vous redirigeons vers la bonne page…</p>
      </div>
    );
  }

  return (
    <div className="container-page py-24 text-center">
      <div className="text-6xl font-extrabold text-gold-dark">404</div>
      <p className="mt-3 text-slate-500">Cette page n'existe pas.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">Retour à l'accueil</Link>
    </div>
  );
}
