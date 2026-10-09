/**
 * Centre Cyber-Électrique — les SIX moteurs intermédiaires que la Boutique a déjà préparés pour la connexion à la plateforme principale.
 *
 * Ce fichier ne porte plus que les décisions de rattachement (quel moteur de la plateforme fait face à quel intermédiaire, par quel canal).
 * Les 83 moteurs de la Boutique et leurs états sont relevés par scripts/gen-frontier-inventaire.ts (server/frontier-os/inventaire/), qui
 * relit aussi les contrats dans la migration 0057 de la Boutique et échoue si ce fichier les contredit.
 */
import type { CanalId } from "../shop-link/contrats.js";

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
