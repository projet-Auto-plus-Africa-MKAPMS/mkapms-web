import NotificationPreferences from "../NotificationPreferences";

/* "Objectif" = à quel rythme vous voulez être notifié : regroupement (digest)
   et heures de silence — les deux seuls réglages réels de rythme sur
   trpc.notificationOs.preferences (les canaux eux-mêmes sont sur l'écran
   Canaux de communication). */
export default function ObjectifNotifications() {
  return (
    <NotificationPreferences
      titre="Rythme des notifications"
      sousTitre="Regroupement et heures de silence"
      sections={["digest", "silence"]}
    />
  );
}
