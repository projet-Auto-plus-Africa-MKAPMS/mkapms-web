import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, RefreshCw, Calendar, Car, Check, Clock,
  MapPin, ArrowRight, CreditCard, Shield, AlertCircle
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   RENOUVELLEMENT RAPIDE + RETRAIT ET RETOUR
   "Prolonger ma location" sans refaire le dossier.
   Choix retrait/retour : même agence, autre, livraison, récupération domicile.
   ══════════════════════════════════════════════════════════════════════════ */

const LOCATIONS_ACTIVES = [
  {
    id: 1, vehicule: "Mercedes Classe E Break", ref: "LOC-2025-0042",
    photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop",
    dateDebut: "15/03/2025", dateFin: "15/04/2025", univers: "VTC & Taxi",
    prixMois: 1350, retraitLieu: "Agence Paris 12e", retourLieu: "Agence Paris 12e",
    joursRestants: 22, peutRenouveler: true,
  },
  {
    id: 2, vehicule: "Renault Kangoo Van", ref: "LOC-2025-0045",
    photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=260&fit=crop",
    dateDebut: "01/03/2025", dateFin: "01/04/2025", univers: "Pro",
    prixMois: 750, retraitLieu: "Agence Lyon 3e", retourLieu: "Agence Lyon 3e",
    joursRestants: 8, peutRenouveler: true,
  },
];

const RETRAIT_OPTIONS = [
  { id: "meme", label: "Même agence", desc: "Retrait et retour au même point", prix: "Gratuit", icon: MapPin },
  { id: "autre", label: "Autre agence", desc: "Retrait dans une autre agence", prix: "+ 30 €", icon: ArrowRight },
  { id: "livraison", label: "Livraison à domicile", desc: "Le véhicule est livré chez vous", prix: "+ 40 €", icon: Car },
  { id: "recup", label: "Récupération à domicile", desc: "On vient chercher le véhicule chez vous", prix: "+ 40 €", icon: RefreshCw },
];

const DUREES_PROLONGATION = [
  { jours: 7, label: "1 semaine" },
  { jours: 14, label: "2 semaines" },
  { jours: 30, label: "1 mois" },
  { jours: 60, label: "2 mois" },
  { jours: 90, label: "3 mois" },
];

export default function RenouvellementLocation() {
  const [activeTab, setActiveTab] = useState<"renouveler" | "retrait">("renouveler");
  const [selectedLoc, setSelectedLoc] = useState(0);
  const [duree, setDuree] = useState(30);
  const [retraitChoice, setRetraitChoice] = useState("meme");
  const [retourChoice, setRetourChoice] = useState("meme");

  const loc = LOCATIONS_ACTIVES[selectedLoc];
  const prixProlongation = Math.round((loc.prixMois / 30) * duree);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white">Renouvellement & Retrait</h1>
        <p className="mt-1 text-sm text-white/60">Prolongez ou gérez le retrait/retour</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4 flex gap-2">
        <button onClick={() => setActiveTab("renouveler")} className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${activeTab === "renouveler" ? "bg-[#D4AF37] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>Prolonger</button>
        <button onClick={() => setActiveTab("retrait")} className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${activeTab === "retrait" ? "bg-[#D4AF37] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>Retrait & Retour</button>
      </div>

      {/* Location selector */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {LOCATIONS_ACTIVES.map((l, i) => (
          <button key={l.id} onClick={() => setSelectedLoc(i)} className={`shrink-0 flex items-center gap-2 rounded-xl p-2 pr-3 text-left transition ${selectedLoc === i ? "bg-[#111] text-white" : "bg-white text-[#111] border border-[#E5E7EB]"}`}>
            <img src={l.photo} alt="" className="w-10 h-8 rounded object-cover" />
            <div>
              <p className="text-[11px] font-bold">{l.ref}</p>
              <p className={`text-[9px] ${selectedLoc === i ? "text-white/60" : "text-[#6B7280]"}`}>{l.vehicule}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Warning if expiring soon */}
      {loc.joursRestants <= 10 && (
        <div className="mx-4 mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800"><span className="font-bold">Attention :</span> Il reste {loc.joursRestants} jours avant la fin de votre location. Prolongez maintenant pour éviter une interruption.</p>
        </div>
      )}

      {activeTab === "renouveler" && (
        <>
          {/* Current info */}
          <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex gap-3">
              <img src={loc.photo} alt={loc.vehicule} className="w-20 h-14 rounded-lg object-cover" />
              <div>
                <h3 className="text-sm font-bold text-[#111]">{loc.vehicule}</h3>
                <p className="text-[10px] text-[#6B7280]">{loc.univers} · {loc.ref}</p>
                <p className="text-[10px] text-[#6B7280]">{loc.dateDebut} → {loc.dateFin}</p>
              </div>
            </div>
          </div>

          {/* Duration choice */}
          <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h3 className="text-sm font-bold text-[#111]">Durée de prolongation</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {DUREES_PROLONGATION.map((d) => (
                <button key={d.jours} onClick={() => setDuree(d.jours)} className={`rounded-lg border-2 py-2.5 text-center transition ${duree === d.jours ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB]"}`}>
                  <span className="block text-sm font-bold text-[#111]">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
            <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Prolongation</span><span className="font-bold">{duree} jours</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Prix</span><span className="font-bold text-[#D4AF37]">{prixProlongation} €</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Documents</span><span className="font-bold text-green-600">Déjà validés</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Contrat</span><span className="font-bold text-green-600">Prolongé automatiquement</span></div>
          </div>

          <div className="mx-4 mt-4">
            <button className="w-full rounded-xl bg-[#D4AF37] py-4 text-base font-extrabold text-white shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2">
              <RefreshCw size={16} /> Prolonger ma location
            </button>
            <p className="mt-2 text-[10px] text-[#9CA3AF] text-center">Sans refaire votre dossier. Paiement sécurisé.</p>
          </div>
        </>
      )}

      {activeTab === "retrait" && (
        <>
          {/* Retrait */}
          <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h3 className="text-sm font-bold text-[#111]">Mode de retrait</h3>
            <div className="mt-3 space-y-2">
              {RETRAIT_OPTIONS.slice(0, 3).map((o) => {
                const Icon = o.icon;
                return (
                  <button key={o.id} onClick={() => setRetraitChoice(o.id)} className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${retraitChoice === o.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB]"}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EF]"><Icon size={16} className="text-[#D4AF37]" /></div>
                    <div className="flex-1"><span className="text-sm font-bold text-[#111]">{o.label}</span><p className="text-[10px] text-[#6B7280]">{o.desc}</p></div>
                    <span className="text-xs font-semibold text-[#D4AF37]">{o.prix}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Retour */}
          <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h3 className="text-sm font-bold text-[#111]">Mode de retour</h3>
            <div className="mt-3 space-y-2">
              {RETRAIT_OPTIONS.map((o) => {
                const Icon = o.icon;
                return (
                  <button key={o.id} onClick={() => setRetourChoice(o.id)} className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${retourChoice === o.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB]"}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EF]"><Icon size={16} className="text-[#D4AF37]" /></div>
                    <div className="flex-1"><span className="text-sm font-bold text-[#111]">{o.label}</span><p className="text-[10px] text-[#6B7280]">{o.desc}</p></div>
                    <span className="text-xs font-semibold text-[#D4AF37]">{o.prix}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mx-4 mt-4">
            <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] transition">
              Confirmer le retrait / retour
            </button>
          </div>
        </>
      )}
    </div>
  );
}
