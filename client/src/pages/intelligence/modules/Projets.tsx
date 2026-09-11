import { FolderKanban } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function Projets() {
  return (
    <ModulePlaceholder
      icone={FolderKanban}
      titre="Projets"
      description="Regrouper des échanges, des fichiers et des tâches autour d'un objectif suivi dans le temps."
    />
  );
}
