/**
 * MKA.P-MS — Métadonnées SEO curées pour les pages publiques principales.
 *
 * Chaque page importante a un titre + description riches en mots-clés (FR),
 * injectés côté serveur pour les robots (Google, Bing, assistants IA).
 * Les pages non listées ici retombent sur les meta par défaut du domaine
 * ou sur une entrée `seo_pages` en base (pages programmatiques).
 */

export interface StaticSeo {
  title: string;
  description: string;
  keywords?: string;
}

/** Clé = chemin exact (sans query). */
export const STATIC_SEO: Record<string, StaticSeo> = {
  "/acheter": {
    title: "Acheter une voiture d'occasion ou neuve",
    description:
      "Achetez une voiture d'occasion ou neuve en toute confiance : particuliers, professionnels et véhicules officiels MKA.P-MS. Milliers d'annonces vérifiées, filtres par marque, prix, ville.",
    keywords:
      "acheter voiture, voiture occasion, voiture neuve, annonces auto, achat véhicule",
  },
  "/acheter/particulier": {
    title: "Acheter une voiture entre particuliers",
    description:
      "Achat de voitures d'occasion entre particuliers : annonces vérifiées, contact direct vendeur, paiement sécurisé. Trouvez votre véhicule au meilleur prix sur MKA.P-MS.",
    keywords: "achat voiture particulier, voiture occasion particulier, annonce auto particulier",
  },
  "/acheter/professionnel": {
    title: "Acheter une voiture chez un professionnel",
    description:
      "Voitures d'occasion et neuves proposées par des professionnels et concessionnaires vérifiés. Garantie, reprise et financement possibles sur MKA.P-MS.",
    keywords: "voiture professionnel, concessionnaire, garage vendeur, voiture garantie",
  },
  "/acheter/mkapms-officiel": {
    title: "Véhicules officiels MKA.P-MS",
    description:
      "Sélection de véhicules officiels MKA.P-MS : contrôlés, garantis et livrés. Achetez un véhicule certifié par la plateforme en toute sérénité.",
    keywords: "véhicule officiel, voiture certifiée, voiture garantie mkapms",
  },
  "/acheter/utilitaires": {
    title: "Acheter un utilitaire d'occasion ou neuf",
    description:
      "Fourgons, camionnettes et utilitaires d'occasion ou neufs pour professionnels et particuliers. Comparez et achetez votre utilitaire sur MKA.P-MS.",
    keywords: "acheter utilitaire, fourgon occasion, camionnette, utilitaire pro",
  },
  "/acheter/moto": {
    title: "Acheter une moto ou un scooter",
    description:
      "Motos et scooters d'occasion et neufs : toutes cylindrées, toutes marques. Trouvez votre deux-roues au meilleur prix sur MKA.P-MS.",
    keywords: "acheter moto, scooter occasion, deux-roues, moto neuve",
  },
  "/acheter/estimation": {
    title: "Estimer la valeur de votre véhicule gratuitement",
    description:
      "Estimation gratuite et instantanée de la valeur de votre voiture. Cote fiable basée sur le marché pour vendre ou reprendre votre véhicule au juste prix.",
    keywords: "estimation voiture, cote auto, valeur véhicule, estimer sa voiture gratuitement",
  },
  "/acheter/minibus": {
    title: "Acheter un minibus d'occasion ou neuf",
    description:
      "Minibus d'occasion et neufs pour groupes, familles, associations et transport collectif. Toutes capacités, toutes marques. Comparez et achetez votre minibus sur MKA.P-MS.",
    keywords: "acheter minibus, minibus occasion, minibus transport collectif, minibus 9 places, minibus familial",
  },
  "/acheter/camions-engins": {
    title: "Acheter un camion ou engin de chantier",
    description:
      "Camions poids lourds, bennes, plateaux, pelleteuses, grues, nacelles et chariots élévateurs d'occasion ou neufs. Trouvez votre engin de chantier sur MKA.P-MS.",
    keywords: "acheter camion, engin chantier, pelleteuse occasion, grue occasion, chariot élévateur, poids lourd",
  },
  "/acheter/encheres": {
    title: "Enchères automobiles en ligne",
    description:
      "Enchères automobiles MKA.P-MS : véhicules d'occasion aux enchères, professionnels et particuliers. Achetez et vendez aux meilleures conditions.",
    keywords: "enchères automobiles, vente aux enchères voiture, enchère auto en ligne",
  },
  "/louer": {
    title: "Louer une voiture : courte et longue durée",
    description:
      "Location de voitures courte et longue durée : citadines, SUV, utilitaires, véhicules de luxe et professionnels. Réservez en ligne sur MKA.P-MS.",
    keywords: "louer voiture, location auto, location longue durée, LLD, location utilitaire",
  },
  "/vendre": {
    title: "Vendre sa voiture : dépôt d'annonce gratuit",
    description:
      "Vendez votre voiture rapidement : déposez une annonce gratuite, estimez votre véhicule et touchez des milliers d'acheteurs sur MKA.P-MS.",
    keywords: "vendre sa voiture, déposer une annonce, vente voiture occasion, annonce gratuite",
  },
  "/garages": {
    title: "Garages automobiles près de chez vous",
    description:
      "Trouvez un garage automobile de confiance : réparation, entretien, révision, carrosserie. Avis clients, horaires, prestations et devis sur MKA.P-MS.",
    keywords: "garage automobile, réparation auto, entretien voiture, garage près de chez moi",
  },
  "/pieces": {
    title: "Pièces automobiles neuves et d'occasion",
    description:
      "Achetez vos pièces automobiles : freinage, filtration, moteur, embrayage, turbo, alternateur… Pièces neuves et d'occasion pour toutes marques sur MKA.P-MS.",
    keywords: "pièces auto, pièces détachées voiture, pièces automobiles occasion, pièces neuves",
  },
  "/depannage": {
    title: "Dépannage et remorquage automobile 24h/24",
    description:
      "Service de dépannage et remorquage automobile rapide, partout et à toute heure. Assistance panne, batterie, crevaison sur MKA.P-MS.",
    keywords: "dépannage auto, remorquage voiture, assistance panne, dépanneur",
  },
  "/livraison": {
    title: "Livraison et transport de véhicules",
    description:
      "Livraison et transport de véhicules partout : porte-à-porte, sécurisé et assuré. Faites transporter votre voiture en toute confiance avec MKA.P-MS.",
    keywords: "livraison véhicule, transport voiture, transport auto, convoyage",
  },
  "/finance": {
    title: "Financement automobile : crédit et leasing",
    description:
      "Financez votre véhicule : crédit auto, leasing (LOA/LLD) et solutions adaptées. Simulez votre financement en ligne sur MKA.P-MS.",
    keywords: "financement auto, crédit voiture, leasing, LOA, LLD, financer sa voiture",
  },
  "/carte-grise": {
    title: "Carte grise en ligne : démarches simplifiées",
    description:
      "Réalisez votre carte grise en ligne facilement : changement de titulaire, immatriculation, certificat. Démarches administratives auto simplifiées sur MKA.P-MS.",
    keywords: "carte grise, certificat immatriculation, démarche carte grise en ligne",
  },
  "/assurance": {
    title: "Assurance automobile : devis en ligne",
    description:
      "Comparez et souscrivez votre assurance automobile en ligne. Devis rapide, garanties adaptées et meilleurs tarifs sur MKA.P-MS.",
    keywords: "assurance auto, assurance voiture, devis assurance, comparateur assurance",
  },
  "/abonnements": {
    title: "Abonnements et offres MKA.P-MS",
    description:
      "Découvrez les abonnements MKA.P-MS pour particuliers et professionnels : visibilité, outils de gestion, avantages exclusifs.",
    keywords: "abonnement mkapms, offre professionnel auto, abonnement garage",
  },
};

/** Fil d'Ariane simple → BreadcrumbList Schema.org. */
export function breadcrumbSchema(baseUrl: string, path: string, title: string) {
  const parts = path.split("/").filter(Boolean);
  const items = [{ name: "Accueil", url: baseUrl + "/" }];
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    acc += "/" + parts[i];
    const isLast = i === parts.length - 1;
    items.push({ name: isLast ? title : decodeURIComponent(parts[i]).replace(/-/g, " "), url: baseUrl + acc });
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** JSON-LD Organization + WebSite (avec SearchAction) pour l'accueil. */
export function homeSchema(baseUrl: string, siteName: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      url: baseUrl + "/",
      logo: baseUrl + "/icon-192.png",
      sameAs: [] as string[],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: baseUrl + "/",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/acheter?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}
