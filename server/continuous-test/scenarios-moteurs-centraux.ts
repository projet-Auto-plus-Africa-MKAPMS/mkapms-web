/**
 * Point 114 — contrôle des deux grands moteurs.
 *
 * Les deux moteurs centraux (Intelligence & Décision, Supervision &
 * Opérations) ne sont pas contrôlés sur leur existence mais sur ce qu'ils font
 * réellement : répondre, voir leurs moteurs enfants, recevoir les événements,
 * garder une mémoire, remonter des alertes, rester disponibles et **reprendre
 * après une panne**.
 *
 * Un contrôle qui ne peut pas s'exécuter renvoie « ignoré » avec son motif :
 * un prérequis absent n'est pas une preuve de bon fonctionnement.
 */
import { lignes, scalaire, type Observation, type Scenario } from "./helpers.js";

async function supervision() {
  const { supervisionReport } = await import("../central-engines/index.js");
  return supervisionReport();
}

export const MOTEURS_CENTRAUX_SCENARIOS: Scenario[] = [
  {
    id: "central.supervision_repond",
    domaine: "central",
    label: "Moteur Supervision & Opérations : il répond et voit les moteurs",
    criticite: "critique",
    attendu: "Le rapport de supervision est produit et contient au moins un moteur observé.",
    async run(): Promise<Observation> {
      try {
        const r = await supervision();
        if (r.engines.length === 0)
          return {
            statut: "echec",
            observe: "Rapport produit mais aucun moteur observé : le moteur central ne voit rien.",
          };
        return {
          statut: "reussi",
          observe: `${r.engines.length} moteur(s) observé(s), ${r.anomalies.length} anomalie(s) relevée(s).`,
        };
      } catch (e) {
        return {
          statut: "echec",
          observe: `Le moteur de supervision n'a pas répondu : ${e instanceof Error ? e.message : "erreur inconnue"}`,
        };
      }
    },
  },
  {
    id: "central.intelligence_repond",
    domaine: "central",
    label: "Moteur Intelligence & Décision : il répond au PDG",
    criticite: "critique",
    attendu: "Le rapport d'intelligence est produit sans erreur.",
    async run(): Promise<Observation> {
      try {
        const { intelligenceReport } = await import("../central-engines/index.js");
        const r = await intelligenceReport();
        return {
          statut: "reussi",
          observe: `Rapport d'intelligence produit le ${r.generatedAt}.`,
        };
      } catch (e) {
        return {
          statut: "echec",
          observe: `Le moteur d'intelligence n'a pas répondu : ${e instanceof Error ? e.message : "erreur inconnue"}`,
        };
      }
    },
  },
  {
    id: "central.moteurs_enfants",
    domaine: "central",
    label: "Moteurs enfants : tous les moteurs enregistrés remontent au central",
    criticite: "critique",
    attendu: "Chaque moteur du registre apparaît dans le rapport du moteur central.",
    async run(): Promise<Observation> {
      const total = await scalaire(`SELECT count(*)::int AS n FROM "engine_registry"`);
      if (total === null)
        return { statut: "ignore", observe: "Registre des moteurs inaccessible." };
      try {
        const r = await supervision();
        if (r.engines.length < total)
          return {
            statut: "echec",
            observe: `${total} moteur(s) enregistré(s) mais ${r.engines.length} seulement remontent au moteur central : ${total - r.engines.length} enfant(s) hors de vue.`,
          };
        return {
          statut: "reussi",
          observe: `${r.engines.length} moteur(s) enfant(s) visibles pour ${total} enregistré(s).`,
        };
      } catch (e) {
        return {
          statut: "echec",
          observe: `Rapport central indisponible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
        };
      }
    },
  },
  {
    id: "central.commandes_recues",
    domaine: "central",
    label: "Commandes : chaque demande reçue laisse une trace exploitable",
    criticite: "normale",
    attendu:
      "Aucune commande enregistrée ne reste sans verdict ni motif : une demande sans trace n'est pas pilotable.",
    async run(): Promise<Observation> {
      const muettes = await scalaire(
        `SELECT count(*)::int AS n FROM "cc_commands"
           WHERE "verdict" IS NULL OR "verdict" = '' OR "reason" IS NULL OR "reason" = ''`,
      );
      if (muettes === null)
        return { statut: "ignore", observe: "Centre de Commandes non installé (cc_commands absente)." };
      const total = (await scalaire(`SELECT count(*)::int AS n FROM "cc_commands"`)) ?? 0;
      if (muettes > 0)
        return {
          statut: "echec",
          observe: `${muettes} commande(s) sur ${total} sans verdict ni motif enregistré.`,
        };
      return {
        statut: "reussi",
        observe:
          total === 0
            ? "Aucune commande reçue à ce jour, et aucune trace incomplète."
            : `${total} commande(s) reçues, toutes avec verdict et motif.`,
      };
    },
  },
  {
    id: "central.memoire_technique",
    domaine: "central",
    label: "Mémoire : le relevé du code est ingéré et exploitable",
    criticite: "normale",
    attendu: "Au moins un relevé de code est en mémoire, avec ses nœuds et ses liens.",
    async run(): Promise<Observation> {
      const relevés = await scalaire(`SELECT count(*)::int AS n FROM "cg_snapshots"`);
      if (relevés === null)
        return { statut: "ignore", observe: "Mémoire technique non installée (cg_snapshots absente)." };
      if (relevés === 0)
        return {
          statut: "echec",
          observe: "Aucun relevé de code ingéré : le moteur central n'a aucune mémoire du code.",
        };
      const noeuds = (await scalaire(`SELECT count(*)::int AS n FROM "cg_nodes"`)) ?? 0;
      const liens = (await scalaire(`SELECT count(*)::int AS n FROM "cg_edges"`)) ?? 0;
      if (noeuds === 0 || liens === 0)
        return {
          statut: "echec",
          observe: `Relevé présent mais vide (${noeuds} nœud(s), ${liens} lien(s)).`,
        };
      return {
        statut: "reussi",
        observe: `${relevés} relevé(s) en mémoire, ${noeuds} nœuds et ${liens} liens exploitables.`,
      };
    },
  },
  {
    id: "central.alertes_remontees",
    domaine: "central",
    label: "Alertes : les anomalies des moteurs deviennent des alertes",
    criticite: "critique",
    attendu:
      "Si des moteurs sont dégradés ou muets, une alerte moteur ouverte existe — sinon aucune anomalie n'est signalée.",
    async run(): Promise<Observation> {
      let anomalies = 0;
      try {
        anomalies = (await supervision()).anomalies.length;
      } catch (e) {
        return {
          statut: "ignore",
          observe: `Supervision indisponible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
        };
      }
      const ouvertes = await scalaire(
        `SELECT count(*)::int AS n FROM "smart_alerts" WHERE "status" = 'open' AND "category" = 'moteur'`,
      );
      if (ouvertes === null)
        return { statut: "ignore", observe: "Table des alertes inaccessible." };
      if (anomalies > 0 && ouvertes === 0)
        return {
          statut: "echec",
          observe: `${anomalies} anomalie(s) moteur constatée(s) mais aucune alerte ouverte : la direction n'est pas prévenue.`,
        };
      return {
        statut: "reussi",
        observe: `${anomalies} anomalie(s) constatée(s), ${ouvertes} alerte(s) moteur ouverte(s).`,
      };
    },
  },
  {
    id: "central.reprise_apres_panne",
    domaine: "central",
    label: "Reprise après panne : une remise échouée est réellement réessayée",
    criticite: "critique",
    attendu:
      "Aucune remise en échec de plus de 30 minutes avec une seule tentative : la reprise doit avoir eu lieu.",
    async run(): Promise<Observation> {
      const bloquees = await lignes<{ event_type: string; engine: string; tentatives: number }>(
        `SELECT "event_type", "engine", "tentatives" FROM "eb_deliveries"
           WHERE "statut" = 'echec' AND "tentatives" < 2
             AND "created_at" < now() - interval '30 minutes'
           ORDER BY "id" DESC LIMIT 20`,
      );
      if (bloquees === null)
        return { statut: "ignore", observe: "Bus d'événements non installé (eb_deliveries absente)." };
      if (bloquees.length > 0)
        return {
          statut: "echec",
          observe: `${bloquees.length} remise(s) en échec jamais réessayée(s) : ${bloquees
            .slice(0, 5)
            .map((b) => `${b.engine}/${b.event_type}`)
            .join(", ")}`,
        };
      const passes = (await scalaire(`SELECT count(*)::int AS n FROM "eb_dispatch_runs"`)) ?? 0;
      return {
        statut: "reussi",
        observe: `Aucune remise abandonnée après échec (${passes} passe(s) de distribution enregistrée(s)).`,
      };
    },
  },
  {
    id: "central.disponibilite",
    domaine: "central",
    label: "Disponibilité : les deux moteurs centraux signalent leur présence",
    criticite: "critique",
    attendu:
      "Les moteurs « core » et « smart » ont émis un battement de cœur depuis moins de 24 heures.",
    async run(): Promise<Observation> {
      const rows = await lignes<{ name: string; age_min: number | null }>(
        `SELECT "name", EXTRACT(EPOCH FROM (now() - "last_heartbeat")) / 60 AS age_min
           FROM "engine_registry" WHERE "name" IN ('core', 'smart')`,
      );
      if (rows === null)
        return { statut: "ignore", observe: "Registre des moteurs inaccessible." };
      if (rows.length < 2)
        return {
          statut: "echec",
          observe: `Les deux moteurs centraux ne sont pas tous enregistrés (${rows.map((r) => r.name).join(", ") || "aucun"}).`,
        };
      const muets = rows.filter((r) => r.age_min === null || Number(r.age_min) > 24 * 60);
      if (muets.length > 0)
        return {
          statut: "echec",
          observe: `Moteur(s) central(aux) sans signal depuis plus de 24 h : ${muets.map((m) => m.name).join(", ")}.`,
        };
      return {
        statut: "reussi",
        observe: rows
          .map((r) => `${r.name} : signal il y a ${Math.round(Number(r.age_min))} min`)
          .join(" ; "),
      };
    },
  },
  {
    id: "central.graphe_a_jour",
    domaine: "code_graph",
    label: "Mémoire technique alignée sur le code déployé",
    criticite: "normale",
    attendu: "Le relevé ingéré correspond au relevé généré au dernier build.",
    async run(): Promise<Observation> {
      try {
        const { health } = await import("../code-graph/service.js");
        const h = await health();
        if (h.status === "up") return { statut: "reussi", observe: h.message };
        if (h.status === "degraded") return { statut: "echec", observe: h.message };
        return { statut: "ignore", observe: h.message };
      } catch (e) {
        return {
          statut: "ignore",
          observe: `Mémoire technique indisponible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
        };
      }
    },
  },
];
