import { useState } from "react";
import { Truck, AlertTriangle, CheckCircle } from "lucide-react";
import { trpc } from "../lib/trpc";

export default function Livraison() {
  const [poids, setPoids] = useState(5);
  const [distance, setDistance] = useState(10);
  const [urgent, setUrgent] = useState(false);
  const [longueur, setLongueur] = useState(40);
  const [largeur, setLargeur] = useState(30);
  const [hauteur, setHauteur] = useState(30);
  const [heavyPart, setHeavyPart] = useState(false);
  const quote = trpc.livraison.quote.useQuery(
    {
      poidsKg: poids,
      distanceKm: distance,
      urgent,
      longueurCm: longueur,
      largeurCm: largeur,
      hauteurCm: hauteur,
      heavyPart,
    },
    { enabled: poids > 0 },
  );

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-8 pb-6 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tighter italic uppercase">Livraison</h1>
        <p className="mt-1 text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
          Réseau logistique : moto, scooter, utilitaire, fourgon, camion.<br />
          Limite moto : 20 kg / 60×40×40 cm.
        </p>
      </div>

      <div className="px-4 mt-6 space-y-6">
        <div className="rounded-3xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
          <h2 className="text-xs font-black text-[#111] uppercase tracking-widest mb-6 flex items-center gap-2">
            <div className="h-1 w-4 bg-[#D4AF37] rounded-full"></div> Calculer un tarif
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-2 block">Poids (kg)</label>
              <input type="number" className="w-full h-14 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-5 text-sm font-bold outline-none focus:border-[#D4AF37] transition-all" value={poids} onChange={(e) => setPoids(Number(e.target.value))} />
            </div>

            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-2 block">Dimensions (cm — L × l × h)</label>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" className="h-14 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold outline-none focus:border-[#D4AF37] transition-all text-center" value={longueur} onChange={(e) => setLongueur(Number(e.target.value))} />
                <input type="number" className="h-14 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold outline-none focus:border-[#D4AF37] transition-all text-center" value={largeur} onChange={(e) => setLargeur(Number(e.target.value))} />
                <input type="number" className="h-14 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold outline-none focus:border-[#D4AF37] transition-all text-center" value={hauteur} onChange={(e) => setHauteur(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-2 block">Distance (km)</label>
              <input type="number" className="w-full h-14 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-5 text-sm font-bold outline-none focus:border-[#D4AF37] transition-all" value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-3 group cursor-pointer">
                <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${heavyPart ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-white border-[#E5E7EB]"}`}>
                  {heavyPart && <CheckCircle size={14} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={heavyPart} onChange={(e) => setHeavyPart(e.target.checked)} />
                <span className="text-xs font-bold text-[#374151] group-hover:text-[#111]">Pièce mécanique lourde (moteur, capot...)</span>
              </label>

              <label className="flex items-center gap-3 group cursor-pointer">
                <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${urgent ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-white border-[#E5E7EB]"}`}>
                  {urgent && <CheckCircle size={14} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
                <span className="text-xs font-bold text-[#374151] group-hover:text-[#111]">Livraison urgente</span>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-[#E5E7EB] p-6 shadow-sm overflow-hidden relative">
          <h2 className="text-xs font-black text-[#111] uppercase tracking-widest mb-6 flex items-center gap-2">
            <div className="h-1 w-4 bg-[#D4AF37] rounded-full"></div> Estimation
          </h2>

          {quote.data ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-[#111] tracking-tighter italic">{quote.data.tarif.toLocaleString("fr-FR")}</span>
                <span className="text-xl font-black text-[#D4AF37] italic">€</span>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 rounded-2xl bg-[#F9FAFB] p-4 border border-[#E5E7EB]">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-[#E5E7EB] text-[#D4AF37]">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-[#6B7280] uppercase tracking-widest">Véhicule recommandé</p>
                    <p className="text-sm font-black text-[#111]">{quote.data.recommendedVehicleType}</p>
                  </div>
                </div>

                {!quote.data.motoAllowed && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                      {quote.data.reason
                        ? `${quote.data.reason} — moto impossible, ${quote.data.recommendedVehicleType} recommandé.`
                        : `Colis trop lourd/volumineux pour une moto — ${quote.data.recommendedVehicleType} requis.`}
                    </p>
                  </div>
                )}
              </div>
              
	              <div className="mt-8">
	                <button 
	                  onClick={() => window.location.href = "/compte/validation?type=livraison&amount=" + quote.data.tarif}
	                  className="w-full h-16 rounded-2xl bg-[#D4AF37] flex items-center justify-center text-sm font-black uppercase tracking-widest text-[#111] active:scale-[0.97] transition-all shadow-xl shadow-[#D4AF37]/20 hover:bg-[#B8962E]"
	                >
	                  Confirmer et commander la livraison
	                </button>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="h-px w-8 bg-[#E5E7EB]"></div>
                  <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">Paiement sécurisé Finance+</p>
                  <div className="h-px w-8 bg-[#E5E7EB]"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="h-20 w-20 rounded-3xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4 text-[#E5E7EB]">
                <Truck size={40} />
              </div>
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                Renseignez les informations du colis pour obtenir un tarif instantané.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
