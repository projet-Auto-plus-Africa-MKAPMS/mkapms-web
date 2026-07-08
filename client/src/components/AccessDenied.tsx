import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { trpc } from "../lib/trpc";
import { ACCESS_DENIED_MESSAGE } from "@shared/permissions";

/**
 * Écran "Accès non autorisé" (Permission Engine §8).
 * Aucune donnée sensible n'est affichée, et la tentative est journalisée.
 */
export default function AccessDenied({ module }: { module?: string }) {
  const logDenied = trpc.permissionEngine.logDenied.useMutation();

  useEffect(() => {
    logDenied.mutate({
      module,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      reason: "ui_forbidden",
    });
    // On ne journalise qu'une fois au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-50">
        <ShieldAlert className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">{ACCESS_DENIED_MESSAGE}</h1>
      <p className="mt-2 text-sm text-slate-500">
        Vous n'avez pas les droits nécessaires pour accéder à cette page.
      </p>
      <Link to="/" className="btn-primary mt-6 inline-flex">Retour à l'accueil</Link>
    </div>
  );
}
