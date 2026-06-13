// Données de démonstration minimales (idempotent).
import { eq, sql } from "drizzle-orm";
import { db, pool } from "./db.js";
import {
  users,
  annonces,
  annoncePhotos,
  garagesPublics,
  modules,
  roles,
  permissions,
  rolePermissions,
  documentTypes,
  currencies,
  languages,
  countryConfigs,
  cgAbonnements,
  cgPacks,
  livraisonPiecesInterdites,
  livraisonPiecesRules,
} from "./schema.js";
import { hashPassword } from "./auth.js";
import { WORLD_COUNTRIES, WORLD_CURRENCIES, LAUNCH_ACTIVE_COUNTRIES } from "./data/world.js";

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
  // Partie 4/4 — modules prévus dans la structure, masqués au lancement.
  { code: "controle_technique", nom: "Contrôle technique", description: "Réseau de centres CT + prise de RDV (à venir).", status: "masque", ordre: 20, visiblePublic: true },
  { code: "fournisseurs", nom: "Fournisseurs mondiaux", description: "Base partenaires import/export (interne).", status: "masque", ordre: 21, visiblePublic: false },
  { code: "carte_mondiale", nom: "Carte mondiale", description: "Tous les services par pays/ville sur une carte (à venir).", status: "masque", ordre: 22, visiblePublic: true },
  { code: "qualite", nom: "Qualité / Amélioration", description: "Espace privé : bugs, idées, signalements (analyse Direction).", status: "masque", ordre: 23, visiblePublic: false },
  // Partie 23 — MKA.P-MS Lab : tester de nouvelles idées sans toucher au coeur.
  { code: "lab", nom: "MKA.P-MS Lab", description: "Laboratoire d'expériences (feature flags) : activer/tester/désactiver (Super Admin).", status: "masque", ordre: 24, visiblePublic: false },
  // Parties 24-29 — modules internes back-office (bonus stratégiques).
  { code: "achat", nom: "Achat / Approvisionnement", description: "Bons de commande, réceptions, contrôle qualité fournisseurs (interne).", status: "masque", ordre: 25, visiblePublic: false },
  { code: "rh", nom: "Centre RH", description: "Contrats employés, congés, évaluations, primes (interne, relié Finance+).", status: "masque", ordre: 26, visiblePublic: false },
  { code: "centre_qualite", nom: "Centre Qualité", description: "Notation interne A+→D des garages/vendeurs/livreurs/VTC/partenaires (invisible public).", status: "masque", ordre: 27, visiblePublic: false },
  { code: "investisseurs", nom: "Mode Investisseurs", description: "Tableau de bord croissance / revenus / valorisation (lecture seule).", status: "masque", ordre: 28, visiblePublic: false },
  { code: "medias", nom: "Centre Médias", description: "Vidéos, photos, réseaux sociaux, campagnes, influenceurs/ambassadeurs (interne).", status: "masque", ordre: 29, visiblePublic: false },
  { code: "api_partenaires", nom: "API Partenaires", description: "Clés API + portée pour brancher Auto1, historiques, assurances, paiements, transporteurs.", status: "masque", ordre: 30, visiblePublic: false },
];

