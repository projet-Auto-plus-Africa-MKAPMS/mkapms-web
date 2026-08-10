/**
 * Point 73 — le filtre qui rend la fermeture RÉELLE.
 *
 * Avant, « mode maintenance » n'était qu'un drapeau en base : aucun visiteur
 * n'était arrêté. Ici, quand une portée est fermée, les écritures publiques
 * sont refusées côté serveur — mais l'administration reste entièrement
 * joignable, c'est exactement la distinction demandée : fermer au public
 * n'est pas éteindre la plateforme.
 *
 * Ce qui n'est jamais filtré :
 *  • les comptes direction / PDG (administration sécurisée) ;
 *  • les lectures (le back-office, la supervision et les journaux continuent) ;
 *  • les points de santé, les webhooks de paiement et la route de résilience
 *    elle-même — sinon on ne pourrait plus rouvrir.
 */
import type { NextFunction, Request, Response } from "express";
import { isDirection } from "@shared/roles.js";
import { verifyToken } from "../auth.js";
import { publicAccessCached } from "./service.js";

/** Chemins tRPC toujours autorisés, même plateforme fermée. */
const ALWAYS_ALLOWED = ["resilience.", "auth.", "platform.status"];

function actorIsDirection(req: Request): boolean {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  const token = bearer || cookies?.token || null;
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && isDirection(payload.role);
}

export async function publicWriteGate(req: Request, res: Response, next: NextFunction) {
  // Les lectures ne sont jamais coupées : la supervision doit rester possible.
  if (req.method !== "POST") return next();

  const path = req.path.replace(/^\//, "");
  if (ALWAYS_ALLOWED.some((p) => path.startsWith(p))) return next();

  try {
    const acces = await publicAccessCached();
    if (acces.open) return next();
    if (actorIsDirection(req)) return next();

    return res.status(503).json({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message:
          acces.message ??
          "MKA.P-MS est momentanément fermée au public. Vos données sont intactes et le service revient prochainement.",
        maintenance: { level: acces.level, scope: acces.scope, scopeKey: acces.scopeKey },
      },
    });
  } catch {
    // Un défaut du filtre ne doit pas fermer la plateforme par accident.
    return next();
  }
}
