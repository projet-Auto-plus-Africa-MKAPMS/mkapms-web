import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAnnonceUrl } from "../lib/annonceUrl";
import { ChevronLeft, MapPin, Car, Heart, Star, Shield } from "lucide-react";
import MetaSEO, { generateBreadcrumbSchema } from "../components/MetaSEO";
import SearchLine from "../components/SearchLine";
import { useVehicleSearch } from "../lib/vehicleSearch";
import { trpc } from "../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   PAGES LOCALES AUTOMATIQUES
   /france/paris/peugeot-206
   /senegal/dakar/toyota-hilux
   /guinee/conakry/peugeot-206
   Pages indexables par Google pour le SEO local
   ══════════════════════════════════════════════════════════════════════════ */

const PAYS_DATA: Record<string, { villes: string[]; devise: string }> = {
  france: { villes: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Bordeaux", "Lille", "Rennes"], devise: "€" },
  senegal: { villes: ["Dakar", "Thiès", "Saint-Louis", "Kaolack", "Ziguinchor"], devise: "FCFA" },
  guinee: { villes: ["Conakry", "Kankan", "Kindia", "Labé", "Nzérékoré"], devise: "GNF" },
  belgique: { villes: ["Bruxelles", "Anvers", "Gand", "Liège", "Charleroi"], devise: "€" },
  mali: { villes: ["Bamako", "Sikasso", "Ségou", "Mopti", "Kayes"], devise: "FCFA" },
  canada: { villes: ["Montréal", "Toronto", "Vancouver", "Ottawa", "Québec"], devise: "CAD" },
  espagne: { villes: ["Madrid", "Barcelone", "Valence", "Séville", "Malaga"], devise: "€" },
};

const ANNEES = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - i));

