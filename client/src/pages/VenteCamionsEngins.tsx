import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAnnonceUrl } from "../lib/annonceUrl";
import {
  ChevronLeft, Search, Heart, HardHat, Wrench,
  ShieldCheck, Star, ChevronDown, Tractor, X,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   Engins & Machines — Achat
   Chantier, TP, agricole, forestier, industriel, minier, portuaire
   AUCUN camion — les camions sont dans /acheter/camions
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  /* ── Terrassement & Excavation ── */
  { label: "Pelleteuses", desc: "Excavateurs, mini-pelles", photo: "/categories/camion_benne_tp.jpg" },
  { label: "Mini-pelles", desc: "Moins de 6 t, compact", photo: "/categories/camion_benne_tp.jpg" },
  { label: "Bulldozers", desc: "Pousseurs, niveleuses", photo: "/categories/camion_poids_lourd.jpg" },
  { label: "Niveleuses", desc: "Graders, profilage terrain", photo: "/categories/camion_plateau.jpg" },
  { label: "Scrapers", desc: "Décapage & transport terre", photo: "/categories/camion_benne.jpg" },
  /* ── Levage & Manutention ── */
  { label: "Grues mobiles", desc: "Grues sur roues & chenilles", photo: "/categories/camion_grue_auxiliaire.jpg" },
  { label: "Grues à tour", desc: "Grues fixes de chantier", photo: "/categories/camion_grue_auxiliaire.jpg" },
  { label: "Chariots élévateurs", desc: "Frontaux, rétractables", photo: "/categories/camion_plateau.jpg" },
  { label: "Chariots télescopiques", desc: "Manitou, JCB, Merlo", photo: "/categories/camion_plateau.jpg" },
  { label: "Nacelles", desc: "Élévateurs de personnes", photo: "/categories/camion_ampliroll.jpg" },
  { label: "Chariots tout-terrain", desc: "Manutention en extérieur", photo: "/categories/camion_plateau.jpg" },
  /* ── Compactage & Finition ── */
  { label: "Compacteurs", desc: "Rouleaux, plaques vibrantes", photo: "/categories/camion_benne.jpg" },
  { label: "Finisseurs", desc: "Enrobés, asphalte", photo: "/categories/camion_benne_tp.jpg" },
  { label: "Fraiseuses", desc: "Raboteuses de chaussée", photo: "/categories/camion_benne_tp.jpg" },
  /* ── Forage & Fondations ── */
  { label: "Foreuses", desc: "Sondeuses, foreuses rotatives", photo: "/categories/camion_benne_tp.jpg" },
  { label: "Pieux & Battage", desc: "Moutons, vibrateurs de pieux", photo: "/categories/camion_benne_tp.jpg" },
  /* ── Agricole ── */
  { label: "Tracteurs agricoles", desc: "Toutes puissances, toutes marques", photo: "/categories/camion_plateau.jpg" },
  { label: "Moissonneuses", desc: "Moissonneuses-batteuses", photo: "/categories/camion_plateau.jpg" },
  { label: "Ensileuses", desc: "Récolte fourrage & maïs", photo: "/categories/camion_plateau.jpg" },
  { label: "Chargeurs frontaux", desc: "Télescopiques agricoles", photo: "/categories/camion_plateau.jpg" },
  { label: "Épandeurs", desc: "Fumier, lisier, engrais", photo: "/categories/camion_plateau.jpg" },
  { label: "Pulvérisateurs", desc: "Automoteurs & traînés", photo: "/categories/camion_plateau.jpg" },
  { label: "Presses à balles", desc: "Rondes & carrées", photo: "/categories/camion_plateau.jpg" },
  /* ── Forestier ── */
  { label: "Abatteuses", desc: "Harvesters forestiers", photo: "/categories/camion_poids_lourd.jpg" },
  { label: "Porteurs forestiers", desc: "Forwarders, débardeurs", photo: "/categories/camion_poids_lourd.jpg" },
  { label: "Broyeurs forestiers", desc: "Déchiqueteurs, broyeurs", photo: "/categories/camion_poids_lourd.jpg" },
  /* ── Industrie & Entrepôt ── */
  { label: "Chariots élec.", desc: "Électriques entrepôt", photo: "/categories/camion_plateau.jpg" },
  { label: "Transpalettes", desc: "Manuels & électriques", photo: "/categories/camion_plateau.jpg" },
  { label: "Gerbeurs", desc: "Stockage haute densité", photo: "/categories/camion_plateau.jpg" },
  { label: "Chariots latéraux", desc: "Longues charges", photo: "/categories/camion_plateau.jpg" },
  /* ── Portuaire & Aéroportuaire ── */
  { label: "Reach stackers", desc: "Manutention conteneurs", photo: "/categories/camion_plateau.jpg" },
  { label: "Tracteurs portuaires", desc: "Terminaux, quais", photo: "/categories/camion_plateau.jpg" },
  { label: "Chariots aéro.", desc: "Bagages & fret aéroport", photo: "/categories/camion_plateau.jpg" },
  /* ── Mines & Carrières ── */
  { label: "Tombereaux", desc: "Dumpers articulés & rigides", photo: "/categories/camion_benne_tp.jpg" },
  { label: "Chargeuses", desc: "Chargeuses sur pneus", photo: "/categories/camion_benne_tp.jpg" },
  { label: "Foreuses minières", desc: "Perforatrices de roche", photo: "/categories/camion_benne_tp.jpg" },
  /* ── Travaux routiers ── */
  { label: "Répandeuses", desc: "Liant, sel, saumure", photo: "/categories/camion_benne_tp.jpg" },
  { label: "Balayeuses", desc: "Voirie & chantier", photo: "/categories/camion_benne_tp.jpg" },
  { label: "Trancheuses", desc: "Canalisations, câbles", photo: "/categories/camion_benne_tp.jpg" },
];

