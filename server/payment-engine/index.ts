/**
 * MKA.P-MS Payment Engine
 *
 * Nom visible : "Moteur de Paiement MKA.P-MS"
 * Nom technique : "MKA.P-MS Payment Engine"
 *
 * Module isolé (Phase 2) : moteur de paiement propriétaire. Stripe et les autres
 * prestataires sont de simples connecteurs d'exécution ; les règles métier
 * (référence interne, statuts, rapprochement, virements, RIB, règles par pays)
 * vivent ici. 100 % additif — la table `payments` existante n'est pas modifiée.
 *
 * État `staging` dans le registre des moteurs tant que l'intégration n'est pas
 * validée par la Direction.
 */
export { paymentEngineRouter } from "./router.js";
export * as paymentSchema from "./schema.js";
export {
  createTransaction,
  setStatus,
  getByReference,
  isIbanFormatValid,
} from "./service.js";
export {
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  isPaidStatus,
  type PaymentStatus,
  type PaymentMethod,
} from "./constants.js";
