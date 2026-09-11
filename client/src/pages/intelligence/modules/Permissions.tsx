import { ShieldCheck } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function Permissions() {
  return (
    <ModulePlaceholder
      icone={ShieldCheck}
      titre="Permissions"
      description="Ce que le niveau d'accès actuel autorise dans MKA.P-MS Intelligence, et pourquoi — jamais une case cochée sans motif."
    />
  );
}
