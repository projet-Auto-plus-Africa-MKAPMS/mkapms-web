/**
 * Passerelle ENTRANTE du moteur intermédiaire Boutique : tout ce que la Boutique envoie à la plateforme entre ici, nulle part ailleurs.
 *
 * Ordre fixe de chaque message : taille → signature Ed25519 (clé publique enregistrée par le PDG) → câble (commutateur général
 * puis canal) → anti-rejeu et plafond par minute → schéma strict → filtre de contenu → traitement → journal.
 * La signature passe AVANT le câble : un inconnu ne peut pas deviner l'état du câble. Un câble coupé répond 503 « CABLE_COUPE ».
 *
 * Message signé (voir service.ts : messageSigne) : « SHOP-LINK-1 », méthode, chemin demandé (sans requête), horodatage en ms,
 * nonce (32 hex), SHA-256 du corps (JSON.stringify du corps ; chaîne vide pour GET). En-têtes : x-shop-link-time,
 * x-shop-link-nonce, x-shop-link-signature (Ed25519, base64url) et, facultatif, x-shop-link-key (début de l'empreinte de la clé).
 */
import { Router, type Request, type Response } from "express";
import { desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { accuserReception, deposerEntrant, sortantsAPrendre, TYPES_ECHANGE, verifierElements } from "./boite.js";
import { CANAUX, inspecter, type CanalId } from "./contrats.js";
import { shopLinkDocuments, shopLinkEtatBoutique } from "./schema.js";
import { authentifier, etatEffectif, journaliser, journaliserAnonyme, lireCables, messageCoupure, reserverMessage } from "./service.js";

export const shopLinkApi = Router();

const identifiant = z.string().regex(/^[A-Za-z0-9_./:-]{1,80}$/);

export const schemaEtat = z
  .object({
    version: z.literal(1),
    observeLe: z.string().datetime({ offset: true }),
    moteurs: z
      .array(z.object({ id: identifiant, etat: z.enum(["ok", "degrade", "arret", "inconnu"]), completude: z.number().min(0).max(100).nullable() }).strict())
      .max(200),
    alertes: z.number().int().min(0).max(10_000_000),
    compteurs: z.record(z.string().regex(/^[A-Za-z0-9_.:-]{1,60}$/), z.number().int().min(0).max(1_000_000_000_000)).refine((o) => Object.keys(o).length <= 100, "100 compteurs au maximum"),
  })
  .strict();

export const schemaDocuments = z
  .object({
    version: z.literal(1),
    documents: z
      .array(
        z
          .object({
            reference: identifiant,
            statut: z.string().regex(/^[A-Za-z0-9_.-]{1,40}$/),
            totalMinor: z.number().int().min(-1_000_000_000_000).max(1_000_000_000_000).nullable(),
            devise: z.string().regex(/^[A-Z]{3}$/).nullable(),
            referenceCommande: identifiant.nullable(),
            emisLe: z.string().datetime({ offset: true }).nullable(),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict();

export const schemaDepotIa = z
  .object({
    version: z.literal(1),
    elements: z
      .array(
        z
          .object({
            type: z.enum(TYPES_ECHANGE),
            titre: z.string().min(3).max(160),
            contenu: z.string().min(10).max(4000),
            source: z.string().max(120),
          })
          .strict(),
      )
      .min(1)
      .max(10),
  })
  .strict();

export const schemaAccuse = z.object({ version: z.literal(1), ids: z.array(z.number().int().positive()).min(1).max(50) }).strict();

interface Contexte {
  cleId: number;
}
interface Reponse {
  statut?: number;
  corps: Record<string, unknown>;
}

interface Porte<T> {
  /** Canal gouverné ; null = simple lecture de l'état du câble (soumise seulement au commutateur général). */
  canal: CanalId | null;
  methode: "get" | "post";
  chemin: string;
  schema?: z.ZodType<T>;
  /** Contrôle de contenu propre à la route (en plus du filtre de secrets) ; renvoie un refus ou null. */
  controle?: (donnees: T) => { raison: string; chemin: string } | null;
  traiter: (donnees: T, ctx: Contexte) => Promise<Reponse>;
}

const reponse = (res: Response, statut: number, corps: Record<string, unknown>) => res.status(statut).json(corps);

function declarer<T>(porte: Porte<T>): void {
  const quotaCle = porte.canal ?? "maitre";
  const tailleMax = porte.canal ? CANAUX[porte.canal].tailleMax : 1024;
  const parMinute = porte.canal ? CANAUX[porte.canal].parMinute : 30;
  const journalCanal = porte.canal ?? "maitre";
  shopLinkApi[porte.methode](porte.chemin, async (req: Request, res: Response) => {
    const debut = Date.now();
    const chemin = req.originalUrl.split("?")[0];
    const refuser = async (statut: number, status: string, evenement: string, detail = "", extra: Record<string, unknown> = {}) => {
      const anonyme = evenement === "refus_signature" || evenement === "refus_taille";
      await (anonyme ? journaliserAnonyme : journaliser)({ canal: journalCanal, sens: "entrant", evenement, resultat: "refuse", statutHttp: statut, dureeMs: Date.now() - debut, detail });
      return reponse(res, statut, { ok: false, status, ...extra });
    };
    try {
      if (porte.methode === "post" && Buffer.byteLength(JSON.stringify(req.body ?? {})) > tailleMax) return await refuser(413, "TROP_VOLUMINEUX", "refus_taille");

      const auth = await authentifier({
        methode: req.method,
        chemin,
        corps: req.body,
        entetes: { temps: req.headers["x-shop-link-time"], nonce: req.headers["x-shop-link-nonce"], signature: req.headers["x-shop-link-signature"], cle: req.headers["x-shop-link-key"] },
      });
      if (!auth.ok) return await refuser(401, "UNAUTHORIZED", "refus_signature");

      const cables = await lireCables();
      const passage = porte.canal ? await etatEffectif(porte.canal) : { passe: cables.maitre.etat === "connecte", raison: "MAITRE_COUPE" as const };
      if (!passage.passe) return await refuser(503, "CABLE_COUPE", "refus_cable", passage.raison, { raison: passage.raison, detail: messageCoupure(passage.raison) });

      const rejeu = await reserverMessage(quotaCle, auth.nonce, parMinute);
      if (rejeu === "REJEU") return await refuser(409, "REJEU", "refus_rejeu");
      if (rejeu === "QUOTA") return await refuser(429, "QUOTA", "refus_quota");

      let donnees = undefined as T;
      if (porte.schema) {
        const lu = porte.schema.safeParse(req.body);
        if (!lu.success) return await refuser(400, "INVALID_INPUT", "refus_schema", lu.error.issues[0] ? `${lu.error.issues[0].path.join(".")} : ${lu.error.issues[0].code}` : "");
        donnees = lu.data;
        const secret = inspecter(donnees);
        if (!secret.ok) return await refuser(422, "DONNEE_INTERDITE", "refus_contrat", `${secret.raison} en ${secret.chemin}`);
        const specifique = porte.controle?.(donnees);
        if (specifique) return await refuser(422, "DONNEE_INTERDITE", "refus_contrat", `${specifique.raison} en ${specifique.chemin}`);
      }

      const sortie = await porte.traiter(donnees, { cleId: auth.cleId });
      await journaliser({ canal: journalCanal, sens: "entrant", evenement: "appel_entrant", resultat: "ok", statutHttp: sortie.statut ?? 200, dureeMs: Date.now() - debut, acteur: `cle:${auth.cleId}` });
      return reponse(res, sortie.statut ?? 200, { ok: true, ...sortie.corps });
    } catch (e) {
      await journaliser({ canal: journalCanal, sens: "entrant", evenement: "appel_entrant", resultat: "erreur", statutHttp: 503, dureeMs: Date.now() - debut, detail: (e as Error).message });
      return reponse(res, 503, { ok: false, status: "UNAVAILABLE" });
    }
  });
}

// ── Lecture de l'état du câble (soumise au seul commutateur général) ────────────────────────────────────────────────
declarer({
  canal: null,
  methode: "get",
  chemin: "/v1/cable",
  traiter: async () => {
    const cables = await lireCables();
    const canaux = Object.fromEntries((Object.keys(CANAUX) as CanalId[]).map((id) => [id, { branche: cables.canaux[id].etat === "connecte" && CANAUX[id].activation === "disponible", sens: CANAUX[id].sens, contrat: CANAUX[id].contratBoutique }]));
    return { corps: { version: 1, maitre: cables.maitre.etat, canaux } };
  },
});

// ── État technique agrégé ───────────────────────────────────────────────────────────────────────────────────────────
declarer({
  canal: "etat",
  methode: "post",
  chemin: "/v1/etat",
  schema: schemaEtat,
  traiter: async (d, { cleId }) => {
    await db.insert(shopLinkEtatBoutique).values({ observeLe: new Date(d.observeLe), cleId, contenu: { moteurs: d.moteurs, alertes: d.alertes, compteurs: d.compteurs } });
    await db.execute(sql`DELETE FROM shop_link_etat_boutique WHERE id NOT IN (SELECT id FROM shop_link_etat_boutique ORDER BY id DESC LIMIT 50)`);
    return { corps: { status: "RECU", moteurs: d.moteurs.length } };
  },
});

// ── Références de documents ─────────────────────────────────────────────────────────────────────────────────────────
declarer({
  canal: "documents",
  methode: "post",
  chemin: "/v1/documents",
  schema: schemaDocuments,
  traiter: async (d, { cleId }) => {
    for (const doc of d.documents) {
      const valeurs = { reference: doc.reference, statut: doc.statut, totalMinor: doc.totalMinor, devise: doc.devise, referenceCommande: doc.referenceCommande, emisLe: doc.emisLe ? new Date(doc.emisLe) : null, cleId, recuLe: new Date() };
      await db.insert(shopLinkDocuments).values(valeurs).onConflictDoUpdate({ target: shopLinkDocuments.reference, set: valeurs });
    }
    return { corps: { status: "RECU", references: d.documents.length } };
  },
});

// ── Échange de mémoire entre les deux IA (boîte de validation) ─────────────────────────────────────────────────────
declarer({
  canal: "ia-memoire",
  methode: "post",
  chemin: "/v1/ia/boite",
  schema: schemaDepotIa,
  controle: (d) => {
    const v = verifierElements(d.elements);
    return v.ok ? null : { raison: v.raison, chemin: v.chemin };
  },
  traiter: async (d, { cleId }) => ({ corps: { status: "EN_ATTENTE_VALIDATION", ...(await deposerEntrant({ elements: d.elements, cleId })) } }),
});

declarer({
  canal: "ia-memoire",
  methode: "get",
  chemin: "/v1/ia/sortants",
  traiter: async () => ({ corps: { version: 1, elements: await sortantsAPrendre(20) } }),
});

declarer({
  canal: "ia-memoire",
  methode: "post",
  chemin: "/v1/ia/accuse",
  schema: schemaAccuse,
  traiter: async (d) => ({ corps: { status: "ACCUSE", accuses: await accuserReception(d.ids) } }),
});

/** Dernier état reçu de la Boutique (pour l'écran du PDG). */
export async function dernierEtatBoutique() {
  const [ligne] = await db.select().from(shopLinkEtatBoutique).orderBy(desc(shopLinkEtatBoutique.id)).limit(1);
  return ligne ?? null;
}
