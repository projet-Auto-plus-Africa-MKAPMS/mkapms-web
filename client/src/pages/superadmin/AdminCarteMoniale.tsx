import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { BoutonMoteur } from "../../lib/boutonMoteur";

export default function AdminCarteMoniale() {
  const dialog = useRef<HTMLDialogElement>(null);
  const countries = trpc.countries.stats.useQuery();
  const [selected, setSelected] = useState<string | null>(null);
  const [usersOffset, setUsersOffset] = useState(0);
  const [annoncesOffset, setAnnoncesOffset] = useState(0);
  const activity = trpc.countries.activity.useQuery({ code: selected ?? "", usersOffset, annoncesOffset }, { enabled: selected !== null });
  useEffect(() => { if (selected !== null && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [selected]);
  const country = countries.data?.find(c => c.code === selected);
  const button = "rounded-lg border px-3 py-2 disabled:opacity-40";
  return <main className="min-h-screen bg-[#F5F3EF] pb-24">
    <header className="bg-[#111] p-5 text-white"><Link to="/superadmin">← Super Admin</Link><h1 className="mt-3 flex items-center gap-2 text-xl font-bold"><Globe /> Carte mondiale</h1>
      {countries.data && <p>{countries.data.filter(c => c.active).length} pays actifs · {countries.data.reduce((n,c) => n+c.users, 0)} utilisateurs</p>}
    </header>
    <div className="space-y-3 p-4">
      {countries.isLoading && <p role="status">Chargement des pays…</p>}
      {countries.error && <p role="alert">{countries.error.message}</p>}
      {countries.data?.length === 0 && <p>Aucun pays ni activité enregistrés.</p>}
      <p className="text-sm text-slate-600">Encaissements confirmés, toutes dates, par devise et pays actuel du compte payeur. Ces montants ne constituent pas un chiffre d’affaires comptable.</p>
      {countries.data?.map(p => <BoutonMoteur key={p.code} code="admin_pays_activite" onExecuter={() => { setSelected(p.code); setUsersOffset(0); setAnnoncesOffset(0); }} className="w-full rounded-xl border bg-white p-4 text-left">
        <span className="block font-bold">{p.name} {p.code && `(${p.code})`}</span>
        <span className="block text-sm">{p.users} utilisateurs · {p.annonces} annonces · {p.active ? "Pays actif" : p.configured ? "Pays inactif" : "Configuration à compléter"}</span>
        <span className="block text-sm text-amber-800">{p.encaissements.length ? p.encaissements.map(v => `${v.amount} ${v.currency} (${v.count} paiements)`).join(" · ") : "Aucun encaissement confirmé"}</span>
      </BoutonMoteur>)}
      {selected !== null && <dialog ref={dialog} onCancel={() => setSelected(null)} aria-label="Activité du pays" className="max-h-[85vh] w-[min(95vw,48rem)] space-y-3 overflow-y-auto rounded-xl border bg-white p-4 backdrop:bg-black/50">
        <div className="flex justify-between gap-3"><h2 className="font-bold">{country?.name ?? selected} — utilisateurs et annonces</h2><button type="button" className={button} onClick={() => setSelected(null)}>Fermer</button></div>
        {activity.isFetching && <p role="status">Chargement de l’activité…</p>}
        {activity.error && <p role="alert">{activity.error.message}</p>}
        {activity.data && <>
          <h3 className="font-bold">Utilisateurs</h3>
          {activity.data.accounts.length === 0 && <p>Aucun utilisateur sur cette page.</p>}
          <ul>{activity.data.accounts.map(u => <li key={u.id} className="border-b py-2">#{u.id} · {u.name || "Nom non renseigné"} · {u.accountType}</li>)}</ul>
          <div className="flex gap-2"><button className={button} disabled={!usersOffset || activity.isFetching} onClick={() => setUsersOffset(n => Math.max(0,n-50))}>Utilisateurs précédents</button><button className={button} disabled={!activity.data.moreAccounts || activity.isFetching} onClick={() => setUsersOffset(n => n+50)}>Utilisateurs suivants</button></div>
          <h3 className="font-bold">Annonces</h3>
          {activity.data.listings.length === 0 && <p>Aucune annonce sur cette page.</p>}
          <ul>{activity.data.listings.map(a => <li key={a.id} className="border-b py-2">#{a.id} · {a.titre} · {a.status}</li>)}</ul>
          <div className="flex gap-2"><button className={button} disabled={!annoncesOffset || activity.isFetching} onClick={() => setAnnoncesOffset(n => Math.max(0,n-50))}>Annonces précédentes</button><button className={button} disabled={!activity.data.moreListings || activity.isFetching} onClick={() => setAnnoncesOffset(n => n+50)}>Annonces suivantes</button></div>
        </>}
      </dialog>}
    </div>
  </main>;
}
