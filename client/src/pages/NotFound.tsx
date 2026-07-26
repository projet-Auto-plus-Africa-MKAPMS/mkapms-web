import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { trpc } from "../lib/trpc";

export default function NotFound() {
  const location = useLocation();
  const report = trpc.redirectionEngine.reportOutcome.useMutation();
  const reported = useRef<string | null>(null);

  // Remonte automatiquement la route cassée au Moteur de Redirection (§5).
  useEffect(() => {
    const path = location.pathname;
    if (reported.current === path) return;
    reported.current = path;
    report.mutate({ key: "route_404", source: path, outcome: "not_found" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="container-page py-24 text-center">
      <div className="text-6xl font-extrabold text-gold-dark">404</div>
      <p className="mt-3 text-slate-500">Cette page n'existe pas.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">Retour à l'accueil</Link>
    </div>
  );
}
