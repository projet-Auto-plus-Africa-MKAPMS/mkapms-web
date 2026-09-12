/**
 * Chantier de développement — exécution shell confinée.
 *
 * Contraintes réellement appliquées, pas seulement déclarées :
 *  - binaire limité à une liste fermée (npm, npx, node) — jamais une chaîne de
 *    commande interprétée par un shell, les arguments sont un tableau, donc
 *    aucune injection de métacaractères shell n'est possible ;
 *  - répertoire de travail toujours le workspace du projet, jamais ailleurs ;
 *  - variables d'environnement reconstruites de zéro (jamais `process.env`
 *    transmis tel quel) : aucun secret de la plateforme (base de données,
 *    JWT, clés fournisseur, jetons Railway…) n'atteint le processus lancé ;
 *  - délai (« wall clock ») strict, processus tué au dépassement ;
 *  - limite mémoire/CPU en meilleur effort via `ulimit` (bash) — ce
 *    n'est PAS un isolement noyau (cgroups/Docker absents de cet
 *    environnement de travail) ; ce fichier ne prétend jamais l'inverse : la
 *    limite réelle est documentée telle quelle dans le rapport final du lot ;
 *  - sortie plafonnée en taille et journal complet écrit dans le workspace du
 *    projet (`.mkapms/logs/`), jamais recopié intégralement en base.
 */
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

export const BINAIRES_AUTORISES = ["npm", "npx", "node"] as const;
export type BinaireAutorise = (typeof BINAIRES_AUTORISES)[number];

const LIMITE_MEMOIRE_KO = 1_500_000; // ~1.5 Go virtuel, ulimit -v (meilleur effort, pas garanti hors cgroups)
const LIMITE_CPU_SECONDES = 180; // ulimit -t (temps CPU, pas le délai horloge — les deux sont appliqués)
const SORTIE_MAX_OCTETS = 300_000;

export interface ResultatShell {
  statut: "execute" | "erreur" | "timeout";
  codeSortie: number | null;
  stdout: string;
  stderr: string;
  tronque: boolean;
  dureeMs: number;
  logPath: string;
}

function envSanitise(): NodeJS.ProcessEnv {
  const base: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    // npm a besoin d'un HOME/NPM cache lisible ; rien d'autre de la plateforme n'est transmis.
    npm_config_cache: process.env.npm_config_cache,
    NODE_ENV: "development",
    CI: "true",
    // npm en mode non interactif : aucune invite bloquante n'attend une réponse qui ne viendra jamais.
    npm_config_yes: "true",
    npm_config_fund: "false",
    npm_config_audit: "false",
  };
  return base;
}

/** Construit le script bash porteur des `ulimit` — les arguments réels restent un tableau, jamais interpolés dans le script. */
function scriptUlimit(): string {
  return `ulimit -v ${LIMITE_MEMOIRE_KO} 2>/dev/null; ulimit -t ${LIMITE_CPU_SECONDES} 2>/dev/null; exec "$0" "$@"`;
}

export async function executerCommande(input: {
  workspacePath: string;
  binaire: BinaireAutorise;
  arguments_: string[];
  timeoutMs: number;
  projetId: number;
  type: string;
}): Promise<ResultatShell> {
  if (!BINAIRES_AUTORISES.includes(input.binaire)) {
    throw new Error(`Binaire refusé : « ${input.binaire} » n'est pas dans la liste autorisée (${BINAIRES_AUTORISES.join(", ")}).`);
  }
  for (const a of input.arguments_) {
    if (typeof a !== "string" || a.length > 2000) {
      throw new Error("Argument invalide (type ou longueur).");
    }
  }

  const debut = Date.now();
  const dossierLogs = path.join(input.workspacePath, ".mkapms", "logs");
  await fs.mkdir(dossierLogs, { recursive: true });
  const nomLog = `${new Date().toISOString().replace(/[:.]/g, "-")}-${input.type}.log`;
  const logPath = path.join(dossierLogs, nomLog);

  return await new Promise<ResultatShell>((resolve) => {
    let stdout = "";
    let stderr = "";
    let tronque = false;
    let futMinuterie = false;

    const enfant = spawn("/bin/bash", ["-c", scriptUlimit(), input.binaire, ...input.arguments_], {
      cwd: input.workspacePath,
      env: envSanitise(),
      timeout: input.timeoutMs,
      killSignal: "SIGKILL",
    });

    enfant.stdout.on("data", (d: Buffer) => {
      if (stdout.length < SORTIE_MAX_OCTETS) stdout += d.toString("utf8");
      else tronque = true;
    });
    enfant.stderr.on("data", (d: Buffer) => {
      if (stderr.length < SORTIE_MAX_OCTETS) stderr += d.toString("utf8");
      else tronque = true;
    });

    const minuterie = setTimeout(() => {
      futMinuterie = true;
      enfant.kill("SIGKILL");
    }, input.timeoutMs);

    enfant.on("error", async (e) => {
      clearTimeout(minuterie);
      const dureeMs = Date.now() - debut;
      const message = `Échec de lancement : ${e.message}`;
      await fs.writeFile(logPath, `$ ${input.binaire} ${input.arguments_.join(" ")}\n\n${message}\n`, "utf8").catch(() => {});
      resolve({ statut: "erreur", codeSortie: null, stdout: "", stderr: message, tronque: false, dureeMs, logPath });
    });

    enfant.on("close", async (code) => {
      clearTimeout(minuterie);
      const dureeMs = Date.now() - debut;
      const statut: ResultatShell["statut"] = futMinuterie ? "timeout" : code === 0 ? "execute" : "erreur";
      const contenuLog = [
        `$ ${input.binaire} ${input.arguments_.join(" ")}`,
        `(cwd: ${input.workspacePath})`,
        "",
        "--- stdout ---",
        stdout,
        "--- stderr ---",
        stderr,
        "",
        `code de sortie: ${code}${futMinuterie ? " (tué après dépassement du délai)" : ""}`,
      ].join("\n");
      await fs.writeFile(logPath, contenuLog, "utf8").catch(() => {});
      resolve({
        statut,
        codeSortie: code,
        stdout: stdout.slice(0, 8000),
        stderr: stderr.slice(0, 8000),
        tronque,
        dureeMs,
        logPath,
      });
    });
  });
}
