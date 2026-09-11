import { Settings } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function Parametres() {
  return (
    <ModulePlaceholder
      icone={Settings}
      titre="Paramètres"
      description="Préférences de l'application MKA.P-MS Intelligence : fournisseur préféré, langue, notifications."
    />
  );
}