const ROLES_SEED: Array<{ name: string; label: string; level: number }> = [
  // Hiérarchie d'entreprise à 6 niveaux (Partie A §4).
  { name: "super_admin", label: "PDG (Super-Admin)", level: 100 },
  { name: "admin", label: "Administration", level: 80 },
  { name: "directeur", label: "Directeur", level: 70 },
  { name: "adjoint", label: "Adjoint de direction", level: 65 },
  { name: "manager", label: "Gérant", level: 60 },
  { name: "employee", label: "Employé", level: 35 },
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

// Catalogue de permissions (clé, module, description). Tout est en base : la
// Direction peut tout réattribuer sans toucher au code (§3 + §15).
const PERMISSIONS_SEED: Array<{ key: string; module: string; description: string }> = [
  { key: "stats.view", module: "backoffice", description: "Voir les statistiques et le reporting" },
  { key: "accounts.view", module: "comptes", description: "Consulter les comptes utilisateurs" },
  { key: "accounts.edit", module: "comptes", description: "Modifier les comptes clients" },
  { key: "accounts.create", module: "comptes", description: "Créer des comptes internes (Direction)" },
  { key: "accounts.delete", module: "comptes", description: "Supprimer un compte directement (Direction)" },
  { key: "accounts.delete_request", module: "comptes", description: "Demander la suppression d'un compte (Employé, soumis à approbation)" },
  { key: "accounts.set_role", module: "comptes", description: "Attribuer un rôle / poste (Direction)" },
  { key: "staff.manage", module: "comptes", description: "Gérer l'organigramme et les employés (Direction)" },
  { key: "inscriptions.validate", module: "validation", description: "Valider les inscriptions particuliers/pros" },
  { key: "kyc.verify", module: "validation", description: "Vérifier les documents (SIRET, KBIS, RIB, identité)" },
  { key: "garages.validate", module: "validation", description: "Valider / suspendre les garages" },
  { key: "annonces.moderate", module: "moderation", description: "Modérer (publier / refuser) les annonces" },
  { key: "annonces.certify", module: "moderation", description: "Certifier un véhicule « Sélection MKA.P-MS » (Direction)" },
  { key: "payments.view", module: "finance", description: "Consulter et suivre les paiements" },
  { key: "payments.manage", module: "finance", description: "Gérer / rembourser les paiements (Direction)" },
  { key: "reservations.view", module: "finance", description: "Suivre les réservations et locations" },
  { key: "subscriptions.view", module: "finance", description: "Consulter les abonnements" },
  { key: "products.manage", module: "catalogue", description: "Créer / modifier produits et offres" },
  { key: "promos.manage", module: "catalogue", description: "Gérer les codes promotionnels (Direction)" },
  { key: "finances.global", module: "finance", description: "Vue globale des finances temps réel (Direction — radar)" },
  { key: "audit.view", module: "structure", description: "Consulter le journal des actions (Direction)" },
  { key: "marketing.manage", module: "marketing", description: "Gérer QR codes, bannières, campagnes (Direction)" },
  { key: "modules.manage", module: "structure", description: "Activer / désactiver les univers (Direction)" },
  { key: "rbac.manage", module: "structure", description: "Gérer rôles et permissions (Direction)" },
  { key: "support.handle", module: "support", description: "Traiter les demandes et tickets clients" },
  { key: "accounts.delete_particulier", module: "users", description: "Supprimer des comptes particuliers (Directeur)" },
];

// Sous-ensemble opérationnel accordé aux EMPLOYÉS (Administration normale).
// La Direction (super_admin) reçoit TOUTES les permissions.
// Réservé au PDG uniquement (Partie A §4) : fermer la plateforme, supprimer des
// comptes, gérer le code/structure. Personne d'autre, pas même le Directeur.
const PDG_ONLY = new Set<string>([
  "accounts.delete",
  "modules.manage",
  "rbac.manage",
]);

// Le Directeur peut supprimer des comptes particuliers mais pas des pros.
const DIRECTEUR_EXTRA = new Set<string>([
  "accounts.delete_particulier",
]);

const EMPLOYEE_PERMISSIONS = new Set<string>([
  "stats.view",
  "accounts.view",
  "accounts.edit",
  "accounts.delete_request",
  "inscriptions.validate",
  "kyc.verify",
  "garages.validate",
  "annonces.moderate",
  "payments.view",
  "reservations.view",
  "subscriptions.view",
  "products.manage",
  "support.handle",
]);

const DOCUMENT_TYPES_SEED: Array<{ code: string; label: string; appliesTo: string; required: boolean }> = [
  { code: "piece_identite", label: "Pièce d'identité", appliesTo: "tous", required: true },
  { code: "justificatif_domicile", label: "Justificatif de domicile", appliesTo: "particulier", required: false },
  { code: "siret", label: "Numéro SIRET", appliesTo: "professionnel", required: true },
  { code: "kbis", label: "Extrait KBIS", appliesTo: "professionnel", required: true },
  { code: "rib", label: "RIB", appliesTo: "professionnel", required: true },
];

// Devises mondiales (Partie 6 — « money mondial »). Affichage auto selon le pays.
const CURRENCIES_SEED = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "Dollar américain" },
  { code: "GBP", symbol: "£", name: "Livre sterling" },
  { code: "GNF", symbol: "FG", name: "Franc guinéen" },
  { code: "XOF", symbol: "CFA", name: "Franc CFA (UEMOA)" },
  { code: "XAF", symbol: "FCFA", name: "Franc CFA (CEMAC)" },
  { code: "MAD", symbol: "DH", name: "Dirham marocain" },
  { code: "DZD", symbol: "DA", name: "Dinar algérien" },
  { code: "TND", symbol: "DT", name: "Dinar tunisien" },
  { code: "NGN", symbol: "₦", name: "Naira nigérian" },
  { code: "GHS", symbol: "₵", name: "Cedi ghanéen" },
  { code: "SAR", symbol: "﷼", name: "Riyal saoudien" },
  { code: "AED", symbol: "د.إ", name: "Dirham émiratien" },
  { code: "QAR", symbol: "ر.ق", name: "Riyal qatari" },
  { code: "CAD", symbol: "$CA", name: "Dollar canadien" },
  { code: "CNY", symbol: "¥", name: "Yuan chinois" },
];

