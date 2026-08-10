import { useParams, Link } from "react-router-dom";
import { Wrench, MapPin, Phone, Mail, Globe, Clock, Star, ChevronRight, Calendar, FileText } from "lucide-react";
import { trpc } from "../../lib/trpc";
import MetaSEO, { generateBreadcrumbSchema } from "../../components/MetaSEO";
import BlocAvis from "../../components/avis/BlocAvis";

/**
 * Fiche publique d'un garage/professionnel (/garages/:slug) — Phase 19.
 * Rend l'intégralité des informations vues par un visiteur venu de Google
 * (le SSR a déjà injecté les meta + JSON-LD AutoRepair pour les robots).
 */
export default function GaragePublicFiche() {
  const { slug = "" } = useParams();
  const { data: g, isLoading, error } = trpc.garages.getBySlug.useQuery(
    { slug },
    { enabled: !!slug, retry: false },
  );

  const reputation = trpc.reputationEngine.reputation.useQuery(
    { targetType: "garage", targetId: g?.id ?? 0, univers: "garage" },
    { enabled: !!g?.id },
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2" />
        <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !g) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Garage introuvable</h1>
        <p className="text-gray-600 mb-6">Cette fiche n'existe pas ou n'est plus disponible.</p>
        <Link to="/garages" className="inline-flex items-center gap-2 rounded-lg bg-[#111] px-4 py-2 text-sm font-bold text-white">
          <Wrench size={14} /> Voir tous les garages
        </Link>
      </div>
    );
  }

  // La note affichée doit venir des avis réellement publiés : la colonne
  // `rating` de la fiche pouvait afficher une note sans avis correspondant.
  const rating = reputation.data?.averageRating ?? 0;
  const reviewCount = reputation.data?.totalReviews ?? 0;
  const specialites = (g.specialites || g.services || "")
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const crumbs = [
    { name: "Accueil", url: "/" },
    { name: "Garages", url: "/garages" },
    { name: g.name, url: `/garages/${g.slug || g.id}` },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <MetaSEO
        title={`${g.name}${g.city ? ` à ${g.city}` : ""} — garage automobile`}
        description={
          g.description?.slice(0, 200) ||
          `${g.name}${g.city ? ` à ${g.city}` : ""} : garage automobile vérifié sur MKA.P-MS. Avis, horaires et prise de rendez-vous en ligne.`
        }
        url={typeof window !== "undefined" ? window.location.href : undefined}
        image={g.coverUrl || g.logoUrl || undefined}
        schema={generateBreadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: c.url })))}
      />

      {/* Bandeau */}
      <div className="relative bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-8">
        {g.coverUrl && (
          <img src={g.coverUrl} alt={g.name} className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="relative flex items-center gap-4">
          {g.logoUrl ? (
            <img src={g.logoUrl} alt={g.name} className="h-16 w-16 rounded-xl bg-white object-contain p-1" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#D4AF37]">
              <Wrench size={26} className="text-[#111]" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-white truncate">{g.name}</h1>
            {g.city && (
              <p className="mt-1 flex items-center gap-1 text-sm text-white/70">
                <MapPin size={12} /> {[g.addressLine, g.postalCode, g.city].filter(Boolean).join(", ")}
              </p>
            )}
            {rating > 0 && reviewCount > 0 && (
              <a href="#avis" className="mt-1 flex items-center gap-1 text-sm text-[#D4AF37]">
                <Star size={12} className="fill-[#D4AF37]" /> {rating.toFixed(1)} · {reviewCount} avis
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-4">
        {/* Fil d'ariane */}
        <nav className="mb-4 flex items-center gap-1 text-xs text-gray-500" aria-label="Fil d'ariane">
          <Link to="/" className="hover:text-blue-600">Accueil</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/garages" className="hover:text-blue-600">Garages</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate font-medium text-gray-800">{g.name}</span>
        </nav>

        {g.description && (
          <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-sm leading-relaxed text-gray-700">{g.description}</p>
          </div>
        )}

        {specialites.length > 0 && (
          <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <p className="mb-2 text-sm font-bold text-[#111]">Spécialités</p>
            <div className="flex flex-wrap gap-2">
              {specialites.map((s) => (
                <span key={s} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Coordonnées */}
        <div className="mb-4 grid gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-4 text-sm text-gray-700">
          {g.phone && (
            <a href={`tel:${g.phone}`} className="flex items-center gap-2 hover:text-blue-600">
              <Phone size={14} className="text-[#D4AF37]" /> {g.phone}
            </a>
          )}
          {g.email && (
            <a href={`mailto:${g.email}`} className="flex items-center gap-2 hover:text-blue-600">
              <Mail size={14} className="text-[#D4AF37]" /> {g.email}
            </a>
          )}
          {g.website && (
            <a href={g.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600">
              <Globe size={14} className="text-[#D4AF37]" /> {g.website}
            </a>
          )}
          {g.hours && (
            <p className="flex items-center gap-2">
              <Clock size={14} className="text-[#D4AF37]" /> {g.hours}
            </p>
          )}
        </div>

        {/* Avis & réputation (point 47) */}
        <div className="mb-4">
          <BlocAvis
            targetType="garage"
            targetId={g.id}
            univers="garage"
            nomCible={g.name}
            titre="Avis clients de ce garage"
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/garage/rendez-vous"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#111] py-3 text-sm font-bold text-white"
          >
            <Calendar size={15} /> Prendre rendez-vous
          </Link>
          <Link
            to="/garage/devis"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-[#111]"
          >
            <FileText size={15} /> Demander un devis
          </Link>
        </div>
      </div>
    </div>
  );
}
