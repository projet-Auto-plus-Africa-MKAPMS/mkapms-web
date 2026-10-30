/**
 * Grille tarifaire AL-HOUDOUD·M — vérifications sans base de données :
 * cohérence du catalogue (codes uniques, les 62 offres activées par instruction
 * PDG du 30/10, jamais une offre réellement illimitée) et exactitude du calcul
 * de marge réelle (planMargin/estimateUnitsCost/coutCentsVersUnites sont des
 * fonctions pures).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { IA_PRODUCT_CATALOG, UNITE_COUT_REEL_EUR } from "../catalog.js";
import { planMargin, estimateUnitsCost, coutCentsVersUnites } from "../service.js";
import type { IaProduct } from "../service.js";

test("catalogue IA : codes uniques", () => {
  const codes = IA_PRODUCT_CATALOG.map((p) => p.code);
  assert.equal(codes.length, new Set(codes).size, "un code produit est dupliqué dans le catalogue");
});

test("catalogue IA : exactement 62 offres, toutes activées (instruction PDG du 30/10)", () => {
  assert.equal(IA_PRODUCT_CATALOG.length, 62, "le nombre d'offres a changé — l'instruction PDG interdit toute création/suppression");
  for (const p of IA_PRODUCT_CATALOG) {
    assert.equal(p.active, true, `${p.code} doit être activée`);
  }
});

test("catalogue IA : aucune offre sans quota (jamais d'illimité qui pourrait entraîner des pertes)", () => {
  for (const p of IA_PRODUCT_CATALOG) {
    const meta = p.metadata as any;
    if (meta?.kind === "abonnement" || meta?.kind === "decouverte" || meta?.kind === "essai_gratuit" || meta?.kind === "credits") {
      assert.ok(typeof meta.creditsInclus === "number" && meta.creditsInclus > 0, `${p.code} doit porter un quota d'unités explicite`);
    }
  }
});

test("catalogue IA : l'annuel coûte moins que 12 mensuels (remise réelle, pas un simple x12)", () => {
  const mensuel = IA_PRODUCT_CATALOG.find((p) => p.code === "ia_particulier_leger_mensuel");
  const annuel = IA_PRODUCT_CATALOG.find((p) => p.code === "ia_particulier_leger_annuel");
  assert.ok(mensuel && annuel);
  assert.ok(annuel!.price < mensuel!.price * 12, "l'annuel doit être remisé par rapport à 12 fois le mensuel");
});

test("estimateUnitsCost : proportionnel au coût réel mesuré par unité, jamais arrondi à 0", () => {
  const r = estimateUnitsCost(100);
  assert.equal(r.coutReelEstimeEur, Math.round(100 * UNITE_COUT_REEL_EUR * 100) / 100);
  assert.ok(r.coutReelEstimeEur > 0);
});

test("planMargin : marge = prix de vente - coût réel des unités incluses", () => {
  const faux: IaProduct = {
    id: 1, code: "x", name: "x", univers: "ia", paymentCase: "ia_abonnement",
    price: 19.9, currency: "EUR", vatRate: 20, countryCode: "FR",
    paymentType: "recurring", periodicity: "monthly", beneficiary: "mkapms",
    commissionRate: 0, validityDays: 30, refundPolicy: null, active: true,
    metadata: { creditsInclus: 200 }, meta: { creditsInclus: 200 } as any,
  };
  const m = planMargin(faux);
  assert.equal(m.coutReelEstimeEur, Math.round(200 * UNITE_COUT_REEL_EUR * 100) / 100);
  assert.equal(m.margeEur, Math.round((19.9 - m.coutReelEstimeEur) * 100) / 100);
  assert.ok(m.margePct! > 0 && m.margePct! < 100, "la marge doit être réelle, ni nulle ni absurde");
});

test("coutCentsVersUnites : proportionnel au coût réel mesuré, jamais 0 (protection contre une consommation non financée)", () => {
  const coutCents = 10; // 0,10 $ ≈ 0,10 €
  assert.equal(coutCentsVersUnites(coutCents), (coutCents / 100) / UNITE_COUT_REEL_EUR);
});

test("coutCentsVersUnites : un coût nul ou négatif (mesure ratée) applique quand même un plancher positif", () => {
  assert.ok(coutCentsVersUnites(0) > 0, "un coût à 0 ne doit jamais devenir une consommation gratuite");
  assert.ok(coutCentsVersUnites(-1) > 0, "un coût négatif aberrant ne doit jamais devenir un crédit");
});
