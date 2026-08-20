/**
 * Point 127 — API interne `/api/v1/*` des capacités.
 *
 * Surface stable et versionnée pour les moteurs et, plus tard, les applications
 * MKA.P-MS : on demande une capacité, jamais un fournisseur. Le contrat ne
 * changera pas sous les pieds des appelants — une évolution incompatible
 * ouvrira `/api/v2`.
 *
 * Sécurité : la même session que le reste de la plateforme (cookie ou
 * « Bearer »), et les permissions du rôle décident, capacité par capacité.
 * Aucune clé de fournisseur ne traverse cette API.
 */
import { Router, type Request, type Response } from "express";
import { verifyToken } from "../auth.js";
import { CAPACITES, registre, resume, type CodeCapacite } from "./capacites.js";
import { router as routerCapacite } from "./routeur.js";
import { orchestrer } from "./orchestrateur.js";
import { etat as etatAutonomie } from "./autonomie.js";
import { normaliser, type Piece } from "./multimodal.js";

function role(req: Request): { role: string | null; uid: number | null } {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const token = bearer || ((req as Request & { cookies?: Record<string, string> }).cookies?.token ?? null);
  if (!token) return { role: null, uid: null };
  const payload = verifyToken(token);
  return payload ? { role: payload.role, uid: payload.uid } : { role: null, uid: null };
}

export const apiV1 = Router();

/** Contrat : ce que l'API sait faire, avec l'état constaté de chaque capacité. */
apiV1.get("/intelligences/capacites", async (req: Request, res: Response) => {
  const { role: r } = role(req);
  if (!r) return res.status(401).json({ ok: false, motif: "Connexion requise." });
  const [liste, r2] = await Promise.all([registre(), resume()]);
  return res.json({
    ok: true,
    version: "v1",
    resume: r2,
    capacites: liste.map((c) => ({
      code: c.code,
      libelle: c.libelle,
      usage: c.usage,
      etat: c.etat,
      motif: c.motif,
      permission: c.permission,
      confidentialiteMax: c.confidentialiteMax,
      repli: c.fallback,
    })),
  });
});

/** Exécution d'une capacité. Refus écrit et motivé, jamais de réponse inventée. */
apiV1.post("/intelligences/executer", async (req: Request, res: Response) => {
  const { role: r } = role(req);
  if (!r) return res.status(401).json({ ok: false, motif: "Connexion requise." });

  const body = req.body as {
    capacite?: string;
    moteur?: string;
    message?: string;
    systeme?: string;
    confidentialite?: "publique" | "personnelle" | "confidentielle";
    countryCode?: string | null;
    maxTokens?: number;
  };

  const codes = CAPACITES.map((c) => c.code) as string[];
  if (!body.capacite || !codes.includes(body.capacite)) {
    return res.status(400).json({
      ok: false,
      motif: `Capacité inconnue. Capacités du registre : ${codes.join(", ")}.`,
    });
  }
  if (!body.message || body.message.trim().length < 2) {
    return res.status(400).json({ ok: false, motif: "Demande vide." });
  }

  const resultat = await routerCapacite({
    capacite: body.capacite as CodeCapacite,
    moteur: body.moteur?.trim() || "",
    message: body.message,
    systeme: body.systeme ?? "Réponds avec exactitude. Ce que tu ignores, dis-le.",
    role: r,
    confidentialite: body.confidentialite,
    countryCode: body.countryCode ?? null,
    maxTokens: body.maxTokens,
  });

  // Un refus n'est pas une erreur serveur : c'est une décision, avec son motif.
  return res.status(resultat.ok ? 200 : 409).json({
    ok: resultat.ok,
    capacite: resultat.capacite,
    texte: resultat.texte,
    motif: resultat.motif,
    repli: resultat.repli,
    fournisseur: resultat.fournisseur,
    modele: resultat.modele,
    dureeMs: resultat.dureeMs,
  });
});

/**
 * Point 128 — routes nommées. `/v1/reason`, `/v1/code`, `/v1/vision`… ne sont
 * pas des moteurs séparés : ce sont des alias lisibles vers une capacité du
 * registre. Une application appelle un verbe métier, jamais un fournisseur.
 */
