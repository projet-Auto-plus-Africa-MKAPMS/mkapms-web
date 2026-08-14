/**
 * MKA.P-MS — Traduction des erreurs prestataire en message client.
 *
 * Un client ne doit jamais voir la réponse brute d'un prestataire : elle
 * contient le type et le préfixe de la clé d'API (`rk_live_…`), le nom des
 * ressources et parfois des identifiants internes. Elle est aussi
 * incompréhensible pour l'utilisateur, qui croit alors que son compte est en
 * cause alors que la plateforme est mal configurée.
 *
 * Ici : l'erreur complète part dans le journal serveur et lève une alerte
 * critique pour la direction ; le client reçoit une phrase claire et le motif
 * réel de l'échec, sans aucun secret.
 */
import type Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { raiseAlert } from "../smart-engine/services/alert-engine.js";

export type PaymentFailureCause =
  | "provider_auth"
  | "provider_permission"
  | "provider_config"
  | "provider_refused"
  | "provider_unreachable"
  | "unknown";

export interface PublicPaymentError {
  cause: PaymentFailureCause;
  /** Message affichable : ni clé, ni trace, ni identifiant technique. */
  message: string;
}

interface ProviderErrorShape {
  type?: string;
  code?: string;
  statusCode?: number;
  message?: string;
}

const MESSAGES: Record<PaymentFailureCause, string> = {
  provider_auth:
    "Le paiement en ligne est momentanément indisponible : la plateforme n'est pas correctement raccordée au prestataire. L'équipe MKA.P-MS a été alertée — aucun montant n'a été débité.",
  provider_permission:
    "Le paiement en ligne est momentanément indisponible : l'accès au prestataire est incomplet. L'équipe MKA.P-MS a été alertée — aucun montant n'a été débité.",
  provider_config:
    "Le paiement n'a pas pu être ouvert : la demande a été refusée par le prestataire (montant, devise ou pays non acceptés). Aucun montant n'a été débité.",
  provider_refused:
    "Le prestataire a refusé cette demande de paiement. Aucun montant n'a été débité.",
  provider_unreachable:
    "Le prestataire de paiement ne répond pas actuellement. Réessaie dans quelques minutes — aucun montant n'a été débité.",
  unknown:
    "Le paiement n'a pas pu être ouvert. L'équipe MKA.P-MS a été alertée — aucun montant n'a été débité.",
};

/** Classe une erreur prestataire sans jamais exposer son contenu. */
export function classifyProviderError(err: unknown): PaymentFailureCause {
  const e = (err ?? {}) as ProviderErrorShape;
  const type = String(e.type ?? "");
  const code = String(e.code ?? "");
  const status = Number(e.statusCode ?? 0);

  if (type === "StripeAuthenticationError" || status === 401) return "provider_auth";
  if (type === "StripePermissionError" || status === 403) return "provider_permission";
  if (type === "StripeConnectionError" || type === "StripeAPIError" || status >= 500) {
    return "provider_unreachable";
  }
  if (type === "StripeInvalidRequestError" || status === 400) return "provider_config";
  if (type === "StripeCardError" || code.startsWith("card_")) return "provider_refused";
  return "unknown";
}

/**
 * Journalise l'erreur complète, alerte la direction lorsque la cause est une
 * mauvaise configuration de la plateforme, et renvoie l'erreur destinée au
 * client.
 */
export async function reportProviderError(
  err: unknown,
  context: { provider: string; operation: string; userId?: number },
): Promise<PublicPaymentError> {
  const cause = classifyProviderError(err);
  const raw = err instanceof Error ? `${err.name}: ${err.message}` : String(err);

  console.error(
    `[paiement] ${context.provider}/${context.operation} échec (${cause}) :`,
    raw,
  );

  // Une clé invalide ou des droits insuffisants bloquent TOUS les paiements :
  // c'est une panne plateforme, pas un incident client.
  if (cause === "provider_auth" || cause === "provider_permission") {
    await raiseAlert({
      category: "paiement",
      level: "critical",
      title: `Paiements bloqués — ${context.provider} refuse la clé d'API`,
      description:
        `Opération « ${context.operation} » refusée par ${context.provider}. ` +
        "Aucun paiement ne peut aboutir tant que la clé configurée n'est pas remplacée par une clé valide disposant des droits d'écriture Checkout.",
      signature: `payment_provider_auth:${context.provider}`,
      lastOccurredAt: new Date(),
    }).catch(() => undefined);
  }

  return { cause, message: MESSAGES[cause] };
}

/**
 * Crée une session Checkout Stripe en garantissant qu'aucune réponse brute du
 * prestataire n'atteint le client. `onFailure` permet au parcours appelant de
 * refermer proprement ce qu'il a ouvert (marquer le paiement `failed`, par
 * exemple) avant que l'erreur ne remonte.
 */
export async function safeCheckoutSession(
  stripe: Stripe,
  params: Stripe.Checkout.SessionCreateParams,
  context: { operation: string; userId?: number; onFailure?: () => Promise<void> },
): Promise<Stripe.Checkout.Session> {
  try {
    return await stripe.checkout.sessions.create(params);
  } catch (err) {
    if (context.onFailure) await context.onFailure().catch(() => undefined);
    throw await providerTrpcError(err, {
      provider: "stripe",
      operation: context.operation,
      userId: context.userId,
    });
  }
}

/** Erreur tRPC prête à remonter au client, sans fuite d'information. */
export async function providerTrpcError(
  err: unknown,
  context: { provider: string; operation: string; userId?: number },
): Promise<TRPCError> {
  const pub = await reportProviderError(err, context);
  return new TRPCError({
    code: pub.cause === "provider_refused" ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
    message: pub.message,
  });
}
