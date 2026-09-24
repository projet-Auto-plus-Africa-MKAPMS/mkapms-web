import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { BoutonMoteur } from "../../lib/boutonMoteur";

export default function CentreAlertesRecherche() {
  const { user } = useAuth();
  const liste = trpc.searches.list.useQuery(undefined, { enabled: !!user });
  const creer = trpc.searches.create.useMutation();
  const activer = trpc.searches.setAlert.useMutation();
  const [label, setLabel] = useState("");
  const [q, setQ] = useState("");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [message, setMessage] = useState("");
  async function enregistrer() {
    await creer.mutateAsync({ label: label.trim(), univers: "vente", filters: { q: q.trim() || undefined, marque: marque.trim() || undefined, modele: modele.trim() || undefined }, alertEnabled: true });
    setMessage("Alerte enregistrée. Les nouvelles annonces correspondantes apparaîtront dans vos notifications.");
    setLabel(""); setQ(""); setMarque(""); setModele("");
    void liste.refetch();
  }
  const manque = !label.trim() ? "Indiquez un nom pour l’alerte" : ![q, marque, modele].some(x => x.trim()) ? "Renseignez au moins un critère" : undefined;
  return <main className="min-h-screen bg-[#F5F3EF] pb-24">
    <header className="bg-[#111] p-5 text-white"><Link to="/acheter">← Vente</Link><h1 className="mt-3 text-xl font-bold">Alertes recherche</h1></header>
    <div className="space-y-4 p-4">
      {!user ? <Link to="/connexion?next=%2Fvente%2Fcentre-alertes-recherche" className="underline">Connectez-vous pour gérer vos alertes</Link> : <>
        {liste.isLoading && <p role="status">Chargement des alertes…</p>}
        {liste.error && <p role="alert" className="text-red-700">{liste.error.message}</p>}
        {liste.data?.filter(a => a.univers === "vente").length === 0 && <p>Aucune alerte de vente enregistrée.</p>}
        {liste.data?.filter(a => a.univers === "vente").map(a => <article key={a.id} className="space-y-2 rounded-xl border bg-white p-4"><h2 className="font-bold">{a.label}</h2><p>{a.alertEnabled ? "Active" : "Désactivée"}</p>
          <BoutonMoteur code="vente_alerte_activer" className="rounded-lg border px-4 py-2" desactive={activer.isPending ? "Mise à jour en cours" : undefined} onExecuter={async () => { await activer.mutateAsync({ id: a.id, alertEnabled: !a.alertEnabled }); await liste.refetch(); }}>{a.alertEnabled ? "Désactiver" : "Activer"}</BoutonMoteur>
        </article>)}
        <section className="space-y-3 rounded-xl border bg-white p-4" aria-label="Nouvelle alerte"><h2 className="font-bold">Nouvelle alerte</h2>
          {[["Nom de l’alerte", label, setLabel], ["Texte présent dans l’annonce", q, setQ], ["Marque", marque, setMarque], ["Modèle", modele, setModele]].map(([title, value, setter]) => <label key={title as string} className="block">{title as string}<input className="block w-full rounded-lg border p-3" maxLength={128} value={value as string} onChange={e => (setter as (v: string) => void)(e.target.value)} /></label>)}
          <p className="text-sm text-slate-600">Les critères renseignés doivent tous correspondre. Le texte est recherché tel quel, sans interprétation de prix.</p>
          {manque && <p className="text-sm text-slate-600">{manque}</p>}
          <BoutonMoteur code="vente_alerte_creer" className="rounded-xl bg-[#D4AF37] px-5 py-3 font-bold" desactive={creer.isPending ? "Enregistrement en cours" : manque} onExecuter={enregistrer}>Créer l’alerte</BoutonMoteur>
          {message && <p role="status" className="text-green-700">{message}</p>}
        </section>
      </>}
    </div>
  </main>;
}
