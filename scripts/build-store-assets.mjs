#!/usr/bin/env node
/**
 * Visuels obligatoires du Google Play Store, fabriqués depuis la charte.
 *
 * Google refuse une fiche sans icône 512×512 et sans bannière 1024×500. Les
 * deux sont produites ici à partir des fichiers de marque du dépôt : aucun
 * visuel dessiné à la main, donc aucune divergence avec la charte au fil des
 * publications.
 *
 *   node scripts/build-store-assets.mjs
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const marque = join(racine, "client", "public");
const sortie = join(racine, "store", "google-play");
mkdirSync(sortie, { recursive: true });

const LARGEUR = 1024;
const HAUTEUR = 500;

async function redimensionner(fichier, largeur) {
  return sharp(join(marque, fichier)).resize({ width: largeur }).png().toBuffer();
}

async function banniere() {
  const [blason, nom, slogan] = await Promise.all([
    redimensionner("brand/logo-open.png", 300),
    redimensionner("brand/wordmark.png", 620),
    redimensionner("brand/slogan.png", 560),
  ]);

  const tailles = await Promise.all(
    [blason, nom, slogan].map((b) => sharp(b).metadata()),
  );
  const [hBlason, hNom, hSlogan] = tailles.map((m) => m.height ?? 0);
  const espaceNom = 4;
  const espaceSlogan = 18;
  const total = hBlason + espaceNom + hNom + espaceSlogan + hSlogan;
  let y = Math.round((HAUTEUR - total) / 2);

  const centre = (m) => Math.round((LARGEUR - (m.width ?? 0)) / 2);
  const couches = [];
  couches.push({ input: blason, left: centre(tailles[0]), top: y });
  y += hBlason + espaceNom;
  couches.push({ input: nom, left: centre(tailles[1]), top: y });
  y += hNom + espaceSlogan;
  couches.push({ input: slogan, left: centre(tailles[2]), top: y });

  // Fond de la charte : noir profond réchauffé d'une lueur dorée centrale.
  const lueur = await sharp(
    Buffer.from(
      `<svg width="${LARGEUR}" height="${HAUTEUR}"><rect width="${LARGEUR}" height="${HAUTEUR}" fill="#000"/>` +
        `<ellipse cx="${LARGEUR / 2}" cy="${HAUTEUR / 2}" rx="430" ry="200" fill="#3a2a06"/></svg>`,
    ),
  )
    .blur(90)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: LARGEUR,
      height: HAUTEUR,
      channels: 4,
      background: { r: 6, g: 6, b: 8, alpha: 1 },
    },
  })
    .composite([{ input: lueur, blend: "screen" }, ...couches])
    .png()
    .toFile(join(sortie, "feature-graphic-1024x500.png"));
}

async function icone() {
  await sharp(join(marque, "icon-512.png"))
    .resize(512, 512)
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .png()
    .toFile(join(sortie, "icon-512x512.png"));
}

await icone();
await banniere();
console.log(`Visuels Google Play écrits dans ${sortie}.`);
