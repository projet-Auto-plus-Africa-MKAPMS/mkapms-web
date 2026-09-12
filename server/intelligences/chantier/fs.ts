/**
 * Chantier de développement — Outils Système de Fichiers.
 *
 * Garde-fou unique et non contournable : toute opération reçoit le
 * `workspacePath` réel du projet (jamais choisi par l'appelant) et un chemin
 * relatif demandé ; `resoudre()` refuse tout chemin qui sortirait de ce
 * dossier (`..`, lien symbolique vers l'extérieur, chemin absolu étranger).
 * Aucune autre fonction de ce fichier n'accède au disque sans passer par elle.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export class CheminHorsWorkspace extends Error {}

/** Résout un chemin demandé (relatif au workspace) et vérifie le confinement. */
export async function resoudre(workspacePath: string, cheminDemande: string): Promise<string> {
  const racine = path.resolve(workspacePath);
  const cible = path.resolve(racine, cheminDemande || ".");
  if (cible !== racine && !cible.startsWith(racine + path.sep)) {
    throw new CheminHorsWorkspace(
      `Chemin refusé : « ${cheminDemande} » sortirait du workspace du projet.`,
    );
  }
  // Un lien symbolique pourrait pointer hors du workspace même si le chemin
  // demandé, lui, y reste : on résout aussi la cible réelle quand elle existe.
  try {
    const reel = await fs.realpath(cible);
    const racineReelle = await fs.realpath(racine);
    if (reel !== racineReelle && !reel.startsWith(racineReelle + path.sep)) {
      throw new CheminHorsWorkspace(
        `Chemin refusé : « ${cheminDemande} » pointe (lien symbolique) hors du workspace du projet.`,
      );
    }
  } catch (e) {
    if (e instanceof CheminHorsWorkspace) throw e;
    // ENOENT : le fichier n'existe pas encore (cas normal d'une création) — le confinement du chemin demandé suffit alors.
  }
  return cible;
}

export interface EntreeListe {
  nom: string;
  type: "fichier" | "dossier";
  tailleOctets: number | null;
}

export async function lister(workspacePath: string, cheminDemande = "."): Promise<EntreeListe[]> {
  const cible = await resoudre(workspacePath, cheminDemande);
  const entrees = await fs.readdir(cible, { withFileTypes: true });
  const resultat: EntreeListe[] = [];
  for (const e of entrees) {
    if (e.name === ".mkapms") continue; // journaux internes, jamais présentés comme du code du projet
    const type = e.isDirectory() ? "dossier" : "fichier";
    let taille: number | null = null;
    if (type === "fichier") {
      try {
        taille = (await fs.stat(path.join(cible, e.name))).size;
      } catch {
        taille = null;
      }
    }
    resultat.push({ nom: e.name, type, tailleOctets: taille });
  }
  return resultat.sort((a, b) => a.nom.localeCompare(b.nom));
}

/** Arborescence complète (raisonnablement bornée) — pour donner le contexte projet au modèle sans le redemander. */
export async function arborescence(
  workspacePath: string,
  cheminDemande = ".",
  profondeurMax = 4,
  maxEntrees = 400,
): Promise<string[]> {
  const chemins: string[] = [];
  async function parcourir(rel: string, profondeur: number): Promise<void> {
    if (chemins.length >= maxEntrees || profondeur > profondeurMax) return;
    const cible = await resoudre(workspacePath, rel);
    let entrees: import("node:fs").Dirent[];
    try {
      entrees = await fs.readdir(cible, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entrees.sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.name === ".mkapms" || e.name === "node_modules" || e.name === ".git") continue;
      if (chemins.length >= maxEntrees) return;
      const relEnfant = rel === "." ? e.name : `${rel}/${e.name}`;
      chemins.push(e.isDirectory() ? `${relEnfant}/` : relEnfant);
      if (e.isDirectory()) await parcourir(relEnfant, profondeur + 1);
    }
  }
  await parcourir(cheminDemande, 0);
  return chemins;
}

const TAILLE_MAX_LECTURE = 400_000;

export async function lireFichier(workspacePath: string, cheminDemande: string): Promise<{ contenu: string; tronque: boolean }> {
  const cible = await resoudre(workspacePath, cheminDemande);
  const stat = await fs.stat(cible);
  if (stat.isDirectory()) throw new Error(`« ${cheminDemande} » est un dossier, pas un fichier.`);
  const brut = await fs.readFile(cible, "utf8");
  if (brut.length > TAILLE_MAX_LECTURE) {
    return { contenu: brut.slice(0, TAILLE_MAX_LECTURE), tronque: true };
  }
  return { contenu: brut, tronque: false };
}

