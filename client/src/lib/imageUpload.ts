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

function isHeic(file: File): boolean {
  return HEIC_RE.test(file.name) || /image\/hei[cf]/i.test(file.type);
}

async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    return await createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("décodage impossible"));
      img.src = url;
    });
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

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
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
        return await toJpeg(f);
      } catch {
        return f; // le serveur renverra un message explicite
      }
    }),
  );
}
