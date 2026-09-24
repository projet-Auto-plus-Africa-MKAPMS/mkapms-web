import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { BoutonMoteur } from "../../lib/boutonMoteur";
import { isDirection, ROLE_LABELS, STAFF_LABELS, type UserRole, type StaffPosition } from "@shared/roles";

export default function GestionEmployesMKAPMS() {
  const { user } = useAuth();
  const equipe = trpc.admin.staffList.useQuery();
  const creer = trpc.admin.createStaff.useMutation();
  const [ouvert, setOuvert] = useState(false);
  const [succes, setSucces] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee" as "employee" | "admin", staffPosition: "agent" as Exclude<StaffPosition, "pdg"> });
  const champ = "w-full rounded-lg border border-slate-300 p-3";
  async function enregistrer() {
    const compte = await creer.mutateAsync(form);
    setSucces(`Compte créé : ${compte.email}`);
    setForm({ name: "", email: "", password: "", role: "employee", staffPosition: "agent" });
    setOuvert(false);
    void equipe.refetch();
  }
  return <main className="min-h-screen bg-[#F5F3EF] pb-24">
    <header className="bg-[#111] p-5 text-white"><Link to="/superadmin">← Super Admin</Link><h1 className="mt-3 text-xl font-bold">Employés MKA.P-MS</h1></header>
    <div className="space-y-4 p-4">
      <p>Les comptes et rôles ci-dessous proviennent de l’équipe enregistrée.</p>
      {succes && <p role="status" className="text-green-700">{succes}</p>}
      <BoutonMoteur code="admin_employe_ajouter" desactive={!isDirection(user?.role) ? "Création réservée à la direction" : undefined} onExecuter={() => setOuvert(true)} className="rounded-xl bg-[#D4AF37] px-5 py-3 font-bold">Ajouter un employé</BoutonMoteur>
      {!isDirection(user?.role) && <p>La création de comptes est réservée à la direction.</p>}
      {ouvert && <section className="space-y-3 rounded-xl bg-white p-4" aria-label="Nouveau compte interne">
        <h2 className="font-bold">Nouveau compte interne</h2>
        <label className="block">Nom<input className={champ} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
        <label className="block">Adresse e-mail<input className={champ} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
        <label className="block">Mot de passe initial (8 caractères minimum)<input className={champ} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="new-password" /></label>
        <label className="block">Rôle<select className={champ} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as "employee" | "admin" })}><option value="employee">Employé</option><option value="admin">Administration</option></select></label>
        <label className="block">Poste<select className={champ} value={form.staffPosition} onChange={e => setForm({ ...form, staffPosition: e.target.value as typeof form.staffPosition })}>{Object.entries(STAFF_LABELS).filter(([key]) => key !== "pdg").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <p className="text-sm text-slate-600">Le rôle détermine les droits du compte. Le poste est un intitulé d’organisation.</p>
        <BoutonMoteur code="admin_employe_enregistrer" onExecuter={enregistrer} desactive={creer.isPending ? "Création en cours" : undefined} className="rounded-xl bg-[#111] px-5 py-3 font-bold text-white">Créer le compte</BoutonMoteur>
        <button type="button" disabled={creer.isPending} className="ml-3 underline" onClick={() => { setOuvert(false); setForm({ ...form, password: "" }); }}>Annuler</button>
      </section>}
      {equipe.isLoading && <p role="status">Chargement de l’équipe…</p>}
      {equipe.error && <p role="alert" className="text-red-700">{equipe.error.message}</p>}
      {equipe.data?.length === 0 && <p>Aucun compte interne enregistré.</p>}
      {equipe.data?.map(e => <article key={e.id} className="rounded-xl border bg-white p-4"><h2 className="font-bold">{e.name || e.email}</h2><p>{e.email}</p><p>{ROLE_LABELS[e.role as UserRole] ?? e.role} · {e.staffPosition ? STAFF_LABELS[e.staffPosition] : "Poste non renseigné"}</p></article>)}
    </div>
  </main>;
}
