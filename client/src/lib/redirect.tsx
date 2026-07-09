/**
 * Connexion client au Moteur de Redirection MKA.P-MS.
 *
 * <SmartLink redirKey="bouton_x" fallback="/chemin-par-defaut"> résout la
 * destination via le moteur de redirection (règle configurée par le PDG). Si
 * aucune règle active n'existe, on utilise `fallback` : le bouton fonctionne
 * donc TOUJOURS, même sans règle. Cela permet de ne plus câbler les
 * redirections en dur tout en évitant tout risque de lien mort.
 */
import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { trpc } from "./trpc";

export function useResolvedTarget(redirKey: string, fallback: string) {
  const { data } = trpc.redirectionEngine.peek.useQuery(
    { key: redirKey },
    { staleTime: 60_000, retry: false },
  );
  const target = data?.matched && data.target ? data.target : fallback;
  const external = data?.matched ? !!data.external : /^https?:\/\//.test(fallback);
  return { target, external };
}

interface SmartLinkProps {
  redirKey: string;
  fallback: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const SmartLink = forwardRef<HTMLAnchorElement, SmartLinkProps>(
  ({ redirKey, fallback, className, children, onClick }, ref) => {
    const { target, external } = useResolvedTarget(redirKey, fallback);
    if (external) {
      return (
        <a ref={ref} href={target} target="_blank" rel="noreferrer" className={className} onClick={onClick}>
          {children}
        </a>
      );
    }
    return (
      <Link ref={ref} to={target} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  },
);
SmartLink.displayName = "SmartLink";
