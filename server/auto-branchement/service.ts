/**
 * Module d'auto-branchement — service.
 *
 * Problème réel : la plateforme compte plus de 2 500 éléments cliquables sur
 * près de 700 écrans. Les reprendre à la main écran par écran ne tient pas :
 * un écran corrigé aujourd'hui redevient muet demain sans que personne ne le
 * sache, et un lien vers une page supprimée reste invisible jusqu'à ce qu'un
 * client tombe dessus.
 *
 * Ce module ne remplace aucun moteur : il les alimente en faits.
 *
 *   inventaire généré (scripts/gen-cliquables.mjs)
 *     → Moteur de boutons        : ce qui est déclaré, ce qui ne l'est pas
 *     → Moteur de Redirection    : la destination existe-t-elle réellement,
 *                                  ou une règle peut-elle la rattraper
 *     → Event Bus                : chaque défaut est publié
 *     → Système Intelligent      : alerte de direction dédupliquée
 *     → MKA.P-MS Intelligences   : dossier de correction + mémoire technique
 *     → registre des moteurs     : battement de cœur daté
 *
 * Deux refus tenus :
 *  - aucune correction automatique du code de production n'est faite ici : le
 *    module constate, propose et trace ; la décision reste gouvernée ;
 *  - la vérification des destinations est refaite **à l'exécution**, pas au
 *    moment de la génération : une route ajoutée entre-temps fait disparaître
 *    l'anomalie sans qu'on ait à toucher l'inventaire.
 */
import {
  CLIQUABLES_ANOMALIES,
  CLIQUABLES_PAR_ECRAN,
  CLIQUABLES_TOTAL,
  type AnomalieCliquable,
  type MotifAnomalie,
} from "../data/cliquables.js";
import { isRoutablePath } from "../data/client-routes.js";
import { actionParCode } from "../button-engine/catalogue.js";
import { listRules } from "../redirection-engine/service.js";
import { emitSafe } from "../event-bus/service.js";
import { heartbeat } from "../engine-registry/service.js";

export interface SyntheseAutoBranchement {
  /** Total des cliquables relevés dans les écrans. */
  total: number;
  ecrans: number;
  /** Cliquables passant par le Moteur de boutons. */
  moteur: number;
  liens: number;
  boutonsLocaux: number;
  sansAction: number;
  zones: number;
  /** Part des cliquables réellement pilotés par un moteur, en pourcentage. */
  couvertureMoteur: number;
  anomalies: number;
  parMotif: Record<MotifAnomalie, number>;
}

export function synthese(): SyntheseAutoBranchement {
  let moteur = 0;
  let liens = 0;
  let boutonsLocaux = 0;
  let sansAction = 0;
  let zones = 0;

  for (const e of CLIQUABLES_PAR_ECRAN) {
    moteur += e.moteur;
    liens += e.liens;
    boutonsLocaux += e.boutonsLocaux;
    sansAction += e.sansAction;
    zones += e.zones;
  }

  const parMotif: Record<MotifAnomalie, number> = {
    sans_action: 0,
    destination_inconnue: 0,
    code_non_declare: 0,
  };
  for (const a of CLIQUABLES_ANOMALIES) parMotif[a.motif] += 1;

  const total: number = CLIQUABLES_TOTAL;

  return {
    total,
    ecrans: CLIQUABLES_PAR_ECRAN.length,
    moteur,
    liens,
    boutonsLocaux,
    sansAction,
    zones,
    couvertureMoteur: total === 0 ? 0 : Math.round((moteur / total) * 1000) / 10,
    anomalies: CLIQUABLES_ANOMALIES.length,
    parMotif,
  };
}

export interface DestinationMorte {
  /** Destination écrite dans l'écran. */
  destination: string;
  occurrences: number;
  /** Écrans qui pointent dessus (limités pour rester lisibles). */
  ecrans: string[];
  /**
   * Vrai quand le Moteur de Redirection possède une règle active qui rattrape
   * cette destination vers une page existante : le lien n'est alors plus mort,
   * il est gouverné.
   */
  rattrapeeParRedirection: boolean;
  /** Cible réelle donnée par la règle de redirection, le cas échéant. */
  cibleReglee: string | null;
}

