// Données de démonstration minimales (idempotent).
import { eq } from "drizzle-orm";
import { db, pool } from "./db.js";
import { users, annonces, annoncePhotos, garagesPublics } from "./schema.js";
import { hashPassword } from "./auth.js";

async function main() {
  // Compte direction (PDG)
  const adminEmail = "mka.garageauto@gmail.com";
  const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  let adminId: number;
  if (!existing.length) {
    const [a] = await db
      .insert(users)
      .values({
        email: adminEmail,
        name: "M. KAS Mohamed",
        passwordHash: await hashPassword("ChangeMoi2025!"),
        role: "super_admin",
        accountType: "professionnel",
        staffPosition: "pdg",
        emailVerified: true,
      })
      .returning();
    adminId = a.id;
    console.log("[seed] compte direction créé:", adminEmail);
  } else {
    adminId = existing[0].id;
  }

  const count = await db.select().from(annonces).limit(1);
  if (count.length === 0) {
    const demo = [
      { titre: "Peugeot 208 1.2 PureTech", marque: "Peugeot", modele: "208", version: "1.2 PureTech 100", annee: 2021, kilometrage: 38000, prix: "15900", carburant: "essence" as const, categorie: "citadine" as const },
      { titre: "Renault Clio V dCi", marque: "Renault", modele: "Clio", version: "1.5 dCi 85", annee: 2020, kilometrage: 62000, prix: "12500", carburant: "diesel" as const, categorie: "citadine" as const },
      { titre: "Citroën DS3 THP", marque: "Citroën", modele: "DS3", version: "1.6 THP 155", annee: 2018, kilometrage: 84000, prix: "9900", carburant: "essence" as const, categorie: "citadine" as const },
      { titre: "Yamaha XMAX 300", marque: "Yamaha", modele: "XMAX", version: "300 ABS", annee: 2022, kilometrage: 9000, prix: "5400", carburant: "essence" as const, categorie: "scooter" as const, famille: "moto" as const },
    ];
    for (const d of demo) {
      const [a] = await db
        .insert(annonces)
        .values({
          ownerId: adminId,
          titre: d.titre,
          marque: d.marque,
          modele: d.modele,
          version: d.version,
          annee: d.annee,
          kilometrage: d.kilometrage,
          prix: d.prix,
          carburant: d.carburant,
          categorie: d.categorie,
          famille: (d as any).famille ?? "auto",
          type: "vente",
          status: "publiee",
          vendeurType: "professionnel",
          ville: "Paris",
          codePostal: "75001",
          publishedAt: new Date(),
        })
        .returning();
      await db.insert(annoncePhotos).values({
        annonceId: a.id,
        url: `https://picsum.photos/seed/mka${a.id}/800/600`,
        ordre: 0,
      });
    }
    console.log("[seed] annonces de démonstration créées");
  }

  const g = await db.select().from(garagesPublics).limit(1);
  if (g.length === 0) {
    await db.insert(garagesPublics).values({
      ownerId: adminId,
      name: "MKA.P-MS Garage Paris",
      slug: "mkapms-garage-paris",
      description: "Garage certifié MKA.P-MS — entretien, réparation, carrosserie.",
      city: "Paris",
      postalCode: "75001",
      country: "FR",
      phone: "+33 7 62 44 51 42",
      status: "valide",
      featured: true,
      rating: "4.8",
      reviewCount: 128,
    });
    console.log("[seed] garage de démonstration créé");
  }

  await pool.end();
  console.log("[seed] terminé.");
}

main().catch((err) => {
  console.error("[seed] échec:", err);
  process.exit(1);
});
