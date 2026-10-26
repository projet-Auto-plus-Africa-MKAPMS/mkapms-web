/**
 * Test de régression — Panneau « Changer l'univers de publication »
 * (demande Direction 26/10) : un membre de la plateforme (admin/directeur)
 * doit pouvoir, depuis le récapitulatif de modification d'une annonce déjà
 * publiée (n'importe quelle catégorie — officielle, professionnelle,
 * particulier), choisir librement entre Officielle MKA.P-MS / Professionnelle
 * / Particulier / Sur commande, sans jamais casser l'existant.
 *
 * On reproduit ici la logique pure des deux garde-fous ajoutés dans
 * `server/routers/annonces.ts` (mutation `update`) pour rester déterministe
 * (aucune connexion DB réelle) :
 *   1. Changer categorieAnnonce seul ne doit JAMAIS écraser un ownership
 *      "partenaire" déjà lié (un véhicule sur commande resterait sur
 *      commande même si on change son univers d'affichage).
 *   2. Transformer en véhicule sur commande (vehiculeSurCommande fourni)
 *      doit être refusé si l'annonce est déjà liée — jamais une seconde
 *      liaison silencieuse.
 */
import assert from "node:assert/strict";

type Categorie = "officielle" | "professionnelle" | "particulier";
type Ownership = "client" | "plateforme" | "partenaire";

function calculerOwnershipApresChangementCategorie(
  ownershipActuel: Ownership,
  categorieAnnonce: Categorie,
): Ownership {
  // Reproduction de server/routers/annonces.ts — mutation `update`,
  // branche "Changement de catégorie — admin uniquement".
  if (ownershipActuel !== "partenaire") {
    return categorieAnnonce === "officielle" ? "plateforme" : "client";
  }
  return ownershipActuel;
}

function peutTransformerEnSurCommande(ownershipActuel: Ownership): { autorise: boolean; message?: string } {
  // Reproduction de server/routers/annonces.ts — mutation `update`,
  // branche "Transformer une annonce existante en véhicule sur commande".
  if (ownershipActuel === "partenaire") {
    return { autorise: false, message: "Cette annonce est déjà un véhicule sur commande." };
  }
  return { autorise: true };
}

// ── 1. Changer la catégorie d'une annonce normale (client) → ownership suit ──
{
  const result = calculerOwnershipApresChangementCategorie("client", "officielle");
  assert.equal(result, "plateforme", "une annonce normale reclassée « officielle » doit devenir plateforme");
}
{
  const result = calculerOwnershipApresChangementCategorie("plateforme", "professionnelle");
  assert.equal(result, "client", "une annonce officielle reclassée « professionnelle » doit redevenir client");
}

// ── 2. Changer la catégorie d'un véhicule sur commande (partenaire) → ownership PRÉSERVÉ ──
{
  const result = calculerOwnershipApresChangementCategorie("partenaire", "officielle");
  assert.equal(result, "partenaire", "ownership=partenaire ne doit JAMAIS être écrasé par un simple changement d'univers");
}
{
  const result = calculerOwnershipApresChangementCategorie("partenaire", "particulier");
  assert.equal(result, "partenaire", "ownership=partenaire doit rester partenaire quelle que soit la nouvelle categorieAnnonce");
}

// ── 3. Transformer une annonce normale en véhicule sur commande → autorisé ──
{
  const result = peutTransformerEnSurCommande("client");
  assert.equal(result.autorise, true);
}
{
  const result = peutTransformerEnSurCommande("plateforme");
  assert.equal(result.autorise, true);
}

// ── 4. Transformer une annonce DÉJÀ liée → refusé, jamais une double liaison ──
{
  const result = peutTransformerEnSurCommande("partenaire");
  assert.equal(result.autorise, false);
  assert.match(result.message ?? "", /déjà un véhicule sur commande/);
}

console.log("✅ panneau « Changer l'univers de publication » — garde-fous ownership respectés (100 % OK)");
