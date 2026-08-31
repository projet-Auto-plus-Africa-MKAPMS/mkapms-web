import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BellPlus, Star, MapPin } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import VehicleCard from "../components/VehicleCard";

const VENDEURS = [
  { value: "", label: "Tous" },
  { value: "officielle", label: "Officiel MKA.P-MS" },
  { value: "professionnelle", label: "Professionnel" },
  { value: "particulier", label: "Particulier" },
];
const TYPES = [
  { value: "", label: "Tous" },
  { value: "berline", label: "Voiture" },
  { value: "utilitaire", label: "Utilitaire" },
  { value: "moto", label: "Moto" },
  { value: "scooter", label: "Scooter" },
];

const ZONES = [
  { value: "", label: "Toute la France" },
  { value: "75", label: "75 — Paris" },
  { value: "13", label: "13 — Bouches-du-Rhône" },
  { value: "69", label: "69 — Rhône (Lyon)" },
  { value: "31", label: "31 — Haute-Garonne (Toulouse)" },
  { value: "33", label: "33 — Gironde (Bordeaux)" },
  { value: "06", label: "06 — Alpes-Maritimes (Nice)" },
  { value: "59", label: "59 — Nord (Lille)" },
  { value: "67", label: "67 — Bas-Rhin (Strasbourg)" },
  { value: "44", label: "44 — Loire-Atlantique (Nantes)" },
  { value: "34", label: "34 — Hérault (Montpellier)" },
];

const LIBELLE_CRITERE: Record<string, string> = {
  marque: "Marque",
  modele: "Modèle",
  prixMin: "Prix min",
  anneeMin: "Année min",
  anneeMax: "Année max",
  kmMax: "Km max",
  puissanceMin: "Puissance min",
  portes: "Portes",
  places: "Places",
  carburant: "Carburant",
  boite: "Boîte",
  etat: "État",
  couleur: "Couleur",
  codePostal: "Code postal",
  puissanceMax: "Puissance max",
  kmMin: "Km min",
  cylindreeMin: "Cylindrée min",
  cylindreeMax: "Cylindrée max",
  carburants: "Carburants",
  equipements: "Équipements",
  avecPhotos: "Avec photos",
  avecVideo: "Avec vidéo",
  publieDepuisHeures: "Publiées depuis (h)",
};

