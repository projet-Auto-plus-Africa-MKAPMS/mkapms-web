import { Workflow } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function Automatisations() {
  return (
    <ModulePlaceholder
      icone={Workflow}
      titre="Automatisations"
      description="Enchaîner des actions autorisées et surveiller leur résultat, dans les limites du niveau d'autonomie ouvert."
    />
  );
}
