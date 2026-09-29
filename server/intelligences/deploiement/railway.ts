/**
 * Lecture réelle de l'état d'un déploiement Railway (API publique GraphQL v2,
 * https://backboard.railway.com/graphql/v2, authentification par jeton de
 * projet — en-tête Project-Access-Token).
 *
 * Ce module ne déclenche et ne relance jamais un déploiement : lecture seule,
 * volontairement. Sans jeton réel configuré, l'indisponibilité est rapportée
 * telle quelle — jamais un statut supposé ou inventé.
 */
import { env } from "../../env.js";

const ENDPOINT = "https://backboard.railway.com/graphql/v2";

export interface DeploiementRailway {
  id: string;
  status: string;
  createdAt: string;
  url: string | null;
}

export interface EtatRailway {
  disponible: boolean;
  motif: string;
  deploiements: DeploiementRailway[];
}

interface ReponseGraphQL {
  data?: { deployments?: { edges?: { node: DeploiementRailway }[] } };
  errors?: { message: string }[];
}

async function appelGraphQL(query: string, variables: Record<string, unknown>): Promise<ReponseGraphQL["data"]> {
  const reponse = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Project-Access-Token": env.RAILWAY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const corps = (await reponse.json()) as ReponseGraphQL;
  if (!reponse.ok || corps.errors?.length) {
    throw new Error(corps.errors?.[0]?.message ?? `Railway a répondu ${reponse.status}.`);
  }
  return corps.data;
}

/**
 * Les N derniers déploiements du service configuré. Aucune corrélation par
 * commit n'est tentée ici — pas assez fiable pour être présentée comme sûre :
 * le plus récent (index 0) est celui à rapprocher visuellement de ce que la
 * personne vient de publier.
 */
export async function dernierEtat(limite = 5): Promise<EtatRailway> {
  if (!env.RAILWAY_TOKEN || !env.RAILWAY_PROJECT_ID || !env.RAILWAY_SERVICE_ID || !env.RAILWAY_ENVIRONMENT_ID) {
    return {
      disponible: false,
      motif:
        "RAILWAY_TOKEN, RAILWAY_PROJECT_ID, RAILWAY_SERVICE_ID ou RAILWAY_ENVIRONMENT_ID absent : statut réellement indisponible, jamais un statut supposé.",
      deploiements: [],
    };
  }
  try {
    const data = await appelGraphQL(
      `query deployments($input: DeploymentListInput!, $first: Int) {
        deployments(input: $input, first: $first) {
          edges { node { id status createdAt url } }
        }
      }`,
      {
        input: {
          projectId: env.RAILWAY_PROJECT_ID,
          serviceId: env.RAILWAY_SERVICE_ID,
          environmentId: env.RAILWAY_ENVIRONMENT_ID,
        },
        first: limite,
      },
    );
    const deploiements: DeploiementRailway[] = (data?.deployments?.edges ?? []).map((e) => ({
      id: e.node.id,
      status: e.node.status,
      createdAt: e.node.createdAt,
      url: e.node.url ?? null,
    }));
    return { disponible: true, motif: "", deploiements };
  } catch (e) {
    return {
      disponible: false,
      motif: `Appel Railway échoué : ${e instanceof Error ? e.message : "erreur inconnue"}.`,
      deploiements: [],
    };
  }
}
