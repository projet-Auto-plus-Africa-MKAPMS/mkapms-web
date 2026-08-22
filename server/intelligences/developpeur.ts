/**
 * Point 151 — plateforme développeur MKA.P-MS Intelligences.
 *
 * Elle n'ouvre pas un second chemin vers les capacités : elle donne un accès
 * **nommé, borné et révocable** à l'API `/api/v1` qui existe déjà. Trois règles
 * tenues :
 *
 *  - le secret n'est jamais conservé : seule son empreinte est stockée, la clé
 *    complète n'est montrée qu'une fois, à la création ;
 *  - une clé ne peut jamais dépasser les permissions de son rôle ni sa portée :
 *    ce qui n'est pas dans la portée est refusé avec le motif ;
 *  - une clé neuve est **fermée** (quota 0, inactive) : c'est le propriétaire
 *    qui l'ouvre, jamais la création.
 */
import { createHash, randomBytes } from "node:crypto";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "../db.js";
import { CAPACITES } from "./capacites.js";
import { permissionsDuRole } from "./permissions.js";
import { inDevAppels, inDevCles } from "./schema.js";

const ROLES_AUTORISES = ["user", "pro", "garage", "society", "employee"] as const;
export type RoleCle = (typeof ROLES_AUTORISES)[number];

