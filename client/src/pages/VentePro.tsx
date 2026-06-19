import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Search, Shield, Star, FileText, Truck,
  Check, Filter, Heart, MapPin, ChevronDown, Euro,
  Building2, Award, ChevronRight, Phone
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE PROFESSIONNELLE
   Garages, Marchands, Concessionnaires. TVA récupérable, garantie, historique.
   ══════════════════════════════════════════════════════════════════════════ */

const ANNONCES = [
  { id: 1, nom: "BMW X3 xDrive 20d", annee: 2023, km: 28000, prix: 38500, tva: true, garantie: "24 mois", carb: "Diesel", boite: "Auto", pro: "BMW Premium Selection Paris", note: 4.9, photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop" },
  { id: 2, nom: "Mercedes GLC 300e AMG", annee: 2023, km: 15000, prix: 52000, tva: true, garantie: "24 mois", carb: "Hybride", boite: "Auto", pro: "Star Auto Lyon", note: 4.8, photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop" },
  { id: 3, nom: "Audi A4 Avant 40 TDI", annee: 2022, km: 45000, prix: 34900, tva: true, garantie: "12 mois", carb: "Diesel", boite: "Auto", pro: "Audi Approved Marseille", note: 4.7, photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=260&fit=crop" },
  { id: 4, nom: "Peugeot 5008 GT Pack", annee: 2024, km: 5000, prix: 36500, tva: false, garantie: "24 mois", carb: "Hybride", boite: "Auto", pro: "Peugeot Webstore", note: 4.6, photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop" },
];

const CATEGORIES_PRO = [
  { label: "Berlines", modeles: "Série 3, Classe C, A4, 508", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=300&h=200&fit=crop" },
  { label: "SUV & 4x4", modeles: "X3, GLC, Q5, 3008", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=300&h=200&fit=crop" },
  { label: "Citadines", modeles: "208, Clio, Polo, A1", photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=300&h=200&fit=crop" },
  { label: "Breaks", modeles: "508 SW, Passat, A4 Avant", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=300&h=200&fit=crop" },
  { label: "Utilitaires", modeles: "Kangoo, Berlingo, Trafic", photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=300&h=200&fit=crop" },
  { label: "Premium", modeles: "Classe E, Série 5, A6", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=300&h=200&fit=crop" },
];

const FILTRES_PRO = [
  "TVA récupérable", "Garantie constructeur", "Professionnel vérifié",
  "Livraison possible", "Contrôle technique OK", "1ère main",
];

const FAQ = [
  { q: "Comment vérifier un professionnel ?", r: "Chaque professionnel est vérifié par MKA.P-MS : SIRET, KBIS, avis clients. Le badge 'Vérifié' garantit son sérieux." },
  { q: "La TVA est-elle récupérable ?", r: "Oui, les annonces avec le badge 'TVA récup.' permettent la récupération de la TVA pour les entreprises." },
  { q: "Quelle garantie sur les véhicules ?", r: "Les professionnels proposent des garanties de 6 à 24 mois. Détail visible sur chaque annonce." },
  { q: "Livraison possible ?", r: "Oui, de nombreux professionnels proposent la livraison partout en France." },
];

export default function VentePro() {
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFilter = (f: string) => setActiveFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">PROFESSIONNEL</span>
        <h1 className="text-xl font-black text-white">Achat Professionnel</h1>
        <p className="mt-1 text-sm text-white/80">Garages, marchands, concessionnaires. Garantie et historique.</p>
      </div>

      {/* Recherche */}
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input type="text" placeholder="Marque, modèle…" className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      {/* Quick filters */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTRES_PRO.map((f) => (
          <button key={f} onClick={() => toggleFilter(f)} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${activeFilters.includes(f) ? "bg-blue-800 text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>{f}</button>
        ))}
      </div>

      {/* Catégories — scroll horizontal */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Catégories</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES_PRO.map((c) => (
            <button key={c.label} className="shrink-0 w-[120px] rounded-xl bg-white border border-[#E5E7EB] overflow-hidden text-left active:scale-[0.98] transition">
              <img src={c.photo} alt={c.label} className="w-full h-[60px] object-cover" loading="lazy" />
              <div className="p-2"><h3 className="text-[11px] font-bold text-[#111]">{c.label}</h3><p className="text-[8px] text-[#6B7280] truncate">{c.modeles}</p></div>
            </button>
          ))}
        </div>
      </div>

      {/* Annonces */}
      <div className="px-4 mt-4 space-y-3">
        {ANNONCES.map((a) => (
          <Link key={a.id} to={`/vehicule/${9000 + a.id}`} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition">
            <div className="relative h-[140px]">
              <img src={a.photo} alt={a.nom} className="w-full h-full object-cover" loading="lazy" />
              <span className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"><Heart size={14} className="text-[#6B7280]" /></span>
              <div className="absolute top-2 left-2 flex gap-1">
                <span className="rounded-full bg-blue-800 px-2 py-0.5 text-[9px] font-bold text-white flex items-center gap-0.5"><Shield size={8} /> Pro vérifié</span>
                {a.tva && <span className="rounded-full bg-green-600 px-2 py-0.5 text-[9px] font-bold text-white">TVA récup.</span>}
              </div>
              {a.garantie && <span className="absolute bottom-2 left-2 rounded-full bg-[#111] px-2 py-0.5 text-[9px] font-bold text-[#D4AF37]">Garantie {a.garantie}</span>}
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-[#111]">{a.nom}</h3>
              <div className="mt-1 flex items-center gap-3 text-[10px] text-[#6B7280]">
                <span>{a.annee}</span><span>{a.km.toLocaleString("fr-FR")} km</span><span>{a.carb}</span><span>{a.boite}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-[#6B7280]"><Building2 size={10} /> {a.pro}</div>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <span className="text-lg font-black text-blue-800">{a.prix.toLocaleString("fr-FR")} €</span>
                  {a.tva && <span className="text-[9px] text-green-600 ml-1 font-semibold">HT</span>}
                </div>
                <span className="flex items-center gap-0.5 text-xs"><Star size={10} className="text-[#D4AF37]" fill="#D4AF37" /> {a.note}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <div className="px-4 mt-8">
        <h2 className="text-base font-bold text-[#111]">FAQ Vente professionnelle</h2>
        <div className="mt-3 space-y-2">
          {FAQ.map((f, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                <span className="text-sm font-semibold text-[#111] pr-2">{f.q}</span>
                <ChevronDown size={14} className={`text-[#6B7280] shrink-0 transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <div className="px-4 pb-3"><p className="text-xs text-[#6B7280]">{f.r}</p></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
