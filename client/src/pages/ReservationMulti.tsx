import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Car, Plus, Trash2, Check, Euro, FileText,
  Calendar, Users, Shield
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   RÉSERVATION MULTI-VÉHICULES
   Entreprises : ajouter plusieurs véhicules, une seule facture.
   ══════════════════════════════════════════════════════════════════════════ */

const CATALOGUE = [
  { id: 1, nom: "Renault Kangoo Van", prix: 35, photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=300&h=200&fit=crop" },
  { id: 2, nom: "Renault Trafic L2H1", prix: 55, photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=300&h=200&fit=crop" },
  { id: 3, nom: "Peugeot Expert", prix: 50, photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=300&h=200&fit=crop" },
  { id: 4, nom: "Mercedes Sprinter", prix: 80, photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=300&h=200&fit=crop" },
  { id: 5, nom: "Iveco Daily", prix: 70, photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=300&h=200&fit=crop" },
];

export default function ReservationMulti() {
  const [panier, setPanier] = useState<number[]>([1, 2]);
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [duree, setDuree] = useState(30);

  const vehiculesPanier = panier.map((id) => CATALOGUE.find((v) => v.id === id)!).filter(Boolean);
  const totalJour = vehiculesPanier.reduce((s, v) => s + v.prix, 0);
  const totalPeriode = totalJour * duree;
  const remise = panier.length >= 3 ? 10 : panier.length >= 5 ? 15 : 0;
  const totalFinal = Math.round(totalPeriode * (1 - remise / 100));

  const addVehicle = (id: number) => {
    if (!panier.includes(id)) setPanier([...panier, id]);
    setShowCatalogue(false);
  };
  const removeVehicle = (id: number) => setPanier(panier.filter((p) => p !== id));

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/louer/pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location Pro</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} /> Réservation multi-véhicules</h1>
        <p className="mt-1 text-sm text-white/80">Réservez plusieurs véhicules, une seule facture</p>
      </div>

      {/* Selected vehicles */}
      <div className="px-4 mt-4">
        <h2 className="text-sm font-bold text-[#111]">Véhicules sélectionnés ({panier.length})</h2>
        <div className="mt-2 space-y-2">
          {vehiculesPanier.map((v) => (
            <div key={v.id} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3">
              <img src={v.photo} alt={v.nom} className="w-14 h-10 rounded-lg object-cover" />
              <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{v.nom}</h3><p className="text-xs text-[#D4AF37] font-semibold">{v.prix} €/jour</p></div>
              <button onClick={() => removeVehicle(v.id)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"><Trash2 size={14} className="text-red-500" /></button>
            </div>
          ))}
        </div>
        <button onClick={() => setShowCatalogue(!showCatalogue)} className="mt-2 w-full rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/50 py-3 text-sm font-bold text-blue-700 flex items-center justify-center gap-2 active:scale-[0.98]">
          <Plus size={16} /> Ajouter un véhicule
        </button>
      </div>

      {showCatalogue && (
        <div className="mx-4 mt-2 rounded-xl bg-white border border-[#E5E7EB] p-3 space-y-2">
          {CATALOGUE.filter((v) => !panier.includes(v.id)).map((v) => (
            <button key={v.id} onClick={() => addVehicle(v.id)} className="w-full flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-2 text-left active:scale-[0.99]">
              <img src={v.photo} alt="" className="w-12 h-8 rounded object-cover" />
              <div className="flex-1"><p className="text-sm font-bold text-[#111]">{v.nom}</p><p className="text-xs text-blue-600">{v.prix} €/jour</p></div>
              <Plus size={14} className="text-blue-600" />
            </button>
          ))}
        </div>
      )}

      {/* Duration */}
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <h3 className="text-sm font-bold text-[#111]">Durée de location</h3>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button key={d} onClick={() => setDuree(d)} className={`rounded-lg border-2 py-2 text-center text-sm font-bold transition ${duree === d ? "border-blue-600 bg-blue-50 text-blue-700" : "border-[#E5E7EB] text-[#111]"}`}>{d}j</button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
        <h3 className="text-sm font-bold text-[#111]">Récapitulatif</h3>
        <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Véhicules</span><span className="font-bold">{panier.length}</span></div>
        <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Durée</span><span className="font-bold">{duree} jours</span></div>
        <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Total / jour</span><span className="font-bold">{totalJour} €</span></div>
        {remise > 0 && <div className="flex justify-between text-xs"><span className="text-green-600">Remise flotte (-{remise}%)</span><span className="font-bold text-green-600">-{Math.round(totalPeriode * remise / 100)} €</span></div>}
        <div className="border-t border-[#E5E7EB] pt-2 flex justify-between"><span className="text-sm font-bold text-[#111]">Total</span><span className="text-lg font-black text-blue-700">{totalFinal.toLocaleString("fr-FR")} €</span></div>
        <p className="text-[9px] text-[#9CA3AF]">Facture unique pour tous les véhicules</p>
      </div>

      <div className="px-4 mt-4">
        <button className="w-full rounded-xl bg-blue-800 py-4 text-base font-extrabold text-white active:scale-[0.98] transition shadow-lg flex items-center justify-center gap-2">
          <FileText size={16} /> Réserver {panier.length} véhicules
        </button>
      </div>
    </div>
  );
}
