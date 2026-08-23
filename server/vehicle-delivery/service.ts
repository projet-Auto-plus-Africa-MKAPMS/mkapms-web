/**
 * Vehicle Delivery Engine — service.
 *
 * Ce moteur répond à une question simple posée par l'acheteur : « combien coûte
 * la livraison de ce véhicule chez moi, en combien de temps, par quel moyen ».
 * Il y répond étape par étape, avec un prix par étape et un total — et il
 * refuse d'inventer.
 *
 * Trois règles tenues dans tout le fichier :
 * 1. un prix ne sort que d'un barème enregistré (`vd_tarifs`) ;
 * 2. un barème non vérifié donne « estimé », jamais « confirmé » ;
 * 3. une étape sans barème, ou une distance inconnue, est affichée
 *    « non mesuré » avec le connecteur manquant nommé.
 *
 * La livraison de pièces et de colis reste dans l'univers Livraison
 * (`delivery_*`, `livraisonRouter`) : ce sont deux métiers, deux moteurs, deux
 * barèmes. Aucune logique n'est recopiée d'un côté à l'autre.
 */
import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { annonces } from "../schema.js";
import { countryCountries } from "../country-os/index.js";
import { emitSafe } from "../event-bus/service.js";
import {
  VD_CATEGORIES,
  VD_ETAPES,
  VD_MODES,
  vdDevis,
  vdExpeditions,
  vdOptions,
  vdSuivi,
  vdTarifs,
  type VdCategorie,
  type VdEtape,
  type VdMode,
  type VdQualite,
} from "./schema.js";

export const MODE_LABELS: Record<VdMode, string> = {
  plateau: "Plateau (dépanneuse porte-voiture)",
  porte_engins: "Porte-engins (engin, tracteur, machine)",
  camion_porte_voitures: "Camion porte-voitures (multi-véhicules)",
  conteneur_maritime: "Conteneur maritime",
  roro_maritime: "Navire roulier (RoRo)",
  convoyage_chauffeur: "Convoyage par chauffeur",
  train: "Train (wagon porte-autos)",
  avion_cargo: "Avion cargo",
};

export const ETAPE_LABELS: Record<VdEtape, string> = {
  enlevement: "Enlèvement chez le vendeur",
  preacheminement: "Pré-acheminement vers le point de départ",
  transport_principal: "Transport principal",
  dedouanement_export: "Dédouanement à l'export",
  dedouanement_import: "Dédouanement à l'import",
  post_acheminement: "Post-acheminement depuis le point d'arrivée",
  livraison_finale: "Livraison à l'adresse convenue",
  remise_pv: "Remise du véhicule et procès-verbal",
};

export const QUALITE_LABELS: Record<VdQualite, string> = {
  confirme: "Prix confirmé",
  estime: "Prix estimé",
  confirmation_requise: "À confirmer par le transporteur",
  non_mesure: "Non mesuré",
  indisponible: "Indisponible",
};

/** Modes compatibles avec un gabarit. Un engin ne part pas sur un plateau léger. */
const MODES_PAR_CATEGORIE: Record<VdCategorie, VdMode[]> = {
  moto: ["plateau", "camion_porte_voitures", "conteneur_maritime", "avion_cargo"],
  citadine: ["plateau", "camion_porte_voitures", "conteneur_maritime", "roro_maritime", "convoyage_chauffeur", "train"],
  berline: ["plateau", "camion_porte_voitures", "conteneur_maritime", "roro_maritime", "convoyage_chauffeur", "train"],
  suv: ["plateau", "camion_porte_voitures", "conteneur_maritime", "roro_maritime", "convoyage_chauffeur", "train"],
  utilitaire: ["plateau", "camion_porte_voitures", "conteneur_maritime", "roro_maritime", "convoyage_chauffeur"],
  fourgon: ["plateau", "roro_maritime", "convoyage_chauffeur"],
  camion: ["porte_engins", "roro_maritime", "convoyage_chauffeur"],
  engin: ["porte_engins", "roro_maritime", "conteneur_maritime"],
  bus: ["porte_engins", "roro_maritime", "convoyage_chauffeur"],
};

