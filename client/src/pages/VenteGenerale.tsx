import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Search, Car, Bike, Truck, Shield, Tag, Gavel,
  Calculator, History, ArrowRightLeft, PlusCircle, Building2,
  ChevronRight, Star, MapPin, HelpCircle, ChevronDown, Phone
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE GÉNÉRALE — PORTE D'ENTRÉE
   Le client ne voit PAS les véhicules. Il voit les univers.
   ══════════════════════════════════════════════════════════════════════════ */

const UNIVERS = [
  { id: "mkapms", label: "Acheter un véhicule certifié MKA.P-MS", desc: "Véhicules MKA.P-MS : contrôle qualité, historique complet, Finance+, garantie.", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=600&h=400&fit=crop", to: "/acheter/mkapms-officiel", badge: "MKA.P-MS Officiel", badgeColor: "bg-[#111] text-[#D4AF37]" },
  { id: "pro", label: "Acheter un véhicule professionnel", desc: "Garages, marchands, concessionnaires. Garantie, historique, factures.", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&h=400&fit=crop", to: "/acheter/professionnel", badge: "Professionnel", badgeColor: "bg-blue-800 text-white" },
  { id: "particulier", label: "Acheter un véhicule", desc: "Citadines, berlines, SUV, monospaces entre particuliers et pros.", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600&h=400&fit=crop", to: "/acheter/particulier", badge: "Particulier", badgeColor: "bg-[#D4AF37] text-white" },
  { id: "moto", label: "Acheter une moto", desc: "Scooters, 125, routières, trail, sportives, cross.", photo: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&h=400&fit=crop", to: "/acheter/moto", badge: "Moto", badgeColor: "bg-red-600 text-white" },
  { id: "utilitaires", label: "Acheter un utilitaire", desc: "Kangoo, Berlingo, Partner, Trafic, Master, Boxer.", photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&h=400&fit=crop", to: "/acheter/utilitaires", badge: "Utilitaires", badgeColor: "bg-orange-600 text-white" },
  { id: "camions", label: "Acheter un camion", desc: "Porte-voitures, bennes, frigorifiques, poids lourds.", photo: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&h=400&fit=crop", to: "/acheter/camions", badge: "Camions", badgeColor: "bg-gray-700 text-white" },
  { id: "vtc", label: "Acheter un véhicule VTC / Taxi", desc: "Véhicules adaptés à l'activité VTC et Taxi avec revenus estimés.", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop", to: "/acheter/vtc-taxi", badge: "VTC & Taxi", badgeColor: "bg-[#111] text-[#D4AF37]" },
  { id: "promo", label: "Promotions & Déstockage", desc: "Offres limitées, fins de série, déstockage, prix réduits.", photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&h=400&fit=crop", to: "/acheter/promotions", badge: "Promo", badgeColor: "bg-green-600 text-white" },
  { id: "encheres", label: "Vente aux enchères", desc: "Réservé aux professionnels validés. Lots, reprises, vente rapide.", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&h=400&fit=crop", to: "/acheter/encheres", badge: "Enchères", badgeColor: "bg-purple-700 text-white" },
];

const SERVICES = [
  { label: "Estimation automobile", desc: "Estimez la valeur de votre véhicule en 30 secondes.", icon: Calculator, to: "/acheter/estimation" },
  { label: "Historique véhicule", desc: "VIN ou immatriculation : km, CT, sinistres, gage.", icon: History, to: "/acheter/historique-vehicule" },
  { label: "Reprise véhicule", desc: "Déposez votre véhicule, recevez une proposition.", icon: ArrowRightLeft, to: "/acheter/reprise" },
  { label: "Déposer une annonce", desc: "Vendez votre véhicule sur MKA.P-MS.", icon: PlusCircle, to: "/acheter/depot-annonce" },
  { label: "Espace professionnels", desc: "Garages, marchands : abonnements et gestion.", icon: Building2, to: "/acheter/espace-pro" },
];

const FAQ_VENTE = [
  { q: "Comment acheter un véhicule sur MKA.P-MS ?", r: "Choisissez votre univers, trouvez le véhicule, consultez le rapport complet, contactez le vendeur et finalisez la transaction en toute sécurité dans MKA.P-MS." },
  { q: "Comment vérifier l'historique d'un véhicule ?", r: "Utilisez notre outil Historique Véhicule avec le VIN ou l'immatriculation. Vous obtiendrez km, CT, sinistres, gage et propriétaires." },
  { q: "Puis-je financer mon achat ?", r: "Oui, MKA.P-MS propose Finance+ avec simulation de crédit, LOA et paiement fractionné directement dans la plateforme." },
  { q: "Comment fonctionne la garantie ?", r: "Les véhicules professionnels et certifiés MKA.P-MS sont couverts par une garantie. Les ventes entre particuliers dépendent du vendeur." },
  { q: "Comment vendre mon véhicule ?", r: "Déposez votre annonce gratuitement ou utilisez notre service de reprise pour une vente rapide et sécurisée." },
];

export default function VenteGenerale() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* HERO */}
      <div className="bg-[#111] px-4 pt-6 pb-6">
        <h1 className="text-2xl font-black text-white text-center">Achat de véhicules MKA.P-MS</h1>
        <p className="mt-1 text-sm text-white/60 text-center">Choisissez votre univers et trouvez le véhicule adapté.</p>
      </div>

      {/* RECHERCHE RAPIDE */}
      <div className="px-4 -mt-3 relative z-10">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
          <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
            <Search size={14} className="text-[#6B7280]" />
            <input type="text" placeholder="Marque, modèle, référence…" className="w-full bg-transparent text-sm outline-none" />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <select className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-xs bg-white"><option>Budget</option><option>- 5 000 €</option><option>5 - 10 000 €</option><option>10 - 20 000 €</option><option>20 000+ €</option></select>
            <select className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-xs bg-white"><option>Type</option><option>Voiture</option><option>Moto</option><option>Utilitaire</option><option>Camion</option></select>
            <button className="rounded-lg bg-[#D4AF37] py-2 text-xs font-bold text-white">Chercher</button>
          </div>
        </div>
      </div>

      {/* UNIVERS VENTE */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-black text-[#111] text-center">Choisissez votre univers</h2>
        <p className="text-xs text-[#6B7280] mt-0.5 text-center">Chaque univers a ses propres véhicules, filtres et parcours.</p>
        <div className="mt-4 space-y-3">
          {UNIVERS.map((u) => (
            <Link key={u.id} to={u.to} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden active:scale-[0.99] transition shadow-sm">
              <div className="relative h-[140px]">
                <img src={u.photo} alt={u.label} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className={`absolute top-3 left-3 rounded-full px-3 py-0.5 text-[10px] font-bold ${u.badgeColor}`}>{u.badge}</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111]">{u.label}</h3>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">{u.desc}</p>
                </div>
                <ChevronRight size={16} className="text-[#D4AF37] shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-black text-[#111]">Services</h2>
        <div className="mt-3 space-y-2">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} to={s.to} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 active:scale-[0.99] transition">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10"><Icon size={18} className="text-[#D4AF37]" /></div>
                <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{s.label}</h3><p className="text-[10px] text-[#6B7280]">{s.desc}</p></div>
                <ChevronRight size={16} className="text-red-500" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-black text-[#111] text-center">Questions fréquentes</h2>
        <div className="mt-3 space-y-2">
          {FAQ_VENTE.map((f, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                <span className="text-sm font-semibold text-[#111] pr-2">{f.q}</span>
                <ChevronDown size={14} className={`text-red-500 shrink-0 transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <div className="px-4 pb-3"><p className="text-xs text-[#6B7280] leading-relaxed">{f.r}</p></div>}
            </div>
          ))}
        </div>
      </div>

      {/* AIDE */}
      <div className="mx-4 mt-8 rounded-xl bg-[#111] p-4 text-center">
        <Phone size={20} className="mx-auto text-[#D4AF37]" />
        <h3 className="text-sm font-bold text-white mt-2">Besoin d'aide ?</h3>
        <p className="text-xs text-white/60 mt-0.5">09 70 70 50 50 · 7j/7 de 8h à 20h</p>
      </div>
    </div>
  );
}
