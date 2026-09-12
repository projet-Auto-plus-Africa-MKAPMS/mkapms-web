import Notifications from "../Notifications";

export default function NotificationsMessages() {
  return <Notifications filtreTypes={["message"]} titre="Notifications Messages" retourUrl="/messagerie" />;
}
