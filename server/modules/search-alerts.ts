/** Raccordement existant Recherche → Annonces → Notifications internes. */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { annonces, savedSearches, notifications } from "../schema.js";
type AnnonceRow = typeof annonces.$inferSelect;
export function matchesFilters(a: AnnonceRow, f: Record<string, unknown>): boolean {
  const contains = (val: string | null, needle: unknown) =>
    !needle || (val ?? "").toLowerCase().includes(String(needle).toLowerCase());
  if (f.marque && !contains(a.marque, f.marque)) return false;
  if (f.modele && !contains(a.modele, f.modele)) return false;
  if (f.categorie && a.categorie !== f.categorie) return false;
  if (f.famille && a.famille !== f.famille) return false;
  if (f.vendeurType && a.vendeurType !== f.vendeurType) return false;
  if (f.ville && !contains(a.ville, f.ville)) return false;
  if (f.prixMax != null && Number(a.prix) > Number(f.prixMax)) return false;
  if (f.q) {
    const hay = `${a.titre} ${a.marque} ${a.modele} ${a.version ?? ""}`.toLowerCase();
    if (!hay.includes(String(f.q).toLowerCase())) return false;
  }
  return true;
}


export async function notifyMatchingSearches(a: AnnonceRow) {
  if (a.status !== "publiee") return;
  await db.transaction(async tx => {
    // Sérialise les reprises du même événement sans bloquer les autres annonces.
    await tx.execute(sql`select pg_advisory_xact_lock(7301, ${a.id})`);
    const recherches = await tx.select().from(savedSearches).where(and(eq(savedSearches.alertEnabled, true), eq(savedSearches.univers, a.type)));
    for (const recherche of recherches) {
      if (recherche.userId === a.ownerId || !matchesFilters(a, (recherche.filters ?? {}) as Record<string, unknown>)) continue;
      const title = `Nouvelle annonce pour « ${recherche.label} »`;
      const url = `/vehicule/${a.id}`;
      const [existing] = await tx.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, recherche.userId), eq(notifications.type, "saved_search"), eq(notifications.title, title), eq(notifications.url, url))).limit(1);
      if (existing) continue;
      await tx.insert(notifications).values({ userId: recherche.userId, type: "saved_search", title,
        body: `${a.titre} — ${a.prix} ${a.devise}`, url });
      await tx.update(savedSearches).set({ lastNotifiedAt: new Date() }).where(eq(savedSearches.id, recherche.id));
    }
  });
}

/** Publication par modération, modification ou prolongation : même moteur. */
export async function notifyPublishedAnnonce(id: number) {
  const [annonce] = await db.select().from(annonces).where(eq(annonces.id, id)).limit(1);
  if (annonce) await notifyMatchingSearches(annonce);
}
