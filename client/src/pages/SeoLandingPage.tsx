import { useLocation, Link } from "react-router-dom";
import { ChevronRight, ShoppingCart, Car, Wrench, Package, Store } from "lucide-react";
import { trpc } from "../lib/trpc";
import MetaSEO, { generateBreadcrumbSchema } from "../components/MetaSEO";

/**
 * Page d'atterrissage générique pour les pages programmatiques SEO (seo_pages).
 * Rend le contenu réel vu par un visiteur venu de Google (le SSR a déjà injecté
 * les meta/JSON-LD pour les robots ; ici on affiche le contenu à l'humain).
 */
export default function SeoLandingPage() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  const { data, isLoading } = trpc.seo.getPageMeta.useQuery({ slug }, { enabled: !!slug });

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

  const quickLinks = [
    { to: "/acheter", label: "Acheter un véhicule", icon: ShoppingCart },
    { to: "/louer", label: "Louer un véhicule", icon: Car },
    { to: "/garages", label: "Garages & services", icon: Wrench },
    { to: "/pieces", label: "Pièces automobiles", icon: Package },
    { to: "/vendre", label: "Vendre / déposer une annonce", icon: Store },
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

      {/* Maillage interne */}
      <div className="border-t pt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Continuer sur MKA.P-MS</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition"
            >
              <l.icon className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-800">{l.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