const ALIAS: Record<string, CodeCapacite> = {
  reason: "raisonnement",
  code: "code",
  image: "image",
  vision: "vision",
  search: "recherche",
  transcribe: "transcription",
  speech: "voix",
  realtime: "temps_reel",
  translate: "traduction",
  document: "documents",
  automotive: "raisonnement",
  tools: "outils",
  automate: "automatisation",
  audio: "audio",
  diarize: "diarisation",
};

/** Contexte métier ajouté par l'alias : la capacité reste la même. */
const CONSIGNE: Record<string, string> = {
  automotive:
    "Tu réponds sur le domaine automobile (véhicules, entretien, pièces, réglementation). Ce que tu ignores, dis-le au lieu de l'inventer.",
};

for (const [verbe, capacite] of Object.entries(ALIAS)) {
  apiV1.post(`/${verbe}`, async (req: Request, res: Response) => {
    const { role: r } = role(req);
    if (!r) return res.status(401).json({ ok: false, motif: "Connexion requise." });

    const body = req.body as {
      message?: string;
      moteur?: string;
      systeme?: string;
      pieces?: Piece[];
      confidentialite?: "publique" | "personnelle" | "confidentielle";
      countryCode?: string | null;
      maxTokens?: number;
    };
    if (!body.message || body.message.trim().length < 2) {
      return res.status(400).json({ ok: false, motif: "Demande vide." });
    }

    // Point 133 — les pièces jointes sont converties avant l'appel, et celles
    // qu'aucune capacité ne sait lire sont rendues à l'appelant, pas oubliées.
    const lu = await normaliser(body.message, body.pieces ?? []);

    const resultat = await routerCapacite({
      capacite,
      moteur: body.moteur?.trim() || "",
      message: lu.texte,
      systeme:
        body.systeme ??
        CONSIGNE[verbe] ??
        "Réponds avec exactitude. Ce que tu ignores, dis-le.",
      role: r,
      confidentialite: body.confidentialite,
      countryCode: body.countryCode ?? null,
      images: lu.images.length > 0 ? lu.images : undefined,
      maxTokens: body.maxTokens,
    });

    return res.status(resultat.ok ? 200 : 409).json({
      ok: resultat.ok,
      capacite: resultat.capacite,
      texte: resultat.texte,
      motif: resultat.motif,
      repli: resultat.repli,
      fournisseur: resultat.fournisseur,
      modele: resultat.modele,
      dureeMs: resultat.dureeMs,
      piecesNonLues: lu.nonLues,
    });
  });
}

/**
 * Point 130 — `/v1/agent/run` : un objectif, un plan exécuté jusqu'à la limite
 * d'autorisation, un rapport. L'appelant n'orchestre rien lui-même.
 */
apiV1.post("/agent/run", async (req: Request, res: Response) => {
  const { role: r, uid } = role(req);
  if (!r) return res.status(401).json({ ok: false, motif: "Connexion requise." });

  const body = req.body as {
    objectif?: string;
    pieces?: Piece[];
    countryCode?: string | null;
  };
  if (!body.objectif || body.objectif.trim().length < 5) {
    return res.status(400).json({
      ok: false,
      motif: "Objectif trop court : décrivez ce qui doit être obtenu.",
    });
  }

  const mission = await orchestrer({
    objectif: body.objectif,
    role: r,
    actorId: uid ?? undefined,
    pieces: body.pieces ?? [],
    countryCode: body.countryCode ?? null,
  });

  // Une mission arrêtée n'est pas une erreur serveur : c'est un refus motivé.
  return res.status(mission.statut === "accomplie" ? 200 : 409).json({
    ok: mission.statut === "accomplie",
    mission,
  });
});

/** Curseur d'autonomie en lecture : l'appelant sait ce qui est ouvert. */
apiV1.get("/intelligences/autonomie", async (req: Request, res: Response) => {
  const { role: r } = role(req);
  if (!r) return res.status(401).json({ ok: false, motif: "Connexion requise." });
  return res.json({ ok: true, version: "v1", domaines: await etatAutonomie() });
});
