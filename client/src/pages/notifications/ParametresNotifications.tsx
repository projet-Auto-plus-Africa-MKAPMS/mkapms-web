import NotificationPreferences from "../NotificationPreferences";

export default function ParametresNotifications() {
  return (
    <NotificationPreferences
      titre="Paramètres de notification"
      sousTitre="Canaux, regroupement et heures de silence"
      sections={["canaux", "digest", "silence"]}
    />
  );
}