function normaliser(chemin: string): string {
  return chemin.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
}

/**
 * Destinations qui ne mènent à aucune page.
 *
 * Le Moteur de Redirection est réellement interrogé : une destination couverte
 * par une règle active vers une page existante n'est plus comptée comme morte,
 * puisque le clic aboutit.
 */
export async function destinationsMortes(): Promise<DestinationMorte[]> {
  const groupes = new Map<string, { occurrences: number; ecrans: Set<string> }>();

  // Règles actives du Moteur de Redirection, lues une seule fois : une
  // résolution par destination polluerait son journal de parcours avec des
  // consultations d'audit qui ne sont pas des clics d'utilisateurs.
  const regles = new Map<string, string>();
  try {
    for (const r of await listRules()) {
      if (!r.active || !r.target) continue;
      const cle = r.key.startsWith("path:") ? normaliser(r.key.slice(5)) : normaliser(`/${r.key}`);
      if (!regles.has(cle)) regles.set(cle, r.target);
    }
  } catch {
    // Moteur de Redirection indisponible : on ne prétend pas qu'un lien est
    // rattrapé. Les anomalies restent affichées telles quelles.
  }

  for (const a of CLIQUABLES_ANOMALIES) {
    if (a.motif !== "destination_inconnue") continue;
    const cible = normaliser(a.libelle);
    const groupe = groupes.get(cible) ?? { occurrences: 0, ecrans: new Set<string>() };
    groupe.occurrences += 1;
    groupe.ecrans.add(a.fichier);
    groupes.set(cible, groupe);
  }

  const out: DestinationMorte[] = [];
  for (const [destination, groupe] of groupes) {
    // Une route ajoutée depuis la génération de l'inventaire annule l'anomalie.
    if (isRoutablePath(destination)) continue;

    const cible = regles.get(destination) ?? null;
    const rattrapeeParRedirection =
      !!cible && (cible.startsWith("http") || isRoutablePath(normaliser(cible)));
    const cibleReglee = rattrapeeParRedirection ? cible : null;

    out.push({
      destination,
      occurrences: groupe.occurrences,
      ecrans: [...groupe.ecrans].sort().slice(0, 8),
      rattrapeeParRedirection,
      cibleReglee,
    });
  }

  return out.sort((a, b) => b.occurrences - a.occurrences || a.destination.localeCompare(b.destination));
}

export interface EcranMuet {
  fichier: string;
  /** Boutons de l'écran qui ne déclenchent rien. */
  sansAction: number;
  /** Cliquables de l'écran déjà pilotés par le Moteur de boutons. */
  moteur: number;
  total: number;
  /** Libellés relevés, pour retrouver le bouton sans ouvrir le fichier. */
  exemples: { ligne: number; libelle: string }[];
}

/** Écrans où au moins un bouton ne déclenche rien, les plus chargés d'abord. */
export function ecransMuets(): EcranMuet[] {
  const parFichier = new Map<string, AnomalieCliquable[]>();
  for (const a of CLIQUABLES_ANOMALIES) {
    if (a.motif !== "sans_action") continue;
    const liste = parFichier.get(a.fichier) ?? [];
    liste.push(a);
    parFichier.set(a.fichier, liste);
  }

  const compte = new Map(CLIQUABLES_PAR_ECRAN.map((e) => [e.fichier, e]));
  const out: EcranMuet[] = [];
  for (const [fichier, liste] of parFichier) {
    const ecran = compte.get(fichier);
    out.push({
      fichier,
      sansAction: liste.length,
      moteur: ecran?.moteur ?? 0,
      total: ecran?.total ?? liste.length,
      exemples: liste
        .slice(0, 6)
        .map((a) => ({ ligne: a.ligne, libelle: a.libelle || "(sans texte)" })),
    });
  }
  return out.sort((a, b) => b.sansAction - a.sansAction || a.fichier.localeCompare(b.fichier));
}

