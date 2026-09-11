import { FileText } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function FichiersDocuments() {
  return (
    <ModulePlaceholder
      icone={FileText}
      titre="Fichiers & documents"
      description="Déposer, lire et analyser un document (devis, facture, contrat, carte grise…) avec MKA.P-MS Intelligence."
    />
  );
}
