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
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5 border-b border-white/5">
        <Link to="/superadmin" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 hover:text-[#D4AF37] transition-colors"><ChevronLeft size={12} /> Super Admin</Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tighter italic">GESTION PIÈCES</h1>
            <p className="mt-1 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest opacity-80">{data.length} RÉFÉRENCES · {data.reduce((a, p) => a + p.stock, 0)} UNITÉS</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 shadow-lg shadow-[#D4AF37]/5">
            <Package size={24} className="text-[#D4AF37]" />
          </div>
        </div>
      </div>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2"><CheckCircle size={16} /> {toast}</div>}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5 focus-within:border-[#D4AF37]/50 transition-all">
          <Search size={16} className="text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Référence ou nom de pièce..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20 font-medium" />
        </div>
      </div>

      {/* Alertes rupture */}
      {data.filter((p) => p.stock <= p.seuil).length > 0 && (
        <div className="px-4 mt-4">
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2 mb-2"><AlertTriangle size={14} /> ALERTES RUPTURE ({data.filter((p) => p.stock <= p.seuil).length})</p>
            <div className="space-y-1">
              {data.filter((p) => p.stock <= p.seuil).map((p) => (
                <p key={p.id} className="text-xs text-red-300/80 font-medium">{p.nom} — <span className="text-white font-black">{p.stock}</span> restant(s)</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mt-4 space-y-3">
        {filtered.map((p) => {
          const isExp = expanded === p.id;
          const low = p.stock <= p.seuil;
          return (
            <div key={p.id} className={`rounded-3xl border transition-all duration-300 ${isExp ? "bg-white/10 border-[#D4AF37]/30 shadow-2xl shadow-[#D4AF37]/5" : "bg-white/5 border-white/10"}`}>
              <button onClick={() => setExpanded(isExp ? null : p.id)} className="w-full text-left p-4 flex items-center gap-4">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-colors ${low ? "bg-red-500/20 text-red-400 border border-red-500/30" : isExp ? "bg-[#D4AF37] text-white" : "bg-white/5 text-[#D4AF37] border border-white/5"}`}>
                  <Package size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white tracking-tight">{p.nom}</p>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">{p.ref} • {p.categorie}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div className="hidden sm:block">
                    <p className={`text-lg font-black tracking-tighter ${low ? "text-red-400" : "text-green-400"}`}>{p.stock}</p>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{p.prix} €</p>
                  </div>
                  <ChevronDown size={14} className={`text-white/20 transition-transform duration-300 ${isExp ? "rotate-180 text-[#D4AF37]" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-4 pb-4 border-t border-white/5 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/5">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Fournisseur</span>
                      <p className="text-xs font-black text-white mt-1">{p.fournisseur}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/5">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Seuil Alerte</span>
                      <p className="text-xs font-black text-red-400 mt-1">{p.seuil} unités</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/5 sm:hidden">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Prix Unitaire</span>
                      <p className="text-xs font-black text-[#D4AF37] mt-1">{p.prix} €</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/5 sm:hidden">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Stock Actuel</span>
                      <p className={`text-xs font-black mt-1 ${low ? "text-red-400" : "text-green-400"}`}>{p.stock}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addStock(p.id)} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-500/10 py-3 text-[10px] font-black uppercase text-green-400 hover:bg-green-500 hover:text-white transition-all"><Plus size={14} /> Entrée</button>
                    <button onClick={() => removeStock(p.id)} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-amber-500/10 py-3 text-[10px] font-black uppercase text-amber-400 hover:bg-amber-500 hover:text-white transition-all"><Minus size={14} /> Sortie</button>
                    <button onClick={() => removePiece(p.id)} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-red-500/10 py-3 text-[10px] font-black uppercase text-red-400 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /> Suppr.</button>
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
