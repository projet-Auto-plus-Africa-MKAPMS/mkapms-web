/**
 * Chantier de développement — Preview Engine.
 *
 * Toujours temporaire, jamais public : un aperçu écoute sur `localhost`
 * uniquement, sur un port choisi au hasard dans une plage privée, et
 * s'arrête avec le processus serveur ou sur demande explicite. Rien ici
 * n'ouvre un domaine, ne publie une URL externe, ni ne déclenche un
 * déploiement — ce lot l'exclut explicitement.
 *
 * Deux modes, choisis selon ce que le projet contient réellement :
 *  - « statique » : le projet a un `index.html` mais pas de serveur de
 *    développement installé — MKA.P-MS sert lui-même le dossier, sans
 *    dépendre d'un script que le modèle aurait pu mal écrire ;
 *  - « npm » : le projet déclare un script `dev`/`start`/`preview` et ses
 *    dépendances sont installées — c'est ce serveur-là qui est lancé, MKA.P-MS
 *    ne fait alors que détecter le port qu'il annonce.
 */
import { createServer as creerServeurHttp, type Server } from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer as creerSondePort } from "node:net";
import { promises as fs } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { inChantierPreviews } from "../schema.js";
import { lirePackageJson, nodeModulesPresent, scriptPour, indexHtmlPresent } from "./scripts.js";

const PORT_MIN = 20000;
const PORT_MAX = 29998;
const DELAI_DETECTION_PORT_MS = 15000;

interface AperçuActif {
  mode: "statique" | "npm";
  serveurStatique?: Server;
  processusNpm?: ChildProcess;
  port: number;
}

/** État en mémoire du processus serveur en cours — un aperçu ne survit pas à un redémarrage, assumé et documenté. */
const ACTIFS = new Map<number, AperçuActif>();

async function portLibre(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sonde = creerSondePort();
    sonde.once("error", () => resolve(false));
    sonde.once("listening", () => sonde.close(() => resolve(true)));
    sonde.listen(port, "127.0.0.1");
  });
}

async function portDisponible(): Promise<number> {
  for (let essai = 0; essai < 40; essai++) {
    const port = PORT_MIN + Math.floor(Math.random() * (PORT_MAX - PORT_MIN));
    if (await portLibre(port)) return port;
  }
  throw new Error("Aucun port libre trouvé dans la plage réservée à l'aperçu.");
}

const TYPES_MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function serveurStatiqueDe(workspacePath: string): Server {
  const racine = path.resolve(workspacePath);
  return creerServeurHttp(async (req, res) => {
    try {
      const urlChemin = decodeURIComponent((req.url ?? "/").split("?")[0]);
      let relatif = urlChemin === "/" ? "index.html" : urlChemin.replace(/^\/+/, "");
      let cible = path.resolve(racine, relatif);
      if (!cible.startsWith(racine)) {
        res.writeHead(403).end("Interdit");
        return;
      }
      let stat = await fs.stat(cible).catch(() => null);
      if (stat?.isDirectory()) {
        cible = path.join(cible, "index.html");
        stat = await fs.stat(cible).catch(() => null);
      }
      if (!stat) {
        res.writeHead(404).end("Introuvable");
        return;
      }
      const contenu = await fs.readFile(cible);
      const type = TYPES_MIME[path.extname(cible)] ?? "application/octet-stream";
      res.writeHead(200, { "Content-Type": type }).end(contenu);
    } catch (e) {
      res.writeHead(500).end(`Erreur aperçu : ${e instanceof Error ? e.message : "inconnue"}`);
    }
  });
}

export interface EtatAperçu {
  statut: "en_cours" | "arrete" | "erreur";
  url: string | null;
  port: number | null;
  mode: string | null;
  motif: string;
}

async function persister(projetId: number, e: Partial<typeof inChantierPreviews.$inferInsert>): Promise<void> {
  const [existant] = await db.select().from(inChantierPreviews).where(eq(inChantierPreviews.projetId, projetId)).limit(1);
  if (existant) {
    await db.update(inChantierPreviews).set({ ...e, updatedAt: new Date() }).where(eq(inChantierPreviews.projetId, projetId));
  } else {
    await db.insert(inChantierPreviews).values({ projetId, ...e });
  }
}

