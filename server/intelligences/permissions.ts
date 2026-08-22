/**
 * Point 146 — les neuf permissions techniques existent toutes, et restent
 * contrôlables.
 *
 * « Construire au maximum » ne veut pas dire donner la clé bancaire à un moteur
 * Image. La capacité technique existe donc partout, mais l'attribution est
 * double et cumulative :
 *
 *   permission effective = permissions du rôle ∩ permissions du moteur
 *
 * Le rôle dit ce qu'une personne a le droit de demander. Le moteur dit ce que
 * ce morceau de plateforme a le droit de faire, même demandé par le PDG. Les
 * deux sont réglables par le propriétaire, ligne par ligne, avec motif et
 * journal ; une ligne absente vaut le défaut codé ci-dessous — jamais
 * « tout autorisé ».
 *
 * Ce fichier ne crée pas un second moteur de permissions : le Permission Engine
 * garde les droits métier des comptes. Ici, il ne s'agit que des permissions
 * techniques des capacités de MKA.P-MS Intelligences.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { CAPACITES, PERMISSIONS, type Permission } from "./capacites.js";
import { inActions, inPermissions } from "./schema.js";

export type Portee = "role" | "moteur";

/** Rôles connus de la plateforme, du plus large au plus restreint. */
export const ROLES = [
  "super_admin",
  "admin",
  "employee",
  "garage",
  "pro",
  "society",
  "user",
] as const;

/**
 * Défauts par rôle. Le PDG possède tout : c'est lui qui décide de retirer, pas
 * le code qui décide de lui refuser. Les autres rôles ne reçoivent que ce que
 * leur métier justifie.
 */
export const DEFAUT_ROLE: Record<string, Permission[]> = {
  super_admin: [...PERMISSIONS],
  admin: ["READ", "ANALYZE", "PROPOSE", "TEST"],
  employee: ["READ", "ANALYZE"],
  garage: ["READ", "ANALYZE"],
  pro: ["READ", "ANALYZE"],
  society: ["READ", "ANALYZE"],
  user: ["READ"],
};

/**
 * Défauts par moteur, déduits des capacités que le moteur porte réellement au
 * registre. Un moteur n'obtient donc jamais une permission au titre d'un
 * voisin : le moteur Image reste sur PROPOSE, la finance sur FINANCIAL.
 */
const SUPPLEMENT_MOTEUR: Record<string, Permission[]> = {
  payment_engine: ["FINANCIAL"],
  payment_orchestrator: ["FINANCIAL"],
  comptabilite: ["FINANCIAL"],
  resilience: ["TEST", "DEPLOY"],
  continuous_test: ["TEST"],
  command_center: ["PROPOSE", "TEST", "DEPLOY"],
  monitoring_os: ["INFRASTRUCTURE"],
  backup_os: ["INFRASTRUCTURE"],
  intelligences: [...PERMISSIONS],
};

export function defautMoteur(moteur: string): Permission[] {
  const desCapacites = CAPACITES.filter((c) => c.moteurs.includes(moteur)).map(
    (c) => c.permission,
  );
  const cumul = new Set<Permission>(["READ", ...desCapacites]);
  for (const p of SUPPLEMENT_MOTEUR[moteur] ?? []) cumul.add(p);
  return PERMISSIONS.filter((p) => cumul.has(p));
}

/** Tous les moteurs nommés au registre des capacités, sans doublon. */
export function moteursConnus(): string[] {
  const noms = new Set<string>();
  for (const c of CAPACITES) for (const m of c.moteurs) noms.add(m);
  for (const m of Object.keys(SUPPLEMENT_MOTEUR)) noms.add(m);
  return [...noms].sort();
}

function valides(brut: string[]): Permission[] {
  return PERMISSIONS.filter((p) => brut.includes(p));
}

async function attribution(portee: Portee, cible: string): Promise<{
  permissions: Permission[];
  origine: "defaut" | "decision";
  motif: string;
}> {
  const [ligne] = await db
    .select()
    .from(inPermissions)
    .where(eq(inPermissions.cible, cible))
    .limit(1);

  if (ligne && ligne.portee === portee) {
    return {
      permissions: valides(ligne.permissions),
      origine: "decision",
      motif: ligne.motif,
    };
  }

  const defaut = portee === "role" ? DEFAUT_ROLE[cible] ?? [] : defautMoteur(cible);
  return {
    permissions: defaut,
    origine: "defaut",
    motif:
      portee === "role"
        ? "Attribution par défaut du rôle : aucune décision enregistrée."
        : "Attribution déduite des capacités portées par ce moteur : aucune décision enregistrée.",
  };
}

export async function permissionsDuRole(role: string | null | undefined): Promise<Permission[]> {
  if (!role) return [];
  return (await attribution("role", role)).permissions;
}

export async function permissionsDuMoteur(moteur: string): Promise<Permission[]> {
  if (!moteur.trim()) return [];
  return (await attribution("moteur", moteur.trim())).permissions;
}

export interface VerdictPermission {
  autorise: boolean;
  motif: string;
  parRole: Permission[];
  parMoteur: Permission[];
}

