#!/usr/bin/env node
/**
 * Régénère le bloc d'utilitaires neutres du mode sombre (client/src/index.css,
 * section "Classes utilitaires neutres") à partir du CSS réellement compilé,
 * au lieu de les lister à la main — garantit que seules des classes qui
 * existent vraiment sont ciblées, avec la bonne casse/échappement.
 *
 *   npm run build:client
 *   node scripts/dark-mode/gen-overrides.mjs dist/public/assets/index-*.css
 *
 * Copier la sortie dans index.css à la place du bloc existant, puis
 * reconstruire et vérifier visuellement (voir le commentaire au-dessus du
 * bloc dans index.css pour la politique : neutres uniquement, jamais une
 * couleur de marque/statut).
 */
import { readFileSync } from 'fs';

const cssPath = process.argv[2];
const css = readFileSync(cssPath, 'utf8');

// Strip every @-rule block (balanced braces) so only flat, plain utility
// class rules remain — this naturally excludes anything already inside a
// @media query (including our own hand-written dark-mode block).
function stripAtRules(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    if (src[i] === '@') {
      // find the opening brace of this at-rule
      let j = src.indexOf('{', i);
      if (j === -1) { out += src.slice(i); break; }
      let depth = 1, k = j + 1;
      while (k < src.length && depth > 0) {
        if (src[k] === '{') depth++;
        else if (src[k] === '}') depth--;
        k++;
      }
      i = k; // skip the whole at-rule block
    } else {
      out += src[i];
      i++;
    }
  }
  return out;
}

const flat = stripAtRules(css);

// Match simple single-class rules: .selector{decls}
// selector: no combinators/pseudo (no space, >, :, comma), and the leading
// "." must sit right at a rule boundary (start of file or right after a
// previous rule's "}") — otherwise we'd match the tail of a compound
// selector like ".group:hover .group-hover\:text-x" as if the descendant
// class were standalone, silently turning a hover-only effect permanent.
const ruleRe = /(?<=^|\})\s*\.((?:\\.|[^\s,{}:>+~])+)\{([^{}]*)\}/g;
let m;
const found = [];
while ((m = ruleRe.exec(flat))) {
  const selector = m[1];
  const decls = m[2];
  found.push({ selector, decls });
}

