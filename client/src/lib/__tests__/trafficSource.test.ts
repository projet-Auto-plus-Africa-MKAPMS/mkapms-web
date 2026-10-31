/**
 * Même classification que mkapms-shop (public/traffic-source.js, PR #471) :
 * Google / réseaux sociaux / direct / autre, jamais l'URL complète conservée.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyTrafficSource, TRAFFIC_SOURCES } from "../trafficSource.js";

test("classifyTrafficSource trie les référents dans les 4 catégories, sans jamais planter sur une entrée invalide", () => {
  assert.deepEqual(TRAFFIC_SOURCES, ["google", "social", "direct", "other"]);
  assert.equal(classifyTrafficSource("", undefined), "direct");
  assert.equal(classifyTrafficSource(null, undefined), "direct");
  assert.equal(classifyTrafficSource("https://mkapms.example/acheter", "https://mkapms.example"), "direct");
  assert.equal(classifyTrafficSource("https://www.google.com/search?q=mkapms", undefined), "google");
  assert.equal(classifyTrafficSource("https://www.google.fr/search?q=mkapms", undefined), "google");
  assert.equal(classifyTrafficSource("https://m.facebook.com/", undefined), "social");
  assert.equal(classifyTrafficSource("https://www.instagram.com/", undefined), "social");
  assert.equal(classifyTrafficSource("https://t.co/abc", undefined), "social");
  assert.equal(classifyTrafficSource("https://news.ycombinator.com/", undefined), "other");
  assert.equal(classifyTrafficSource("not-a-url", undefined), "other");
  // Hôte ressemblant (googlefake.com) jamais classé comme google — correspondance exacte du suffixe.
  assert.equal(classifyTrafficSource("https://googlefake.com/", undefined), "other");
});
