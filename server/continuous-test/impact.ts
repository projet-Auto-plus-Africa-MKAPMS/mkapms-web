/**
 * Point 142 — après une modification, tester ce qui est concerné.
 *
 * Le moteur de contrôle existait déjà (points 108-113) mais il ne savait
 * exécuter que « tout » ou « un domaine choisi à la main ». Ce qui manquait :
 * partir de la modification pour désigner les contrôles concernés.
 *
 * La sélection ne s'invente pas : les fichiers touchés sont rapprochés du
 * Code Knowledge Graph (point 135), qui sait déjà quels tests, routes, API et
 * tables dépendent d'un moteur. Les correspondances par nom de dossier ne
 * servent que de repli, et c'est écrit dans le motif.
 *
 * Règle du point 142 tenue jusqu'au bout : « mobile non concerné → test de
 * non-régression ». Un domaine non concerné n'est donc pas ignoré, il est
 * contrôlé en non-régression sur ses seuls scénarios critiques. Sinon une
 * modification pourrait casser au loin sans que personne ne le voie.
 */
import { impact as impactCode } from "../code-graph/service.js";
import { SCENARIOS } from "./catalog.js";

/** Rapproche un chemin de fichier d'un domaine de contrôle. */
const REGLES: { motif: RegExp; domaines: string[] }[] = [
  { motif: /server\/payment|stripe|payment-engine|payment-orchestrator/i, domaines: ["payment"] },
  { motif: /seo|sitemap|robots|indexation/i, domaines: ["seo", "indexation"] },
  { motif: /permission|roles|auth/i, domaines: ["permission"] },
  { motif: /redirection|routes|router\.ts/i, domaines: ["redirection"] },
  { motif: /event-bus/i, domaines: ["event_bus"] },
  { motif: /engine-registry/i, domaines: ["engine_registry"] },
  { motif: /code-graph/i, domaines: ["code_graph"] },
  { motif: /intelligences/i, domaines: ["intelligences"] },
  { motif: /country|language/i, domaines: ["country", "language"] },
  { motif: /product-engine|merchant/i, domaines: ["product_engine"] },
  { motif: /annonce|vehicle|depot-annonce/i, domaines: ["annonces"] },
  { motif: /smart-engine/i, domaines: ["smart"] },
  { motif: /central-engines|completion/i, domaines: ["central", "completion"] },
  { motif: /client\/src\/pages/i, domaines: ["redirection", "core"] },
];

export interface Selection {
  /** Domaines réellement concernés par la modification. */
  concernes: string[];
  /** Scénarios à exécuter parce qu'ils portent sur ce qui a changé. */
  scenariosConcernes: string[];
  /** Scénarios critiques des autres domaines : la non-régression. */
  scenariosNonRegression: string[];
  motifs: string[];
}

/**
 * Désigne les contrôles à exécuter pour une modification donnée.
 * `fichiers` : chemins modifiés. `moteurs` : moteurs déclarés touchés.
 */
export async function selectionner(input: {
  fichiers?: string[];
  moteurs?: string[];
}): Promise<Selection> {
  const fichiers = (input.fichiers ?? []).filter((f) => f.trim().length > 0);
  const moteurs = (input.moteurs ?? []).filter((m) => m.trim().length > 0);
  const concernes = new Set<string>();
  const motifs: string[] = [];

  // 1. Ce que le graphe du code sait des moteurs déclarés touchés.
  for (const m of moteurs) {
    try {
      const i = await impactCode(m);
      if (!i.trouve) {
        motifs.push(`« ${m} » est inconnu du relevé de code : sélection par nom de dossier seulement.`);
      } else {
        concernes.add(m.replace(/^moteur:/, ""));
        if (i.tests.length > 0) {
          motifs.push(`${m} : ${i.tests.length} test(s) rattaché(s) dans le graphe du code.`);
        }
        for (const dep of i.dependants) {
          const nom = dep.split(":").pop();
          if (nom) concernes.add(nom);
        }
        if (i.dependants.length > 0) {
          motifs.push(
            `${m} : ${i.dependants.length} moteur(s) dépendant(s) ajouté(s) — une modification se propage en amont, pas seulement chez elle.`,
          );
        }
      }
    } catch (e) {
      motifs.push(`Graphe du code illisible pour « ${m} » : ${(e as Error).message}`);
    }
  }

  // 2. Ce que les chemins modifiés désignent.
  for (const f of fichiers) {
    const touchees = REGLES.filter((r) => r.motif.test(f));
    if (touchees.length === 0) {
      motifs.push(`Aucun domaine de contrôle ne couvre « ${f} » : ce fichier n'est vérifié par aucun scénario.`);
      continue;
    }
    for (const r of touchees) for (const d of r.domaines) concernes.add(d);
  }

  const domainesExistants = new Set(SCENARIOS.map((s) => s.domaine));
  const retenus = [...concernes].filter((d) => domainesExistants.has(d));
  const ignores = [...concernes].filter((d) => !domainesExistants.has(d));
  if (ignores.length > 0) {
    motifs.push(
      `Domaine(s) sans aucun scénario : ${ignores.join(", ")} — la modification n'y est donc pas vérifiée.`,
    );
  }

  const scenariosConcernes = SCENARIOS.filter((s) => retenus.includes(s.domaine)).map((s) => s.id);
  const scenariosNonRegression = SCENARIOS.filter(
    (s) => !retenus.includes(s.domaine) && s.criticite === "critique",
  ).map((s) => s.id);

  if (retenus.length === 0) {
    motifs.push(
      "Aucun domaine identifié : par prudence, tous les contrôles critiques sont exécutés en non-régression.",
    );
  }

  return { concernes: retenus, scenariosConcernes, scenariosNonRegression, motifs };
}
