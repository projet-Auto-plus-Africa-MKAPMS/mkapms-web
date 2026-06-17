import { Link } from "react-router-dom";
import { Shield, Car, Users, Truck, HardHat, Bus, CarFront, ChevronRight, Star, Clock, Headphones, CreditCard } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   UNIVERS LOCATION — Portes d'entrée
   Chaque univers est un monde séparé avec ses propres véhicules,
   textes, filtres et parcours de réservation.
   ══════════════════════════════════════════════════════════════════════════ */

const UNIVERS = [
  {
    id: "vtc-taxi",
    titre: "Location VTC & Taxi",
    desc: "Véhicules premium conformes VTC et Taxi. Berlines, breaks, vans. Prêts à travailler.",
    badge: "VTC & TAXI",
    badgeColor: "bg-[#111] text-[#D4AF37] border-[#D4AF37]",
    photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=600&h=340&fit=crop",
    icon: Shield,
    to: "/louer/vtc-taxi",
    count: "14 véhicules",
    highlight: true,
  },
  {
    id: "particulier",
    titre: "Location Particulier",
    desc: "Citadines, berlines, SUV. Week-end, vacances, dépannage temporaire. Simple et rapide.",
    badge: "PARTICULIER",
    badgeColor: "bg-[#D4AF37] text-white",
    photo: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=340&fit=crop",
    icon: CarFront,
    to: "/louer/particulier",
    count: "32 véhicules",
    highlight: false,
  },
  {
    id: "pro",
    titre: "Location Pro / Entreprise",
    desc: "Flotte d'entreprise, utilitaires, longue durée. Contrats sur mesure, facturation pro.",
    badge: "PRO",
    badgeColor: "bg-blue-800 text-white",
    photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600&h=340&fit=crop",
    icon: Users,
    to: "/louer/pro",
    count: "18 véhicules",
    highlight: false,
  },
  {
    id: "utilitaires",
    titre: "Utilitaires & Camionnettes",
    desc: "Kangoo, Trafic, Master, Transit. Pour déménagements, livraisons, chantiers.",
    badge: "UTILITAIRE",
    badgeColor: "bg-orange-600 text-white",
    photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=600&h=340&fit=crop",
    icon: Truck,
    to: "/louer/utilitaires",
    count: "12 véhicules",
    highlight: false,
  },
  {
    id: "camions",
    titre: "Camions / Engins",
    desc: "Camions, bennes, engins de chantier. Location courte et longue durée.",
    badge: "CAMION",
    badgeColor: "bg-[#333] text-white",
    photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&h=340&fit=crop",
    icon: HardHat,
    to: "/louer/camions",
    count: "8 véhicules",
    highlight: false,
  },
  {
    id: "minibus",
    titre: "Minibus",
    desc: "Transport de groupe, événements, navettes. 9 à 22 places.",
    badge: "MINIBUS",
    badgeColor: "bg-purple-700 text-white",
    photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&h=340&fit=crop",
    icon: Bus,
    to: "/louer/minibus",
    count: "6 véhicules",
    highlight: false,
  },
];

export default function Louer() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-[#111] px-4 pt-6 pb-8">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&h=400&fit=crop"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white leading-tight">
            Location de véhicules
          </h1>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            Choisissez votre univers. Chaque catégorie a ses propres véhicules, tarifs et parcours de réservation.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/20 px-2.5 py-1 text-[11px] font-semibold text-[#D4AF37]">
              <Star size={10} fill="#D4AF37" /> Réservation 100% en ligne
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
              <Clock size={10} /> En moins de 3 min
            </span>
          </div>
        </div>
      </div>

      {/* ── Univers — Portes d'entrée ── */}
      <div className="px-4 -mt-4 relative z-10 space-y-3">
        {UNIVERS.map((u) => {
          const Icon = u.icon;
          return (
            <Link
              key={u.id}
              to={u.to}
              className={`group block rounded-2xl bg-white overflow-hidden border-2 transition hover:shadow-lg active:scale-[0.99] ${
                u.highlight ? "border-[#D4AF37]/40 shadow-md" : "border-[#E5E7EB]"
              }`}
            >
              {/* Photo */}
              <div className="relative h-[160px] overflow-hidden">
                <img
                  src={u.photo}
                  alt={u.titre}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {/* Badge */}
                <span className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border ${u.badgeColor}`}>
                  <Icon size={12} /> {u.badge}
                </span>
                {/* Compteur */}
                <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#111]">
                  {u.count}
                </span>
                {/* Titre sur photo */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h2 className="text-lg font-extrabold text-white drop-shadow-lg">{u.titre}</h2>
                </div>
              </div>
              {/* Description */}
              <div className="flex items-center gap-3 px-4 py-3">
                <p className="flex-1 text-xs text-[#6B7280] leading-relaxed">{u.desc}</p>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10">
                  <ChevronRight size={16} className="text-[#D4AF37]" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Avantages plateforme ── */}
      <div className="mx-4 mt-6 rounded-2xl bg-[#111] p-5">
        <h2 className="text-base font-bold text-white text-center">Pourquoi louer chez MKA.P-MS ?</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { icon: CreditCard, label: "Paiement sécurisé", desc: "CB, Apple Pay, Google Pay" },
            { icon: Clock, label: "Réservation rapide", desc: "En moins de 3 minutes" },
            { icon: Headphones, label: "Assistance 24/7", desc: "Support dédié 7j/7" },
            { icon: Shield, label: "Véhicules contrôlés", desc: "Révisés et assurés" },
          ].map((a, i) => {
            const AIcon = a.icon;
            return (
              <div key={i} className="rounded-xl bg-white/5 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37]/20">
                  <AIcon size={16} className="text-[#D4AF37]" />
                </div>
                <h3 className="mt-2 text-xs font-bold text-white">{a.label}</h3>
                <p className="text-[10px] text-white/50">{a.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Besoin d'aide ── */}
      <div className="mx-4 mt-4 mb-6 rounded-2xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
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
