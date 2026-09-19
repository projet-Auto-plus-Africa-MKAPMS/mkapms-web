import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Camera, Check, AlertCircle } from "lucide-react";
import { getToken } from "../../lib/auth";
import { normalizeImages } from "../../lib/imageUpload";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   PHOTOS & MÉDIAS (/vente/photos/:id)
   Données réelles : trpc.annonces.get (photos existantes) + trpc.annonces.
   update (server/routers/annonces.ts, déjà utilisé par l'édition d'annonce
   Vendre.tsx) pour l'écriture, /api/upload (déjà utilisé par le dépôt
   d'annonce PhotosVehicule.tsx) pour l'envoi du fichier — jamais un second
   mécanisme d'upload ni un second registre de photos.
   ══════════════════════════════════════════════════════════════════════════ */

type Zone = { slug: string; label: string };
const ZONES: Zone[] = [
  { slug: "avant_gauche", label: "Avant gauche" },
  { slug: "avant_droite", label: "Avant droite" },
  { slug: "arriere_gauche", label: "Arrière gauche" },
  { slug: "arriere_droite", label: "Arrière droite" },
  { slug: "interieur", label: "Intérieur" },
  { slug: "tableau_de_bord", label: "Tableau de bord" },
  { slug: "coffre", label: "Coffre" },
  { slug: "moteur", label: "Moteur" },
];

export default function CentrePhotosMedias() {
  const { id } = useParams();
  const annonceId = Number(id);
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: annonce, isLoading } = trpc.annonces.get.useQuery({ id: annonceId }, { enabled: Number.isFinite(annonceId) });
  const update = trpc.annonces.update.useMutation({
    onSuccess: () => utils.annonces.get.invalidate({ id: annonceId }),
  });

  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!annonce) return;
    const parZone: Record<string, string> = {};
    for (const p of annonce.photos ?? []) {
      if (p.categorie && ZONES.some((z) => z.slug === p.categorie)) parZone[p.categorie] = p.url;
    }
    setPhotos(parZone);
  }, [annonce]);

  const upload = async (zone: Zone, files: FileList) => {
    setUploading((u) => ({ ...u, [zone.slug]: true }));
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
      const urls = ((data.files || []) as { url: string }[]).map((f) => f.url);
      if (!urls.length) {
        setError("La photo n'a pas pu être traitée");
        return;
      }
      const nouvellesPhotos = { ...photos, [zone.slug]: urls[0] };
      setPhotos(nouvellesPhotos);
      // Conserve les photos existantes hors zones (ex. photos ajoutées ailleurs)
      // : annonces.update remplace tout le jeu de photos, jamais une simple ajout.
      const autresPhotos = (annonce?.photos ?? []).filter((p) => !p.categorie || !ZONES.some((z) => z.slug === p.categorie));
      await update.mutateAsync({
        id: annonceId,
        photos: [
          ...autresPhotos.map((p) => ({ url: p.url, categorie: p.categorie ?? undefined })),
          ...Object.entries(nouvellesPhotos).map(([categorie, url]) => ({ url, categorie })),
        ],
      });
    } catch (e) {
      setError((e as Error).message || "Erreur réseau lors de l'envoi");
    } finally {
      setUploading((u) => ({ ...u, [zone.slug]: false }));
    }
  };

  if (!Number.isFinite(annonceId) || (!isLoading && !annonce)) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] p-4">
        <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">Véhicule introuvable — revenez depuis le stock.</p>
      </div>
    );
  }

  const complet = ZONES.every((z) => photos[z.slug]);
  const nbPhotos = ZONES.filter((z) => photos[z.slug]).length;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/vente/stock" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Stock</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Camera size={20} /> Photos & Médias</h1>
        <p className="mt-1 text-sm text-white/80">{nbPhotos}/{ZONES.length} photos obligatoires{annonce ? ` — ${annonce.titre || `${annonce.marque ?? ""} ${annonce.modele ?? ""}`.trim()}` : ""}</p>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
          <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {ZONES.map((z) => {
          const url = photos[z.slug];
          const busy = uploading[z.slug];
          return (
            <div key={z.slug}>
              <input
                ref={(el) => { inputs.current[z.slug] = el; }}
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files ? Array.from(e.target.files) : [];
                  e.target.value = "";
                  if (selected.length) void upload(z, selected as unknown as FileList);
                }}
              />
              <button
                type="button"
                onClick={() => { if (!busy) inputs.current[z.slug]?.click(); }}
                className={`relative w-full overflow-hidden rounded-xl border-2 border-dashed py-8 flex flex-col items-center gap-2 ${url ? "border-green-300 bg-green-50" : "border-blue-300 bg-blue-50"}`}
              >
                {url && <img src={url} alt={z.label} className="absolute inset-0 h-full w-full object-cover opacity-25" />}
                {url ? <Check size={20} className="text-green-600 relative" /> : <Camera size={20} className="text-blue-600 relative" />}
                <span className="text-xs font-semibold text-[#111] relative">{z.label}</span>
                <span className="text-[9px] text-[#9CA3AF] relative">{busy ? "Envoi…" : url ? "Uploadée" : "Obligatoire"}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="px-4 mt-4">
        <button
          onClick={() => complet && navigate("/vente/stock")}
          disabled={!complet}
          className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {complet ? "Valider les photos" : `Encore ${ZONES.length - nbPhotos} photo(s) requise(s)`}
        </button>
      </div>
    </div>
  );
}
