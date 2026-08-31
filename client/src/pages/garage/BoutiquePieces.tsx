import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Package, Search } from "lucide-react";
import { CATALOGUE_PIECES, ajouterAuPanier } from "../../lib/panierPieces";

export default function BoutiquePieces() {
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");
  const terme = recherche.trim().toLowerCase();
  const visibles = terme
    ? CATALOGUE_PIECES.filter(p =>
        `${p.ref} ${p.marque} ${p.label} ${p.compat}`.toLowerCase().includes(terme),
      )
    : CATALOGUE_PIECES;

  function ajouter(ref: string, montage: boolean) {
    ajouterAuPanier(ref, montage);
    navigate("/garage/panier-pieces");
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Package size={20} className="text-[#D4AF37]" /> Boutique pièces</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-3"><div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Référence, marque ou modèle compatible…" className="w-full bg-transparent text-sm outline-none" /></div></div>
      {visibles.length === 0 && <p className="px-4 mt-3 text-xs text-[#6B7280]">Aucune pièce ne correspond à « {recherche} ».</p>}
      <div className="px-4 mt-3 space-y-2">{visibles.map(p => (
        <div key={p.ref} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><div><span className="text-[8px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">{p.marque}</span><h3 className="text-sm font-bold text-[#111] mt-0.5">{p.label}</h3></div><span className="text-base font-black text-[#D4AF37]">{p.prix} €</span></div>
          <p className="text-[9px] text-[#6B7280] mt-0.5">{p.ref} · Compatible: {p.compat} · {p.stock > 0 ? `Stock: ${p.stock}` : "Sur commande"}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => ajouter(p.ref, true)} className="rounded-lg bg-[#D4AF37] py-2 text-xs font-bold text-white">Pièce + montage {p.montagePrix} €</button>
            <button onClick={() => ajouter(p.ref, false)} className="rounded-lg bg-white border border-[#E5E7EB] py-2 text-xs font-bold text-[#111]">Pièce seule</button>
          </div>
        </div>))}</div>
      <div className="px-4 mt-4"><Link to="/garage/panier-pieces" className="block rounded-xl bg-[#111] py-3 text-center text-sm font-bold text-white">Voir mon panier</Link></div>
    </div>
  );
}
