/**
 * Point 141 — support intelligent 24 h / 24.
 *
 * Quand un client écrit « je n'arrive pas à payer », le responsable ne devrait
 * pas ouvrir six écrans pour comprendre. Ce module assemble le dossier avant
 * lui : compte → commande → paiement → erreur → prestataire → journaux, puis
 * nomme une cause probable et propose une réponse.
 *
 * Il ne duplique aucun moteur : les tickets restent dans `support_tickets`, les
 * paiements dans le Payment Engine, la chaîne de paiement dans son audit
 * existant, les alertes dans le Smart Engine.
 *
 * Deux limites assumées :
 *  • rien n'est exécuté — la solution est proposée, l'action reste soumise à la
 *    permission du responsable ;
 *  • une cause qui n'est pas établie est écrite « non établie », avec ce qui
 *    manque pour l'établir. Une fausse certitude ferait perdre plus de temps
 *    qu'un dossier vide.
 */
import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { payments, supportTickets, users } from "../schema.js";
import { paymentEvents, paymentTransactions } from "../payment-engine/schema.js";
import { paymentChainAudit } from "../payment-engine/chain-audit.js";
import { smartAlerts } from "../smart-engine/schema.js";

/** Domaines qu'un message client peut viser, avec leurs mots déclencheurs. */
const DOMAINES: { code: string; libelle: string; mots: string[] }[] = [
  { code: "paiement", libelle: "Paiement", mots: ["payer", "paiement", "carte", "cb", "facture", "abonnement", "remboursement", "stripe", "virement"] },
  { code: "compte", libelle: "Compte & connexion", mots: ["connexion", "connecter", "mot de passe", "compte", "inscription", "email de validation"] },
  { code: "annonce", libelle: "Annonce & photos", mots: ["annonce", "photo", "publier", "dépôt", "depot", "image", "vidéo", "video"] },
  { code: "message", libelle: "Messagerie", mots: ["message", "messagerie", "vendeur", "répondre", "repondre"] },
  { code: "livraison", libelle: "Commande & livraison", mots: ["commande", "livraison", "colis", "pièce", "piece", "retard"] },
];

export interface EtapeDossier {
  etape: string;
  libelle: string;
  /** Ce qui a réellement été lu. Jamais une supposition. */
  constat: string;
  lu: boolean;
}

export interface Dossier {
  ticketId: number | null;
  domaine: string;
  domaineLibelle: string;
  client: { id: number | null; email: string; nom: string } | null;
  etapes: EtapeDossier[];
  causeProbable: string;
  solution: string;
  reponsePreparee: string;
  actionProposee: { libelle: string; permission: string; executee: false } | null;
  manques: string[];
}

function domainePour(texte: string): { code: string; libelle: string } {
  const t = texte.toLowerCase();
  for (const d of DOMAINES) {
    if (d.mots.some((m) => t.includes(m))) return { code: d.code, libelle: d.libelle };
  }
  return { code: "inconnu", libelle: "Domaine non identifié" };
}

/** Dossier complet à partir d'un ticket existant. */
export async function dossierTicket(ticketId: number): Promise<Dossier | null> {
  const [t] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
  if (!t) return null;
  return construire({
    ticketId: t.id,
    texte: `${t.sujet}\n${t.message}`,
    email: t.contactEmail,
    userId: t.userId,
    nom: t.contactNom,
  });
}

/** Dossier à partir d'un message libre, avant même la création d'un ticket. */
export async function dossierMessage(input: {
  texte: string;
  email?: string;
  userId?: number;
}): Promise<Dossier> {
  return construire({
    ticketId: null,
    texte: input.texte,
    email: input.email ?? "",
    userId: input.userId ?? null,
    nom: "",
  });
}

