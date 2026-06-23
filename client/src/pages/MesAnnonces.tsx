import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Edit3, Trash2, Eye, X, Car } from "lucide-react";
import { trpc } from "../lib/trpc";

export default function MesAnnonces() {
  const list = trpc.annonces.myList.useQuery();
  const updateMut = trpc.annonces.update.useMutation({ onSuccess: () => list.refetch() });
  const removeMut = trpc.annonces.remove.useMutation({ onSuccess: () => list.refetch() });

  const [editId, setEditId] = useState<number | null>(null);
  const [editPrix, setEditPrix] = useState("");
  const [editKm, setEditKm] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editVille, setEditVille] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSoldOnPlatform, setDeleteSoldOnPlatform] = useState<boolean | null>(null);
  const [deleteSoldPrice, setDeleteSoldPrice] = useState("");

  const annonces = list.data ?? [];

  const openEdit = (a: any) => {
    setEditId(a.id);
    setEditPrix(a.prix?.toString() || "");
    setEditKm(a.kilometrage?.toString() || "");
    setEditDesc(a.description || "");
    setEditVille(a.ville || "");
  };

  const saveEdit = () => {
    if (!editId) return;
    updateMut.mutate({
      id: editId,
      ...(editPrix ? { prix: Number(editPrix) } : {}),
      ...(editKm ? { kilometrage: Number(editKm) } : {}),
      ...(editDesc ? { description: editDesc } : {}),
      ...(editVille ? { ville: editVille } : {}),
    });
    setEditId(null);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    removeMut.mutate({
      id: deleteId,
      ...(deleteReason ? { reason: deleteReason } : {}),
      ...(deleteSoldOnPlatform !== null ? { soldOnPlatform: deleteSoldOnPlatform } : {}),
      ...(deleteSoldPrice ? { soldPrice: Number(deleteSoldPrice) } : {}),
    });
    setDeleteId(null);
    setDeleteReason("");
    setDeleteSoldOnPlatform(null);
    setDeleteSoldPrice("");
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* Header */}
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/tableau-de-bord" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Mon espace
        </Link>
        <h1 className="text-xl font-black text-white">Mes annonces</h1>
        <p className="text-sm text-white/60">{annonces.length} annonce{annonces.length > 1 ? "s" : ""}</p>
      </div>

      {/* Liste */}
      <div className="px-4 mt-4 space-y-3">
        {annonces.length === 0 && !list.isLoading && (
          <div className="rounded-xl bg-white border border-slate-200 p-8 text-center">
            <Car size={40} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">Aucune annonce pour le moment</p>
            <Link to="/acheter/depot-annonce" className="mt-3 inline-block rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white">Publier une annonce</Link>
          </div>
        )}

        {annonces.map((a: any) => (
          <div key={a.id} className="rounded-xl bg-white border border-slate-200 overflow-hidden">
            <div className="flex gap-3 p-3">
              {/* Photo */}
              <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {a.photoPrincipale ? (
                  <img src={a.photoPrincipale} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-300"><Car size={24} /></div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#111] truncate">{a.titre || `${a.marque} ${a.modele}`}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{a.annee} &bull; {a.kilometrage?.toLocaleString("fr-FR")} km &bull; {a.carburant}</p>
                <p className="text-sm font-bold text-red-600 mt-1">{a.prix?.toLocaleString("fr-FR")} &euro;</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  a.status === "publiee" ? "bg-green-100 text-green-700"
                    : a.status === "reservee" ? "bg-amber-100 text-amber-700"
                    : a.status === "vendue" ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {a.status === "publiee" ? "Active" : a.status === "reservee" ? "Réservée" : a.status === "vendue" ? "Vendue" : "Archivée"}
                </span>
              </div>
            </div>
            {/* Actions */}
            <div className="flex border-t border-slate-100">
              <Link to={`/acheter/${a.id}`} className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                <Eye size={14} /> Voir
              </Link>
              <button onClick={() => openEdit(a)} className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition border-l border-slate-100">
                <Edit3 size={14} /> Modifier
              </button>
              <button onClick={() => setDeleteId(a.id)} className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition border-l border-slate-100">
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal Modifier ── */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setEditId(null)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#111]">Modifier l'annonce</h2>
              <button onClick={() => setEditId(null)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Prix (&euro;)</label>
                <input type="number" value={editPrix} onChange={(e) => setEditPrix(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Kilométrage</label>
                <input type="number" value={editKm} onChange={(e) => setEditKm(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Ville</label>
                <input type="text" value={editVille} onChange={(e) => setEditVille(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm resize-none" />
              </div>
            </div>
            <button onClick={saveEdit} disabled={updateMut.isPending} className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white active:scale-[0.98] transition disabled:opacity-50">
              {updateMut.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Supprimer (avec questionnaire optionnel) ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#111]">Supprimer l'annonce</h2>
              <button onClick={() => setDeleteId(null)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><X size={16} /></button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Vous êtes sur le point de supprimer cette annonce. Cette action est irréversible.
            </p>

            {/* Questionnaire optionnel */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase">Questionnaire (optionnel)</p>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5">Le véhicule a-t-il été vendu ?</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteSoldOnPlatform(true)} className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${deleteSoldOnPlatform === true ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 text-slate-600"}`}>
                    Oui, sur MKA.P-MS
                  </button>
                  <button onClick={() => setDeleteSoldOnPlatform(false)} className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${deleteSoldOnPlatform === false ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600"}`}>
                    Oui, ailleurs
                  </button>
                </div>
              </div>

              {deleteSoldOnPlatform !== null && (
                <div>
                  <label className="text-xs font-semibold text-slate-600">Prix de vente (optionnel)</label>
                  <input type="number" value={deleteSoldPrice} onChange={(e) => setDeleteSoldPrice(e.target.value)} placeholder="Ex: 15000" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600">Raison de la suppression (optionnel)</label>
                <select value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
                  <option value="">— Sélectionner —</option>
                  <option value="vendu_mkapms">Vendu sur MKA.P-MS</option>
                  <option value="vendu_ailleurs">Vendu ailleurs</option>
                  <option value="plus_disponible">Plus disponible</option>
                  <option value="erreur">Annonce publiée par erreur</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 active:scale-[0.98] transition">
                Annuler
              </button>
              <button onClick={confirmDelete} disabled={removeMut.isPending} className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white active:scale-[0.98] transition disabled:opacity-50">
                {removeMut.isPending ? "Suppression..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
