import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ShoppingCart, Search } from "lucide-react";
import { CATALOGUE_PIECES, ajouterAuPanier } from "../../lib/panierPieces";

export default function CommandePieces() {
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");
  const terme = recherche.trim().toLowerCase();
  const resultats = terme
    ? CATALOGUE_PIECES.filter(p =>
        `${p.ref} ${p.marque} ${p.label} ${p.compat}`.toLowerCase().includes(terme),
      )
    : CATALOGUE_PIECES;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><ShoppingCart size={20} className="text-[#D4AF37]" /> Commande pièces</h1></div>
      <div className="px-4 -mt-3 relative z-10 flex gap-2"><div className="flex-1 flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Référence, marque ou modèle compatible…" className="w-full bg-transparent text-sm outline-none" /></div></div>
      {resultats.length === 0 && <p className="px-4 mt-3 text-xs text-[#6B7280]">Aucune référence ne correspond à « {recherche} ».</p>}
      <div className="px-4 mt-3 space-y-2">{resultats.map(r => (
        <div key={r.ref} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{r.label}</h3><p className="text-[9px] text-[#6B7280]">{r.ref} · {r.marque} · {r.stock > 0 ? `${r.stock} en stock` : "sur commande"}</p></div>
          <span className="text-sm font-bold text-[#D4AF37]">{r.prix} €</span>
          <button
            onClick={() => { ajouterAuPanier(r.ref, false); navigate("/garage/panier-pieces"); }}
            className="rounded-lg px-3 py-1.5 text-xs font-bold bg-[#D4AF37] text-white"
          >
            Ajouter
          </button>
        </div>))}</div>
      <div className="px-4 mt-4"><Link to="/garage/panier-pieces" className="block rounded-xl bg-[#111] py-3 text-center text-sm font-bold text-white">Voir mon panier</Link></div>
    </div>
  );
}
