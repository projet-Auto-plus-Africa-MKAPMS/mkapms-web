import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, AlertCircle, Clock, Fuel,
  Car, Trash2, ChevronDown, Shield
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   CENTRE PÉNALITÉS
   Aucune pénalité (retard, carburant, dégradation, nettoyage) n'est
   aujourd'hui tracée en base : le schéma `bookings` n'a pas de colonnes
   dédiées et aucune réservation de location réelle n'existe encore (le
   type "rental" n'a aucune procédure de création — tâche #56). Le tableau
   PENALITES fabriqué a été retiré : afficher un montant inventé sur une
   réservation qui n'existe pas serait une facturation fictive. Le barème
   ci-dessous reste affiché car c'est une vraie politique tarifaire, pas une
   donnée d'incident inventée.
   ══════════════════════════════════════════════════════════════════════════ */

const BAREME = [
  { type: "Retard restitution", montant: "15 € / heure (1h de tolérance)", icon: Clock },
  { type: "Carburant manquant", montant: "Prix carburant + 15 € de frais", icon: Fuel },
  { type: "Dégradation légère", montant: "50 — 200 € selon constat", icon: Car },
  { type: "Dégradation importante", montant: "Franchise assurance applicable", icon: AlertCircle },
  { type: "Nettoyage exceptionnel", montant: "50 — 120 €", icon: Trash2 },
  { type: "Clés perdues", montant: "150 — 400 €", icon: Shield },
];

export default function CentrePenalites() {
  const [showBareme, setShowBareme] = useState(false);
  const { user } = useAuth();
  const reservations = trpc.reservations.mine.useQuery(undefined, { enabled: !!user });
  const locations = (reservations.data ?? []).filter((b) => b.type === "rental");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><AlertCircle size={20} className="text-[#D4AF37]" /> Centre pénalités</h1>
        <p className="mt-1 text-sm text-white/60">Transparent. Pas de surprise.</p>
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
        {!user ? (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">Connectez-vous pour voir vos pénalités.</div>
        ) : reservations.isLoading ? (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">Chargement…</div>
        ) : locations.length === 0 ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm font-bold text-amber-800">Aucune réservation de location active</p>
            <p className="text-xs text-amber-700 mt-0.5">Aucune pénalité ne peut être appliquée en dehors d'une location en cours.</p>
          </div>
        ) : (
          locations.map((b) => (
            <div key={b.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <p className="text-sm font-bold text-[#111]">Réservation #{b.id}</p>
              <p className="text-[10px] text-[#6B7280] mt-0.5">Statut : {b.status}</p>
              <p className="text-xs text-[#6B7280] mt-2">Aucune pénalité enregistrée sur cette réservation à ce jour.</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
