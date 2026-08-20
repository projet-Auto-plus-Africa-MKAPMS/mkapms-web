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
