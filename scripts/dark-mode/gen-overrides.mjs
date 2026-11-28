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
const denylist = new Set(['border-white', 'border-black']);

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
    if (prop === 'background-color') {
      if (sat <= 0.10) {
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
      if (sat <= 0.10) {
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
