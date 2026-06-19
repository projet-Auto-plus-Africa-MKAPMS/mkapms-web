import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Search, MapPin, Calendar, Truck,
  Shield, Lock, Headphones, FileCheck, ChevronDown,
  Rocket, Ban, ArrowRight, Gauge, Users, Car,
  Package, Container, Snowflake, Weight, Building2, Fuel
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE LISTING UTILITAIRES & CAMIONNETTES
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { titre: "Utilitaires légers", modeles: ["Kangoo", "Berlingo", "Partner", "Caddy"], photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=240&fit=crop", count: 12 },
  { titre: "Fourgons", modeles: ["Trafic", "Vivaro", "Transit Custom"], photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=240&fit=crop", count: 8 },
  { titre: "Grand volume", modeles: ["Master", "Boxer", "Ducato", "Sprinter"], photo: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=240&fit=crop", count: 6 },
  { titre: "Camionnettes plateau", modeles: ["L200", "Hilux", "Navara"], photo: "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&h=240&fit=crop", count: 5 },
  { titre: "Frigorifiques", modeles: ["Berlingo Frigo", "Trafic Frigo"], photo: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=240&fit=crop", count: 4 },
];

const VEHICULES = [
  { id: 5001, titre: "Renault Kangoo Van", annee: 2024, volume: "3.3 m³", charge: "650 kg", prixJour: 35, prixSemaine: 210, prixMois: 750, photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=260&fit=crop", categorie: "Utilitaire léger" },
  { id: 5002, titre: "Citroën Berlingo Van", annee: 2023, volume: "3.7 m³", charge: "700 kg", prixJour: 38, prixSemaine: 228, prixMois: 800, photo: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=260&fit=crop", categorie: "Utilitaire léger" },
  { id: 5003, titre: "Peugeot Partner Van", annee: 2024, volume: "3.8 m³", charge: "750 kg", prixJour: 38, prixSemaine: 228, prixMois: 790, photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=260&fit=crop", categorie: "Utilitaire léger" },
  { id: 5004, titre: "Renault Trafic L2H1", annee: 2024, volume: "5.8 m³", charge: "1200 kg", prixJour: 55, prixSemaine: 330, prixMois: 1100, photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=260&fit=crop", categorie: "Fourgon" },
  { id: 5005, titre: "Ford Transit Custom", annee: 2023, volume: "6.0 m³", charge: "1300 kg", prixJour: 58, prixSemaine: 348, prixMois: 1150, photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=260&fit=crop", categorie: "Fourgon" },
  { id: 5006, titre: "Renault Master L3H2", annee: 2024, volume: "13 m³", charge: "1500 kg", prixJour: 75, prixSemaine: 450, prixMois: 1500, photo: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=260&fit=crop", categorie: "Grand volume" },
  { id: 5007, titre: "Mercedes Sprinter 314", annee: 2023, volume: "11 m³", charge: "1400 kg", prixJour: 85, prixSemaine: 510, prixMois: 1700, photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=260&fit=crop", categorie: "Grand volume" },
  { id: 5008, titre: "Fiat Ducato L4H3", annee: 2024, volume: "17 m³", charge: "1600 kg", prixJour: 90, prixSemaine: 540, prixMois: 1800, photo: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=260&fit=crop", categorie: "Grand volume" },
  { id: 5009, titre: "Mitsubishi L200", annee: 2023, volume: "Plateau", charge: "1050 kg", prixJour: 65, prixSemaine: 390, prixMois: 1300, photo: "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&h=260&fit=crop", categorie: "Plateau" },
  { id: 5010, titre: "Renault Trafic Frigo", annee: 2024, volume: "5.2 m³", charge: "1000 kg", prixJour: 75, prixSemaine: 450, prixMois: 1500, photo: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=260&fit=crop", categorie: "Frigorifique" },
];

const SERVICES = [
  { icon: Truck, label: "Livraison sur site", desc: "Livré directement sur votre chantier" },
  { icon: Shield, label: "Assurance incluse", desc: "Tous risques, franchise réduite" },
  { icon: Headphones, label: "Assistance 7j/7", desc: "Support dédié professionnels" },
  { icon: Rocket, label: "Réservation instantanée", desc: "Pas d'attente, pas de délai" },
  { icon: Ban, label: "Aucun appel obligatoire", desc: "Tout se fait en ligne" },
  { icon: Lock, label: "Paiement sécurisé", desc: "CB, Apple Pay, Google Pay" },
];

const FAQ = [
  { q: "Pour quel usage ?", a: "Déménagement, livraison, chantier, transport de marchandises, commerce ambulant — tous types d'usages professionnels et particuliers." },
  { q: "Quel permis faut-il ?", a: "Permis B pour les utilitaires de moins de 3,5 tonnes. Au-delà, permis C requis." },
  { q: "Documents nécessaires ?", a: "Permis de conduire, pièce d'identité, justificatif de domicile, carte bancaire. Pour les pros : KBIS ou SIRET." },
  { q: "Comment fonctionne la caution ?", a: "Empreinte bancaire prise à la réservation (non débitée). Libérée sous 7 jours après restitution." },
];

const TYPE_FILTER = ["Tous", "Léger", "Fourgon", "Grand volume", "Plateau", "Frigo"];

export default function LocationUtilitaires() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [lieu, setLieu] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateRetour, setDateRetour] = useState("");
  const [filtre, setFiltre] = useState("Tous");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const filteredVehicules = VEHICULES.filter((v) => {
    if (selectedCat && v.categorie !== selectedCat) return false;
    if (filtre === "Tous") return true;
    if (filtre === "Léger" && v.categorie.includes("léger")) return true;
    if (filtre === "Fourgon" && v.categorie === "Fourgon") return true;
    if (filtre === "Grand volume" && v.categorie === "Grand volume") return true;
    if (filtre === "Plateau" && v.categorie === "Plateau") return true;
    if (filtre === "Frigo" && v.categorie === "Frigorifique") return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24 max-w-6xl mx-auto">

      {/* BANNIÈRE */}
      <div className="relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=800&h=420&fit=crop" alt="Utilitaires" className="w-full h-[240px] md:h-[320px] lg:h-[400px] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111]/90 via-[#111]/40 to-transparent" />
        <Link to="/louer" className="absolute top-4 left-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur">
          <ChevronLeft size={20} className="text-[#111]" />
        </Link>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-2.5 py-1 text-[10px] font-bold text-white mb-2">
            <Truck size={10} /> UTILITAIRE
          </span>
          <h1 className="text-2xl font-black text-white leading-tight">UTILITAIRES & CAMIONNETTES</h1>
          <p className="mt-1 text-sm text-white/80">Livraison, déménagement, chantier — trouvez le véhicule adapté.</p>
          <button onClick={() => document.getElementById("search-util")?.scrollIntoView({ behavior: "smooth" })} className="mt-3 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2">
            <Search size={14} /> Trouver un utilitaire
          </button>
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div id="search-util" className="mx-4 -mt-4 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Lieu de retrait</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
              <MapPin size={14} className="text-red-500 shrink-0" />
              <input type="text" placeholder="Ville, zone industrielle…" value={lieu} onChange={(e) => setLieu(e.target.value)} className="w-full bg-transparent text-sm text-[#111] placeholder:text-[#9CA3AF] outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Date départ</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
                <Calendar size={14} className="text-[#D4AF37] shrink-0" />
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full bg-transparent text-sm text-[#111] outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Date retour</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
                <Calendar size={14} className="text-[#D4AF37] shrink-0" />
                <input type="date" value={dateRetour} onChange={(e) => setDateRetour(e.target.value)} className="w-full bg-transparent text-sm text-[#111] outline-none" />
              </div>
            </div>
          </div>
          <button className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-extrabold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md">
            <Search size={16} /> Rechercher un utilitaire
          </button>
        </div>
      </div>

      {/* CATÉGORIES */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-[#111]">Catégories utilitaires</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button key={c.titre} onClick={() => setSelectedCat(selectedCat === c.titre ? null : c.titre)} className={`shrink-0 w-[140px] md:w-[160px] lg:w-[180px] rounded-xl overflow-hidden border-2 transition active:scale-[0.98] ${selectedCat === c.titre ? "border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/30" : "border-[#E5E7EB]"}`}>
              <img src={c.photo} alt={c.titre} className="h-[80px] w-full object-cover" loading="lazy" />
              <div className="p-2 bg-white">
                <p className="text-xs font-bold text-[#111] truncate">{c.titre}</p>
                <p className="text-[10px] text-[#6B7280]">{c.count} véhicules</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FILTRES */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TYPE_FILTER.map((f) => (
          <button key={f} onClick={() => setFiltre(f)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${filtre === f ? "bg-[#D4AF37] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* VÉHICULES */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#111]">Utilitaires disponibles</h2>
          <span className="text-xs text-[#6B7280]">{filteredVehicules.length} résultat{filteredVehicules.length > 1 ? "s" : ""}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicules.map((v) => (
            <Link key={v.id} to={`/louer/utilitaires/vehicule/${v.id}`} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden active:scale-[0.99] transition hover:shadow-lg">
              <div className="relative h-[160px] md:h-[180px] lg:h-[200px]">
                <img src={v.photo} alt={v.titre} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 left-2 rounded-full bg-orange-600 px-2.5 py-0.5 text-[9px] font-bold text-white">{v.categorie}</span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[#111]">{v.titre}</h3>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#6B7280]">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {v.annee}</span>
                  <span className="flex items-center gap-1"><Package size={10} /> {v.volume}</span>
                  <span className="flex items-center gap-1"><Weight size={10} /> {v.charge}</span>
                </div>
                <div className="mt-3 relative">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-[#6B7280] uppercase">Jour</p>
                      <p className="text-sm font-black text-[#111]">{v.prixJour} €</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-[#6B7280] uppercase">3 Jours</p>
                      <p className="text-sm font-black text-[#111]">{Math.round(v.prixJour * 2.7)} €</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-[#6B7280] uppercase">Semaine</p>
                      <p className="text-sm font-black text-[#111]">{v.prixSemaine} €</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-[#6B7280] uppercase">2 Sem.</p>
                      <p className="text-sm font-black text-[#111]">{Math.round(v.prixSemaine * 1.8)} €</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-orange-600/5 border border-orange-600/20 p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-orange-600 uppercase font-semibold">Mois</p>
                      <p className="text-sm font-black text-orange-600">{v.prixMois} €</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-orange-600/10 border border-orange-600/30 p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-orange-600 uppercase font-semibold">3 Mois</p>
                      <p className="text-sm font-black text-orange-600">{Math.round(v.prixMois * 2.7)} €</p>
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none flex items-center justify-end">
                    <ChevronRight size={14} className="text-red-500" />
                  </div>
                </div>
                <span className="mt-3 w-full rounded-xl bg-orange-600 py-3 text-sm font-bold text-white active:scale-[0.98] transition flex items-center justify-center gap-2">
                  Voir les détails <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-bold text-[#111]">Nos services utilitaires</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {SERVICES.map((s) => { const Icon = s.icon; return (
            <div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
              <Icon size={18} className="text-[#D4AF37]" />
              <p className="text-xs font-bold text-[#111] mt-1.5">{s.label}</p>
              <p className="text-[10px] text-[#6B7280] mt-0.5">{s.desc}</p>
            </div>
          ); })}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 mt-6 mb-6">
        <h2 className="text-lg font-bold text-[#111] mb-3">Questions fréquentes</h2>
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                <span className="text-sm font-semibold text-[#111]">{f.q}</span>
                <ChevronDown size={16} className={`text-red-500 transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <div className="px-4 pb-3"><p className="text-xs text-[#6B7280] leading-relaxed">{f.a}</p></div>}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mx-4 rounded-2xl bg-[#111] p-5 text-center">
        <Building2 size={28} className="text-[#D4AF37] mx-auto" />
        <h2 className="text-lg font-black text-white mt-2">Besoin d'une flotte utilitaire ?</h2>
        <p className="text-xs text-white/70 mt-1">Contactez notre service pro pour des tarifs personnalisés.</p>
        <Link to="/louer/pro" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white">
          Solutions Pro <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
}
