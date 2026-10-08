/**
 * Centre Cyber-Électrique — inventaire de la Boutique, relevé en LECTURE SEULE (aucun appel, aucune modification de la Boutique).
 *
 * La plateforme n'a aucun accès externe : l'état réel des moteurs de la Boutique n'est donc pas observable d'ici. Cet inventaire est
 * une photo datée de ce que la Boutique déclare ; chaque moteur reste « non observé » tant qu'aucune liaison contrôlée ne le prouve.
 */
import type { CanalId } from "../shop-link/contrats.js";

export const SHOP_SNAPSHOT = {
  repository: "projet-Auto-plus-Africa-MKAPMS/mkapms-shop",
  commit: "b057a2dd999c265b07b2c922c3355bf5098e3ed9",
  analyseLe: "2026-10-08",
  sources: ["server/shop-intelligent-system.mjs (ENGINE_REGISTRY)", "migrations/0057_shop_preparation_readiness.sql (shop_strategy.connection_contracts)", "server/service-access.mjs", "docs/SHOP-SERVICE-ACCESS-2026-10-02.md"],
} as const;

/** Les moteurs déclarés par le registre de la Boutique : [id, libellé, domaine, niveau]. */
export const SHOP_ENGINES: readonly (readonly [string, string, string, string])[] = [
  ["shop.engine", "Shop Engine", "core", "required"],
  ["commerce.kernel", "Commerce Kernel", "commerce", "required"],
  ["product", "Product Engine", "catalogue", "required"],
  ["catalogue", "Catalogue Engine", "catalogue", "required"],
  ["offer", "Offer Engine", "catalogue", "required"],
  ["attribute", "Attribute Engine", "catalogue", "required"],
  ["variant", "Variant Engine", "catalogue", "required"],
  ["manufacturer", "Manufacturer Engine", "catalogue", "required"],
  ["search.index", "Search Index Engine", "discovery", "required"],
  ["keyword", "Keyword Demand Engine", "discovery", "required"],
  ["filter", "Filter Engine", "discovery", "required"],
  ["recommendation", "Recommendation Engine", "discovery", "required"],
  ["publisher", "Publisher Engine", "publication", "required"],
  ["seller.publication", "Seller Publication Engine", "publication", "required"],
  ["feed", "Feed Engine", "publication", "required"],
  ["seo", "SEO Engine", "visibility", "required"],
  ["seo.indexing", "Google Indexing Readiness Engine", "visibility", "external"],
  ["ai.discovery", "AI Discovery Readiness Engine", "visibility", "external"],
  ["campaign", "Campaign Engine", "visibility", "required"],
  ["booster", "Boost Engine", "visibility", "required"],
  ["audience", "Audience Engine", "visibility", "required"],
  ["event.marketing", "Event Marketing Engine", "visibility", "required"],
  ["promotion", "Promotion Engine", "pricing", "required"],
  ["coupon", "Coupon Engine", "pricing", "required"],
  ["pricing", "Pricing Engine", "pricing", "required"],
  ["cart", "Cart Engine", "checkout", "required"],
  ["checkout", "Checkout Engine", "checkout", "required"],
  ["order", "Order Engine", "checkout", "required"],
  ["order.communication", "Order Communication Engine", "checkout", "required"],
  ["payment.gateway", "Payment Gateway Engine", "finance", "external"],
  ["payment.individual", "Individual Payment Engine", "finance", "required"],
  ["payment.pro", "Professional Payment Engine", "finance", "required"],
  ["payment.subscription", "Pro Subscription Payment Engine", "finance", "required"],
  ["payment.country", "Country Payment Routing Engine", "finance", "required"],
  ["payment.internal", "Internal Treasury Payment Engine", "finance", "required"],
  ["payment", "Legacy Payment View", "finance", "required"],
  ["ledger", "Internal Ledger Engine", "finance", "required"],
  ["payout", "Payout Engine", "finance", "external"],
  ["documents", "Document Engine", "documents", "required"],
  ["invoice", "Invoice Engine", "documents", "required"],
  ["inventory", "Inventory Engine", "stock", "required"],
  ["warehouse", "Warehouse Engine", "stock", "required"],
  ["supplier", "Supplier Engine", "supplier", "required"],
  ["supplier.connector", "Supplier Connector Engine", "supplier", "external"],
  ["supplier.adapter.template", "Supplier Adapter Template", "supplier", "external"],
  ["shipping", "Shipping Engine", "logistics", "required"],
  ["quote", "Quote Engine", "logistics", "required"],
  ["customs", "Customs Engine", "logistics", "required"],
  ["carrier", "Carrier Adapter Engine", "logistics", "external"],
  ["routing", "Routing Engine", "logistics", "required"],
  ["return", "Return Engine", "after_sales", "required"],
  ["refund", "Refund Engine", "after_sales", "required"],
  ["after_sales", "After-sales Engine", "after_sales", "required"],
  ["customer", "Customer Engine", "account", "required"],
  ["seller", "Seller/Pro Engine", "account", "required"],
  ["subscription", "Subscription Engine", "account", "required"],
  ["review", "Review Engine", "trust", "required"],
  ["rating", "Rating Engine", "trust", "required"],
  ["qa", "Question/Answer Engine", "trust", "required"],
  ["trust", "Trust Engine", "trust", "required"],
  ["fraud", "Fraud Engine", "trust", "required"],
  ["moderation", "Moderation Engine", "trust", "required"],
  ["product.policy", "Forbidden Product Control Engine", "trust", "required"],
  ["media", "Media Engine", "media", "required"],
  ["image.processing", "Image Processing Engine", "media", "required"],
  ["video.publisher", "YouTube/Video Publisher Adapter", "media", "external"],
  ["analytics", "Analytics Engine", "intelligence", "required"],
  ["business_intelligence", "Business Intelligence Engine", "intelligence", "required"],
  ["smart.system", "Système intelligent boutique", "intelligence", "required"],
  ["developer.agent", "Developer Agent Engine", "intelligence", "internal"],
  ["vault", "Integration Vault Engine", "security", "required"],
  ["audit", "Audit Engine", "security", "required"],
  ["privacy", "Privacy/Consent Engine", "security", "required"],
  ["legal.content", "Legal Content Engine", "compliance", "required"],
  ["faq", "FAQ Engine", "support", "required"],
  ["contact", "Contact Engine", "communication", "required"],
  ["communication", "Communication Engine", "communication", "required"],
  ["notification", "Notification Engine", "communication", "external"],
  ["webhook", "Webhook Engine", "technical", "required"],
  ["queue", "Queue/Job Engine", "technical", "required"],
  ["scheduler", "Scheduler Engine", "technical", "required"],
  ["cache", "Cache Engine", "technical", "required"],
  ["shopify.adapter", "Shopify Adapter", "external", "external"],
];

