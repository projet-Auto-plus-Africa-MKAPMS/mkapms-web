import Notifications from "../Notifications";

export default function NotificationsVente() {
  return <Notifications filtreTypes={["annonce", "enchere", "depot_vente"]} titre="Notifications Vente" retourUrl="/vendre" />;
}
