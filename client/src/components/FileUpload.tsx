import { useRef, useState } from "react";
import { getToken } from "../lib/auth";
import { normalizeImages } from "../lib/imageUpload";

interface UploadedFile {
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
}

/**
 * Constat de réception : ce que le serveur a réellement reçu et enregistré.
 * Aucune analyse antifraude n'est effectuée ici — la vérification des pièces
 * est faite par l'équipe lors de la validation du dossier.
 */
interface ReceptionReport {
  acceptes: { nom: string; taille: number; type: string }[];
  refuses: { nom: string; motif: string }[];
}

interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onUploaded: (files: UploadedFile[]) => void;
  existingFiles?: { url: string; name?: string }[];
  /** Affiche le constat de réception des pièces (nom, format, taille enregistrés). */
  iaAnalysis?: boolean;
  /** Emplacement réduit (grille de vignettes) : zone à la taille du parent, sans liste de fichiers. */
  compact?: boolean;
}

export default function FileUpload({
  label = "Ajouter des fichiers",
  accept = "image/*,.pdf,.doc,.docx",
  multiple = true,
  maxFiles = 20,
  onUploaded,
  existingFiles = [],
  iaAnalysis = false,
  compact = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [reception, setReception] = useState<ReceptionReport | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setError(null);
    setUploading(true);

    try {
      const prepared = await normalizeImages(
        Array.from(fileList).slice(0, maxFiles),
      );
      const formData = new FormData();
      for (const f of prepared) formData.append("files", f);

      const token = getToken();
      const resp = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Erreur upload");
      }
      const data = await resp.json();
      const newFiles = data.files as UploadedFile[];
      setUploaded((prev) => [...prev, ...newFiles]);
      onUploaded(newFiles);

      // Envoi partiel : on garde les fichiers valides et on nomme les refusés.
      const rejected = (data.errors ?? []) as { originalName: string; error: string }[];
      if (rejected.length) {
        setError(rejected.map((r) => `${r.originalName} : ${r.error}`).join(" ; "));
      }

      if (iaAnalysis) {
        setReception({
          acceptes: newFiles.map((f) => ({
            nom: f.originalName,
            taille: f.size,
            type: f.mimeType,
          })),
          refuses: rejected.map((r) => ({ nom: r.originalName, motif: r.error })),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const allFiles = [
    ...existingFiles.map((f) => ({ url: f.url, originalName: f.name || "Fichier", size: 0, mimeType: "" })),
    ...uploaded,
  ];

  return (
    <div className={compact ? "h-full" : undefined}>
      {/* Zone de dépôt */}
      <div
        className={`relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#FAFAFA] text-center transition hover:border-[#D4AF37] hover:bg-[#FFFDF5] ${compact ? "h-full w-full p-1" : "p-6"}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2">
          <div className={`flex items-center justify-center rounded-full bg-[#D4AF37]/10 ${compact ? "h-6 w-6" : "h-10 w-10"}`}>
            <svg className={compact ? "h-3 w-3 text-[#D4AF37]" : "h-5 w-5 text-[#D4AF37]"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          {compact ? (
            uploading && <p className="text-[8px] font-semibold text-[#D4AF37]">Upload…</p>
          ) : (
            <>
              <p className="text-sm font-medium text-[#374151]">{label}</p>
              <p className="text-xs text-[#9CA3AF]">
                {uploading ? "Upload en cours…" : "Photos, PDF, documents — max 10 MB par fichier"}
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Constat de réception — faits enregistrés, aucun jugement automatique */}
      {iaAnalysis && reception && (
        <div className="mt-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-3">
          <p className="text-xs font-bold text-[#374151]">
            Pièces enregistrées sur le serveur : {reception.acceptes.length}
          </p>
          <div className="mt-1 space-y-0.5">
            {reception.acceptes.map((f, i) => (
              <p key={`ok-${i}`} className="text-[10px] text-slate-600">
                {f.nom} — {f.type || "format inconnu"}
                {f.taille > 0 ? ` — ${(f.taille / 1024).toFixed(0)} KB` : ""}
              </p>
            ))}
            {reception.refuses.map((f, i) => (
              <p key={`ko-${i}`} className="text-[10px] text-red-600">
                {f.nom} — non enregistré : {f.motif}
              </p>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            La conformité des pièces est vérifiée par l'équipe MKA.P-MS lors de la validation.
          </p>
        </div>
      )}

      {/* Fichiers uploadés */}
      {!compact && allFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {allFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2">
              {f.mimeType?.startsWith("image/") || f.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={f.url} alt="" className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-[#F3F4F6]">
                  <span className="text-xs font-bold text-[#6B7280]">PDF</span>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-[#111]">{f.originalName}</p>
                {f.size > 0 && <p className="text-xs text-[#9CA3AF]">{(f.size / 1024).toFixed(0)} KB</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
