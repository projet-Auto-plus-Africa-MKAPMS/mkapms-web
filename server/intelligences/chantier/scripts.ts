/**
 * Chantier de développement — détection des commandes réelles d'un projet.
 *
 * `dependencies.install`, `build.run`, `test.run`, `lint.run`, `typecheck.run`
 * et le mode « npm » de l'aperçu ne prennent JAMAIS une commande arbitraire du
 * modèle : ils lisent le `package.json` réel du projet et lancent le script
 * qu'il déclare, ou disent honnêtement qu'aucun script de ce type n'existe.
 * C'est `shell.execute` (allowlist binaire, arguments en tableau) qui reste la
 * seule porte pour une commande que ces cinq outils ne couvrent pas.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function lirePackageJson(workspacePath: string): Promise<PackageJson | null> {
  try {
    const brut = await fs.readFile(path.join(workspacePath, "package.json"), "utf8");
    return JSON.parse(brut) as PackageJson;
  } catch {
    return null;
  }
}

export async function lockfilePresent(workspacePath: string): Promise<boolean> {
  return fs
    .access(path.join(workspacePath, "package-lock.json"))
    .then(() => true)
    .catch(() => false);
}

export async function nodeModulesPresent(workspacePath: string): Promise<boolean> {
  return fs
    .access(path.join(workspacePath, "node_modules"))
    .then(() => true)
    .catch(() => false);
}

export async function tsconfigPresent(workspacePath: string): Promise<boolean> {
  return fs
    .access(path.join(workspacePath, "tsconfig.json"))
    .then(() => true)
    .catch(() => false);
}

export async function indexHtmlPresent(workspacePath: string): Promise<boolean> {
  return fs
    .access(path.join(workspacePath, "index.html"))
    .then(() => true)
    .catch(() => false);
}

/** Nom du script à lancer pour un type d'action, ou `null` si le projet n'en déclare pas. */
export function scriptPour(pkg: PackageJson | null, type: "build" | "test" | "lint" | "dev"): string | null {
  const scripts = pkg?.scripts ?? {};
  const candidats: Record<typeof type, string[]> = {
    build: ["build"],
    test: ["test"],
    lint: ["lint"],
    dev: ["dev", "start", "preview"],
  } as const;
  for (const nom of candidats[type]) {
    if (typeof scripts[nom] === "string" && scripts[nom].trim().length > 0) return nom;
  }
  return null;
}
