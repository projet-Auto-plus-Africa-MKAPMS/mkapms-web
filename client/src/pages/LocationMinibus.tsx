import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Search, MapPin, Calendar, Bus,
  Shield, Lock, Headphones, FileCheck, ChevronDown,
  Rocket, Ban, ArrowRight, Users, Heart,
  Building2, Gauge, Star
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE LISTING MINIBUS
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { titre: "8 places", modeles: ["Caravelle", "V-Class"], photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=240&fit=crop", count: 5 },
  { titre: "9 places", modeles: ["Sprinter", "Transporter"], photo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=240&fit=crop", count: 6 },
  { titre: "12-17 places", modeles: ["Sprinter 17pl", "Master 12pl"], photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=240&fit=crop", count: 4 },
  { titre: "Minibus Premium", modeles: ["V-Class VIP", "Sprinter Tourer"], photo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=240&fit=crop", count: 3 },
];

const VEHICULES = [
  { id: 7001, titre: "Volkswagen Caravelle 8pl", annee: 2024, places: 8, boite: "Automatique", prixJour: 95, prixSemaine: 570, prixMois: 2200, photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=260&fit=crop", categorie: "8 places" },
  { id: 7002, titre: "Mercedes Classe V 8pl", annee: 2024, places: 8, boite: "Automatique", prixJour: 120, prixSemaine: 720, prixMois: 2800, photo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=260&fit=crop", categorie: "8 places Premium" },
  { id: 7003, titre: "Mercedes Sprinter 9pl", annee: 2024, places: 9, boite: "Automatique", prixJour: 110, prixSemaine: 660, prixMois: 2500, photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=260&fit=crop", categorie: "9 places" },
  { id: 7004, titre: "Volkswagen Transporter 9pl", annee: 2023, places: 9, boite: "Manuelle", prixJour: 90, prixSemaine: 540, prixMois: 2100, photo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=260&fit=crop", categorie: "9 places" },
  { id: 7005, titre: "Ford Transit 9pl", annee: 2024, places: 9, boite: "Manuelle", prixJour: 85, prixSemaine: 510, prixMois: 1950, photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=260&fit=crop", categorie: "9 places" },
  { id: 7006, titre: "Renault Master 12pl", annee: 2023, places: 12, boite: "Manuelle", prixJour: 130, prixSemaine: 780, prixMois: 3000, photo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=260&fit=crop", categorie: "12-17 places" },
  { id: 7007, titre: "Mercedes Sprinter 17pl", annee: 2024, places: 17, boite: "Automatique", prixJour: 160, prixSemaine: 960, prixMois: 3700, photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=260&fit=crop", categorie: "12-17 places" },
  { id: 7008, titre: "Mercedes V-Class VIP", annee: 2024, places: 7, boite: "Automatique", prixJour: 180, prixSemaine: 1080, prixMois: 4200, photo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=260&fit=crop", categorie: "Premium" },
];

const OCCASIONS = [
  { label: "Mariage", icon: Heart },
  { label: "Groupe / Association", icon: Users },
  { label: "Séminaire", icon: Building2 },
  { label: "Voyage scolaire", icon: Bus },
  { label: "Famille nombreuse", icon: Users },
  { label: "Événement sportif", icon: Star },
];

const SERVICES = [
  { icon: Bus, label: "Large choix", desc: "De 7 à 17 places" },
  { icon: Shield, label: "Assurance incluse", desc: "Tous risques, franchise réduite" },
  { icon: Headphones, label: "Assistance 7j/7", desc: "Support dédié groupes" },
  { icon: Rocket, label: "Réservation instantanée", desc: "Confirmation immédiate" },
  { icon: Ban, label: "Sans appel", desc: "100% en ligne" },
  { icon: Lock, label: "Paiement sécurisé", desc: "CB, Apple Pay, Google Pay" },
];

const FAQ = [
  { q: "Quel permis pour un minibus ?", a: "Permis B pour les minibus jusqu'à 9 places (PTAC ≤ 3,5t). Au-delà de 9 places, permis D requis." },
  { q: "Puis-je louer pour un mariage ?", a: "Oui, nous proposons des minibus premium et VIP adaptés aux mariages. Livraison et retour inclus possible." },
  { q: "Documents nécessaires ?", a: "Permis de conduire (B ou D selon le véhicule), pièce d'identité, justificatif de domicile, carte bancaire." },
  { q: "Location avec chauffeur ?", a: "Option disponible sur demande pour les minibus de plus de 9 places." },
];

const TYPE_FILTER = ["Tous", "8 places", "9 places", "12-17 places", "Premium"];

export default function LocationMinibus() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [lieu, setLieu] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateRetour, setDateRetour] = useState("");
  const [filtre, setFiltre] = useState("Tous");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const filteredVehicules = VEHICULES.filter((v) => {
    if (selectedCat && v.categorie !== selectedCat) return false;
    if (filtre === "Tous") return true;
    return v.categorie.includes(filtre);
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24 max-w-6xl mx-auto">

      {/* BANNIÈRE */}
      <div className="relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&h=420&fit=crop" alt="Minibus" className="w-full h-[240px] md:h-[320px] lg:h-[400px] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111]/90 via-[#111]/40 to-transparent" />
        <Link to="/louer" className="absolute top-4 left-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur">
          <ChevronLeft size={20} className="text-[#111]" />
        </Link>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-700 px-2.5 py-1 text-[10px] font-bold text-white mb-2">
            <Bus size={10} /> MINIBUS
          </span>
          <h1 className="text-2xl font-black text-white leading-tight">LOCATION MINIBUS</h1>
          <p className="mt-1 text-sm text-white/80">Groupes, familles, associations — jusqu'à 17 places.</p>
          <button onClick={() => document.getElementById("search-mini")?.scrollIntoView({ behavior: "smooth" })} className="mt-3 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2">
            <Search size={14} /> Trouver un minibus
          </button>
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div id="search-mini" className="mx-4 -mt-4 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Lieu de retrait</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
              <MapPin size={14} className="text-red-500 shrink-0" />
              <input type="text" placeholder="Ville, gare, aéroport…" value={lieu} onChange={(e) => setLieu(e.target.value)} className="w-full bg-transparent text-sm text-[#111] placeholder:text-[#9CA3AF] outline-none" />
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
            <Search size={16} /> Rechercher un minibus
          </button>
        </div>
      </div>

      {/* OCCASIONS */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-[#111]">Pour quelle occasion ?</h2>
        <div className="mt-3 flex gap-2 flex-wrap">
          {OCCASIONS.map((o) => {
            const Icon = o.icon;
            return (
              <span key={o.label} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E5E7EB] px-3 py-1.5 text-xs font-semibold text-[#111]">
                <Icon size={12} className="text-[#D4AF37]" /> {o.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* CATÉGORIES */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-[#111]">Catégories minibus</h2>
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
          <h2 className="text-lg font-bold text-[#111]">Minibus disponibles</h2>
          <span className="text-xs text-[#6B7280]">{filteredVehicules.length} résultat{filteredVehicules.length > 1 ? "s" : ""}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicules.map((v) => (
            <Link key={v.id} to={`/louer/minibus/vehicule/${v.id}`} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden active:scale-[0.99] transition hover:shadow-lg">
              <div className="relative h-[160px] md:h-[180px] lg:h-[200px]">
                <img src={v.photo} alt={v.titre} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 left-2 rounded-full bg-purple-700 px-2.5 py-0.5 text-[9px] font-bold text-white">{v.categorie}</span>
                <span className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[#111]">{v.places} places</span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[#111]">{v.titre}</h3>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#6B7280]">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {v.annee}</span>
                  <span className="flex items-center gap-1"><Users size={10} /> {v.places} places</span>
                  <span className="flex items-center gap-1"><Gauge size={10} /> {v.boite}</span>
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
                    <div className="shrink-0 rounded-lg bg-purple-700/5 border border-purple-700/20 p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-purple-700 uppercase font-semibold">Mois</p>
                      <p className="text-sm font-black text-purple-700">{v.prixMois} €</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-purple-700/10 border border-purple-700/30 p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-purple-700 uppercase font-semibold">3 Mois</p>
                      <p className="text-sm font-black text-purple-700">{Math.round(v.prixMois * 2.7)} €</p>
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none flex items-center justify-end">
                    <ChevronRight size={14} className="text-red-500" />
                  </div>
                </div>
                <span className="mt-3 w-full rounded-xl bg-purple-700 py-3 text-sm font-bold text-white active:scale-[0.98] transition flex items-center justify-center gap-2">
                  Voir les détails <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-bold text-[#111]">Nos services minibus</h2>
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
        <Bus size={28} className="text-[#D4AF37] mx-auto" />
        <h2 className="text-lg font-black text-white mt-2">Transport de groupe sur mesure ?</h2>
        <p className="text-xs text-white/70 mt-1">Devis personnalisé pour événements, séminaires et voyages.</p>
        <Link to="/louer/pro" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white">
          Demander un devis <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
}
