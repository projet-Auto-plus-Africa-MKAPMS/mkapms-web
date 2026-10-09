/**
 * Démarrage du Centre Cyber-Électrique dans le processus de la plateforme : base propre (migrations), fondation, reprise après redémarrage,
 * santé des moteurs, portier du câble, tâches de fond. Jamais bloquant : appelé sans attendre au démarrage ; une erreur est mémorisée et
 * affichée dans le centre, la plateforme continue de démarrer.
 */
import { assurerBase, etatBase } from "./base/demarrage.js";
import { assurerFondation } from "./fondation.js";
import { brancherPortierCentre } from "./gouvernance.js";
import { echantillonnerCentre, elaguerMesures } from "./mesures.js";
import { reprendreApresRedemarrage } from "./commandes.js";
import { balayerLacunes } from "./developpement.js";
import { brancherCommutationCentre } from "./liaisons-reelles.js";
import { reconcilierLiaisonsReelles } from "./reel.js";
import { verifierSanteMoteurs } from "./sante.js";
import { traiterFile } from "./transport.js";

let initialisation: Promise<void> | null = null;
let minuteries: NodeJS.Timeout[] = [];

async function initialiser(): Promise<void> {
  brancherPortierCentre();
  brancherCommutationCentre();
  const base = await assurerBase();
  if (!base.prete) throw new Error(base.erreur ?? "base du centre indisponible");
  await assurerFondation();
  await reprendreApresRedemarrage();
  // Aucune liaison réelle n'est rouverte au démarrage : celles trouvées ouvertes contre l'avis du centre sont coupées.
  await reconcilierLiaisonsReelles().catch((e) => console.error("[frontier] réconciliation des liaisons réelles :", (e as Error).message));
  await balayerLacunes().catch((e) => console.error("[frontier] balayage des lacunes de développement :", (e as Error).message));
  await verifierSanteMoteurs();
  await echantillonnerCentre();
}

/** Prépare le centre une fois par processus. En cas d'échec, le prochain appel réessaie. */
export function demarrerCentre(): Promise<void> {
  if (!initialisation) {
    initialisation = initialiser().catch((e) => {
      initialisation = null;
      console.error("[frontier] démarrage du centre impossible :", (e as Error).message);
      throw e;
    });
  }
  return initialisation;
}

/** Tâches de fond : file des échanges (la décision de passage est refaite à chaque tentative), mesures, élagage. */
export function lancerTachesDeFond(): void {
  if (minuteries.length > 0) return;
  const garde = (f: () => Promise<unknown>) => () => {
    if (!etatBase().prete) return;
    f().catch((e) => console.error("[frontier] tâche de fond :", (e as Error).message));
  };
  minuteries = [
    setInterval(garde(() => traiterFile()), 5_000),
    setInterval(garde(() => echantillonnerCentre()), 60_000),
    setInterval(garde(() => reconcilierLiaisonsReelles()), 60_000),
    setInterval(garde(() => balayerLacunes()), 5 * 60_000),
    setInterval(garde(() => verifierSanteMoteurs()), 5 * 60_000),
    setInterval(garde(() => elaguerMesures()), 60 * 60_000),
  ];
  for (const m of minuteries) m.unref();
}

export function arreterTachesDeFond(): void {
  for (const m of minuteries) clearInterval(m);
  minuteries = [];
}

export function oublierDemarragePourTests(): void {
  initialisation = null;
}
