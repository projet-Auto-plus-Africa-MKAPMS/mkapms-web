import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Star, Shield, Award, Check, History, CreditCard, Truck, ChevronDown, Heart, Calculator, Phone } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE MKA.P-MS OFFICIELLE — Univers Premium
   Véhicules appartenant à MKA.P-MS. Historique, contrôle qualité, Finance+, garantie.
   ══════════════════════════════════════════════════════════════════════════ */

const ANNONCES = [
  { id: 1, nom: "Mercedes Classe E 220d AMG Line", annee: 2024, km: 8000, prix: 48500, garantie: "24 mois", finance: "680 €/mois", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop", badges: ["Contrôle 200 pts", "Historique complet", "Finance+", "Livraison gratuite"] },
  { id: 2, nom: "BMW X5 xDrive 40d M Sport", annee: 2023, km: 22000, prix: 62000, garantie: "24 mois", finance: "870 €/mois", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop", badges: ["Contrôle 200 pts", "Historique complet", "Finance+", "Garantie MKA.P-MS"] },
  { id: 3, nom: "Tesla Model Y Long Range", annee: 2024, km: 5000, prix: 44900, garantie: "24 mois", finance: "630 €/mois", photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=260&fit=crop", badges: ["Batterie certifiée", "Historique complet", "Finance+", "Livraison gratuite"] },
];

const AVANTAGES = [
  { label: "Contrôle qualité 200 points", desc: "Inspection complète par nos experts", icon: Shield },
  { label: "Historique vérifié", desc: "Kilométrage, sinistres, entretien certifiés", icon: History },
  { label: "Finance+ intégré", desc: "Crédit, LOA, paiement fractionné", icon: CreditCard },
  { label: "Livraison partout en France", desc: "Livré chez vous ou en agence", icon: Truck },
  { label: "Garantie MKA.P-MS", desc: "Jusqu'à 24 mois de garantie", icon: Award },
  { label: "Conseiller dédié", desc: "Un conseiller vous accompagne", icon: Phone },
];

export default function VenteMKAPMS() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <div className="flex items-center gap-2 mb-2"><Star size={14} className="text-[#D4AF37]" fill="#D4AF37" /><span className="rounded-full bg-[#D4AF37] px-3 py-0.5 text-[10px] font-bold text-white">MKA.P-MS OFFICIEL</span></div>
        <h1 className="text-xl font-black text-white">Véhicules MKA.P-MS</h1>
        <p className="mt-1 text-sm text-white/60">Sélectionnés, inspectés, garantis par MKA.P-MS.</p>
      </div>

      {/* Avantages */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {AVANTAGES.map((a) => { const Icon = a.icon; return (
          <div key={a.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10"><Icon size={14} className="text-[#D4AF37]" /></div>
            <div><h3 className="text-[11px] font-bold text-[#111]">{a.label}</h3><p className="text-[8px] text-[#6B7280]">{a.desc}</p></div>
          </div>
        ); })}
      </div>

      {/* Annonces */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Véhicules disponibles</h2>
        <div className="mt-3 space-y-3">
          {ANNONCES.map((a) => (
            <div key={a.id} className="rounded-xl bg-white border border-[#D4AF37]/30 overflow-hidden shadow-sm">
              <div className="relative h-[150px]">
                <img src={a.photo} alt={a.nom} className="w-full h-full object-cover" loading="lazy" />
                <button className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"><Heart size={14} className="text-[#6B7280]" /></button>
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#D4AF37] px-2.5 py-0.5 text-[9px] font-bold text-white"><Star size={10} fill="white" /> Certifié</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#111]">{a.nom}</h3>
                <p className="text-[10px] text-[#6B7280] mt-0.5">{a.annee} · {a.km.toLocaleString("fr-FR")} km · Garantie {a.garantie}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.badges.map((b) => (<span key={b} className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-[8px] font-semibold text-green-700"><Check size={8} /> {b}</span>))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div><span className="text-xl font-black text-[#D4AF37]">{a.prix.toLocaleString("fr-FR")} €</span><p className="text-[10px] text-[#6B7280]">ou {a.finance}</p></div>
                  <button className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white active:scale-[0.98]">Voir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
