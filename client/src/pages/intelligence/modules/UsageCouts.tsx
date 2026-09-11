import { Gauge } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function UsageCouts() {
  return (
    <ModulePlaceholder
      icone={Gauge}
      titre="Usage & coûts"
      description="Ce qui a réellement été appelé, combien de temps, et à quel coût constaté — jamais une économie inventée."
    />
  );
}
