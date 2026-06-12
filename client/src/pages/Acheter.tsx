import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { trpc } from "../lib/trpc";
import VehicleCard from "../components/VehicleCard";

const VENDEURS = [
  { value: "", label: "Tous" },
  { value: "particulier", label: "Particulier" },
  { value: "professionnel", label: "Professionnel" },
  { value: "concession", label: "MKA.P-MS Garage" },
];
const TYPES = [
  { value: "", label: "Tous" },
  { value: "berline", label: "Voiture" },
  { value: "utilitaire", label: "Utilitaire" },
  { value: "moto", label: "Moto" },
  { value: "scooter", label: "Scooter" },
];

export default function Acheter() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [vendeurType, setVendeur] = useState(params.get("vendeurType") || "");
  const [categorie, setCategorie] = useState(params.get("categorie") || "");
  const ville = params.get("ville") || undefined;
  const prixMax = params.get("prixMax") ? Number(params.get("prixMax")) : undefined;

  const input = useMemo(
    () => ({
      type: "vente" as const,
      q: q || undefined,
      vendeurType: (vendeurType || undefined) as any,
      categorie: (categorie || undefined) as any,
      ville,
      prixMax,
      limit: 48,
    }),
    [q, vendeurType, categorie, ville, prixMax],
  );

  const list = trpc.annonces.list.useQuery(input);

  function reset() {
    setQ("");
    setVendeur("");
    setCategorie("");
    setParams({});
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Acheter un véhicule</h1>
      <p className="mt-1 text-sm text-slate-500">
        {list.data ? `${list.data.total} véhicule(s) trouvé(s)` : "Recherche…"}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
        {/* Filtres */}
        <aside className="card h-fit p-4">
          <h2 className="mb-3 font-bold text-slate-800">Filtres</h2>
          <label className="label">Recherche</label>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Marque, modèle…" />

          <label className="label mt-4">Catégorie de vendeur</label>
          <select className="input" value={vendeurType} onChange={(e) => setVendeur(e.target.value)}>
            {VENDEURS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>

          <label className="label mt-4">Type de véhicule</label>
          <select className="input" value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            {TYPES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>

          <button className="btn-outline mt-5 w-full" onClick={reset}>
            Réinitialiser
          </button>
        </aside>

        {/* Résultats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {list.isLoading
            ? Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="card aspect-[4/5] animate-pulse bg-slate-100" />
              ))
            : list.data?.items.map((v) => <VehicleCard key={v.id} v={v as any} />)}
          {list.data && list.data.items.length === 0 && (
            <p className="col-span-full py-12 text-center text-slate-500">
              Aucun véhicule ne correspond à votre recherche.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