async function construire(input: {
  ticketId: number | null;
  texte: string;
  email: string;
  userId: number | null;
  nom: string;
}): Promise<Dossier> {
  const domaine = domainePour(input.texte);
  const etapes: EtapeDossier[] = [];
  const manques: string[] = [];

  // ── 1. Le compte ─────────────────────────────────────────────────────────
  let client: Dossier["client"] = null;
  let userId = input.userId;
  if (userId || input.email) {
    const [u] = await db
      .select({ id: users.id, email: users.email, name: users.name, role: users.role, cree: users.createdAt })
      .from(users)
      .where(userId ? eq(users.id, userId) : eq(users.email, input.email))
      .limit(1);
    if (u) {
      userId = u.id;
      client = { id: u.id, email: u.email, nom: u.name };
      etapes.push({
        etape: "compte",
        libelle: "Compte client",
        constat: `${u.name} (${u.email}), rôle ${u.role}, inscrit le ${u.cree.toISOString().slice(0, 10)}.`,
        lu: true,
      });
    }
  }
  if (!client) {
    client = input.email ? { id: null, email: input.email, nom: input.nom } : null;
    etapes.push({
      etape: "compte",
      libelle: "Compte client",
      constat: input.email
        ? `Aucun compte ne correspond à ${input.email} : la demande vient peut-être d'un visiteur non inscrit, ou l'adresse écrite n'est pas celle du compte.`
        : "Aucune adresse fournie : le compte n'a pas pu être identifié.",
      lu: false,
    });
    manques.push("Identifier le compte du demandeur.");
  }

  // ── 2. Commandes / transactions en cours ────────────────────────────────
  let transactions: Awaited<ReturnType<typeof transactionsDe>> = [];
  if (userId) {
    transactions = await transactionsDe(userId);
    const enAttente = transactions.filter((x) => x.status === "cree" || x.status === "en_attente");
    etapes.push({
      etape: "commande",
      libelle: "Commande / panier",
      constat:
        transactions.length === 0
          ? "Aucune transaction enregistrée pour ce compte : le client n'a jamais atteint l'écran de paiement, ou il utilise un autre compte."
          : `${transactions.length} transaction(s), dont ${enAttente.length} restée(s) sans conclusion. Dernière : ${transactions[0].reference} (${transactions[0].status}, ${transactions[0].amount} ${transactions[0].currency}).`,
      lu: true,
    });
  } else {
    etapes.push({
      etape: "commande",
      libelle: "Commande / panier",
      constat: "Compte inconnu : les commandes n'ont pas pu être lues.",
      lu: false,
    });
  }

  // ── 3. Paiements ────────────────────────────────────────────────────────
  const echecs = transactions.filter((x) => x.status === "echoue" || x.status === "refuse");
  if (userId) {
    const [legacy] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(payments)
      .where(eq(payments.userId, userId));
    etapes.push({
      etape: "paiement",
      libelle: "Paiements",
      constat:
        transactions.length === 0 && Number(legacy?.n ?? 0) === 0
          ? "Aucun paiement, ni récent ni historique."
          : `${echecs.length} paiement(s) en échec ou refusé(s) sur les 90 derniers jours, ${Number(legacy?.n ?? 0)} paiement(s) dans l'historique.`,
      lu: true,
    });
  }

  // ── 4. Erreur exacte, lue dans le journal de la transaction ──────────────
  let derniereErreur = "";
  if (echecs.length > 0) {
    const evts = await db
      .select({ type: paymentEvents.type, de: paymentEvents.fromStatus, vers: paymentEvents.toStatus, data: paymentEvents.data, quand: paymentEvents.createdAt })
      .from(paymentEvents)
      .where(eq(paymentEvents.transactionId, echecs[0].id))
      .orderBy(desc(paymentEvents.id))
      .limit(10);
    const parlant = evts.find((e) => e.data !== null) ?? evts[0];
    derniereErreur = parlant
      ? `${parlant.type} (${parlant.de ?? "?"} → ${parlant.vers ?? "?"}) le ${parlant.quand.toISOString()} : ${JSON.stringify(parlant.data ?? {}).slice(0, 400)}`
      : "";
    etapes.push({
      etape: "erreur",
      libelle: "Erreur enregistrée",
      constat: derniereErreur || "Transaction en échec sans aucun événement journalisé : l'échec n'a pas été raconté par le prestataire.",
      lu: !!derniereErreur,
    });
    if (!derniereErreur) manques.push("Le journal de la transaction en échec est vide : la cause côté prestataire n'est pas récupérable ici.");
  } else if (domaine.code === "paiement") {
    etapes.push({
      etape: "erreur",
      libelle: "Erreur enregistrée",
      constat: "Aucun échec de paiement enregistré pour ce compte : le blocage est probablement en amont du prestataire (bouton, produit, pays, connexion).",
      lu: true,
    });
  }

  // ── 5. Prestataire : état réel de la chaîne, pas une impression ─────────
  if (domaine.code === "paiement") {
    try {
      const chaine = await paymentChainAudit();
      const casses = chaine.links.filter((l) => l.state === "defaillant" || l.state === "non_verifiable");
      etapes.push({
        etape: "prestataire",
        libelle: "Prestataire & chaîne de paiement",
        constat:
          casses.length === 0
            ? "Toute la chaîne de paiement est conforme : le défaut est propre à ce client, pas général."
            : `${casses.length} maillon(s) en défaut : ${casses.map((l) => `${l.label} — ${l.evidence}`).join(" · ")}`,
        lu: true,
      });
    } catch (e) {
      etapes.push({
        etape: "prestataire",
        libelle: "Prestataire & chaîne de paiement",
        constat: `Chaîne de paiement illisible : ${(e as Error).message}`,
        lu: false,
      });
      manques.push("L'audit de la chaîne de paiement n'a pas pu être exécuté.");
    }
  }

  // ── 6. Journaux : le défaut est-il déjà connu de la plateforme ? ────────
  const depuis = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const alertes = await db
    .select({ titre: smartAlerts.title, description: smartAlerts.description, gravite: smartAlerts.severity, quand: smartAlerts.createdAt })
    .from(smartAlerts)
    .where(
      and(
        gte(smartAlerts.createdAt, depuis),
        eq(smartAlerts.status, "open"),
        or(ilike(smartAlerts.title, `%${domaine.code}%`), ilike(smartAlerts.description, `%${domaine.code}%`)),
      ),
    )
    .orderBy(desc(smartAlerts.createdAt))
    .limit(5);
  etapes.push({
    etape: "journaux",
    libelle: "Journaux & alertes",
    constat:
      alertes.length === 0
        ? "Aucune alerte ouverte sur ce domaine depuis sept jours : ce client est le premier à le signaler."
        : `${alertes.length} alerte(s) ouverte(s) : ${alertes.map((a) => a.titre).join(" · ")}`,
    lu: true,
  });

  // ── Cause probable & réponse ────────────────────────────────────────────
  const { cause, solution, action } = conclure({
    domaine: domaine.code,
    aCompte: !!client?.id,
    echecs: echecs.length,
    derniereErreur,
    alertes: alertes.length,
    transactions: transactions.length,
  });

  return {
    ticketId: input.ticketId,
    domaine: domaine.code,
    domaineLibelle: domaine.libelle,
    client,
    etapes,
    causeProbable: cause,
    solution,
    reponsePreparee: reponse(client?.nom ?? input.nom, domaine.libelle, solution),
    actionProposee: action,
    manques,
  };
}