export async function demarrer(projetId: number, workspacePath: string): Promise<EtatAperçu> {
  await arreter(projetId).catch(() => {});

  const pkg = await lirePackageJson(workspacePath);
  const scriptDev = scriptPour(pkg, "dev");
  const depsInstallees = await nodeModulesPresent(workspacePath);

  if (scriptDev && depsInstallees) {
    const port = await portDisponible();
    const enfant = spawn("npm", ["run", scriptDev], {
      cwd: workspacePath,
      env: { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: "development", PORT: String(port), CI: "true" },
    });
    let sortie = "";
    let portDetecte: number | null = null;
    const surSortie = (d: Buffer) => {
      sortie += d.toString("utf8");
      const m = sortie.match(/(?:localhost|127\.0\.0\.1):(\d{2,5})/);
      if (m) portDetecte = Number(m[1]);
    };
    enfant.stdout.on("data", surSortie);
    enfant.stderr.on("data", surSortie);

    const debut = Date.now();
    while (Date.now() - debut < DELAI_DETECTION_PORT_MS && portDetecte === null && !enfant.killed) {
      await new Promise((r) => setTimeout(r, 300));
    }

    if (portDetecte === null) {
      enfant.kill("SIGKILL");
      const motif = `Serveur de développement lancé (« npm run ${scriptDev} ») mais aucun port détecté dans sa sortie en ${DELAI_DETECTION_PORT_MS / 1000}s.`;
      await persister(projetId, { statut: "erreur", motif, mode: "npm", port: null, pid: null });
      return { statut: "erreur", url: null, port: null, mode: "npm", motif };
    }

    ACTIFS.set(projetId, { mode: "npm", processusNpm: enfant, port: portDetecte });
    await persister(projetId, {
      statut: "en_cours",
      mode: "npm",
      port: portDetecte,
      pid: enfant.pid ?? null,
      url: `http://localhost:${portDetecte}`,
      motif: "",
      demarreAt: new Date(),
    });
    return { statut: "en_cours", url: `http://localhost:${portDetecte}`, port: portDetecte, mode: "npm", motif: "" };
  }

  if (await indexHtmlPresent(workspacePath)) {
    const port = await portDisponible();
    const serveur = serveurStatiqueDe(workspacePath);
    await new Promise<void>((resolve) => serveur.listen(port, "127.0.0.1", resolve));
    ACTIFS.set(projetId, { mode: "statique", serveurStatique: serveur, port });
    await persister(projetId, {
      statut: "en_cours",
      mode: "statique",
      port,
      pid: null,
      url: `http://localhost:${port}`,
      motif: "",
      demarreAt: new Date(),
    });
    return { statut: "en_cours", url: `http://localhost:${port}`, port, mode: "statique", motif: "" };
  }

  const motif = scriptDev
    ? "Script de développement déclaré mais dépendances non installées (dependencies.install requis avant l'aperçu)."
    : "Aucun index.html à la racine du projet et aucun script dev/start/preview déclaré : rien à prévisualiser encore.";
  await persister(projetId, { statut: "erreur", motif, mode: "aucun", port: null, pid: null });
  return { statut: "erreur", url: null, port: null, mode: null, motif };
}

export async function arreter(projetId: number): Promise<void> {
  const actif = ACTIFS.get(projetId);
  if (actif?.serveurStatique) await new Promise<void>((resolve) => actif.serveurStatique!.close(() => resolve()));
  if (actif?.processusNpm && !actif.processusNpm.killed) actif.processusNpm.kill("SIGKILL");
  ACTIFS.delete(projetId);
  await persister(projetId, { statut: "arrete", arreteAt: new Date() }).catch(() => {});
}

export async function statut(projetId: number): Promise<EtatAperçu> {
  const [ligne] = await db.select().from(inChantierPreviews).where(eq(inChantierPreviews.projetId, projetId)).limit(1);
  if (!ligne) return { statut: "arrete", url: null, port: null, mode: null, motif: "Aucun aperçu démarré pour ce projet." };

  const actif = ACTIFS.get(projetId);
  if (ligne.statut === "en_cours" && !actif) {
    // Processus disparu (redémarrage serveur ou crash) — l'aperçu était temporaire par nature, on le dit tel quel.
    await persister(projetId, { statut: "arrete", motif: "Processus d'aperçu introuvable en mémoire (redémarrage du serveur MKA.P-MS ou arrêt inattendu)." });
    return { statut: "arrete", url: null, port: ligne.port, mode: ligne.mode, motif: "Processus d'aperçu introuvable en mémoire (redémarrage du serveur MKA.P-MS ou arrêt inattendu)." };
  }
  return {
    statut: ligne.statut as EtatAperçu["statut"],
    url: ligne.url,
    port: ligne.port,
    mode: ligne.mode,
    motif: ligne.motif,
  };
}

/** Requête réelle sur l'aperçu en cours — la preuve demandée : « la page répond ». */
export async function verifierReponse(projetId: number): Promise<{ repond: boolean; statutHttp: number | null; motif: string }> {
  const e = await statut(projetId);
  if (e.statut !== "en_cours" || !e.url) return { repond: false, statutHttp: null, motif: e.motif || "Aucun aperçu en cours." };
  try {
    const controleur = new AbortController();
    const minuterie = setTimeout(() => controleur.abort(), 5000);
    const reponse = await fetch(e.url, { signal: controleur.signal });
    clearTimeout(minuterie);
    return { repond: reponse.status < 500, statutHttp: reponse.status, motif: "" };
  } catch (err) {
    return { repond: false, statutHttp: null, motif: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}
