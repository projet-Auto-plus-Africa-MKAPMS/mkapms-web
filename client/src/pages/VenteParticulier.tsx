import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Search, Car, Star, Calendar, Gauge, Fuel,
  Settings2, MapPin, ChevronDown, Heart, Shield, Euro,
  ChevronRight, HelpCircle, Phone, Filter
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE PARTICULIER
   Univers réservé : Particuliers ↔ Particuliers / Particuliers ↔ Pros
   Citadines, Berlines, SUV, Monospaces, Breaks, Cabriolets
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { label: "Citadines", modeles: "Clio, 208, Corsa, Yaris", photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=300&h=200&fit=crop" },
  { label: "Berlines", modeles: "Série 3, Classe C, A4", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=300&h=200&fit=crop" },
  { label: "SUV & 4x4", modeles: "3008, Tiguan, X3, GLC", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=300&h=200&fit=crop" },
  { label: "Monospaces", modeles: "Scenic, Touran, Espace", photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=300&h=200&fit=crop" },
  { label: "Breaks", modeles: "508 SW, Passat SW, Série 3 Touring", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=300&h=200&fit=crop" },
  { label: "Cabriolets", modeles: "SLK, Z4, Boxster", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=300&h=200&fit=crop" },
];

const ANNONCES = [
  { id: 1, nom: "Peugeot 208 Style", annee: 2022, km: 35000, prix: 14500, carburant: "Essence", boite: "Manuelle", region: "Île-de-France", note: 4.5, photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=400&h=260&fit=crop", vendeur: "Particulier" },
  { id: 2, nom: "Renault Clio V Intens", annee: 2023, km: 18000, prix: 16900, carburant: "Essence", boite: "Automatique", region: "Rhône-Alpes", note: 4.7, photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop", vendeur: "Professionnel" },
  { id: 3, nom: "BMW Série 3 320d", annee: 2021, km: 62000, prix: 27500, carburant: "Diesel", boite: "Automatique", region: "PACA", note: 4.8, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop", vendeur: "Professionnel" },
  { id: 4, nom: "Peugeot 3008 GT Hybrid", annee: 2023, km: 25000, prix: 32000, carburant: "Hybride", boite: "Automatique", region: "Île-de-France", note: 4.6, photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop", vendeur: "Particulier" },
  { id: 5, nom: "Volkswagen Golf 8 R-Line", annee: 2022, km: 42000, prix: 24900, carburant: "Essence", boite: "Automatique", region: "Nord", note: 4.4, photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=260&fit=crop", vendeur: "Professionnel" },
  { id: 6, nom: "Dacia Sandero Stepway", annee: 2024, km: 8000, prix: 15500, carburant: "GPL", boite: "Manuelle", region: "Bretagne", note: 4.3, photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=260&fit=crop", vendeur: "Particulier" },
];

const FAQ = [
  { q: "Comment acheter un véhicule sur MKA.P-MS ?", r: "Parcourez les annonces, consultez les détails, contactez le vendeur via la messagerie interne et finalisez votre achat en toute sécurité." },
  { q: "Comment fonctionne le paiement sécurisé ?", r: "MKA.P-MS propose un paiement sécurisé avec séquestre. Le paiement est bloqué jusqu'à la réception du véhicule." },
  { q: "Puis-je financer mon achat ?", r: "Oui, simulez votre financement avec Finance+ directement sur chaque annonce." },
  { q: "Comment vérifier un vendeur ?", r: "Chaque vendeur dispose d'un score de confiance basé sur ses transactions, avis et documents." },
];

export default function VenteParticulier() {
  const [showFilters, setShowFilters] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#D4AF37] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/70 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">PARTICULIER</span>
        <h1 className="text-xl font-black text-white">Achat Particulier</h1>
        <p className="mt-1 text-sm text-white/80">Citadines, berlines, SUV, monospaces, breaks, cabriolets</p>
      </div>

      {/* Recherche */}
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input type="text" placeholder="Marque, modèle…" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="mt-2 w-full flex items-center justify-center gap-1 rounded-lg border border-[#E5E7EB] py-2 text-xs font-semibold text-[#6B7280]">
          <Filter size={12} /> Filtres
        </button>
      </div>

      {showFilters && (
        <div className="mx-4 mt-2 rounded-xl bg-white border border-[#E5E7EB] p-3 grid grid-cols-2 gap-2">
          <select className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-xs bg-white"><option>Prix</option><option>- 5 000 €</option><option>5 - 10 000 €</option><option>10 - 20 000 €</option><option>20 000+ €</option></select>
          <select className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-xs bg-white"><option>Km</option><option>- 50 000</option><option>50 - 100 000</option><option>100 000+</option></select>
          <select className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-xs bg-white"><option>Carburant</option><option>Essence</option><option>Diesel</option><option>Hybride</option><option>Électrique</option></select>
          <select className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-xs bg-white"><option>Boîte</option><option>Manuelle</option><option>Automatique</option></select>
          <select className="col-span-2 rounded-lg border border-[#E5E7EB] px-2 py-2 text-xs bg-white"><option>Région</option><option>Île-de-France</option><option>Rhône-Alpes</option><option>PACA</option><option>Nord</option><option>Bretagne</option></select>
        </div>
      )}

      {/* Catégories — scroll horizontal */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Catégories</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button key={c.label} className="shrink-0 w-[120px] rounded-xl bg-white border border-[#E5E7EB] overflow-hidden text-left active:scale-[0.98] transition">
              <img src={c.photo} alt={c.label} className="w-full h-[60px] object-cover" loading="lazy" />
              <div className="p-2"><h3 className="text-[11px] font-bold text-[#111]">{c.label}</h3><p className="text-[8px] text-[#6B7280] truncate">{c.modeles}</p></div>
            </button>
          ))}
        </div>
      </div>

      {/* Annonces */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Annonces récentes</h2>
        <div className="mt-3 space-y-3">
          {ANNONCES.map((a) => (
            <Link key={a.id} to={`/vehicule/${9060 + a.id}`} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition">
              <div className="relative h-[140px]">
                <img src={a.photo} alt={a.nom} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"><Heart size={14} className="text-[#6B7280]" /></span>
                <span className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${a.vendeur === "Professionnel" ? "bg-blue-800 text-white" : "bg-[#D4AF37] text-white"}`}>{a.vendeur}</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#111]">{a.nom}</h3>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-[#6B7280]">
                  <span>{a.annee}</span><span>{a.km.toLocaleString("fr-FR")} km</span><span>{a.carburant}</span><span>{a.boite}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-[#6B7280]"><MapPin size={10} /> {a.region}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-black text-[#D4AF37]">{a.prix.toLocaleString("fr-FR")} €</span>
                  <span className="flex items-center gap-0.5 text-xs"><Star size={10} className="text-[#D4AF37]" fill="#D4AF37" /> {a.note}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 mt-8">
        <h2 className="text-base font-bold text-[#111]">FAQ</h2>
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
