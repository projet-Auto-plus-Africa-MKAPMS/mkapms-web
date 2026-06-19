import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell, BellRing, ChevronLeft, Clock, Car, Check, X,
  Calendar, MapPin, Star, AlertCircle
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   LISTE D'ATTENTE INTELLIGENTE
   Si un véhicule est déjà réservé, le client clique "M'avertir quand disponible".
   Le système enregistre la demande, notifie client + loueur automatiquement.
   ══════════════════════════════════════════════════════════════════════════ */

const ATTENTES = [
  { id: 1, vehicule: "Mercedes Classe E Break", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop", univers: "VTC & Taxi", dateDemande: "2025-03-01", statut: "en_attente" as const, position: 2, dateEstimee: "15 mars 2025", prix: 63 },
  { id: 2, vehicule: "BMW Série 5 530e", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop", univers: "VTC & Taxi", dateDemande: "2025-03-05", statut: "disponible" as const, position: 0, dateEstimee: "Maintenant", prix: 140 },
  { id: 3, vehicule: "Peugeot 3008 GT", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop", univers: "Particulier", dateDemande: "2025-02-28", statut: "annule" as const, position: 0, dateEstimee: "-", prix: 52 },
];

const STATUT_CONFIG = {
  en_attente: { label: "En attente", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  disponible: { label: "Disponible !", color: "text-green-600", bg: "bg-green-50", icon: Check },
  annule: { label: "Annulé", color: "text-[#6B7280]", bg: "bg-[#F3F4F6]", icon: X },
};

export default function ListeAttente() {
  const [tab, setTab] = useState<"tous" | "en_attente" | "disponible">("tous");
  const filtered = tab === "tous" ? ATTENTES : ATTENTES.filter((a) => a.statut === tab);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BellRing size={20} className="text-[#D4AF37]" /> Liste d'attente</h1>
        <p className="mt-1 text-sm text-white/60">Soyez notifié dès qu'un véhicule se libère</p>
      </div>

      {/* Info */}
      <div className="mx-4 mt-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle size={14} className="text-[#D4AF37] mt-0.5 shrink-0" />
          <p className="text-xs text-[#111]"><span className="font-bold">Comment ça marche :</span> Quand un véhicule est indisponible, cliquez "M'avertir". Vous recevez une notification dès qu'il se libère. Premier arrivé, premier servi.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4 flex gap-2">
        {([["tous", "Toutes"], ["en_attente", "En attente"], ["disponible", "Disponibles"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${tab === id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>{label}</button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {filtered.map((a) => {
          const s = STATUT_CONFIG[a.statut];
          const SIcon = s.icon;
          return (
            <div key={a.id} className={`rounded-xl bg-white border overflow-hidden ${a.statut === "disponible" ? "border-green-400 ring-1 ring-green-200" : "border-[#E5E7EB]"}`}>
              <div className="flex gap-3 p-4">
                <img src={a.photo} alt={a.vehicule} className="w-24 h-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#111] truncate">{a.vehicule}</h3>
                  <p className="text-[10px] text-[#6B7280]">{a.univers} · {a.prix} €/jour</p>
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.color} ${s.bg}`}>
                    <SIcon size={10} /> {s.label}
                  </span>
                </div>
              </div>
              <div className="px-4 pb-3 flex gap-2">
                {a.statut === "en_attente" && (
                  <>
                    <div className="flex-1 rounded-lg bg-[#F5F3EF] px-3 py-2">
                      <p className="text-[9px] text-[#6B7280]">Position</p>
                      <p className="text-sm font-bold text-[#111]">#{a.position}</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-[#F5F3EF] px-3 py-2">
                      <p className="text-[9px] text-[#6B7280]">Dispo estimée</p>
                      <p className="text-sm font-bold text-[#111]">{a.dateEstimee}</p>
                    </div>
                    <button className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">Annuler</button>
                  </>
                )}
                {a.statut === "disponible" && (
                  <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] transition">
                    Réserver maintenant
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Bell size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune alerte</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Parcourez les véhicules et activez des alertes</p>
        </div>
      )}
    </div>
  );
}
