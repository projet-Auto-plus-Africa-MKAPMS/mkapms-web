import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, CheckCircle, XCircle } from "lucide-react";
import { trpc } from "../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   DÉTAIL D'UNE DEMANDE DE PUBLICITÉ (/publicite/:id)
   Réutilise le vrai moteur déjà utilisé par Admin.tsx (server/routers/admin.ts :
   pubRequestDetail/decidePubRequest/deletePubRequest, table pub_requests) —
   aucun second moteur créé. L'ancienne version affichait 3 demandes fabriquées
   (DEMO_DEMANDES) avec des champs qui n'existent pas en base (SIRET, adresse,
   lien, photo, tarif, statuts « en pause »/« remise en ligne ») : retirés.
   Seuls les champs réellement stockés sur pub_requests sont affichés, et
   seules les actions réellement câblées côté serveur (Approuver/Refuser tant
   que la demande est en attente, Supprimer) sont proposées.
   ══════════════════════════════════════════════════════════════════════════ */

export default function PubliciteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const demandeQuery = trpc.admin.pubRequestDetail.useQuery({ id: Number(id) }, { enabled: !!id });
  const decidePub = trpc.admin.decidePubRequest.useMutation({
    onSuccess: () => { utils.admin.pubRequestDetail.invalidate({ id: Number(id) }); utils.admin.pubRequestsList.invalidate(); },
  });
  const deletePub = trpc.admin.deletePubRequest.useMutation({
    onSuccess: () => { utils.admin.pubRequestsList.invalidate(); navigate("/admin"); },
  });
  const [refusalReason, setRefusalReason] = useState("");

  const demande = demandeQuery.data;

  return (
    <div className="container-page py-6">
      <Link to="/admin" className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-[#D4AF37]">
        <ArrowLeft size={16} /> Retour aux publicités
      </Link>

      {demandeQuery.isLoading && <p className="text-sm text-slate-400">Chargement…</p>}
      {demandeQuery.isError && <p className="text-sm text-red-600">Accès refusé ou erreur : {demandeQuery.error.message}</p>}
      {demandeQuery.isSuccess && !demande && <p className="text-sm text-slate-400">Cette demande de publicité n'existe pas ou a été supprimée.</p>}

      {demande && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#111]">{demande.entreprise}</h1>
              <p className="text-sm text-slate-500">
                PUB-{String(demande.id).padStart(3, "0")} · Déposée le {new Date(demande.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${demande.status === "approuvee" ? "bg-green-100 text-green-700" : demande.status === "refusee" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
              {demande.status === "approuvee" ? "Approuvée" : demande.status === "refusee" ? "Refusée" : "En attente"}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-700">Informations de l'annonceur</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "Type d'activité", value: demande.type },
                { label: "Emplacement demandé", value: demande.emplacement },
                { label: "Contact", value: demande.contactName },
                { label: "Téléphone", value: demande.contactPhone },
                { label: "Email", value: demande.contactEmail },
                { label: "Budget", value: demande.budget },
                { label: "Durée demandée", value: demande.duree },
              ].filter((f) => f.value).map((field) => (
                <div key={field.label} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400">{field.label}</p>
                  <p className="mt-0.5 text-sm text-slate-800">{field.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-bold text-slate-700">Description</h2>
            <p className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">{demande.description || "Aucune description fournie."}</p>
          </div>

          {demande.refusalReason && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-[10px] font-bold uppercase text-red-500">Motif du refus</p>
              <p className="mt-0.5 text-sm text-red-700">{demande.refusalReason}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {demande.status === "en_attente" && (
              <>
                <button
                  onClick={() => decidePub.mutate({ id: demande.id, decision: "approuvee" })}
                  disabled={decidePub.isPending}
                  className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={14} /> Approuver
                </button>
                <div className="flex items-center gap-2">
                  <input
                    value={refusalReason}
                    onChange={(e) => setRefusalReason(e.target.value)}
                    placeholder="Motif du refus (optionnel)"
                    className="rounded-lg border border-slate-200 px-2 py-2 text-xs"
                  />
                  <button
                    onClick={() => decidePub.mutate({ id: demande.id, decision: "refusee", refusalReason: refusalReason || undefined })}
                    disabled={decidePub.isPending}
                    className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle size={14} /> Refuser
                  </button>
                </div>
              </>
            )}
            <button
              onClick={() => { if (confirm("Supprimer définitivement cette demande ?")) deletePub.mutate({ id: demande.id }); }}
              disabled={deletePub.isPending}
              className="flex items-center gap-1 rounded-lg bg-red-100 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-200 disabled:opacity-50"
            >
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
