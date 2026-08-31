/**
 * Connexion client au Moteur de boutons MKA.P-MS.
 *
 * <BoutonMoteur code="garage_reception_devis"> ne décide pas de ce qu'il fait :
 * il demande son action au moteur. Selon la réponse :
 *
 *  - `navigation` : lien vers la destination donnée par le moteur (elle-même
 *    résolue par le Moteur de Redirection, donc modifiable par le PDG) ;
 *  - `appel` / `email` : lien `tel:` / `mailto:` construit sur le contact
 *    fourni par l'écran ;
 *  - `non_branchee` : le bouton reste inactif et AFFICHE ce qui manque. Pas de
 *    faux succès, pas de bouton muet.
 *
 * Chaque clic est signalé au moteur : un bouton qui mène au vide devient
 * visible côté direction sans qu'on ait besoin de le tester à la main.
 */
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { trpc } from "./trpc";

interface BoutonMoteurProps {
  code: string;
  className?: string;
  children: ReactNode;
  /** Numéro à composer pour une action `appel`. */
  telephone?: string;
  /** Adresse à ouvrir pour une action `email`. */
  email?: string;
  /** Paramètres ajoutés à la destination d'une action `navigation`. */
  query?: Record<string, string>;
  /** Exécution locale d'une action `document` ou `formulaire`. */
  onExecuter?: () => void;
}

function avecQuery(cible: string, query?: Record<string, string>): string {
  if (!query || Object.keys(query).length === 0) return cible;
  const params = new URLSearchParams(query).toString();
  return cible.includes("?") ? `${cible}&${params}` : `${cible}?${params}`;
}

export function BoutonMoteur({
  code,
  className,
  children,
  telephone,
  email,
  query,
  onExecuter,
}: BoutonMoteurProps) {
  const { data: action } = trpc.buttonEngine.resoudre.useQuery(
    { code },
    { staleTime: 60_000, retry: false },
  );
  const signaler = trpc.buttonEngine.signaler.useMutation();
  const [manque, setManque] = useState("");

  function tracer(resolvedTo: string, outcome: "navigated" | "not_found" = "navigated") {
    try {
      signaler.mutate({
        code,
        source: typeof window !== "undefined" ? window.location.pathname : undefined,
        outcome,
        resolvedTo,
      });
    } catch {
      /* supervision best-effort : ne bloque jamais l'action */
    }
  }

  // Tant que le moteur n'a pas répondu, le bouton reste présent mais inactif :
  // il ne peut pas inventer une action à sa place.
  if (!action) {
    return (
      <button type="button" className={className} disabled>
        {children}
      </button>
    );
  }

  if (action.genre === "navigation" && action.cible && !action.cibleCassee) {
    const cible = avecQuery(action.cible, query);
    return (
      <Link to={cible} className={className} onClick={() => tracer(cible)}>
        {children}
      </Link>
    );
  }

  if (action.genre === "appel" && telephone) {
    const cible = `tel:${telephone.replace(/\s/g, "")}`;
    return (
      <a href={cible} className={className} onClick={() => tracer(cible)}>
        {children}
      </a>
    );
  }

  if (action.genre === "email" && email) {
    const cible = `mailto:${email}`;
    return (
      <a href={cible} className={className} onClick={() => tracer(cible)}>
        {children}
      </a>
    );
  }

  if ((action.genre === "document" || action.genre === "formulaire") && onExecuter) {
    const trace = action.cible ?? action.genre;
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          tracer(trace);
          onExecuter();
        }}
      >
        {children}
      </button>
    );
  }

  // Action déclarée que rien n'exécute encore, ou destination cassée : on le
  // dit, et le moteur en garde la trace.
  const raison =
    action.cibleCassee && action.cible
      ? `Destination « ${action.cible} » introuvable : le Moteur de boutons l'a signalée à la direction.`
      : action.manque ??
        "Cette action n'est pas encore exécutable : le moteur ne connaît pas de traitement pour ce bouton.";

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          tracer(action.cible ?? code, "not_found");
          setManque(raison);
        }}
      >
        {children}
      </button>
      {manque && (
        <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-[10px] text-amber-800">
          {manque}
        </p>
      )}
    </>
  );
}
