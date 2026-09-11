import { Search } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function Recherche() {
  return (
    <ModulePlaceholder
      icone={Search}
      titre="Recherche"
      description="Retrouver une information dans la plateforme, la mémoire de MKA.P-MS Intelligence, ou sur le web quand la capacité est branchée."
    />
  );
}
