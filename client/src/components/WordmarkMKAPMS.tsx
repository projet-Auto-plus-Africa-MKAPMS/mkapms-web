/**
 * WordmarkMKAPMS — signature typographique premium officielle.
 *
 * ⚠️ CHARTE DE MARQUE — À NE PAS MODIFIER SANS AUTORISATION :
 *   - Ordre EXACT des glyphes : M · K · A · . · P · - · M · S
 *   - Le "." est collé au A (composition "A.")
 *   - Le "-" est entre P et M (composition "P-M")
 *   - Les POSITIONS relatives du point et du tiret sont figées.
 *
 * Palette OFFICIELLE (charte 2026) :
 *   - OR PRESTIGE       #FFD700
 *   - BLEU LUMINEUX     #0086FF
 *   - BLEU CIEL         #7FD3FF (highlights)
 *   - BLANC PUR         #FFFFFF
 *
 * Composition par glyphe (charte officielle) :
 *   M, K, A, ., -, M   →  OR (protéger, relier)
 *   P                   →  BLEU + queue courbée descendante (accès, ouverture)
 *   S                   →  BLEU + flèche stylisée en haut-droite (mouvement, expansion mondiale)
 *
 * Baseline officielle (option) :
 *   "PROTÉGER • RELIER • SERVIR LE MONDE ENTIER"
 *
 * Typographie : Raleway 900 (chargée dans index.html).
 */
import type { CSSProperties } from "react";

export interface WordmarkMKAPMSProps {
  /** Hauteur cible (px). Le ratio est conservé. */
  height?: number;
  /** Or officiel (par défaut #FFD700). */
  gold?: string;
  /** Bleu lumineux officiel (par défaut #0086FF). */
  blue?: string;
  /** Bleu ciel highlight (par défaut #7FD3FF). */
  blueLight?: string;
  /** Affiche la baseline "PROTÉGER • RELIER • SERVIR LE MONDE ENTIER". */
  withTagline?: boolean;
  /** Couleur baseline (par défaut or). */
  taglineColor?: string;
  className?: string;
  style?: CSSProperties;
  "data-testid"?: string;
}

export function WordmarkMKAPMS({
  height = 28,
  gold = "#FFD700",
  blue = "#0086FF",
  blueLight = "#7FD3FF",
  withTagline = false,
  taglineColor,
  className = "",
  style,
  ...rest
}: WordmarkMKAPMSProps) {
  // viewBox : 560×70 sans tagline / 560×105 avec tagline.
  const vbW = 560;
  const vbH = withTagline ? 105 : 70;
  const fontFamily = "'Raleway', 'Helvetica Neue', Arial, sans-serif";

  // ═══ POSITIONS EXACTES DES GLYPHES (charte figée) ═══
  //
  // Chaque glyphe est positionné par son x-origin (bas-gauche), fontSize=58.
  // Le rythme respecte l'emplacement du point (collé à A) et du tiret
  // (entre P et M), conformément à la brand board officielle.
  //
  //   M ─ K ─ A . ─ P - M ─ S
  //   0   68  136 . 200 - 320 . 390
  const POS = {
    M1: 0,     // M
    K:  68,    // K
    A:  136,   // A
    dot: 197,  // . (collé à A)
    P:  216,   // P (petit décalage après le point)
    dash: 288, // - (entre P et M)
    M2: 322,   // M
    S:  390,   // S (rythme régulier avec les autres lettres)
  };

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      role="img"
      aria-label="MKA.P-MS · Protéger, Relier, Servir le monde entier"
      height={height}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ height, width: "auto", display: "block", ...style }}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <defs>
        {/* Gradient OR — highlight métallique premium */}
        <linearGradient id="wmk-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF3B0" />
          <stop offset="0.45" stopColor={gold} />
          <stop offset="1" stopColor="#B78D00" />
        </linearGradient>
        {/* Gradient BLEU — highlight lumineux (P & S) */}
        <linearGradient id="wmk-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={blueLight} />
          <stop offset="0.5" stopColor={blue} />
          <stop offset="1" stopColor="#0058B0" />
        </linearGradient>
      </defs>

      {/* ═══ GROUPE WORDMARK — Raleway 900, capitales espacées ═══ */}
      <g
        style={{
          fontFamily,
          fontWeight: 900,
        }}
      >
        {/* M — or */}
        <text x={POS.M1} y="52" fill="url(#wmk-gold)" fontSize="58" letterSpacing="1">M</text>
        {/* K — or */}
        <text x={POS.K} y="52" fill="url(#wmk-gold)" fontSize="58" letterSpacing="1">K</text>
        {/* A — or */}
        <text x={POS.A} y="52" fill="url(#wmk-gold)" fontSize="58" letterSpacing="1">A</text>

        {/* . — or (disque plein, position figée collée à A) */}
        <circle cx={POS.dot} cy="47" r="5" fill="url(#wmk-gold)" />

        {/* P — bleu premium (avec queue courbée descendante — signature ouverture) */}
        <text x={POS.P} y="52" fill="url(#wmk-blue)" fontSize="58" letterSpacing="1">P</text>
        {/* Queue-swoosh du P : courbe descendant à droite depuis le bas de la hampe */}
        <path
          d={`M ${POS.P + 12} 55 Q ${POS.P + 22} 66 ${POS.P + 40} 66`}
          stroke="url(#wmk-blue)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* - — or (tiret horizontal, position figée entre P et M) */}
        <rect x={POS.dash} y="41" width="28" height="9" rx="3" fill="url(#wmk-gold)" />

        {/* M — or */}
        <text x={POS.M2} y="52" fill="url(#wmk-gold)" fontSize="58" letterSpacing="1">M</text>

        {/* S — bleu premium (flèche stylisée en haut-droite — signature expansion mondiale) */}
        <text x={POS.S} y="52" fill="url(#wmk-blue)" fontSize="58" letterSpacing="1">S</text>
        {/* Flèche du S : trait diagonal montant depuis le haut du S vers le haut-droite */}
        <path
          d={`M ${POS.S + 42} 20 L ${POS.S + 62} 8 M ${POS.S + 62} 8 L ${POS.S + 52} 8 M ${POS.S + 62} 8 L ${POS.S + 62} 18`}
          stroke="url(#wmk-blue)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* ═══ BASELINE OFFICIELLE ═══ PROTÉGER • RELIER • SERVIR LE MONDE ENTIER */}
      {withTagline && (
        <g style={{ fontFamily, fontWeight: 700 }}>
          <text
            x="0"
            y="90"
            fill={taglineColor || gold}
            fontSize="12"
            letterSpacing="3.8"
          >
            PROTÉGER
          </text>
          <circle cx="118" cy="86.5" r="2" fill={taglineColor || gold} />
          <text
            x="137"
            y="90"
            fill={taglineColor || gold}
            fontSize="12"
            letterSpacing="3.8"
          >
            RELIER
          </text>
          <circle cx="228" cy="86.5" r="2" fill={taglineColor || gold} />
          <text
            x="247"
            y="90"
            fill={taglineColor || gold}
            fontSize="12"
            letterSpacing="3.8"
          >
            SERVIR LE MONDE ENTIER
          </text>
        </g>
      )}
    </svg>
  );
}

export default WordmarkMKAPMS;