/** Catégorie d'annonce (22 valeurs) ramenée aux gabarits de transport. */
const CATEGORIE_ANNONCE: Record<string, VdCategorie> = {
  citadine: "citadine",
  berline: "berline",
  break: "berline",
  suv: "suv",
  coupe: "berline",
  cabriolet: "berline",
  monospace: "suv",
  luxe: "berline",
  utilitaire: "utilitaire",
  camion: "camion",
  moto: "moto",
  scooter: "moto",
  quad: "moto",
  engin: "engin",
  machine: "engin",
  tracteur: "engin",
  pelleteuse: "engin",
  grue: "engin",
  chariot: "engin",
  nacelle: "engin",
  compacteur: "engin",
};

export function categorieDeTransport(categorieAnnonce: string | null | undefined): VdCategorie {
  if (!categorieAnnonce) return "berline";
  return CATEGORIE_ANNONCE[categorieAnnonce] ?? "berline";
}

export interface LigneEtape {
  etape: VdEtape;
  label: string;
  /** Null quand aucun barème ne couvre l'étape : on ne comble pas le trou. */
  prix: number | null;
  devise: string;
  qualite: VdQualite;
  /** D'où vient le prix : barème interne, grille transporteur, ou rien. */
  preuve: string;
  manque?: string;
  delaiJoursMin?: number | null;
  delaiJoursMax?: number | null;
  obligatoire: boolean;
}

export interface LigneOption {
  code: string;
  label: string;
  description: string;
  prix: number | null;
  devise: string;
  premium: boolean;
  qualite: VdQualite;
  disponible: boolean;
  motif: string;
}

export interface Devis {
  /** Identifiant du devis enregistré (null quand le devis est seulement simulé). */
  devisId: number | null;
  annonceId: number | null;
  mode: VdMode;
  modeLabel: string;
  modesPossibles: { code: VdMode; label: string; disponible: boolean; motif: string }[];
  categorie: VdCategorie;
  paysDepart: string | null;
  paysArrivee: string | null;
  paysArriveeNom: string | null;
  villeDepart: string | null;
  villeArrivee: string | null
  transfrontalier: boolean;
  distanceKm: number | null;
  etapes: LigneEtape[];
  options: LigneOption[];
  /** Null dès qu'une étape obligatoire n'est pas chiffrée : un total partiel ment. */
  total: number | null;
  devise: string;
  qualite: VdQualite;
  delaiJoursMin: number | null;
  delaiJoursMax: number | null;
  resume: string;
  manques: string[];
}

/** Étapes obligatoires selon le mode et le franchissement de frontière. */
function etapesDuMode(mode: VdMode, transfrontalier: boolean): VdEtape[] {
  const maritime = mode === "conteneur_maritime" || mode === "roro_maritime";
  const multimodal = maritime || mode === "train" || mode === "avion_cargo";
  const etapes: VdEtape[] = ["enlevement"];
  if (multimodal) etapes.push("preacheminement");
  etapes.push("transport_principal");
  if (transfrontalier) etapes.push("dedouanement_export", "dedouanement_import");
  if (multimodal) etapes.push("post_acheminement");
  etapes.push("livraison_finale", "remise_pv");
  return etapes;
}

/**
 * Un barème est choisi du plus précis au plus général : corridor exact, puis
 * pays de départ seul, puis barème mondial. Un barème périmé est ignoré.
 */
async function tarifsApplicables(mode: VdMode, categorie: VdCategorie, depart: string | null, arrivee: string | null) {
  const now = new Date();
  const rows = await db
    .select()
    .from(vdTarifs)
    .where(
      and(
        eq(vdTarifs.mode, mode),
        eq(vdTarifs.categorie, categorie),
        eq(vdTarifs.actif, true),
        or(isNull(vdTarifs.paysDepart), depart ? eq(vdTarifs.paysDepart, depart) : isNull(vdTarifs.paysDepart))!,
        or(isNull(vdTarifs.paysArrivee), arrivee ? eq(vdTarifs.paysArrivee, arrivee) : isNull(vdTarifs.paysArrivee))!,
      ),
    )
    .orderBy(desc(vdTarifs.verifie), desc(vdTarifs.updatedAt));

  return rows.filter(
    (r) =>
      (r.validDu === null || r.validDu <= now) &&
      (r.validAu === null || r.validAu >= now),
  );
}

