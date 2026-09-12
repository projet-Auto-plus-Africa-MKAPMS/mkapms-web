import Notifications from "../Notifications";

export default function NotificationsLocation() {
  return <Notifications filtreTypes={["reservation", "livraison"]} titre="Notifications Location" retourUrl="/louer" />;
}
