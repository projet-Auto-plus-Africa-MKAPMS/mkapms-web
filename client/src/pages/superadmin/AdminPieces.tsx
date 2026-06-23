import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Package, ChevronDown, Eye, Trash2, CheckCircle, Search, Plus, Minus, AlertTriangle } from "lucide-react";

const PIECES = [
  { id: 1, nom: "Plaquettes frein AV", ref: "BRK-308-AV", stock: 24, prix: 45, categorie: "Freinage", fournisseur: "Bosch", seuil: 5 },
  { id: 2, nom: "Filtre a huile", ref: "FLT-OIL-001", stock: 56, prix: 12, categorie: "Filtration", fournisseur: "Mann", seuil: 10 },
  { id: 3, nom: "Disque frein AR", ref: "BRK-DSK-AR", stock: 8, prix: 85, categorie: "Freinage", fournisseur: "TRW", seuil: 5 },
  { id: 4, nom: "Bougie allumage NGK", ref: "SPK-NGK-04", stock: 2, prix: 8, categorie: "Allumage", fournisseur: "NGK", seuil: 10 },
  { id: 5, nom: "Kit distribution", ref: "KIT-DIST-16V", stock: 3, prix: 220, categorie: "Distribution", fournisseur: "Gates", seuil: 2 },
  { id: 6, nom: "Amortisseur AV", ref: "SUS-AV-001", stock: 12, prix: 95, categorie: "Suspension", fournisseur: "Monroe", seuil: 4 },
  { id: 7, nom: "Courroie accessoire", ref: "BLT-ACC-01", stock: 0, prix: 35, categorie: "Accessoire", fournisseur: "Dayco", seuil: 3 },
];

export default function AdminPieces() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState(PIECES);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = data.filter((p) => p.nom.toLowerCase().includes(search.toLowerCase()) || p.ref.toLowerCase().includes(search.toLowerCase()));

  function addStock(id: number) { setData((p) => p.map((x) => x.id === id ? { ...x, stock: x.stock + 1 } : x)); setToast("+1 stock"); setTimeout(() => setToast(null), 1500); }
  function removeStock(id: number) { setData((p) => p.map((x) => x.id === id ? { ...x, stock: Math.max(0, x.stock - 1) } : x)); setToast("-1 stock"); setTimeout(() => setToast(null), 1500); }
  function removePiece(id: number) { setData((p) => p.filter((x) => x.id !== id)); setToast("Piece supprimee"); setTimeout(() => setToast(null), 2000); }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Package size={20} className="text-[#D4AF37]" /> Gestion Pieces</h1>
        <p className="mt-1 text-xs text-white/50">{data.length} references · {data.reduce((a, p) => a + p.stock, 0)} en stock</p>
      </div>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2"><CheckCircle size={16} /> {toast}</div>}
      <div className="px-4 mt-3"><div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une piece..." className="flex-1 text-sm outline-none" /></div></div>

      {/* Alertes rupture */}
      {data.filter((p) => p.stock <= p.seuil).length > 0 && (
        <div className="px-4 mt-3">
          <div className="rounded-xl bg-red-50 border border-red-200 p-3">
            <p className="text-xs font-bold text-red-700 flex items-center gap-1 mb-1"><AlertTriangle size={12} /> Alertes stock ({data.filter((p) => p.stock <= p.seuil).length})</p>
            {data.filter((p) => p.stock <= p.seuil).map((p) => (
              <p key={p.id} className="text-[10px] text-red-600">{p.nom} — <span className="font-bold">{p.stock}</span> restant(s)</p>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 mt-3 space-y-2">
        {filtered.map((p) => {
          const isExp = expanded === p.id;
          const low = p.stock <= p.seuil;
          return (
            <div key={p.id} className={`rounded-xl bg-white border overflow-hidden ${low ? "border-red-300" : "border-[#E5E7EB]"}`}>
              <button onClick={() => setExpanded(isExp ? null : p.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${low ? "bg-red-50" : "bg-[#D4AF37]/10"}`}><Package size={16} className={low ? "text-red-500" : "text-[#D4AF37]"} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111] truncate">{p.nom}</p>
                  <p className="text-[9px] text-[#6B7280]">{p.ref} · {p.categorie}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${low ? "text-red-500" : "text-green-600"}`}>{p.stock}</p>
                  <p className="text-[7px] text-[#6B7280]">{p.prix} EUR</p>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="text-[7px] text-[#6B7280]">Fournisseur</p><p className="font-bold text-[#111]">{p.fournisseur}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="text-[7px] text-[#6B7280]">Seuil alerte</p><p className="font-bold text-[#111]">{p.seuil}</p></div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => addStock(p.id)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Plus size={12} /> Entree</button>
                    <button onClick={() => removeStock(p.id)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-amber-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Minus size={12} /> Sortie</button>
                    <button onClick={() => removePiece(p.id)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Trash2 size={12} /> Supprimer</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