/** Codes d'action utilisés dans un écran mais absents du catalogue du moteur. */
export function codesNonDeclares(): { fichier: string; ligne: number; code: string }[] {
  return CLIQUABLES_ANOMALIES.filter((a) => a.motif === "code_non_declare")
    .filter((a) => !actionParCode(a.libelle))
    .map((a) => ({ fichier: a.fichier, ligne: a.ligne, code: a.libelle }));
}

export type Traitement = "creer_page" | "regle_redirection" | "declarer_au_moteur" | "retirer_element";

export interface Proposition {
  /** Clé stable : la même anomalie donne toujours la même proposition. */
  cle: string;
  sujet: string;
  motif: MotifAnomalie;
  /** Ampleur réelle : nombre d'endroits concernés. */
  poids: number;
  traitement: Traitement;
  /** Ce qui doit être fait, en clair, sans jargon d'agent. */
  action: string;
}

/**
 * Propositions gouvernées. Rien n'est appliqué : ce sont les décisions à
 * prendre, classées par ce que le défaut coûte réellement à l'écran.
 */
export async function propositions(): Promise<Proposition[]> {
  const out: Proposition[] = [];

  for (const d of await destinationsMortes()) {
    if (d.rattrapeeParRedirection) continue;
    out.push({
      cle: `destination:${d.destination}`,
      sujet: d.destination,
      motif: "destination_inconnue",
      poids: d.occurrences,
      traitement: d.occurrences >= 3 ? "creer_page" : "regle_redirection",
      action:
        d.occurrences >= 3
          ? `${d.occurrences} liens mènent à « ${d.destination} » qui n'existe pas. Une section citée ${d.occurrences} fois doit avoir sa page d'accueil : la créer, ou déclarer au Moteur de Redirection la page qui la remplace.`
          : `« ${d.destination} » n'existe pas (${d.occurrences} lien(s)). Déclarer une règle au Moteur de Redirection vers la page équivalente, ou corriger le lien.`,
    });
  }

  for (const e of ecransMuets()) {
    out.push({
      cle: `ecran:${e.fichier}`,
      sujet: e.fichier,
      motif: "sans_action",
      poids: e.sansAction,
      traitement: "declarer_au_moteur",
      action:
        `${e.sansAction} bouton(s) de cet écran ne déclenchent rien (ex. ${e.exemples
          .map((x) => `« ${x.libelle} » l.${x.ligne}`)
          .join(", ")}). Déclarer chaque bouton au catalogue du Moteur de boutons avec son action réelle, ` +
        "ou retirer l'élément de l'écran s'il n'a pas de raison d'exister.",
    });
  }

  for (const c of codesNonDeclares()) {
    out.push({
      cle: `code:${c.code}`,
      sujet: c.code,
      motif: "code_non_declare",
      poids: 1,
      traitement: "declarer_au_moteur",
      action: `L'écran ${c.fichier}:${c.ligne} demande l'action « ${c.code} » au Moteur de boutons, qui ne la connaît pas : le bouton reste inactif. Ajouter l'action au catalogue.`,
    });
  }

  return out.sort((a, b) => b.poids - a.poids || a.cle.localeCompare(b.cle));
}

export interface RapportAutoBranchement {
  synthese: SyntheseAutoBranchement;
  destinationsMortes: DestinationMorte[];
  destinationsRattrapees: number;
  ecransMuets: EcranMuet[];
  propositions: Proposition[];
  /** Événements réellement publiés au bus par cette passe. */
  publies: string[];
  trigger: string;
  date: string;
}

const SEUIL_DOSSIER = 3;

/**
 * Passe complète : analyse, publication au bus, mémoire technique, battement
 * de cœur. Best-effort par nature — elle ne doit jamais empêcher un démarrage
 * ni une requête de direction.
 */
