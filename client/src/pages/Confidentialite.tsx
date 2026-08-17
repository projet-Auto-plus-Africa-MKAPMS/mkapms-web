import { trpc } from "../lib/trpc";
import { useCurrency } from "../lib/currency";

/**
 * Politique de confidentialité publique — exigée par Google Play et Apple pour
 * chaque application, et par la réglementation de chaque pays où la plateforme
 * est ouverte. Elle décrit ce que les applications MKA.P-MS font réellement :
 * aucune donnée annoncée qui n'est pas collectée, aucune collecte non annoncée.
 */

/** Autorité de protection des données selon le pays, quand elle est connue. */
const AUTORITES: Record<string, { nom: string; regime: string }> = {
  FR: { nom: "CNIL (France)", regime: "RGPD (UE 2016/679) et loi Informatique et Libertés" },
  BE: { nom: "APD (Belgique)", regime: "RGPD (UE 2016/679)" },
  ES: { nom: "AEPD (Espagne)", regime: "RGPD (UE 2016/679)" },
  DE: { nom: "BfDI (Allemagne)", regime: "RGPD (UE 2016/679)" },
  IT: { nom: "Garante (Italie)", regime: "RGPD (UE 2016/679)" },
  GB: { nom: "ICO (Royaume-Uni)", regime: "UK GDPR et Data Protection Act 2018" },
  CA: { nom: "Commissariat à la protection de la vie privée (Canada)", regime: "LPRPDE / PIPEDA" },
  SN: { nom: "Commission de protection des données personnelles (Sénégal)", regime: "loi n° 2008-12" },
  CI: { nom: "ARTCI (Côte d'Ivoire)", regime: "loi n° 2013-450" },
  MA: { nom: "CNDP (Maroc)", regime: "loi n° 09-08" },
  TN: { nom: "INPDP (Tunisie)", regime: "loi n° 2004-63" },
};

const DONNEES = [
  {
    titre: "Compte",
    contenu:
      "Nom, adresse e-mail, téléphone, pays, langue, type de compte (particulier, professionnel, employé). Nécessaires pour créer le compte, vous identifier et vous contacter.",
  },
  {
    titre: "Annonces, véhicules et services",
    contenu:
      "Textes, caractéristiques, photos et vidéos que vous publiez, ainsi que la ville et le pays de l'annonce. Ces contenus sont publics par nature : c'est leur but.",
  },
  {
    titre: "Documents de vérification",
    contenu:
      "Pièce d'identité, extrait d'immatriculation, permis ou justificatifs, uniquement lorsque la vérification d'un professionnel ou d'un contrat l'exige. Accessibles à la seule équipe de validation et supprimés au terme prévu.",
  },
  {
    titre: "Localisation",
    contenu:
      "Demandée uniquement lorsque vous utilisez une fonction « près de moi » (garages, dépannage, bornes de recharge). Jamais au lancement de l'application, jamais en arrière-plan, jamais conservée pour du profilage publicitaire.",
  },
  {
    titre: "Notifications",
    contenu:
      "Identifiant d'appareil nécessaire pour vous envoyer les notifications que vous avez acceptées (annonce, réservation, message, paiement). Refuser les notifications n'empêche pas d'utiliser l'application.",
  },
  {
    titre: "Paiements",
    contenu:
      "Les paiements sont traités par le prestataire de paiement : les numéros de carte ne transitent pas par MKA.P-MS et ne sont jamais stockés chez nous. Nous conservons le montant, la devise, la date, le statut et la facture, obligations comptables et fiscales obligent.",
  },
  {
    titre: "Usage de la plateforme",
    contenu:
      "Pages consultées, recherches effectuées, erreurs rencontrées. Servent à faire fonctionner, sécuriser et améliorer la plateforme. Aucune revente de données à des tiers.",
  },
];

const PARTAGE = [
  "Prestataire de paiement, pour encaisser et facturer.",
  "Hébergeur et base de données, pour faire fonctionner le service.",
  "Service d'envoi d'e-mails et de notifications, pour vous joindre.",
  "Professionnel concerné, uniquement pour la demande que vous lui adressez (réservation, devis, dépannage).",
  "Autorités, uniquement sur demande légale du pays concerné.",
];

