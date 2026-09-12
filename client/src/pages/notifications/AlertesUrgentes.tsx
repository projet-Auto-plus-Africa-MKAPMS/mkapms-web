import Notifications from "../Notifications";

export default function AlertesUrgentes() {
  return <Notifications filtreTypes={["dispute", "securite"]} titre="Alertes urgentes" sousTitre="Litiges et sécurité du compte" />;
}
