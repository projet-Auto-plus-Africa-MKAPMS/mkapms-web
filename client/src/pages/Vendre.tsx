import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

export default function Vendre() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titre: "",
    marque: "",
    modele: "",
    version: "",
    annee: "",
    kilometrage: "",
    prix: "",
    carburant: "essence",
    boite: "manuelle",
    categorie: "berline",
    famille: "auto",
    ville: "",
    codePostal: "",
    contactTelephone: "",
    description: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const create = trpc.annonces.create.useMutation({
    onSuccess: (a) => navigate(`/vehicule/${a.id}`),
  });

  if (!user) {
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h1 className="text-xl font-extrabold text-slate-900">Connectez-vous pour publier une annonce</h1>
          <p className="mt-2 text-sm text-slate-500">
            C'est gratuit pour les particuliers, jusqu'à 4 photos.
          </p>
          <Link to="/connexion" className="btn-primary mt-6 w-full">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const maxPhotos = user.accountType === "professionnel" ? 10 : 4;

  function set<K extends keyof typeof form>(k: K, val: string) {
    setForm((f) => ({ ...f, [k]: val }));
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, maxPhotos - photos.length);
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setPhotos((p) => [...p, reader.result as string].slice(0, maxPhotos));
      reader.readAsDataURL(file);
    });
  }

  function submit() {
    create.mutate({
      titre: form.titre || `${form.marque} ${form.modele}`,
      marque: form.marque,
      modele: form.modele,
      version: form.version || undefined,
      annee: form.annee ? Number(form.annee) : undefined,
      kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
      prix: form.prix ? Number(form.prix) : 0,
      carburant: form.carburant,
      boite: form.boite,
      categorie: form.categorie as any,
      famille: form.famille as any,
      ville: form.ville || undefined,
      codePostal: form.codePostal || undefined,
      contactTelephone: form.contactTelephone || undefined,
      description: form.description || undefined,
      photos,
    });
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Déposer une annonce</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gratuit pour les particuliers · jusqu'à {maxPhotos} photos.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Famille</label>
              <select className="input" value={form.famille} onChange={(e) => set("famille", e.target.value)}>
                <option value="auto">Auto</option>
                <option value="moto">Moto / Scooter</option>
              </select>
            </div>
            <div>
              <label className="label">Catégorie</label>
              <select className="input" value={form.categorie} onChange={(e) => set("categorie", e.target.value)}>
                {["citadine", "berline", "break", "suv", "coupe", "cabriolet", "monospace", "utilitaire", "camion", "moto", "scooter", "quad", "luxe"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div><label className="label">Marque *</label><input className="input" value={form.marque} onChange={(e) => set("marque", e.target.value)} /></div>
            <div><label className="label">Modèle *</label><input className="input" value={form.modele} onChange={(e) => set("modele", e.target.value)} /></div>
            <div><label className="label">Version</label><input className="input" value={form.version} onChange={(e) => set("version", e.target.value)} /></div>
            <div><label className="label">Année</label><input className="input" type="number" value={form.annee} onChange={(e) => set("annee", e.target.value)} /></div>
            <div><label className="label">Kilométrage</label><input className="input" type="number" value={form.kilometrage} onChange={(e) => set("kilometrage", e.target.value)} /></div>
            <div><label className="label">Prix (€) *</label><input className="input" type="number" value={form.prix} onChange={(e) => set("prix", e.target.value)} /></div>
            <div>
              <label className="label">Énergie</label>
              <select className="input" value={form.carburant} onChange={(e) => set("carburant", e.target.value)}>
                {["essence", "diesel", "electrique", "hybride", "gpl"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Boîte</label>
              <select className="input" value={form.boite} onChange={(e) => set("boite", e.target.value)}>
                <option value="manuelle">Manuelle</option>
                <option value="automatique">Automatique</option>
              </select>
            </div>
            <div><label className="label">Ville</label><input className="input" value={form.ville} onChange={(e) => set("ville", e.target.value)} /></div>
            <div><label className="label">Code postal</label><input className="input" value={form.codePostal} onChange={(e) => set("codePostal", e.target.value)} /></div>
            <div className="md:col-span-2"><label className="label">Téléphone de contact</label><input className="input" value={form.contactTelephone} onChange={(e) => set("contactTelephone", e.target.value)} /></div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-28" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-bold text-slate-800">Photos ({photos.length}/{maxPhotos})</h3>
            <input type="file" accept="image/*" multiple className="mt-3 text-sm" onChange={(e) => onFiles(e.target.files)} />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <img src={p} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  <button
                    onClick={() => setPhotos((arr) => arr.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-xs text-white"
                  >×</button>
                </div>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" disabled={create.isPending} onClick={submit}>
            {create.isPending ? "Publication…" : "Publier l'annonce"}
          </button>
          {create.error && <p className="text-sm text-red-600">{create.error.message}</p>}
          <p className="text-xs text-slate-400">
            Des options de mise en avant (Boost) seront proposées après la publication.
          </p>
        </div>
      </div>
    </div>
  );
}
