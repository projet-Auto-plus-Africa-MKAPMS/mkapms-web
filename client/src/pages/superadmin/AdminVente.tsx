import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Car, ChevronDown, Eye, Trash2, CheckCircle, Ban, AlertTriangle, Search, Heart, Loader2 } from "lucide-react";
import { trpc } from "../../lib/trpc";

export default function AdminVente() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; action: "supprimer" | "suspendre" | "publier" } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.annoncesAll.useQuery({ limit: 500, type: "vente" });
  const moderate = trpc.admin.moderateAnnonce.useMutation({ onSuccess: () => utils.admin.annoncesAll.invalidate() });
  const deleteAnnonce = trpc.admin.deleteAnnonce.useMutation({ onSuccess: () => utils.admin.annoncesAll.invalidate() });

  const [statusFilter, setStatusFilter] = useState<string>("tous");
  const annonces = data?.items ?? [];
  const filtered = annonces.filter((a: any) => {
    const matchesSearch = (a.titre ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.marque ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.modele ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.ville ?? "").toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === "tous") return matchesSearch;
    if (statusFilter === "publiee") return matchesSearch && a.status === "publiee";
    if (statusFilter === "vendue") return matchesSearch && a.status === "vendue";
    if (statusFilter === "archivee") return matchesSearch && (a.status === "archivee" || a.status === "expiree" || a.status === "refusee");
    return matchesSearch;
  });

  function doAction() {
    if (!confirm) return;
    if (confirm.action === "supprimer") {
      deleteAnnonce.mutate({ id: confirm.id });
    } else if (confirm.action === "suspendre") {
      moderate.mutate({ id: confirm.id, action: "archivee" });
    } else {
      moderate.mutate({ id: confirm.id, action: "publiee" });
    }
    setToast(confirm.action === "supprimer" ? "Annonce supprimée" : confirm.action === "suspendre" ? "Annonce suspendue" : "Annonce publiée");
    setConfirm(null);
    setTimeout(() => setToast(null), 2500);
  }

  const statusStyle = (s: string) => s === "publiee" ? "bg-green-50 text-green-700" : s === "vendue" ? "bg-blue-50 text-blue-700" : s === "archivee" || s === "expiree" ? "bg-red-50 text-red-700" : s === "en_validation" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600";
  const statusLabel = (s: string) => s === "publiee" ? "Publiée" : s === "vendue" ? "Vendue" : s === "archivee" ? "Archivée" : s === "en_validation" ? "En validation" : s === "expiree" ? "Expirée" : s === "refusee" ? "Refusée" : s;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} className="text-[#D4AF37]" /> Gestion Vente</h1>
        <p className="mt-1 text-xs text-white/50">{data?.total ?? 0} annonces</p>
      </div>

      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2"><CheckCircle size={16} /> {toast}</div>}

      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { id: "publiee", l: "Publiées", v: String(annonces.filter((a: any) => a.status === "publiee").length), c: "text-green-500" },
          { id: "vendue", l: "Vendues", v: String(annonces.filter((a: any) => a.status === "vendue").length), c: "text-blue-500" },
          { id: "archivee", l: "Archivées", v: String(annonces.filter((a: any) => a.status === "archivee" || a.status === "expiree" || a.status === "refusee").length), c: "text-red-500" },
        ].map((s) => (
          <button key={s.l} onClick={() => setStatusFilter(statusFilter === s.id ? "tous" : s.id)} className={`rounded-xl bg-white border p-3 text-center transition active:scale-[0.97] ${statusFilter === s.id ? "border-[#D4AF37] ring-1 ring-[#D4AF37]" : "border-[#E5E7EB]"}`}>
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>

      <div className="px-4 mt-3">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une annonce..." className="flex-1 text-sm outline-none" />
        </div>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-[#D4AF37]" /></div>}

      <div className="px-4 mt-3 space-y-2">
        {filtered.map((a: any) => {
          const isExp = expanded === a.id;
          return (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : a.id)} className="w-full text-left p-2 flex items-center gap-2.5">
                {a.photoPrincipale ? (
                  <img src={a.photoPrincipale} alt={a.titre} className="w-16 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Car size={16} className="text-slate-300" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111] truncate">{a.titre}</p>
                  <p className="text-[9px] text-[#6B7280]">{a.annee ?? ""} · {a.kilometrage ? `${Number(a.kilometrage).toLocaleString("fr-FR")} km` : ""} · {a.ville ?? ""}</p>
                  <p className="text-xs font-black text-[#D4AF37]">{Number(a.prix).toLocaleString("fr-FR")} €</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[7px] font-bold ${statusStyle(a.status)}`}>{statusLabel(a.status)}</span>
                  <span className="text-[7px] text-[#9CA3AF]">{a.vendeurType === "particulier" ? "Particulier" : a.ownership === "plateforme" ? "MKA.P-MS" : "Pro"}</span>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 text-center"><Eye size={10} className="mx-auto text-[#6B7280] mb-0.5" /><p className="font-bold text-[#111]">{a.vues ?? 0}</p><p className="text-[7px] text-[#6B7280]">vues</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 text-center"><Heart size={10} className="mx-auto text-red-400 mb-0.5" /><p className="font-bold text-[#111]">{a.favoris ?? 0}</p><p className="text-[7px] text-[#6B7280]">favoris</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-1.5 text-center"><Car size={10} className="mx-auto text-[#D4AF37] mb-0.5" /><p className="font-bold text-[#111] truncate text-[8px]">{a.marque} {a.modele}</p><p className="text-[7px] text-[#6B7280]">véhicule</p></div>
                  </div>
                  <div className="flex gap-1.5">
                    <Link to={`/vehicule/${a.id}`} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white active:scale-[0.97]"><Eye size={12} /> Voir</Link>
                    {a.status === "archivee" || a.status === "expiree" || a.status === "refusee" ? (
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
        {!isLoading && filtered.length === 0 && <p className="text-center text-sm text-[#9CA3AF] py-8">Aucune annonce trouvée</p>}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setConfirm(null)}>
          <div className="w-[85%] max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className={`mx-auto h-14 w-14 rounded-full grid place-items-center mb-3 ${confirm.action === "supprimer" ? "bg-red-50" : confirm.action === "suspendre" ? "bg-amber-50" : "bg-green-50"}`}>
              {confirm.action === "supprimer" ? <Trash2 size={24} className="text-red-500" /> : confirm.action === "suspendre" ? <Ban size={24} className="text-amber-500" /> : <CheckCircle size={24} className="text-green-500" />}
            </div>
            <h3 className="text-sm font-bold text-[#111]">{confirm.action === "supprimer" ? "Supprimer cette annonce ?" : confirm.action === "suspendre" ? "Suspendre cette annonce ?" : "Republier cette annonce ?"}</h3>
            {confirm.action === "supprimer" && <p className="text-[10px] text-red-500 mt-2 font-semibold flex items-center justify-center gap-1"><AlertTriangle size={12} /> Action irréversible</p>}
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
