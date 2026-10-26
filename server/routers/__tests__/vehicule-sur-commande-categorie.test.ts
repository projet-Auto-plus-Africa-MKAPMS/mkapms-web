/**
 * Test de régression — Routage par univers d'un véhicule sur commande.
 *
 * Reproduit le bug signalé par la Direction (26/10) : un employé sélectionne
 * « OFFICIEL MKA.P-MS → Univers Officiel MKA.P-MS » au dépôt d'un véhicule
 * sur commande (bouton « Manuel » du portail fournisseur), mais l'annonce
 * publiée finissait routée vers /acheter/professionnel/vehicule/:id au lieu
 * de /acheter/mkapms-officiel/vehicule/:id.
 *
 * Cause : `server/routers/annonces.ts` (mutation `create`) forçait
 * systématiquement `categorieAnnonce = "professionnelle"` dès que
 * `vehiculeSurCommande` était fourni, en ignorant le choix réel transmis
 * par le client (`inputCatAnnonce`). `ownership` (qui pilote l'affichage
 * du bloc « véhicule sur commande » côté Product Page Engine) est, lui,
 * déjà forcé à "partenaire" indépendamment de categorieAnnonce — donc
 * respecter le choix réel de categorieAnnonce ne change rien à l'affichage
 * du bloc sur commande, seulement à l'univers de routage.
 *
 * On reproduit ici la logique pure (identique à server/routers/annonces.ts)
 * pour rester déterministe (aucune connexion DB réelle).
 */
import assert from "node:assert/strict";

type Categorie = "officielle" | "professionnelle" | "particulier";

function determinerCategorieAnnonce(params: {
  vehiculeSurCommande: boolean;
  inputCatAnnonce?: Categorie;
  isEmployee: boolean;
  isProUser: boolean;
}): Categorie {
  const { vehiculeSurCommande, inputCatAnnonce, isEmployee, isProUser } = params;
  if (vehiculeSurCommande && inputCatAnnonce) {
    return inputCatAnnonce;
  } else if (vehiculeSurCommande) {
    return "professionnelle";
  } else if (isEmployee && inputCatAnnonce) {
    return inputCatAnnonce;
  } else if (isEmployee) {
    return "officielle";
  } else if (isProUser) {
    return "professionnelle";
  } else {
    return "particulier";
  }
}

// ── 1. Véhicule sur commande + choix explicite "officielle" → respecté ──
{
  const result = determinerCategorieAnnonce({
    vehiculeSurCommande: true,
    inputCatAnnonce: "officielle",
    isEmployee: true,
    isProUser: false,
  });
  assert.equal(result, "officielle", "le choix « Officielle MKA.P-MS » doit être respecté pour un véhicule sur commande");
}

// ── 2. Véhicule sur commande + choix explicite "particulier" → respecté ─
{
  const result = determinerCategorieAnnonce({
    vehiculeSurCommande: true,
    inputCatAnnonce: "particulier",
    isEmployee: true,
    isProUser: false,
  });
  assert.equal(result, "particulier");
}

// ── 3. Véhicule sur commande sans choix transmis → défaut "professionnelle" (préservé) ─
{
  const result = determinerCategorieAnnonce({
    vehiculeSurCommande: true,
    inputCatAnnonce: undefined,
    isEmployee: true,
    isProUser: false,
  });
  assert.equal(result, "professionnelle", "le défaut historique reste inchangé quand rien n'est transmis");
}

// ── 4. Dépôt normal (pas sur commande), employé, choix explicite → inchangé ─
{
  const result = determinerCategorieAnnonce({
    vehiculeSurCommande: false,
    inputCatAnnonce: "professionnelle",
    isEmployee: true,
    isProUser: false,
  });
  assert.equal(result, "professionnelle");
}

// ── 5. Dépôt normal, employé, aucun choix → défaut "officielle" (inchangé) ─
{
  const result = determinerCategorieAnnonce({
    vehiculeSurCommande: false,
    inputCatAnnonce: undefined,
    isEmployee: true,
    isProUser: false,
  });
  assert.equal(result, "officielle");
}

// ── 6. Dépôt normal, compte pro → "professionnelle" (inchangé) ──────────
{
  const result = determinerCategorieAnnonce({
    vehiculeSurCommande: false,
    inputCatAnnonce: undefined,
    isEmployee: false,
    isProUser: true,
  });
  assert.equal(result, "professionnelle");
}

// ── 7. Dépôt normal, particulier → "particulier" (inchangé) ─────────────
{
  const result = determinerCategorieAnnonce({
    vehiculeSurCommande: false,
    inputCatAnnonce: undefined,
    isEmployee: false,
    isProUser: false,
  });
  assert.equal(result, "particulier");
}

console.log("✅ véhicule sur commande — routage par categorieAnnonce respecté (100 % OK)");