async function transactionsDe(userId: number) {
  const depuis = new Date(Date.now() - 90 * 24 * 3600 * 1000);
  return db
    .select({
      id: paymentTransactions.id,
      reference: paymentTransactions.reference,
      status: paymentTransactions.status,
      amount: paymentTransactions.amount,
      currency: paymentTransactions.currency,
      method: paymentTransactions.method,
      quand: paymentTransactions.createdAt,
    })
    .from(paymentTransactions)
    .where(and(eq(paymentTransactions.userId, userId), gte(paymentTransactions.createdAt, depuis)))
    .orderBy(desc(paymentTransactions.id))
    .limit(20);
}

function conclure(x: {
  domaine: string;
  aCompte: boolean;
  echecs: number;
  derniereErreur: string;
  alertes: number;
  transactions: number;
}): { cause: string; solution: string; action: Dossier["actionProposee"] } {
  if (x.alertes > 0) {
    return {
      cause: `Défaut déjà signalé sur ${x.domaine} : ce client subit une panne connue, ce n'est pas un cas isolé.`,
      solution:
        "Traiter l'alerte ouverte avant de répondre individuellement : la réponse au client dépend de la correction, sinon la même demande reviendra.",
      action: { libelle: `Ouvrir l'alerte ${x.domaine} et lancer sa correction`, permission: "alertes.traiter", executee: false },
    };
  }
  if (!x.aCompte) {
    return {
      cause: "Cause non établie : le compte du demandeur n'a pas été identifié, donc son parcours n'a pas pu être relu.",
      solution: "Demander l'adresse exacte utilisée à l'inscription, ou la référence de la commande, puis relancer le dossier.",
      action: null,
    };
  }
  if (x.domaine === "paiement") {
    if (x.echecs > 0) {
      return {
        cause: x.derniereErreur
          ? `Paiement refusé par le prestataire : ${x.derniereErreur.slice(0, 200)}`
          : "Paiement en échec sans motif journalisé côté prestataire.",
        solution:
          "Vérifier le motif exact du refus : un refus banque (fonds, plafond, 3-D Secure) se règle avec le client ; un refus technique se règle par une nouvelle tentative après correction, jamais en forçant la commande à « payée ».",
        action: { libelle: "Proposer une nouvelle tentative de paiement au client", permission: "paiement.relancer", executee: false },
      };
    }
    if (x.transactions === 0) {
      return {
        cause: "Le client n'a jamais atteint le prestataire : aucune transaction n'a été créée. Le blocage est en amont (bouton, produit non tarifé, pays non ouvert, session expirée).",
        solution:
          "Reproduire son parcours avec son pays et son offre, puis contrôler la présence du produit tarifé et la règle du pays. Le paiement n'est pas en cause tant qu'aucune transaction n'existe.",
        action: { libelle: "Contrôler le produit tarifé et la règle du pays du client", permission: "paiement.regles.lire", executee: false },
      };
    }
    return {
      cause: "Aucun échec technique : les transactions du client se sont conclues normalement.",
      solution: "Demander la date, le montant et l'écran exact, puis rapprocher de la transaction correspondante.",
      action: null,
    };
  }
  return {
    cause: `Cause non établie sur ${x.domaine} : aucun défaut enregistré ne correspond au message.`,
    solution: "Demander l'écran, l'heure et l'appareil, puis relire le parcours à cette heure précise.",
    action: null,
  };
}

