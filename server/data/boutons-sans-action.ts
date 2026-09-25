/**
 * Boutons sans action — inventaire des boutons qui ne peuvent rien déclencher.
 *
 * Fichier GÉNÉRÉ par scripts/gen-boutons-sans-action.mjs depuis client/src.
 * Ne pas éditer à la main : `npm run gen:boutons` le régénère, et la
 * construction échoue s'il est périmé — donc tout nouveau bouton mort apparaît
 * dans la revue avant d'atteindre la production.
 *
 * Un bouton est relevé quand il n'a ni gestionnaire de clic, ni type
 * « submit », ni formulaire soumis autour de lui : à l'écran, appuyer dessus
 * ne produit rien. Le contrôle continu lit cet inventaire pour le rendre
 * visible côté direction (point 110 — boutons et redirections).
 */
export interface BoutonSansAction {
  /** Fichier source de l'écran concerné. */
  readonly fichier: string;
  /** Ligne du bouton dans ce fichier. */
  readonly ligne: number;
  /** Texte affiché sur le bouton, pour le reconnaître à l'écran. */
  readonly libelle: string;
}

export const BOUTONS_SANS_ACTION: readonly BoutonSansAction[] = [
  { fichier: "client/src/pages/comptabilite/CentrePilotage.tsx", ligne: 1010, libelle: "Consommation energetique 12 450 kWh" },
  { fichier: "client/src/pages/comptabilite/CentrePilotage.tsx", ligne: 1027, libelle: "Prochaines echeances 12 dossiers" },
  { fichier: "client/src/pages/finance/LOAFinance.tsx", ligne: 11, libelle: "Simulation indisponible" },
  { fichier: "client/src/pages/garage/ControleQualiteGarage.tsx", ligne: 16, libelle: "Validation atelier ✓" },
  { fichier: "client/src/pages/garage/ControleQualiteGarage.tsx", ligne: 16, libelle: "Validation responsable" },
  { fichier: "client/src/pages/garage/FlottesEntreprises.tsx", ligne: 17, libelle: "Ajouter un véhicule" },
  { fichier: "client/src/pages/garage/FournisseursGarage.tsx", ligne: 14, libelle: "Ajouter fournisseur" },
  { fichier: "client/src/pages/garage/OrdreReparation.tsx", ligne: 59, libelle: "Voir details" },
  { fichier: "client/src/pages/garage/PhotosIntervention.tsx", ligne: 16, libelle: "{i : }" },
  { fichier: "client/src/pages/garage/Pneumatiques.tsx", ligne: 19, libelle: "Montage + équilibrage" },
  { fichier: "client/src/pages/garage/Pneumatiques.tsx", ligne: 19, libelle: "Pneu seul" },
  { fichier: "client/src/pages/garage/PreparationVenteVO.tsx", ligne: 16, libelle: "" },
  { fichier: "client/src/pages/garage/RecherchePieces.tsx", ligne: 12, libelle: "Rechercher" },
  { fichier: "client/src/pages/garage/RelanceClient.tsx", ligne: 17, libelle: "Envoyer relance" },
  { fichier: "client/src/pages/garage/TempsIntervention.tsx", ligne: 15, libelle: "Pause" },
  { fichier: "client/src/pages/garage/TempsIntervention.tsx", ligne: 15, libelle: "Fin" },
  { fichier: "client/src/pages/GestionConducteurs.tsx", ligne: 63, libelle: "Permis" },
  { fichier: "client/src/pages/GestionConducteurs.tsx", ligne: 64, libelle: "Pièce d'identité" },
  { fichier: "client/src/pages/GestionConducteurs.tsx", ligne: 66, libelle: "Ajouter le conducteur" },
  { fichier: "client/src/pages/GestionConducteurs.tsx", ligne: 85, libelle: "" },
  { fichier: "client/src/pages/GestionFranchises.tsx", ligne: 89, libelle: "Appliquer la franchise" },
  { fichier: "client/src/pages/LocationLOA.tsx", ligne: 100, libelle: "Simulation indisponible" },
  { fichier: "client/src/pages/pieces/AbonnementsProPieces.tsx", ligne: 17, libelle: "Choisir" },
  { fichier: "client/src/pages/pieces/MontageGarage.tsx", ligne: 10, libelle: "" },
  { fichier: "client/src/pages/pieces/MontageGarage.tsx", ligne: 13, libelle: "Réserver le montage" },
  { fichier: "client/src/pages/pieces/PanierPiecesDetachees.tsx", ligne: 16, libelle: "Commander" },
  { fichier: "client/src/pages/pieces/RechercheIntelligentePieces.tsx", ligne: 10, libelle: "Rechercher" },
  { fichier: "client/src/pages/ProduitVtcTaxi.tsx", ligne: 493, libelle: "Télécharger" },
  { fichier: "client/src/pages/ProgrammeVTC.tsx", ligne: 85, libelle: "Voir le véhicule" },
  { fichier: "client/src/pages/RemplacementVehicule.tsx", ligne: 65, libelle: "+ Ajouter des photos" },
  { fichier: "client/src/pages/RemplacementVehicule.tsx", ligne: 68, libelle: "Envoyer la demande" },
  { fichier: "client/src/pages/RemplacementVehicule.tsx", ligne: 106, libelle: "Accepter" },
  { fichier: "client/src/pages/RenouvellementLocation.tsx", ligne: 126, libelle: "Prolonger ma location" },
  { fichier: "client/src/pages/RenouvellementLocation.tsx", ligne: 171, libelle: "Confirmer le retrait / retour" },
  { fichier: "client/src/pages/ReservationMulti.tsx", ligne: 97, libelle: "Réserver véhicules" },
  { fichier: "client/src/pages/ReservationRecurrente.tsx", ligne: 75, libelle: "Prolonger" },
  { fichier: "client/src/pages/ReservationRecurrente.tsx", ligne: 76, libelle: "Modifier" },
  { fichier: "client/src/pages/ReservationRecurrente.tsx", ligne: 106, libelle: "Choisir un véhicule →" },
  { fichier: "client/src/pages/superadmin/AdminPaiements.tsx", ligne: 216, libelle: "Relancer" },
  { fichier: "client/src/pages/vente/AchatExpress.tsx", ligne: 9, libelle: "Commencer un achat express" },
  { fichier: "client/src/pages/vente/AlertesAuto.tsx", ligne: 17, libelle: "Traiter" },
  { fichier: "client/src/pages/vente/CentreAchatDistance.tsx", ligne: 10, libelle: "Continuer mon achat" },
  { fichier: "client/src/pages/vente/CentreCampagnes.tsx", ligne: 16, libelle: "Nouvelle campagne" },
  { fichier: "client/src/pages/vente/CentreControleQualite.tsx", ligne: 20, libelle: "" },
  { fichier: "client/src/pages/vente/CentreDetectionFraude.tsx", ligne: 17, libelle: "Voir" },
  { fichier: "client/src/pages/vente/CentreExport.tsx", ligne: 17, libelle: "" },
  { fichier: "client/src/pages/vente/CentreRapportsVehicule.tsx", ligne: 19, libelle: "Télécharger le rapport PDF" },
  { fichier: "client/src/pages/vente/CentreReservationAchat.tsx", ligne: 15, libelle: "Réserver ce véhicule" },
  { fichier: "client/src/pages/vente/MultiSites.tsx", ligne: 17, libelle: "Ajouter un site" },
];

/** Nombre d'écrans concernés. */
export function ecransConcernes(): string[] {
  return [...new Set(BOUTONS_SANS_ACTION.map((b) => b.fichier))].sort();
}
