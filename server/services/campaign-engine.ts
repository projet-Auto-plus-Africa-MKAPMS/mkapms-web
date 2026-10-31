import { randomBytes } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import { db } from "../db.js";
import { emailCampaigns, newsletterSubscribers } from "../schema.js";
import { sendEmail, emailCampagne } from "./email.js";

/**
 * Relie deux pièces qui existaient déjà séparément : la base d'abonnés consentants
 * (newsletterSubscribers, server/routers/marketing.ts) et l'envoi transactionnel
 * (server/services/email.ts) — rien ne les reliait avant ce fichier. Jamais d'envoi
 * en un seul geste : prepareCampaign() compte l'audience réelle sans rien envoyer,
 * confirmSend() déclenche l'envoi effectif — même principe de validation humaine
 * explicite que partner-engine/service.ts ("emailing… envoi possible après
 * validation humaine").
 */

function publicBase(): string {
  return (process.env.PUBLIC_BASE_URL || "https://mkapms.fr").replace(/\/+$/, "");
}

function audienceCondition(pays?: string | null) {
  const base = eq(newsletterSubscribers.active, true);
  return pays ? and(base, eq(newsletterSubscribers.pays, pays)) : base;
}

/** Compte réel, sans rien envoyer — ce que confirme le Fondateur avant d'engager un envoi. */
export async function prepareCampaign(pays?: string | null): Promise<{ recipients: number }> {
  const [row] = await db
    .select({ n: count() })
    .from(newsletterSubscribers)
    .where(audienceCondition(pays ?? null));
  return { recipients: Number(row?.n ?? 0) };
}

export async function createCampaign(input: { subject: string; message: string; pays?: string | null; createdBy?: number }) {
  const { recipients } = await prepareCampaign(input.pays ?? null);
  const [campaign] = await db
    .insert(emailCampaigns)
    .values({
      subject: input.subject,
      message: input.message,
      pays: input.pays ?? null,
      createdBy: input.createdBy ?? null,
      totalRecipients: recipients,
    })
    .returning();
  return campaign;
}

export async function listCampaigns() {
  return db.select().from(emailCampaigns).orderBy(emailCampaigns.createdAt);
}

function ensureUnsubscribeToken(current: string | null): string {
  return current ?? randomBytes(24).toString("hex");
}

/**
 * Envoi réel, séquentiel (pas de rafale parallèle vers le fournisseur SMTP). Ne bloque
 * jamais la requête qui l'a déclenché : confirmSend() ne l'attend pas (fire-and-forget
 * dans le même process). Chaque échec est compté honnêtement, jamais absorbé en silence
 * ni présenté comme un envoi réussi.
 */
export async function sendCampaignBatch(campaignId: number): Promise<void> {
  const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, campaignId));
  if (!campaign || campaign.status !== "sending") return;

  const subscribers = await db
    .select()
    .from(newsletterSubscribers)
    .where(audienceCondition(campaign.pays));

  let sent = 0;
  let failed = 0;
  for (const subscriber of subscribers) {
    const token = ensureUnsubscribeToken(subscriber.unsubscribeToken);
    if (token !== subscriber.unsubscribeToken) {
      await db.update(newsletterSubscribers).set({ unsubscribeToken: token }).where(eq(newsletterSubscribers.id, subscriber.id));
    }
    const unsubscribeUrl = `${publicBase()}/desabonnement?token=${encodeURIComponent(token)}`;
    const html = emailCampagne(campaign.message, unsubscribeUrl);
    const ok = await sendEmail(subscriber.email, campaign.subject, html);
    if (ok) sent++;
    else failed++;
  }

  await db
    .update(emailCampaigns)
    .set({ status: "sent", totalRecipients: subscribers.length, totalSent: sent, totalFailed: failed, sentAt: new Date() })
    .where(eq(emailCampaigns.id, campaignId));
}

/**
 * Transition atomique draft→sending (WHERE status='draft' empêche un double déclenchement
 * concurrent de relancer un deuxième envoi) puis lance sendCampaignBatch sans l'attendre —
 * la mutation tRPC qui appelle confirmSend() répond immédiatement, l'envoi continue en tâche
 * de fond dans le même process (aucune file d'attente/worker séparé n'existe sur ce dépôt,
 * jamais inventé un mécanisme parallèle pour ce seul besoin).
 */
export async function confirmSend(campaignId: number): Promise<{ started: boolean; recipients: number }> {
  const result = await db
    .update(emailCampaigns)
    .set({ status: "sending" })
    .where(and(eq(emailCampaigns.id, campaignId), eq(emailCampaigns.status, "draft")))
    .returning({ id: emailCampaigns.id, totalRecipients: emailCampaigns.totalRecipients });
  const row = result[0];
  if (!row) return { started: false, recipients: 0 };
  void sendCampaignBatch(campaignId).catch((e) => console.error(`[campaign-engine] Échec envoi campagne ${campaignId}:`, e));
  return { started: true, recipients: row.totalRecipients };
}

/** Désabonnement sans connexion requise — jamais un lien générique, un jeton par abonné. */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  if (!token) return false;
  const result = await db
    .update(newsletterSubscribers)
    .set({ active: false, updatedAt: new Date() })
    .where(and(eq(newsletterSubscribers.unsubscribeToken, token), eq(newsletterSubscribers.active, true)))
    .returning({ id: newsletterSubscribers.id });
  return result.length > 0;
}