const ALL_MARQUES = [
  /* Chantier & TP */
  "Caterpillar", "Komatsu", "Liebherr", "Volvo CE", "JCB", "Doosan", "Hitachi",
  "Hyundai CE", "Terex", "Manitowoc", "Potain", "Tadano",
  /* Manutention */
  "Manitou", "Linde", "Toyota", "Crown", "Jungheinrich", "Still", "Hyster", "Yale",
  "Merlo", "Bobcat", "Skyjack", "Haulotte", "Genie", "Snorkel",
  /* Agricole */
  "John Deere", "Fendt", "New Holland", "Case IH", "Claas", "Massey Ferguson",
  "Deutz-Fahr", "Valtra", "Same", "Lamborghini Trattori",
  /* Forestier */
  "Ponsse", "John Deere Forestry", "Komatsu Forest", "Tigercat",
  /* Mines & TP */
  "Sandvik", "Atlas Copco", "Epiroc", "Wirtgen", "Hamm", "Dynapac",
];

const ANNONCES = [
  { id: 9300, titre: "Caterpillar 320 Pelleteuse", annee: 2021, km: 3200, ptac: "20 t", prix: 145000, categorie: "Pelleteuses", photo: "/categories/camion_benne_tp.jpg", vendeurType: "professionnel" },
  { id: 9301, titre: "JCB 535-95 Chariot télescopique", annee: 2022, km: 1800, ptac: "8 t", prix: 68000, categorie: "Chariots télescopiques", photo: "/categories/camion_plateau.jpg", vendeurType: "professionnel" },
  { id: 9302, titre: "Liebherr LTM 1030 Grue mobile", annee: 2020, km: 4500, ptac: "35 t", prix: 320000, categorie: "Grues mobiles", photo: "/categories/camion_grue_auxiliaire.jpg", vendeurType: "professionnel" },
  { id: 9303, titre: "Manitou 160ATJ Nacelle", annee: 2022, km: 900, ptac: "6 t", prix: 42000, categorie: "Nacelles", photo: "/categories/camion_ampliroll.jpg", vendeurType: "professionnel" },
  { id: 9304, titre: "Komatsu PC210 Excavateur", annee: 2020, km: 5600, ptac: "21 t", prix: 118000, categorie: "Pelleteuses", photo: "/categories/camion_benne_tp.jpg", vendeurType: "professionnel" },
  { id: 9305, titre: "John Deere 6155R Tracteur", annee: 2021, km: 2100, ptac: "9 t", prix: 89000, categorie: "Tracteurs agricoles", photo: "/categories/camion_plateau.jpg", vendeurType: "professionnel" },
  { id: 9306, titre: "Fendt 724 Vario Tracteur", annee: 2022, km: 1400, ptac: "10 t", prix: 135000, categorie: "Tracteurs agricoles", photo: "/categories/camion_plateau.jpg", vendeurType: "professionnel" },
  { id: 9307, titre: "Caterpillar D6T Bulldozer", annee: 2019, km: 8200, ptac: "22 t", prix: 195000, categorie: "Bulldozers", photo: "/categories/camion_poids_lourd.jpg", vendeurType: "professionnel" },
  { id: 9308, titre: "Linde H50 Chariot élévateur", annee: 2021, km: 3400, ptac: "5 t", prix: 28000, categorie: "Chariots élévateurs", photo: "/categories/camion_plateau.jpg", vendeurType: "professionnel" },
  { id: 9309, titre: "Claas Lexion 8900 Moissonneuse", annee: 2022, km: 420, ptac: "18 t", prix: 480000, categorie: "Moissonneuses", photo: "/categories/camion_plateau.jpg", vendeurType: "professionnel" },
];

