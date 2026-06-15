import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Package, Users, FileText, Receipt, Wrench } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const OUTILS = [
  { icon: FileText, t: "Devis", d: "Créez et suivez vos devis clients." },
  { icon: Wrench, t: "Interventions", d: "Planifiez et suivez l'atelier." },
  { icon: Calendar, t: "Agenda", d: "Rendez-vous et disponibilités." },
  { icon: Package, t: "Stock pièces", d: "Gérez votre stock et seuils d'alerte." },
  { icon: Users, t: "Clients & employés", d: "Fichier clients et comptes employés." },
  { icon: Receipt, t: "Facturation", d: "Factures conformes automatiques." },
];

export default function GaragePlus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", city: "", phone: "", description: "" });
  const register = trpc.garages.register.useMutation({ onSuccess: () => navigate("/compte") });

  if (!user) {
    return (
      <div className="container-page py-14">
        <div className="rounded-2xl bg-gradient-to-br from-brand-dark to-brand p-10 text-white">
          <h1 className="text-3xl font-extrabold">Espace Garage+ Pro</h1>
          <p className="mt-3 max-w-xl text-white/90">
            Devis, interventions, agenda, stock, clients, employés et facturation — tout pour piloter
            votre garage. Inscription en 5 étapes (SIRET, KBIS, RIB).
          </p>
          <Link to="/connexion" className="btn-gold mt-6 inline-flex">Se connecter / S'inscrire</Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {OUTILS.map((o) => {
            const Icon = o.icon;
            return (
              <div key={o.t} className="card p-5">
                <Icon className="text-gold-dark" />
                <h3 className="mt-3 font-bold text-slate-900">{o.t}</h3>
                <p className="mt-1 text-sm text-slate-500">{o.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Inscrire mon garage</h1>
      <p className="mt-1 text-sm text-slate-500">
        Votre fiche sera vérifiée par notre équipe (SIRET, KBIS, RIB) avant publication.
      </p>
      <div className="card mt-6 max-w-xl space-y-4 p-6">
        <div><label className="label">Nom du garage *</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
        <div><label className="label">Ville</label><input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
        <div><label className="label">Téléphone</label><input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
        <div><label className="label">Description des services</label><textarea className="input min-h-24" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
        <button
          className="btn-primary w-full"
          disabled={register.isPending || !form.name}
          onClick={() => register.mutate({ name: form.name, city: form.city, phone: form.phone, description: form.description })}
        >
          {register.isPending ? "Envoi…" : "Soumettre mon garage"}
        </button>
        {register.error && <p className="text-sm text-red-600">{register.error.message}</p>}
      </div>
    </div>
  );
}
