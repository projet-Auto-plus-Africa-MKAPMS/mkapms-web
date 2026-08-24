import { useLocation, Link } from "react-router-dom";
import { ChevronRight, ShoppingCart, Car, Wrench, Package, Store } from "lucide-react";
import { trpc } from "../lib/trpc";
import MetaSEO, { generateBreadcrumbSchema } from "../components/MetaSEO";
import { SmartLink, useReportNavigation } from "../lib/redirect";

/** Slug d'une ville pour l'URL /ville/:slug (même règle que le générateur SEO). */
function villeSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Page d'atterrissage générique pour les pages programmatiques SEO (seo_pages).
 * Rend le contenu réel vu par un visiteur venu de Google (le SSR a déjà injecté
 * les meta/JSON-LD pour les robots ; ici on affiche le contenu à l'humain).
 */
export default function SeoLandingPage() {
  const location = useLocation();
  const signaler = useReportNavigation();
  const slug = location.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  const { data, isLoading } = trpc.seo.getPageMeta.useQuery({ slug }, { enabled: !!slug });

  // Page géographique (ville / région) → afficher des véhicules avec repli
  // automatique (ville → région → national) pour ne jamais montrer une page vide.
  const isRegion = slug.startsWith("region/") || data?.pageType === "geo_region";
  const regionSlug = isRegion ? slug.split("/").pop() : undefined;
  // Ville : soit renseignée dans la page, soit dernier segment d'une URL /ville/x ou /pays/x/ville.
  const cityFromSlug = slug.startsWith("ville/") || slug.startsWith("pays/")
    ? decodeURIComponent(slug.split("/").pop() || "").replace(/-/g, " ")
    : undefined;
  const city = (data?.city || cityFromSlug) ?? undefined;
  const isGeo = isRegion || !!city;
  const { data: geo } = trpc.seo.annoncesNearLocation.useQuery(
    { city: isRegion ? undefined : city, regionSlug, limit: 12 },
    { enabled: isGeo },
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2" />
        <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  // Fallback si la page n'existe pas encore : on reste utile (liens vers les univers)
  const title = data?.h1 || data?.title || "MKA.P-MS — Automobile";
  const description = data?.metaDescription || "Achat, vente, location et services automobiles sur MKA.P-MS.";
  const content = data?.content || "";

  const crumbs = [
    { name: "Accueil", url: "/" },
    { name: title, url: location.pathname },
  ];

  // Maillage interne passé par le Moteur de Redirection : le PDG peut changer
  // la destination d'un univers sans toucher à cette page. `to` reste le repli
  // si aucune règle n'est active.
  const quickLinks = [
    { key: "geo_vehicules_locaux", to: "/acheter", label: "Acheter un véhicule", icon: ShoppingCart },
    { key: "univers_louer", to: "/louer", label: "Louer un véhicule", icon: Car },
    { key: "geo_garages_locaux", to: "/garages", label: "Garages & services", icon: Wrench },
    { key: "geo_pieces_locales", to: "/pieces", label: "Pièces automobiles", icon: Package },
    { key: "univers_vendre", to: "/vendre", label: "Vendre / déposer une annonce", icon: Store },
    { key: "geo_recherche_locale", to: "/pres-de-moi", label: "Chercher près de moi", icon: Car },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <MetaSEO
        title={data?.title?.replace(/\s*—\s*MKA\.P-MS.*$/, "") || title}
        description={description}
        url={typeof window !== "undefined" ? window.location.href : undefined}
        schema={generateBreadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: c.url })))}
      />

      {/* Fil d'ariane */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6" aria-label="Fil d'ariane">
        <Link to="/" className="hover:text-blue-600">Accueil</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium truncate">{title}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>

      {content ? (
        <p className="text-lg text-gray-700 leading-relaxed mb-8">{content}</p>
      ) : (
        <p className="text-lg text-gray-700 leading-relaxed mb-8">
          Cette page rassemble les offres et professionnels MKA.P-MS correspondants.
          Explorez nos univers pour trouver ce que vous cherchez.
        </p>
      )}

      {Array.isArray(data?.keywords) && (data!.keywords as string[]).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {(data!.keywords as string[]).slice(0, 8).map((k) => (
            <span key={k} className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">{k}</span>
          ))}
        </div>
      )}

      {/* Véhicules (page ville / région) — avec repli automatique */}
      {isGeo && geo && geo.items.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {geo.scope === "ville" && `Véhicules à ${geo.locationLabel}`}
            {geo.scope === "region" && `Véhicules en ${geo.locationLabel}`}
            {geo.scope === "national" && "Véhicules disponibles"}
          </h2>
          {geo.scope !== "ville" && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              {geo.scope === "region"
                ? `Aucune annonce exactement à ${city} pour le moment — voici les véhicules ${geo.locationLabel ? `en ${geo.locationLabel}` : "de la région"} et des villes voisines.`
                : "Élargi à toute la France pour vous proposer des véhicules."}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {geo.items.map((v) => (
              <Link
                key={v.id}
                to={`/vehicule/${v.slug || v.id}`}
                onClick={() => signaler("geo_fiche_vehicule", `/vehicule/${v.slug || v.id}`)}
                className="rounded-xl border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow transition bg-white"
              >
                <div className="aspect-[4/3] bg-gray-100">
                  {v.photoPrincipale ? (
                    <img src={v.photoPrincipale} alt={`${v.marque} ${v.modele}`} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Car className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{v.marque} {v.modele}</p>
                  <p className="text-xs text-gray-500 truncate">{[v.annee, v.ville].filter(Boolean).join(" · ")}</p>
                  {v.prix && <p className="text-sm font-bold text-blue-700 mt-0.5">{Number(v.prix).toLocaleString("fr-FR")} €</p>}
                </div>
              </Link>
            ))}
          </div>
          {Array.isArray(geo.nearby) && geo.nearby.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Villes à proximité</p>
              <div className="flex flex-wrap gap-2">
                {geo.nearby.map((c) => (
                  <Link
                    key={c}
                    to={`/ville/${villeSlug(c)}`}
                    onClick={() => signaler("geo_ville_voisine", `/ville/${villeSlug(c)}`)}
                    className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 text-sm hover:bg-gray-100"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Maillage interne */}
      <div className="border-t pt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Continuer sur MKA.P-MS</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickLinks.map((l) => (
            <SmartLink
              key={l.key}
              redirKey={l.key}
              fallback={l.to}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition"
            >
              <l.icon className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-800">{l.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </SmartLink>
          ))}
        </div>
      </div>
    </div>
  );
}
