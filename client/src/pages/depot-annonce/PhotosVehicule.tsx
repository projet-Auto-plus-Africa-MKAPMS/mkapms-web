import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Camera, Check, AlertCircle, Upload, Star } from "lucide-react";
import { getToken } from "../../lib/auth";
import { normalizeImages } from "../../lib/imageUpload";
import { addToPhotoDraft } from "../../lib/photoDraft";

type PhotoSlot = { id: string; label: string; category: string; categorieDepot: string; required: boolean };

const PHOTO_SLOTS: PhotoSlot[] = [
  // Extérieur
  { id: "ext1", label: "Avant gauche (3/4)", category: "Extérieur", categorieDepot: "exterieur", required: true },
  { id: "ext2", label: "Avant droit (3/4)", category: "Extérieur", categorieDepot: "exterieur", required: true },
  { id: "ext3", label: "Arrière gauche (3/4)", category: "Extérieur", categorieDepot: "exterieur", required: true },
  { id: "ext4", label: "Arrière droit (3/4)", category: "Extérieur", categorieDepot: "exterieur", required: true },
  { id: "ext5", label: "Face avant", category: "Extérieur", categorieDepot: "exterieur", required: true },
  { id: "ext6", label: "Face arrière", category: "Extérieur", categorieDepot: "exterieur", required: true },
  // Intérieur
  { id: "int1", label: "Tableau de bord", category: "Intérieur", categorieDepot: "tableau_de_bord", required: true },
  { id: "int2", label: "Écran multimédia", category: "Intérieur", categorieDepot: "interieur", required: false },
  { id: "int3", label: "Volant", category: "Intérieur", categorieDepot: "interieur", required: false },
  { id: "int4", label: "Sièges avant", category: "Intérieur", categorieDepot: "sieges", required: true },
  { id: "int5", label: "Sièges arrière", category: "Intérieur", categorieDepot: "sieges", required: false },
  // Technique
  { id: "tech1", label: "Compartiment moteur", category: "Technique", categorieDepot: "moteur", required: false },
  { id: "tech2", label: "Coffre", category: "Technique", categorieDepot: "coffre", required: true },
  { id: "tech3", label: "Pneus", category: "Technique", categorieDepot: "roues", required: false },
  { id: "tech4", label: "Jantes", category: "Technique", categorieDepot: "roues", required: false },
  // Documents
  { id: "doc1", label: "Carnet entretien", category: "Documents", categorieDepot: "documents", required: false },
  { id: "doc2", label: "Factures", category: "Documents", categorieDepot: "documents", required: false },
  { id: "doc3", label: "Contrôle technique", category: "Documents", categorieDepot: "documents", required: false },
];

export default function PhotosVehicule() {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  // Les champs de fichier restent montés : un input détaché du document perd
  // son événement « change » sur iOS Safari, la photo choisie n'arrivait alors
  // jamais jusqu'à l'envoi.
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const upload = async (slot: PhotoSlot, files: FileList) => {
    setUploading(p => ({ ...p, [slot.id]: true }));
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
        setError(data.error || "Erreur lors de l'envoi de la photo");
        return;
      }
      const urls = ((data.files || []) as { url: string }[]).map(f => f.url);
      if (!urls.length) {
        setError("La photo n'a pas pu être traitée");
        return;
      }
      setPhotos(p => ({ ...p, [slot.id]: urls[0] }));
      addToPhotoDraft(slot.categorieDepot, urls);
      const rejected = (data.errors || []) as { originalName: string; error: string }[];
      if (rejected.length) setError(rejected.map(r => `${r.originalName} : ${r.error}`).join(" ; "));
    } catch (e) {
      setError((e as Error).message || "Erreur réseau lors de l'envoi");
    } finally {
      setUploading(p => ({ ...p, [slot.id]: false }));
    }
  };

  const added = Object.keys(photos).length;
  const total = PHOTO_SLOTS.length;
  const score = Math.round((added / total) * 100);
  const categories = [...new Set(PHOTO_SLOTS.map(s => s.category))];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce/informations-principales" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Informations</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Camera size={20} className="text-[#D4AF37]" /> Photos véhicule</h1>
        <p className="text-xs text-white/50 mt-1">Guidage photo · Les photos envoyées ici sont reprises dans votre dépôt</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-[#111]">Score qualité annonce</p>
          <div className="flex items-center gap-1"><Star size={12} className="text-[#D4AF37]" /><span className="text-sm font-black" style={{ color: score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444" }}>{score}/100</span></div>
        </div>
        <div className="w-full bg-[#E5E7EB] rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444" }} /></div>
        <p className="text-[9px] text-[#6B7280] mt-1">{added}/{total} photos · {score >= 80 ? "Excellent !" : score >= 50 ? "Ajoutez plus de photos" : "Photos insuffisantes"}</p>
      </div>

      {error && (
        <div className="px-4 mb-3">
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat} className="px-4 mb-4">
          <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">{cat}</h2>
          <div className="grid grid-cols-2 gap-2">
            {PHOTO_SLOTS.filter(s => s.category === cat).map(s => {
              const url = photos[s.id];
              const busy = uploading[s.id];
              return (
                <div key={s.id}>
                  <input
                    ref={el => { inputs.current[s.id] = el; }}
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={e => {
                      const files = e.target.files;
                      e.target.value = "";
                      if (files?.length) void upload(s, files);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => { if (!busy) inputs.current[s.id]?.click(); }}
                    className={`relative w-full overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${url ? "border-green-400 bg-green-50" : s.required ? "border-[#D4AF37]/40 bg-white" : "border-[#E5E7EB] bg-white"}`}
                  >
                    {url && <img src={url} alt={s.label} className="absolute inset-0 h-full w-full object-cover opacity-25" />}
                    <span className="relative block">
                      <span className="mb-1 flex items-center justify-between">
                        {url ? <Check size={14} className="text-green-500" /> : <Upload size={14} className={s.required ? "text-[#D4AF37]" : "text-[#D4D4D4]"} />}
                        {s.required && !url && <span className="text-[7px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] px-1.5 py-0.5 rounded">REQUIS</span>}
                      </span>
                      <span className="block text-[10px] font-semibold text-[#111]">{s.label}</span>
                      <span className="block text-[8px] text-[#6B7280]">{busy ? "Envoi…" : url ? "✓ Envoyée" : "Appuyez pour ajouter"}</span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="px-4"><Link to="/depot-annonce/videos-annonce" className="block w-full py-3 bg-[#D4AF37] text-white rounded-xl text-sm font-bold text-center">Continuer → Vidéos</Link></div>
    </div>
  );
}
