import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BellPlus } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
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
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const saveSearch = trpc.searches.create.useMutation({ onSuccess: () => setSaved(true) });

  function enregistrerRecherche() {
    const filters = {
      q: q || undefined,
      vendeurType: vendeurType || undefined,
      categorie: categorie || undefined,
      ville,
      prixMax,
    };
    const label =
      [q, categorie, vendeurType].filter(Boolean).join(" · ") || "Toutes les annonces";
    saveSearch.mutate({ label, univers: "vente", filters, alertEnabled: true });
  }

  function reset() {
    setSaved(false);
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

          {/* Recherche sauvegardée + alerte (Partie 6) */}
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
              <BellPlus size={14} /> Alerte nouvelle annonce
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Soyez prévenu dès qu'un véhicule correspond à cette recherche.
            </p>
            {user ? (
              saved ? (
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  Recherche enregistrée — vous serez alerté.
                </p>
              ) : (
                <button
                  className="btn-primary mt-2 w-full text-sm"
                  onClick={enregistrerRecherche}
                  disabled={saveSearch.isPending}
                >
                  {saveSearch.isPending ? "Enregistrement…" : "Enregistrer la recherche"}
                </button>
              )
            ) : (
              <Link to="/connexion" className="btn-outline mt-2 block w-full text-center text-sm">
                Connectez-vous pour activer l'alerte
              </Link>
            )}
          </div>
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