function precision(r: { paysDepart: string | null; paysArrivee: string | null }): number {
  return (r.paysDepart ? 2 : 0) + (r.paysArrivee ? 1 : 0);
}

function chiffrer(
  etape: VdEtape,
  tarifs: Awaited<ReturnType<typeof tarifsApplicables>>,
  distanceKm: number | null,
  obligatoire: boolean,
): LigneEtape {
  const candidats = tarifs
    .filter((t) => t.etape === etape)
    .sort((a, b) => precision(b) - precision(a) || Number(b.verifie) - Number(a.verifie));
  const tarif = candidats[0];

  if (!tarif) {
    return {
      etape,
      label: ETAPE_LABELS[etape],
      prix: null,
      devise: "EUR",
      qualite: "non_mesure",
      preuve: "Aucun barème enregistré pour cette étape, ce mode et ce gabarit.",
      manque: "Barème transporteur ou barème interne pour cette étape.",
      obligatoire,
    };
  }

  const perKm = Number(tarif.prixParKm);
  const fixe = Number(tarif.prixFixe);
  const minimum = Number(tarif.prixMinimum);

  // Un barème kilométrique sans distance connue ne donne aucun prix honnête.
  if (perKm > 0 && distanceKm === null) {
    return {
      etape,
      label: ETAPE_LABELS[etape],
      prix: null,
      devise: tarif.devise,
      qualite: "non_mesure",
      preuve: `Barème ${tarif.origine} au kilomètre (${perKm} ${tarif.devise}/km) sans distance connue.`,
      manque: "Calcul de distance (connecteur d'itinéraire) entre les deux adresses.",
      delaiJoursMin: tarif.delaiJoursMin,
      delaiJoursMax: tarif.delaiJoursMax,
      obligatoire,
    };
  }

  const brut = fixe + perKm * (distanceKm ?? 0);
  const prix = Math.round(Math.max(brut, minimum) * 100) / 100;
  const contractuel = tarif.origine === "transporteur" && tarif.verifie;

  return {
    etape,
    label: ETAPE_LABELS[etape],
    prix,
    devise: tarif.devise,
    qualite: contractuel ? "confirme" : tarif.verifie ? "estime" : "confirmation_requise",
    preuve: contractuel
      ? `Grille contractuelle ${tarif.transporteur ?? "transporteur"} — ${tarif.source || "référence non précisée"}.`
      : `Barème ${tarif.origine}${tarif.verifie ? " vérifié" : " non encore vérifié"} — ${tarif.source || "référence non précisée"}.`,
    manque: contractuel ? undefined : "Confirmation du transporteur sur ce corridor.",
    delaiJoursMin: tarif.delaiJoursMin,
    delaiJoursMax: tarif.delaiJoursMax,
    obligatoire,
  };
}

async function lignesOptions(base: number | null): Promise<LigneOption[]> {
  const rows = await db.select().from(vdOptions).orderBy(asc(vdOptions.premium), asc(vdOptions.label));
  return rows.map((o) => {
    const fixe = o.prixFixe === null ? null : Number(o.prixFixe);
    const pct = o.prixPourcent === null ? null : Number(o.prixPourcent);
    let prix: number | null = fixe;
    if (prix === null && pct !== null && base !== null) prix = Math.round(base * (pct / 100) * 100) / 100;
    return {
      code: o.code,
      label: o.label,
      description: o.description,
      prix,
      devise: o.devise,
      premium: o.premium,
      qualite: !o.actif
        ? "indisponible"
        : prix === null
          ? "non_mesure"
          : o.verifie
            ? "confirme"
            : "estime",
      disponible: o.actif,
      motif: o.actif
        ? prix === null
          ? "Tarif non renseigné : cette option ne peut pas être facturée telle quelle."
          : o.motif
        : o.motif || "Option construite mais non activée par la direction.",
    };
  });
}

