/**
 * <Logo /> — composant officiel MKA.P-MS.
 *
 * Deux variantes autorisées (charte de marque) :
 *  - "open"   : ÉTAT OUVERT (Visiteur / Découverte). Extrémités du blason
 *               ouvertes. Utilisé pour les visiteurs, le grand public, la
 *               communication et la découverte (accueil non connecté, splash…).
 *  - "closed" : ÉTAT FERMÉ (Membre / Protection). Extrémités fermées. Utilisé
 *               dès qu'un compte est créé / l'utilisateur connecté, et sur les
 *               documents officiels (factures, devis, contrats, certificats).
 *
 * Le wordmark « MKA.P-MS » est rendu via le composant SVG WordmarkMKAPMS —
 * vectoriel, parfaitement lisible à toute taille, sans coupure ni artefact.
 *
 * ⚠️ Ne jamais recréer le logo/nom à partir de texte brut.
 *    Toujours utiliser ce composant ou WordmarkMKAPMS directement.
 */
import type { ImgHTMLAttributes } from "react";
import { WordmarkMKAPMS } from "./WordmarkMKAPMS";

type LogoVariant = "open" | "closed";

const SRC: Record<LogoVariant, string> = {
  open: "/logo-open.png",
  closed: "/logo-closed.png",
};

const ALT: Record<LogoVariant, string> = {
  open: "MKA.P-MS — logo officiel (état ouvert / visiteur)",
  closed: "MKA.P-MS — logo officiel (état fermé / membre)",
};

export interface LogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  variant?: LogoVariant;
  /** Hauteur du blason en pixels (le ratio est conservé). */
  size?: number;
  /** Affiche le nom de marque officiel « MKA.P-MS » sous le blason (SVG vectoriel). */
  withWordmark?: boolean;
  /** Affiche le slogan officiel « PROTÉGER · RELIER · SERVIR LE MONDE ENTIER » sous le nom. */
  withSlogan?: boolean;
  /** Force l'alt pour l'accessibilité. */
  alt?: string;
}

export function Logo({
  variant = "open",
  size = 40,
  withWordmark = false,
  withSlogan = false,
  alt,
  className = "",
  ...rest
}: LogoProps) {
  // Hauteur du wordmark SVG : proportionnelle au blason, minimum 14px pour lisibilité.
  const wordmarkHeight = Math.max(14, Math.round(size * 0.52));
  // Hauteur du slogan : plus petit que le wordmark.
  const sloganHeight = Math.max(8, Math.round(size * 0.20));

  return (
    <span
      className={`inline-flex flex-col items-center leading-none ${className}`}
      style={{ overflow: "visible" }}
    >
      {/* Blason — image PNG officielle */}
      <img
        src={SRC[variant]}
        alt={alt ?? ALT[variant]}
        height={size}
        style={{ height: size, width: "auto", display: "block" }}
        draggable={false}
        {...rest}
      />

      {/* Wordmark SVG — vectoriel, lisible à toute taille, sans coupure */}
      {withWordmark && (
        <WordmarkMKAPMS
          height={wordmarkHeight}
          className="mt-0.5 select-none"
          style={{ display: "block", overflow: "visible" }}
        />
      )}

      {/* Slogan — image PNG officielle */}
      {withSlogan && (
        <img
          src="/brand/slogan.png"
          alt="PROTÉGER · RELIER · SERVIR LE MONDE ENTIER"
          style={{ height: sloganHeight, width: "auto", display: "block" }}
          className="mt-1 select-none"
          draggable={false}
        />
      )}
    </span>
  );
}

export default Logo;
