/**
 * Centre Cyber-Électrique — LIAISONS RÉELLES : ce que chaque coupure commande vraiment, et d'où vient l'état CONFIRMÉ.
 *
 *  - côté PRINCIPAL (interrupteur local de la plateforme) → le CÂBLE réel du moteur intermédiaire `shop_link` du canal de la ligne ;
 *    l'état est RELU dans le câble (jamais déduit de l'ordre) ;
 *  - côté DISTANT (interrupteur local de la Boutique) → un ORDRE que la Boutique vient chercher (elle n'est jamais appelée), puis un ACCUSÉ SIGNÉ contenant
 *    l'état qu'elle observe elle-même. Sans rapport signé et frais : état INCONNU, jamais « connecté » ;
 *  - CENTRE (contact central) → la porte du transport, que le portier lit pour toute voie réelle quand la gouvernance est armée.
 *
 * Ce module ne décide jamais s'il est permis d'agir en réel : c'est `reel-etat.ts` (variable d'environnement + armement du PDG) et les moteurs de commande
 * et de vérification. Les appels à la plateforme (câble) sont chargés à la demande : un test du centre sans la base de la plateforme n'en dépend pas.
 */
import { and, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { dbFrontier } from "./base/connexion.js";
import { lines, remoteOrders, remoteReports, type Cut, type Line } from "./base/schema.js";
import { CANAUX, estCanal, type CanalId } from "../shop-link/contrats.js";
import { brancherCommutation, type AccuseCommutation, type BilanAccuses, type OrdreCommutation } from "../shop-link/commutation.js";

export interface Constat {
  /** true : ça passe ; false : ça ne passe pas ; null : INCONNU (aucune preuve fraîche). */
  passe: boolean | null;
  preuve: string;
  observeLe: Date | null;
}

export interface ResultatApplication {
  ok: boolean;
  detail: string;
}

export interface ContexteApplication {
  commandeId?: number | null;
  acteurId?: number | string | null;
}

export interface Liaison {
  nom: "cable_shop_link" | "commutation_boutique";
  libelle: string;
  appliquer(voulu: "activate" | "deactivate", ctx: ContexteApplication): Promise<ResultatApplication>;
  lire(): Promise<Constat>;
}

/** Ce qu'une coupure commande réellement, ou la raison pour laquelle elle ne peut pas l'être. */
export interface Adaptateur {
  /** Nom court affiché. */
  nom: "cable_shop_link" | "commutation_boutique" | "porte_du_centre";
  libelle: string;
  /** Liaison externe à actionner et à relire ; null pour le contact central (porte du centre). */
  liaison: Liaison | null;
  /** Vrai si une liaison réelle existe pour cette coupure. */
  disponible: boolean;
  raison?: string;
}

export const ORDRE_VALIDE_MS = () => Number(process.env.FRONTIER_ORDRE_VALIDE_MS) || 120_000;
export const ATTENTE_ACCUSE_MS = () => Number(process.env.FRONTIER_ATTENTE_ACCUSE_MS) || 20_000;
export const FRAICHEUR_RAPPORT_MS = () => Number(process.env.FRONTIER_FRAICHEUR_RAPPORT_MS) || 120_000;
const FENETRE_HORLOGE_AVANT_MS = 5 * 60_000;
const FENETRE_HORLOGE_APRES_MS = 90_000;

const acteurNumerique = (id: number | string | null | undefined): number => {
  const n = Number(id);
  return Number.isInteger(n) && n >= 0 && n < 2_147_483_647 ? n : 0;
};

// ───────────────────────── Côté principal : le câble shop_link ─────────────────────────
export function liaisonPrincipale(canal: CanalId): Liaison {
  return {
    nom: "cable_shop_link",
    libelle: `Câble shop_link — canal « ${canal} »`,
    async appliquer(voulu, ctx) {
      const { regler } = await import("../shop-link/service.js");
      const r = await regler(canal, voulu === "activate" ? "connecte" : "coupe", { motif: `Centre Cyber-Électrique — commande ${ctx.commandeId ?? "?"}`, acteur: acteurNumerique(ctx.acteurId) });
      return { ok: r.ok, detail: r.detail };
    },
    async lire() {
      const { lireCables } = await import("../shop-link/service.js");
      const c = await lireCables();
      const du = c.canaux[canal];
      return {
        passe: c.maitre.etat === "connecte" && du.etat === "connecte",
        preuve: `câble shop_link relu : commutateur général ${c.maitre.etat}, canal « ${canal} » ${du.etat}`,
        observeLe: du.modifieLe,
      };
    },
  };
}

// ───────────────────────── Côté distant : ordre + accusé signé de la Boutique ─────────────────────────
export function liaisonDistante(ligne: Pick<Line, "id" | "intermediaryRef">, coupureId: number): Liaison {
  return {
    nom: "commutation_boutique",
    libelle: `Interrupteur local de la Boutique — ligne « ${ligne.intermediaryRef ?? ligne.id} » (ordre puis accusé signé)`,
    async appliquer(voulu, ctx) {
      const db = dbFrontier();
      // Un seul ordre vivant par ligne : le nouveau remplace les précédents encore non accusés.
      await db.update(remoteOrders).set({ status: "cancelled" }).where(and(eq(remoteOrders.lineId, ligne.id), inArray(remoteOrders.status, ["pending", "delivered"])));
      const expire = new Date(Date.now() + ORDRE_VALIDE_MS());
      const [ordre] = await db
        .insert(remoteOrders)
        .values({ lineId: ligne.id, cutId: coupureId, wanted: voulu, commandId: ctx.commandeId ?? null, expiresAt: expire })
        .returning({ id: remoteOrders.id });
      const limite = Date.now() + ATTENTE_ACCUSE_MS();
      for (;;) {
        const [o] = await db.select().from(remoteOrders).where(eq(remoteOrders.id, ordre!.id)).limit(1);
        if (o?.status === "acked") {
          const attendu = voulu === "activate" ? "connected" : "disconnected";
          return o.ackState === attendu
            ? { ok: true, detail: `Accusé signé de la Boutique (ordre ${o.id}) : son interrupteur local est ${o.ackState === "connected" ? "fermé" : "ouvert"}.` }
            : { ok: false, detail: `La Boutique a répondu à l'ordre ${o.id} que son interrupteur local est ${o.ackState === "connected" ? "fermé" : "ouvert"} : l'ordre n'est pas exécuté.` };
        }
        if (o?.status === "cancelled") return { ok: false, detail: `L'ordre ${ordre!.id} a été remplacé par un ordre plus récent.` };
        if (Date.now() >= limite) {
          await db.update(remoteOrders).set({ status: "expired" }).where(and(eq(remoteOrders.id, ordre!.id), inArray(remoteOrders.status, ["pending", "delivered"])));
          return { ok: false, detail: `Aucun accusé signé de la Boutique pour l'ordre ${ordre!.id} dans le délai (${Math.round(ATTENTE_ACCUSE_MS() / 1000)} s) : l'interrupteur distant n'a rien confirmé.` };
        }
        await new Promise((r) => setTimeout(r, 100));
      }
    },
    async lire() {
      const [r] = await dbFrontier().select().from(remoteReports).where(eq(remoteReports.lineId, ligne.id)).limit(1);
      if (!r) return { passe: null, preuve: "aucun rapport signé de la Boutique pour cette ligne", observeLe: null };
      const age = Date.now() - r.receivedAt.getTime();
      if (age > FRAICHEUR_RAPPORT_MS()) return { passe: null, preuve: `dernier rapport signé de la Boutique trop ancien (${Math.round(age / 1000)} s) : état inconnu`, observeLe: r.observedAt };
      return { passe: r.state === "connected", preuve: `rapport signé de la Boutique (clé n°${r.keyId ?? "?"}) observé le ${r.observedAt.toISOString()} : interrupteur ${r.state === "connected" ? "fermé" : "ouvert"}`, observeLe: r.observedAt };
    },
  };
}

// ───────────────────────── Choix de l'adaptateur d'une coupure ─────────────────────────
export function adaptateurDe(cut: Pick<Cut, "id" | "side">, ligne: Pick<Line, "id" | "intermediaryRef" | "channel">): Adaptateur {
  if (cut.side === "center") return { nom: "porte_du_centre", libelle: "Porte du transport du centre (lue par le portier de toute voie réelle quand la gouvernance est armée)", liaison: null, disponible: true };
  if (cut.side === "main") {
    const canal = ligne.channel;
    if (!canal || !estCanal(canal)) return { nom: "cable_shop_link", libelle: "Câble shop_link", liaison: null, disponible: false, raison: "Cette ligne n'a pas de canal du moteur intermédiaire côté plateforme : aucun câble à commander." };
    if (CANAUX[canal].activation !== "disponible") return { nom: "cable_shop_link", libelle: `Câble shop_link — canal « ${canal} »`, liaison: null, disponible: false, raison: CANAUX[canal].raisonAttente ?? "Canal en attente d'une activation externe." };
    const liaison = liaisonPrincipale(canal);
    return { nom: liaison.nom, libelle: liaison.libelle, liaison, disponible: true };
  }
  if (!ligne.intermediaryRef) return { nom: "commutation_boutique", libelle: "Interrupteur local de la Boutique", liaison: null, disponible: false, raison: "Ligne sans identifiant d'intermédiaire : la Boutique ne saurait pas laquelle commuter." };
  const liaison = liaisonDistante(ligne, cut.id);
  return { nom: liaison.nom, libelle: liaison.libelle, liaison, disponible: true };
}

// ───────────────────────── Fournisseur du plan de commande pour shop_link ─────────────────────────
async function ligneParIntermediaire(ref: string) {
  const [l] = await dbFrontier().select().from(lines).where(and(eq(lines.kind, "real"), eq(lines.intermediaryRef, ref))).limit(1);
  return l ?? null;
}

export async function ordresPourLaBoutique(): Promise<OrdreCommutation[]> {
  const db = dbFrontier();
  await db.update(remoteOrders).set({ status: "expired" }).where(and(inArray(remoteOrders.status, ["pending", "delivered"]), lt(remoteOrders.expiresAt, sql`now()`)));
  const ouverts = await db
    .select({ o: remoteOrders, ref: lines.intermediaryRef })
    .from(remoteOrders)
    .innerJoin(lines, eq(lines.id, remoteOrders.lineId))
    .where(and(inArray(remoteOrders.status, ["pending", "delivered"]), gt(remoteOrders.expiresAt, sql`now()`)))
    .orderBy(remoteOrders.id)
    .limit(20);
  const aMarquer = ouverts.filter((x) => x.o.status === "pending").map((x) => x.o.id);
  if (aMarquer.length) await db.update(remoteOrders).set({ status: "delivered", deliveredAt: new Date() }).where(inArray(remoteOrders.id, aMarquer));
  return ouverts.filter((x) => x.ref).map((x) => ({ id: x.o.id, ligne: x.ref!, voulu: x.o.wanted, expireLe: x.o.expiresAt.toISOString() }));
}

export async function accuserReceptionDeLaBoutique(liste: readonly AccuseCommutation[], cleId: number): Promise<BilanAccuses> {
  const db = dbFrontier();
  const bilan: BilanAccuses = { acceptes: 0, refuses: [] };
  for (const a of liste) {
    const refus = (raison: string) => bilan.refuses.push({ ligne: a.ligne, raison });
    const ligne = await ligneParIntermediaire(a.ligne);
    if (!ligne) {
      refus("ligne inconnue");
      continue;
    }
    const observe = new Date(a.observeLe);
    const maintenant = Date.now();
    if (!Number.isFinite(observe.getTime()) || observe.getTime() < maintenant - FENETRE_HORLOGE_AVANT_MS || observe.getTime() > maintenant + FENETRE_HORLOGE_APRES_MS) {
      refus("horodatage hors fenêtre");
      continue;
    }
    let ordreId: number | null = null;
    if (a.ordre !== null) {
      const [o] = await db.select().from(remoteOrders).where(and(eq(remoteOrders.id, a.ordre), eq(remoteOrders.lineId, ligne.id))).limit(1);
      if (!o || (o.status !== "pending" && o.status !== "delivered")) {
        refus("ordre inconnu, déjà accusé ou remplacé");
        continue;
      }
      if (o.expiresAt.getTime() < maintenant) {
        refus("ordre expiré");
        continue;
      }
      await db.update(remoteOrders).set({ status: "acked", ackedAt: new Date(), ackState: a.etat, ackObservedAt: observe, ackKeyId: cleId }).where(eq(remoteOrders.id, o.id));
      ordreId = o.id;
    }
    // Le rapport le plus récent l'emporte : un rapport plus ancien n'écrase jamais un plus récent.
    const [existant] = await db.select().from(remoteReports).where(eq(remoteReports.lineId, ligne.id)).limit(1);
    if (!existant || existant.observedAt.getTime() <= observe.getTime()) {
      await db
        .insert(remoteReports)
        .values({ lineId: ligne.id, state: a.etat, observedAt: observe, keyId: cleId, orderId: ordreId })
        .onConflictDoUpdate({ target: remoteReports.lineId, set: { state: a.etat, observedAt: observe, receivedAt: new Date(), keyId: cleId, orderId: ordreId } });
    }
    bilan.acceptes += 1;
  }
  return bilan;
}

/** Branche le fournisseur du centre sur le plan de commande de shop_link. À appeler au démarrage du centre. */
export function brancherCommutationCentre(): void {
  brancherCommutation({ ordres: ordresPourLaBoutique, accuses: accuserReceptionDeLaBoutique });
}

export async function dernierOrdreDistant(ligneId: number) {
  const [o] = await dbFrontier().select().from(remoteOrders).where(eq(remoteOrders.lineId, ligneId)).orderBy(desc(remoteOrders.id)).limit(1);
  return o ?? null;
}
