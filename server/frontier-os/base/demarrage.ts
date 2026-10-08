/**
 * Démarrage de la base du centre : migrations propres, une seule fois par processus, sans jamais bloquer ni faire tomber la plateforme.
 * Une erreur est mémorisée (et affichée dans le centre), puis une nouvelle tentative est permise après 30 secondes.
 */
import { poolFrontier, resoudreUrl } from "./connexion.js";
import { migrer, type RapportMigration } from "./migrateur.js";

export interface EtatBase {
  prete: boolean;
  /** Vrai si FRONTIER_DATABASE_URL pointe vers une base physiquement distincte de celle de la plateforme. */
  separee: boolean;
  erreur: string | null;
  migrations: RapportMigration | null;
  essaiLe: string | null;
}

let encours: Promise<EtatBase> | null = null;
let etat: EtatBase = { prete: false, separee: false, erreur: null, migrations: null, essaiLe: null };
let prochainEssai = 0;

export const etatBase = (): EtatBase => etat;

export function oublierEtatBasePourTests(): void {
  encours = null;
  etat = { prete: false, separee: false, erreur: null, migrations: null, essaiLe: null };
  prochainEssai = 0;
}

export function assurerBase(): Promise<EtatBase> {
  if (etat.prete) return Promise.resolve(etat);
  if (encours) return encours;
  if (etat.erreur && Date.now() < prochainEssai) return Promise.resolve(etat);
  encours = (async () => {
    const r = resoudreUrl();
    const essaiLe = new Date().toISOString();
    if (!r) {
      etat = { prete: false, separee: false, erreur: "Aucune base configurée (FRONTIER_DATABASE_URL ou DATABASE_URL).", migrations: null, essaiLe };
      prochainEssai = Date.now() + 30_000;
      return etat;
    }
    try {
      const migrations = await migrer(poolFrontier());
      etat = { prete: true, separee: r.separee, erreur: null, migrations, essaiLe };
    } catch (e) {
      etat = { prete: false, separee: r.separee, erreur: (e as Error).message, migrations: null, essaiLe };
      prochainEssai = Date.now() + 30_000;
      console.error("[frontier] base du centre indisponible :", (e as Error).message);
    }
    return etat;
  })().finally(() => {
    encours = null;
  });
  return encours;
}

/** Les écrans et les routeurs du centre passent par là : base prête ou erreur claire, jamais un plantage. */
export async function exigerBase(): Promise<void> {
  const e = await assurerBase();
  if (!e.prete) throw new Error(`La base du centre n'est pas prête : ${e.erreur ?? "inconnue"}`);
}
