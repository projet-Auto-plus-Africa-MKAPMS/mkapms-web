import DocumentsVault from "../DocumentsVault";

export default function DocumentsPersonnelsGlobal() {
  return (
    <DocumentsVault
      docTypes={["piece_identite", "permis_conduire", "justificatif_domicile"]}
      titre="Documents personnels"
      sousTitre="Pièce d'identité, permis, justificatif de domicile"
    />
  );
}
