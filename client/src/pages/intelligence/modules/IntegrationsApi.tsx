import { Plug } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function IntegrationsApi() {
  return (
    <ModulePlaceholder
      icone={Plug}
      titre="Intégrations & API"
      description="Clés et accès de la Plateforme développeur (/api/v1) pour connecter MKA.P-MS Intelligence à d'autres systèmes."
    />
  );
}
