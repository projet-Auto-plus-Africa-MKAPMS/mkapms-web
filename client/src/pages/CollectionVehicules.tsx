import { useParams, useLocation, Link } from "react-router-dom";
import { ChevronRight, Fuel, Tag, Search } from "lucide-react";
import { trpc } from "../lib/trpc";
import VehicleCard from "../components/VehicleCard";
import MetaSEO, { generateBreadcrumbSchema } from "../components/MetaSEO";

/**
 * Page de collection réelle par carburant (/carburant/:valeur) ou par marque
 * (/marque/:valeur) — demande PDG : une recherche générique ("véhicule
 * électrique") doit trouver une vraie page, pas seulement une fiche isolée.
 * Même discipline que le reste de la plateforme : liste les annonces
 * publiées réellement présentes (trpc.annonces.list, déjà utilisé par
 * Acheter.tsx), jamais une page fabriquée. Le SEO (title/canonical/JSON-LD)
 * côté serveur vient de server/seo.ts ; ce composant gère l'affichage humain
 * après hydratation, avec le même MetaSEO que SeoLandingPage.tsx.
 */
const CARBURANT_LABELS: Record<string, string> = {
  essence: "Essence",
  diesel: "Diesel",
  electrique: "Électrique",
  hybride: "Hybride",
  hybride_rechargeable: "Hybride rechargeable",
  gpl: "GPL",
  hydrogene: "Hydrogène",
  ethanol: "Éthanol",
  autre: "Autre",
};

export default function CollectionVehicules() {
  const { valeur: raw = "" } = useParams();
  const { pathname } = useLocation();
  const parType: "carburant" | "marque" = pathname.startsWith("/marque/") ? "marque" : "carburant";
  const valeur = decodeURIComponent(raw);
  const label = parType === "carburant" ? CARBURANT_LABELS[valeur] || valeur : valeur;

  const { data, isLoading } = trpc.annonces.list.useQuery(
    parType === "carburant" ? { carburant: valeur, limit: 60 } : { marque: valeur, limit: 60 },
    { enabled: !!valeur },
  );
  const items = data?.items ?? [];

  const title =
    parType === "carburant"
      ? `Véhicules ${label} d'occasion`
      : `Véhicules ${label} d'occasion`;
  const description =
    data && data.total > 0
      ? `${data.total} véhicule${data.total > 1 ? "s" : ""} ${parType === "carburant" ? label.toLowerCase() : label} publié${data.total > 1 ? "s" : ""} sur MKA.P-MS. Achat direct entre particuliers et professionnels, prix réels, annonces vérifiées.`
      : `Recherchez un véhicule ${parType === "carburant" ? label.toLowerCase() : label} sur MKA.P-MS : achat, vente et location entre particuliers et professionnels.`;

  const crumbs = [
    { name: "Accueil", url: "/" },
    { name: "Acheter", url: "/acheter" },
    { name: title, url: pathname },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <MetaSEO
        title={title}
        description={description}
        url={typeof window !== "undefined" ? window.location.href : undefined}
        schema={generateBreadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: c.url })))}
      />

      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6" aria-label="Fil d'ariane">
        <Link to="/" className="hover:text-blue-600">Accueil</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/acheter" className="hover:text-blue-600">Acheter</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium truncate">{title}</span>
      </nav>

      <div className="flex items-center gap-2 mb-2">
        {parType === "carburant" ? <Fuel className="w-5 h-5 text-blue-600" /> : <Tag className="w-5 h-5 text-blue-600" />}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
      </div>
      <p className="text-gray-600 mb-6 max-w-2xl">{description}</p>

      <Link
        to={`/acheter?${parType}=${encodeURIComponent(valeur)}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline mb-6"
      >
        <Search className="w-4 h-4" /> Affiner avec plus de filtres
      </Link>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
              <div className="p-2 space-y-1.5">
                <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-700 font-medium">Aucune annonce {parType === "carburant" ? label.toLowerCase() : label} disponible pour l'instant.</p>
          <Link to="/acheter" className="mt-3 inline-block text-blue-700 font-semibold hover:underline">
            Voir toutes les annonces →
          </Link>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((v: any) => (
            <VehicleCard key={v.id} v={v as any} />
          ))}
        </div>
      )}
    </div>
  );
}
