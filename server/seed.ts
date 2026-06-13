// Données de démonstration minimales (idempotent).
import { eq } from "drizzle-orm";
import { db, pool } from "./db.js";
import {
  users,
  annonces,
  annoncePhotos,
  garagesPublics,
  modules,
  roles,
  currencies,
  languages,
} from "./schema.js";
import { hashPassword } from "./auth.js";

// Registre des univers (fédération) — chaque module activable/désactivable.
const MODULES_SEED: Array<{ code: string; nom: string; description: string; status: "active" | "masque"; ordre: number; visiblePublic: boolean }> = [
  { code: "vente", nom: "Vente", description: "Achat / vente de véhicules (auto + moto/scooter).", status: "active", ordre: 1, visiblePublic: true },
  { code: "location", nom: "Location", description: "Location pro, utilitaires, +3,5 t.", status: "active", ordre: 2, visiblePublic: true },
  { code: "garage", nom: "Garage+", description: "ERP garage : devis, atelier, employés, planning.", status: "active", ordre: 3, visiblePublic: true },
  { code: "devis", nom: "Devis+", description: "Devis garage rapide et automatisé.", status: "active", ordre: 4, visiblePublic: true },
  { code: "pieces", nom: "Pièces Auto", description: "Marketplace B2B/B2C de pièces auto.", status: "active", ordre: 5, visiblePublic: true },
  { code: "livraison", nom: "Livraison", description: "Réseau logistique moto → camion.", status: "active", ordre: 6, visiblePublic: true },
  { code: "vtc_taxi", nom: "VTC / TAXI", description: "Sociétés, chauffeurs et flottes.", status: "active", ordre: 7, visiblePublic: true },
  { code: "depannage", nom: "Dépannage", description: "Assistance routière et dépannage.", status: "active", ordre: 8, visiblePublic: true },
  { code: "historique", nom: "Historique véhicule", description: "Rapport payant (plaque / VIN).", status: "active", ordre: 9, visiblePublic: true },
  { code: "import_africa", nom: "Import Africa+", description: "Achat Europe → livraison Afrique.", status: "active", ordre: 10, visiblePublic: true },
  { code: "finance", nom: "Finance+", description: "Comptabilité interne MKA.P-MS.", status: "active", ordre: 11, visiblePublic: false },
  { code: "wallet", nom: "Wallet professionnel", description: "Soldes et retraits des pros.", status: "active", ordre: 12, visiblePublic: true },
  { code: "contrats", nom: "Contrats intelligents", description: "Génération PDF + signature.", status: "active", ordre: 13, visiblePublic: false },
  { code: "paiement_fractionne", nom: "Paiement fractionné", description: "Paiement en plusieurs fois (admin).", status: "masque", ordre: 14, visiblePublic: false },
  { code: "marketing", nom: "Marketing / QR", description: "QR codes, parrainage, bannières.", status: "active", ordre: 15, visiblePublic: false },
  { code: "lavage", nom: "Lavage Auto", description: "Lavage / detailing (à venir).", status: "masque", ordre: 16, visiblePublic: true },
  { code: "karting", nom: "Karting", description: "Centres & événements karting (à venir).", status: "masque", ordre: 17, visiblePublic: true },
  { code: "formation", nom: "Formation", description: "Formations internes & partenaires (à venir).", status: "masque", ordre: 18, visiblePublic: true },
  { code: "financement", nom: "Financement", description: "Financement conforme (à venir).", status: "masque", ordre: 19, visiblePublic: false },
];

const ROLES_SEED: Array<{ name: string; label: string; level: number }> = [
  { name: "super_admin", label: "Super Admin (PDG)", level: 100 },
  { name: "admin", label: "Administration", level: 80 },
  { name: "directeur", label: "Directeur", level: 70 },
  { name: "manager", label: "Manager", level: 60 },
  { name: "chef_equipe", label: "Chef d'équipe", level: 50 },
  { name: "comptabilite", label: "Comptabilité", level: 45 },
  { name: "support", label: "Support", level: 40 },
  { name: "validation_documents", label: "Validation documents", level: 40 },
  { name: "litiges", label: "Litiges", level: 40 },
  { name: "marketing", label: "Marketing", level: 40 },
  { name: "agent", label: "Agent", level: 30 },
  { name: "pro", label: "Professionnel", level: 20 },
  { name: "garage", label: "Garage", level: 20 },
  { name: "vtc_taxi", label: "VTC / TAXI", level: 20 },
  { name: "delivery", label: "Livreur", level: 20 },
  { name: "user", label: "Particulier", level: 10 },
];

const CURRENCIES_SEED = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GNF", symbol: "FG", name: "Franc guinéen" },
  { code: "XOF", symbol: "CFA", name: "Franc CFA (UEMOA)" },
  { code: "USD", symbol: "$", name: "Dollar américain" },
];

async function seedStructure() {
  for (const m of MODULES_SEED) {
    await db
      .insert(modules)
      .values({ code: m.code, nom: m.nom, description: m.description, status: m.status, ordre: m.ordre, visiblePublic: m.visiblePublic })
      .onConflictDoNothing({ target: modules.code });
  }
  for (const r of ROLES_SEED) {
    await db
      .insert(roles)
      .values({ name: r.name, label: r.label, level: r.level, isSystem: true })
      .onConflictDoNothing({ target: roles.name });
  }
  for (const c of CURRENCIES_SEED) {
    await db.insert(currencies).values(c).onConflictDoNothing({ target: currencies.code });
  }
  await db.insert(languages).values({ code: "fr", name: "Français" }).onConflictDoNothing({ target: languages.code });
  await db.insert(languages).values({ code: "en", name: "English" }).onConflictDoNothing({ target: languages.code });
  console.log("[seed] structure (modules, rôles, devises, langues) initialisée");
}

async function main() {
  await seedStructure();

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
