import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, AlertCircle, Clock, Check, Euro, Fuel,
  Car, Trash2, Calendar, ChevronDown, Eye, Shield
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   CENTRE PÉNALITÉS
   Visible et transparent. Retard, carburant manquant, dégradation, nettoyage.
   Le client voit tout. Pas de surprise.
   ══════════════════════════════════════════════════════════════════════════ */

const PENALITES = [
  { id: 1, type: "Retard restitution", vehicule: "Mercedes Classe E Break", ref: "LOC-2025-0035", montant: 45, date: "28/02/2025", statut: "payee" as const, detail: "Retard de 3h. Pénalité : 15 €/h au-delà de 1h de tolérance." },
  { id: 2, type: "Carburant manquant", vehicule: "Peugeot 508 GT", ref: "LOC-2025-0038", montant: 30, date: "08/03/2025", statut: "en_attente" as const, detail: "Jauge à 1/4 au retour (plein au départ). Complément + frais de service." },
  { id: 3, type: "Nettoyage exceptionnel", vehicule: "Renault Kangoo Van", ref: "LOC-2025-0040", montant: 80, date: "12/03/2025", statut: "contestee" as const, detail: "Intérieur très sale nécessitant un nettoyage professionnel." },
];

const BAREME = [
  { type: "Retard restitution", montant: "15 € / heure (1h de tolérance)", icon: Clock },
  { type: "Carburant manquant", montant: "Prix carburant + 15 € de frais", icon: Fuel },
  { type: "Dégradation légère", montant: "50 — 200 € selon constat", icon: Car },
  { type: "Dégradation importante", montant: "Franchise assurance applicable", icon: AlertCircle },
  { type: "Nettoyage exceptionnel", montant: "50 — 120 €", icon: Trash2 },
  { type: "Clés perdues", montant: "150 — 400 €", icon: Shield },
];

const STATUT_CONFIG = {
  payee: { label: "Payée", color: "text-green-600", bg: "bg-green-50" },
  en_attente: { label: "En attente", color: "text-amber-600", bg: "bg-amber-50" },
  contestee: { label: "Contestée", color: "text-orange-600", bg: "bg-orange-50" },
};

export default function CentrePenalites() {
  const [showBareme, setShowBareme] = useState(false);
  const [openDetail, setOpenDetail] = useState<number | null>(null);

  const totalEnAttente = PENALITES.filter((p) => p.statut === "en_attente").reduce((s, p) => s + p.montant, 0);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><AlertCircle size={20} className="text-[#D4AF37]" /> Centre pénalités</h1>
        <p className="mt-1 text-sm text-white/60">Transparent. Pas de surprise.</p>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-xl font-black text-amber-600">{totalEnAttente} €</p><p className="text-[10px] text-[#6B7280]">En attente</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-xl font-black text-[#111]">{PENALITES.length}</p><p className="text-[10px] text-[#6B7280]">Total pénalités</p>
        </div>
      </div>

      {/* Barème */}
      <div className="px-4 mt-4">
        <button onClick={() => setShowBareme(!showBareme)} className="w-full flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] px-4 py-3">
          <span className="text-sm font-bold text-[#111]">Barème des pénalités</span>
          <ChevronDown size={16} className={`text-red-500 transition ${showBareme ? "rotate-180" : ""}`} />
        </button>
        {showBareme && (
          <div className="mt-2 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
            {BAREME.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EF]"><Icon size={14} className="text-[#6B7280]" /></div>
                  <div className="flex-1"><p className="text-sm text-[#111]">{b.type}</p><p className="text-[10px] text-[#D4AF37] font-semibold">{b.montant}</p></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        <h2 className="text-base font-bold text-[#111]">Mes pénalités</h2>
        {PENALITES.map((p) => {
          const s = STATUT_CONFIG[p.statut];
          return (
            <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setOpenDetail(openDetail === p.id ? null : p.id)} className="w-full p-4 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111]">{p.type}</h3>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.color} ${s.bg}`}>{s.label}</span>
                </div>
                <p className="text-[10px] text-[#6B7280] mt-0.5">{p.vehicule} · {p.ref} · {p.date}</p>
                <p className="text-lg font-black text-[#111] mt-1">{p.montant} €</p>
              </button>
              {openDetail === p.id && (
                <div className="px-4 pb-4 border-t border-[#F3F4F6]">
                  <p className="text-xs text-[#6B7280] mt-2">{p.detail}</p>
                  <div className="mt-3 flex gap-2">
                    {p.statut === "en_attente" && <button className="flex-1 rounded-lg bg-[#D4AF37] py-2 text-xs font-bold text-white">Payer</button>}
                    {p.statut !== "payee" && <button className="flex-1 rounded-lg border border-[#E5E7EB] py-2 text-xs font-semibold text-[#6B7280]">Contester</button>}
                    <button className="rounded-lg bg-[#F5F3EF] px-3 py-2 text-xs font-semibold text-[#6B7280]"><Eye size={12} /></button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
