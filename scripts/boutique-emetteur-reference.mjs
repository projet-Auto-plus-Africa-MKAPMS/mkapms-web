#!/usr/bin/env node
/**
 * ÉMETTEUR DE RÉFÉRENCE de l'interrupteur local de la Boutique — à PORTER dans la Boutique par ses agents (ce dépôt ne touche pas à celui de la Boutique).
 *
 * Il montre, en un seul fichier sans dépendance, ce que la Boutique doit faire pour que son interrupteur local soit un vrai interrupteur du Centre Cyber-Électrique :
 *   1. VENIR CHERCHER les ordres du centre (GET /api/shop-link/v1/commutation/ordres) — la plateforme n'appelle jamais la Boutique ;
 *   2. les appliquer à SON interrupteur local (ouvrir ou fermer SA ligne : au minimum ne plus rien émettre vers la plateforme quand il est ouvert) ;
 *   3. renvoyer un ACCUSÉ SIGNÉ contenant l'état qu'elle OBSERVE elle-même (POST /api/shop-link/v1/commutation/accuse), jamais l'état « demandé ».
 * Chaque requête est signée en Ed25519 comme tous les messages de la Boutique (voir docs/CENTRE-COMMUTATION-BOUTIQUE-2026-10-09.md).
 *
 *   node scripts/boutique-emetteur-reference.mjs --generer-cle <fichier-cle-privee>     # écrit la clé privée, affiche la clé PUBLIQUE à enregistrer dans « Câble Boutique »
 *   node scripts/boutique-emetteur-reference.mjs --plateforme https://… --cle <fichier-cle-privee> --etat <fichier.json> [--une-fois] [--intervalle 5]
 *
 * Le fichier d'état est un JSON { "<ligne>": "connected" | "disconnected" } : l'interrupteur local de chaque ligne (ici un simple fichier ; dans la Boutique, son vrai état).
 */
import { createHash, createPrivateKey, generateKeyPairSync, randomBytes, sign } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const PREFIXE = "/api/shop-link";

/** Signe une requête exactement comme la plateforme la vérifie (service.ts : messageSigne / hashCorps). */
export function entetesSignes({ methode, chemin, corps, clePrivee, maintenant = Date.now() }) {
  const temps = String(maintenant);
  const nonce = randomBytes(16).toString("hex");
  const empreinte = createHash("sha256").update(methode.toUpperCase() === "GET" ? "" : JSON.stringify(corps ?? {})).digest("hex");
  const message = Buffer.from(["SHOP-LINK-1", methode.toUpperCase(), chemin, temps, nonce, empreinte].join("\n"));
  return {
    "content-type": "application/json",
    "x-shop-link-time": temps,
    "x-shop-link-nonce": nonce,
    "x-shop-link-signature": sign(null, message, clePrivee).toString("base64url"),
  };
}

async function appeler({ base, methode, chemin, corps, clePrivee, fetchImpl = fetch }) {
  const reponse = await fetchImpl(`${base}${chemin}`, {
    method: methode,
    headers: entetesSignes({ methode, chemin, corps, clePrivee }),
    body: methode === "GET" ? undefined : JSON.stringify(corps ?? {}),
  });
  let json = null;
  try {
    json = await reponse.json();
  } catch {
    /* corps vide ou illisible */
  }
  return { statut: reponse.status, json };
}

/**
 * Un cycle : prend les ordres, les applique à l'interrupteur local, accuse avec l'état OBSERVÉ.
 * `interrupteurs` : { lecture(ligne) -> "connected"|"disconnected"|null, ecriture(ligne, etat) } — l'interrupteur local de la Boutique.
 * `accepte(ordre)` : la Boutique peut REFUSER un ordre (elle reste maîtresse chez elle) ; elle accuse alors son état réel, inchangé.
 */
