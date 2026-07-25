/**
 * <Logo /> — composant officiel MKA.P-MS.
 *
 * Deux variantes autorisées (charte de marque) :
 *  - "open"   : Version 2 – Lune (Expansion). Extrémités ouvertes. Utilisée
 *               sur les surfaces principales de l'application (accueil,
 *               header, splash, PWA).
 *  - "closed" : Version 1 – Terre (Unité). Extrémités fermées. Utilisée
 *               à l'intérieur de l'application (headers de sections, pages
 *               internes) et surtout sur tous les documents générés
 *               (factures, devis, contrats, attestations, PDF).
 *
 * ⚠️ Ne jamais recréer le logo à partir de texte. Toujours consommer
 * `/logo-open.png` ou `/logo-closed.png` fournis par la marque.
 */
import type { ImgHTMLAttributes } from "react";

type LogoVariant = "open" | "closed";

const SRC: Record<LogoVariant, string> = {
  open: "/logo-open.png",
  closed: "/logo-closed.png",
};

const ALT: Record<LogoVariant, string> = {
  open: "MKA.P-MS — logo officiel (Lune / Expansion)",
  closed: "MKA.P-MS — logo officiel (Terre / Unité)",
};

export interface LogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  variant?: LogoVariant;
  /** Taille de hauteur en pixels (le ratio est conservé). */
  size?: number;
  /** Affiche le sous-titre "La marketplace automobile" sous le logo. */
  withTagline?: boolean;
  /** Force l'alt pour l'accessibilité. */
  alt?: string;
}

export function Logo({
  variant = "open",
  size = 40,
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
      {withTagline && (
        <span className="mt-1 whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          La marketplace automobile
        </span>
      )}
    </span>
  );
}

export default Logo;