export default function Acheter() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [vendeurType, setVendeur] = useState(params.get("categorieAnnonce") || params.get("vendeurType") || "");
  const [categorie, setCategorie] = useState(params.get("categorie") || "");
  const [zone, setZone] = useState(params.get("zone") || "");
  const ville = params.get("ville") || undefined;
  const prixMax = params.get("prixMax") ? Number(params.get("prixMax")) : undefined;
  const { country } = useCurrency();
  // Filtrage par pays : ?pays= explicite prioritaire, sinon pays actif du visiteur.
  const pays = params.get("pays") || country || undefined;

  /**
   * Critères venus de la recherche d'accueil (dictée ou filtres). Ils sont
   * transmis tels quels au serveur : un critère demandé puis ignoré rendrait
   * une liste qui ne correspond pas à ce que l'acheteur a demandé.
   */
  const texteURL = params.toString();
  const criteresURL = useMemo(() => {
    const p = new URLSearchParams(texteURL);
    const nombre = (cle: string) => (p.get(cle) ? Number(p.get(cle)) : undefined);
    const texte = (cle: string) => p.get(cle) || undefined;
    const liste = (cle: string) =>
      p.get(cle) ? p.get(cle)!.split(",").filter(Boolean) : undefined;
    const drapeau = (cle: string) => (p.get(cle) ? true : undefined);
    return {
      marque: texte("marque"),
      modele: texte("modele"),
      prixMin: nombre("prixMin"),
      anneeMin: nombre("anneeMin") ?? nombre("annee"),
      anneeMax: nombre("anneeMax"),
      kmMax: nombre("kmMax"),
      puissanceMin: nombre("puissanceMin"),
      portes: nombre("portes"),
      places: nombre("places"),
      carburant: texte("carburant"),
      boite: texte("boite"),
      etat: texte("etat"),
      couleur: texte("couleur"),
      codePostal: texte("codePostal"),
      puissanceMax: nombre("puissanceMax"),
      kmMin: nombre("kmMin"),
      cylindreeMin: nombre("cylindreeMin"),
      cylindreeMax: nombre("cylindreeMax"),
      carburants: liste("carburants"),
      equipements: liste("equipements"),
      avecPhotos: drapeau("avecPhotos"),
      avecVideo: drapeau("avecVideo"),
      publieDepuisHeures: nombre("publieDepuisHeures"),
    };
  }, [texteURL]);
  const typeURL = params.get("type") === "location" ? ("location" as const) : ("vente" as const);

  // Critères actifs affichés à l'acheteur : arriver ici depuis « Peugeot » sans
  // voir que la liste est filtrée sur Peugeot fait croire à un stock vide.
  const criteresActifs = useMemo(
    () =>
      Object.entries(criteresURL)
        .filter(([, v]) => v !== undefined && v !== "" && (!Array.isArray(v) || v.length > 0))
        .map(([cle, v]) => ({
          cle,
          libelle: `${LIBELLE_CRITERE[cle] ?? cle} : ${
            v === true ? "oui" : Array.isArray(v) ? v.join(", ") : v
          }`,
        })),
    [criteresURL],
  );

  function retirerCritere(cle: string) {
    const next: Record<string, string> = {};
    params.forEach((valeur, c) => {
      if (valeur && c !== cle) next[c] = valeur;
    });
    setParams(next);
  }

  const input = useMemo(
    () => ({
      type: typeURL,
      q: q || undefined,
      categorieAnnonce: (vendeurType || undefined) as any,
      categorie: (categorie || undefined) as any,
      ville: ville || (zone ? zone : undefined),
      pays,
      prixMax,
      ...criteresURL,
      limit: 48,
    }),
    [q, vendeurType, categorie, ville, prixMax, zone, pays, criteresURL, typeURL],
  );

  const list = trpc.annonces.list.useQuery(input);
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const saveSearch = trpc.searches.create.useMutation({ onSuccess: () => setSaved(true) });

  function enregistrerRecherche() {
    const filters = {
      q: q || undefined,
      categorieAnnonce: vendeurType || undefined,
      categorie: categorie || undefined,
      ville,
      prixMax,
    };
    const label =
      [q, categorie, vendeurType].filter(Boolean).join(" · ") || "Toutes les annonces";
    saveSearch.mutate({ label, univers: "vente", filters, alertEnabled: true });
  }

  // La liste réagit déjà à la saisie ; le bouton inscrit les critères dans
  // l'adresse pour que la recherche soit partageable et retrouvée au retour.
  function lancerRecherche() {
    // Les critères déjà présents dans l'adresse sont conservés : lancer une
    // recherche depuis cet écran ne doit pas effacer ce que l'accueil a compris.
    const next: Record<string, string> = {};
    params.forEach((valeur, cle) => {
      if (valeur) next[cle] = valeur;
    });
    if (q) next.q = q;
    else delete next.q;
    if (vendeurType) next.categorieAnnonce = vendeurType;
    if (categorie) next.categorie = categorie;
    if (zone) next.zone = zone;
    if (ville) next.ville = ville;
    if (prixMax) next.prixMax = String(prixMax);
    setParams(next);
  }

  function reset() {
    setSaved(false);
    setQ("");
    setVendeur("");
    setCategorie("");
    setZone("");
    setParams({});
  }

  // Séparer annonces par niveau : MKA.P-MS Officiel > Premium > Pro > Particulier
  const allItems = list.data?.items || [];
  const mkapmsItems = allItems.filter((v: any) => v.categorieAnnonce === "officielle");
  const premiumItems = allItems.filter((v: any) => v.boosted && v.categorieAnnonce !== "officielle");
  const proItems = allItems.filter((v: any) => v.categorieAnnonce === "professionnelle" && !v.boosted);
  const particulierItems = allItems.filter((v: any) => v.categorieAnnonce === "particulier" && !v.boosted);

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Acheter un véhicule</h1>
      <p className="mt-1 text-sm text-slate-500">
        {list.data ? `${list.data.total} véhicule(s) trouvé(s)` : "Recherche…"}
      </p>

      {criteresActifs.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {criteresActifs.map((c) => (
            <button
              key={c.cle}
              type="button"
              onClick={() => retirerCritere(c.cle)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-red-400 hover:text-red-600"
              title="Retirer ce critère"
            >
              {c.libelle} ✕
            </button>
          ))}
        </div>
      )}

      {/* ── RECHERCHE + FILTRES EN PREMIER ── */}
      <div className="mt-6 card p-4">
        <h2 className="font-bold text-[#111] mb-3">Rechercher un véhicule</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="label">Recherche</label>
            <input className="input text-sm" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lancerRecherche()} placeholder="Marque, modèle…" />
          </div>
          <div>
            <label className="label">Type d'annonce</label>
            <select className="input text-sm" value={vendeurType} onChange={(e) => setVendeur(e.target.value)}>
              {VENDEURS.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type de véhicule</label>
            <select className="input text-sm" value={categorie} onChange={(e) => setCategorie(e.target.value)}>
              {TYPES.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label flex items-center gap-1">
              <MapPin size={14} className="text-[#D4AF37]" /> Zone
            </label>
            <select className="input text-sm" value={zone} onChange={(e) => setZone(e.target.value)}>
              {ZONES.map((z) => (
                <option key={z.value} value={z.value}>{z.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button className="btn-primary text-sm" onClick={lancerRecherche}>Rechercher</button>
          <button className="btn-outline text-sm" onClick={reset}>Réinitialiser</button>
          {/* Alerte */}
          {user ? (
            saved ? (
              <span className="text-xs font-semibold text-emerald-700">Alerte activée</span>
            ) : (
              <button className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1" onClick={enregistrerRecherche} disabled={saveSearch.isPending}>
                <BellPlus size={12} /> {saveSearch.isPending ? "..." : "Créer une alerte"}
              </button>
            )
          ) : (
            <Link to="/connexion" className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1">
              <BellPlus size={12} /> Alerte annonce
            </Link>
          )}
        </div>
      </div>

      {/* ── 1. Nos véhicules MKA.P-MS (toujours en premier) ── */}
      {mkapmsItems.length > 0 && (
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#111]">
            <Star size={18} className="text-[#D4AF37]" fill="#D4AF37" /> Nos véhicules MKA.P-MS
          </h2>
          <p className="text-xs text-[#6B7280]">Sélection officielle MKA.P-MS — qualité garantie</p>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {mkapmsItems.map((v: any) => (
              <div key={v.id} className="w-[220px] shrink-0 snap-start">
                <VehicleCard v={v as any} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. Véhicules Premium (abonnés premium) ── */}
      {premiumItems.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#111]">
            <Star size={16} className="text-[#D4AF37]" /> Annonces Premium
          </h2>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {premiumItems.map((v: any) => (
              <div key={v.id} className="w-[220px] shrink-0 snap-start">
                <VehicleCard v={v as any} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Véhicules Professionnels ── */}
      {proItems.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-[#111]">Annonces Professionnels</h2>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {proItems.map((v: any) => (
              <div key={v.id} className="w-[220px] shrink-0 snap-start">
                <VehicleCard v={v as any} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Annonces Particuliers — en dernier ── */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#111] mb-3">Annonces Particuliers</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {list.isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card aspect-[4/5] animate-pulse bg-slate-100" />
              ))
            : (particulierItems.length > 0 ? particulierItems : allItems).map((v: any) => (
                <VehicleCard key={v.id} v={v as any} />
              ))}
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
