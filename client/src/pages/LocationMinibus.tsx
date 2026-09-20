import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import {
  ChevronLeft, ChevronRight, Search, MapPin, Bus,
  Shield, Lock, Headphones, ChevronDown,
  Rocket, Ban, ArrowRight, Users, Heart, Building2, Star,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE LISTING MINIBUS (/louer/minibus)
   Affichait un catalogue de 8 minibus entièrement fabriqués (ids
   7001-7008, prix inventés), des sous-catégories à compteurs inventés
   ("8 véhicules"...), et un bouton "Rechercher" sans aucun gestionnaire de
   clic. Aucune requête réelle n'existait — contrairement à
   LocationUtilitaires.tsx/LocationCamions.tsx qui interrogeaient déjà
   trpc.annonces.list.
   Il n'existe aucune valeur "minibus" dans categorieEnum côté serveur
   (citadine/berline/break/suv/coupe/cabriolet/monospace/utilitaire/camion/
   moto/scooter/quad/luxe/autre) : plutôt que d'approximer avec une
   catégorie inexacte (fabrication déguisée), le filtre réel utilisé ici est
   le nombre de places (annonces.places, champ réel à correspondance
   exacte), bien plus pertinent pour un minibus que sa carrosserie.
   ══════════════════════════════════════════════════════════════════════════ */

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

const PLACES_FILTER = [7, 8, 9, 12, 17];

export default function LocationMinibus() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [lieu, setLieu] = useState("");
  const [rechercheLieu, setRechercheLieu] = useState("");
  const [placesFiltre, setPlacesFiltre] = useState<number | null>(null);

  const realAnnonces = trpc.annonces.list.useQuery(
    { type: "location", places: placesFiltre ?? undefined, ville: rechercheLieu || undefined, limit: 24 },
    { retry: false },
  );
  const annoncesTrouvees = realAnnonces.data?.items ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24 max-w-6xl mx-auto">

      {/* BANNIÈRE */}
      <div className="relative overflow-hidden">
        <img src="/categories/loc_cover_minibus.jpg" alt="Minibus" className="w-full h-[240px] md:h-[320px] lg:h-[400px] object-cover" />
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

      {/* BARRE DE RECHERCHE — lieu + nombre de places réels */}
      <div id="search-mini" className="mx-4 -mt-4 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Lieu de retrait</label>
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
          <MapPin size={14} className="text-red-500 shrink-0" />
          <input type="text" placeholder="Ville, gare, aéroport…" value={lieu} onChange={(e) => setLieu(e.target.value)} className="w-full bg-transparent text-sm text-[#111] placeholder:text-[#9CA3AF] outline-none" />
        </div>
        <label className="mt-3 block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Nombre de places</label>
        <div className="mt-1 flex gap-2 flex-wrap">
          <button onClick={() => setPlacesFiltre(null)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${placesFiltre === null ? "bg-[#D4AF37] text-white" : "bg-[#F5F3EF] text-[#111]"}`}>Toutes</button>
          {PLACES_FILTER.map((p) => (
            <button key={p} onClick={() => setPlacesFiltre(p)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${placesFiltre === p ? "bg-[#D4AF37] text-white" : "bg-[#F5F3EF] text-[#111]"}`}>{p} places</button>
          ))}
        </div>
        <button
          onClick={() => setRechercheLieu(lieu)}
          className="mt-3 w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-extrabold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md"
        >
          <Search size={16} /> Rechercher un minibus
        </button>
      </div>

      {/* OCCASIONS — informatif, aucune donnée chiffrée */}
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

      {/* VÉHICULES — annonces réelles uniquement */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#111]">Minibus disponibles</h2>
          {realAnnonces.isSuccess && <span className="text-xs text-[#6B7280]">{annoncesTrouvees.length} résultat{annoncesTrouvees.length > 1 ? "s" : ""}</span>}
        </div>
        {realAnnonces.isLoading && <p className="text-sm text-[#6B7280]">Chargement…</p>}
        {realAnnonces.isSuccess && annoncesTrouvees.length === 0 && (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center text-xs text-[#6B7280]">
            Aucune annonce réelle de minibus ne correspond à cette recherche pour le moment.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {annoncesTrouvees.map((a) => (
            <Link key={a.id} to={`/louer/minibus/vehicule/${a.id}`} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden active:scale-[0.99] transition hover:shadow-lg">
              <div className="relative h-[160px] md:h-[180px] lg:h-[200px] bg-[#F5F3EF]">
                {a.photoPrincipale && <img src={a.photoPrincipale} alt={a.titre ?? ""} className="w-full h-full object-cover" loading="lazy" />}
                <span className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[#111]">{a.places ? `${a.places} places` : ""}</span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[#111] truncate">{a.titre || `${a.marque ?? ""} ${a.modele ?? ""}`}</h3>
                <p className="mt-2 text-base font-black text-purple-700">
                  {Math.round(Number(a.prixJour ?? a.prix))} €<span className="text-[10px] font-normal text-[#6B7280]"> / jour</span>
                </p>
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
