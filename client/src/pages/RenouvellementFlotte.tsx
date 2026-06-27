import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, RefreshCw, Car, Calendar, AlertCircle,
  Check, ChevronRight, Star, Clock
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   CENTRE DE RENOUVELLEMENT DE FLOTTE
   Le système propose automatiquement des remplacements quand un contrat expire.
   ══════════════════════════════════════════════════════════════════════════ */

const CONTRATS_EXPIRATION = [
  { id: 1, vehicule: "Renault Trafic L2H1", ref: "LOC-2025-0035", fin: "01/04/2025", joursRestants: 8, photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=300&h=200&fit=crop" },
  { id: 2, vehicule: "Peugeot Expert", ref: "LOC-2025-0032", fin: "15/04/2025", joursRestants: 22, photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=300&h=200&fit=crop" },
];

const SUGGESTIONS = [
  { id: 1, nom: "Renault Trafic L2H1 2025", prix: 55, photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=300&h=200&fit=crop", avantages: ["Modèle récent", "GPS intégré", "Même catégorie"] },
  { id: 2, nom: "Citroën Jumpy M", prix: 52, photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=300&h=200&fit=crop", avantages: ["Prix réduit", "Hayon élévateur", "Disponible immédiatement"] },
  { id: 3, nom: "Mercedes Vito Long", prix: 65, photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=300&h=200&fit=crop", avantages: ["Premium", "Volume supérieur", "Boîte auto"] },
];

export default function RenouvellementFlotte() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/louer/pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location Pro</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><RefreshCw size={20} /> Renouvellement de flotte</h1>
        <p className="mt-1 text-sm text-white/80">Vos contrats arrivent à expiration</p>
      </div>

      {/* Expiring contracts */}
      <div className="px-4 mt-4">
        <h2 className="text-sm font-bold text-[#111]">Contrats à renouveler</h2>
        <div className="mt-2 space-y-2">
          {CONTRATS_EXPIRATION.map((c) => (
            <div key={c.id} className={`rounded-xl bg-white border overflow-hidden ${c.joursRestants <= 10 ? "border-amber-300" : "border-[#E5E7EB]"}`}>
              <div className="flex gap-3 p-4">
                <img src={c.photo} alt="" className="w-16 h-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#111]">{c.vehicule}</h3>
                  <p className="text-[10px] text-[#6B7280]">{c.ref} · Fin : {c.fin}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 h-fit text-[10px] font-semibold ${c.joursRestants <= 10 ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50"}`}>
                  <Clock size={10} /> {c.joursRestants}j
                </span>
              </div>
              {c.joursRestants <= 10 && (
                <div className="px-4 pb-3">
                  <div className="rounded-lg bg-amber-50 p-2 flex items-start gap-2">
                    <AlertCircle size={12} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-amber-800">Ce contrat expire bientôt. Renouvelez maintenant pour éviter une interruption.</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Suggested replacements */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Véhicules de remplacement proposés</h2>
        <p className="text-xs text-[#6B7280] mt-1">Sélectionnés automatiquement selon vos besoins</p>
        <div className="mt-3 space-y-3">
          {SUGGESTIONS.map((s) => (
            <div key={s.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="flex gap-3 p-4">
                <img src={s.photo} alt="" className="w-20 h-14 rounded-lg object-cover" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#111]">{s.nom}</h3>
                  <p className="text-xs font-bold text-blue-700">{s.prix} €/jour</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.avantages.map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-[8px] font-semibold text-green-700"><Check size={8} /> {a}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-4 pb-3 flex gap-2">
                <button className="flex-1 rounded-lg bg-blue-800 py-2 text-xs font-bold text-white">Renouveler avec ce véhicule</button>
                <button className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-semibold text-[#6B7280]">Voir</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 mt-6">
        <button className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98] transition">
          Renouveler toute ma flotte
        </button>
      </div>
    </div>
  );
}
