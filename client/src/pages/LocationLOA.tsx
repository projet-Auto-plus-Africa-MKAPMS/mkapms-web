import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Key, Euro, Calendar, Calculator, Car,
  Check, Shield, ChevronRight, Star, TrendingUp
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   LOCATION AVEC OPTION D'ACHAT (LOA)
   Univers séparé. Prix achat, LOA, durée, apport, mensuel, conditions.
   ══════════════════════════════════════════════════════════════════════════ */

const VEHICULES_LOA = [
  { id: 1, nom: "Mercedes Classe E Break 220d", prixAchat: 45000, apport: 5000, duree: 48, mensualite: 650, valeurResiduelle: 18000, photo: "/categories/loc_berline.jpg", km: "20 000 km/an" },
  { id: 2, nom: "BMW Série 5 530e", prixAchat: 58000, apport: 8000, duree: 48, mensualite: 820, valeurResiduelle: 23000, photo: "/categories/pro_premium.jpg", km: "20 000 km/an" },
  { id: 3, nom: "Tesla Model 3 Long Range", prixAchat: 44000, apport: 5000, duree: 48, mensualite: 590, valeurResiduelle: 17000, photo: "/categories/electrique.jpg", km: "25 000 km/an" },
  { id: 4, nom: "Peugeot 3008 GT Hybrid", prixAchat: 38000, apport: 4000, duree: 48, mensualite: 480, valeurResiduelle: 15000, photo: "/categories/loc_suv.jpg", km: "15 000 km/an" },
];

const CONDITIONS = [
  "Apport initial entre 5 % et 20 % du prix",
  "Durée de 24 à 60 mois",
  "Kilométrage contractuel choisi",
  "Entretien et assurance inclus (option)",
  "Achat du véhicule en fin de contrat possible",
  "Résiliation anticipée sous conditions",
];

export default function LocationLOA() {
  const [selectedDuree, setSelectedDuree] = useState(48);
  const [selectedApport, setSelectedApport] = useState(5000);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Key size={20} className="text-[#D4AF37]" /> Location avec Option d'Achat</h1>
        <p className="mt-1 text-sm text-white/60">Louez aujourd'hui, achetez demain</p>
      </div>

      {/* Info banner */}
      <div className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-[#D4AF37]/30 p-4">
        <h2 className="text-sm font-bold text-[#D4AF37]">Comment ça marche ?</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="text-center"><span className="block text-xl">1️⃣</span><p className="text-[9px] text-white/70 mt-0.5">Choisissez votre véhicule</p></div>
          <div className="text-center"><span className="block text-xl">2️⃣</span><p className="text-[9px] text-white/70 mt-0.5">Payez des mensualités</p></div>
          <div className="text-center"><span className="block text-xl">3️⃣</span><p className="text-[9px] text-white/70 mt-0.5">Achetez à la fin ou rendez</p></div>
        </div>
      </div>

      {/* Simulator */}
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <h3 className="text-sm font-bold text-[#111] flex items-center gap-2"><Calculator size={14} className="text-[#D4AF37]" /> Simulateur LOA</h3>
        <div className="mt-3">
          <label className="text-xs text-[#6B7280]">Durée du contrat</label>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {[24, 36, 48, 60].map((d) => (
              <button key={d} onClick={() => setSelectedDuree(d)} className={`rounded-lg border-2 py-2 text-center text-sm font-bold transition ${selectedDuree === d ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]" : "border-[#E5E7EB] text-[#111]"}`}>{d} mois</button>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs text-[#6B7280]">Apport initial</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {[3000, 5000, 8000].map((a) => (
              <button key={a} onClick={() => setSelectedApport(a)} className={`rounded-lg border-2 py-2 text-center text-sm font-bold transition ${selectedApport === a ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]" : "border-[#E5E7EB] text-[#111]"}`}>{a.toLocaleString("fr-FR")} €</button>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicles */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Véhicules disponibles en LOA</h2>
        <div className="mt-3 space-y-3">
          {VEHICULES_LOA.map((v) => (
            <div key={v.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="relative h-[140px]">
                <img src={v.photo} alt={v.nom} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 left-2 rounded-full bg-[#D4AF37] px-2.5 py-0.5 text-[9px] font-bold text-white">LOA</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#111]">{v.nom}</h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><p className="text-[9px] text-[#6B7280]">Prix achat</p><p className="text-sm font-bold text-[#111]">{v.prixAchat.toLocaleString("fr-FR")} €</p></div>
                  <div className="rounded-lg bg-[#D4AF37]/10 p-2"><p className="text-[9px] text-[#D4AF37]">Mensualité LOA</p><p className="text-sm font-black text-[#D4AF37]">{v.mensualite} € /mois</p></div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="text-[8px] text-[#6B7280]">Apport</p><p className="text-[11px] font-bold">{v.apport.toLocaleString("fr-FR")} €</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="text-[8px] text-[#6B7280]">Durée</p><p className="text-[11px] font-bold">{v.duree} mois</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="text-[8px] text-[#6B7280]">Km/an</p><p className="text-[11px] font-bold">{v.km}</p></div>
                </div>
                <button className="mt-3 w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white active:scale-[0.98] transition">Simuler ma LOA</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div className="mx-4 mt-6 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <h3 className="text-sm font-bold text-[#111]">Conditions LOA</h3>
        <ul className="mt-2 space-y-1.5">
          {CONDITIONS.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[#6B7280]"><Check size={12} className="text-[#D4AF37] mt-0.5 shrink-0" /> {c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
