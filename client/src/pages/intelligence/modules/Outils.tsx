import { Wrench } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function Outils() {
  return (
    <ModulePlaceholder
      icone={Wrench}
      titre="Outils"
      description="Ce que MKA.P-MS Intelligence peut interroger ou actionner sur la plateforme, selon la permission accordée."
    />
  );
}
