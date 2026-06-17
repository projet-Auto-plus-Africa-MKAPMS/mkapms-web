import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield, CarFront, Users, Truck, HardHat, Bus, ChevronRight, Star, Clock,
  Headphones, CreditCard, Search, MapPin, Calendar, ChevronDown, FileCheck,
  Lock, Globe, Rocket, Ban, Phone, Gauge, ArrowRight, Building2, UserPlus,
  CheckCircle2, MapPinned, Navigation
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE D'ACCUEIL LOCATION GÉNÉRALE
   Porte d'entrée de tout l'univers Location.
   Ne mélange pas les services. Oriente vers le bon univers.
   ══════════════════════════════════════════════════════════════════════════ */

const UNIVERS = [
  {
    id: "vtc-taxi",
    titre: "Location VTC & Taxi",
    desc: "Pour chauffeurs, taxis, sociétés et indépendants.",
    bouton: "Voir les véhicules VTC & Taxi",
    badge: "VTC & TAXI",
    badgeColor: "bg-[#111] text-[#D4AF37] border-[#D4AF37]",
    photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=600&h=360&fit=crop",
    icon: Shield,
    to: "/louer/vtc-taxi",
  },
  {
    id: "particulier",
    titre: "Location Particulier",
    desc: "Pour week-end, vacances, remplacement ou besoin temporaire.",
    bouton: "Louer une voiture",
    badge: "PARTICULIER",
    badgeColor: "bg-[#D4AF37] text-white border-transparent",
    photo: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=360&fit=crop",
    icon: CarFront,
    to: "/louer/particulier",
  },
  {
    id: "pro",
    titre: "Location Pro / Entreprise",
    desc: "Pour entreprises, artisans, flottes et professionnels.",
    bouton: "Voir les solutions pro",
    badge: "PRO / ENTREPRISE",
    badgeColor: "bg-blue-800 text-white border-transparent",
    photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600&h=360&fit=crop",
    icon: Users,
    to: "/louer/pro",
  },
  {
    id: "utilitaires",
    titre: "Utilitaires & Camionnettes",
    desc: "Pour livraison, déménagement, chantier ou transport.",
    bouton: "Voir les utilitaires",
    badge: "UTILITAIRE",
    badgeColor: "bg-orange-600 text-white border-transparent",
    photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=600&h=360&fit=crop",
    icon: Truck,
    to: "/louer/utilitaires",
  },
  {
    id: "camions",
    titre: "Camions & Engins",
    desc: "Pour poids lourds, bennes, plateaux, chantiers et besoins lourds.",
    bouton: "Voir les camions",
    badge: "CAMION / ENGIN",
    badgeColor: "bg-[#333] text-white border-transparent",
    photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&h=360&fit=crop",
    icon: HardHat,
    to: "/louer/camions",
  },
  {
    id: "minibus",
    titre: "Minibus",
    desc: "Pour groupes, familles, associations et transport collectif.",
    bouton: "Voir les minibus",
    badge: "MINIBUS",
    badgeColor: "bg-purple-700 text-white border-transparent",
    photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&h=360&fit=crop",
    icon: Bus,
    to: "/louer/minibus",
  },
];