export async function devis(input: {
  annonceId?: number | null;
  mode?: VdMode | null;
  categorie?: VdCategorie | null;
  paysDepart?: string | null;
  paysArrivee?: string | null;
  villeDepart?: string | null;
  villeArrivee?: string | null;
  distanceKm?: number | null;
  userId?: number | null;
  enregistrer?: boolean;
}): Promise<Devis> {
  let categorie = input.categorie ?? null;
  let paysDepart = input.paysDepart ? input.paysDepart.toUpperCase() : null;
  let villeDepart = input.villeDepart ?? null;
  const annonceId = input.annonceId ?? null;

  if (annonceId) {
    const [a] = await db
      .select({ categorie: annonces.categorie, pays: annonces.pays, ville: annonces.ville })
      .from(annonces)
      .where(eq(annonces.id, annonceId));
    if (!a) throw new Error(`Annonce ${annonceId} introuvable.`);
    categorie = categorie ?? categorieDeTransport(a.categorie);
    paysDepart = paysDepart ?? (a.pays ? a.pays.toUpperCase() : null);
    villeDepart = villeDepart ?? a.ville ?? null;
  }

  const cat: VdCategorie = categorie ?? "berline";
  const paysArrivee = input.paysArrivee ? input.paysArrivee.toUpperCase() : null;
  const transfrontalier = Boolean(paysDepart && paysArrivee && paysDepart !== paysArrivee);
  const distanceKm = input.distanceKm ?? null;

  const compatibles = MODES_PAR_CATEGORIE[cat];
  const mode: VdMode = input.mode && compatibles.includes(input.mode) ? input.mode : compatibles[0];

  let paysArriveeNom: string | null = null;
  const manques: string[] = [];
  if (paysArrivee) {
    const [p] = await db
      .select({ nom: countryCountries.nameFr, actif: countryCountries.active })
      .from(countryCountries)
      .where(eq(countryCountries.code, paysArrivee));
    paysArriveeNom = p?.nom ?? null;
    if (!p) manques.push(`Pays de livraison ${paysArrivee} absent du référentiel Country OS.`);
    else if (!p.actif) manques.push(`Livraisons suspendues en ${p.nom}.`);
  } else {
    manques.push("Pays de livraison inconnu : aucun corridor ne peut être choisi.");
  }
  if (distanceKm === null) manques.push("Distance entre les deux adresses non calculée (aucun connecteur d'itinéraire).");

  const tarifs = await tarifsApplicables(mode, cat, paysDepart, paysArrivee);
  const etapes = etapesDuMode(mode, transfrontalier).map((e) => chiffrer(e, tarifs, distanceKm, true));

  // Le dédouanement dépend d'un barème douanier que la plateforme n'a pas :
  // on le laisse volontairement à « non mesuré » plutôt que d'aligner un chiffre.
  for (const l of etapes) {
    if ((l.etape === "dedouanement_export" || l.etape === "dedouanement_import") && l.prix === null) {
      l.manque = "Barème douanier du pays (droits, taxes, frais de commissionnaire).";
    }
  }

  const chiffrees = etapes.filter((l) => l.prix !== null);
  const nonChiffrees = etapes.filter((l) => l.obligatoire && l.prix === null);
  const total = nonChiffrees.length === 0 && chiffrees.length > 0
    ? Math.round(chiffrees.reduce((s, l) => s + (l.prix ?? 0), 0) * 100) / 100
    : null;
  const devise = chiffrees[0]?.devise ?? "EUR";

  const qualite: VdQualite = total === null
    ? "non_mesure"
    : etapes.every((l) => l.qualite === "confirme")
      ? "confirme"
      : etapes.some((l) => l.qualite === "confirmation_requise")
        ? "confirmation_requise"
        : "estime";

  const delais = etapes.map((l) => l.delaiJoursMin).filter((n): n is number => typeof n === "number");
  const delaisMax = etapes.map((l) => l.delaiJoursMax).filter((n): n is number => typeof n === "number");
  const delaiJoursMin = delais.length ? delais.reduce((s, n) => s + n, 0) : null;
  const delaiJoursMax = delaisMax.length ? delaisMax.reduce((s, n) => s + n, 0) : null;

  for (const l of etapes) if (l.manque && !manques.includes(l.manque)) manques.push(l.manque);

  const resume = total === null
    ? `Nous ne pouvons pas encore chiffrer cette livraison : ${nonChiffrees.length} étape(s) sur ${etapes.length} n'ont aucun barème applicable. ` +
      "Aucun prix n'est affiché plutôt qu'un prix qui changerait à la facture."
    : qualite === "confirme"
      ? `Prix confirmé par grille transporteur : ${total} ${devise} pour ${etapes.length} étapes.`
      : `Prix ${qualite === "estime" ? "estimé" : "à confirmer par le transporteur"} : ${total} ${devise} pour ${etapes.length} étapes. ` +
        "Le montant définitif est celui que le transporteur confirme.";

  const options = await lignesOptions(total);

  const resultat: Devis = {
    devisId: null,
    annonceId,
    mode,
    modeLabel: MODE_LABELS[mode],
    modesPossibles: VD_MODES.map((m) => ({
      code: m,
      label: MODE_LABELS[m],
      disponible: compatibles.includes(m),
      motif: compatibles.includes(m) ? "" : `Mode inadapté au gabarit « ${cat} ».`,
    })),
    categorie: cat,
    paysDepart,
    paysArrivee,
    paysArriveeNom,
    villeDepart,
    villeArrivee: input.villeArrivee ?? null,
    transfrontalier,
    distanceKm,
    etapes,
    options,
    total,
    devise,
    qualite,
    delaiJoursMin,
    delaiJoursMax,
    resume,
    manques,
  };

  if (input.enregistrer) {
    const [ligne] = await db
      .insert(vdDevis)
      .values({
        annonceId,
        userId: input.userId ?? null,
        mode,
        categorie: cat,
        paysDepart,
        paysArrivee,
        villeDepart,
        villeArrivee: resultat.villeArrivee,
        distanceKm: distanceKm === null ? null : String(distanceKm),
        total: total === null ? null : String(total),
        devise,
        qualite,
        etapes: etapes as unknown as object,
        options: options as unknown as object,
        manques,
        resume,
      })
      .returning({ id: vdDevis.id });
    resultat.devisId = ligne ? Number(ligne.id) : null;
  }

  // Un client reparti sans prix est une vente perdue mesurable : la direction
  // doit savoir quel corridor n'a aucun barème, pas le découvrir par hasard.
  if (total === null) {
    await emitSafe({
      source: "livraison_vehicule",
      type: "livraison_vehicule.prix_indisponible",
      payload: {
        mode,
        categorie: cat,
        paysDepart: paysDepart ?? "",
        paysArrivee: paysArrivee ?? "",
        manques: manques.join(" | "),
      },
    });
  }

  return resultat;
}

