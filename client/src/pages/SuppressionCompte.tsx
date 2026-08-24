import { useState } from "react";
import { AlertTriangle, Check, Trash2 } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/**
 * Page publique de suppression de compte.
 *
 * Exigée par Google Play et l'App Store : l'adresse doit être accessible sans
 * installer l'application ni se connecter, parce qu'une personne qui veut
 * partir a souvent déjà perdu l'accès à son compte.
 *
 * Elle ne promet rien qu'elle ne fasse : ce qui est supprimé et ce qui est
 * conservé sont affichés côte à côte, avec la raison de chaque conservation.
 */
export default function SuppressionCompte() {
  const { user } = useAuth();
  const conditions = trpc.suppressionCompte.conditions.useQuery();
  const legal = trpc.meta.legal.useQuery();
  const demande = trpc.suppressionCompte.demanderPublique.useMutation();

  const [email, setEmail] = useState(user?.email ?? "");
  const [motif, setMotif] = useState("");

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Supprimer mon compte et mes données</h1>
      <p className="mt-2 text-sm text-slate-600">
        Applicable à la plateforme MKA.P-MS et à ses applications mobiles MKA.P-MS et MKA.P-MS PRO.
        Aucune installation ni connexion n'est nécessaire pour faire cette demande.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Trash2 size={18} className="text-red-500" /> Ce qui est supprimé
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {(conditions.data?.supprime ?? []).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <AlertTriangle size={18} className="text-amber-500" /> Ce qui est conservé, et pourquoi
          </h2>
          <div className="mt-3 space-y-3">
            {(conditions.data?.conserve ?? []).map((c) => (
              <div key={c.element}>
                <p className="text-sm font-semibold text-slate-800">{c.element}</p>
                <p className="text-sm text-slate-600">{c.raison}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {conditions.data?.delai ? (
        <p className="mt-4 text-sm text-slate-600">
          <b>Délai :</b> {conditions.data.delai}
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-800">Depuis votre compte (immédiat)</h2>
        <p className="mt-2 text-sm text-slate-600">
          Application ou site : <b>Compte → Paramètres → Supprimer mon compte</b>. La suppression est
          exécutée sur place, après confirmation et saisie de votre mot de passe.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-800">Sans accès à votre compte</h2>
        <p className="mt-2 text-sm text-slate-600">
          Indiquez l'adresse e-mail du compte. Nous vérifions qu'elle est bien la vôtre avant toute
          suppression : sans cette vérification, n'importe qui pourrait faire supprimer le compte
          d'un autre.
        </p>

        {demande.isSuccess ? (
          <div className="card mt-4 flex items-start gap-3 border-emerald-200 bg-emerald-50 p-5">
            <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800">{demande.data.message}</p>
          </div>
        ) : (
          <form
            className="card mt-4 space-y-3 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              demande.mutate({ email, motif: motif || undefined });
            }}
          >
            <label className="block text-sm font-semibold text-slate-700">
              Adresse e-mail du compte
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="vous@exemple.com"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Motif (facultatif)
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </label>
            {demande.error ? <p className="text-sm text-red-600">{demande.error.message}</p> : null}
            <button
              type="submit"
              disabled={demande.isPending}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-40"
            >
              {demande.isPending ? "Envoi…" : "Demander la suppression"}
            </button>
          </form>
        )}

        {legal.data ? (
          <p className="mt-4 text-sm text-slate-600">
            Vous pouvez aussi écrire à <b>{legal.data.email}</b> · {legal.data.telephone}. Responsable
            du traitement : {legal.data.raisonSociale}, {legal.data.siege}.
          </p>
        ) : null}
      </section>
    </div>
  );
}
