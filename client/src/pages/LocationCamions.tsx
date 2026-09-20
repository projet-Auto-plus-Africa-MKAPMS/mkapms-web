import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import {
  ChevronLeft, ChevronRight, Search, MapPin, Truck,
  Shield, Lock, Headphones, ChevronDown,
  Rocket, Ban, ArrowRight, HardHat, Building2,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE LISTING CAMIONS & ENGINS (/louer/camions)
   Affichait un catalogue de 8 camions entièrement fabriqués (ids 6001-6008,
   prix inventés) et des sous-catégories avec des compteurs inventés
   ("8 véhicules", "5 véhicules"...). Pire : ces ids fabriqués menaient vers
   ProduitLocation.tsx qui, ne les reconnaissant pas comme des démonstrations
   connues, tentait une vraie requête trpc.annonces.get(id) — donc soit une
   fiche introuvable, soit pire, la fiche d'une tout autre annonce réelle qui
   porterait le même id par coïncidence. Remplacé par le vrai catalogue
   trpc.annonces.list (categorie: "camion", déjà interrogé plus haut dans ce
   fichier) affiché directement, sans recherche préalable requise, avec un
   état honnête si aucune annonce réelle n'existe. Aucune sous-catégorie
   fabriquée (bennes, plateaux...) : ce champ n'existe pas dans le schéma
   réel des annonces (categorieEnum ne connaît que "camion" comme valeur de
   haut niveau). Les dates de location ont été retirées de cette recherche :
   aucun moteur de disponibilité par date n'existe encore pour les annonces
   de location (même lacune que la tâche #56 côté flotte pro) — les
   conserver aurait laissé croire à un filtrage qui n'a jamais lieu.
   ══════════════════════════════════════════════════════════════════════════ */

const SERVICES = [
  { icon: Truck, label: "Livraison sur chantier", desc: "Acheminé directement sur site" },
  { icon: Shield, label: "Assurance incluse", desc: "Tous risques professionnels" },
  { icon: Headphones, label: "Assistance 24h/24", desc: "Support dédié poids lourds" },
  { icon: Rocket, label: "Réservation rapide", desc: "Disponibilité immédiate" },
  { icon: Ban, label: "Sans appel obligatoire", desc: "Tout se fait en ligne" },
  { icon: Lock, label: "Paiement sécurisé", desc: "CB, virement, Apple Pay" },
];

const FAQ = [
  { q: "Quel permis pour un camion ?", a: "Permis C pour les véhicules de plus de 3,5 tonnes. Permis CE pour les ensembles articulés. Permis B suffisant pour certains engins de chantier." },
  { q: "Livraison sur chantier possible ?", a: "Oui, nous livrons directement sur votre site ou chantier. Supplément applicable selon la distance." },
  { q: "Documents nécessaires ?", a: "Permis C/CE, pièce d'identité, KBIS ou SIRET, carte bancaire, attestation d'assurance." },
  { q: "Location longue durée ?", a: "Tarifs dégressifs pour les locations de plus d'un mois. Contactez notre service pro pour un devis personnalisé." },
];

export default function LocationCamions() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [lieu, setLieu] = useState("");
  const [rechercheLieu, setRechercheLieu] = useState("");

  const realAnnonces = trpc.annonces.list.useQuery(
    { type: "location", categorie: "camion", ville: rechercheLieu || undefined, limit: 24 },
    { retry: false },
  );
  const annoncesTrouvees = realAnnonces.data?.items ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24 max-w-6xl mx-auto">

      {/* BANNIÈRE */}
      <div className="relative overflow-hidden">
        <img src="/categories/loc_cover_camions.jpg" alt="Camions" className="w-full h-[240px] md:h-[320px] lg:h-[400px] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111]/90 via-[#111]/40 to-transparent" />
        <Link to="/louer" className="absolute top-4 left-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur">
          <ChevronLeft size={20} className="text-[#111]" />
        </Link>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#333] px-2.5 py-1 text-[10px] font-bold text-white mb-2">
            <HardHat size={10} /> CAMION / ENGIN
          </span>
          <h1 className="text-2xl font-black text-white leading-tight">CAMIONS & ENGINS</h1>
          <p className="mt-1 text-sm text-white/80">Poids lourds, bennes, plateaux et engins de chantier.</p>
          <button onClick={() => document.getElementById("search-cam")?.scrollIntoView({ behavior: "smooth" })} className="mt-3 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2">
            <Search size={14} /> Trouver un camion
          </button>
        </div>
      </div>

      {/* BARRE DE RECHERCHE — lieu réel uniquement, aucune date fabriquée */}
      <div id="search-cam" className="mx-4 -mt-4 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Lieu de retrait</label>
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
          <MapPin size={14} className="text-red-500 shrink-0" />
          <input type="text" placeholder="Ville, zone industrielle, chantier…" value={lieu} onChange={(e) => setLieu(e.target.value)} className="w-full bg-transparent text-sm text-[#111] placeholder:text-[#9CA3AF] outline-none" />
        </div>
        <button
          onClick={() => setRechercheLieu(lieu)}
          className="mt-3 w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-extrabold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md"
        >
          <Search size={16} /> Rechercher un camion / engin
        </button>
      </div>

      {/* VÉHICULES — annonces réelles uniquement */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#111]">Camions & engins disponibles</h2>
          {realAnnonces.isSuccess && <span className="text-xs text-[#6B7280]">{annoncesTrouvees.length} résultat{annoncesTrouvees.length > 1 ? "s" : ""}</span>}
        </div>
        {realAnnonces.isLoading && <p className="text-sm text-[#6B7280]">Chargement…</p>}
        {realAnnonces.isSuccess && annoncesTrouvees.length === 0 && (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center text-xs text-[#6B7280]">
            Aucune annonce réelle de camion/engin ne correspond à cette recherche pour le moment.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {annoncesTrouvees.map((a) => (
            <Link key={a.id} to={`/louer/camions/vehicule/${a.id}`} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden active:scale-[0.99] transition hover:shadow-lg">
              <div className="relative h-[160px] md:h-[180px] lg:h-[200px] bg-[#F5F3EF]">
                {a.photoPrincipale && <img src={a.photoPrincipale} alt={a.titre ?? ""} className="w-full h-full object-cover" loading="lazy" />}
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[#111] truncate">{a.titre || `${a.marque ?? ""} ${a.modele ?? ""}`}</h3>
                <p className="mt-2 text-base font-black text-[#D4AF37]">
                  {Math.round(Number(a.prixJour ?? a.prix))} €<span className="text-[10px] font-normal text-[#6B7280]"> / jour</span>
                </p>
                <span className="mt-3 w-full rounded-xl bg-[#333] py-3 text-sm font-bold text-white active:scale-[0.98] transition flex items-center justify-center gap-2">
                  Voir les détails <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-bold text-[#111]">Services inclus</h2>
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
        <h2 className="text-lg font-black text-white mt-2">Besoin d'une flotte poids lourds ?</h2>
        <p className="text-xs text-white/70 mt-1">Devis personnalisé pour entreprises et chantiers.</p>
        <Link to="/louer/pro" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white">
          Solutions Pro <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
}
