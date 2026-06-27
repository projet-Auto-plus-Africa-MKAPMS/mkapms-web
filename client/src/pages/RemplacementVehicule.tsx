import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, RefreshCw, Car, Check, Clock, AlertTriangle,
  ArrowRight, Pen, Shield, Phone, FileText, ChevronRight
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   REMPLACEMENT DE VÉHICULE
   Panne → Demande → Validation loueur → Nouveau véhicule → Signature → Historique
   ══════════════════════════════════════════════════════════════════════════ */

const DEMANDES = [
  { id: 1, vehiculeActuel: "Mercedes Classe E Break", ref: "LOC-2025-0042", raison: "Panne moteur", date: "2025-03-10", statut: "en_cours" as const, vehiculePropose: "BMW Série 5 530e", photoPropose: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop", etape: 3 },
  { id: 2, vehiculeActuel: "Peugeot 508 GT", ref: "LOC-2025-0038", raison: "Accident mineur", date: "2025-02-20", statut: "termine" as const, vehiculePropose: "Toyota Camry Hybride", photoPropose: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop", etape: 5 },
];

const ETAPES = [
  { n: 1, label: "Demande envoyée" },
  { n: 2, label: "Validation loueur" },
  { n: 3, label: "Véhicule proposé" },
  { n: 4, label: "Signature contrat" },
  { n: 5, label: "Véhicule récupéré" },
];

const RAISONS = ["Panne mécanique", "Panne électrique", "Accident", "Rappel constructeur", "Autre"];

export default function RemplacementVehicule() {
  const [showNew, setShowNew] = useState(false);
  const [raison, setRaison] = useState("");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><RefreshCw size={20} className="text-[#D4AF37]" /> Remplacement véhicule</h1>
        <p className="mt-1 text-sm text-white/60">Demandez un véhicule de remplacement en cas de panne</p>
      </div>

      <div className="px-4 mt-4">
        <button onClick={() => setShowNew(!showNew)} className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md">
          <AlertTriangle size={16} /> Demander un remplacement
        </button>
      </div>

      {showNew && (
        <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-4">
          <h3 className="text-base font-bold text-[#111]">Nouvelle demande</h3>
          <div>
            <label className="text-xs font-semibold text-[#6B7280]">Raison du remplacement</label>
            <div className="mt-2 space-y-2">
              {RAISONS.map((r) => (
                <button key={r} onClick={() => setRaison(r)} className={`w-full rounded-lg border-2 px-3 py-2.5 text-left text-sm transition ${raison === r ? "border-[#D4AF37] bg-[#D4AF37]/5 font-bold" : "border-[#E5E7EB]"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#6B7280]">Description (optionnel)</label>
            <textarea className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm resize-none h-20" placeholder="Décrivez le problème..." />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#6B7280]">Photos du problème</label>
            <button className="mt-1 w-full rounded-lg border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 py-6 text-xs font-semibold text-[#D4AF37]">+ Ajouter des photos</button>
          </div>
          {raison && (
            <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Envoyer la demande</button>
          )}
        </div>
      )}

      {/* Existing requests */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Mes demandes</h2>
        <div className="mt-3 space-y-3">
          {DEMANDES.map((d) => (
            <div key={d.id} className={`rounded-xl bg-white border overflow-hidden ${d.statut === "en_cours" ? "border-amber-300" : "border-[#E5E7EB]"}`}>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111]">{d.vehiculeActuel}</h3>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${d.statut === "en_cours" ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50"}`}>
                    {d.statut === "en_cours" ? <><Clock size={10} /> En cours</> : <><Check size={10} /> Terminé</>}
                  </span>
                </div>
                <p className="text-[10px] text-[#6B7280] mt-0.5">{d.ref} · {d.raison} · {d.date}</p>

                {/* Steps */}
                <div className="mt-3 flex items-center gap-1">
                  {ETAPES.map((e) => (
                    <div key={e.n} className="flex-1 flex flex-col items-center">
                      <div className={`h-1.5 w-full rounded-full ${e.n <= d.etape ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} />
                      <span className={`text-[8px] mt-0.5 ${e.n <= d.etape ? "text-[#111] font-semibold" : "text-red-500"}`}>{e.n}</span>
                    </div>
                  ))}
                </div>

                {/* Proposed vehicle */}
                {d.vehiculePropose && d.etape >= 3 && (
                  <div className="mt-3 flex items-center gap-3 rounded-lg bg-[#F5F3EF] p-2.5">
                    <img src={d.photoPropose} alt="" className="w-16 h-11 rounded object-cover" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#111]">Véhicule proposé</p>
                      <p className="text-[11px] text-[#6B7280]">{d.vehiculePropose}</p>
                    </div>
                    {d.etape === 3 && <button className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white">Accepter</button>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
