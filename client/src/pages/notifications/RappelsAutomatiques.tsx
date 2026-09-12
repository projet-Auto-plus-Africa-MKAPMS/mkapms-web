import Notifications from "../Notifications";

/* rappel_rdv → inappType "reservation" ; abonnement_expiration → inappType
   "abonnement" (server/notification-os/triggers.ts) — les deux seuls
   déclencheurs réellement à échéance automatique aujourd'hui. */
export default function RappelsAutomatiques() {
  return <Notifications filtreTypes={["reservation", "abonnement"]} titre="Rappels automatiques" sousTitre="Rendez-vous et échéances d'abonnement" />;
}
