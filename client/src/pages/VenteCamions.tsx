import { Link } from "react-router-dom";
import { ChevronLeft, Search, Truck, Heart } from "lucide-react";
const CATEGORIES = [
  { label: "Porte-voitures", desc: "Transport auto", photo: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=300&h=200&fit=crop" },
  { label: "Bennes", desc: "BTP, déchets", photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=300&h=200&fit=crop" },
  { label: "Frigorifiques", desc: "Transport frais", photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=300&h=200&fit=crop" },
  { label: "Poids lourds", desc: "19t+ porteurs", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=300&h=200&fit=crop" },
  { label: "Plateaux", desc: "Matériel & engins", photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=300&h=200&fit=crop" },
  { label: "Fourgons", desc: "7.5t → 12t", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=300&h=200&fit=crop" },
];
const ANNONCES = [
  { id: 1, nom: "Iveco Daily Benne 35C14", annee: 2022, km: 55000, prix: 28500, ptac: "3.5 t", photo: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400&h=260&fit=crop" },
  { id: 2, nom: "MAN TGL 12.250 Frigo", annee: 2021, km: 120000, prix: 42000, ptac: "12 t", photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=260&fit=crop" },
  { id: 3, nom: "Renault Trucks D 7.5t Plateau", annee: 2023, km: 38000, prix: 45000, ptac: "7.5 t", photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=260&fit=crop" },
];
export default function VenteCamions() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gray-700 px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">CAMIONS</span>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} /> Achat Camions</h1>
        <p className="mt-1 text-sm text-white/80">Porte-voitures, bennes, frigorifiques, poids lourds</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="Marque, modèle, PTAC…" className="w-full bg-transparent text-sm outline-none" /></div>
      </div>
      {/* Catégories — scroll horizontal */}
      <div className="px-4 mt-4"><h2 className="text-base font-bold text-[#111]">Catégories</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">{CATEGORIES.map((c) => (<button key={c.label} className="shrink-0 w-[120px] rounded-xl bg-white border border-[#E5E7EB] overflow-hidden text-left active:scale-[0.98] transition"><img src={c.photo} alt="" className="w-full h-[60px] object-cover" loading="lazy" /><div className="p-2"><h3 className="text-[11px] font-bold text-[#111]">{c.label}</h3><p className="text-[8px] text-[#6B7280]">{c.desc}</p></div></button>))}</div>
      </div>
      <div className="px-4 mt-6"><h2 className="text-base font-bold text-[#111]">Annonces camions</h2>
        <div className="mt-3 space-y-3">{ANNONCES.map((a) => (
          <Link key={a.id} to={`/vehicule/${9090 + a.id}`} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition">
            <div className="relative h-[130px]"><img src={a.photo} alt={a.nom} className="w-full h-full object-cover" loading="lazy" /><span className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"><Heart size={14} className="text-red-500" /></span></div>
            <div className="p-4"><h3 className="text-sm font-bold text-[#111]">{a.nom}</h3><p className="text-[10px] text-[#6B7280] mt-0.5">{a.annee} · {a.km.toLocaleString("fr-FR")} km · PTAC {a.ptac}</p><p className="mt-2 text-lg font-black text-gray-700">{a.prix.toLocaleString("fr-FR")} €</p></div>
          </Link>))}</div>
      </div>
    </div>
  );
}
