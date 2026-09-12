import NotificationPreferences from "../NotificationPreferences";

export default function CanauxCommunication() {
  return (
    <NotificationPreferences
      titre="Canaux de communication"
      sousTitre="Choisissez comment MKA.P-MS vous contacte"
      sections={["canaux"]}
    />
  );
}
