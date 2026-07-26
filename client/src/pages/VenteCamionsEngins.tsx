import { useState } from "react";
import { Link } from "react-router-dom";
import { getAnnonceUrl } from "../lib/annonceUrl";
import {
  ChevronLeft, Search, Truck, Heart, HardHat, Wrench,
  ShieldCheck, Star, ChevronDown,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   VenteCamionsEngins — Achat Camions & Engins de chantier
   Poids lourds, bennes, grues, pelleteuses, chariots élévateurs, nacelles
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { label: "Pelleteuses", desc: "Excavateurs, mini-pelles", photo: "/categories/camion_benne_tp.jpg" },
  { label: "Grues", desc: "Grues mobiles & à tour", photo: "/categories/camion_grue_auxiliaire.jpg" },
  { label: "Chariots élévateurs", desc: "Frontaux, télescopiques", photo: "/categories/camion_plateau.jpg" },
  { label: "Nacelles", desc: "Élévateurs de personnes", photo: "/categories/camion_ampliroll.jpg" },
  { label: "Compacteurs", desc: "Rouleaux, plaques", photo: "/categories/camion_benne.jpg" },
  { label: "Bulldozers", desc: "Pousseurs, niveleuses", photo: "/categories/camion_poids_lourd.jpg" },
  { label: "Bennes TP", desc: "Camions travaux publics", photo: "/categories/camion_benne_tp.jpg" },
  { label: "Camions-grues", desc: "Grue auxiliaire intégrée", photo: "/categories/camion_grue_auxiliaire.jpg" },
  { label: "Plateaux lourds", desc: "Transport engins", photo: "/categories/camion_plateau.jpg" },
  { label: "Malaxeurs", desc: "Bétonnières, toupies", photo: "/categories/camion_malaxeur.jpg" },
  { label: "Citernes", desc: "Eau, carburant, béton", photo: "/categories/camion_citerne.jpg" },
  { label: "Semi-remorques", desc: "Tracteurs routiers", photo: "/categories/camion_semiremorque.jpg" },
];

const MARQUES = [
  "Caterpillar", "Komatsu", "Liebherr", "Volvo CE", "JCB",
  "Manitou", "Linde", "Toyota", "Terex", "Doosan",
  "Iveco", "MAN", "Renault Trucks", "Mercedes Actros", "DAF",
];

const ANNONCES = [
  { id: 9300, titre: "Caterpillar 320 Pelleteuse", annee: 2021, km: 3200, ptac: "20 t", prix: 145000, categorie: "Pelleteuses", photo: "/categories/camion_benne_tp.jpg", vendeurType: "professionnel" },
  { id: 9301, titre: "JCB 535-95 Chariot télescopique", annee: 2022, km: 1800, ptac: "8 t", prix: 68000, categorie: "Chariots élévateurs", photo: "/categories/camion_plateau.jpg", vendeurType: "professionnel" },
  { id: 9302, titre: "Liebherr LTM 1030 Grue mobile", annee: 2020, km: 4500, ptac: "35 t", prix: 320000, categorie: "Grues", photo: "/categories/camion_grue_auxiliaire.jpg", vendeurType: "professionnel" },
  { id: 9303, titre: "Manitou 160ATJ Nacelle", annee: 2022, km: 900, ptac: "6 t", prix: 42000, categorie: "Nacelles", photo: "/categories/camion_ampliroll.jpg", vendeurType: "professionnel" },
  { id: 9304, titre: "Iveco Trakker 410 Benne TP", annee: 2021, km: 85000, ptac: "26 t", prix: 89000, categorie: "Bennes TP", photo: "/categories/camion_benne_tp.jpg", vendeurType: "professionnel" },
  { id: 9305, titre: "Mercedes Actros 2545 Plateau", annee: 2022, km: 62000, ptac: "18 t", prix: 74000, categorie: "Plateaux lourds", photo: "/categories/camion_plateau.jpg", vendeurType: "professionnel" },
  { id: 9306, titre: "Komatsu PC210 Excavateur", annee: 2020, km: 5600, ptac: "21 t", prix: 118000, categorie: "Pelleteuses", photo: "/categories/camion_benne_tp.jpg", vendeurType: "professionnel" },
  { id: 9307, titre: "Renault Trucks C 430 Malaxeur", annee: 2021, km: 72000, ptac: "32 t", prix: 95000, categorie: "Malaxeurs", photo: "/categories/camion_malaxeur.jpg", vendeurType: "professionnel" },
];

