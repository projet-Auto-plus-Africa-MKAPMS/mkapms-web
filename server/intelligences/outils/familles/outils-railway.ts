/**
 * MKA.P-MS AI — implémentation réelle de "railway_deploiement.getDeploymentStatus".
 * Seul cet outil de la famille est IMPLEMENTED : triggerDeployment et
 * rollbackDeployment restent REGISTERED_NOT_IMPLEMENTED (server/intelligences/
 * outils/familles/globales.ts) — cette application ne déclenche jamais un
 * déploiement elle-même.
 */
import type { ImplementationOutil } from "../outils-test.js";
import { dernierEtat } from "../../deploiement/railway.js";

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  "railway_deploiement.getDeploymentStatus": async () => dernierEtat(),
};
