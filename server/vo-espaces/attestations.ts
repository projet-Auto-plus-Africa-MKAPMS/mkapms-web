/**
 * Étape 12 du parcours VO — attestation de cession et attestation de vente.
 *
 * Le parcours s'arrêtait à la vente enregistrée : rien ne permettait de
 * remettre au client la pièce écrite qui matérialise le transfert du véhicule.
 * Le document est désormais réellement produit à partir des données persistées,
 * archivé au Document OS avec une référence vérifiable, et borné au
 * cloisonnement VO — un professionnel n'édite que sur ses propres véhicules.
 *
 * Aucune signature électronique à distance n'est fabriquée ici : la plateforme
 * n'a aucun prestataire de signature raccordé. Le document est signé sur place
 * (nom du signataire enregistré et daté) ou imprimé pour signature manuscrite.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { annonces, users } from "../schema.js";
import {
  createDocument,
  docDocuments,
  signDocument,
  updateDocumentStatus,
} from "../document-os/index.js";
import { vehiculeProAppartient } from "./service.js";

export const TYPES_ATTESTATION = ["cession", "vente"] as const;
export type TypeAttestation = (typeof TYPES_ATTESTATION)[number];

const LIBELLE: Record<TypeAttestation, string> = {
  cession: "Attestation de cession de véhicule",
  vente: "Attestation de vente complète",
};

export interface SaisieAttestation {
  annonceId: number;
  type: TypeAttestation;
  /** Éléments d'identification absents de l'annonce, saisis par le vendeur. */
  immatriculation?: string;
  vin?: string;
  kilometrage?: number;
  /** Prix réellement convenu ; à défaut le prix de l'annonce est retenu. */
  prix?: number;
  acheteurNom: string;
  acheteurAdresse?: string;
  acheteurEmail?: string;
  acheteurTelephone?: string;
  lieu?: string;
  dateVente?: string;
}

export interface AttestationVo {
  documentId: number;
  reference: string;
  type: TypeAttestation;
  titre: string;
  statut: string;
  emiseLe: string | null;
  signeeLe: string | null;
  signataire: string | null;
  verification: string | null;
  /** Paires prêtes à imprimer, dans l'ordre du document. */
  champs: { libelle: string; valeur: string }[];
  mentions: string[];
}

function texte(v: string | null | undefined, defaut = "—"): string {
  const propre = (v ?? "").trim();
  return propre.length > 0 ? propre : defaut;
}

function montant(valeur: number, devise: string): string {
  return `${valeur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise}`;
}

function mentionsDe(type: TypeAttestation, signataire: string | null): string[] {
  const communes = [
    "Document produit par la plateforme MKA.P-MS à partir des données enregistrées par le vendeur. Sa référence peut être vérifiée en ligne.",
    signataire
      ? `Signé sur place par ${signataire}. La plateforme conserve le nom du signataire et l'horodatage de la signature.`
      : "Aucune signature électronique à distance n'est proposée : imprimez le document pour signature manuscrite, ou faites-le signer sur place depuis l'écran.",
  ];

  if (type === "cession") {
    return [
      "Le vendeur déclare céder le véhicule désigné à l'acheteur, dans l'état où il se trouve, à la date et au prix indiqués.",
      "Le transfert de la carte grise reste à la charge des parties auprès de l'autorité compétente du pays d'immatriculation.",
      ...communes,
    ];
  }

  return [
    "Le présent document récapitule la vente complète du véhicule : identification, kilométrage relevé, prix convenu, identités du vendeur et de l'acheteur.",
    "Il ne dispense pas des obligations légales du pays de vente (contrôle technique, déclaration de cession, garantie légale de conformité).",
    ...communes,
  ];
}

/**
 * Produit l'attestation et l'archive. L'appartenance du véhicule est vérifiée
 * côté serveur : un identifiant tapé dans l'adresse ne donne accès à rien.
 */
