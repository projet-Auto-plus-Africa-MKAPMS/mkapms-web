import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Upload, Check, Shield, AlertCircle } from "lucide-react";
import { getToken } from "../../lib/auth";
import { normalizeImages } from "../../lib/imageUpload";
import { addToPhotoDraft } from "../../lib/photoDraft";

type DocSlot = { id: string; label: string; required: boolean };

const DOCS: DocSlot[] = [
  { id: "carte_grise", label: "Carte grise", required: true },
  { id: "controle_technique", label: "Contrôle technique", required: true },
  { id: "assurance", label: "Assurance", required: false },
  { id: "permis", label: "Permis de conduire", required: false },
  { id: "kbis", label: "KBIS (Pro)", required: false },
  { id: "siret", label: "SIRET (Pro)", required: false },
];

/**
 * Avant ce correctif, cet écran ne faisait qu'inverser un booléen local au
 * clic (aucun <input type="file">, aucun envoi réel) : la ligne passait au
 * vert "AJOUTÉ" sans qu'aucun document n'ait jamais été choisi ni envoyé
 * (retour Direction, 26/10). Corrigé en reprenant exactement le mécanisme
 * déjà réel et fonctionnel de PhotosVehicule.tsx (même portail) : un vrai
 * input fichier par document, un vrai envoi vers /api/upload, puis
 * `addToPhotoDraft("documents", …)` — le même brouillon et la même
 * catégorie "documents" que les photos de documents du véhicule (carnet,
 * factures…), déjà repris par Vendre.tsx à la publication. Rien de nouveau
 * inventé : les documents envoyés ici arrivent réellement avec l'annonce.
 */
export default function DocumentsAnnonce() {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const upload = async (doc: DocSlot, files: FileList | File[]) => {
    setUploading((p) => ({ ...p, [doc.id]: true }));
    setError(null);
    try {
      const prepared = await normalizeImages(files);
      const fd = new FormData();
      for (const f of prepared) fd.append("files", f);
      const token = getToken();
      const resp = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(data.error || "Erreur lors de l'envoi du document");
        return;
      }
      const uploadedUrls = ((data.files || []) as { url: string }[]).map((f) => f.url);
      if (!uploadedUrls.length) {
        setError("Le document n'a pas pu être traité");
        return;
      }
      setUrls((p) => ({ ...p, [doc.id]: uploadedUrls[0] }));
      addToPhotoDraft("documents", uploadedUrls);
      const rejected = (data.errors || []) as { originalName: string; error: string }[];
      if (rejected.length) setError(rejected.map((r) => `${r.originalName} : ${r.error}`).join(" ; "));
    } catch (e) {
      setError((e as Error).message || "Erreur réseau lors de l'envoi");
    } finally {
      setUploading((p) => ({ ...p, [doc.id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce/description-annonce" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Description</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Documents</h1>
        <p className="text-xs text-white/50 mt-1">Seuls les documents nécessaires sont demandés</p>
      </div>

      {error && (
        <div className="px-4 mt-4">
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="px-4 mt-4 space-y-2">
        {DOCS.map((d) => {
          const url = urls[d.id];
          const busy = uploading[d.id];
          return (
            <div key={d.id}>
              <input
                ref={(el) => { inputs.current[d.id] = el; }}
                type="file"
                accept="image/*,.heic,.heif,.pdf"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files ? Array.from(e.target.files) : [];
                  e.target.value = "";
                  if (selected.length) void upload(d, selected);
                }}
              />
              <button
                type="button"
                onClick={() => { if (!busy) inputs.current[d.id]?.click(); }}
                disabled={busy}
                className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left ${url ? "border-green-400 bg-green-50" : "border-[#E5E7EB] bg-white"}`}
              >
                {url ? <Check size={16} className="text-green-500" /> : <Upload size={16} className="text-[#D4D4D4]" />}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#111]">{d.label}</p>
                  {busy && <p className="text-[10px] text-[#9CA3AF]">Envoi…</p>}
                </div>
                {d.required && !url && <span className="text-[8px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">OBLIGATOIRE</span>}
                {url && <span className="text-[8px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">AJOUTÉ</span>}
              </button>
            </div>
          );
        })}
        <div className="rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3 flex items-center gap-2"><Shield size={14} className="text-[#D4AF37]" /><p className="text-[10px] text-[#374151]">Vos documents sont vérifiés par AL-HUDHUD·M puis validés par un humain. Jamais de validation Intelligence seule.</p></div>
        <Link to="/depot-annonce/options-annonce" className="block w-full py-3 bg-[#D4AF37] text-white rounded-xl text-sm font-bold text-center mt-2">Continuer → Options</Link>
      </div>
    </div>
  );
}