export interface IntermediaireBoutique {
  /** Identifiant stable (celui du contrat de la Boutique, ou « service-access »). */
  id: string;
  libelle: string;
  /** Moteur de la Boutique que cet intermédiaire expose (id du registre de la Boutique, ou id déclaré par le contrat s'il n'y est pas). */
  moteurBoutique: string;
  /** Le registre de la Boutique contient-il ce moteur ? Sinon c'est un écart à signaler. */
  dansRegistreBoutique: boolean;
  /** État déclaré côté Boutique. */
  etatDeclare: "READY" | "BLOCKED_EXTERNAL" | "BUILT";
  sens: "plateforme_vers_boutique" | "boutique_vers_plateforme" | "mixte";
  preuve: string;
  /** Canal du moteur intermédiaire côté plateforme (shop-link) qui lui fait face, s'il existe. */
  canalPlateforme: CanalId | null;
  /** Moteur réel de la plateforme principale (nom du registre central) qui est de l'autre côté. */
  moteurPlateforme: string;
}

/**
 * Les moteurs intermédiaires DÉJÀ PRÉPARÉS côté Boutique pour la connexion à la plateforme principale : les cinq contrats de connexion
 * de la migration 0057 plus l'accès de service (jeton, portées, routes /api/service). Six au total. Rien d'autre dans la Boutique n'est
 * un intermédiaire vers la plateforme (ses autres connecteurs visent les fournisseurs, transporteurs, paiement et canaux de vente).
 */
export const INTERMEDIAIRES_BOUTIQUE: readonly IntermediaireBoutique[] = [
  { id: "main-to-shop-entry", libelle: "Accès Boutique depuis la plateforme (entrée)", moteurBoutique: "access.entry", dansRegistreBoutique: false, etatDeclare: "READY", sens: "plateforme_vers_boutique", preuve: "migrations/0057 : contrat main-to-shop-entry", canalPlateforme: null, moteurPlateforme: "redirection" },
  { id: "shared-stripe-account", libelle: "Compte de paiement commun (Stripe)", moteurBoutique: "payment", dansRegistreBoutique: true, etatDeclare: "BLOCKED_EXTERNAL", sens: "mixte", preuve: "migrations/0057 : contrat shared-stripe-account", canalPlateforme: "paiement", moteurPlateforme: "payment" },
  { id: "shared-google-owner", libelle: "Propriétaire Google commun", moteurBoutique: "seo.campaign", dansRegistreBoutique: false, etatDeclare: "BLOCKED_EXTERNAL", sens: "mixte", preuve: "migrations/0057 : contrat shared-google-owner", canalPlateforme: "google", moteurPlateforme: "seo" },
  { id: "shop-documents-only", libelle: "Références de documents de la Boutique", moteurBoutique: "documents", dansRegistreBoutique: true, etatDeclare: "READY", sens: "boutique_vers_plateforme", preuve: "migrations/0057 : contrat shop-documents-only", canalPlateforme: "documents", moteurPlateforme: "document" },
  { id: "shop-intelligence-isolated", libelle: "État technique agrégé du système intelligent de la Boutique", moteurBoutique: "smart.system", dansRegistreBoutique: true, etatDeclare: "READY", sens: "boutique_vers_plateforme", preuve: "migrations/0057 : contrat shop-intelligence-isolated", canalPlateforme: "etat", moteurPlateforme: "smart" },
  { id: "service-access", libelle: "Accès de service (jeton, portées, routes /api/service)", moteurBoutique: "catalogue", dansRegistreBoutique: true, etatDeclare: "BUILT", sens: "plateforme_vers_boutique", preuve: "server/service-access.mjs, docs/SHOP-SERVICE-ACCESS-2026-10-02.md", canalPlateforme: "catalogue", moteurPlateforme: "intelligences" },
];

/** Combien de lignes futures vides en réserve pour chaque ligne réelle (règle du PDG). */
export const RESERVE_PAR_LIGNE_REELLE = 5;
/** Une plateforme future sans ligne réelle garde tout de même cette réserve de départ, prête à recevoir son premier moteur. */
export const RESERVE_DE_DEPART = 5;
