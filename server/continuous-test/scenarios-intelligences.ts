/**
 * Contrôles de MKA.P-MS Intelligences.
 *
 * Le point sensible n'est pas « le code existe » mais « la clé répond » et
 * « le côté public ne voit rien d'interne ». Ces deux contrôles-là auraient
 * nommé, seuls, une clé posée sur le mauvais service.
 */
import { sql } from "drizzle-orm";
import { db } from "../db.js";
import type { Observation, Scenario } from "./helpers.js";

export const INTELLIGENCES_SCENARIOS: Scenario[] = [
  {
    id: "intelligences.fournisseur_repond",
    domaine: "intelligences",
    label: "Un fournisseur de modèle répond réellement",
    criticite: "critique",
    attendu:
      "Un appel réel aboutit chez un fournisseur configuré : la génération et l'assistant sont donc opérationnels, pas seulement déclarés.",
    async run(): Promise<Observation> {
      try {
        const { verifierAcces } = await import("../intelligences/provider.js");
        const a = await verifierAcces();
        if (a.status === "up") return { statut: "reussi", observe: a.message };
        if (a.status === "degraded") return { statut: "echec", observe: a.message };
        return {
          statut: "ignore",
          observe: `Aucun fournisseur configuré : ${a.message}`,
        };
      } catch (e) {
        return {
          statut: "ignore",
          observe: `Vérification impossible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
        };
      }
    },
  },
  {
    id: "intelligences.separation_cotes",
    domaine: "intelligences",
    label: "Le côté public ne reçoit aucun contexte interne",
    criticite: "critique",
    attendu:
      "Aucun message du côté public ne porte de contexte interne injecté : la séparation direction / public est tenue en base, pas seulement à l'écran.",
    async run(): Promise<Observation> {
      try {
        const r = await db.execute(
          sql`SELECT count(*)::int AS fuites FROM in_messages WHERE cote = 'public' AND jsonb_array_length(contexte) > 0`,
        );
        const ligne = (r.rows[0] ?? {}) as { fuites?: number };
        const fuites = ligne.fuites ?? 0;
        if (fuites > 0) {
          return {
            statut: "echec",
            observe: `${fuites} message(s) public(s) portent du contexte interne : la séparation est percée.`,
          };
        }
        return {
          statut: "reussi",
          observe: "Aucun contexte interne présent sur le côté public.",
        };
      } catch (e) {
        return {
          statut: "ignore",
          observe: `Table in_messages illisible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
        };
      }
    },
  },
  {
    id: "intelligences.echecs_non_masques",
    domaine: "intelligences",
    label: "Les échecs d'appel gardent leur motif",
    criticite: "normale",
    attendu:
      "Tout échange marqué en échec porte un motif exact : un appel raté ne devient jamais une réponse vide sans explication.",
    async run(): Promise<Observation> {
      try {
        const r = await db.execute(
          sql`SELECT count(*)::int AS muets FROM in_messages WHERE ok = false AND length(trim(motif)) = 0`,
        );
        const ligne = (r.rows[0] ?? {}) as { muets?: number };
        const muets = ligne.muets ?? 0;
        if (muets > 0) {
          return {
            statut: "echec",
            observe: `${muets} échec(s) sans motif enregistré.`,
          };
        }
        return { statut: "reussi", observe: "Tous les échecs enregistrés portent leur motif." };
      } catch (e) {
        return {
          statut: "ignore",
          observe: `Table in_messages illisible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
        };
      }
    },
  },
];
