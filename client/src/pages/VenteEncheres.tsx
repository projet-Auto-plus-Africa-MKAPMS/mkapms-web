import { Link } from "react-router-dom";
import { ChevronLeft, Gavel, Shield, Clock, Euro, Users, AlertCircle } from "lucide-react";
const LOTS = [
  { id: 1, nom: "Lot 5 véhicules — Reprises garage", nbVehicules: 5, miseDepart: 8500, offreActuelle: 12400, encheres: 14, fin: "2h 15min", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop" },
  { id: 2, nom: "BMW Série 3 320d — Accident léger", nbVehicules: 1, miseDepart: 6000, offreActuelle: 8200, encheres: 8, fin: "4h 30min", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop" },
  { id: 3, nom: "Renault Clio V — Panne moteur", nbVehicules: 1, miseDepart: 2500, offreActuelle: 3800, encheres: 11, fin: "1j 8h", photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=400&h=260&fit=crop" },
];
export default function VenteEncheres() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-purple-700 px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">ENCHÈRES</span>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Gavel size={20} /> Vente aux enchères</h1>
        <p className="mt-1 text-sm text-white/80">Réservé aux professionnels validés</p>
      </div>
      <div className="mx-4 mt-4 rounded-xl bg-purple-50 border border-purple-200 p-3 flex items-start gap-2">
        <AlertCircle size={14} className="text-purple-600 mt-0.5 shrink-0" />
        <p className="text-xs text-purple-800"><span className="font-bold">Accès restreint :</span> Les enchères sont réservées aux professionnels validés (marchands, garages, carrossiers). Vérification SIRET/KBIS obligatoire.</p>
      </div>
      <div className="px-4 mt-4 space-y-3">
        {LOTS.map((l) => (
          <Link key={l.id} to={`/vehicule/${9120 + l.id}`} className="block rounded-xl bg-white border border-purple-200 overflow-hidden hover:shadow-lg transition">
            <div className="relative h-[130px]">
              <img src={l.photo} alt={l.nom} className="w-full h-full object-cover" loading="lazy" />
              <span className="absolute top-2 left-2 rounded-full bg-purple-700 px-2 py-0.5 text-[9px] font-bold text-white flex items-center gap-1"><Gavel size={10} /> Enchère</span>
              <span className="absolute bottom-2 right-2 rounded-full bg-[#111] px-2 py-0.5 text-[9px] font-bold text-white flex items-center gap-1"><Clock size={10} /> {l.fin}</span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-[#111]">{l.nom}</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><p className="text-[8px] text-[#6B7280]">Mise de départ</p><p className="text-sm font-bold text-[#111]">{l.miseDepart.toLocaleString("fr-FR")} €</p></div>
                <div className="rounded-lg bg-purple-50 p-2 text-center"><p className="text-[8px] text-purple-600">Offre actuelle</p><p className="text-sm font-black text-purple-700">{l.offreActuelle.toLocaleString("fr-FR")} €</p></div>
                <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><p className="text-[8px] text-[#6B7280]">Enchères</p><p className="text-sm font-bold text-[#111]">{l.encheres}</p></div>
              </div>
              <span className="mt-3 block w-full rounded-xl bg-purple-700 py-2.5 text-sm font-bold text-white text-center active:scale-[0.98] transition">Enchérir</span>
            </div>
          </Link>))}
      </div>
    </div>
  );
}
