import { useEffect } from "react";

/* ══════════════════════════════════════════════════════════════════════════
   MetaSEO — Composant SEO automatique pour chaque page
   - title, meta description, canonical URL
   - Open Graph (Facebook, LinkedIn)
   - Twitter Card
   - schema.org (Vehicle, Product, Offer, LocalBusiness, BreadcrumbList)
   ══════════════════════════════════════════════════════════════════════════ */

interface MetaSEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: "website" | "product" | "article";
  schema?: object;
}

export default function MetaSEO({ title, description, url, image, type = "website", schema }: MetaSEOProps) {
  useEffect(() => {
    const fullTitle = `${title} — MKA.P-MS`;
    document.title = fullTitle;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    };

    // Standard meta
    setMeta("description", description);

    // Canonical
    if (url) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
      link.href = url;
    }

    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:type", type, true);
    setMeta("og:site_name", "MKA.P-MS", true);
    if (url) setMeta("og:url", url, true);
    if (image) setMeta("og:image", image, true);

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    if (image) setMeta("twitter:image", image);

    // Schema.org JSON-LD
    if (schema) {
      let script = document.querySelector('#schema-ld') as HTMLScriptElement | null;
      if (!script) { script = document.createElement("script"); script.id = "schema-ld"; script.type = "application/ld+json"; document.head.appendChild(script); }
      script.textContent = JSON.stringify(schema);
    }

    return () => { document.title = "MKA.P-MS"; };
  }, [title, description, url, image, type, schema]);

  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   Helpers pour générer les schema.org automatiquement
   ══════════════════════════════════════════════════════════════════════════ */

export function generateVehicleSchema(vehicle: {
  name: string; brand: string; model: string; year: number;
  mileage: number; fuel: string; price: number; city: string;
  image?: string; url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: vehicle.name,
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    modelDate: String(vehicle.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: vehicle.mileage, unitCode: "KMT" },
    fuelType: vehicle.fuel,
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: vehicle.url,
    },
    image: vehicle.image,
    areaServed: vehicle.city,
  };
}

export function generateGarageSchema(garage: {
  name: string; address: string; city: string; phone?: string;
  rating?: number; url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: garage.name,
    address: { "@type": "PostalAddress", addressLocality: garage.city, streetAddress: garage.address },
    telephone: garage.phone,
    aggregateRating: garage.rating ? { "@type": "AggregateRating", ratingValue: garage.rating, bestRating: 5 } : undefined,
    url: garage.url,
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateSEOUrl(vehicle: { brand: string; model: string; year: number; fuel: string; city: string; id: number | string }) {
  const slug = [vehicle.brand, vehicle.model, vehicle.year, vehicle.fuel, vehicle.city, vehicle.id]
    .map(s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .join("-");
  return `/vente/${slug}`;
}

export function generateSEOTitle(vehicle: { brand: string; model: string; year: number; fuel: string; city: string }) {
  return `${vehicle.brand} ${vehicle.model} ${vehicle.year} ${vehicle.fuel} à vendre à ${vehicle.city}`;
}

export function generateSEODescription(vehicle: { brand: string; model: string; year: number; fuel: string; city: string; km: number; price: number }) {
  return `Découvrez cette ${vehicle.brand} ${vehicle.model} ${vehicle.year} ${vehicle.fuel} disponible à ${vehicle.city} sur MKA.P-MS. ${vehicle.km.toLocaleString("fr-FR")} km, ${vehicle.price.toLocaleString("fr-FR")} €. Photos, historique et contact vendeur.`;
}
