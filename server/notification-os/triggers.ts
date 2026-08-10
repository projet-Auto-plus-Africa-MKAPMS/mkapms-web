/**
 * Notification OS — Catalogue de déclencheurs + point d'entrée unique (Phase 42).
 *
 * RÈGLE : aucun service n'envoie de notification de son côté. Tous passent par
 * `notifyEvent(...)`, qui :
 *   1. résout l'événement dans le catalogue (canaux, catégorie, libellés) ;
 *   2. crée la notification interne (table `notifications`) en respectant les
 *      préférences utilisateur (in-app activé, catégorie non mutée) ;
 *   3. met en file les canaux email / sms / push via `dispatch()` (préférences
 *      + heures silencieuses gérées par le moteur) ;
 *   4. journalise le tout.
 *
 * Ce module CONSOLIDE l'existant : la table `notifications` et le dispatch
 * multi-canaux existent déjà — on ajoute la couche « déclencheurs » unifiée.
 */
import { inArray } from "drizzle-orm";
import { db } from "../db.js";
import { notifications, users } from "../schema.js";
import { dispatch, getUserPrefs } from "./index.js";

export type NotifChannel = "email" | "sms" | "push" | "inapp";

export interface TriggerDef {
  /** Catégorie pour le mute utilisateur + regroupement. */
  category: string;
  /** Canaux par défaut de l'événement. */
  channels: NotifChannel[];
  /** Type stocké dans la table `notifications` (in-app). */
  inappType: string;
  /** Titre in-app (interpolable avec {{vars}}). */
  title: string;
  /** Corps in-app (interpolable). */
  body?: string;
  /** Alerte administrateur (envoyée aussi au PDG/admin). */
  adminAlert?: boolean;
}

/**
 * Catalogue complet des déclencheurs demandés (Phase 42). `templateKey` =
 * clé de l'événement, réutilisée pour retrouver un template email/sms/push
 * personnalisé dans `notif_templates` (sinon fallback sur le libellé in-app).
 */
