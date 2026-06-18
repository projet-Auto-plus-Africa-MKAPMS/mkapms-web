import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Star, Car, TrendingUp, Euro, Shield,
  RefreshCw, Calculator, Users, Award, ChevronRight, Check
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PROGRAMME PROFESSIONNEL VTC / TAXI
   Véhicules recommandés, revenus estimés, offres spéciales, renouvellement.
   ══════════════════════════════════════════════════════════════════════════ */

const RECOMMANDES = [
  { id: 1, nom: "Mercedes Classe E Break", prix: 1350, revenuEstime: 4500, marge: 3150, photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop", badge: "Best-seller" },
  { id: 2, nom: "BMW Série 5 530e", prix: 2800, revenuEstime: 6000, marge: 3200, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop", badge: "Premium" },
  { id: 3, nom: "Tesla Model 3 LR", prix: 2700, revenuEstime: 5800, marge: 3100, photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=260&fit=crop", badge: "Électrique" },
  { id: 4, nom: "Toyota Corolla Hybride", prix: 950, revenuEstime: 3500, marge: 2550, photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop", badge: "Économique" },
];

const OFFRES = [
  { titre: "3 mois offerts", desc: "Sur engagement 12 mois. Économisez jusqu'à 4 050 €.", icon: Euro },
  { titre: "Assurance tout risque incluse", desc: "Pour les nouveaux chauffeurs pendant 3 mois.", icon: Shield },
  { titre: "Renouvellement simplifié", desc: "Changez de véhicule sans refaire votre dossier.", icon: RefreshCw },
  { titre: "Parrainage chauffeur", desc: "100 € de réduction par chauffeur parrainé.", icon: Users },
];

export default function ProgrammeVTC() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer/vtc-taxi" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour VTC & Taxi</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Award size={20} className="text-[#D4AF37]" /> Programme VTC & Taxi</h1>
        <p className="mt-1 text-sm text-white/60">Offres exclusives pour chauffeurs professionnels</p>
      </div>

      {/* Estimator */}
      <div className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-[#D4AF37]/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator size={16} className="text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-white">Estimateur de revenus</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white/5 p-2.5 text-center">
            <p className="text-[9px] text-white/50">Revenu / jour</p>
            <p className="text-lg font-black text-[#D4AF37]">150 €</p>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5 text-center">
            <p className="text-[9px] text-white/50">Revenu / semaine</p>
            <p className="text-lg font-black text-[#D4AF37]">900 €</p>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5 text-center">
            <p className="text-[9px] text-white/50">Revenu / mois</p>
            <p className="text-lg font-black text-[#D4AF37]">3 600 €</p>
          </div>
        </div>
        <p className="mt-2 text-[9px] text-white/40 text-center">*Estimation basée sur une activité de 5j/sem, 8 courses/jour</p>
      </div>

      {/* Recommended vehicles */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Véhicules recommandés VTC & Taxi</h2>
        <div className="mt-3 space-y-3">
          {RECOMMANDES.map((v) => (
            <div key={v.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="relative h-[130px]">
                <img src={v.photo} alt={v.nom} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 left-2 rounded-full bg-[#111] px-2.5 py-0.5 text-[9px] font-bold text-[#D4AF37]">{v.badge}</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#111]">{v.nom}</h3>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-[#F5F3EF] p-2 text-center">
                    <p className="text-[9px] text-[#6B7280]">Location / mois</p>
                    <p className="text-sm font-black text-[#111]">{v.prix.toLocaleString("fr-FR")} €</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-2 text-center">
                    <p className="text-[9px] text-green-600">Revenus estimés</p>
                    <p className="text-sm font-black text-green-700">{v.revenuEstime.toLocaleString("fr-FR")} €</p>
                  </div>
                  <div className="rounded-lg bg-[#D4AF37]/10 p-2 text-center">
                    <p className="text-[9px] text-[#D4AF37]">Marge nette</p>
                    <p className="text-sm font-black text-[#D4AF37]">{v.marge.toLocaleString("fr-FR")} €</p>
                  </div>
                </div>
                <button className="mt-3 w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white active:scale-[0.98] transition">Voir le véhicule</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special offers */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Offres spéciales chauffeurs</h2>
        <div className="mt-3 space-y-2">
          {OFFRES.map((o, i) => {
            const Icon = o.icon;
            return (
              <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10"><Icon size={16} className="text-[#D4AF37]" /></div>
                <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{o.titre}</h3><p className="text-[10px] text-[#6B7280]">{o.desc}</p></div>
                <ChevronRight size={16} className="text-[#6B7280]" />
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 mt-6">
        <button className="w-full rounded-xl bg-[#111] py-4 text-base font-extrabold text-[#D4AF37] active:scale-[0.98] transition shadow-lg">
          Rejoindre le programme VTC & Taxi
        </button>
      </div>
    </div>
  );
}