export async function cycle({ base, clePrivee, interrupteurs, accepte = () => true, rapporter = [], fetchImpl = fetch, maintenant = () => new Date() }) {
  const ordres = await appeler({ base, methode: "GET", chemin: `${PREFIXE}/v1/commutation/ordres`, clePrivee, fetchImpl });
  if (ordres.statut !== 200 || !ordres.json?.ok) return { ok: false, etape: "ordres", statut: ordres.statut, json: ordres.json };
  const accuses = [];
  for (const o of ordres.json.ordres ?? []) {
    if (new Date(o.expireLe).getTime() < Date.now()) continue; // un ordre périmé est ignoré
    const connu = interrupteurs.lecture(o.ligne);
    if (connu !== null && accepte(o)) interrupteurs.ecriture(o.ligne, o.voulu === "activate" ? "connected" : "disconnected");
    const observe = interrupteurs.lecture(o.ligne);
    if (observe === null) continue; // ligne inconnue de la Boutique : aucun accusé inventé
    accuses.push({ ordre: o.id, ligne: o.ligne, etat: observe, observeLe: maintenant().toISOString() });
  }
  for (const ligne of rapporter) {
    const observe = interrupteurs.lecture(ligne);
    if (observe !== null && !accuses.some((a) => a.ligne === ligne)) accuses.push({ ordre: null, ligne, etat: observe, observeLe: maintenant().toISOString() });
  }
  if (accuses.length === 0) return { ok: true, ordres: ordres.json.ordres?.length ?? 0, accuses: 0 };
  const envoi = await appeler({ base, methode: "POST", chemin: `${PREFIXE}/v1/commutation/accuse`, corps: { version: 1, accuses }, clePrivee, fetchImpl });
  return { ok: envoi.statut === 200 && !!envoi.json?.ok, ordres: ordres.json.ordres?.length ?? 0, accuses: accuses.length, reponse: envoi.json, statut: envoi.statut };
}

/** Interrupteurs locaux adossés à un fichier JSON (pour l'essai en ligne de commande). */
export function interrupteursFichier(fichier) {
  const lire = () => (existsSync(fichier) ? JSON.parse(readFileSync(fichier, "utf8")) : {});
  return {
    lecture: (ligne) => lire()[ligne] ?? null,
    ecriture: (ligne, etat) => writeFileSync(fichier, `${JSON.stringify({ ...lire(), [ligne]: etat }, null, 2)}\n`),
  };
}

const arg = (nom) => {
  const i = process.argv.indexOf(`--${nom}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

async function principal() {
  const generer = arg("generer-cle");
  if (generer) {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    writeFileSync(generer, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
    console.log(`Clé privée écrite dans ${generer} (à garder dans le coffre de la Boutique, jamais dans le dépôt).`);
    console.log("Clé PUBLIQUE à enregistrer dans la plateforme (écran « Câble Boutique » → clés) :");
    console.log(publicKey.export({ type: "spki", format: "der" }).toString("base64url"));
    return;
  }
  const base = arg("plateforme");
  const fichierCle = arg("cle");
  const etat = arg("etat");
  if (!base || !fichierCle || !etat) {
    console.error("Usage : --plateforme <url> --cle <fichier clé privée> --etat <fichier d'état> [--une-fois] [--intervalle <secondes>]  |  --generer-cle <fichier>");
    process.exit(2);
  }
  const clePrivee = createPrivateKey(readFileSync(fichierCle, "utf8"));
  const interrupteurs = interrupteursFichier(etat);
  const unTour = async () => {
    const r = await cycle({ base: base.replace(/\/$/, ""), clePrivee, interrupteurs, rapporter: Object.keys(JSON.parse(existsSync(etat) ? readFileSync(etat, "utf8") : "{}")) });
    console.log(new Date().toISOString(), r.ok ? `ordres ${r.ordres}, accusés ${r.accuses}` : `ÉCHEC (${r.etape ?? "accusé"}, HTTP ${r.statut})`);
    return r;
  };
  if (process.argv.includes("--une-fois")) {
    const r = await unTour();
    process.exit(r.ok ? 0 : 1);
  }
  const intervalle = Math.max(2, Number(arg("intervalle") ?? 5)) * 1000;
  for (;;) {
    await unTour().catch((e) => console.error("erreur :", e.message));
    await new Promise((r) => setTimeout(r, intervalle));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) principal();
