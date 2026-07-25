/**
 * WordmarkMKAPMS — signature typographique premium officielle.
 *
 * Rendu en SVG pour un contrôle pixel-parfait sur tous les appareils
 * (mobile / tablette / desktop / print) et tous les domaines
 * (.fr / .pro / .site). Zéro dépendance de police d'exécution.
 *
 * Palette :
 *   - Noir profond   #0B0B0F (encre)
 *   - Or MKA.P-MS    #D4AF37 (accent luxe)
 *
 * Détails de style (marque mondiale, uniques) :
 *   • Serif haute-contraste inspiré Didone/Playfair — moderne, luxe.
 *   • Lettres accentuées EN OR : "A", ".", "-" (rythme visuel).
 *   • "P" à tête OUVERTE — la boucle ne rejoint pas la hampe (open counter).
 *   • Petites capitales serifées avec espacement laqué (letter-spacing raffiné).
 *   • Fine ligne dorée sous la baseline pour ancrer la signature.
 *
 * Le wordmark est vectoriel : il s'adapte à toute taille sans perte,
 * et prend la couleur d'accompagnement via CSS `currentColor` (variante ink).
 */
import type { CSSProperties } from "react";

export interface WordmarkMKAPMSProps {
  /** Hauteur cible (px). Le ratio est conservé. */
  height?: number;
  /** Encre principale (par défaut noir MKA.P-MS). */
  ink?: string;
  /** Or accent (par défaut #D4AF37). */
  gold?: string;
  /** Affiche la fine ligne dorée sous le wordmark. */
  underline?: boolean;
  className?: string;
  style?: CSSProperties;
  "data-testid"?: string;
}

/**
 * Ce composant utilise des chemins SVG faits main pour un rendu premium
 * et cohérent sur TOUS les appareils. Chaque glyphe est dessiné dans
 * une grille de 60×80 (letter box) avec kerning manuel via l'attribut x.
 *
 * Cadence horizontale (unités SVG) :
 *   M(0)  K(70)  A(140)  .(210)  P(240)  -(300)  M(345)  S(415)
 */
export function WordmarkMKAPMS({
  height = 22,
  ink = "#0B0B0F",
  gold = "#D4AF37",
  underline = true,
  className = "",
  style,
  ...rest
}: WordmarkMKAPMSProps) {
  return (
    <svg
      viewBox="0 0 480 96"
      role="img"
      aria-label="MKA.P-MS"
      height={height}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ height, width: "auto", display: "block", ...style }}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <defs>
        {/* Ligature dorée sous baseline */}
        <linearGradient id="mkapms-goldline" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={gold} stopOpacity="0" />
          <stop offset="0.15" stopColor={gold} stopOpacity="0.9" />
          <stop offset="0.85" stopColor={gold} stopOpacity="0.9" />
          <stop offset="1" stopColor={gold} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ═══ M (noir) ═══ Serif haute-contraste */}
      <g fill={ink}>
        <path d="M2 82 L2 14 L18 14 L34 62 L38 62 L54 14 L70 14 L70 82 L60 82 L60 28 L45 76 L27 76 L12 28 L12 82 Z" />
        {/* Empattements top */}
        <rect x="-2" y="12" width="14" height="4" />
        <rect x="60" y="12" width="14" height="4" />
        {/* Empattements bottom */}
        <rect x="-3" y="80" width="20" height="4" />
        <rect x="55" y="80" width="20" height="4" />
      </g>

      {/* ═══ K (noir) ═══ */}
      <g fill={ink}>
        <path d="M85 14 L95 14 L95 46 L118 14 L130 14 L108 44 L133 82 L120 82 L100 52 L95 58 L95 82 L85 82 Z" />
        <rect x="82" y="12" width="16" height="4" />
        <rect x="82" y="80" width="16" height="4" />
        <rect x="119" y="80" width="16" height="4" />
      </g>

      {/* ═══ A (OR — lettre accentuée) ═══ */}
      <g fill={gold}>
        <path d="M139 82 L157 14 L169 14 L187 82 L177 82 L172 62 L154 62 L149 82 Z M156 55 L170 55 L163 24 Z" />
        <rect x="137" y="80" width="16" height="4" />
        <rect x="173" y="80" width="16" height="4" />
        <rect x="158" y="12" width="10" height="3" />
      </g>

      {/* ═══ . (OR — point accent) ═══ */}
      <circle cx="203" cy="78" r="5" fill={gold} />

      {/* ═══ P (noir) — tête OUVERTE (open counter) — signature de la marque ═══ */}
      <g fill={ink}>
        {/* Hampe verticale */}
        <path d="M218 14 L228 14 L228 82 L218 82 Z" />
        {/* Boucle supérieure ouverte : partie gauche (verticale + haut) */}
        <path d="M228 14 L252 14 L252 20 L228 20 Z" />
        {/* Boucle : côté droit descendant (le haut-droit reste OUVERT) */}
        <path d="M254 24 L262 24 Q268 24 268 32 L268 40 Q268 46 262 46 L228 46 L228 40 L258 40 L258 32 L254 32 Z" />
        {/* Empattements */}
        <rect x="215" y="12" width="16" height="4" />
        <rect x="215" y="80" width="16" height="4" />
      </g>

      {/* ═══ - (OR — trait d'union stylisé) ═══ */}
      <rect x="278" y="44" width="20" height="5" rx="1" fill={gold} />

      {/* ═══ M (noir) ═══ */}
      <g fill={ink}>
        <path d="M308 82 L308 14 L324 14 L340 62 L344 62 L360 14 L376 14 L376 82 L366 82 L366 28 L351 76 L333 76 L318 28 L318 82 Z" />
        <rect x="304" y="12" width="14" height="4" />
        <rect x="366" y="12" width="14" height="4" />
        <rect x="303" y="80" width="20" height="4" />
        <rect x="361" y="80" width="20" height="4" />
      </g>

      {/* ═══ S (noir) — serif classique ═══ */}
      <g fill={ink}>
        <path d="M395 66 Q395 82 415 82 L425 82 Q447 82 447 66 Q447 54 435 50 L412 44 Q402 42 402 34 Q402 22 418 22 L426 22 Q443 22 443 34 L433 34 Q433 30 424 30 L418 30 Q412 30 412 34 Q412 38 420 40 L442 46 Q457 50 457 64 Q457 82 425 82 L415 82 Q385 82 385 66 Z M418 14 L426 14 L426 22 L418 22 Z M416 82 L428 82 L428 90 L416 90 Z" />
      </g>

      {/* Fine ligne dorée sous baseline — signature visuelle premium */}
      {underline && <rect x="0" y="92" width="480" height="2" fill="url(#mkapms-goldline)" />}
    </svg>
  );
}

export default WordmarkMKAPMS;
