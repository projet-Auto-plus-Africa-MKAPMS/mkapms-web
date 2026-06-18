import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, History, Car, Calendar, FileText, Download,
  Euro, Shield, Check, ChevronDown, Eye, Filter
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   HISTORIQUE DE LOCATION
   Toutes les locations, contrats, factures, cautions, documents. Même 5 ans après.
   ══════════════════════════════════════════════════════════════════════════ */

const LOCATIONS = [
  { id: 1, vehicule: "Mercedes Classe E Break", ref: "LOC-2025-0042", univers: "VTC & Taxi", debut: "15/03/2025", fin: "15/04/2025", duree: 31, montant: 1350, caution: 1000, cautionStatut: "bloquee" as const, statut: "en_cours" as const, photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop" },
  { id: 2, vehicule: "Peugeot 3008 GT", ref: "LOC-2025-0038", univers: "Particulier", debut: "01/03/2025", fin: "08/03/2025", duree: 7, montant: 364, caution: 500, cautionStatut: "restituee" as const, statut: "terminee" as const, photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop" },
  { id: 3, vehicule: "Renault Kangoo Van", ref: "LOC-2025-0035", univers: "Pro", debut: "15/02/2025", fin: "28/02/2025", duree: 13, montant: 455, caution: 300, cautionStatut: "restituee" as const, statut: "terminee" as const, photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=260&fit=crop" },
  { id: 4, vehicule: "BMW Série 5 530e", ref: "LOC-2024-0128", univers: "VTC & Taxi", debut: "01/06/2024", fin: "31/12/2024", duree: 214, montant: 9520, caution: 1500, cautionStatut: "restituee" as const, statut: "terminee" as const, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop" },
];

export default function HistoriqueLocation() {
  const [filter, setFilter] = useState("tous");
  const [openId, setOpenId] = useState<number | null>(null);
  const filtered = filter === "tous" ? LOCATIONS : LOCATIONS.filter((l) => l.statut === filter);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><History size={20} className="text-[#D4AF37]" /> Historique de location</h1>
        <p className="mt-1 text-sm text-white/60">{LOCATIONS.length} location{LOCATIONS.length > 1 ? "s" : ""} — Accessible même après 5 ans</p>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-xl font-black text-[#111]">{LOCATIONS.length}</p><p className="text-[10px] text-[#6B7280]">Locations</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-xl font-black text-[#D4AF37]">{LOCATIONS.reduce((s, l) => s + l.montant, 0).toLocaleString("fr-FR")} €</p><p className="text-[10px] text-[#6B7280]">Total dépensé</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-xl font-black text-[#111]">{LOCATIONS.reduce((s, l) => s + l.duree, 0)}</p><p className="text-[10px] text-[#6B7280]">Jours loués</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mt-4 flex gap-2">
        {([["tous", "Toutes"], ["en_cours", "En cours"], ["terminee", "Terminées"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${filter === id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>{label}</button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {filtered.map((l) => (
          <div key={l.id} className={`rounded-xl bg-white border overflow-hidden ${l.statut === "en_cours" ? "border-[#D4AF37]/40" : "border-[#E5E7EB]"}`}>
            <div className="flex gap-3 p-4">
              <img src={l.photo} alt={l.vehicule} className="w-20 h-14 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#111] truncate">{l.vehicule}</h3>
                <p className="text-[10px] text-[#6B7280]">{l.univers} · {l.ref}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${l.statut === "en_cours" ? "text-[#D4AF37] bg-[#D4AF37]/10" : "text-green-600 bg-green-50"}`}>
                    {l.statut === "en_cours" ? "En cours" : "Terminée"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-[#111]">{l.montant.toLocaleString("fr-FR")} €</p>
                <p className="text-[9px] text-[#6B7280]">{l.duree} jours</p>
              </div>
            </div>

            <button onClick={() => setOpenId(openId === l.id ? null : l.id)} className="w-full flex items-center justify-center gap-1 border-t border-[#F3F4F6] py-2 text-xs font-semibold text-[#6B7280]">
              Détails <ChevronDown size={12} className={`transition ${openId === l.id ? "rotate-180" : ""}`} />
            </button>

            {openId === l.id && (
              <div className="px-4 pb-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><p className="text-[9px] text-[#6B7280]">Début</p><p className="text-xs font-bold">{l.debut}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><p className="text-[9px] text-[#6B7280]">Fin</p><p className="text-xs font-bold">{l.fin}</p></div>
                </div>
                <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">Caution</span>
                  <span className={`text-xs font-bold ${l.cautionStatut === "restituee" ? "text-green-600" : "text-amber-600"}`}>{l.caution} € — {l.cautionStatut === "restituee" ? "Restituée" : "Bloquée"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button className="rounded-lg bg-[#D4AF37]/10 py-2.5 text-[10px] font-bold text-[#D4AF37] flex flex-col items-center gap-0.5"><FileText size={14} /> Contrat</button>
                  <button className="rounded-lg bg-[#D4AF37]/10 py-2.5 text-[10px] font-bold text-[#D4AF37] flex flex-col items-center gap-0.5"><Euro size={14} /> Facture</button>
                  <button className="rounded-lg bg-[#D4AF37]/10 py-2.5 text-[10px] font-bold text-[#D4AF37] flex flex-col items-center gap-0.5"><Download size={14} /> PDF</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
