/**
 * Media OS — moteur de gestion des médias (Phase 51).
 *
 * Centralise l'optimisation des médias : compression, miniatures, conversion
 * WebP/AVIF, détection de doublons et contrôle qualité. Réutilise `sharp`
 * (déjà présent) et le hash perceptuel du Smart Engine — aucun second moteur
 * d'image ni nouvelle dépendance.
 *
 * Interconnexion : Supervision & Opérations (feed MOS).
 */
import sharp from "sharp";
import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../trpc.js";
import { computePerceptualHash, hammingDistance, PHASH_SIMILARITY_THRESHOLD } from "../smart-engine/services/photo-perceptual.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

export type ImageFormat = "webp" | "avif" | "jpeg";

/** Décode un Buffer, un base64 ou un data URI en Buffer. */
export function toBuffer(input: Buffer | string): Buffer {
  if (Buffer.isBuffer(input)) return input;
  const raw = input.startsWith("data:") ? (input.split(",")[1] ?? input) : input;
  return Buffer.from(raw, "base64");
}

function mime(format: ImageFormat): string {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`;
}

export interface OptimizedImage {
  main: string;       // data URI optimisé (grand format)
  thumbnail: string;  // data URI miniature
  width: number;
  height: number;
  bytes: number;      // taille du grand format optimisé
  format: ImageFormat;
}

/**
 * Optimise une image : auto-rotation EXIF, redimensionnement, conversion vers
 * WebP/AVIF/JPEG + génération d'une miniature. Best-effort sur les métadonnées.
 */
export async function optimizeImage(
  input: Buffer | string,
  opts?: { maxWidth?: number; quality?: number; format?: ImageFormat; thumbWidth?: number },
): Promise<OptimizedImage> {
  const buf = toBuffer(input);
  const format: ImageFormat = opts?.format ?? "webp";
  const quality = opts?.quality ?? 80;
  const maxWidth = opts?.maxWidth ?? 1920;
  const thumbWidth = opts?.thumbWidth ?? 320;

  const base = sharp(buf).rotate().resize({ width: maxWidth, height: maxWidth, fit: "inside", withoutEnlargement: true });
  const mainBuf = await applyFormat(base.clone(), format, quality).toBuffer();
  const thumbBuf = await applyFormat(
    sharp(buf).rotate().resize({ width: thumbWidth, height: thumbWidth, fit: "inside", withoutEnlargement: true }),
    format,
    Math.min(quality, 70),
  ).toBuffer();

  let width = 0, height = 0;
  try {
    const meta = await sharp(mainBuf).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
  } catch { /* best-effort */ }

  return {
    main: `data:${mime(format)};base64,${mainBuf.toString("base64")}`,
    thumbnail: `data:${mime(format)};base64,${thumbBuf.toString("base64")}`,
    width, height, bytes: mainBuf.length, format,
  };
}

type SharpPipeline = ReturnType<typeof sharp>;

function applyFormat(pipeline: SharpPipeline, format: ImageFormat, quality: number): SharpPipeline {
  if (format === "avif") return pipeline.avif({ quality });
  if (format === "jpeg") return pipeline.jpeg({ quality, mozjpeg: true });
  return pipeline.webp({ quality });
}

export interface QualityReport {
  ok: boolean;
  width: number;
  height: number;
  bytes: number;
  format?: string;
  issues: string[];
  perceptualHash: string | null;
}

/** Contrôle qualité d'une image (dimensions, poids, format) + empreinte. */
export async function analyzeImage(input: Buffer | string): Promise<QualityReport> {
  const buf = toBuffer(input);
  const issues: string[] = [];
  let width = 0, height = 0, format: string | undefined;
  try {
    const meta = await sharp(buf).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
    format = meta.format;
  } catch {
    issues.push("decodage_impossible");
  }
  if (width && width < 640) issues.push("resolution_faible");
  if (height && height < 480) issues.push("hauteur_faible");
  if (buf.length > 5 * 1024 * 1024) issues.push("fichier_lourd");
  const perceptualHash = await computePerceptualHash(buf);
  return { ok: issues.length === 0, width, height, bytes: buf.length, format, issues, perceptualHash };
}

/** Deux médias sont-ils des doublons visuels ? (hash perceptuel + Hamming) */
export function areDuplicates(hashA: string, hashB: string): boolean {
  return hammingDistance(hashA, hashB) <= PHASH_SIMILARITY_THRESHOLD;
}

// ── Métadonnées / Health / Feed / Dashboard ──────────────────────────────
const V = "0.1.0";
const M: MaturityLevel = "sprint_2_complete";
export const MEDIA_OS_META = {
  name: "media-os" as const,
  label: "Media Operating System" as const,
  version: V,
  maturityLevel: M,
  contract: "server/media-os/index.ts",
};

export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let sharpOk = false;
  try {
    // 1×1 px PNG minimal → vérifie que le pipeline sharp fonctionne.
    const px = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    await sharp(px).webp().toBuffer();
    sharpOk = true;
  } catch { status = "degraded"; }
  return { engine: "media-os" as const, version: V, status, checkedAt: new Date().toISOString(), metrics: { sharpOk, responseMs: Date.now() - s } };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: MEDIA_OS_META.name, label: MEDIA_OS_META.label,
    version: V, maturityLevel: M, health: h.status,
    load: { events5m: 0, events24h: 0 },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(), status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const h = await healthStatus();
  return { ...feed, businessMetrics: { sharp_ok: h.metrics.sharpOk ? 1 : 0, formats: 3 }, recentEvents: [], recentErrors: [] };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const mediaOsRouter = router({
  meta: publicProcedure.query(() => MEDIA_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  analyze: adminProcedure
    .input(z.object({ dataUri: z.string().min(16).max(20_000_000) }))
    .mutation(({ input }) => analyzeImage(input.dataUri)),

  optimize: adminProcedure
    .input(z.object({
      dataUri: z.string().min(16).max(20_000_000),
      format: z.enum(["webp", "avif", "jpeg"]).optional(),
      quality: z.number().int().min(30).max(100).optional(),
      maxWidth: z.number().int().min(64).max(4096).optional(),
    }))
    .mutation(({ input }) => optimizeImage(input.dataUri, { format: input.format, quality: input.quality, maxWidth: input.maxWidth })),
});