export async function analyser(
  options?: { trigger?: string; publier?: boolean },
): Promise<RapportAutoBranchement> {
  const trigger = options?.trigger ?? "manuel";
  const s = synthese();
  const mortes = await destinationsMortes();
  const muets = ecransMuets();
  const props = await propositions();
  const publies: string[] = [];

  const aPublier = options?.publier !== false;
  const vivantes = mortes.filter((d) => !d.rattrapeeParRedirection);

  if (aPublier) {
    await emitSafe({
      type: "cliquables.audit_termine",
      source: "auto_branchement",
      payload: {
        total: s.total,
        ecrans: s.ecrans,
        couvertureMoteur: s.couvertureMoteur,
        sansAction: s.parMotif.sans_action,
        destinationsMortes: vivantes.length,
        trigger,
      },
    });
    publies.push("cliquables.audit_termine");

    // Une destination citée souvent est une section absente, pas une faute de
    // frappe : elle part au Système Intelligent, qui décide s'il ouvre un
    // dossier aux Intelligences.
    for (const d of vivantes.filter((x) => x.occurrences >= SEUIL_DOSSIER).slice(0, 20)) {
      await emitSafe({
        type: "cliquable.destination_morte",
        source: "auto_branchement",
        payload: {
          destination: d.destination,
          occurrences: d.occurrences,
          ecrans: d.ecrans.join(", "),
        },
      });
      publies.push(`cliquable.destination_morte:${d.destination}`);
    }
  }

  // Mémoire technique : l'état des cliquables devient un fait daté, réutilisable
  // par les Intelligences au lieu d'être recalculé de zéro à chaque session.
  try {
    const { ecrire } = await import("../intelligences/memoire.js");
    await ecrire({
      categorie: "technique",
      cle: "auto_branchement:etat",
      titre: "Auto-branchement des cliquables — état de la plateforme",
      contenu:
        `${s.total} cliquable(s) sur ${s.ecrans} écran(s). ` +
        `Couverture Moteur de boutons : ${s.couvertureMoteur} %. ` +
        `${s.parMotif.sans_action} bouton(s) sans action, ${vivantes.length} destination(s) morte(s), ` +
        `${mortes.length - vivantes.length} rattrapée(s) par le Moteur de Redirection. ` +
        `Déclenchement : ${trigger}.`,
      source: "auto_branchement.analyser",
    });
  } catch (err) {
    console.error("[auto-branchement] mémoire technique:", (err as Error).message);
  }

  // Santé : le module sait faire son travail dès qu'il a un inventaire ; il est
  // dégradé si l'inventaire est vide (générateur non exécuté).
  try {
    await heartbeat("auto_branchement", s.total === 0 ? "degraded" : "ok", {
      message:
        s.total === 0
          ? "Inventaire des cliquables vide : lancer npm run gen:cliquables."
          : `${s.total} cliquable(s) analysés, ${s.anomalies} anomalie(s), ${vivantes.length} destination(s) morte(s).`,
      metrics: {
        cliquables: s.total,
        ecrans: s.ecrans,
        couvertureMoteur: s.couvertureMoteur,
        sansAction: s.parMotif.sans_action,
        destinationsMortes: vivantes.length,
      },
    });
  } catch (err) {
    console.error("[auto-branchement] battement de cœur:", (err as Error).message);
  }

  return {
    synthese: s,
    destinationsMortes: mortes,
    destinationsRattrapees: mortes.length - vivantes.length,
    ecransMuets: muets,
    propositions: props,
    publies,
    trigger,
    date: new Date().toISOString(),
  };
}

/** Santé du module pour le registre et l'audit d'activation. */
export async function health(): Promise<{ status: "up" | "degraded" | "down"; message: string }> {
  const s = synthese();
  if (s.total === 0) {
    return {
      status: "down",
      message: "Aucun cliquable inventorié : le générateur n'a jamais été exécuté.",
    };
  }
  if (s.anomalies > 0) {
    return {
      status: "up",
      message: `${s.total} cliquable(s) suivis, ${s.anomalies} anomalie(s) nommée(s) et publiées.`,
    };
  }
  return { status: "up", message: `${s.total} cliquable(s) suivis, aucune anomalie.` };
}