const VEHICULES_POPULAIRES = [
  { titre: "Mercedes Classe E Break", type: "VTC & Taxi", prix: 63, photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop", to: "/louer/vtc-taxi" },
  { titre: "Peugeot 3008 GT", type: "SUV", prix: 55, photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop", to: "/louer/particulier" },
  { titre: "Renault Trafic L2H1", type: "Utilitaire", prix: 75, photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=260&fit=crop", to: "/louer/utilitaires" },
  { titre: "Ford Transit Custom", type: "Camionnette", prix: 85, photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=260&fit=crop", to: "/louer/utilitaires" },
  { titre: "Mercedes Sprinter 9 pl.", type: "Minibus", prix: 120, photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=260&fit=crop", to: "/louer/minibus" },
];

const FAQ_DATA = [
  { q: "Comment réserver un véhicule ?", a: "Choisissez votre univers (VTC, Particulier, Pro…), sélectionnez un véhicule, remplissez vos dates, ajoutez vos options, payez en ligne. Vous recevez votre confirmation immédiatement par email." },
  { q: "Quels documents fournir ?", a: "Pièce d'identité en cours de validité, permis de conduire (minimum 2 ans), justificatif de domicile de moins de 3 mois. Pour les pros : Kbis ou carte VTC/licence taxi." },
  { q: "Comment fonctionne la caution ?", a: "Une empreinte bancaire est prise lors de la réservation (non débitée). Elle est libérée sous 7 jours ouvrés après restitution du véhicule en bon état." },
  { q: "Peut-on annuler une réservation ?", a: "Annulation gratuite jusqu'à 48h avant la prise en charge. Entre 48h et 24h : 50% du montant. Moins de 24h : montant total." },
  { q: "Comment récupérer le véhicule ?", a: "Après confirmation, présentez-vous au point de retrait avec votre pièce d'identité et votre code de réservation. Le véhicule est prêt et inspecté." },
  { q: "Comment devenir partenaire location ?", a: "Cliquez sur « Devenir partenaire location » en bas de page. Remplissez le formulaire, envoyez vos documents. Notre équipe vous contacte sous 48h pour valider votre accès." },
];

const TYPE_VEHICULE = [
  "Tous types",
  "Berline",
  "SUV",
  "Utilitaire",
  "Camionnette",
  "Minibus",
  "Camion",
];

export default function Louer() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [lieu, setLieu] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateRetour, setDateRetour] = useState("");
  const [typeVehicule, setTypeVehicule] = useState("Tous types");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — TITRE PRINCIPAL
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-[#111] px-4 pt-6 pb-10">
        <div className="absolute inset-0 opacity-15">
          <img
            src="https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&h=400&fit=crop"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative z-10">
          <h1 className="text-[22px] font-black text-white leading-tight">
            Location de véhicules<br />
            <span className="text-[#D4AF37]">MKA.P-MS</span>
          </h1>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            Choisissez votre besoin et accédez à l'univers adapté.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — BARRE DE RECHERCHE RAPIDE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 -mt-6 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        <div className="space-y-3">
          {/* Lieu de retrait */}
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Lieu de retrait</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
              <MapPin size={14} className="text-[#D4AF37] shrink-0" />
              <input
                type="text"
                placeholder="Ville, gare, aéroport…"
                value={lieu}
                onChange={(e) => setLieu(e.target.value)}
                className="w-full bg-transparent text-sm text-[#111] placeholder:text-[#9CA3AF] outline-none"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Date départ</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
                <Calendar size={14} className="text-[#D4AF37] shrink-0" />
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#111] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Date retour</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
                <Calendar size={14} className="text-[#D4AF37] shrink-0" />
                <input
                  type="date"
                  value={dateRetour}
                  onChange={(e) => setDateRetour(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#111] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Type de véhicule */}
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Type de véhicule</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
              <CarFront size={14} className="text-[#D4AF37] shrink-0" />
              <select
                value={typeVehicule}
                onChange={(e) => setTypeVehicule(e.target.value)}
                className="w-full bg-transparent text-sm text-[#111] outline-none"
              >
                {TYPE_VEHICULE.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bouton Rechercher */}
          <button className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-extrabold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md">
            <Search size={16} /> Rechercher
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — UNIVERS LOCATION
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-[#111]">Choisissez votre univers</h2>
        <p className="text-xs text-[#6B7280] mt-0.5">Chaque univers a ses propres véhicules, tarifs et parcours.</p>

        <div className="mt-4 space-y-4">
          {UNIVERS.map((u) => {
            const Icon = u.icon;
            return (
              <Link
                key={u.id}
                to={u.to}
                className="group block rounded-2xl bg-white overflow-hidden border border-[#E5E7EB] transition hover:shadow-lg active:scale-[0.99]"
              >
                {/* Photo */}
                <div className="relative h-[180px] overflow-hidden">
                  <img
                    src={u.photo}
                    alt={u.titre}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Badge */}
                  <span className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border ${u.badgeColor}`}>
                    <Icon size={12} /> {u.badge}
                  </span>
                  {/* Titre sur photo */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-extrabold text-white drop-shadow-lg">{u.titre}</h3>
                    <p className="text-xs text-white/80 mt-0.5">{u.desc}</p>
                  </div>
                </div>
                {/* Bouton */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-bold text-[#D4AF37]">{u.bouton}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/10">
                    <ChevronRight size={16} className="text-[#D4AF37]" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — COMMENT ÇA MARCHE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-8 rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#111] px-4 py-3">
          <h2 className="text-base font-bold text-white">Comment ça marche ?</h2>
        </div>
        <div className="px-4 py-4 space-y-0">
          {[
            { n: "1", title: "Choisissez votre univers", desc: "VTC, Particulier, Pro, Utilitaire…" },
            { n: "2", title: "Sélectionnez votre véhicule", desc: "Parcourez les offres et trouvez le véhicule adapté." },
            { n: "3", title: "Envoyez vos documents", desc: "Pièce d'identité, permis, justificatifs — tout se fait en ligne." },
            { n: "4", title: "Payez en ligne", desc: "Paiement sécurisé par CB, Apple Pay, Google Pay." },
            { n: "5", title: "Récupérez le véhicule", desc: "Présentez-vous avec votre pièce d'identité et votre code." },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-white">{s.n}</div>
                {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-[#D4AF37]/20 my-1" />}
              </div>
              <div className="pb-4">
                <h3 className="text-sm font-bold text-[#111]">{s.title}</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-[#F5F3EF] p-3">
            <p className="text-xs text-[#6B7280] leading-relaxed text-center">
              <span className="font-semibold text-[#111]">Tout se fait directement dans MKA.P-MS :</span> demande, documents, paiement, contrat et suivi.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — AVANTAGES MKA.P-MS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-6 rounded-2xl bg-[#111] p-5">
        <h2 className="text-base font-bold text-white text-center">Avantages MKA.P-MS</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { icon: Globe, label: "Réservation en ligne" },
            { icon: Lock, label: "Paiement sécurisé" },
            { icon: FileCheck, label: "Contrat numérique" },
            { icon: CheckCircle2, label: "Documents suivis" },
            { icon: Shield, label: "Véhicules vérifiés" },
            { icon: Headphones, label: "Assistance disponible" },
            { icon: Ban, label: "Aucun appel obligatoire" },
            { icon: Clock, label: "Gain de temps" },
          ].map((a, i) => {
            const AIcon = a.icon;
            return (
              <div key={i} className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/20">
                  <AIcon size={14} className="text-[#D4AF37]" />
                </div>
                <span className="text-xs font-semibold text-white leading-tight">{a.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — CARTE INTERACTIVE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-6 rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-4">
          <h2 className="text-base font-bold text-[#111]">Trouvez une agence ou un point de retrait</h2>
          <p className="text-xs text-[#6B7280] mt-1">Agences partenaires, points de retrait, garages et véhicules disponibles autour de vous.</p>
        </div>
        {/* Carte placeholder */}
        <div className="relative h-[200px] bg-[#E5E7EB]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPinned size={32} className="text-[#D4AF37] mx-auto" />
              <p className="mt-2 text-sm font-semibold text-[#6B7280]">Carte interactive</p>
              <p className="text-[10px] text-[#9CA3AF]">Agences · Points de retrait · Garages</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 flex gap-2">
          <button className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-[0.98] transition">
            <Navigation size={12} /> Voir sur la carte
          </button>
          <button className="flex-1 rounded-xl border-2 border-[#D4AF37] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1.5 active:scale-[0.98] transition">
            <CarFront size={12} /> Véhicules disponibles
          </button>
        </div>
        <div className="px-4 pb-3">
          <p className="text-[10px] text-[#9CA3AF] text-center">La carte sert à localiser. La réservation se fait dans MKA.P-MS.</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7 — VÉHICULES POPULAIRES
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111]">Véhicules populaires</h2>
          <Link to="/louer" className="text-xs font-semibold text-[#D4AF37]">Voir tout →</Link>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-3 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
          {VEHICULES_POPULAIRES.map((v, i) => (
            <Link key={i} to={v.to} className="w-[200px] shrink-0 rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-md transition active:scale-[0.98]">
              <div className="relative h-[120px]">
                <img src={v.photo} alt={v.titre} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 left-2 rounded-full bg-[#111]/80 px-2 py-0.5 text-[9px] font-bold text-[#D4AF37]">{v.type}</span>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-[#111] truncate">{v.titre}</h3>
                <p className="text-sm font-bold text-[#D4AF37] mt-1">{v.prix} € <span className="text-[10px] font-normal text-[#6B7280]">/ jour</span></p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 8 — ESPACE PROFESSIONNEL
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-6 rounded-2xl border-2 border-[#D4AF37] bg-[#D4AF37]/5 overflow-hidden">
        <div className="p-5 text-center">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-[#D4AF37]/10">
            <Building2 size={24} className="text-[#D4AF37]" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-[#111]">Vous êtes loueur professionnel ?</h2>
          <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
            Ajoutez vos véhicules, gérez vos réservations, recevez vos paiements et développez votre activité avec MKA.P-MS.
          </p>
          <Link
            to="/espace-pro"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white active:scale-[0.98] transition shadow-md"
          >
            <UserPlus size={16} /> Devenir partenaire location
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 9 — FAQ LOCATION
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white mx-4 mt-6 rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F3F4F6]">
          <h2 className="text-base font-bold text-[#111]">Questions fréquentes</h2>
        </div>
        <div className="px-4">
          {FAQ_DATA.map((f, i) => (
            <div key={i} className="border-b border-[#F3F4F6] last:border-0">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between py-3.5 text-left"
              >
                <span className="text-sm font-semibold text-[#111] pr-4">{f.q}</span>
                <ChevronDown size={16} className={`shrink-0 text-[#6B7280] transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <p className="pb-3 text-xs text-[#6B7280] leading-relaxed">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Besoin d'aide ── */}
      <div className="mx-4 mt-6 mb-6 rounded-2xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10">
          <Headphones size={20} className="text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111]">Besoin d'aide ?</h3>
          <p className="text-xs text-[#6B7280]">Chat en ligne ou 09 70 70 50 50</p>
          <p className="text-[10px] text-[#6B7280]">7j/7 de 8h à 20h</p>
        </div>
      </div>

    </div>
  );
}
