/**
 * Connexion Google — compte unique et parcours des applications Android.
 *
 * Le site utilise le bouton Google Identity Services (jeton d'identité vérifié
 * par auth.googleLogin). Google refuse ce bouton dans une WebView embarquée :
 * les applications ouvrent donc le navigateur du téléphone sur
 * /api/auth/google/app/demarrer, Google renvoie sur /api/auth/google/app/retour,
 * et le serveur rend la main à l'application par son schéma (applicationId) avec
 * un ticket à usage unique, échangé ensuite par auth.googleTicket.
 */
import { randomUUID } from "node:crypto";
import { Router, type Request } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";
import { db } from "./db.js";
import { env } from "./env.js";
import { users } from "./schema.js";
import { makeReference } from "./reference.js";
import { verifyGoogleIdToken, type GoogleProfile } from "./auth.js";

export const APPLICATION_ID = /^com\.mkapms\.[a-z]+$/;
const DUREE_ETAT = "10m";
const DUREE_TICKET_S = 120;
const ticketsUtilises = new Map<string, number>();

type Compte = typeof users.$inferSelect;

export function googleApplicationConfiguree(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

/** Compte rattaché à l'adresse Google vérifiée : créé s'il n'existe pas, lié sinon. */
export async function compteDepuisGoogle(profile: GoogleProfile): Promise<Compte> {
  const email = profile.email.toLowerCase();
  let [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u) {
    [u] = await db
      .insert(users)
      .values({
        email,
        name: profile.name,
        googleId: profile.googleId,
        avatarUrl: profile.picture,
        emailVerified: true,
        role: "user",
      })
      .returning();
    const reference = makeReference("U", u.id);
    await db.update(users).set({ reference }).where(eq(users.id, u.id));
    u.reference = reference;
  } else if (!u.googleId) {
    await db.update(users).set({ googleId: profile.googleId, emailVerified: true }).where(eq(users.id, u.id));
  }
  return u;
}

export function creerTicketApplication(uid: number): string {
  return jwt.sign({ uid, t: "google-app", jti: randomUUID() }, env.JWT_SECRET, { expiresIn: DUREE_TICKET_S });
}

/** Ticket valide une seule fois, pendant deux minutes ; renvoie l'identifiant du compte. */
export function consommerTicketApplication(ticket: string): number | null {
  let charge: { uid?: unknown; t?: unknown; jti?: unknown; exp?: unknown };
  try {
    charge = jwt.verify(ticket, env.JWT_SECRET) as typeof charge;
  } catch {
    return null;
  }
  if (charge.t !== "google-app" || typeof charge.uid !== "number" || typeof charge.jti !== "string") return null;
  const maintenant = Date.now();
  for (const [cle, expire] of ticketsUtilises) if (expire < maintenant) ticketsUtilises.delete(cle);
  if (ticketsUtilises.has(charge.jti)) return null;
  ticketsUtilises.set(charge.jti, typeof charge.exp === "number" ? charge.exp * 1000 : maintenant + DUREE_TICKET_S * 1000);
  return charge.uid;
}

function origine(req: Request): string {
  const proto = String(req.headers["x-forwarded-proto"] ?? req.protocol).split(",")[0].trim();
  return `${proto}://${req.get("host")}`;
}

const adresseRetour = (req: Request) => `${origine(req)}/api/auth/google/app/retour`;

function retourApplication(app: string, params: Record<string, string>): string {
  return `${app}://auth/google?${new URLSearchParams(params).toString()}`;
}

export const googleApplicationRouter = Router();

googleApplicationRouter.get("/demarrer", (req, res) => {
  const app = String(req.query.app ?? "");
  if (!APPLICATION_ID.test(app)) return res.status(400).type("text").send("Application inconnue.");
  if (!googleApplicationConfiguree()) {
    return res.redirect(retourApplication(app, { erreur: "La connexion Google n'est pas configurée sur ce site." }));
  }
  const etat = jwt.sign({ app, t: "google-app-etat" }, env.JWT_SECRET, { expiresIn: DUREE_ETAT });
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, adresseRetour(req));
  res.redirect(
    client.generateAuthUrl({
      scope: ["openid", "email", "profile"],
      state: etat,
      prompt: "select_account",
    }),
  );
});

googleApplicationRouter.get("/retour", async (req, res) => {
  let app: string;
  try {
    const etat = jwt.verify(String(req.query.state ?? ""), env.JWT_SECRET) as { app?: unknown; t?: unknown };
    if (etat.t !== "google-app-etat" || typeof etat.app !== "string" || !APPLICATION_ID.test(etat.app)) throw new Error();
    app = etat.app;
  } catch {
    return res.status(400).type("text").send("Demande de connexion expirée. Recommencez depuis l'application.");
  }
  if (req.query.error) return res.redirect(retourApplication(app, { erreur: "Connexion Google annulée." }));
  try {
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, adresseRetour(req));
    const { tokens } = await client.getToken(String(req.query.code ?? ""));
    const profile = tokens.id_token ? await verifyGoogleIdToken(tokens.id_token) : null;
    if (!profile) return res.redirect(retourApplication(app, { erreur: "Google n'a pas confirmé cette adresse." }));
    const u = await compteDepuisGoogle(profile);
    if (u.status !== "active") {
      return res.redirect(retourApplication(app, { erreur: u.status === "suspended" ? "Ce compte a été suspendu." : "Ce compte n'est plus actif." }));
    }
    res.redirect(retourApplication(app, { ticket: creerTicketApplication(u.id) }));
  } catch (e) {
    console.warn("[auth-google] retour", e instanceof Error ? e.message : e);
    res.redirect(retourApplication(app, { erreur: "La connexion Google a échoué. Réessayez." }));
  }
});
