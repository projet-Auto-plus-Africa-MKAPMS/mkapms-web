/**
 * Test intégration — dHash perceptuel
 *
 * Valide que le hash perceptuel :
 *  1. Produit un hash 16 caractères hex
 *  2. Est stable (même photo → même hash)
 *  3. Est robuste à la recompression JPEG (photo recompressée → distance faible)
 *  4. Distingue deux photos différentes (photo aléatoire → distance élevée)
 *
 * Lancement : `npx tsx server/smart-engine/services/__tests__/perceptual.test.ts`
 */
import assert from "node:assert/strict";
import sharp from "sharp";
import { computePerceptualHash, hammingDistance } from "../photo-perceptual.js";

/** Génère un JPEG synthétique de dégradé horizontal (déterministe). */
async function makeGradient(seed: number, size = 200): Promise<Buffer> {
  const px = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3;
      px[i] = (x + seed) % 256;
      px[i + 1] = (y + seed) % 256;
      px[i + 2] = ((x + y + seed) * 2) % 256;
    }
  }
  return sharp(px, { raw: { width: size, height: size, channels: 3 } })
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function recompressLower(buf: Buffer): Promise<Buffer> {
  // Recompression forte (qualité 30) → simule un upload d'une capture d'écran d'une annonce.
  return sharp(buf).jpeg({ quality: 30 }).toBuffer();
}

async function run() {
  const a = await makeGradient(10);
  const b = await makeGradient(10); // identique
  const c = await recompressLower(a); // même image, très fortement recompressée
  const d = await makeGradient(200); // photo totalement différente

  const ha = await computePerceptualHash(a);
  const hb = await computePerceptualHash(b);
  const hc = await computePerceptualHash(c);
  const hd = await computePerceptualHash(d);

  assert.ok(ha && hb && hc && hd, "tous les hash calculés");
  assert.equal(ha!.length, 16, "hash long de 16 chars hex");

  assert.equal(hammingDistance(ha!, hb!), 0, "hash identique pour deux photos identiques");

  const dc = hammingDistance(ha!, hc!);
  assert.ok(dc <= 5, `robuste à la recompression (distance = ${dc}, attendu ≤ 5)`);

  const dd = hammingDistance(ha!, hd!);
  assert.ok(dd >= 15, `distingue deux photos différentes (distance = ${dd}, attendu ≥ 15)`);

  console.log(
    `✅ dHash perceptuel OK — recompression: d=${dc}, photo différente: d=${dd}`,
  );
}

run().catch((e) => {
  console.error("❌ Test perceptuel échoué :", e);
  process.exit(1);
});