export default function Confidentialite() {
  const legal = trpc.meta.legal.useQuery();
  const { country } = useCurrency();
  // Le régime applicable suit le pays de l'utilisateur : la loi française n'est
  // pas appliquée par défaut au reste du monde.
  const autorite = country ? AUTORITES[country] : undefined;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Politique de confidentialité</h1>
      <p className="mt-2 text-sm text-slate-600">
        Applicable à la plateforme MKA.P-MS et à ses applications mobiles MKA.P-MS, MKA.P-MS PRO et
        MKA.P-MS COMMAND.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-800">Responsable du traitement</h2>
        {legal.data && (
          <div className="card mt-3 grid gap-2 p-5 text-sm text-slate-600 md:grid-cols-2">
            <p><b>Raison sociale :</b> {legal.data.raisonSociale}</p>
            <p><b>Forme :</b> {legal.data.forme}</p>
            <p><b>Siège :</b> {legal.data.siege}</p>
            <p><b>SIREN :</b> {legal.data.siren}</p>
            <p><b>SIRET :</b> {legal.data.siret}</p>
            <p><b>TVA :</b> {legal.data.tva}</p>
            <p><b>Responsable :</b> {legal.data.directeur}</p>
            <p><b>Contact :</b> {legal.data.email} · {legal.data.telephone}</p>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-800">Données collectées et pourquoi</h2>
        <div className="mt-4 space-y-3">
          {DONNEES.map((d) => (
            <div key={d.titre} className="card p-4">
              <h3 className="font-semibold text-slate-800">{d.titre}</h3>
              <p className="mt-1 text-sm text-slate-600">{d.contenu}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-800">Avec qui les données sont partagées</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {PARTAGE.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <p className="mt-3 text-sm text-slate-600">
          Vos données ne sont ni vendues, ni louées, ni cédées à des courtiers de données.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-800">Durées de conservation</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Compte : tant qu'il est ouvert, puis supprimé sur demande.</li>
          <li>Annonces : jusqu'à leur retrait, leur vente ou leur expiration.</li>
          <li>Documents de vérification : supprimés 30 jours après la fin du contrat ou du dossier.</li>
          <li>Factures et pièces comptables : conservées le temps imposé par la loi du pays.</li>
          <li>Localisation : utilisée sur le moment pour la recherche, non conservée comme historique.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-800">Vos droits</h2>
        <p className="mt-2 text-sm text-slate-600">
          Vous pouvez demander l'accès à vos données, leur rectification, leur suppression, leur
          portabilité, ainsi que la limitation ou l'opposition à un traitement, et retirer un
          consentement (localisation, notifications) à tout moment depuis les réglages de votre
          appareil ou de votre compte. La suppression du compte entraîne la suppression des données
          qui ne sont pas légalement obligatoires à conserver.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Demande à adresser à <b>{legal.data?.email}</b>. Réponse sous 30 jours.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          {autorite
            ? <>Régime applicable dans votre pays : <b>{autorite.regime}</b>. Vous pouvez saisir l'autorité compétente : <b>{autorite.nom}</b>.</>
            : <>Votre pays n'est pas encore rattaché à une autorité de contrôle dans notre référentiel : la loi applicable est celle de votre pays de résidence, et nous répondons à toute demande adressée au contact ci-dessus. Nous ne prétendons pas appliquer une autre législation à votre place.</>}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-800">Mineurs</h2>
        <p className="mt-2 text-sm text-slate-600">
          La plateforme n'est pas destinée aux personnes de moins de 18 ans et ne collecte pas
          sciemment leurs données.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-800">Sécurité</h2>
        <p className="mt-2 text-sm text-slate-600">
          Accès chiffré (HTTPS), mots de passe stockés sous forme chiffrée irréversible, documents
          sensibles chiffrés, accès limité par rôle, journal des accès administratifs, sauvegardes
          régulières.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-800">Suppression du compte et des données</h2>
        <p className="mt-2 text-sm text-slate-600">
          Depuis l'application : Compte → Paramètres, ou par simple demande à{" "}
          <b>{legal.data?.email}</b>. La demande est traitée sans qu'il soit nécessaire de réinstaller
          ou de recréer un compte.
        </p>
      </section>
    </div>
  );
}
