/**
 * Connexion à GitHub avec le jeton du Coffre secret — LECTURE SEULE.
 *
 * Deux usages, rien d'autre :
 *  - vérifier que le jeton déposé donne bien accès au dépôt de la plateforme ;
 *  - lister les dernières exécutions du workflow Android (« Android — App
 *    Bundles ») et les fichiers (artefacts) qu'elles ont produits.
 *
 * Volontairement absent : lancer un workflow, pousser du code, ouvrir une PR,
 * fusionner. Le flux décidé par le PDG (1er octobre 2026) est « le moteur
 * pousse, le PDG déploie à la main » ; lancer le workflow Android demandera un
 * outil distinct, avec approbation humaine.
 *
 * Contraintes de sûreté : hôte et dépôt FIXES (rien n'est pris de la demande du
 * modèle), uniquement des requêtes GET, aucune redirection suivie, délai
 * borné, et le jeton n'est jamais renvoyé ni journalisé.
 */
import { lireSecretPourOutil } from "./coffre.js";

export const DEPOT_GITHUB = "projet-Auto-plus-Africa-MKAPMS/mkapms-web";
export const WORKFLOW_ANDROID = "android-aab.yml";
/** Nom exact du secret attendu dans le coffre (même nom que le catalogue « Connecter les outils »). */
export const NOM_SECRET_JETON_GITHUB = "GitHub — jeton mkapms-web";

const API = "https://api.github.com";
const DELAI_MS = 15_000;

type Fetch = typeof fetch;

export interface ConnexionGithub {
  ok: boolean;
  detail: string;
  depot?: string;
  prive?: boolean;
  brancheParDefaut?: string;
  droits?: { lecture: boolean; ecriture: boolean; administration: boolean };
}

export interface ExecutionAndroid {
  id: number;
  statut: string;
  conclusion: string | null;
  branche: string;
  commit: string;
  declencheur: string;
  creeLe: string;
  url: string;
}

export interface ArtefactAndroid {
  nom: string;
  tailleOctets: number;
  expire: boolean;
}

export interface ExecutionsAndroid {
  ok: boolean;
  detail: string;
  executions: ExecutionAndroid[];
  /** Artefacts de la dernière exécution terminée avec succès, s'il y en a une. */
  dernierSucces: { executionId: number; artefacts: ArtefactAndroid[] } | null;
}