export const NOTIFICATION_TRIGGERS: Record<string, TriggerDef> = {
  // ── Compte ──────────────────────────────────────────────────────────────
  inscription: { category: "compte", channels: ["email", "inapp"], inappType: "systeme", title: "Bienvenue sur MKA.P-MS", body: "Votre compte a été créé." },
  connexion: { category: "securite", channels: ["inapp"], inappType: "securite", title: "Nouvelle connexion", body: "Une connexion à votre compte vient d'avoir lieu." },
  changement_mot_de_passe: { category: "securite", channels: ["email", "inapp"], inappType: "securite", title: "Mot de passe modifié", body: "Votre mot de passe a été changé." },
  compte_valide: { category: "compte", channels: ["email", "inapp"], inappType: "validation", title: "Compte validé", body: "Votre compte est validé." },
  // ── Annonces ──────────────────────────────────────────────────────────────
  annonce_depot: { category: "annonces", channels: ["inapp"], inappType: "annonce", title: "Annonce déposée", body: "Votre annonce « {{titre}} » a été déposée." },
  annonce_validee: { category: "annonces", channels: ["email", "inapp"], inappType: "validation", title: "Annonce en ligne", body: "Votre annonce « {{titre}} » est en ligne." },
  annonce_refusee: { category: "annonces", channels: ["email", "inapp"], inappType: "validation", title: "Annonce refusée", body: "Votre annonce « {{titre}} » a été refusée : {{motif}}." },
  // ── Réservations / rendez-vous ──────────────────────────────────────────
  reservation: { category: "reservations", channels: ["email", "inapp"], inappType: "reservation", title: "Réservation confirmée", body: "Votre réservation {{reference}} est confirmée." },
  rdv_garage: { category: "reservations", channels: ["email", "inapp"], inappType: "reservation", title: "Rendez-vous garage", body: "Rendez-vous {{date}} chez {{garage}}." },
  rappel_rdv: { category: "reservations", channels: ["push", "inapp"], inappType: "reservation", title: "Rappel de rendez-vous", body: "Rappel : rendez-vous {{date}}." },
  livraison: { category: "livraison", channels: ["email", "inapp"], inappType: "livraison", title: "Livraison", body: "Votre livraison {{reference}} : {{statut}}." },
  // ── Paiement (interconnexion Payment OS) ────────────────────────────────
  paiement: { category: "paiement", channels: ["email", "inapp"], inappType: "paiement", title: "Paiement confirmé", body: "Paiement de {{montant}} confirmé (réf. {{reference}})." },
  paiement_echoue: { category: "paiement", channels: ["email", "inapp"], inappType: "paiement", title: "Paiement échoué", body: "Le paiement {{reference}} a échoué." },
  remboursement: { category: "paiement", channels: ["email", "inapp"], inappType: "paiement", title: "Remboursement", body: "Un remboursement de {{montant}} a été effectué." },
  abonnement: { category: "abonnement", channels: ["email", "inapp"], inappType: "abonnement", title: "Abonnement activé", body: "Votre abonnement {{formule}} est actif." },
  abonnement_expiration: { category: "abonnement", channels: ["email", "push", "inapp"], inappType: "abonnement", title: "Abonnement bientôt expiré", body: "Votre abonnement {{formule}} expire le {{date}}." },
  // ── Enchères ──────────────────────────────────────────────────────────────
  enchere_nouvelle: { category: "encheres", channels: ["push", "inapp"], inappType: "enchere", title: "Nouvelle enchère", body: "Nouvelle enchère sur {{lot}}." },
  enchere_gagnee: { category: "encheres", channels: ["email", "push", "inapp"], inappType: "enchere", title: "Enchère gagnée", body: "Vous avez remporté {{lot}}." },
  // ── Messagerie / documents ──────────────────────────────────────────────
  message_nouveau: { category: "messagerie", channels: ["push", "inapp"], inappType: "message", title: "Nouveau message", body: "Vous avez reçu un message." },
  devis: { category: "documents", channels: ["email", "inapp"], inappType: "devis", title: "Nouveau devis", body: "Un devis {{reference}} vous a été transmis." },
  facture: { category: "documents", channels: ["email", "inapp"], inappType: "facture", title: "Nouvelle facture", body: "Votre facture {{reference}} est disponible." },
  // ── Compte professionnel ────────────────────────────────────────────────
  pro_dossier_recu: { category: "compte", channels: ["email", "inapp"], inappType: "systeme", title: "Dossier professionnel reçu", body: "Votre dossier {{metier}} ({{pays}}) est en cours de vérification." },
  pro_dossier_decision: { category: "compte", channels: ["email", "inapp"], inappType: "systeme", title: "Dossier professionnel — {{decision}}", body: "{{note}}" },
  pro_compte_active: { category: "compte", channels: ["email", "push", "inapp"], inappType: "systeme", title: "Compte professionnel activé", body: "Vos services professionnels sont accessibles depuis votre tableau de bord." },
  // ── Réseau partenaires ──────────────────────────────────────────────────
  partenaire_candidature: { category: "compte", channels: ["email", "inapp"], inappType: "systeme", title: "Candidature partenaire reçue", body: "Votre candidature {{reference}} ({{metier}}) est en cours d'examen." },
  partenaire_decision: { category: "compte", channels: ["email", "inapp"], inappType: "systeme", title: "Candidature partenaire — {{decision}}", body: "{{note}}" },
  opportunite_partenaire: { category: "systeme", channels: ["email", "inapp"], inappType: "systeme", title: "Zone sans partenaire — {{service}}", body: "{{zone}} : {{detail}}", adminAlert: true },
  // ── Assurance & recharge (point 45) ─────────────────────────────────────
  assurance_demande_recue: { category: "compte", channels: ["email", "inapp"], inappType: "systeme", title: "Demande d'assurance reçue", body: "Votre demande {{reference}} ({{formule}}) est transmise à {{assureurs}} assureur(s) partenaire(s)." },
  assurance_sans_assureur: { category: "compte", channels: ["email", "inapp"], inappType: "systeme", title: "Demande d'assurance enregistrée", body: "Votre demande {{reference}} est enregistrée : aucun assureur partenaire ne couvre encore {{pays}}. Nous revenons vers vous dès qu'un partenaire est référencé." },
  assurance_offre_disponible: { category: "compte", channels: ["email", "push", "inapp"], inappType: "systeme", title: "Offre d'assurance disponible", body: "Une offre a été enregistrée pour votre demande {{reference}} : {{montant}}." },
  assurance_demande_a_traiter: { category: "systeme", channels: ["email", "inapp"], inappType: "systeme", title: "Demande d'assurance à traiter — {{pays}}", body: "{{reference}} ({{formule}}) : {{detail}}", adminAlert: true },
  borne_declaration_a_valider: { category: "systeme", channels: ["inapp"], inappType: "systeme", title: "Borne de recharge à valider — {{ville}}", body: "{{operateur}} : {{detail}}", adminAlert: true },
  // ── Avis & réputation ───────────────────────────────────────────────────
  avis_demande_apres_prestation: { category: "compte", channels: ["email", "push", "inapp"], inappType: "systeme", title: "Votre avis sur {{service}}", body: "{{detail}} Votre avis sera marqué « Expérience vérifiée ».", },
  avis_recu_professionnel: { category: "compte", channels: ["email", "inapp"], inappType: "systeme", title: "Nouvel avis reçu — {{note}}/5", body: "{{extrait}}", },
  avis_verification_requise: { category: "systeme", channels: ["inapp"], inappType: "systeme", title: "Avis en vérification — avis #{{avis}}", body: "Signaux détectés : {{signaux}}. Aucune suppression n'est appliquée sans décision motivée.", adminAlert: true },
  avis_reponse_a_traiter: { category: "compte", channels: ["email", "inapp"], inappType: "systeme", title: "Avis à traiter — {{note}}/5", body: "{{extrait}} Vous pouvez répondre publiquement depuis votre espace.", },
  // ── Intelligence financière ─────────────────────────────────────────────
  anomalie_financiere: { category: "systeme", channels: ["email", "inapp"], inappType: "systeme", title: "Anomalie financière — {{severite}}", body: "{{detail}}", adminAlert: true },
  // ── Système / admin ─────────────────────────────────────────────────────
  erreur_importante: { category: "systeme", channels: ["email", "inapp"], inappType: "systeme", title: "Erreur importante", body: "{{message}}", adminAlert: true },
  partenaire_candidature_recue: { category: "systeme", channels: ["inapp"], inappType: "systeme", title: "Nouvelle candidature partenaire — {{metier}}", body: "{{societe}} ({{zone}}) attend une décision.", adminAlert: true },
  rapport_quotidien: { category: "systeme", channels: ["email", "inapp"], inappType: "systeme", title: "Rapport quotidien du {{date}}", body: "{{resume}}", adminAlert: true },
  moteur_hors_service: { category: "systeme", channels: ["email", "inapp"], inappType: "systeme", title: "Moteur hors service — {{moteur}}", body: "{{detail}}", adminAlert: true },
};

