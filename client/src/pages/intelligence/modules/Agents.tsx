import { Bot } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function Agents() {
  return (
    <ModulePlaceholder
      icone={Bot}
      titre="Agents"
      description="Confier un objectif à un agent MKA.P-MS Intelligence, qui exécute les étapes autorisées et rend compte — s'appuie sur l'orchestrateur déjà existant."
    />
  );
}
