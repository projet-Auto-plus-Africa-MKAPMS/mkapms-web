import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, MapPin, Search, Car, Heart, Star, Shield } from "lucide-react";
import MetaSEO, { generateBreadcrumbSchema } from "../components/MetaSEO";

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

const ANNONCES_LOCALES = [
  { id: 1, nom: "Peugeot 206 1.4 HDi", annee: 2008, km: 145000, prix: 3500, ville: "Paris", photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=400&h=200&fit=crop" },
  { id: 2, nom: "Peugeot 206 1.6 16v", annee: 2006, km: 120000, prix: 2800, ville: "Boulogne", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=200&fit=crop" },
  { id: 3, nom: "Peugeot 206 CC 2.0", annee: 2005, km: 98000, prix: 4200, ville: "Saint-Denis", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=200&fit=crop" },
];

export default function RechercheLocale() {
  const params = useParams<{ pays?: string; ville?: string; modele?: string }>();
  const pays = params.pays || "france";
  const ville = params.ville || "paris";
  const modele = params.modele || "";

  const paysNom = pays.charAt(0).toUpperCase() + pays.slice(1);
  const villeNom = ville.charAt(0).toUpperCase() + ville.slice(1);
  const modeleNom = modele.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

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
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input type="text" defaultValue={modeleNom} placeholder="Marque, modèle…" className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      {/* Breadcrumb SEO */}
      <div className="px-4 mt-3 flex items-center gap-1 text-[9px] text-[#6B7280]">
        {breadcrumbs.map((b, i) => (
          <span key={b.name}>{i > 0 && " › "}<Link to={b.url.replace("https://mkapms.com", "")} className="hover:text-[#D4AF37]">{b.name}</Link></span>
        ))}
      </div>

      {/* Résultats */}
      <div className="px-4 mt-4">
        <h2 className="text-sm font-bold text-[#111]">{ANNONCES_LOCALES.length} annonces à {villeNom}</h2>
        <div className="mt-3 space-y-2">
          {ANNONCES_LOCALES.map(a => (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden shadow-sm">
              <div className="flex">
                <img src={a.photo} alt={a.nom} className="w-[120px] h-[90px] object-cover" loading="lazy" />
                <div className="flex-1 p-2.5">
                  <p className="text-xs font-bold text-[#111]">{a.nom}</p>
                  <p className="text-[9px] text-[#6B7280]">{a.annee} · {a.km.toLocaleString("fr-FR")} km · {a.ville}</p>
                  <p className="mt-1 text-sm font-black text-[#D4AF37]">{a.prix.toLocaleString("fr-FR")} {paysInfo?.devise || "€"}</p>
                </div>
              </div>
            </div>
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