function reponse(nom: string, domaine: string, solution: string): string {
  const bonjour = nom ? `Bonjour ${nom},` : "Bonjour,";
  return [
    bonjour,
    "",
    `Nous avons repris votre dossier (${domaine.toLowerCase()}) et examiné votre parcours de bout en bout.`,
    "",
    solution,
    "",
    "Nous restons à votre disposition et revenons vers vous dès que la vérification est terminée.",
    "L'équipe MKA.P-MS",
  ].join("\n");
}

/**
 * File de support enrichie : chaque ticket ouvert reçoit son domaine et le fait
 * de savoir si la plateforme avait déjà vu le défaut. C'est ce qui permet de
 * traiter en premier ce qui touche plusieurs clients.
 */
export async function fileDiagnostiquee(limit = 40): Promise<
  { ticketId: number; sujet: string; priorite: string; domaine: string; dejaConnu: boolean; quand: Date }[]
> {
  const tickets = await db
    .select({
      id: supportTickets.id,
      sujet: supportTickets.sujet,
      message: supportTickets.message,
      priorite: supportTickets.priority,
      quand: supportTickets.createdAt,
    })
    .from(supportTickets)
    .where(sql`${supportTickets.status} in ('ouvert','en_cours')`)
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit);

  const depuis = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const alertes = await db
    .select({ titre: smartAlerts.title, description: smartAlerts.description })
    .from(smartAlerts)
    .where(and(gte(smartAlerts.createdAt, depuis), eq(smartAlerts.status, "open")))
    .limit(200);

  return tickets.map((t) => {
    const d = domainePour(`${t.sujet}\n${t.message}`);
    const dejaConnu = alertes.some(
      (a) =>
        a.titre.toLowerCase().includes(d.code) ||
        (a.description ?? "").toLowerCase().includes(d.code),
    );
    return { ticketId: t.id, sujet: t.sujet, priorite: t.priorite, domaine: d.code, dejaConnu, quand: t.quand };
  });
}
