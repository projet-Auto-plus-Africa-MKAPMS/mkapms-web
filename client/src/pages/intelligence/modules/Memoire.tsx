import { Brain } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function Memoire() {
  return (
    <ModulePlaceholder
      icone={Brain}
      titre="Mémoire"
      description="Ce que MKA.P-MS Intelligence a retenu des échanges et des dossiers — consultable et gérable ici."
    />
  );
}