/**
 * Acceptation d'un devis par un client. Un devis sans total n'est pas
 * acceptable : on ne crée pas d'engagement sur un prix inexistant.
 */
export async function accepterDevis(input: {
  clientId: number;
  annonceId?: number | null;
  mode: VdMode;
  categorie?: VdCategorie | null;
  paysDepart?: string | null;
  paysArrivee?: string | null;
  villeDepart?: string | null;
  villeArrivee?: string | null;
  distanceKm?: number | null;
}) {
  const d = await devis({ ...input, userId: input.clientId, enregistrer: true });
  if (d.total === null) {
    throw new Error(
      "Cette livraison n'est pas chiffrable aujourd'hui : " +
        d.manques.join(" ") +
        " Aucune expédition n'est créée sur un prix inconnu.",
    );
  }

  const [exp] = await db
    .insert(vdExpeditions)
    .values({
      devisId: d.devisId,
      annonceId: d.annonceId,
      clientId: input.clientId,
      reference: `VDL-${Date.now().toString(36).toUpperCase()}`,
      mode: d.mode,
      statut: "a_planifier",
      etapeCourante: d.etapes[0]?.etape ?? null,
      total: String(d.total),
      devise: d.devise,
      qualitePrix: d.qualite,
    })
    .returning();

  await db.insert(vdSuivi).values(
    d.etapes.map((e) => ({
      expeditionId: exp.id,
      etape: e.etape,
      statut: "attendu",
      note: e.prix === null ? "Étape non chiffrée au devis." : "",
    })),
  );

  await emitSafe({
    source: "livraison_vehicule",
    type: "livraison_vehicule.acceptee",
    payload: {
      expeditionId: exp.id,
      reference: exp.reference,
      mode: d.mode,
      total: d.total,
      devise: d.devise,
      qualitePrix: d.qualite,
      paysDepart: d.paysDepart ?? "",
      paysArrivee: d.paysArrivee ?? "",
    },
  });

  return { expedition: exp, devis: d };
}

