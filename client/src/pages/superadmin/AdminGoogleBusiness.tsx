import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MapPin, CheckCircle2, Star, Plus } from "lucide-react";
import { trpc } from "../../lib/trpc";

/**
 * Direction — Connecteur Google Business Profile.
 *
 * Le connecteur (server/connectors/google-business/) était complet et
 * honnête (jamais de note Google inventée, jamais un état "actif" sans clé
 * réelle) mais n'avait aucun consommateur : la Direction ne pouvait ni
 * déclarer un établissement, ni voir son état, ni saisir un relevé manuel
 * en attendant les clés API (GOOGLE_BUSINESS_CLIENT_ID/SECRET/REFRESH_TOKEN).
 */
export default function AdminGoogleBusiness() {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const statusQuery = trpc.googleBusiness.etat.useQuery();
  const locationsQuery = trpc.googleBusiness.etablissements.useQuery();

  const [form, setForm] = useState({ targetType: "garage", targetId: "", nom: "", countryCode: "", ville: "", placeId: "", gbpUrl: "" });
  const declarer = trpc.googleBusiness.declarer.useMutation({
    onSuccess: () => { showToast("Établissement déclaré."); locationsQuery.refetch(); setForm({ ...form, targetId: "", nom: "" }); },
    onError: (e) => showToast(e.message),
  });
  const verifier = trpc.googleBusiness.verifier.useMutation({
    onSuccess: () => { showToast("Statut mis à jour."); locationsQuery.refetch(); },
    onError: (e) => showToast(e.message),
  });

  const [releveForm, setReleveForm] = useState<{ locationId: number | null; averageRating: string; reviewCount: string }>({ locationId: null, averageRating: "", reviewCount: "" });
  const releveManuel = trpc.googleBusiness.releveManuel.useMutation({
    onSuccess: () => { showToast("Relevé manuel enregistré."); setReleveForm({ locationId: null, averageRating: "", reviewCount: "" }); },
    onError: (e) => showToast(e.message),
  });

  const status = statusQuery.data;

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-24">
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-xl">{toast}</div>}
      <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><MapPin size={20} className="text-purple-400" /> Connecteur Google Business</h1>
      </div>

      <div className="px-4 mt-6 space-y-4">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3">État du connecteur</h2>
          {statusQuery.isLoading && <p className="text-xs text-white/40">Chargement…</p>}
          {status && (
            <>
              <span className={`inline-block rounded-full px-3 py-1 text-[9px] font-bold mb-3 ${status.state === "actif" ? "text-green-600 bg-green-50" : status.state === "configure" ? "text-amber-600 bg-amber-50" : "text-slate-600 bg-slate-100"}`}>
                {status.state === "actif" ? "Actif" : status.state === "configure" ? "Configuré" : "Non configuré"}
              </span>
              <p className="text-xs text-white/60">{status.message}</p>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="rounded-lg bg-white/5 p-2 text-center"><p className="text-[9px] text-white/40">Établissements</p><p className="text-sm font-bold text-white">{status.etablissements}</p></div>
                <div className="rounded-lg bg-white/5 p-2 text-center"><p className="text-[9px] text-white/40">Vérifiés</p><p className="text-sm font-bold text-white">{status.etablissementsVerifies}</p></div>
                <div className="rounded-lg bg-white/5 p-2 text-center"><p className="text-[9px] text-white/40">Relevés API</p><p className="text-sm font-bold text-white">{status.relevesApi}</p></div>
              </div>
              <div className="mt-3 flex gap-2 text-[10px] text-white/40">
                <span>Client ID : {status.credentials.clientId ? "présent" : "absent"}</span>
                <span>·</span>
                <span>Secret : {status.credentials.clientSecret ? "présent" : "absent"}</span>
                <span>·</span>
                <span>Refresh token : {status.credentials.refreshToken ? "présent" : "absent"}</span>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><Plus size={14} /> Déclarer un établissement</h2>
          <div className="grid grid-cols-2 gap-2">
            <select className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white" value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
              <option value="garage">Garage</option>
              <option value="boutique_pieces">Boutique pièces</option>
              <option value="agence">Agence</option>
            </select>
            <input className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30" placeholder="ID interne (targetId)" type="number" value={form.targetId} onChange={(e) => setForm({ ...form, targetId: e.target.value })} />
            <input className="col-span-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30" placeholder="Nom de l'établissement" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            <input className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30" placeholder="Pays (FR)" value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} />
            <input className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30" placeholder="Ville" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
            <input className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30" placeholder="Place ID Google (optionnel)" value={form.placeId} onChange={(e) => setForm({ ...form, placeId: e.target.value })} />
            <input className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30" placeholder="URL fiche Google (optionnel)" value={form.gbpUrl} onChange={(e) => setForm({ ...form, gbpUrl: e.target.value })} />
          </div>
          <button
            className="mt-3 w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            disabled={declarer.isPending || !form.targetId || !form.nom}
            onClick={() => declarer.mutate({
              targetType: form.targetType,
              targetId: Number(form.targetId),
              nom: form.nom,
              countryCode: form.countryCode || undefined,
              ville: form.ville || undefined,
              placeId: form.placeId || undefined,
              gbpUrl: form.gbpUrl || undefined,
            })}
          >
            {declarer.isPending ? "Envoi…" : "Déclarer"}
          </button>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3">Établissements ({locationsQuery.data?.length ?? 0})</h2>
          {locationsQuery.data?.length === 0 && <p className="text-xs text-white/40">Aucun établissement déclaré.</p>}
          <div className="space-y-2">
            {locationsQuery.data?.map((loc) => (
              <div key={loc.id} className="rounded-xl bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{loc.nom}</p>
                    <p className="text-[10px] text-white/40">{loc.targetType} #{loc.targetId} — {loc.ville ?? "—"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${loc.status === "verifie" ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>{loc.status}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  {loc.status !== "verifie" && (
                    <button onClick={() => verifier.mutate({ locationId: loc.id, verifie: true })} className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white flex items-center gap-1"><CheckCircle2 size={10} /> Vérifier</button>
                  )}
                  <button onClick={() => setReleveForm({ locationId: loc.id, averageRating: "", reviewCount: "" })} className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white flex items-center gap-1"><Star size={10} /> Relevé manuel</button>
                </div>
                {releveForm.locationId === loc.id && (
                  <div className="mt-2 flex gap-2 items-end">
                    <input className="w-20 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white" placeholder="Note /5" type="number" step="0.1" min="1" max="5" value={releveForm.averageRating} onChange={(e) => setReleveForm({ ...releveForm, averageRating: e.target.value })} />
                    <input className="w-24 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white" placeholder="Nb avis" type="number" min="0" value={releveForm.reviewCount} onChange={(e) => setReleveForm({ ...releveForm, reviewCount: e.target.value })} />
                    <button
                      className="rounded-lg bg-purple-600 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
                      disabled={releveManuel.isPending || !releveForm.averageRating || !releveForm.reviewCount}
                      onClick={() => releveManuel.mutate({ locationId: loc.id, averageRating: Number(releveForm.averageRating), reviewCount: Number(releveForm.reviewCount) })}
                    >
                      Enregistrer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
