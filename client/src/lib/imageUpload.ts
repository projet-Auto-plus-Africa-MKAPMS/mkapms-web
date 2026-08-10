/**
 * Normalisation des photos avant envoi.
 *
 * Les iPhone produisent des HEIC que le serveur ne sait pas décoder (le libvips
 * livré avec sharp n'embarque pas de décodeur HEVC). En revanche, le navigateur
 * de l'appareil, lui, sait afficher ses propres photos : on s'en sert pour les
 * réencoder en JPEG côté client avant l'envoi. Si la conversion échoue, on
 * renvoie le fichier d'origine — l'envoi n'est jamais bloqué par ce repli.
 */
const HEIC_RE = /\.(heic|heif)$/i;

/** Délai au-delà duquel on renonce à convertir et on laisse le serveur décoder. */
const CONVERT_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} : délai dépassé`)), CONVERT_TIMEOUT_MS);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function isHeic(file: File): boolean {
  return HEIC_RE.test(file.name) || /image\/hei[cf]/i.test(file.type);
}

async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  // Safari/iOS refuse createImageBitmap sur un HEIC alors qu'il sait l'afficher
  // dans une <img> : l'échec doit donc basculer sur la seconde voie, pas
  // interrompre la conversion.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* repli <img> ci-dessous */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await withTimeout(
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("décodage impossible"));
        img.src = url;
      }),
      "décodage de la photo",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function toJpeg(file: File): Promise<File> {
  const bitmap = await decode(file);
  const max = 1920;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponible");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await withTimeout(
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9)),
    "encodage JPEG",
  );
  if (!blob) throw new Error("encodage JPEG impossible");

  return new File([blob], file.name.replace(HEIC_RE, "") + ".jpg", { type: "image/jpeg" });
}

// ═══════════════════════════════════════════════════════════════════════
// 🔒 BLOC PROTÉGÉ — CODE : MKAPMS-PHOTO-GUARDIAN-2026-SGX9K3
// Compression automatique des photos lourdes (>5 MB) avant upload.
// Objectif : économiser les données mobiles des utilisateurs (Afrique, 3G/4G)
// et fiabiliser les uploads sur connexions lentes. Universel — fonctionne
// sur mobile, tablette, desktop, PWA. Ne PAS modifier sans autorisation.
// ═══════════════════════════════════════════════════════════════════════
const COMPRESS_THRESHOLD_BYTES = 5 * 1024 * 1024; // 5 MB
const COMPRESS_MAX_DIM = 1920;                     // 1920 px sur le grand côté
const COMPRESS_QUALITY = 0.85;                     // JPEG 85% (haute qualité)

async function compressIfLarge(file: File): Promise<File> {
  if (file.size <= COMPRESS_THRESHOLD_BYTES) return file;
  try {
    const bitmap = await withTimeout(decode(file), "décodage compression");
    const w = bitmap.width;
    const h = bitmap.height;
    const scale = Math.min(1, COMPRESS_MAX_DIM / Math.max(w, h));
    // Déjà petite en dimensions ? Rien à faire (le poids vient d'ailleurs).
    if (scale >= 1 && file.size < COMPRESS_THRESHOLD_BYTES * 2) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await withTimeout(
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", COMPRESS_QUALITY)),
      "compression JPEG",
    );
    if (!blob || blob.size >= file.size) return file; // la compression n'aide pas → renvoie l'original
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // erreur de compression → renvoie l'original, jamais bloqué
  }
}

/** Convertit les photos non supportées par le serveur ; laisse les autres intactes. */
export async function normalizeImages(files: FileList | File[]): Promise<File[]> {
  const list = Array.from(files);
  return Promise.all(
    list.map(async (f) => {
      // 1. Conversion HEIC → JPEG si nécessaire (iPhone)
      let out = f;
      if (isHeic(f)) {
        try {
          out = await withTimeout(toJpeg(f), "conversion de la photo");
        } catch {
          out = f; // le serveur décode à son tour et nomme l'erreur s'il échoue
        }
      }
      // 2. Compression automatique si > 5 MB (économise data mobile)
      out = await compressIfLarge(out);
      return out;
    }),
  );
}
