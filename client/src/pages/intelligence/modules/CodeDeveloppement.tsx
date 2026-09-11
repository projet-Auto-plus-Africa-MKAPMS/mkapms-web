import { Code2 } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function CodeDeveloppement() {
  return (
    <ModulePlaceholder
      icone={Code2}
      titre="Code & développement"
      description="Lire le dépôt, proposer un correctif, générer et analyser du code — via le Code Knowledge Graph et l'orchestrateur déjà existants."
    />
  );
}
