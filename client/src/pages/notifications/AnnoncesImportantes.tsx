import Notifications from "../Notifications";

export default function AnnoncesImportantes() {
  return <Notifications filtreTypes={["annonce", "validation"]} titre="Annonces importantes" />;
}