export async function ecrireFichier(workspacePath: string, cheminDemande: string, contenu: string): Promise<{ octets: number }> {
  const cible = await resoudre(workspacePath, cheminDemande);
  await fs.mkdir(path.dirname(cible), { recursive: true });
  await fs.writeFile(cible, contenu, "utf8");
  return { octets: Buffer.byteLength(contenu, "utf8") };
}

/**
 * Remplacement ciblé d'une portion précise du fichier (le texte exact doit
 * apparaître une seule fois) — évite de réécrire tout un fichier pour une
 * petite correction, et échoue explicitement plutôt que de deviner quelle
 * occurrence corriger.
 */
export async function editerFichier(
  workspacePath: string,
  cheminDemande: string,
  ancienTexte: string,
  nouveauTexte: string,
): Promise<{ occurrences: number }> {
  const cible = await resoudre(workspacePath, cheminDemande);
  const brut = await fs.readFile(cible, "utf8");
  const occurrences = brut.split(ancienTexte).length - 1;
  if (occurrences === 0) {
    throw new Error(`Texte à remplacer introuvable dans « ${cheminDemande} ».`);
  }
  if (occurrences > 1) {
    throw new Error(
      `Texte à remplacer trouvé ${occurrences} fois dans « ${cheminDemande} » : ambigu, précisez un extrait plus long et unique.`,
    );
  }
  await fs.writeFile(cible, brut.replace(ancienTexte, nouveauTexte), "utf8");
  return { occurrences };
}

export async function creerDossier(workspacePath: string, cheminDemande: string): Promise<void> {
  const cible = await resoudre(workspacePath, cheminDemande);
  await fs.mkdir(cible, { recursive: true });
}

export async function deplacer(workspacePath: string, source: string, destination: string): Promise<void> {
  const cibleSource = await resoudre(workspacePath, source);
  const cibleDestination = await resoudre(workspacePath, destination);
  await fs.mkdir(path.dirname(cibleDestination), { recursive: true });
  await fs.rename(cibleSource, cibleDestination);
}

export async function supprimer(workspacePath: string, cheminDemande: string): Promise<void> {
  const racine = path.resolve(workspacePath);
  const cible = await resoudre(workspacePath, cheminDemande);
  if (cible === racine) {
    throw new Error("Suppression refusée : on ne supprime jamais la racine du workspace du projet.");
  }
  await fs.rm(cible, { recursive: true, force: false });
}

export interface ResultatRecherche {
  chemin: string;
  ligne: number;
  extrait: string;
}

const EXTENSIONS_TEXTE = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".json", ".html", ".css", ".md", ".txt", ".mjs", ".cjs", ".yml", ".yaml", ".svg",
]);

export async function rechercher(workspacePath: string, requete: string, maxResultats = 60): Promise<ResultatRecherche[]> {
  const resultats: ResultatRecherche[] = [];
  async function parcourir(rel: string): Promise<void> {
    if (resultats.length >= maxResultats) return;
    const cible = await resoudre(workspacePath, rel);
    let entrees: import("node:fs").Dirent[];
    try {
      entrees = await fs.readdir(cible, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entrees) {
      if (e.name === ".mkapms" || e.name === "node_modules" || e.name === ".git") continue;
      if (resultats.length >= maxResultats) return;
      const relEnfant = rel === "." ? e.name : `${rel}/${e.name}`;
      if (e.isDirectory()) {
        await parcourir(relEnfant);
        continue;
      }
      if (!EXTENSIONS_TEXTE.has(path.extname(e.name))) continue;
      let contenu: string;
      try {
        contenu = await fs.readFile(path.join(cible, e.name), "utf8");
      } catch {
        continue;
      }
      const lignes = contenu.split("\n");
      for (let i = 0; i < lignes.length && resultats.length < maxResultats; i++) {
        if (lignes[i].includes(requete)) {
          resultats.push({ chemin: relEnfant, ligne: i + 1, extrait: lignes[i].trim().slice(0, 300) });
        }
      }
    }
  }
  await parcourir(".");
  return resultats;
}

export async function comparer(
  workspacePath: string,
  cheminA: string,
  cheminB: string,
): Promise<{ identiques: boolean; lignesA: number; lignesB: number; premierEcart: number | null }> {
  const [a, b] = await Promise.all([lireFichier(workspacePath, cheminA), lireFichier(workspacePath, cheminB)]);
  const lignesA = a.contenu.split("\n");
  const lignesB = b.contenu.split("\n");
  let premierEcart: number | null = null;
  const max = Math.max(lignesA.length, lignesB.length);
  for (let i = 0; i < max; i++) {
    if (lignesA[i] !== lignesB[i]) {
      premierEcart = i + 1;
      break;
    }
  }
  return { identiques: premierEcart === null && lignesA.length === lignesB.length, lignesA: lignesA.length, lignesB: lignesB.length, premierEcart };
}