export async function expeditionsDuClient(clientId: number) {
  const rows = await db
    .select()
    .from(vdExpeditions)
    .where(eq(vdExpeditions.clientId, clientId))
    .orderBy(desc(vdExpeditions.createdAt));

  const resultat = [];
  for (const e of rows) {
    const suivi = await db
      .select()
      .from(vdSuivi)
      .where(eq(vdSuivi.expeditionId, e.id))
      .orderBy(asc(vdSuivi.id));
    resultat.push({
      ...e,
      modeLabel: MODE_LABELS[e.mode as VdMode] ?? e.mode,
      suivi: suivi.map((s) => ({
        ...s,
        label: ETAPE_LABELS[s.etape as VdEtape] ?? s.etape,
      })),
    });
  }
  return resultat;
}

/** Avancement d'étape : uniquement sur constat humain, jamais par minuterie. */
export async function marquerEtape(input: {
  expeditionId: number;
  etape: VdEtape;
  statut: "attendu" | "en_cours" | "fait" | "bloque";
  note?: string;
  auteurId: number;
}) {
  const [exp] = await db.select().from(vdExpeditions).where(eq(vdExpeditions.id, input.expeditionId));
  if (!exp) throw new Error(`Expédition ${input.expeditionId} introuvable.`);

  await db.insert(vdSuivi).values({
    expeditionId: input.expeditionId,
    etape: input.etape,
    statut: input.statut,
    note: input.note ?? "",
    auteurId: input.auteurId,
    constateAt: new Date(),
  });

  await db
    .update(vdExpeditions)
    .set({
      etapeCourante: input.etape,
      statut: input.statut === "bloque" ? "bloquee" : input.etape === "remise_pv" && input.statut === "fait" ? "livree" : "en_cours",
      updatedAt: new Date(),
    })
    .where(eq(vdExpeditions.id, input.expeditionId));

  if (input.statut === "bloque") {
    await emitSafe({
      source: "livraison_vehicule",
      type: "livraison_vehicule.etape_bloquee",
      payload: {
        expeditionId: exp.id,
        reference: exp.reference,
        etape: input.etape,
        note: input.note ?? "",
      },
    });
  }

  return { ok: true };
}

export function catalogue() {
  return {
    modes: VD_MODES.map((m) => ({ code: m, label: MODE_LABELS[m] })),
    categories: VD_CATEGORIES.map((c) => ({ code: c, modes: MODES_PAR_CATEGORIE[c] })),
    etapes: VD_ETAPES.map((e) => ({ code: e, label: ETAPE_LABELS[e] })),
    qualites: Object.entries(QUALITE_LABELS).map(([code, label]) => ({ code, label })),
  };
}

/** Barèmes et options, pour la gouvernance (direction). */
export async function baremes() {
  return {
    tarifs: await db.select().from(vdTarifs).orderBy(desc(vdTarifs.updatedAt)).limit(500),
    options: await db.select().from(vdOptions).orderBy(asc(vdOptions.label)),
  };
}

/**
 * Enregistrement d'un barème par la direction. `verifie` n'est jamais posé
 * automatiquement : c'est une personne qui atteste avoir vu la grille.
 */
