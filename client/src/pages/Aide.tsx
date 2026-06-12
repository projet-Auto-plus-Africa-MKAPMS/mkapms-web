import { trpc } from "../lib/trpc";

export default function Aide() {
  const faq = trpc.support.faq.useQuery();
  const legal = trpc.meta.legal.useQuery();

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Centre d'aide</h1>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-800">Questions fréquentes</h2>
        <div className="mt-4 space-y-3">
          {faq.data?.map((item) => (
            <details key={item.q} className="card p-4">
              <summary className="cursor-pointer font-semibold text-slate-800">{item.q}</summary>
              <p className="mt-2 text-sm text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="cgv" className="mt-12">
        <h2 className="text-xl font-bold text-slate-800">CGV / CGU</h2>
        <p className="mt-2 text-sm text-slate-600">
          Les conditions générales de vente et d'utilisation régissent l'usage de la plateforme,
          les transactions, les abonnements et les réservations. Tout paiement est opéré via Stripe.
          Une facture conforme aux exigences fiscales françaises (TVA {legal.data?.tva}) est émise
          automatiquement pour chaque transaction.
        </p>
      </section>

      <section id="rgpd" className="mt-10">
        <h2 className="text-xl font-bold text-slate-800">Politique de confidentialité (RGPD)</h2>
        <p className="mt-2 text-sm text-slate-600">
          Vos données sont stockées de manière sécurisée et centralisée. Les documents sensibles
          (pièce d'identité, permis, justificatifs) sont chiffrés, accessibles uniquement à l'équipe
          de validation, et automatiquement supprimés 30 jours après la fin du contrat. Vous disposez
          d'un droit d'accès, de rectification et de suppression de vos données.
        </p>
      </section>

      <section id="mentions" className="mt-10">
        <h2 className="text-xl font-bold text-slate-800">Mentions légales</h2>
        {legal.data && (
          <div className="card mt-3 grid gap-2 p-5 text-sm text-slate-600 md:grid-cols-2">
            <p><b>Raison sociale :</b> {legal.data.raisonSociale}</p>
            <p><b>Forme :</b> {legal.data.forme} — capital {legal.data.capital}</p>
            <p><b>Siège :</b> {legal.data.siege}</p>
            <p><b>SIREN :</b> {legal.data.siren}</p>
            <p><b>SIRET :</b> {legal.data.siret}</p>
            <p><b>TVA :</b> {legal.data.tva}</p>
            <p><b>RCS :</b> {legal.data.rcs}</p>
            <p><b>APE :</b> {legal.data.ape}</p>
            <p><b>Directeur de publication :</b> {legal.data.directeur}</p>
            <p><b>Contact :</b> {legal.data.email} · {legal.data.telephone}</p>
          </div>
        )}
      </section>
    </div>
  );
}