/**
 * Contrôle réel d'un appel : le rôle **et** le moteur doivent tous deux porter
 * la permission. C'est ce croisement qui empêche un moteur Image d'atteindre
 * une capacité financière même si le PDG la demande.
 */
export async function verifier(input: {
  role: string | null;
  moteur: string;
  permission: Permission;
}): Promise<VerdictPermission> {
  const parRole = await permissionsDuRole(input.role);
  const parMoteur = await permissionsDuMoteur(input.moteur);

  if (!parRole.includes(input.permission)) {
    return {
      autorise: false,
      motif: `Permission ${input.permission} exigée : le rôle « ${input.role ?? "aucun"} » ne l'a pas reçue.`,
      parRole,
      parMoteur,
    };
  }
  if (!parMoteur.includes(input.permission)) {
    return {
      autorise: false,
      motif: `Permission ${input.permission} exigée : le moteur « ${input.moteur} » ne l'a pas reçue. La permission existe, elle n'est pas attribuée à ce moteur.`,
      parRole,
      parMoteur,
    };
  }
  return { autorise: true, motif: "", parRole, parMoteur };
}

export interface LigneAttribution {
  portee: Portee;
  cible: string;
  permissions: Permission[];
  defaut: Permission[];
  origine: "defaut" | "decision";
  motif: string;
  ecart: Permission[];
}

/** Tableau complet des attributions : rôles puis moteurs, défauts compris. */
export async function tableau(): Promise<{
  permissions: readonly Permission[];
  roles: LigneAttribution[];
  moteurs: LigneAttribution[];
}> {
  const roles: LigneAttribution[] = [];
  for (const role of ROLES) {
    const a = await attribution("role", role);
    const defaut = DEFAUT_ROLE[role] ?? [];
    roles.push({
      portee: "role",
      cible: role,
      permissions: a.permissions,
      defaut,
      origine: a.origine,
      motif: a.motif,
      ecart: PERMISSIONS.filter(
        (p) => a.permissions.includes(p) !== defaut.includes(p),
      ),
    });
  }

  const moteurs: LigneAttribution[] = [];
  for (const moteur of moteursConnus()) {
    const a = await attribution("moteur", moteur);
    const defaut = defautMoteur(moteur);
    moteurs.push({
      portee: "moteur",
      cible: moteur,
      permissions: a.permissions,
      defaut,
      origine: a.origine,
      motif: a.motif,
      ecart: PERMISSIONS.filter(
        (p) => a.permissions.includes(p) !== defaut.includes(p),
      ),
    });
  }

  return { permissions: PERMISSIONS, roles, moteurs };
}

/**
 * Le propriétaire attribue ou retire. Rien n'est silencieux : l'ancienne
 * attribution, la nouvelle et le motif sont conservés au journal des actions.
 */
export async function attribuer(input: {
  portee: Portee;
  cible: string;
  permissions: string[];
  motif: string;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string; permissions: Permission[] }> {
  const cible = input.cible.trim();
  if (!cible) {
    return { ok: false, detail: "Cible manquante.", permissions: [] };
  }
  if (input.portee === "role" && !ROLES.includes(cible as (typeof ROLES)[number])) {
    return { ok: false, detail: `Rôle inconnu « ${cible} ».`, permissions: [] };
  }
  if (input.portee === "moteur" && !moteursConnus().includes(cible)) {
    return {
      ok: false,
      detail: `Moteur « ${cible} » absent du registre des capacités : aucune permission ne peut lui être attribuée à l'aveugle.`,
      permissions: [],
    };
  }

  const avant = await attribution(input.portee, cible);
  const demandees = valides(input.permissions);
  const refusees = input.permissions.filter((p) => !demandees.includes(p as Permission));

  const [existant] = await db
    .select()
    .from(inPermissions)
    .where(eq(inPermissions.cible, cible))
    .limit(1);

  if (existant) {
    await db
      .update(inPermissions)
      .set({
        portee: input.portee,
        permissions: demandees,
        motif: input.motif,
        actorId: input.actorId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(inPermissions.id, existant.id));
  } else {
    await db.insert(inPermissions).values({
      portee: input.portee,
      cible,
      permissions: demandees,
      motif: input.motif,
      actorId: input.actorId ?? null,
    });
  }

  await db.insert(inActions).values({
    commande: "permissions",
    argument: `${input.portee}:${cible}`,
    resultat: "execute",
    detail: `Avant : ${avant.permissions.join(", ") || "aucune"}. Après : ${
      demandees.join(", ") || "aucune"
    }. Motif : ${input.motif || "non renseigné"}.${
      refusees.length > 0 ? ` Permissions inconnues ignorées : ${refusees.join(", ")}.` : ""
    }`,
    actorId: input.actorId ?? null,
  });

  return {
    ok: true,
    detail: `Attribution enregistrée pour ${input.portee} « ${cible} ».${
      refusees.length > 0 ? ` Ignoré : ${refusees.join(", ")}.` : ""
    }`,
    permissions: demandees,
  };
}

/** Journal des attributions, pour que le retrait d'un droit reste explicable. */
export async function journal(limit = 60) {
  return db
    .select()
    .from(inActions)
    .where(eq(inActions.commande, "permissions"))
    .orderBy(desc(inActions.id))
    .limit(limit);
}
