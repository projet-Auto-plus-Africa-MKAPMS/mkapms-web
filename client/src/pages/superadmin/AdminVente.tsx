import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Car, ChevronDown, Eye, Edit3, Trash2, X, CheckCircle, Ban, AlertTriangle, Search, Heart } from "lucide-react";

const ANNONCES = [
  { id: 1, titre: "Peugeot 308 GT Line", prix: 18500, km: 45000, annee: 2021, ville: "Paris", vendeur: "Garage Auto 93", statut: "publiee", vues: 342, favoris: 28, photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=200&h=120&fit=crop" },
  { id: 2, titre: "BMW Serie 3 320d", prix: 24900, km: 62000, annee: 2020, ville: "Lyon", statut: "publiee", vendeur: "Sophie L.", vues: 128, favoris: 15, photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=200&h=120&fit=crop" },
  { id: 3, titre: "Renault Clio V", prix: 14200, km: 28000, annee: 2022, ville: "Marseille", statut: "publiee", vendeur: "Ahmed K.", vues: 89, favoris: 7, photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=200&h=120&fit=crop" },
  { id: 4, titre: "Audi A4 Avant", prix: 29800, km: 55000, annee: 2019, ville: "Bordeaux", statut: "reservee", vendeur: "Martin D.", vues: 215, favoris: 19, photo: "https://images.unsplash.com/photo-1606611013016-969c19ba27f5?w=200&h=120&fit=crop" },
  { id: 5, titre: "Mercedes Classe A", prix: 22000, km: 38000, annee: 2021, ville: "Toulouse", statut: "suspendue", vendeur: "Pierre M.", vues: 56, favoris: 3, photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=200&h=120&fit=crop" },
];

export default function AdminVente() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState(ANNONCES);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; action: "supprimer" | "suspendre" | "publier" } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = data.filter((a) => a.titre.toLowerCase().includes(search.toLowerCase()) || a.vendeur.toLowerCase().includes(search.toLowerCase()));

  function doAction() {
    if (!confirm) return;
    setData((prev) => {
      if (confirm.action === "supprimer") return prev.filter((a) => a.id !== confirm.id);
      return prev.map((a) => a.id !== confirm.id ? a : { ...a, statut: confirm.action === "suspendre" ? "suspendue" : "publiee" });
    });
    setToast(confirm.action === "supprimer" ? "Annonce supprimee" : confirm.action === "suspendre" ? "Annonce suspendue" : "Annonce publiee");
    setConfirm(null);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} className="text-[#D4AF37]" /> Gestion Vente</h1>
        <p className="mt-1 text-xs text-white/50">{data.length} annonces</p>
      </div>

      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2"><CheckCircle size={16} /> {toast}</div>}

      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Publiees", v: String(data.filter((a) => a.statut === "publiee").length), c: "text-green-500" },
          { l: "Reservees", v: String(data.filter((a) => a.statut === "reservee").length), c: "text-blue-500" },
          { l: "Suspendues", v: String(data.filter((a) => a.statut === "suspendue").length), c: "text-red-500" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center"><p className={`text-lg font-black ${s.c}`}>{s.v}</p><p className="text-[9px] text-[#6B7280]">{s.l}</p></div>
        ))}
      </div>

      <div className="px-4 mt-3">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une annonce..." className="flex-1 text-sm outline-none" />
        </div>
      </div>

      <div className="px-4 mt-3 space-y-2">
        {filtered.map((a) => {
          const isExp = expanded === a.id;
          return (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : a.id)} className="w-full text-left p-2 flex items-center gap-2.5">
                <img src={a.photo} alt={a.titre} className="w-16 h-12 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111] truncate">{a.titre}</p>
                  <p className="text-[9px] text-[#6B7280]">{a.annee} · {a.km.toLocaleString("fr-FR")} km · {a.ville}</p>
                  <p className="text-xs font-black text-[#D4AF37]">{a.prix.toLocaleString("fr-FR")} EUR</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[7px] font-bold ${a.statut === "publiee" ? "bg-green-50 text-green-700" : a.statut === "reservee" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>{a.statut}</span>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 text-center"><Eye size={10} className="mx-auto text-[#6B7280] mb-0.5" /><p className="font-bold text-[#111]">{a.vues}</p><p className="text-[7px] text-[#6B7280]">vues</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 text-center"><Heart size={10} className="mx-auto text-red-400 mb-0.5" /><p className="font-bold text-[#111]">{a.favoris}</p><p className="text-[7px] text-[#6B7280]">favoris</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 text-center"><Car size={10} className="mx-auto text-[#D4AF37] mb-0.5" /><p className="font-bold text-[#111]">{a.vendeur}</p><p className="text-[7px] text-[#6B7280]">vendeur</p></div>
                  </div>
                  <div className="flex gap-1.5">
                    <Link to={`/vehicule/${a.id}`} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Eye size={12} /> Voir</Link>
                    {a.statut === "suspendue" ? (
                      <button onClick={() => setConfirm({ id: a.id, action: "publier" })} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><CheckCircle size={12} /> Publier</button>
                    ) : (
                      <button onClick={() => setConfirm({ id: a.id, action: "suspendre" })} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-amber-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Ban size={12} /> Suspendre</button>
                    )}
                    <button onClick={() => setConfirm({ id: a.id, action: "supprimer" })} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Trash2 size={12} /> Supprimer</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setConfirm(null)}>
          <div className="w-[85%] max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className={`mx-auto h-14 w-14 rounded-full grid place-items-center mb-3 ${confirm.action === "supprimer" ? "bg-red-50" : confirm.action === "suspendre" ? "bg-amber-50" : "bg-green-50"}`}>
              {confirm.action === "supprimer" ? <Trash2 size={24} className="text-red-500" /> : confirm.action === "suspendre" ? <Ban size={24} className="text-amber-500" /> : <CheckCircle size={24} className="text-green-500" />}
            </div>
            <h3 className="text-sm font-bold text-[#111]">{confirm.action === "supprimer" ? "Supprimer cette annonce ?" : confirm.action === "suspendre" ? "Suspendre cette annonce ?" : "Republier cette annonce ?"}</h3>
            {confirm.action === "supprimer" && <p className="text-[10px] text-red-500 mt-2 font-semibold flex items-center justify-center gap-1"><AlertTriangle size={12} /> Action irreversible</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirm(null)} className="flex-1 rounded-xl border border-[#E5E7EB] py-2.5 text-xs font-bold text-[#6B7280]">Annuler</button>
              <button onClick={doAction} className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white ${confirm.action === "supprimer" ? "bg-red-500" : confirm.action === "suspendre" ? "bg-amber-500" : "bg-green-500"}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
