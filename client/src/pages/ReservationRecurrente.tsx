import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, RefreshCw, Calendar, Car, Check, Clock,
  AlertCircle, ChevronDown, CreditCard, Shield
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   RÉSERVATION RÉCURRENTE
   VTC, Taxi, Entreprises. Le client n'a pas besoin de refaire sa réservation.
   ══════════════════════════════════════════════════════════════════════════ */

const FREQUENCES = [
  { id: "hebdo", label: "Hebdomadaire", desc: "Tous les lundis", icon: "📅" },
  { id: "mensuel", label: "Mensuel", desc: "Renouvellement automatique chaque mois", icon: "🔄" },
  { id: "6mois", label: "6 mois", desc: "Engagement 6 mois avec tarif réduit", icon: "⭐" },
  { id: "12mois", label: "12 mois", desc: "Engagement 12 mois — meilleur tarif", icon: "🏆" },
];

const RECURRENTES = [
  { id: 1, vehicule: "Mercedes Classe E Break", univers: "VTC & Taxi", freq: "Mensuel", debut: "2025-01-15", fin: "2025-12-15", prix: 1350, statut: "active" as const, prochaine: "15 avril 2025", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop" },
  { id: 2, vehicule: "Renault Kangoo Van", univers: "Pro", freq: "6 mois", debut: "2025-02-01", fin: "2025-07-31", prix: 750, statut: "active" as const, prochaine: "1 avril 2025", photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=260&fit=crop" },
  { id: 3, vehicule: "Peugeot 508 GT", univers: "VTC & Taxi", freq: "12 mois", debut: "2024-06-01", fin: "2025-05-31", prix: 1100, statut: "expire_bientot" as const, prochaine: "31 mai 2025", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=260&fit=crop" },
];

export default function ReservationRecurrente() {
  const [showNew, setShowNew] = useState(false);
  const [freq, setFreq] = useState("");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><RefreshCw size={20} className="text-[#D4AF37]" /> Réservations récurrentes</h1>
        <p className="mt-1 text-sm text-white/60">Automatisez vos locations VTC, Taxi et Entreprise</p>
      </div>

      {/* Info */}
      <div className="mx-4 mt-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-3">
        <p className="text-xs text-[#111]"><span className="font-bold">Idéal pour les pros :</span> Plus besoin de refaire votre réservation chaque mois. Choisissez votre fréquence, le renouvellement est automatique.</p>
      </div>

      {/* Existing recurring */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Mes réservations récurrentes</h2>
        <div className="mt-3 space-y-3">
          {RECURRENTES.map((r) => (
            <div key={r.id} className={`rounded-xl bg-white border overflow-hidden ${r.statut === "expire_bientot" ? "border-amber-400" : "border-[#E5E7EB]"}`}>
              <div className="flex gap-3 p-4">
                <img src={r.photo} alt={r.vehicule} className="w-20 h-14 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#111] truncate">{r.vehicule}</h3>
                  <p className="text-[10px] text-[#6B7280]">{r.univers} · {r.freq}</p>
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.statut === "active" ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
                    {r.statut === "active" ? <Check size={10} /> : <AlertCircle size={10} />}
                    {r.statut === "active" ? "Active" : "Expire bientôt"}
                  </span>
                </div>
              </div>
              <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-[#F5F3EF] p-2 text-center">
                  <p className="text-[9px] text-[#6B7280]">Mensualité</p>
                  <p className="text-sm font-black text-[#111]">{r.prix} €</p>
                </div>
                <div className="rounded-lg bg-[#F5F3EF] p-2 text-center">
                  <p className="text-[9px] text-[#6B7280]">Prochain</p>
                  <p className="text-[11px] font-bold text-[#111]">{r.prochaine}</p>
                </div>
                <div className="rounded-lg bg-[#F5F3EF] p-2 text-center">
                  <p className="text-[9px] text-[#6B7280]">Fin contrat</p>
                  <p className="text-[11px] font-bold text-[#111]">{r.fin}</p>
                </div>
              </div>
              <div className="px-4 pb-3 flex gap-2">
                <button className="flex-1 rounded-lg bg-[#D4AF37] py-2 text-xs font-bold text-white">Prolonger</button>
                <button className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-[#6B7280]">Modifier</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New recurring reservation */}
      <div className="px-4 mt-6">
        <button onClick={() => setShowNew(!showNew)} className="w-full rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 py-4 text-sm font-bold text-[#D4AF37] active:scale-[0.98] transition">
          + Nouvelle réservation récurrente
        </button>
      </div>

      {showNew && (
        <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-4">
          <h3 className="text-base font-bold text-[#111]">Choisissez votre fréquence</h3>
          <div className="space-y-2">
            {FREQUENCES.map((f) => (
              <button key={f.id} onClick={() => setFreq(f.id)} className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${freq === f.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB]"}`}>
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <span className="text-sm font-bold text-[#111]">{f.label}</span>
                  <p className="text-xs text-[#6B7280]">{f.desc}</p>
                </div>
                {freq === f.id && <Check size={16} className="text-[#D4AF37] ml-auto" />}
              </button>
            ))}
          </div>
          {freq && (
            <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">
              Choisir un véhicule →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
