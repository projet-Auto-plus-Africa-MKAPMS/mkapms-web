/**
 * MKA.P-MS — Router des deux moteurs centraux (Phase 55).
 *
 * Accès :
 *  - Intelligence & Décision → PDG uniquement (`pdgProcedure`).
 *  - Supervision & Opérations → PDG + Directeur (`directionProcedure`).
 *
 * Lecture seule : aucune mutation. Les décisions sensibles restent validées
 * ailleurs (Smart Engine / optimisations) par un humain.
 */
import { pdgProcedure, directionProcedure, router } from "../trpc.js";
import {
  CENTRAL_ENGINES_META,
  intelligenceReport,
  supervisionReport,
} from "./index.js";

export const centralEnginesRouter = router({
  meta: directionProcedure.query(() => CENTRAL_ENGINES_META),

  // Moteur 1 — Intelligence & Décision (PDG uniquement).
  intelligence: pdgProcedure.query(() => intelligenceReport()),

  // Moteur 2 — Supervision & Opérations (PDG + Directeur).
  supervision: directionProcedure.query(() => supervisionReport()),
});
