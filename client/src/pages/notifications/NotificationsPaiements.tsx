import Notifications from "../Notifications";

export default function NotificationsPaiements() {
  return <Notifications filtreTypes={["paiement", "abonnement", "facture"]} titre="Notifications Paiements" retourUrl="/comptabilite" />;
}