function empreinte(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export interface CleResume {
  id: number;
  nom: string;
  prefixe: string;
  portee: string[];
  role: string;
  quotaJour: number;
  active: boolean;
  motif: string;
  appels24h: number;
  refus24h: number;
  dernierUsage: Date | null;
  createdAt: Date;
  /** Ce que la clé peut réellement faire, permissions du rôle comprises. */
  capacitesEffectives: string[];
  /** Capacités demandées mais refusées par le rôle — dit, pas masqué. */
  capacitesRefusees: { capacite: string; motif: string }[];
}

/** Portée effective : intersection de la portée demandée et du rôle de la clé. */
async function portefeuille(portee: string[], role: string): Promise<{
  effectives: string[];
  refusees: { capacite: string; motif: string }[];
}> {
  const accordees = await permissionsDuRole(role);
  const effectives: string[] = [];
  const refusees: { capacite: string; motif: string }[] = [];
  for (const code of portee) {
    const spec = CAPACITES.find((c) => c.code === code);
    if (!spec) {
      refusees.push({ capacite: code, motif: "Capacité absente du registre." });
      continue;
    }
    if (!accordees.includes(spec.permission)) {
      refusees.push({
        capacite: spec.libelle,
        motif: `Le rôle « ${role} » n'a pas la permission ${spec.permission}.`,
      });
      continue;
    }
    effectives.push(code);
  }
  return { effectives, refusees };
}

export async function lister(): Promise<CleResume[]> {
  const cles = await db.select().from(inDevCles).orderBy(desc(inDevCles.createdAt));
  const depuis = new Date(Date.now() - 24 * 3600 * 1000);

  const resultat: CleResume[] = [];
  for (const c of cles) {
    const [[ok], [ko], p] = await Promise.all([
      db
        .select({ n: count() })
        .from(inDevAppels)
        .where(
          and(eq(inDevAppels.cleId, c.id), eq(inDevAppels.ok, true), gte(inDevAppels.createdAt, depuis)),
        ),
      db
        .select({ n: count() })
        .from(inDevAppels)
        .where(
          and(eq(inDevAppels.cleId, c.id), eq(inDevAppels.ok, false), gte(inDevAppels.createdAt, depuis)),
        ),
      portefeuille(c.portee, c.role),
    ]);
    resultat.push({
      id: c.id,
      nom: c.nom,
      prefixe: c.prefixe,
      portee: c.portee,
      role: c.role,
      quotaJour: c.quotaJour,
      active: c.active,
      motif: c.motif,
      appels24h: Number(ok?.n ?? 0),
      refus24h: Number(ko?.n ?? 0),
      dernierUsage: c.dernierUsage,
      createdAt: c.createdAt,
      capacitesEffectives: p.effectives,
      capacitesRefusees: p.refusees,
    });
  }
  return resultat;
}

/**
 * Création d'une clé. Le secret complet n'est renvoyé qu'ici : il n'existe
 * ensuite plus nulle part, ni en base, ni dans les journaux.
 */
export async function creer(input: {
  nom: string;
  portee: string[];
  role: string;
  quotaJour: number;
  motif: string;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string; secret?: string; prefixe?: string }> {
  const nom = input.nom.trim();
  if (nom.length < 3) return { ok: false, detail: "Donnez un nom reconnaissable à la clé." };
  if (!(ROLES_AUTORISES as readonly string[]).includes(input.role)) {
    return {
      ok: false,
      detail: `Rôle refusé : une clé développeur ne peut porter que ${ROLES_AUTORISES.join(", ")}. Les rôles de direction ne s'exposent pas par API.`,
    };
  }
  const codes = CAPACITES.map((c) => c.code) as string[];
  const inconnues = input.portee.filter((p) => !codes.includes(p));
  if (inconnues.length > 0) {
    return { ok: false, detail: `Capacités inconnues : ${inconnues.join(", ")}.` };
  }
  if (input.portee.length === 0) {
    return { ok: false, detail: "Une clé sans portée n'ouvre rien : choisissez au moins une capacité." };
  }
  if (input.quotaJour < 0 || input.quotaJour > 1_000_000) {
    return { ok: false, detail: "Quota journalier hors limites." };
  }

  const secret = `mka_${randomBytes(24).toString("hex")}`;
  const prefixe = secret.slice(0, 12);

  await db.insert(inDevCles).values({
    nom,
    prefixe,
    empreinte: empreinte(secret),
    portee: input.portee,
    role: input.role,
    quotaJour: input.quotaJour,
    // Volontairement fermée : une clé neuve ne doit jamais pouvoir servir avant
    // que le propriétaire ne l'ouvre lui-même.
    active: false,
    motif: input.motif.trim(),
    actorId: input.actorId ?? null,
  });

  return {
    ok: true,
    detail:
      "Clé créée, fermée. Copiez le secret maintenant : il n'est pas conservé et ne sera plus affiché. Activez-la ensuite explicitement.",
    secret,
    prefixe,
  };
}

export async function regler(input: {
  id: number;
  active?: boolean;
  quotaJour?: number;
  portee?: string[];
  motif: string;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string }> {
  const [cle] = await db.select().from(inDevCles).where(eq(inDevCles.id, input.id)).limit(1);
  if (!cle) return { ok: false, detail: "Clé inconnue." };

  const motif = input.motif.trim();
  if (input.active === true && motif.length < 3) {
    return { ok: false, detail: "Ouvrir une clé s'écrit : donnez la raison, elle reste au journal." };
  }
  if (input.portee) {
    const codes = CAPACITES.map((c) => c.code) as string[];
    const inconnues = input.portee.filter((p) => !codes.includes(p));
    if (inconnues.length > 0) {
      return { ok: false, detail: `Capacités inconnues : ${inconnues.join(", ")}.` };
    }
  }

  await db
    .update(inDevCles)
    .set({
      active: input.active ?? cle.active,
      quotaJour: input.quotaJour ?? cle.quotaJour,
      portee: input.portee ?? cle.portee,
      motif: motif || cle.motif,
      actorId: input.actorId ?? cle.actorId,
    })
    .where(eq(inDevCles.id, cle.id));

  return { ok: true, detail: `Clé « ${cle.nom} » mise à jour.` };
}

export async function revoquer(input: {
  id: number;
  motif: string;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string }> {
  const [cle] = await db.select().from(inDevCles).where(eq(inDevCles.id, input.id)).limit(1);
  if (!cle) return { ok: false, detail: "Clé inconnue." };
  await db
    .update(inDevCles)
    .set({
      active: false,
      quotaJour: 0,
      motif: `Révoquée : ${input.motif.trim() || "sans motif écrit"}`,
      actorId: input.actorId ?? cle.actorId,
    })
    .where(eq(inDevCles.id, cle.id));
  // La clé est conservée, jamais supprimée : son historique d'appels doit
  // rester lisible après la révocation.
  return { ok: true, detail: `Clé « ${cle.nom} » révoquée. Son historique reste consultable.` };
}

export interface Verdict {
  ok: boolean;
  motif: string;
  cleId: number | null;
  role: string | null;
  capacite: string | null;
}

/**
 * Contrôle d'un appel entrant : clé connue, active, dans les quotas, capacité
 * dans la portée. Chaque décision est écrite, y compris les refus — sans quoi
 * un développeur bloqué ne saurait jamais pourquoi.
 */
export async function autoriser(input: {
  secret: string;
  capacite: string;
}): Promise<Verdict> {
  const [cle] = await db
    .select()
    .from(inDevCles)
    .where(eq(inDevCles.empreinte, empreinte(input.secret)))
    .limit(1);

  if (!cle) {
    return { ok: false, motif: "Clé inconnue ou révoquée.", cleId: null, role: null, capacite: null };
  }

  const refus = async (motif: string): Promise<Verdict> => {
    await db.insert(inDevAppels).values({
      cleId: cle.id,
      capacite: input.capacite,
      ok: false,
      motif,
    });
    return { ok: false, motif, cleId: cle.id, role: cle.role, capacite: input.capacite };
  };

  if (!cle.active) return refus("Clé fermée : elle doit être activée par le propriétaire.");
  if (cle.quotaJour <= 0) return refus("Quota journalier à zéro : la clé n'autorise aucun appel.");
  if (!cle.portee.includes(input.capacite)) {
    return refus(
      `Capacité « ${input.capacite} » hors de la portée de cette clé (${cle.portee.join(", ") || "aucune"}).`,
    );
  }

  const p = await portefeuille(cle.portee, cle.role);
  if (!p.effectives.includes(input.capacite)) {
    const r = p.refusees.find((x) => x.capacite === input.capacite);
    return refus(r?.motif ?? `Le rôle « ${cle.role} » n'autorise pas cette capacité.`);
  }

  const depuis = new Date(Date.now() - 24 * 3600 * 1000);
  const [utilises] = await db
    .select({ n: count() })
    .from(inDevAppels)
    .where(
      and(eq(inDevAppels.cleId, cle.id), eq(inDevAppels.ok, true), gte(inDevAppels.createdAt, depuis)),
    );
  if (Number(utilises?.n ?? 0) >= cle.quotaJour) {
    return refus(`Quota journalier atteint (${cle.quotaJour} appels sur 24 h).`);
  }

  return { ok: true, motif: "Clé valide dans sa portée.", cleId: cle.id, role: cle.role, capacite: input.capacite };
}

/** Enregistre l'appel réellement servi, pour le quota et la facture. */
export async function enregistrer(input: {
  cleId: number;
  capacite: string;
  ok: boolean;
  motif: string;
  dureeMs: number;
}): Promise<void> {
  await db.insert(inDevAppels).values({
    cleId: input.cleId,
    capacite: input.capacite,
    ok: input.ok,
    motif: input.motif,
    dureeMs: Math.max(0, Math.round(input.dureeMs)),
  });
  await db.update(inDevCles).set({ dernierUsage: new Date() }).where(eq(inDevCles.id, input.cleId));
}

/** Contrat public de la plateforme : ce qu'un développeur peut appeler. */
export function contrat(): {
  version: string;
  base: string;
  authentification: string;
  capacites: { code: string; libelle: string; usage: string; permission: string }[];
  regles: string[];
} {
  return {
    version: "v1",
    base: "/api/v1",
    authentification: "En-tête « X-MKA-Key: mka_… ». Le secret n'est jamais transmis dans l'URL.",
    capacites: CAPACITES.map((c) => ({
      code: c.code,
      libelle: c.libelle,
      usage: c.usage,
      permission: c.permission,
    })),
    regles: [
      "Un appel demande une capacité, jamais un fournisseur.",
      "Un refus renvoie un motif écrit : aucune réponse n'est inventée pour masquer une indisponibilité.",
      "La portée et le quota de la clé plafonnent tout, même si la capacité existe.",
      "Les capacités de direction (code, permissions, mémoire interne) ne sont pas exposables par clé.",
      "Le secret d'une clé n'est affiché qu'à sa création : il n'est pas récupérable ensuite.",
    ],
  };
}

export async function journal(limit = 40) {
  return db
    .select()
    .from(inDevAppels)
    .orderBy(desc(inDevAppels.createdAt))
    .limit(Math.min(200, Math.max(1, limit)));
}
