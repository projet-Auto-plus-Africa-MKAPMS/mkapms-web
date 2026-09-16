/**
 * MKA.P-MS Activation Audit — Matrice de causes (chantier moteurs, point
 * « matrice de causes pour les moteurs partielle »).
 *
 * `service.ts::buildItem` ne construit `manquant[]` qu'à partir de 9
 * phrases fixes (voir la liste ci-dessous, une par ligne source) — jamais
 * un texte libre. Ce fichier ne fait que NOMMER ces 9 phrases dans le
 * vocabulaire demandé (NO_BACKEND_ROUTE, NO_TEST_EVIDENCE…), sans recalculer
 * ni réinterpréter l'audit : un domaine classé ici l'est parce que le
 * moteur d'audit a déjà observé le manque, jamais par supposition.
 *
 * Volontairement absents de CAUSE_CODES : NO_PERMISSION,
 * NO_COUNTRY_CONFIGURATION, NO_EXTERNAL_ACCESS, PLACEHOLDER_FRONTEND,
 * HARDCODED_DATA. L'audit d'activation n'observe aujourd'hui aucune preuve
 * qui permette de les distinguer mécaniquement (ce sont des jugements
 * métier par domaine — contrôle technique, Finance+, fournisseur/
 * transporteur — traités individuellement ailleurs dans ce chantier,
 * jamais par une règle générique qui inventerait la distinction).
 *
 * NO_REAL_DATA n'est PAS en soi un défaut : un domaine construit, connecté
 * et testé mais sans donnée réelle peut être légitimement
 * OPERATIONAL_EMPTY (le PDG n'a encore rien saisi/vendu dans ce domaine).
 * Cette matrice nomme la cause, elle ne préjuge jamais du verdict final.
 */
import type { AuditItem } from "./service.js";

export const CAUSE_CODES = [
  "NO_BACKEND_ROUTE",
  "MISSING_ENGINE",
  "NO_HEALTH_CHECK",
  "NO_FRONTEND_CONSUMER",
  "NO_REAL_DATA",
  "NO_TEST_EVIDENCE",
  "OTHER",
] as const;
export type CauseCode = (typeof CAUSE_CODES)[number];

export const CAUSE_LABELS: Record<CauseCode, string> = {
  NO_BACKEND_ROUTE: "Aucune procédure tRPC exposée pour ce moteur",
  MISSING_ENGINE: "Dépendance ou table déclarée absente (registre ou base)",
  NO_HEALTH_CHECK: "Aucun battement de cœur reçu, ou périmé",
  NO_FRONTEND_CONSUMER: "Aucune route visiteur rattachée (moteur sans écran)",
  NO_REAL_DATA: "Aucune donnée réelle dans le stockage du domaine",
  NO_TEST_EVIDENCE: "Aucune preuve de test enregistrée",
  OTHER: "Autre (santé technique dégradée)",
};

/**
 * Correspondance exacte, phrase par phrase, avec service.ts::buildItem.
 * Une entrée de `manquant[]` qui ne correspondrait à aucun préfixe ici
 * tombe dans OTHER plutôt que d'être silencieusement ignorée.
 */
function classifierUneLigne(ligne: string): CauseCode {
  if (ligne === "aucune procédure tRPC exposée pour ce moteur") return "NO_BACKEND_ROUTE";
  if (ligne.startsWith("dépendance absente du registre")) return "MISSING_ENGINE";
  if (ligne.startsWith("table(s) absente(s)")) return "MISSING_ENGINE";
  if (ligne === "aucun battement de cœur reçu") return "NO_HEALTH_CHECK";
  if (ligne === "dernier battement périmé") return "NO_HEALTH_CHECK";
  if (ligne === "aucune route visiteur rattachée") return "NO_FRONTEND_CONSUMER";
  if (ligne === "aucune donnée réelle dans le stockage du domaine") return "NO_REAL_DATA";
  if (ligne === "aucune preuve de test enregistrée") return "NO_TEST_EVIDENCE";
  return "OTHER";
}

export interface LigneMatriceCauses {
  domain: string;
  label: string;
  etat: string;
  causes: CauseCode[];
}

export interface MatriceCauses {
  lignes: LigneMatriceCauses[];
  parCause: Record<CauseCode, number>;
}

/** Classe chaque domaine par ses causes réelles — jamais un total recalculé. */
export function matriceCauses(items: readonly AuditItem[]): MatriceCauses {
  const lignes: LigneMatriceCauses[] = items
    .filter((i) => i.manquant.length > 0)
    .map((i) => ({
      domain: i.domain,
      label: i.label,
      etat: i.etat,
      causes: Array.from(new Set(i.manquant.map(classifierUneLigne))),
    }));

  const parCause = CAUSE_CODES.reduce((acc, c) => ({ ...acc, [c]: 0 }), {} as Record<CauseCode, number>);
  for (const l of lignes) for (const c of l.causes) parCause[c] += 1;

  return { lignes, parCause };
}