export default function RechercheLocale() {
  const params = useParams<{ pays?: string; ville?: string; modele?: string }>();
  const pays = params.pays || "france";
  const ville = params.ville || "paris";
  const modele = params.modele || "";

  const paysNom = pays.charAt(0).toUpperCase() + pays.slice(1);
  const villeNom = ville.charAt(0).toUpperCase() + ville.slice(1);
  const modeleNom = modele.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const [showFilters, setShowFilters] = useState(false);
  const search = useVehicleSearch({}, { q: modeleNom });
  // Annonces réellement publiées dans cette ville : une page ville ne doit
  // jamais afficher le stock d'une autre ville ni un exemple fabriqué.
  // Le filtre porte sur la ville : le pays de l'adresse est un libellé
  // (« guinee ») alors que les annonces portent un code pays, filtrer dessus
  // masquerait du stock réel.
  const liste = trpc.annonces.list.useQuery({
    type: "vente" as const,
    ville: villeNom,
    q: search.applied.q.trim() || undefined,
    limit: 48,
  });
  const annoncesLocales = search.filter(
    (liste.data?.items ?? []).map((a: any) => ({
      id: a.id,
      nom: a.titre ?? [a.marque, a.modele].filter(Boolean).join(" "),
      annee: a.annee ?? null,
      km: a.kilometrage ?? null,
      prix: a.prix !== null && a.prix !== undefined ? Number(a.prix) : null,
      ville: a.ville ?? villeNom,
      photo: a.photoPrincipale ?? null,
      marque: a.marque ?? null,
      modele: a.modele ?? null,
      categorie: a.categorie ?? null,
      carburant: a.carburant ?? null,
      categorieAnnonce: a.categorieAnnonce ?? null,
      vendeurType: a.vendeurType ?? null,
    })),
  );

  const title = modeleNom
    ? `${modeleNom} à ${villeNom}, ${paysNom}`
    : `Véhicules à ${villeNom}, ${paysNom}`;
  const desc = modeleNom
    ? `${modeleNom} à vendre à ${villeNom} (${paysNom}) sur MKA.P-MS. Photos, prix, kilométrage, historique. Annonces vérifiées.`
    : `Véhicules d'occasion à ${villeNom} (${paysNom}) sur MKA.P-MS. Annonces vérifiées, prix, photos.`;

  const breadcrumbs = [
    { name: "MKA.P-MS", url: "https://mkapms.com" },
    { name: paysNom, url: `https://mkapms.com/${pays}` },
    { name: villeNom, url: `https://mkapms.com/${pays}/${ville}` },
  ];
  if (modeleNom) breadcrumbs.push({ name: modeleNom, url: `https://mkapms.com/${pays}/${ville}/${modele}` });

  const paysInfo = PAYS_DATA[pays];
  const autresVilles = paysInfo?.villes.filter(v => v.toLowerCase() !== villeNom.toLowerCase()) || [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <MetaSEO title={title} description={desc} url={`https://mkapms.com/${pays}/${ville}${modele ? "/" + modele : ""}`} schema={generateBreadcrumbSchema(breadcrumbs)} />
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/recherche" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Recherche</Link>
        <div className="flex items-center gap-1.5 mb-1">
          <MapPin size={14} className="text-[#D4AF37]" />
          <span className="text-[9px] text-white/40">{paysNom} / {villeNom}</span>
        </div>
        <h1 className="text-xl font-black text-white">{title}</h1>
        <p className="mt-1 text-xs text-white/50">Annonces vérifiées à {villeNom} et alentours</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <SearchLine
          value={search.draft.q}
          onChange={(v) => search.set("q", v)}
          onSearch={search.apply}
          placeholder="Marque, modèle…"
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          activeCount={search.activeCount}
        />
        {showFilters && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select value={search.draft.annee} onChange={(e) => search.set("annee", e.target.value)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes les années</option>
                {ANNEES.map((a) => <option key={a} value={a}>À partir de {a}</option>)}
              </select>
              <select value={search.draft.kmMax} onChange={(e) => search.set("kmMax", e.target.value)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Kilométrage : sans limite</option>
                <option value="50000">Jusqu'à 50 000 km</option>
                <option value="100000">Jusqu'à 100 000 km</option>
                <option value="150000">Jusqu'à 150 000 km</option>
                <option value="200000">Jusqu'à 200 000 km</option>
              </select>
              <input type="number" value={search.draft.prixMin} onChange={(e) => search.set("prixMin", e.target.value)} placeholder="Prix min" className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white" />
              <input type="number" value={search.draft.prixMax} onChange={(e) => search.set("prixMax", e.target.value)} placeholder="Prix max" className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={search.reset} className="rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-xs font-bold text-[#6B7280]">Effacer</button>
              <button type="button" onClick={() => { search.apply(); setShowFilters(false); }} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white active:scale-[0.98] transition">Rechercher</button>
            </div>
          </div>
        )}
      </div>

      {/* Breadcrumb SEO */}
      <div className="px-4 mt-3 flex items-center gap-1 text-[9px] text-[#6B7280]">
        {breadcrumbs.map((b, i) => (
          <span key={b.name}>{i > 0 && " › "}<Link to={b.url.replace("https://mkapms.com", "")} className="hover:text-[#D4AF37]">{b.name}</Link></span>
        ))}
      </div>

      {/* Résultats */}
      <div className="px-4 mt-4">
        <h2 className="text-sm font-bold text-[#111]">
          {liste.isLoading ? `Annonces à ${villeNom}…` : `${annoncesLocales.length} annonce(s) à ${villeNom}`}
        </h2>
        {!liste.isLoading && annoncesLocales.length === 0 && (
          <p className="mt-3 rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">
            {search.activeCount > 0
              ? `Aucune annonce ne correspond à ces critères à ${villeNom}. Modifiez ou effacez les filtres.`
              : `Aucune annonce publiée à ${villeNom} pour le moment. Rien n'est masqué : dès qu'une annonce y est publiée, elle apparaît ici.`}
          </p>
        )}
        <div className="mt-3 space-y-2">
          {annoncesLocales.map(a => (
            <Link key={a.id} to={getAnnonceUrl(a.id, a.categorieAnnonce, a.vendeurType)} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden shadow-sm active:scale-[0.98] transition">
              <div className="flex">
                {a.photo ? (
                  <img src={a.photo} alt={a.nom} className="w-[120px] h-[90px] object-cover" loading="lazy" />
                ) : (
                  <div className="flex w-[120px] h-[90px] items-center justify-center bg-[#F5F3EF] text-[9px] text-[#9CA3AF]">
                    <Car size={18} />
                  </div>
                )}
                <div className="flex-1 p-2.5">
                  <p className="text-xs font-bold text-[#111]">{a.nom}</p>
                  <p className="text-[9px] text-[#6B7280]">
                    {[
                      a.annee ? String(a.annee) : null,
                      a.km !== null && a.km !== undefined ? `${Number(a.km).toLocaleString("fr-FR")} km` : null,
                      a.ville,
                    ].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1 text-sm font-black text-[#D4AF37]">
                    {a.prix !== null ? `${a.prix.toLocaleString("fr-FR")} ${paysInfo?.devise || "€"}` : "Prix sur demande"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Autres villes */}
      {autresVilles.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-sm font-bold text-[#111]">Autres villes — {paysNom}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {autresVilles.map(v => (
              <Link key={v} to={`/${pays}/${v.toLowerCase()}${modele ? "/" + modele : ""}`} className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[10px] font-bold text-[#111] active:bg-[#D4AF37] active:text-white">{v}</Link>
            ))}
          </div>
        </div>
      )}

      {/* Autres pays */}
      <div className="px-4 mt-4">
        <h2 className="text-sm font-bold text-[#111]">Rechercher dans un autre pays</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.keys(PAYS_DATA).filter(p => p !== pays).map(p => (
            <Link key={p} to={`/${p}/${PAYS_DATA[p].villes[0].toLowerCase()}${modele ? "/" + modele : ""}`} className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[10px] font-bold text-[#111] active:bg-[#D4AF37] active:text-white">{p.charAt(0).toUpperCase() + p.slice(1)}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
