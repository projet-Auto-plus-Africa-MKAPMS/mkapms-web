import { useState } from "react";
import { Truck, AlertTriangle } from "lucide-react";
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
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Livraison</h1>
      <p className="mt-1 text-sm text-slate-500">
        Réseau logistique : moto, scooter, utilitaire, fourgon, camion. Limite moto : 20 kg / 60×40×40 cm.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold text-slate-800">Calculer un tarif</h2>
          <label className="mt-4 block text-sm font-medium text-slate-600">Poids (kg)</label>
          <input type="number" className="input mt-1" value={poids} onChange={(e) => setPoids(Number(e.target.value))} />
          <label className="mt-3 block text-sm font-medium text-slate-600">Dimensions (cm — L × l × h)</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            <input type="number" className="input" value={longueur} onChange={(e) => setLongueur(Number(e.target.value))} />
            <input type="number" className="input" value={largeur} onChange={(e) => setLargeur(Number(e.target.value))} />
            <input type="number" className="input" value={hauteur} onChange={(e) => setHauteur(Number(e.target.value))} />
          </div>
          <label className="mt-3 block text-sm font-medium text-slate-600">Distance (km)</label>
          <input type="number" className="input mt-1" value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={heavyPart} onChange={(e) => setHeavyPart(e.target.checked)} /> Pièce mécanique lourde (moteur, capot, jantes, pneus…)
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /> Livraison urgente
          </label>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-800">Estimation</h2>
          {quote.data ? (
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-brand">{quote.data.tarif.toLocaleString("fr-FR")} €</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <Truck size={16} /> Véhicule recommandé : <strong>{quote.data.recommendedVehicleType}</strong>
              </p>
              {!quote.data.motoAllowed && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                  <AlertTriangle size={16} />
                  {quote.data.reason
                    ? `${quote.data.reason} — moto impossible, ${quote.data.recommendedVehicleType} recommandé.`
                    : `Colis trop lourd/volumineux pour une moto — ${quote.data.recommendedVehicleType} requis.`}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Renseignez les informations du colis.</p>
          )}
        </div>
      </div>
    </div>
  );
}