export type NotificationEvent = keyof typeof NOTIFICATION_TRIGGERS;

function interpolate(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => String(vars[k] ?? ""));
}

export interface NotifyEventInput {
  userId: number;
  event: NotificationEvent | string;
  vars?: Record<string, string | number>;
  /** Lien profond in-app (ex: /vehicule/123). */
  url?: string;
  language?: string;
  /** Restreint les canaux (sous-ensemble du catalogue). */
  channels?: NotifChannel[];
}

export interface NotifyEventResult {
  event: string;
  inapp: "created" | "skipped";
  channels: { channel: NotifChannel; status: string }[];
  /** Comptes de direction également prévenus (déclencheurs `adminAlert`). */
  adminRecipients?: number[];
}

/**
 * Destinataires des alertes de supervision : PDG et administration.
 * Une alerte système sans destinataire est une alerte perdue.
 */
export async function directionRecipients(): Promise<number[]> {
  try {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.role, ["super_admin", "admin"]));
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}

/**
 * Point d'entrée UNIQUE des notifications de la plateforme.
 * Best-effort : ne lève jamais (une notification ratée ne doit pas casser un
 * flux métier). Retourne le détail de ce qui a été fait.
 */
export async function notifyEvent(input: NotifyEventInput): Promise<NotifyEventResult> {
  const def = NOTIFICATION_TRIGGERS[input.event];
  const vars = input.vars ?? {};
  const result: NotifyEventResult = { event: input.event, inapp: "skipped", channels: [] };

  // Un déclencheur de supervision (`adminAlert`) doit atteindre la direction,
  // qu'il concerne un client ou la plateforme elle-même. Sans destinataire
  // client (userId absent ou 0), l'alerte partait dans le vide.
  if (def?.adminAlert) {
    const recipients = (await directionRecipients()).filter((id) => id !== input.userId);
    result.adminRecipients = recipients;
    for (const userId of recipients) {
      await deliver({ ...input, userId }, def, vars, { event: input.event, inapp: "skipped", channels: [] });
    }
  }
  if (!input.userId || input.userId <= 0) return result;

  if (!def) {
    // Événement inconnu : on journalise en in-app générique pour ne rien perdre.
    try {
      await db.insert(notifications).values({
        userId: input.userId, type: "systeme",
        title: input.event, body: JSON.stringify(vars).slice(0, 500), url: input.url ?? null,
      });
      result.inapp = "created";
    } catch { /* best-effort */ }
    return result;
  }

  return deliver(input, def, vars, result);
}

