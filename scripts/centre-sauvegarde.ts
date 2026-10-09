/**
 * Sauvegarde, vérification, restauration et comparaison de la base du Centre Cyber-Électrique (schéma « frontier »).
 *
 *   npx tsx scripts/centre-sauvegarde.ts sauvegarder [--dossier <dossier>]
 *   npx tsx scripts/centre-sauvegarde.ts verifier    --dossier <dossier>
 *   npx tsx scripts/centre-sauvegarde.ts restaurer   --dossier <dossier> --cible <url> --confirme
 *   npx tsx scripts/centre-sauvegarde.ts comparer    --source <url> --cible <url>
 *
 * La source d'une sauvegarde est la base du centre telle que la plateforme la résout (FRONTIER_DATABASE_URL, sinon DATABASE_URL).
 * La cible d'une restauration est TOUJOURS donnée explicitement et doit être vide : rien n'est jamais écrasé. Aucune adresse, aucun mot de passe
 * n'est affiché. Une sauvegarde ne contient aucun secret (le centre ne stocke que des références).
 */
import path from "node:path";
import { creerPool, fermerBase, resoudreUrl } from "../server/frontier-os/base/connexion.js";
import { migrer } from "../server/frontier-os/base/migrateur.js";
import { journaliser } from "../server/frontier-os/journal.js";
import { comparer, restaurer, sauvegarder, verifierSauvegarde } from "../server/frontier-os/sauvegarde.js";

const [commande, ...args] = process.argv.slice(2);
const option = (nom: string): string | undefined => {
  const i = args.indexOf(`--${nom}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const drapeau = (nom: string) => args.includes(`--${nom}`);
const echec = (m: string): never => {
  console.error(`ERREUR : ${m}`);
  process.exit(1);
};

async function main() {
  if (commande === "sauvegarder") {
    const r = resoudreUrl();
    if (!r) return echec("aucune base du centre configurée (FRONTIER_DATABASE_URL ou DATABASE_URL).");
    const horodatage = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const dossier = path.resolve(option("dossier") ?? `sauvegardes-centre/${horodatage}`);
    const pool = creerPool(r.url, 2);
    try {
      const m = await sauvegarder(pool, dossier);
      const v = verifierSauvegarde(dossier);
      console.log(`Sauvegarde écrite : ${dossier}`);
      console.log(`  ${m.tables.length} tables, ${m.tables.reduce((s, t) => s + t.lignes, 0)} lignes, empreinte ${m.sha256.slice(0, 16)}…`);
      console.log(`  relecture des fichiers : ${v.ok ? "conforme" : "ÉCART — " + v.erreurs.join(" ; ")}`);
      await journaliser({ acteur: { type: "system", id: "cli:sauvegarde" }, action: "backup", cible: "center", resultat: v.ok ? "ok" : "error", erreur: v.ok ? undefined : v.erreurs.join(" ; "), detail: { tables: m.tables.length, lignes: m.tables.reduce((s, t) => s + t.lignes, 0), sha256: m.sha256, version: m.versionCentre } });
      if (!v.ok) process.exit(1);
    } finally {
      await pool.end();
      await fermerBase();
    }
    return;
  }
  if (commande === "verifier") {
    const dossier = option("dossier");
    if (!dossier) return echec("--dossier requis.");
    const v = verifierSauvegarde(path.resolve(dossier));
    console.log(v.ok ? `Sauvegarde conforme (${v.manifeste.tables.length} tables, créée le ${v.manifeste.creeLe}).` : `Sauvegarde NON conforme : ${v.erreurs.join(" ; ")}`);
    if (!v.ok) process.exit(1);
    return;
  }
  if (commande === "restaurer") {
    const dossier = option("dossier");
    const cible = option("cible");
    if (!dossier || !cible) return echec("--dossier et --cible requis.");
    if (!drapeau("confirme")) return echec("ajouter --confirme : la restauration écrit dans la base cible (qui doit être vide).");
    if (cible === resoudreUrl()?.url) return echec("la cible est la base courante du centre : refus (restaurer vers une base vide distincte).");
    const pool = creerPool(cible, 2);
    try {
      const mig = await migrer(pool);
      console.log(`Migrations de la cible : ${mig.appliquees.length} appliquées, ${mig.dejaAppliquees.length} déjà présentes.`);
      const r = await restaurer(pool, path.resolve(dossier));
      console.log(r.ok ? `Restauration validée : ${r.tables} tables, ${r.lignes} lignes, ${r.tablesIdentiques}/${r.tables} tables identiques à la sauvegarde.` : `Restauration ANNULÉE : ${r.erreurs.join(" ; ")}`);
      if (!r.ok) process.exit(1);
    } finally {
      await pool.end();
    }
    return;
  }
  if (commande === "comparer") {
    const source = option("source");
    const cible = option("cible");
    if (!source || !cible) return echec("--source et --cible requis.");
    const [a, b] = [creerPool(source, 2), creerPool(cible, 2)];
    try {
      const r = await comparer(a, b);
      console.log(r.identiques ? `IDENTIQUES : ${r.tables} tables, contenu égal ligne par ligne.` : `DIFFÉRENCES : ${r.ecarts.join(" ; ")}`);
      if (!r.identiques) process.exit(1);
    } finally {
      await Promise.all([a.end(), b.end()]);
    }
    return;
  }
  echec("commande inconnue. Utiliser : sauvegarder | verifier | restaurer | comparer (voir l'en-tête du fichier).");
}

main().catch((e) => echec((e as Error).message));
