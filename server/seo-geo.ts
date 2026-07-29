/**
 * Cartographie géographique FR pour le repli des pages ville/région SEO.
 *
 * Objectif : quand une page ville (ex. « Paris ») n'a aucun véhicule publié,
 * on élargit automatiquement à la RÉGION (ex. Île-de-France) puis au national,
 * afin de ne jamais afficher une page vide. Les villes voisines d'une même
 * région servent aussi au maillage interne.
 */

export const REGION_NAMES: Record<string, string> = {
  "ile-de-france": "Île-de-France",
  "auvergne-rhone-alpes": "Auvergne-Rhône-Alpes",
  "provence-alpes-cote-d-azur": "Provence-Alpes-Côte d'Azur",
  occitanie: "Occitanie",
  "nouvelle-aquitaine": "Nouvelle-Aquitaine",
  "hauts-de-france": "Hauts-de-France",
  "grand-est": "Grand Est",
  "pays-de-la-loire": "Pays de la Loire",
  bretagne: "Bretagne",
  normandie: "Normandie",
  "bourgogne-franche-comte": "Bourgogne-Franche-Comté",
  "centre-val-de-loire": "Centre-Val de Loire",
  corse: "Corse",
};

/** Villes principales par région (repli + villes voisines). */
export const REGION_CITIES: Record<string, string[]> = {
  "ile-de-france": [
    "Paris", "Argenteuil", "Cergy", "Créteil", "Versailles", "Bezons", "Herblay",
    "Nanterre", "Boulogne-Billancourt", "Saint-Denis", "Montreuil", "Colombes",
    "Asnières-sur-Seine", "Courbevoie", "Aulnay-sous-Bois", "Rueil-Malmaison",
    "Champigny-sur-Marne", "Vitry-sur-Seine", "Neuilly-sur-Seine", "Levallois-Perret",
    "Sartrouville", "Poissy", "Franconville", "Ermont",
  ],
  "auvergne-rhone-alpes": [
    "Lyon", "Grenoble", "Saint-Étienne", "Clermont-Ferrand", "Villeurbanne",
    "Annecy", "Chambéry", "Valence", "Bourg-en-Bresse", "Vénissieux",
  ],
  "provence-alpes-cote-d-azur": [
    "Marseille", "Nice", "Toulon", "Aix-en-Provence", "Avignon", "Cannes",
    "Antibes", "La Seyne-sur-Mer", "Hyères", "Fréjus",
  ],
  occitanie: [
    "Toulouse", "Montpellier", "Nîmes", "Perpignan", "Béziers", "Narbonne",
    "Montauban", "Albi", "Carcassonne", "Sète",
  ],
  "nouvelle-aquitaine": [
    "Bordeaux", "Limoges", "Pau", "La Rochelle", "Poitiers", "Angoulême",
    "Mérignac", "Pessac", "Bayonne", "Niort",
  ],
  "hauts-de-france": [
    "Lille", "Amiens", "Roubaix", "Tourcoing", "Dunkerque", "Calais",
    "Villeneuve-d'Ascq", "Saint-Quentin", "Beauvais", "Arras",
  ],
  "grand-est": [
    "Strasbourg", "Reims", "Metz", "Nancy", "Mulhouse", "Colmar", "Troyes",
    "Charleville-Mézières", "Épinal", "Thionville",
  ],
  "pays-de-la-loire": [
    "Nantes", "Angers", "Le Mans", "Saint-Nazaire", "La Roche-sur-Yon",
    "Cholet", "Saint-Herblain", "Laval",
  ],
  bretagne: [
    "Rennes", "Brest", "Quimper", "Lorient", "Vannes", "Saint-Malo",
    "Saint-Brieuc", "Fougères", "Lanester",
  ],
  normandie: [
    "Le Havre", "Rouen", "Caen", "Cherbourg-en-Cotentin", "Évreux", "Dieppe",
    "Alençon", "Saint-Étienne-du-Rouvray",
  ],
  "bourgogne-franche-comte": [
    "Dijon", "Besançon", "Belfort", "Chalon-sur-Saône", "Nevers", "Auxerre",
    "Mâcon", "Montbéliard", "Sens",
  ],
  "centre-val-de-loire": [
    "Tours", "Orléans", "Bourges", "Blois", "Châteauroux", "Chartres",
    "Joué-lès-Tours", "Fleury-les-Aubrais",
  ],
  corse: ["Ajaccio", "Bastia", "Porto-Vecchio", "Borgo", "Biguglia"],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const CITY_TO_REGION = new Map<string, string>();
for (const [region, cities] of Object.entries(REGION_CITIES)) {
  for (const c of cities) CITY_TO_REGION.set(normalize(c), region);
}

/** Slug de région d'une ville connue (sinon null). */
export function regionOfCity(city: string): string | null {
  return CITY_TO_REGION.get(normalize(city)) ?? null;
}

/** Villes voisines d'une ville (même région, ville exclue). */
export function nearbyCities(city: string, max = 8): string[] {
  const region = regionOfCity(city);
  if (!region) return [];
  const n = normalize(city);
  return REGION_CITIES[region].filter((c) => normalize(c) !== n).slice(0, max);
}
