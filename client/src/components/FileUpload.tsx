import { useRef, useState } from "react";
import { getToken } from "../lib/auth";

interface UploadedFile {
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
}

interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onUploaded: (files: UploadedFile[]) => void;
  existingFiles?: { url: string; name?: string }[];
}

export default function FileUpload({
  label = "Ajouter des fichiers",
  accept = "image/*,.pdf,.doc,.docx",
  multiple = true,
  maxFiles = 20,
  onUploaded,
  existingFiles = [],
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    const count = Math.min(fileList.length, maxFiles);
    for (let i = 0; i < count; i++) {
      formData.append("files", fileList[i]);
    }

    try {
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
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'upload");
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
    <div>
      {/* Zone de dépôt */}
      <div
        className="relative cursor-pointer rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#FAFAFA] p-6 text-center transition hover:border-[#D4AF37] hover:bg-[#FFFDF5]"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/10">
            <svg className="h-5 w-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#374151]">{label}</p>
          <p className="text-xs text-[#9CA3AF]">
            {uploading ? "Upload en cours…" : "Photos, PDF, documents — max 10 MB par fichier"}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Fichiers uploadés */}
      {allFiles.length > 0 && (
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
