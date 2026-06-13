import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { isAdmin, isPro, ROLE_LABELS } from "@shared/roles";
import type { UserRole } from "@shared/roles";

type Tab = "annonces" | "favoris" | "reservations" | "devis" | "abonnements" | "profil";

export default function Compte() {
  const { format: formatPrice } = useCurrency();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("annonces");

  const mineAnnonces = trpc.annonces.mine.useQuery(undefined, { enabled: !!user && tab === "annonces" });
  const favoris = trpc.favoris.mine.useQuery(undefined, { enabled: !!user && tab === "favoris" });
  const reservations = trpc.reservations.mine.useQuery(undefined, { enabled: !!user && tab === "reservations" });
  const devis = trpc.devis.mine.useQuery(undefined, { enabled: !!user && tab === "devis" });
  const abos = trpc.abonnements.mine.useQuery(undefined, { enabled: !!user && tab === "abonnements" });

  if (!user) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-slate-500">Connectez-vous pour accéder à votre compte.</p>
        <Link to="/connexion" className="btn-primary mt-4 inline-flex">Se connecter</Link>
      </div>
    );
  }

  const TABS: [Tab, string][] = [
    ["annonces", "Mes annonces"],
    ["favoris", "Favoris"],
    ["reservations", "Réservations"],
    ["devis", "Mes devis"],
    ["abonnements", "Abonnements"],
    ["profil", "Profil"],
  ];

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Bonjour, {user.name?.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500">
            {ROLE_LABELS[(user.role as UserRole)] || user.role}
            {user.email ? ` · ${user.email}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {isPro(user.role) && <Link to="/garage-plus" className="btn-outline">Espace Garage+</Link>}
          {isAdmin(user.role) && <Link to="/admin" className="btn-primary">Back-office</Link>}
          <button className="btn-outline" onClick={() => { logout(); navigate("/"); }}>Déconnexion</button>
        </div>
      </div>

      {isPro(user.role) && (
        <Link to="/compte/validation" className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>Validez votre compte professionnel en soumettant vos documents (KBIS, RIB, identité…).</span>
          <span className="font-semibold underline">Compléter ma validation →</span>
        </Link>
      )}

      <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-semibold ${tab === v ? "border-b-2 border-brand text-brand" : "text-slate-500"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "annonces" && (
          <div className="space-y-3">
            <Link to="/vendre" className="btn-primary inline-flex">+ Déposer une annonce</Link>
            {mineAnnonces.data?.map((a) => (
              <div key={a.id} className="card flex items-center justify-between p-4">
                <div>
                  <Link to={`/vehicule/${a.id}`} className="font-semibold text-slate-800">{a.titre}</Link>
                  <p className="text-xs text-slate-400">{a.status} · {formatPrice(Number(a.prix))}</p>
                </div>
              </div>
            ))}
            {mineAnnonces.data?.length === 0 && <p className="text-sm text-slate-500">Aucune annonce.</p>}
          </div>
        )}
        {tab === "favoris" && (
          <div className="grid gap-3 md:grid-cols-2">
            {favoris.data?.map((f) => (
              <Link key={f.annonce.id} to={`/vehicule/${f.annonce.id}`} className="card p-4">
                <p className="font-semibold text-slate-800">{f.annonce.titre}</p>
                <p className="text-sm text-brand">{formatPrice(Number(f.annonce.prix))}</p>
              </Link>
            ))}
            {favoris.data?.length === 0 && <p className="text-sm text-slate-500">Aucun favori.</p>}
          </div>
        )}
        {tab === "reservations" && (
          <div className="space-y-3">
            {reservations.data?.map((r) => (
              <div key={r.id} className="card p-4 text-sm">
                <p className="font-semibold text-slate-800">Réservation #{r.id}</p>
                <p className="text-slate-500">Acompte {r.cautionAmount} € · {r.status} · {r.cautionStatus}</p>
              </div>
            ))}
            {reservations.data?.length === 0 && <p className="text-sm text-slate-500">Aucune réservation.</p>}
          </div>
        )}
        {tab === "devis" && (
          <div className="space-y-3">
            {devis.data?.map((d) => (
              <div key={d.id} className="card p-4 text-sm">
                <p className="font-semibold text-slate-800">{d.typeIntervention}</p>
                <p className="text-slate-500">{d.vehiculeMarque} {d.vehiculeModele} · {d.status}</p>
              </div>
            ))}
            {devis.data?.length === 0 && <p className="text-sm text-slate-500">Aucune demande de devis.</p>}
          </div>
        )}
        {tab === "abonnements" && (
          <div className="space-y-3">
            <Link to="/abonnements" className="btn-outline inline-flex">Voir les offres</Link>
            {abos.data?.map((s) => (
              <div key={s.id} className="card p-4 text-sm">
                <p className="font-semibold text-slate-800">{s.planCode}</p>
                <p className="text-slate-500">{s.status} {s.amount ? `· ${s.amount} €` : ""}</p>
              </div>
            ))}
            {abos.data?.length === 0 && <p className="text-sm text-slate-500">Aucun abonnement actif.</p>}
          </div>
        )}
        {tab === "profil" && <ProfilForm />}
      </div>
    </div>
  );
}

function ProfilForm() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: "",
    city: "",
    companyName: user?.companyName || "",
  });
  const update = trpc.auth.updateProfile.useMutation({ onSuccess: (u) => setUser(u as any) });
  return (
    <div className="card max-w-lg space-y-4 p-6">
      <div><label className="label">Nom</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
      <div><label className="label">Téléphone</label><input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
      <div><label className="label">Ville</label><input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
      <div><label className="label">Société (si pro)</label><input className="input" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} /></div>
      <button className="btn-primary" disabled={update.isPending} onClick={() => update.mutate(form)}>
        {update.isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
      {update.isSuccess && <p className="text-sm text-green-600">Profil mis à jour.</p>}
    </div>
  );
}