const FAQ = [
  { q: "Quel permis pour conduire un engin de chantier ?", a: "Les engins de chantier nécessitent des CACES spécifiques (R482 pour engins de chantier, R489 pour chariots). Pas de permis de conduire requis pour les engins non routiers." },
  { q: "Les engins sont-ils garantis ?", a: "Les engins professionnels certifiés MKA.P-MS sont couverts par une garantie. Les ventes entre professionnels dépendent du vendeur et du contrat signé." },
  { q: "Puis-je financer l'achat d'un engin ?", a: "Oui, MKA.P-MS propose Finance+ avec simulation de crédit, LOA et leasing professionnel directement dans la plateforme." },
  { q: "Comment transporter un engin de chantier ?", a: "MKA.P-MS dispose d'un réseau de transport spécialisé. Contactez le Centre Transport pour un devis de convoi exceptionnel ou transport sur plateau." },
  { q: "Puis-je vendre mon engin sur MKA.P-MS ?", a: "Oui, déposez votre annonce depuis la section Vendre. Les engins bénéficient d'une mise en avant dans l'univers Engins & Machines." },
  { q: "Quelle différence entre un chariot élévateur et un chariot télescopique ?", a: "Le chariot élévateur (frontal) est conçu pour les entrepôts. Le chariot télescopique (Manitou, JCB) est conçu pour l'extérieur et les chantiers, avec une portée plus grande." },
];

const TYPE_FILTER = ["Tous", "Pelleteuses", "Grues mobiles", "Chariots télescopiques", "Nacelles", "Tracteurs agricoles", "Bulldozers", "Chariots élévateurs", "Moissonneuses", "Tombereaux", "Chargeuses"];

