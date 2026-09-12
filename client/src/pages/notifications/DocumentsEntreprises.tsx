import DocumentsVault from "../DocumentsVault";

export default function DocumentsEntreprises() {
  return (
    <DocumentsVault
      docTypes={["kbis", "rib"]}
      titre="Documents entreprise"
      sousTitre="KBIS et coordonnées bancaires envoyés pour vérification"
    />
  );
}