/** Livraison à un destinataire précis (in-app + canaux externes). */
async function deliver(
  input: NotifyEventInput,
  def: TriggerDef,
  vars: Record<string, string | number>,
  result: NotifyEventResult,
): Promise<NotifyEventResult> {
  const prefs = await getUserPrefs(input.userId).catch(() => null);
  const muted = prefs ? (prefs.mutedCategories as string[]).includes(def.category) : false;
  const wanted = (input.channels ?? def.channels).filter((c) => def.channels.includes(c));

  // 1. In-app (respecte inappEnabled + mute)
  const inappEnabled = prefs ? prefs.inappEnabled : true;
  if (wanted.includes("inapp") && inappEnabled && !muted) {
    try {
      await db.insert(notifications).values({
        userId: input.userId,
        type: def.inappType,
        title: interpolate(def.title, vars).slice(0, 160),
        body: def.body ? interpolate(def.body, vars) : null,
        url: input.url ?? null,
      });
      result.inapp = "created";
    } catch { /* best-effort */ }
  }

  // 2. Canaux externes (email / sms / push) via le dispatch existant
  for (const channel of wanted) {
    if (channel === "inapp") continue;
    try {
      const r = await dispatch({
        userId: input.userId,
        templateKey: input.event,
        channel,
        language: input.language,
        vars,
        category: def.category,
      });
      result.channels.push({ channel, status: r.status });
    } catch {
      result.channels.push({ channel, status: "failed" });
    }
  }

  return result;
}

/**
 * Alerte de supervision sans destinataire client : elle part à la direction.
 * Retourne les comptes réellement prévenus — s'il n'y en a aucun, l'appelant
 * le sait au lieu de croire l'alerte transmise.
 */
export async function notifyDirection(
  event: NotificationEvent | string,
  vars: Record<string, string | number> = {},
  url?: string,
): Promise<{ event: string; recipients: number[] }> {
  const def = NOTIFICATION_TRIGGERS[event];
  const recipients = await directionRecipients();
  for (const userId of recipients) {
    if (def) {
      await deliver({ userId, event, vars, url }, def, vars, { event, inapp: "skipped", channels: [] });
    } else {
      try {
        await db.insert(notifications).values({
          userId, type: "systeme",
          title: String(event).slice(0, 160), body: JSON.stringify(vars).slice(0, 500), url: url ?? null,
        });
      } catch { /* best-effort */ }
    }
  }
  return { event: String(event), recipients };
}

/** Liste le catalogue (pour le centre de contrôle PDG). */
export function listTriggers() {
  return Object.entries(NOTIFICATION_TRIGGERS).map(([event, def]) => ({ event, ...def }));
}
