import Notifications from "../Notifications";

export default function NotificationsDepannage() {
  return <Notifications filtreTypes={["depannage"]} titre="Notifications Dépannage" retourUrl="/depannage" />;
}