async function get(chemin: string, jeton: string, fetchImpl: Fetch): Promise<{ statut: number; corps: unknown }> {
  const reponse = await fetchImpl(`${API}${chemin}`, {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(DELAI_MS),
    headers: {
      Authorization: `Bearer ${jeton}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mkapms-ai",
    },
  });
  let corps: unknown = null;
  try {
    corps = await reponse.json();
  } catch {
    // Corps absent ou non JSON : on ne s'appuie alors que sur le statut.
  }
  return { statut: reponse.status, corps };
}

function detailErreur(statut: number, corps: unknown): string {
  if (statut === 401) return "GitHub refuse le jeton (invalide, révoqué ou expiré). Déposez-en un nouveau dans le Coffre secret.";
  if (statut === 403) {
    const message = typeof (corps as { message?: unknown } | null)?.message === "string" ? String((corps as { message: string }).message) : "";
    if (/rate limit/i.test(message)) return "GitHub limite temporairement les requêtes. Réessayez dans quelques minutes.";
    return "GitHub refuse l'accès : le jeton n'a pas la permission demandée sur ce dépôt.";
  }
  if (statut === 404) return "Dépôt ou workflow introuvable avec ce jeton (le jeton n'est peut-être pas autorisé sur le dépôt mkapms-web).";
  return `GitHub a répondu avec une erreur (${statut}).`;
}

export async function verifierConnexion(jeton: string, fetchImpl: Fetch = fetch): Promise<ConnexionGithub> {
  let r: { statut: number; corps: unknown };
  try {
    r = await get(`/repos/${DEPOT_GITHUB}`, jeton, fetchImpl);
  } catch {
    return { ok: false, detail: "GitHub n'a pas répondu (réseau ou délai dépassé)." };
  }
  if (r.statut !== 200) return { ok: false, detail: detailErreur(r.statut, r.corps) };
  const d = r.corps as { full_name?: string; private?: boolean; default_branch?: string; permissions?: { pull?: boolean; push?: boolean; admin?: boolean } };
  const droits = { lecture: d.permissions?.pull === true, ecriture: d.permissions?.push === true, administration: d.permissions?.admin === true };
  return {
    ok: true,
    detail: droits.ecriture
      ? "Connexion à GitHub vérifiée : lecture et écriture sur le dépôt."
      : "Connexion à GitHub vérifiée : lecture seule sur le dépôt (le jeton ne permet pas d'écrire).",
    depot: String(d.full_name ?? DEPOT_GITHUB),
    prive: d.private === true,
    brancheParDefaut: String(d.default_branch ?? ""),
    droits,
  };
}

interface RunBrut {
  id?: number;
  status?: string;
  conclusion?: string | null;
  head_branch?: string;
  head_sha?: string;
  event?: string;
  created_at?: string;
  html_url?: string;
}

export async function listerExecutionsAndroid(jeton: string, fetchImpl: Fetch = fetch): Promise<ExecutionsAndroid> {
  const echec = (detail: string): ExecutionsAndroid => ({ ok: false, detail, executions: [], dernierSucces: null });
  try {
    const r = await get(`/repos/${DEPOT_GITHUB}/actions/workflows/${WORKFLOW_ANDROID}/runs?per_page=5`, jeton, fetchImpl);
    if (r.statut !== 200) return echec(detailErreur(r.statut, r.corps));
    const brut = ((r.corps as { workflow_runs?: RunBrut[] } | null)?.workflow_runs ?? []).slice(0, 5);
    const executions: ExecutionAndroid[] = brut.map((x) => ({
      id: Number(x.id ?? 0),
      statut: String(x.status ?? ""),
      conclusion: x.conclusion ?? null,
      branche: String(x.head_branch ?? ""),
      commit: String(x.head_sha ?? "").slice(0, 7),
      declencheur: String(x.event ?? ""),
      creeLe: String(x.created_at ?? ""),
      url: String(x.html_url ?? ""),
    }));

    let dernierSucces: ExecutionsAndroid["dernierSucces"] = null;
    const succes = executions.find((e) => e.conclusion === "success");
    if (succes) {
      const a = await get(`/repos/${DEPOT_GITHUB}/actions/runs/${succes.id}/artifacts`, jeton, fetchImpl);
      if (a.statut === 200) {
        const liste = (a.corps as { artifacts?: { name?: string; size_in_bytes?: number; expired?: boolean }[] } | null)?.artifacts ?? [];
        dernierSucces = {
          executionId: succes.id,
          artefacts: liste.map((f) => ({ nom: String(f.name ?? ""), tailleOctets: Number(f.size_in_bytes ?? 0), expire: f.expired === true })),
        };
      }
    }
    return {
      ok: true,
      detail: executions.length === 0
        ? "Aucune exécution du workflow Android pour l'instant."
        : `${executions.length} exécution(s) récente(s) du workflow Android.`,
      executions,
      dernierSucces,
    };
  } catch {
    return echec("GitHub n'a pas répondu (réseau ou délai dépassé).");
  }
}

/** Lit le jeton dans le coffre (journalisé, avec motif) ; ne renvoie jamais autre chose qu'un échec lisible. */
export async function jetonDepuisCoffre(ownerId: number, outil: string, motif: string): Promise<{ ok: true; jeton: string } | { ok: false; detail: string }> {
  const lu = await lireSecretPourOutil({ ownerId, nom: NOM_SECRET_JETON_GITHUB, outil, motif });
  if (!lu.ok) return { ok: false, detail: `${lu.detail} Déposez le jeton sous le nom « ${NOM_SECRET_JETON_GITHUB} » (Coffre secret → Connecter les outils → GitHub).` };
  if (lu.contenu.type !== "cle_api") return { ok: false, detail: `Le secret « ${NOM_SECRET_JETON_GITHUB} » doit être de type « Clé ou jeton ».` };
  return { ok: true, jeton: lu.contenu.valeur };
}