function luminance(r, g, b) {
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function saturation(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}
function spread(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}
// At very high lightness, the ratio-based saturation() above reads as
// "basically zero" for genuine pastel status tints too (a light green or
// red is, numerically, "low saturation" simply because it's so light) —
// confirmed by Devin Review finding real contrast breaks on bg-[#F0FDF4]/
// bg-[#FEF2F2]-style success/danger tints that slipped past that check.
// This looks at which channel(s) actually dominate instead: a true neutral
// off-white has R≈G≈B (allowing for a warm/cool cast where one channel
// trails smoothly), while a status tint has exactly one channel spiking
// (green) or exactly one channel suppressed relative to the other two
// being close together (red: G≈B both below R; blue/cyan: G and B both
// above R).
function hueTint(r, g, b) {
  const close = (a, b2, t) => Math.abs(a - b2) <= t;
  if (g - r >= 6 && g - b >= 6 && close(r, b, 10)) return true; // green
  if (r - g >= 8 && close(g, b, 8)) return true; // red/pink
  // Deliberately only green and red: Devin Review confirmed real contrast
  // breaks on both (bg-[#F0FDF4]/bg-[#F0F7EC] success tints, bg-[#FEF2F2]/
  // bg-[#FFF0F0] danger tints, each paired with an unflipped same-family
  // dark text). A blue/cyan branch was tried and dropped: it has no
  // confirmed bug behind it, and it wrongly caught legitimate cool-neutral
  // slate colors written as arbitrary hex (ex. border-[#CBD5E1], the exact
  // slate-300 value) — slate's own cool undertone reads the same as a pale
  // blue tint by channel difference alone. Likewise no yellow/amber branch:
  // this brand's warm cream/ivory neutrals (ex. #f7f2e5, confirmed visually
  // as a legitimate card surface) have the same R≈G>>B shape as a pale
  // amber warning tint and can't be told apart by color alone.
  return false;
}
function hexToRgb(hex) {
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const DARK = {
  bgDeep: hexToRgb('0f172a'),
  bgMid: hexToRgb('1e293b'),
  text50: hexToRgb('f8fafc'),
  text100: hexToRgb('f1f5f9'),
  text200: hexToRgb('e2e8f0'),
  text300: hexToRgb('cbd5e1'),
  borderLight: hexToRgb('475569'),
  borderMid: hexToRgb('334155'),
  borderDark: hexToRgb('1e293b'),
};

const rules = []; // { selector, prop, rgbTriplet, alphaExpr }
const seen = new Set();

const HUE_FAMILIES = 'amber|blue|cyan|emerald|fuchsia|green|indigo|lime|orange|pink|purple|red|rose|sky|teal|violet|yellow';
const hueFamilyRe = new RegExp(`^(?:bg|text|border|divide|ring|placeholder)-(?:${HUE_FAMILIES})-\\d+$`);
const denylist = new Set([
  'border-white', 'border-black', 'btn-gold', 'btn-reserver',
  // Handled by hand inside @layer components in index.css instead (so that
  // a status utility layered alongside them, e.g. `card bg-emerald-50`,
  // keeps priority over the dark override — see the comment there).
  'card', 'input', 'btn-outline', 'label', 'btn-signaler',
]);

for (const { selector, decls } of found) {
  // Named semantic/brand hue families (badges, alerts, accents) must keep
  // their hue identity in both themes — never treated as a neutral surface.
  if (hueFamilyRe.test(selector)) continue;
  if (denylist.has(selector)) continue;
  // skip anything that isn't a "plain" single utility class already
  // (defensive: ruleRe should already guarantee this)
  const alphaPat = '(?:\\s*\\/\\s*(var\\([^)]*\\)|[\\d.]+))?';
  const bgM = decls.match(new RegExp(`background-color:\\s*rgb\\(([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)${alphaPat}\\)`));
  const borderM = decls.match(new RegExp(`border-color:\\s*rgb\\(([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)${alphaPat}\\)`));
  const textM = decls.match(new RegExp(`(?<![a-z-])color:\\s*rgb\\(([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)${alphaPat}\\)`));

  for (const [prop, match] of [['background-color', bgM], ['border-color', borderM], ['color', textM]]) {
    if (!match) continue;
    const [, rs, gs, bs, alpha] = match;
    const r = parseFloat(rs), g = parseFloat(gs), b = parseFloat(bs);
    const lum = luminance(r, g, b);
    const sat = saturation(r, g, b);
    const spr = spread(r, g, b);
    let target = null;

    // Neutral-only: excludes tinted/pastel status colors (badges, alerts)
    // which must keep their hue identity in both themes.
    // hueTint() only makes sense for arbitrary hex values (bg-[#...]):
    // named slate/gray/zinc/... classes are already known-neutral by
    // Tailwind's own design (hueFamilyRe above already excludes the
    // colored families by name), even though slate's cool undertone can
    // trip the same channel-difference heuristic as a pale blue tint.
    const isArbitrary = /\\\[/.test(selector);
    const tinted = isArbitrary && hueTint(r, g, b);

    if (prop === 'background-color') {
      if (sat <= 0.10 && !tinted) {
        if (lum >= 0.93) target = DARK.bgDeep;
        else if (lum >= 0.78) target = DARK.bgMid;
      }
    } else if (prop === 'color') {
      if (spr <= 70) {
        if (lum <= 0.08) target = DARK.text50;
        else if (lum <= 0.15) target = DARK.text100;
        else if (lum <= 0.30) target = DARK.text200;
        else if (lum <= 0.45) target = DARK.text300;
      }
    } else if (prop === 'border-color') {
      if (sat <= 0.10 && !tinted) {
        if (lum >= 0.80) target = DARK.borderDark;
        else if (lum >= 0.70) target = DARK.borderMid;
        else if (lum >= 0.55) target = DARK.borderLight;
      }
    }
    if (!target) continue;

    const key = selector + '|' + prop;
    if (seen.has(key)) continue;
    seen.add(key);

    const alphaExpr = alpha ? alpha.trim() : '1';
    rules.push({ selector, prop, target, alphaExpr, lum: lum.toFixed(2), sat: sat.toFixed(2), orig: `rgb(${r} ${g} ${b})` });
  }
}

rules.sort((a, b) => a.selector.localeCompare(b.selector));

let outCss = '';
for (const r of rules) {
  outCss += `  .${r.selector} { ${r.prop}: rgb(${r.target[0]} ${r.target[1]} ${r.target[2]} / ${r.alphaExpr}); }\n`;
}

console.error(`Matched ${rules.length} override rules from ${found.length} candidate top-level class rules.`);
process.stdout.write(outCss);
