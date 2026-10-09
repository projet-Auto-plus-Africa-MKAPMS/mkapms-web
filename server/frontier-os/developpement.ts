/**
 * Centre Cyber-Électrique — Lacunes de développement : le centre dit honnêtement « je ne peux pas faire ça, il me faut tel
 * développement » au lieu de rester silencieux ou de prétendre réussir. Une lacune est DÉCLARÉE par un moteur du centre (jamais
 * par un appel à une IA externe : voir `__tests__/autonomie.test.ts`), visible par le PDG dans l'atelier, et RÉSOLUE seulement
 * quand le développement existe réellement — soit constaté automatiquement par le centre (preuve observée), soit par le PDG
 * avec une note. Une lacune rouverte (le centre constate à nouveau l'absence) reprend son statut déclaré ; rien n'est caché.
 */
import { and, desc, eq } from "drizzle-orm";
import { dbFrontier, type BaseFrontier } from "./base/connexion.js";
import { capabilityGaps, lines, remoteReports } from "./base/schema.js";
import { journaliser, tronquer, type Acteur } from "./journal.js";

export interface Lacune {
  code: string;
  titre: string;
  detail: string;
  developpementRequis: string;
  moteur?: string | null;
}

/** Déclare (ou ré-ouvre si elle avait été résolue) une lacune. Idempotent : redéclarer la même lacune met seulement le texte à jour. */
export async function declarerLacune(l: Lacune, base: BaseFrontier = dbFrontier()): Promise<void> {
  const [existante] = await base.select().from(capabilityGaps).where(eq(capabilityGaps.code, l.code)).limit(1);
  const champs = { title: tronquer(l.titre, 200), detail: tronquer(l.detail, 2000), developmentNeeded: tronquer(l.developpementRequis, 2000), engineCode: l.moteur ?? null };
  if (!existante) {
    await base.insert(capabilityGaps).values({ code: l.code, ...champs, status: "declared" });
    await journaliser({ acteur: { type: "system" }, action: "gap_declared", cible: "capability_gap", cibleId: l.code, resultat: "ok", detail: { titre: l.titre } }, base);
    return;
  }
  const rouverte = existante.status === "resolved";
  await base.update(capabilityGaps).set({ ...champs, status: "declared", resolvedAt: rouverte ? null : existante.resolvedAt, resolvedBy: rouverte ? null : existante.resolvedBy, resolvedNote: rouverte ? null : existante.resolvedNote }).where(eq(capabilityGaps.code, l.code));
  if (rouverte) await journaliser({ acteur: { type: "system" }, action: "gap_reopened", cible: "capability_gap", cibleId: l.code, resultat: "ok", detail: { titre: l.titre } }, base);
}

/** Résout une lacune parce que le centre a OBSERVÉ la preuve que le développement existe désormais (jamais une supposition). */
export async function resoudreLacuneConstatee(code: string, preuve: string, base: BaseFrontier = dbFrontier()): Promise<void> {
  const [maj] = await base
    .update(capabilityGaps)
    .set({ status: "resolved", resolvedAt: new Date(), resolvedBy: "system:constate", resolvedNote: tronquer(preuve, 2000) })
    .where(and(eq(capabilityGaps.code, code), eq(capabilityGaps.status, "declared")))
    .returning({ code: capabilityGaps.code });
  if (maj) await journaliser({ acteur: { type: "system" }, action: "gap_resolved", cible: "capability_gap", cibleId: code, resultat: "ok", detail: { preuve } }, base);
}

/** Résout une lacune sur décision du PDG (le développement a été fait ailleurs, dans une autre session) : une note est exigée. */
export async function resoudreLacune(code: string, acteur: Acteur, note: string, confirme: boolean): Promise<{ ok: boolean; detail: string }> {
  if (!confirme) return { ok: false, detail: "Résoudre une lacune est une décision du PDG : confirmation requise." };
  const texte = note.trim();
  if (texte.length < 3) return { ok: false, detail: "Indiquez comment la lacune a été comblée (trois caractères au moins)." };
  const db = dbFrontier();
  const [maj] = await db
    .update(capabilityGaps)
    .set({ status: "resolved", resolvedAt: new Date(), resolvedBy: `pdg:${acteur.id ?? "?"}`, resolvedNote: tronquer(texte, 2000) })
    .where(and(eq(capabilityGaps.code, code), eq(capabilityGaps.status, "declared")))
    .returning({ code: capabilityGaps.code });
  if (!maj) return { ok: false, detail: "Lacune inconnue ou déjà résolue." };
  await journaliser({ acteur, action: "gap_resolved", cible: "capability_gap", cibleId: code, resultat: "ok", detail: { note: texte } });
  return { ok: true, detail: `Lacune « ${code} » marquée résolue.` };
}

export async function lacunesVue() {
  const db = dbFrontier();
  const lignes = await db.select().from(capabilityGaps).orderBy(desc(capabilityGaps.status), desc(capabilityGaps.declaredAt)).limit(200);
  return { lacunes: lignes, declarees: lignes.filter((l) => l.status === "declared").length, resolues: lignes.filter((l) => l.status === "resolved").length };
}

// ───────────────────────── Balayage honnête (déterministe, sans IA, sans réseau) ─────────────────────────
const LACUNE_EMETTEUR_BOUTIQUE = "boutique-emetteur-commutation";

/**
 * Relève UNE lacune réelle et vérifiable, jamais une liste fabriquée : tant qu'aucun rapport signé de la Boutique n'a jamais
 * été reçu, le centre ne peut pas confirmer une ligne en réel côté distant — ce n'est pas un bogue du centre, c'est un
 * développement qui reste à faire par les agents de la Boutique (contrat et émetteur de référence déjà fournis).
 */
export async function balayerLacunes(base: BaseFrontier = dbFrontier()): Promise<void> {
  const [rapport] = await base.select().from(remoteReports).orderBy(desc(remoteReports.receivedAt)).limit(1);
  const [uneLigneReelle] = await base.select({ id: lines.id }).from(lines).limit(1);
  if (!uneLigneReelle) return; // fondation pas encore posée : rien à constater
  if (!rapport) {
    await declarerLacune(
      {
        code: LACUNE_EMETTEUR_BOUTIQUE,
        titre: "Interrupteur local de la Boutique : aucun rapport signé jamais reçu",
        detail: "Aucune ligne ne peut être confirmée en réel côté distant tant que la Boutique ne vient jamais chercher ses ordres ni n'accuse son état.",
        developpementRequis: "Les agents de la Boutique exécutent l'émetteur de référence (scripts/boutique-emetteur-reference.mjs) selon le contrat docs/CENTRE-COMMUTATION-BOUTIQUE-2026-10-09.md. Rien à développer côté plateforme.",
      },
      base,
    );
    return;
  }
  await resoudreLacuneConstatee(LACUNE_EMETTEUR_BOUTIQUE, `Premier rapport signé reçu le ${rapport.receivedAt.toISOString()} (clé n°${rapport.keyId ?? "?"}).`, base);
}
