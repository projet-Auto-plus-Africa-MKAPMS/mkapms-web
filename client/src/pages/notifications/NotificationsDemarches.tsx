import Notifications from "../Notifications";

export default function NotificationsDemarches() {
  return <Notifications filtreTypes={["carte_grise", "vo", "dispute"]} titre="Démarches & litiges" />;
}
