import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { isAdmin } from "@shared/roles";

export default function Admin() {
  const { user } = useAuth();
  const stats = trpc.admin.stats.useQuery(undefined, { enabled: !!user && isAdmin(user.role) });
  const annoncesPending = trpc.admin.annoncesPending.useQuery(undefined, { enabled: !!user && isAdmin(user.role) });
  const garagesPending = trpc.admin.garagesPending.useQuery(undefined, { enabled: !!user && isAdmin(user.role) });
  const utils = trpc.useUtils();
  const moderate = trpc.admin.moderateAnnonce.useMutation({ onSuccess: () => utils.admin.annoncesPending.invalidate() });
  const validate = trpc.admin.validateGarage.useMutation({ onSuccess: () => utils.admin.garagesPending.invalidate() });

  if (!user || !isAdmin(user.role)) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-slate-500">Accès réservé au back-office.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">Retour</Link>
      </div>
    );
  }

  const cards = [
    { l: "Utilisateurs", v: stats.data?.users },
    { l: "Annonces", v: stats.data?.annonces },
    { l: "Garages", v: stats.data?.garages },
    { l: "Abonnements", v: stats.data?.subscriptions },
    { l: "Paiements", v: stats.data?.payments },
    { l: "Devis", v: stats.data?.devis },
  ];

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Back-office</h1>
      <p className="text-sm text-slate-500">Administration MKA.P-MS — Auto Plus Africa.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
        {cards.map((c) => (
          <div key={c.l} className="card p-4 text-center">
            <div className="text-2xl font-extrabold text-brand">{c.v ?? "—"}</div>
            <div className="text-xs text-slate-500">{c.l}</div>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-800">Annonces à valider</h2>
        <div className="mt-3 space-y-2">
          {annoncesPending.data?.map((a) => (
            <div key={a.id} className="card flex items-center justify-between p-3">
              <span className="text-sm font-medium text-slate-700">{a.titre}</span>
              <div className="flex gap-2">
                <button className="btn-primary !py-1.5 !text-xs" onClick={() => moderate.mutate({ id: a.id, action: "publiee" })}>Publier</button>
                <button className="btn-outline !py-1.5 !text-xs" onClick={() => moderate.mutate({ id: a.id, action: "refusee" })}>Refuser</button>
              </div>
            </div>
          ))}
          {annoncesPending.data?.length === 0 && <p className="text-sm text-slate-500">Aucune annonce en attente.</p>}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-800">Garages à valider</h2>
        <div className="mt-3 space-y-2">
          {garagesPending.data?.map((g) => (
            <div key={g.id} className="card flex items-center justify-between p-3">
              <span className="text-sm font-medium text-slate-700">{g.name} — {g.city}</span>
              <div className="flex gap-2">
                <button className="btn-primary !py-1.5 !text-xs" onClick={() => validate.mutate({ id: g.id, action: "valide" })}>Valider</button>
                <button className="btn-outline !py-1.5 !text-xs" onClick={() => validate.mutate({ id: g.id, action: "refuse" })}>Refuser</button>
              </div>
            </div>
          ))}
          {garagesPending.data?.length === 0 && <p className="text-sm text-slate-500">Aucun garage en attente.</p>}
        </div>
      </section>
    </div>
  );
}