const FAQ = [
  { q: "Quel permis pour conduire un camion ou engin ?", a: "Permis C pour les poids lourds > 3,5t. Les engins de chantier (pelleteuses, grues) nécessitent des CACES spécifiques selon la catégorie." },
  { q: "Les engins sont-ils garantis ?", a: "Les engins professionnels certifiés MKA.P-MS sont couverts par une garantie. Les ventes entre professionnels dépendent du vendeur." },
  { q: "Puis-je financer l'achat d'un engin ?", a: "Oui, MKA.P-MS propose Finance+ avec simulation de crédit, LOA et leasing professionnel directement dans la plateforme." },
  { q: "Comment transporter un engin de chantier ?", a: "MKA.P-MS dispose d'un réseau de transport spécialisé. Contactez le Centre Transport pour un devis de convoi exceptionnel." },
  { q: "Puis-je vendre mon engin sur MKA.P-MS ?", a: "Oui, déposez votre annonce depuis la section Vendre. Les engins de chantier bénéficient d'une mise en avant dans l'univers Camions & Engins." },
];

const TYPE_FILTER = ["Tous", "Pelleteuses", "Grues", "Chariots élévateurs", "Nacelles", "Bennes TP"];

export default function VenteCamionsEngins() {
  const [filtre, setFiltre] = useState("Tous");
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const annoncesFiltered = ANNONCES.filter((a) => {
    const matchFiltre = filtre === "Tous" || a.categorie === filtre;
    const matchSearch = !search || a.titre.toLowerCase().includes(search.toLowerCase());
    return matchFiltre && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* ── HERO ── */}
      <div className="bg-gray-800 px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Retour Vente
        </Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">
          CAMION / ENGIN
        </span>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <HardHat size={20} /> Camions &amp; Engins
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Pour poids lourds, bennes, plateaux, chantiers et besoins lourds.
        </p>
      </div>

      {/* ── BARRE DE RECHERCHE ── */}
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input
            type="text"
            placeholder="Marque, modèle, PTAC, catégorie…"
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
                ? "border-gray-800 bg-gray-800 text-white"
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
                filtre === c.label ? "border-gray-800 shadow-md" : "border-[#E5E7EB]"
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

      {/* ── MARQUES ── */}
      <div className="px-4 mt-5">
        <h2 className="text-base font-bold text-[#111]">Marques</h2>
        <div className="mt-2 flex gap-2 flex-wrap">
          {MARQUES.map((m) => (
            <span
              key={m}
              className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-xs font-medium text-[#374151] cursor-pointer hover:border-gray-700 transition"
            >
              {m}
            </span>
          ))}
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
                  <span className="absolute top-2 left-2 rounded-md bg-gray-800/90 px-2 py-0.5 text-[9px] font-bold text-white">
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
                    <p className="text-lg font-black text-gray-800">
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
            { label: "Transport", desc: "Convoi exceptionnel", icon: Truck, to: "/vente/transport" },
            { label: "Diagnostic", desc: "Expertise engin", icon: Wrench, to: "/vente/diagnostic" },
            { label: "Garantie", desc: "Couverture pro", icon: ShieldCheck, to: "/confiance" },
          ].map((s) => (
            <Link
              key={s.label}
              to={s.to}
              className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 active:scale-[0.99] transition hover:shadow-sm hover:border-gray-700"
            >
              <s.icon size={18} className="text-gray-700 shrink-0" />
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
          className="block w-full py-3 bg-gray-800 text-white rounded-xl text-sm font-bold text-center active:scale-[0.98]"
        >
          Vendre mon camion / engin sur MKA.P-MS
        </Link>
      </div>
    </div>
  );
}
