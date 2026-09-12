import DocumentsVault from "../DocumentsVault";

export default function DocumentsVehicules() {
  return (
    <DocumentsVault
      docTypes={["carte_grise", "controle_technique"]}
      titre="Documents véhicules"
      sousTitre="Carte grise et contrôle technique envoyés pour vérification"
    />
  );
}