export async function seedStructure() {
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
  // Devises mondiales (legacy + catalogue mondial complet).
  for (const c of [...CURRENCIES_SEED, ...WORLD_CURRENCIES]) {
    await db.insert(currencies).values(c).onConflictDoNothing({ target: currencies.code });
  }
  for (const l of [
    { code: "fr", name: "Français" },
    { code: "en", name: "English" },
    { code: "ar", name: "العربية" },
  ]) {
    await db.insert(languages).values(l).onConflictDoNothing({ target: languages.code });
  }

  // Permissions + affectations aux rôles (RBAC réellement peuplé).
  for (const p of PERMISSIONS_SEED) {
    await db.insert(permissions).values(p).onConflictDoNothing({ target: permissions.key });
  }
  for (const d of DOCUMENT_TYPES_SEED) {
    await db.insert(documentTypes).values(d).onConflictDoNothing({ target: documentTypes.code });
  }
  const allRoles = await db.select().from(roles);
  const allPerms = await db.select().from(permissions);
  const roleByName = new Map(allRoles.map((r) => [r.name, r.id]));
  const sa = roleByName.get("super_admin");
  const adminId = roleByName.get("admin");
  const empId = roleByName.get("employee");
  const directeurId = roleByName.get("directeur");
  const adjointId = roleByName.get("adjoint");
  const managerId = roleByName.get("manager");
  const existingRP = await db.select().from(rolePermissions);
  const rpByKey = new Map(existingRP.map((rp) => [`${rp.roleId}:${rp.permissionId}`, rp]));
  async function grant(roleId: number | undefined, permId: number, allowed: boolean) {
    if (!roleId) return;
    const existing = rpByKey.get(`${roleId}:${permId}`);
    if (existing) {
      // Idempotent : on resynchronise le flag si la grille a évolué.
      if (existing.allowed !== allowed) {
        await db
          .update(rolePermissions)
          .set({ allowed })
          .where(eq(rolePermissions.id, existing.id));
      }
      return;
    }
    await db.insert(rolePermissions).values({ roleId, permissionId: permId, allowed });
  }
  for (const perm of allPerms) {
    await grant(sa, perm.id, true); // PDG : pouvoir total
    // Directeur : tout sauf les pouvoirs réservés au PDG + accès delete_particulier.
    await grant(directeurId, perm.id, !PDG_ONLY.has(perm.key) || DIRECTEUR_EXTRA.has(perm.key));
    // Adjoint : comme le Directeur, mais ne gère pas l'organigramme ni les promos.
    await grant(
      adjointId,
      perm.id,
      !PDG_ONLY.has(perm.key) && perm.key !== "staff.manage" && perm.key !== "promos.manage",
    );
    // Gérant : opérations + gestion de son équipe (filtrée).
    const managerAllowed = EMPLOYEE_PERMISSIONS.has(perm.key) || perm.key === "staff.manage";
    await grant(managerId, perm.id, managerAllowed);
    // Administration / Employé : opérations courantes.
    const opsAllowed = EMPLOYEE_PERMISSIONS.has(perm.key);
    await grant(adminId, perm.id, opsAllowed);
    await grant(empId, perm.id, opsAllowed);
  }
  // Backfill des références uniques (Partie 6) — idempotent (ne touche que NULL).
  await db.execute(
    sql`UPDATE annonces SET reference = 'MKA-A-' || lpad(id::text, 6, '0') WHERE reference IS NULL`,
  );
  await db.execute(
    sql`UPDATE users SET reference = 'MKA-U-' || lpad(id::text, 6, '0') WHERE reference IS NULL`,
  );
  // Parties 14 & 19 — Catalogue mondial : TOUS les pays (Europe comprise).
  // FR/GN/SN/CI actifs au lancement, les autres activables par le PDG.
  for (const c of WORLD_COUNTRIES) {
    await db
      .insert(countryConfigs)
      .values({ code: c.code, name: c.name, currency: c.currency, active: LAUNCH_ACTIVE_COUNTRIES.includes(c.code) })
      .onConflictDoNothing({ target: countryConfigs.code });
  }
  // Abonnements Carte Grise / SIV
  const CG_ABONNEMENTS = [
    { code: "cg_start", nom: "START — Carte Grise", prixHT: "29.99", prixTTC: "35.99", dossiersMois: 25, features: { utilisateurs: 1, messagerie: true, suiviDossiers: true, notifications: true, tableauBord: true, telechargerDocs: true } },
    { code: "cg_premium", nom: "PREMIUM — Carte Grise", prixHT: "59.99", prixTTC: "71.99", dossiersMois: 100, features: { utilisateurs: 3, gestionEquipe: true, historique: true, statistiques: true, exportsPDF: true, assignation: true, relancesAuto: true, rapportsMensuels: true } },
    { code: "cg_elite", nom: "ELITE — Carte Grise", prixHT: "99.99", prixTTC: "119.99", dossiersMois: 300, features: { utilisateurs: 10, multiOperateurs: true, rapportsAvances: true, suiviProductivite: true, gestionResponsables: true, controleQualite: true, kpiEquipe: true, priorisationDossiers: true } },
    { code: "cg_max", nom: "MAX — Carte Grise", prixHT: "149.99", prixTTC: "179.99", dossiersMois: 9999, features: { utilisateurs: -1, multiAgences: true, multiSites: true, statsGlobales: true, superviseurs: true, tableauxBordDirection: true, controleCentralise: true } },
  ];
  for (const a of CG_ABONNEMENTS) {
    await db.insert(cgAbonnements).values(a).onConflictDoNothing();
  }
  // Packs crédits Carte Grise
  const CG_PACKS = [
    { nom: "Pack 10 dossiers", nbDossiers: 10, prixHT: "49.99", prixTTC: "59.99" },
    { nom: "Pack 25 dossiers", nbDossiers: 25, prixHT: "99.99", prixTTC: "119.99" },
    { nom: "Pack 50 dossiers", nbDossiers: 50, prixHT: "179.99", prixTTC: "215.99" },
    { nom: "Pack 100 dossiers", nbDossiers: 100, prixHT: "299.99", prixTTC: "359.99" },
  ];
  for (const p of CG_PACKS) {
    await db.insert(cgPacks).values(p).onConflictDoNothing();
  }
  // Pièces interdites livraison moto/scooter
  const PIECES_INTERDITES_MOTO = [
    { motCle: "moteur", motif: "Trop lourd et volumineux pour moto/scooter" },
    { motCle: "boite_vitesse", motif: "Trop lourd pour moto/scooter" },
    { motCle: "capot", motif: "Dimensions incompatibles moto/scooter" },
    { motCle: "pare_chocs", motif: "Dimensions incompatibles moto/scooter" },
    { motCle: "porte", motif: "Dimensions incompatibles moto/scooter" },
    { motCle: "aile", motif: "Trop volumineux pour moto/scooter" },
    { motCle: "siege", motif: "Trop volumineux pour moto/scooter" },
    { motCle: "pneu", motif: "Trop volumineux (> 60cm) pour moto/scooter" },
    { motCle: "jante", motif: "Trop lourd (> 20 kg) pour moto/scooter" },
    { motCle: "radiateur", motif: "Trop volumineux pour moto/scooter" },
    { motCle: "tableau_bord", motif: "Dimensions incompatibles moto/scooter" },
    { motCle: "reservoir_carburant", motif: "Dangereux et volumineux" },
  ];
  for (const p of PIECES_INTERDITES_MOTO) {
    await db.insert(livraisonPiecesInterdites).values(p).onConflictDoNothing();
  }

  // Règles livraison moto/scooter (limites)
  const LIVRAISON_RULES = [
    { categoriePiece: "capteur", poidsMaxKg: "20", longueurMaxCm: 60, largeurMaxCm: 40, hauteurMaxCm: 40, compatibleMoto: true },
    { categoriePiece: "calculateur", poidsMaxKg: "5", longueurMaxCm: 40, largeurMaxCm: 30, hauteurMaxCm: 20, compatibleMoto: true },
    { categoriePiece: "alternateur", poidsMaxKg: "15", longueurMaxCm: 40, largeurMaxCm: 30, hauteurMaxCm: 30, compatibleMoto: true },
    { categoriePiece: "demarreur", poidsMaxKg: "10", longueurMaxCm: 40, largeurMaxCm: 25, hauteurMaxCm: 25, compatibleMoto: true },
    { categoriePiece: "filtre", poidsMaxKg: "3", longueurMaxCm: 40, largeurMaxCm: 30, hauteurMaxCm: 20, compatibleMoto: true },
    { categoriePiece: "petit_colis", poidsMaxKg: "20", longueurMaxCm: 60, largeurMaxCm: 40, hauteurMaxCm: 40, compatibleMoto: true },
    { categoriePiece: "document", poidsMaxKg: "2", longueurMaxCm: 35, largeurMaxCm: 25, hauteurMaxCm: 5, compatibleMoto: true },
  ];
  for (const r of LIVRAISON_RULES) {
    await db.insert(livraisonPiecesRules).values(r).onConflictDoNothing();
  }

  console.log(`[seed] structure initialisée (${WORLD_COUNTRIES.length} pays, ${CURRENCIES_SEED.length + WORLD_CURRENCIES.length} devises, abonnements CG + packs, pièces interdites moto)`);
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

  // Compte Directeur (Admin Employé)
  const directeurEmail = "directeur@mkapms.com";
  const existDir = await db.select().from(users).where(eq(users.email, directeurEmail)).limit(1);
  if (!existDir.length) {
    await db.insert(users).values({
      email: directeurEmail,
      name: "Directeur MKA.P-MS",
      passwordHash: await hashPassword("DirecteurMKA2025!"),
      role: "admin",
      accountType: "professionnel",
      staffPosition: "directeur",
      emailVerified: true,
    });
    console.log("[seed] compte directeur créé:", directeurEmail);
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

// Exécution directe (npm run seed) uniquement — JAMAIS à l'import depuis le
// serveur. On s'appuie sur un flag d'environnement car, une fois le serveur
// bundlé (esbuild), import.meta.url ne permet plus de distinguer ce fichier.
if (process.env.SEED_DIRECT === "1") {
  main().catch((err) => {
    console.error("[seed] échec:", err);
    process.exit(1);
  });
}
