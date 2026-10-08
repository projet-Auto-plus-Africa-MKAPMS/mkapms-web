/** Centre Cyber-Électrique — accès aux données de la chaîne (ligne, trois coupures, portes) et conversions vers les règles pures. */
import { asc, eq, inArray } from "drizzle-orm";
import { dbFrontier, type BaseFrontier } from "./base/connexion.js";
import { cuts, gates, lines, type Cut, type Line } from "./base/schema.js";
import type { CoupureLite, LigneLite } from "./regles.js";

export interface CoupureComplete extends Cut {
  porteOuverte: boolean;
}
export interface LigneComplete {
  ligne: Line;
  coupures: CoupureComplete[];
}

const ORDRE = { remote: 0, center: 1, main: 2 } as const;

export async function chargerLigne(ligneId: number, base: BaseFrontier = dbFrontier()): Promise<LigneComplete | null> {
  const [ligne] = await base.select().from(lines).where(eq(lines.id, ligneId)).limit(1);
  if (!ligne) return null;
  const coupures = await chargerCoupures([ligneId], base);
  return { ligne, coupures: coupures.get(ligneId) ?? [] };
}

export async function chargerCoupures(ligneIds: readonly number[], base: BaseFrontier = dbFrontier()): Promise<Map<number, CoupureComplete[]>> {
  const out = new Map<number, CoupureComplete[]>();
  if (ligneIds.length === 0) return out;
  const rows = await base
    .select({ c: cuts, ouverte: gates.open })
    .from(cuts)
    .leftJoin(gates, eq(gates.cutId, cuts.id))
    .where(inArray(cuts.lineId, [...ligneIds]))
    .orderBy(asc(cuts.lineId), asc(cuts.id));
  for (const r of rows) {
    const l = out.get(r.c.lineId) ?? [];
    l.push({ ...r.c, porteOuverte: r.ouverte === true });
    out.set(r.c.lineId, l);
  }
  for (const l of out.values()) l.sort((a, b) => ORDRE[a.side] - ORDRE[b.side]);
  return out;
}

export const ligneLite = (l: Line): LigneLite => ({ kind: l.kind, enabled: l.enabled, locked: l.locked, validity: l.validity });
export const coupuresLite = (c: readonly CoupureComplete[]): CoupureLite[] =>
  c.map((x) => ({ side: x.side, requested: x.requested, observed: x.observed, progress: x.progress, mode: x.mode, porteOuverte: x.porteOuverte }));
