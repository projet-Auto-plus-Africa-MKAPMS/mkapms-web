import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Award, Star, Shield, Check, History,
  Camera, Wrench, Car, ChevronRight
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   VÉHICULES CERTIFIÉS MKA.P-MS
   Badge ⭐ Certifié MKA.P-MS. Contrôle complet, historique vérifié,
   photos certifiées, entretien à jour.
   ══════════════════════════════════════════════════════════════════════════ */

const VEHICULES = [
  { id: 1, nom: "Mercedes Classe E Break 220d", annee: 2024, km: 12000, prix: 63, note: 4.9, photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop", checks: ["Contrôle 150 points", "Historique complet", "Photos certifiées", "Entretien à jour", "Garantie MKA.P-MS"] },
  { id: 2, nom: "BMW Série 5 530e", annee: 2024, km: 8000, prix: 140, note: 4.9, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop", checks: ["Contrôle 150 points", "Historique complet", "Photos certifiées", "Entretien à jour", "Garantie MKA.P-MS"] },
  { id: 3, nom: "Tesla Model 3 Long Range", annee: 2024, km: 5000, prix: 135, note: 4.8, photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=260&fit=crop", checks: ["Contrôle 150 points", "Historique complet", "Photos certifiées", "Batterie certifiée", "Garantie MKA.P-MS"] },
];

const CRITERES_CERTIFICATION = [
  { label: "Contrôle 150 points", desc: "Inspection mécanique, électrique et esthétique complète", icon: Shield },
  { label: "Historique vérifié", desc: "Aucun sinistre grave, kilométrage certifié, propriétaires vérifiés", icon: History },
  { label: "Photos certifiées", desc: "Photos prises par un inspecteur MKA.P-MS, non retouchées", icon: Camera },
  { label: "Entretien à jour", desc: "Carnet d'entretien complet, dernière révision vérifiée", icon: Wrench },
  { label: "Garantie MKA.P-MS", desc: "Couvert par la garantie qualité MKA.P-MS", icon: Award },
];

export default function VehiculesCertifies() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Award size={20} className="text-[#D4AF37]" /> Certifiés MKA.P-MS</h1>
        <p className="mt-1 text-sm text-white/60">Véhicules inspectés, vérifiés, garantis</p>
      </div>

      {/* Badge explanation */}
      <div className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-[#D4AF37]/30 p-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-1.5">
          <Star size={14} className="text-white" fill="white" />
          <span className="text-sm font-bold text-white">Certifié MKA.P-MS</span>
        </div>
        <p className="mt-2 text-xs text-white/60">Seuls les véhicules ayant passé nos 150 points de contrôle reçoivent ce badge. Votre garantie de qualité.</p>
      </div>

      {/* Certification criteria */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Critères de certification</h2>
        <div className="mt-3 space-y-2">
          {CRITERES_CERTIFICATION.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10"><Icon size={16} className="text-[#D4AF37]" /></div>
                <div><h3 className="text-sm font-bold text-[#111]">{c.label}</h3><p className="text-[10px] text-[#6B7280]">{c.desc}</p></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Certified vehicles */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Véhicules certifiés disponibles</h2>
        <div className="mt-3 space-y-3">
          {VEHICULES.map((v) => (
            <div key={v.id} className="rounded-xl bg-white border border-[#D4AF37]/30 overflow-hidden">
              <div className="relative h-[150px]">
                <img src={v.photo} alt={v.nom} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#D4AF37] px-2.5 py-0.5 text-[9px] font-bold text-white"><Star size={10} fill="white" /> Certifié</span>
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-[#111]"><Star size={10} className="text-[#D4AF37]" fill="#D4AF37" /> {v.note}</span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[#111]">{v.nom}</h3>
                <p className="text-[10px] text-[#6B7280]">{v.annee} · {v.km.toLocaleString("fr-FR")} km</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {v.checks.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-semibold text-green-700"><Check size={8} /> {c}</span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div><span className="text-xl font-black text-[#D4AF37]">{v.prix} €</span><span className="text-xs text-[#6B7280]"> / jour</span></div>
                  <button className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white active:scale-[0.98] transition">Réserver</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