export async function genererAttestation(
  user: { uid: number; role: string },
  saisie: SaisieAttestation,
): Promise<AttestationVo | { refuse: "non_proprietaire" }> {
  if (!(await vehiculeProAppartient(user.uid, saisie.annonceId))) {
    return { refuse: "non_proprietaire" };
  }

  const [annonce] = await db
    .select()
    .from(annonces)
    .where(and(eq(annonces.id, saisie.annonceId), eq(annonces.ownerId, user.uid)))
    .limit(1);

  if (!annonce) return { refuse: "non_proprietaire" };

  const [vendeur] = await db.select().from(users).where(eq(users.id, user.uid)).limit(1);

  const devise = annonce.devise ?? "EUR";
  const prix = saisie.prix ?? Number(annonce.prix ?? 0);
  const kilometrage = saisie.kilometrage ?? annonce.kilometrage ?? null;
  const dateVente = saisie.dateVente ?? new Date().toISOString().slice(0, 10);

  const ligne = await createDocument({
    typeCode: "attestation",
    ownerUserId: user.uid,
    authorUserId: user.uid,
    linkedEntityType: "annonce",
    linkedEntityId: annonce.id,
    amountTtc: prix > 0 ? prix : undefined,
    currency: devise,
    countryCode: (annonce.pays ?? vendeur?.country ?? "FR").slice(0, 2),
    metadata: {
      attestation: saisie.type,
      annonceReference: annonce.reference,
      immatriculation: saisie.immatriculation ?? null,
      vin: saisie.vin ?? null,
      kilometrage,
      dateVente,
      lieu: saisie.lieu ?? annonce.ville ?? null,
      acheteur: {
        nom: saisie.acheteurNom,
        adresse: saisie.acheteurAdresse ?? null,
        email: saisie.acheteurEmail ?? null,
        telephone: saisie.acheteurTelephone ?? null,
      },
    },
  });

  // Le document est remis au client : il n'est pas laissé en brouillon.
  await updateDocumentStatus(ligne.id, "emis", user.uid);

  const champs: { libelle: string; valeur: string }[] = [
    { libelle: "Type de document", valeur: LIBELLE[saisie.type] },
    { libelle: "Date de la vente", valeur: new Date(dateVente).toLocaleDateString("fr-FR") },
    { libelle: "Lieu", valeur: texte(saisie.lieu ?? annonce.ville) },
    {
      libelle: "Vendeur",
      valeur: texte(vendeur?.companyName ?? vendeur?.name),
    },
    {
      libelle: "Vendeur — adresse",
      valeur: texte(
        [vendeur?.addressLine, vendeur?.postalCode, vendeur?.city, vendeur?.country]
          .filter(Boolean)
          .join(" "),
      ),
    },
    { libelle: "Vendeur — SIRET", valeur: texte(vendeur?.companySiret) },
    { libelle: "Vendeur — TVA", valeur: texte(vendeur?.vatNumber) },
    { libelle: "Acheteur", valeur: texte(saisie.acheteurNom) },
    { libelle: "Acheteur — adresse", valeur: texte(saisie.acheteurAdresse) },
    { libelle: "Acheteur — contact", valeur: texte(saisie.acheteurEmail ?? saisie.acheteurTelephone) },
    { libelle: "Véhicule", valeur: `${annonce.marque} ${annonce.modele} ${texte(annonce.version, "")}`.trim() },
    { libelle: "Année", valeur: annonce.annee ? String(annonce.annee) : "—" },
    { libelle: "Immatriculation", valeur: texte(saisie.immatriculation) },
    { libelle: "N° de série (VIN)", valeur: texte(saisie.vin) },
    {
      libelle: "Kilométrage relevé",
      valeur: kilometrage !== null ? `${kilometrage.toLocaleString("fr-FR")} km` : "—",
    },
    { libelle: "Énergie / boîte", valeur: `${annonce.carburant} · ${annonce.boite}` },
    { libelle: "Prix convenu", valeur: prix > 0 ? montant(prix, devise) : "—" },
    { libelle: "Référence annonce", valeur: texte(annonce.reference) },
  ];

  if (saisie.type === "vente") {
    champs.push({ libelle: "État déclaré", valeur: texte(annonce.etat) });
    champs.push({
      libelle: "Garanties déclarées au dépôt",
      valeur: Array.isArray(annonce.garanties) && annonce.garanties.length > 0 ? "Oui — voir dossier véhicule" : "Aucune",
    });
  }

  return {
    documentId: ligne.id,
    reference: ligne.reference,
    type: saisie.type,
    titre: LIBELLE[saisie.type],
    statut: "emis",
    emiseLe: new Date().toISOString(),
    signeeLe: null,
    signataire: null,
    verification: ligne.qrPayload ?? null,
    champs,
    mentions: mentionsDe(saisie.type, null),
  };
}

/** Archive des attestations d'un véhicule du professionnel connecté. */
export async function attestationsDe(
  user: { uid: number },
  annonceId: number,
): Promise<
  {
    documentId: number;
    reference: string;
    type: string;
    statut: string;
    emiseLe: string | null;
    signeeLe: string | null;
    signataire: string | null;
    verification: string | null;
  }[]
> {
  const lignes = await db
    .select()
    .from(docDocuments)
    .where(
      and(
        eq(docDocuments.typeCode, "attestation"),
        eq(docDocuments.ownerUserId, user.uid),
        eq(docDocuments.linkedEntityType, "annonce"),
        eq(docDocuments.linkedEntityId, annonceId),
      ),
    )
    .orderBy(desc(docDocuments.createdAt));

  return lignes.map((l) => {
    const meta = (l.metadata ?? {}) as { attestation?: string };
    return {
      documentId: l.id,
      reference: l.reference,
      type: meta.attestation ?? "cession",
      statut: l.status,
      emiseLe: l.issuedAt?.toISOString() ?? null,
      signeeLe: l.signedAt?.toISOString() ?? null,
      signataire: l.signatureName ?? null,
      verification: l.qrPayload ?? null,
    };
  });
}

/**
 * Signature sur place : le nom du signataire est enregistré et horodaté.
 * Le document doit appartenir au professionnel connecté.
 */
export async function signerAttestation(
  user: { uid: number },
  documentId: number,
  signataire: string,
): Promise<{ ok: boolean; signeeLe: string | null }> {
  const [ligne] = await db
    .select({ id: docDocuments.id })
    .from(docDocuments)
    .where(
      and(
        eq(docDocuments.id, documentId),
        eq(docDocuments.ownerUserId, user.uid),
        eq(docDocuments.typeCode, "attestation"),
      ),
    )
    .limit(1);

  if (!ligne) return { ok: false, signeeLe: null };

  const maj = await signDocument(documentId, { name: signataire }, user.uid);
  return { ok: !!maj, signeeLe: maj?.signedAt?.toISOString() ?? null };
}
