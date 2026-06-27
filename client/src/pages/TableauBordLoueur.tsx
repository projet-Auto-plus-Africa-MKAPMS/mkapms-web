import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, BarChart3, Car, Euro, Calendar, FileText,
  Star, Clock, TrendingUp, Users, AlertCircle, Check
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   TABLEAU DE BORD LOUEUR
   Véhicules loués, réservations, paiements, documents, taux occupation.
   ══════════════════════════════════════════════════════════════════════════ */

const STATS = [
  { label: "Véhicules actifs", value: "12", icon: Car, color: "text-blue-600" },
  { label: "Loués", value: "9", icon: Check, color: "text-green-600" },
  { label: "Disponibles", value: "3", icon: Clock, color: "text-amber-600" },
  { label: "Réservations", value: "15", icon: Calendar, color: "text-purple-600" },
  { label: "CA ce mois", value: "18 500 €", icon: Euro, color: "text-[#D4AF37]" },
  { label: "Taux occup.", value: "75 %", icon: TrendingUp, color: "text-green-600" },
];

const RESERVATIONS_RECENTES = [
  { id: 1, client: "Jean D.", vehicule: "Mercedes Classe E", debut: "15/03", fin: "15/04", montant: 1350, statut: "confirmee" as const },
  { id: 2, client: "SAS Transport+", vehicule: "Renault Trafic x3", debut: "20/03", fin: "20/04", montant: 4950, statut: "confirmee" as const },
  { id: 3, client: "Marie L.", vehicule: "Peugeot 3008", debut: "22/03", fin: "29/03", montant: 364, statut: "en_attente" as const },
];

const DOCS_PENDING = [
  { type: "Permis", client: "Ahmed B.", date: "Il y a 2h" },
  { type: "KBIS", client: "SAS Transport+", date: "Il y a 5h" },
];

export default function TableauBordLoueur() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Tableau de bord loueur</h1>
        <p className="mt-1 text-sm text-white/60">Vue d'ensemble de votre activité</p>
      </div>

      {/* Stats grid */}
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
              <Icon size={16} className={`mx-auto ${s.color}`} />
              <p className={`text-lg font-black mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-[8px] text-[#6B7280]">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Score qualité */}
      <div className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-[#D4AF37]/30 p-4 flex items-center gap-4">
        <div className="text-center">
          <p className="text-3xl font-black text-[#D4AF37]">4.9</p>
          <div className="flex gap-0.5 mt-0.5 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (<Star key={n} size={10} className="text-[#D4AF37]" fill="#D4AF37" />))}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Score qualité : Excellent</p>
          <p className="text-[10px] text-white/50">2 500 locations · 98 % satisfaction</p>
        </div>
        <span className="rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-bold text-white">🟢</span>
      </div>

      {/* Documents pending */}
      {DOCS_PENDING.length > 0 && (
        <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">Documents en attente ({DOCS_PENDING.length})</h3>
          </div>
          {DOCS_PENDING.map((d, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-amber-100 last:border-0">
              <div><p className="text-xs text-[#111]">{d.type} — {d.client}</p><p className="text-[9px] text-[#6B7280]">{d.date}</p></div>
              <button className="rounded-lg bg-amber-600 px-3 py-1 text-[10px] font-bold text-white">Vérifier</button>
            </div>
          ))}
        </div>
      )}

      {/* Recent reservations */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Réservations récentes</h2>
        <div className="mt-2 space-y-2">
          {RESERVATIONS_RECENTES.map((r) => (
            <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111]">{r.client}</h3>
                  <p className="text-[10px] text-[#6B7280]">{r.vehicule} · {r.debut} → {r.fin}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#D4AF37]">{r.montant.toLocaleString("fr-FR")} €</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${r.statut === "confirmee" ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
                    {r.statut === "confirmee" ? "Confirmée" : "En attente"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Occupation chart placeholder */}
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <h3 className="text-sm font-bold text-[#111]">Taux d'occupation (7 derniers jours)</h3>
        <div className="mt-3 flex items-end gap-1 h-20">
          {[60, 75, 80, 70, 85, 90, 75].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t bg-[#D4AF37]" style={{ height: `${v}%` }} />
              <span className="text-[8px] text-[#6B7280]">{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
