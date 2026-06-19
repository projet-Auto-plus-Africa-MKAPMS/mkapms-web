import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Truck, MapPin, Clock, Check, Building2,
  Train, Plane, Home, ChevronRight, Package
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   LIVRAISON / RÉCUPÉRATION DU VÉHICULE
   Agence, domicile, entreprise, gare, aéroport. Suivi temps réel.
   ══════════════════════════════════════════════════════════════════════════ */

const POINTS_RETRAIT = [
  { id: "agence", label: "Retrait en agence", desc: "Retirez directement dans nos agences", prix: "Gratuit", icon: Building2, delai: "Immédiat" },
  { id: "domicile", label: "Livraison à domicile", desc: "Le véhicule livré à votre porte", prix: "40 €", icon: Home, delai: "2-4h" },
  { id: "entreprise", label: "Livraison entreprise", desc: "Livré directement dans vos locaux", prix: "35 €", icon: Building2, delai: "2-4h" },
  { id: "gare", label: "Livraison en gare", desc: "Trouvez votre véhicule en arrivant", prix: "30 €", icon: Train, delai: "Sur rendez-vous" },
  { id: "aeroport", label: "Livraison aéroport", desc: "Véhicule prêt dès l'atterrissage", prix: "45 €", icon: Plane, delai: "Sur rendez-vous" },
];

const SUIVI_ETAPES = [
  { label: "Commande confirmée", heure: "09:00", fait: true },
  { label: "Véhicule en préparation", heure: "09:30", fait: true },
  { label: "En cours de livraison", heure: "10:15", fait: true },
  { label: "Arrivée estimée", heure: "10:45", fait: false },
];

const LIVRAISONS = [
  { id: 1, vehicule: "Mercedes Classe E Break", ref: "LIV-2025-0012", mode: "Domicile", statut: "en_cours" as const, date: "Aujourd'hui 10:45" },
  { id: 2, vehicule: "Renault Kangoo Van", ref: "LIV-2025-0011", mode: "Agence Lyon 3e", statut: "livree" as const, date: "12/03/2025 14:00" },
];

export default function LivraisonVehicule() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [tab, setTab] = useState<"commander" | "suivi">("commander");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} className="text-[#D4AF37]" /> Livraison & Récupération</h1>
        <p className="mt-1 text-sm text-white/60">Choisissez votre mode de retrait</p>
      </div>

      <div className="px-4 mt-4 flex gap-2">
        <button onClick={() => setTab("commander")} className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${tab === "commander" ? "bg-[#D4AF37] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>Commander</button>
        <button onClick={() => setTab("suivi")} className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${tab === "suivi" ? "bg-[#D4AF37] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>Suivi</button>
      </div>

      {tab === "commander" && (
        <div className="px-4 mt-4 space-y-2">
          {POINTS_RETRAIT.map((p) => {
            const Icon = p.icon;
            return (
              <button key={p.id} onClick={() => setSelectedMode(p.id)} className={`w-full flex items-center gap-3 rounded-xl border-2 p-4 text-left transition ${selectedMode === p.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB] bg-white"}`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F5F3EF]"><Icon size={20} className="text-[#D4AF37]" /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#111]">{p.label}</h3>
                  <p className="text-[10px] text-[#6B7280]">{p.desc}</p>
                  <div className="mt-1 flex items-center gap-3 text-[10px]">
                    <span className="font-semibold text-[#D4AF37]">{p.prix}</span>
                    <span className="text-[#6B7280]">⏱ {p.delai}</span>
                  </div>
                </div>
                {selectedMode === p.id && <Check size={16} className="text-[#D4AF37]" />}
              </button>
            );
          })}

          {selectedMode && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-[#6B7280]">Adresse de livraison</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5">
                  <MapPin size={14} className="text-[#D4AF37]" />
                  <input type="text" className="w-full bg-transparent text-sm outline-none" placeholder="Entrez votre adresse…" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#6B7280]">Date et heure souhaitées</label>
                <input type="datetime-local" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
              </div>
              <button className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white active:scale-[0.98] transition shadow-md">
                Confirmer la livraison
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "suivi" && (
        <div className="px-4 mt-4 space-y-4">
          {LIVRAISONS.map((l) => (
            <div key={l.id} className={`rounded-xl bg-white border overflow-hidden ${l.statut === "en_cours" ? "border-[#D4AF37]/40" : "border-[#E5E7EB]"}`}>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111]">{l.vehicule}</h3>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${l.statut === "en_cours" ? "text-[#D4AF37] bg-[#D4AF37]/10" : "text-green-600 bg-green-50"}`}>
                    {l.statut === "en_cours" ? <><Clock size={10} /> En cours</> : <><Check size={10} /> Livrée</>}
                  </span>
                </div>
                <p className="text-[10px] text-[#6B7280]">{l.ref} · {l.mode} · {l.date}</p>
              </div>
              {l.statut === "en_cours" && (
                <div className="px-4 pb-4 border-t border-[#F3F4F6]">
                  <div className="mt-3 space-y-3">
                    {SUIVI_ETAPES.map((e, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-4 w-4 rounded-full flex items-center justify-center ${e.fait ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`}>
                            {e.fait && <Check size={10} className="text-white" />}
                          </div>
                          {i < SUIVI_ETAPES.length - 1 && <div className={`w-0.5 h-6 ${e.fait ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} />}
                        </div>
                        <div>
                          <p className={`text-sm ${e.fait ? "font-bold text-[#111]" : "text-[#6B7280]"}`}>{e.label}</p>
                          <p className="text-[10px] text-red-500">{e.heure}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
