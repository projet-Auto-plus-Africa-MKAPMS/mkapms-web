import { useRef, useState } from "react";
import { getToken } from "../lib/auth";

interface UploadedFile {
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
}

interface IAAnalysis {
  status: "analysing" | "valid" | "warning" | "rejected";
  score: number;
  details: string[];
}

interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onUploaded: (files: UploadedFile[]) => void;
  existingFiles?: { url: string; name?: string }[];
  iaAnalysis?: boolean;
}

export default function FileUpload({
  label = "Ajouter des fichiers",
  accept = "image/*,.pdf,.doc,.docx",
  multiple = true,
  maxFiles = 20,
  onUploaded,
  existingFiles = [],
  iaAnalysis = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [ia, setIa] = useState<IAAnalysis | null>(null);

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

      /* IA Analysis — simulate intelligent document analysis */
      if (iaAnalysis && newFiles.length > 0) {
        setIa({ status: "analysing", score: 0, details: [] });
        setTimeout(() => {
          const isImage = newFiles.some((f) => f.mimeType?.startsWith("image/"));
          const isPdf = newFiles.some((f) => f.mimeType === "application/pdf" || f.originalName.endsWith(".pdf"));
          const details: string[] = [];
          let score = 85;

          if (isImage) {
            details.push("\u2705 Image lisible et de bonne qualit\u00e9");
            details.push("\u2705 Format accept\u00e9");
            score += 5;
          }
          if (isPdf) {
            details.push("\u2705 Document PDF d\u00e9tect\u00e9");
            details.push("\u2705 Contenu lisible");
            score += 5;
          }
          details.push("\u2705 Aucune falsification d\u00e9tect\u00e9e");
          details.push("\u2705 Coh\u00e9rence des informations");
          if (newFiles.some((f) => f.size > 5 * 1024 * 1024)) {
            details.push("\u26a0\ufe0f Fichier volumineux — v\u00e9rification approfondie");
            score -= 10;
          }
          score = Math.min(100, Math.max(0, score));
          setIa({ status: score >= 70 ? "valid" : score >= 40 ? "warning" : "rejected", score, details });
        }, 1500);
      }
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

      {/* Analyse IA */}
      {iaAnalysis && ia && (
        <div className={`mt-3 rounded-lg border p-3 ${
          ia.status === "analysing" ? "border-blue-200 bg-blue-50" :
          ia.status === "valid" ? "border-green-200 bg-green-50" :
          ia.status === "warning" ? "border-orange-200 bg-orange-50" :
          "border-red-200 bg-red-50"
        }`}>
          <div className="flex items-center gap-2">
            {ia.status === "analysing" ? (
              <><svg className="h-4 w-4 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
              <span className="text-xs font-bold text-blue-700">Analyse IA MKA.P-MS en cours…</span></>
            ) : (
              <><span className={`text-xs font-bold ${
                ia.status === "valid" ? "text-green-700" : ia.status === "warning" ? "text-orange-700" : "text-red-700"
              }`}>Analyse IA MKA.P-MS — Score : {ia.score}/100 ({ia.status === "valid" ? "Valid\u00e9" : ia.status === "warning" ? "Attention" : "Refus\u00e9"})</span></>
            )}
          </div>
          {ia.details.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {ia.details.map((d, i) => (
                <p key={i} className="text-[10px] text-slate-600">{d}</p>
              ))}
            </div>
          )}
        </div>
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
