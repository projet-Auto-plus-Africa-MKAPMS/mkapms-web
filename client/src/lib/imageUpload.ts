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

/** Convertit les photos non supportées par le serveur ; laisse les autres intactes. */
export async function normalizeImages(files: FileList | File[]): Promise<File[]> {
  const list = Array.from(files);
  return Promise.all(
    list.map(async (f) => {
      if (!isHeic(f)) return f;
      try {
        return await withTimeout(toJpeg(f), "conversion de la photo");
      } catch {
        return f; // le serveur décode à son tour et nomme l'erreur s'il échoue
      }
    }),
  );
}