export default function VenteCamionsEngins() {
  const [filtre, setFiltre] = useState("Tous");
  const [search, setSearch] = useState("");
  const [marqueSearch, setMarqueSearch] = useState("");
  const [marqueSelectionnee, setMarqueSelectionnee] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredMarques = useMemo(() => {
    if (!marqueSearch.trim()) return ALL_MARQUES;
    const q = marqueSearch.toLowerCase();
    return ALL_MARQUES.filter((m) => m.toLowerCase().includes(q));
  }, [marqueSearch]);

  const annoncesFiltered = ANNONCES.filter((a) => {
    const matchFiltre = filtre === "Tous" || a.categorie === filtre;
    const matchSearch = !search || a.titre.toLowerCase().includes(search.toLowerCase());
    const matchMarque = !marqueSelectionnee || a.titre.toLowerCase().includes(marqueSelectionnee.toLowerCase());
    return matchFiltre && matchSearch && matchMarque;
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">

      {/* ── HERO ── */}
      <div className="bg-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Retour Achat
        </Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">
          ENGINS &amp; MACHINES
        </span>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <HardHat size={20} /> Engins &amp; Machines
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Chantier, TP, agricole, forestier, industriel, minier, portuaire — tout ce qui roule sur terre.
        </p>
        <div className="mt-3 flex gap-4">
          <div className="text-center">
            <p className="text-base font-black text-[#D4AF37]">+8 000</p>
            <p className="text-[9px] text-white/60">engins disponibles</p>
          </div>
          <div className="text-center">
            <p className="text-base font-black text-[#D4AF37]">40+</p>
            <p className="text-[9px] text-white/60">catégories</p>
          </div>
          <div className="text-center">
            <p className="text-base font-black text-[#D4AF37]">100%</p>
            <p className="text-[9px] text-white/60">pro vérifié</p>
          </div>
        </div>
      </div>

      {/* ── BARRE DE RECHERCHE ── */}
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input
            type="text"
            placeholder="Marque, modèle, CACES, catégorie…"
            className="w-full bg-transparent text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── FILTRES TYPE ── */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TYPE_FILTER.map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition ${
              filtre === f
                ? "border-[#1a1a2e] bg-[#1a1a2e] text-white"
                : "border-[#E5E7EB] bg-white text-[#6B7280]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── CATÉGORIES ── */}
      <div className="px-4 mt-5">
        <h2 className="text-base font-bold text-[#111]">Catégories</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => setFiltre(c.label)}
              className={`shrink-0 w-[120px] rounded-xl bg-white border overflow-hidden text-left active:scale-[0.98] transition ${
                filtre === c.label ? "border-[#1a1a2e] shadow-md" : "border-[#E5E7EB]"
              }`}
            >
              <img src={c.photo} alt="" className="w-full h-[60px] object-cover" loading="lazy" />
              <div className="p-2">
                <h3 className="text-[11px] font-bold text-[#111]">{c.label}</h3>
                <p className="text-[8px] text-[#6B7280]">{c.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── MARQUES — barre de recherche + liste filtrée ── */}
      <div className="px-4 mt-5">
        <h2 className="text-base font-bold text-[#111] mb-2">Marques</h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          {/* Barre de recherche */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#E5E7EB]">
            <Search size={14} className="text-[#9CA3AF] shrink-0" />
            <input
              type="text"
              value={marqueSearch}
              onChange={(e) => setMarqueSearch(e.target.value)}
              placeholder="Rechercher une marque…"
              className="w-full bg-transparent text-sm outline-none placeholder-[#9CA3AF]"
            />
            {marqueSearch && (
              <button onClick={() => setMarqueSearch("")} className="text-[#9CA3AF] hover:text-[#374151]">
                <X size={14} />
              </button>
            )}
          </div>
          {/* Liste filtrée */}
          <div className="max-h-44 overflow-y-auto">
            {filteredMarques.length === 0 ? (
              <p className="p-3 text-xs text-[#9CA3AF] text-center">Aucune marque trouvée</p>
            ) : (
              filteredMarques.map((m) => (
                <button
                  key={m}
                  onClick={() => setMarqueSelectionnee(marqueSelectionnee === m ? "" : m)}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    marqueSelectionnee === m
                      ? "bg-[#1a1a2e]/5 text-[#1a1a2e] font-semibold"
                      : "text-[#374151] hover:bg-[#F5F3EF]"
                  }`}
                >
                  {m}
                </button>
              ))
            )}
          </div>
          {/* Bouton Voir les annonces */}
          {marqueSelectionnee && (
            <div className="px-3 py-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => setSearch(marqueSelectionnee)}
                className="w-full py-2 bg-[#1a1a2e] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2"
              >
                <Search size={12} /> Voir les annonces {marqueSelectionnee}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── ANNONCES ── */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">
          {filtre === "Tous" ? "Toutes les annonces" : filtre}
          <span className="ml-2 text-xs font-normal text-[#6B7280]">({annoncesFiltered.length})</span>
        </h2>
        <div className="mt-3 space-y-3">
          {annoncesFiltered.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Aucune annonce pour ce filtre.</p>
          ) : (
            annoncesFiltered.map((a) => (
              <Link
                key={a.id}
                to={getAnnonceUrl(a.id, "professionnelle", a.vendeurType)}
                className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative h-[150px]">
                  <img src={a.photo} alt={a.titre} className="w-full h-full object-cover" loading="lazy" />
                  <span className="absolute top-2 left-2 rounded-md bg-[#1a1a2e]/90 px-2 py-0.5 text-[9px] font-bold text-white">
                    {a.categorie}
                  </span>
                  <span className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center">
                    <Heart size={14} className="text-red-500" />
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-[#111]">{a.titre}</h3>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    {a.annee} · {a.km.toLocaleString("fr-FR")} h · PTAC {a.ptac}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-lg font-black text-[#1a1a2e]">
                      {a.prix.toLocaleString("fr-FR")} €
                    </p>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                      <ShieldCheck size={10} /> Pro vérifié
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* ── SERVICES ASSOCIÉS ── */}
      <div className="px-4 mt-8">
        <h2 className="text-base font-bold text-[#111] mb-3">Services associés</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Finance+", desc: "Crédit & leasing pro", icon: Star, to: "/finance" },
            { label: "Transport", desc: "Convoi exceptionnel", icon: Tractor, to: "/vente/transport" },
            { label: "Diagnostic", desc: "Expertise engin", icon: Wrench, to: "/vente/diagnostic" },
            { label: "Garantie", desc: "Couverture pro", icon: ShieldCheck, to: "/confiance" },
          ].map((s) => (
            <Link
              key={s.label}
              to={s.to}
              className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 active:scale-[0.99] transition hover:shadow-sm hover:border-[#1a1a2e]"
            >
              <s.icon size={18} className="text-[#1a1a2e] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#111]">{s.label}</p>
                <p className="text-[10px] text-[#6B7280]">{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="px-4 mt-8">
        <h2 className="text-base font-bold text-[#111] mb-3">Questions fréquentes</h2>
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-xs font-bold text-[#111]">{f.q}</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-600 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3 text-xs text-[#6B7280] border-t border-[#E5E7EB] pt-2">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA VENDRE ── */}
      <div className="px-4 mt-6">
        <Link
          to="/vendre"
          className="block w-full py-3 bg-[#1a1a2e] text-white rounded-xl text-sm font-bold text-center active:scale-[0.98]"
        >
          Vendre mon engin ou ma machine sur MKA.P-MS
        </Link>
      </div>
    </div>
  );
}