export async function enregistrerTarif(input: {
  id?: number;
  mode: VdMode;
  categorie: VdCategorie;
  etape: VdEtape;
  paysDepart?: string | null;
  paysArrivee?: string | null;
  prixFixe: number;
  prixParKm: number;
  prixMinimum: number;
  devise: string;
  delaiJoursMin?: number | null;
  delaiJoursMax?: number | null;
  origine: "interne" | "transporteur";
  transporteur?: string | null;
  source: string;
  verifie: boolean;
  actif: boolean;
  actorId: number;
}) {
  if (input.verifie && !input.source.trim()) {
    throw new Error("Un barème vérifié exige une source écrite (grille, contrat, date) : sans référence, il ne peut pas être vérifié.");
  }

  const valeurs = {
    mode: input.mode,
    categorie: input.categorie,
    etape: input.etape,
    paysDepart: input.paysDepart ? input.paysDepart.toUpperCase() : null,
    paysArrivee: input.paysArrivee ? input.paysArrivee.toUpperCase() : null,
    prixFixe: String(input.prixFixe),
    prixParKm: String(input.prixParKm),
    prixMinimum: String(input.prixMinimum),
    devise: input.devise.toUpperCase(),
    delaiJoursMin: input.delaiJoursMin ?? null,
    delaiJoursMax: input.delaiJoursMax ?? null,
    origine: input.origine,
    transporteur: input.transporteur ?? null,
    source: input.source,
    verifie: input.verifie,
    actif: input.actif,
    actorId: input.actorId,
    updatedAt: new Date(),
  };

  if (input.id) {
    const [row] = await db.update(vdTarifs).set(valeurs).where(eq(vdTarifs.id, input.id)).returning();
    return row;
  }
  const [row] = await db.insert(vdTarifs).values(valeurs).returning();
  return row;
}

/** Création ou mise à jour d'une option. Une option reste éteinte par défaut. */
export async function enregistrerOption(input: {
  code: string;
  label: string;
  description: string;
  prixFixe?: number | null;
  prixPourcent?: number | null;
  devise: string;
  premium: boolean;
  actif: boolean;
  verifie: boolean;
  motif: string;
  actorId: number;
}) {
  const valeurs = {
    code: input.code,
    label: input.label,
    description: input.description,
    prixFixe: input.prixFixe === null || input.prixFixe === undefined ? null : String(input.prixFixe),
    prixPourcent: input.prixPourcent === null || input.prixPourcent === undefined ? null : String(input.prixPourcent),
    devise: input.devise.toUpperCase(),
    premium: input.premium,
    actif: input.actif,
    verifie: input.verifie,
    motif: input.motif,
    actorId: input.actorId,
    updatedAt: new Date(),
  };

  const [row] = await db
    .insert(vdOptions)
    .values(valeurs)
    .onConflictDoUpdate({ target: vdOptions.code, set: valeurs })
    .returning();
  return row;
}

export async function controlCenterFeed() {
  const [t] = await db
    .select({
      total: sql<number>`count(*)::int`,
      verifies: sql<number>`count(*) filter (where ${vdTarifs.verifie} = true)::int`,
      contractuels: sql<number>`count(*) filter (where ${vdTarifs.origine} = 'transporteur')::int`,
    })
    .from(vdTarifs);
  const [e] = await db.select({ n: sql<number>`count(*)::int` }).from(vdExpeditions);

  const manques: string[] = [
    "Connecteur d'itinéraire (distance réelle entre deux adresses)",
    "Barème douanier par pays (droits, taxes, commissionnaire)",
    "Grilles contractuelles transporteurs par corridor",
  ];

  return {
    version: "1",
    health: (t?.total ?? 0) === 0 ? ("degraded" as const) : ("ok" as const),
    resume:
      (t?.total ?? 0) === 0
        ? "Aucun barème enregistré : le moteur refuse d'afficher un prix de livraison véhicule plutôt que d'en inventer un."
        : `${t.total} barèmes dont ${t.verifies} vérifiés et ${t.contractuels} contractuels ; ${e?.n ?? 0} expéditions.`,
    baremes: t?.total ?? 0,
    baremesVerifies: t?.verifies ?? 0,
    expeditions: e?.n ?? 0,
    manques,
  };
}
