/**
 * MKA.P-MS Engine Registry
 *
 * Nom visible : "Registre des Moteurs MKA.P-MS"
 * Nom technique : "MKA.P-MS Engine Registry"
 *
 * Module isolé (Phase 1 — Fondations) : registre central sur lequel le Core
 * Engine s'appuie pour connaître l'état, la version, les dépendances et la
 * santé de chaque moteur, et pour tracer les événements inter-moteurs.
 *
 * 100 % additif — ne modifie AUCUNE table existante. Connecté de manière
 * contrôlée via un sous-router tRPC réservé au PDG (+ heartbeat/événements
 * appelés côté serveur par les moteurs).
 */
export { engineRegistryRouter } from "./router.js";
export * as engineRegistrySchema from "./schema.js";
export {
  registerEngine,
  ensureSeeded,
  publishEvent,
  heartbeat,
} from "./service.js";
