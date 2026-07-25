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
 * Le nom de marque « MKA.P-MS » (blason au-dessus, nom en dessous) est fourni
 * comme image officielle `/brand/wordmark.png` — lettres exactes de la charte :
 * M or, K bleu (trait supérieur passant au-dessus du A), A or, P bleu ouvert à
 * gauche, tiret or, M or, S bleu à flèche inférieure. Couleurs officielles :
 * Or #FFD700, Bleu #0086FF, Bleu ciel #7FD3FF, Blanc #FFFFFF.
 *
 * ⚠️ Ne jamais recréer le logo/nom à partir de texte. Toujours consommer les
 * images fournies par la marque.
 */
import type { ImgHTMLAttributes } from "react";

type LogoVariant = "open" | "closed";

const SRC: Record<LogoVariant, string> = {
  open: "/logo-open.png",
  closed: "/logo-closed.png",
};

const ALT: Record<LogoVariant, string> = {
  open: "MKA.P-MS — logo officiel (état ouvert / visiteur)",
  closed: "MKA.P-MS — logo officiel (état fermé / membre)",
};

const WORDMARK_SRC = "/brand/wordmark.png";

export interface LogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  variant?: LogoVariant;
  /** Hauteur du blason en pixels (le ratio est conservé). */
  size?: number;
  /** Affiche le nom de marque officiel « MKA.P-MS » sous le blason. */
  withWordmark?: boolean;
  /** Affiche le sous-titre "La marketplace automobile" sous le nom. */
  withTagline?: boolean;
  /** Force l'alt pour l'accessibilité. */
  alt?: string;
}

export function Logo({
  variant = "open",
  size = 40,
  withWordmark = false,
  withTagline = false,
  alt,
  className = "",
  ...rest
}: LogoProps) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <img
        src={SRC[variant]}
        alt={alt ?? ALT[variant]}
        height={size}
        style={{ height: size, width: "auto", display: "block" }}
        draggable={false}
        {...rest}
      />
      {withWordmark && (
        <img
          src={WORDMARK_SRC}
          alt="MKA.P-MS"
          style={{ height: Math.max(10, Math.round(size * 0.42)), width: "auto", display: "block" }}
          className="mt-1 select-none"
          draggable={false}
        />
      )}
      {withTagline && (
        <span className="mt-1 whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          La marketplace automobile
        </span>
      )}
    </span>
  );
}

export default Logo;
