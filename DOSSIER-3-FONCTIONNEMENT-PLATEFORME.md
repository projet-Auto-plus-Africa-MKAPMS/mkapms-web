# DOSSIER 3 — FONCTIONNEMENT PLATEFORME
## REGLEMENT GENERAL MKA.P-MS V1
### Document officiel de reference

---

**Plateforme :** MKA.P-MS — La Marketplace Automobile  
**Version :** V1  
**Date :** Juin 2026  
**Statut :** Document officiel de reference avant lancement  

---

## TABLE DES MATIERES

1. Vente de vehicules
2. Depot d'annonce
3. Estimation automobile
4. Location de vehicules
5. Services Garage
6. Services Carrosserie
7. Encheres professionnelles
8. Historique vehicule
9. Notifications
10. Comparateur
11. Favoris
12. Depannage
13. Pieces detachees
14. VTC / Taxi
15. Catalogue technique (AutoData)
16. Atelier Pro
17. Comptabilite
18. Messagerie
19. Dossier client
20. Dossier vehicule numerique

---

## 1. VENTE DE VEHICULES

### 1.1 Parcours acheteur
1. L'acheteur arrive sur la page d'accueil ou la page "Acheter"
2. Il peut rechercher par :
   - Marque, modele, prix, annee, kilometrage
   - Geolocalisation (proximite)
   - Ville ou pays
   - Type de vehicule (voiture, moto, utilitaire, camion, VTC)
   - Filtres avances (energie, boite, puissance, nombre de portes, etc.)
3. Les resultats s'affichent en grille (cards avec photo, prix, km, localisation)
4. L'acheteur clique sur un vehicule pour voir la fiche complete :
   - Photos (carrousel)
   - Informations techniques completes
   - Prix
   - Localisation du vendeur
   - Bouton "Contacter le vendeur" (messagerie)
   - Bouton "Faire une offre"
   - Bouton "Reserver" (avec acompte : 250, 500, 1000 ou 1500 EUR)
   - Ajouter aux favoris
   - Ajouter au comparateur
5. L'acheteur peut negocier par messagerie
6. L'acheteur peut reserver avec acompte via Stripe

### 1.2 Parcours vendeur particulier
1. Le vendeur accede a "Deposer une annonce"
2. Il choisit le type de vehicule (voiture, moto, utilitaire, camion, VTC)
3. Il saisit la plaque d'immatriculation ou le VIN
4. Le systeme identifie automatiquement le vehicule (marque, modele, motorisation, annee)
5. Il complete les informations (km, prix, description, etat, options)
6. Il ajoute les photos (4 gratuites, plus avec pack photos ou Boost)
7. Il peut ajouter des documents (CT, factures entretien)
8. Verification IA de la qualite de l'annonce
9. Publication (immediate pour les particuliers, validation pour les pros)

### 1.3 Parcours vendeur professionnel
1. Meme parcours que le particulier mais avec :
   - Plus de photos (selon le plan : 15, 20, illimite)
   - Videos (selon le plan : 1, 3, illimite)
   - Badge PRO visible sur l'annonce
   - Page vitrine professionnelle
   - Statistiques de performance
   - Gestion multi-annonces
   - Export comptable
2. Depassement d'annonces facture automatiquement (pas de blocage)

### 1.4 Types de vehicules supportes
- Voiture (toutes marques, tous modeles)
- Moto / Scooter / Quad (avec categories specifiques : Roadster, Sportive, Trail, etc.)
- Utilitaire
- Camion
- VTC

### 1.5 Marques supportees
**Voitures :** Peugeot, Renault, Citroen, Volkswagen, BMW, Mercedes, Audi, Toyota, Ford, Opel, Fiat, Dacia, Hyundai, Kia, Nissan, Tesla, Volvo, Skoda, Seat, Porsche, Mini, Mazda, Jeep, Land Rover, Jaguar, et plus.

**Motos :** Honda, Yamaha, Kawasaki, Suzuki, BMW, KTM, Ducati, Harley-Davidson, Triumph, Aprilia, Husqvarna, Royal Enfield, Indian, Moto Guzzi, MV Agusta, Vespa, Piaggio, Kymco, SYM, Benelli, CFMOTO, GasGas, Beta, Can-Am, Zero, Energica, et plus.

---

## 2. DEPOT D'ANNONCE

### 2.1 Etapes du depot
Le depot d'annonce suit un parcours en **6 etapes** :

**Etape 1 — Plaque / VIN**
- Saisie de la plaque d'immatriculation (format europeen)
- OU saisie du numero VIN
- OU saisie manuelle (si plaque/VIN non disponible)
- Identification automatique du vehicule
- Affichage des informations identifiees (marque, modele, version, annee, motorisation)

**Etape 2 — Informations**
- Kilometrage
- Prix souhaite
- Description detaillee
- Etat du vehicule
- Options et equipements
- Premiere main (oui/non)
- CT valide (oui/non)
- Garantie (oui/non)
- Champs specifiques selon le type :
  - Moto : cylindree, permis requis, categorie
  - Utilitaire : charge utile, dimensions
  - Camion : PTAC, nombre essieux

**Etape 3 — Photos**
- Photos obligatoires selon le type :
  - Voiture : Face avant, Face arriere, Cote gauche, Cote droit, Tableau de bord, Compteur, Coffre, Sieges, Moteur, Pneus/Jantes, Ecran multimedia
  - Moto : Face avant, Face arriere, Cote gauche, Cote droit, Tableau de bord/Compteur, Moteur, Pot d'echappement, Pneus, Selle, Reservoir
- Upload par drag & drop ou appareil photo
- Limite selon le plan (4 gratuites pour particuliers, plus avec pack)

**Etape 4 — Documents**
- Controle technique (optionnel mais recommande)
- Factures d'entretien
- Certificat de non-gage
- Carte grise

**Etape 5 — Verification IA**
- Analyse automatique de la qualite de l'annonce
- Verification de la coherence des informations
- Suggestions d'amelioration
- Score de qualite

**Etape 6 — Publication**
- Recapitulatif complet
- Options de Boost disponibles (7j, 30j, Premium)
- Packs photos supplementaires
- Confirmation et publication

### 2.2 Duree de l'annonce
- Duree standard : 30 jours
- Renouvellement possible
- Annonce archivee apres expiration (pas supprimee)

### 2.3 Moderation
- Les annonces des professionnels peuvent etre soumises a validation
- Les annonces signalees sont examinees par l'administration
- L'administration peut approuver, refuser ou suspendre une annonce

---

## 3. ESTIMATION AUTOMOBILE

### 3.1 Fonctionnement
1. L'utilisateur accede a "Estimation automobile"
2. Il saisit la plaque d'immatriculation ou le VIN
3. Le systeme identifie le vehicule via VehicleIdentification
4. L'estimation est calculee et affichee en **3 valeurs** :
   - **Basse** (prix plancher du marche)
   - **Moyenne** (prix moyen du marche)
   - **Haute** (prix plafond du marche)

### 3.2 Details de l'estimation
L'estimation prend en compte :
- Cote Argus
- Marche actuel (offre et demande)
- Etat estime du vehicule
- Niveau de demande
- Depreciation annuelle
- Nombre d'annonces similaires sur le marche

### 3.3 Actions possibles apres estimation
- "Deposer une annonce au prix estime"
- "Obtenir un rapport detaille" (payant)
- "Comparer avec le marche"
- Affichage du marche : annonces similaires, prix moyen, tendance des prix

### 3.4 Acces
- Gratuit pour tous les utilisateurs (estimation de base)
- Rapport detaille : payant (option)
- Disponible pour voitures et motos

---

## 4. LOCATION DE VEHICULES

### 4.1 Parcours locataire
1. L'utilisateur accede a l'univers "Location"
2. Il recherche un vehicule a louer :
   - Par ville/localisation
   - Par type de vehicule
   - Par dates (debut, fin)
   - Par budget
3. Il consulte les vehicules disponibles (calendrier de disponibilite)
4. Il reserve en ligne
5. Il paie via Stripe (depot de garantie si applicable)

### 4.2 Parcours loueur professionnel
1. Le loueur cree son compte avec un abonnement Location
2. Il ajoute ses vehicules (avec photos, tarifs journaliers)
3. Il configure le calendrier de disponibilite
4. Il recoit les reservations
5. Il gere les contrats de location
6. Il gere les conducteurs
7. Statistiques de performance

### 4.3 Fonctionnalites
- Calendrier de disponibilite interactif
- Reservations en ligne
- Gestion des contrats de location
- Gestion des conducteurs
- Depot de garantie integre (plans avances)
- LOA integree (plans Premium+)
- Multi-agences (Location Ultimate)
- Commission 3% (grandes flottes 2-2,5%)

---

## 5. SERVICES GARAGE

### 5.1 Parcours client
1. Le client accede a "Garage" depuis le menu principal
2. Il recherche un garage par :
   - Proximite (geolocalisation)
   - Ville
   - Specialite (mecanique, diagnostic, entretien, pneus)
   - Notes et avis
3. Il consulte la fiche du garage (services, horaires, avis, photos)
4. Il demande un devis en ligne
5. Il prend RDV via l'agenda du garage
6. Il suit l'intervention en temps reel (si le garage a l'option)
7. Il recoit une notification quand le vehicule est pret
8. Il paie la facture

### 5.2 Parcours garagiste
1. Le garagiste cree son compte avec un abonnement Garage
2. Il configure sa fiche garage (services, horaires, equipe)
3. Il recoit les demandes de devis
4. Il cree des devis avec photos
5. Il gere son planning atelier (RDV, interventions)
6. Il gere son stock de pieces
7. Il gere ses employes (mecaniciens)
8. Il envoie des factures automatiques
9. Il suit ses statistiques

### 5.3 Fonctionnalites specifiques
- **Planning Atelier** : Agenda avec RDV, mecanicien assigne, duree estimee, boutons "Commencer" / "Reporter"
- **Stock Pieces** : Gestion des references, prix achat/vente, stock actuel, stock minimum, boutons "Commander" / "Modifier"
- **Mecaniciens** : Profils avec competences, heures travaillees, performance (%), boutons "Appeler" / "Email"
- **Vehicules en attente** : Liste avec plaque, telephone client, boutons "Relancer" / "Appeler"
- **Devis** : Creation avec photos, envoi par email, suivi
- **Factures** : Generation automatique, envoi, suivi paiement
- **Ordres de reparation** : Creation, suivi, cloture
- **Suivi intervention temps reel** : Le client voit l'avancement de la reparation
- **Notifications client automatiques** : Le client est notifie a chaque etape

---

## 6. SERVICES CARROSSERIE

### 6.1 Parcours client
1. Le client accede a "Carrosserie" depuis le menu principal
2. Il recherche un carrossier par proximite, specialite ou avis
3. Il consulte la fiche du carrossier
4. Il envoie des photos du dommage pour un devis
5. Il recoit un devis avec detail des reparations
6. Il prend RDV
7. Il suit la reparation (photos avant/apres)
8. Il recoit la facture

### 6.2 Parcours carrossier
1. Le carrossier cree son compte avec un abonnement Carrosserie
2. Il recoit les demandes avec photos des dommages
3. Il cree des devis (debosselage, peinture, marbre)
4. Il gere son planning atelier
5. Il documente les reparations (photos avant/apres)
6. Il genere les factures

### 6.3 Fonctionnalites specifiques
- Photos avant/apres travaux
- Devis carrosserie detaille
- Suivi des reparations
- Multi-ateliers (plan Elite)
- Acces encheres carrosserie (plan Elite)

---

## 7. ENCHERES PROFESSIONNELLES

### 7.1 Fonctionnement general
Les encheres MKA.P-MS sont reservees aux professionnels avec un abonnement Encheres Pro.

### 7.2 Types d'encheres
- **Encheres classiques** : Montante, le plus offrant gagne
- **Encheres inversees** : Pour les reparations, le moins cher gagne
- **Encheres flash** : Duree limitee (15 min, 30 min, 1h, 2h, 6h, 12h, 24h)

### 7.3 Parcours vendeur (mise en vente aux encheres)
1. Le vendeur cree une annonce d'enchere
2. Il definit :
   - Prix de depart
   - Prix de reserve (minimum acceptable)
   - Duree de l'enchere
   - Type d'enchere
3. L'annonce est publiee dans l'espace encheres
4. Il suit les encheres en temps reel
5. A la fin, le gagnant est notifie

### 7.4 Parcours acheteur (participation aux encheres)
1. L'acheteur consulte les encheres en cours
2. Il peut filtrer par marque, prix, localisation
3. Il fait une offre (encherir)
4. Il peut activer la surenchere automatique (plan Premium)
5. Il recoit des alertes personnalisees (plan Premium)
6. S'il gagne, il est notifie et procede au paiement
7. La livraison peut etre organisee par MKA.P-MS (plan Elite)

### 7.5 Deroulement de l'enchere
1. L'enchere est ouverte
2. Les participants font des offres
3. Chaque nouvelle offre doit etre superieure a la precedente
4. A la fin du temps, le plus offrant gagne
5. Si le prix de reserve n'est pas atteint, la vente est annulee
6. Le gagnant a 48h pour confirmer le paiement

### 7.6 Regles
- Reserve aux comptes professionnels valides
- Compte bancaire verifie requis
- Depot de garantie possible
- Pas de retractation apres paiement
- Litiges geres par MKA.P-MS

---

## 8. HISTORIQUE VEHICULE

### 8.1 Fonctionnement
1. L'utilisateur saisit la plaque ou le VIN du vehicule
2. Le systeme genere un rapport complet :
   - Kilometrage historique
   - Historique d'entretien
   - Controles techniques passes
   - Sinistres declares
   - Changements de proprietaire
   - Rappels constructeur

### 8.2 Acces
- Rapport de base : inclus dans certains abonnements
- Rapport detaille : payant (module optionnel VO a 9 EUR/mois)
- Disponible pour tous les vehicules identifies

### 8.3 Utilisation
- Verification avant achat
- Documentation pour la vente
- Suivi de son propre vehicule
- Historique consultations (dernieres recherches sauvegardees)

---

## 9. NOTIFICATIONS

### 9.1 Types de notifications
- **Annonces** : Nouvelle annonce correspondant a vos criteres
- **Messages** : Nouveau message d'un acheteur ou vendeur
- **Encheres** : Surenchere, fin d'enchere, enchere gagnee
- **Garage** : Devis recu, vehicule pret, facture disponible
- **Location** : Reservation confirmee, vehicule disponible
- **Systeme** : Mise a jour du compte, facturation, alerte securite
- **Favoris** : Baisse de prix d'un favori, vehicule bientot expire
- **Boost** : Fin de Boost, statistiques de performance

### 9.2 Canaux de notification
- Notifications push (dans l'application)
- Email
- Chaque notification est un lien actif (cliquer = naviguer vers l'element concerne)

### 9.3 Parametres
- L'utilisateur peut configurer ses preferences de notification
- Activer/desactiver par type
- Activer/desactiver par canal

---

## 10. COMPARATEUR

### 10.1 Fonctionnement
1. L'utilisateur ajoute des vehicules au comparateur (depuis une annonce)
2. Il peut comparer jusqu'a **4 vehicules** simultanement
3. Le comparateur affiche cote a cote :
   - Photo
   - Prix
   - Marque, modele, annee
   - Kilometrage
   - Motorisation
   - Puissance
   - Consommation
   - Equipements
   - Localisation

### 10.2 Actions
- Voir l'annonce complete
- Contacter le vendeur
- Retirer du comparateur
- Ajouter aux favoris

---

## 11. FAVORIS

### 11.1 Fonctionnement
- L'utilisateur peut ajouter n'importe quelle annonce a ses favoris (icone coeur)
- Les favoris sont accessibles depuis le compte utilisateur
- Affichage en grille (2 colonnes, pas superpose)
- Chaque favori affiche : photo, titre, prix, bouton "Voir", bouton "Retirer"

### 11.2 Alertes favoris
- Notification si le prix d'un favori baisse
- Notification si un favori est sur le point d'expirer
- Notification si un favori est vendu

---

## 12. DEPANNAGE

### 12.1 Parcours client
1. Le client accede a "Depannage" depuis le menu principal
2. Il decrit le probleme (panne, accident, pneu creve, batterie, etc.)
3. Il partage sa localisation GPS
4. Le systeme recherche les depanneurs disponibles a proximite
5. Un depanneur accepte la mission
6. Le client suit l'arrivee du depanneur en temps reel
7. Intervention effectuee
8. Facturation automatique

### 12.2 Parcours depanneur
1. Le depanneur cree son compte avec un abonnement Depannage
2. Il configure sa zone d'intervention
3. Il recoit les demandes d'intervention automatiquement
4. Il accepte ou refuse les missions
5. Il se rend sur place (GPS integre)
6. Il facture automatiquement apres intervention

---

## 13. PIECES DETACHEES

### 13.1 Parcours acheteur
1. L'acheteur accede a "Pieces" depuis le menu principal
2. Il recherche une piece par :
   - Plaque d'immatriculation (identification automatique du vehicule)
   - Numero VIN
   - Reference OEM
   - Nom de la piece
   - Marque, modele, annee
3. Les resultats affichent les pieces compatibles avec leur vehicule
4. L'acheteur commande en ligne
5. Paiement via Stripe

### 13.2 Parcours vendeur de pieces
1. Le vendeur cree son compte avec un abonnement Pieces Auto
2. Il cree sa boutique en ligne (logo, horaires, GPS)
3. Il ajoute ses pieces au catalogue (references, compatibilites, prix, stock)
4. Il recoit les commandes
5. Il gere son stock (alertes rupture)
6. Facturation automatique
7. Commission sur les ventes (variable selon le plan : 5%, 3% ou 1,5%)

---

## 14. VTC / TAXI

### 14.1 Parcours client
1. Le client accede a "VTC / Taxi"
2. Il saisit sa destination
3. Il voit les vehicules disponibles a proximite
4. Il reserve un trajet
5. Il suit le trajet en temps reel
6. Il paie via Stripe

### 14.2 Parcours chauffeur VTC / Taxi
1. Le chauffeur cree son compte avec un abonnement VTC / Taxi
2. Il configure ses vehicules
3. Il gere ses chauffeurs (pour les societes)
4. Il recoit les reservations
5. Il effectue les trajets
6. Facturation automatique
7. Statistiques de performance

### 14.3 Fonctionnalites
- Gestion de flotte (jusqu'a 120 vehicules)
- Gestion des chauffeurs
- Reservations en temps reel
- Suivi GPS
- Multi-societes (plan Max)

---

## 15. CATALOGUE TECHNIQUE (AUTODATA)

### 15.1 Fonctionnement
1. L'utilisateur saisit la plaque ou le VIN
2. Le systeme identifie le vehicule avec precision
3. Le catalogue charge toutes les donnees techniques du vehicule
4. L'utilisateur navigue par categorie (accordeons) :
   - **Mecanique** : Moteur, Distribution, Embrayage, Boite de vitesses, Freinage, Direction, Suspension, Refroidissement, Echappement, Alimentation, Turbo
   - **Electronique** : Injection, Allumage, ABS/ESP/TC, Airbags, Climatisation, Tableau de bord, Capteurs, Calculateurs, CAN/LIN/MOST, Diagnostic OBD
   - **Electrique** : Batterie, Alternateur, Demarreur, Eclairage, Fusibles/Relais, Cablage
   - **Carrosserie** : Dimensions, Poids, Vitrage, Ouvrants/Serrures

### 15.2 Modes d'affichage (meme abonnement)
**Mode Texte :**
- Capacites et specifications (huile, liquides)
- Couples de serrage (piece, valeur Nm, outil)
- Temps baremes (operation, duree, difficulte, outil special)
- Pieces (grille cliquable avec reference, prix, disponibilite)

**Mode Image :**
- Schemas eclates techniques SVG (style Autodata/EPC constructeur)
- Pieces numerotees avec reperes de couleur
- Couples de serrage annotes sur le schema (valeurs Nm)
- Tableau des pieces a droite (N°, Reference, Designation, Quantite)
- Detail de la piece selectionnee en bas (reference, nom, prix, disponibilite, bouton "Ajouter au panier")
- Zoom avant/arriere
- Barre d'informations vehicule en bas (carburant, cylindree, puissance, code moteur)

### 15.3 Accordeons
- Un seul systeme ouvert a la fois
- Cliquer sur un systeme ferme les autres et ouvre celui selectionne
- Navigation intuitive par categorie puis par systeme

### 15.4 Version
MKA.P-MS AutoData — Version 2027

---

## 16. ATELIER PRO

### 16.1 Fonctionnement
L'Atelier Pro est un module de gestion d'atelier mecanique complet.

### 16.2 Fonctionnalites principales
- **Agenda atelier** : Planning des RDV et interventions
- **Devis** : Creation, envoi, suivi
- **Ordres de reparation** : Creation, suivi, cloture
- **Reception vehicule** : Check-in, etat des lieux, photos
- **Gestion employes** (Premium+) : Profils, competences, heures, performance
- **Suivi temps reel** (Premium+) : Avancement des interventions
- **Facturation automatique** (Premium+) : Generation et envoi
- **Gestion stock magasin** (Elite+) : References, quantites, alertes rupture
- **Commande fournisseurs** (Elite+) : Commandes automatiques
- **Productivite employes** (Ultimate) : KPIs, reporting
- **Reporting avance** (Ultimate) : Tableaux de bord, statistiques
- **Automatisation avancee** (Ultimate) : Workflows automatiques

### 16.3 Interface
- Statistiques en haut (cartes cliquables)
- Liste des vehicules/interventions (expandable)
- Chaque element est cliquable et affiche ses details en dessous (pas superpose)
- Grille responsive (2-4 colonnes)

---

## 17. COMPTABILITE

### 17.1 Comptabilite dirigeant (PDG)
- Vue d'ensemble du CA par univers :
  - Vente, Location, Garage, Encheres, Publicite
- Chaque univers est une carte cliquable
- Cliquer ouvre les details en dessous (expandable, pas superpose) :
  - CA du mois
  - Evolution (%)
  - Nombre de transactions
  - Bouton "Voir les details"

### 17.2 Comptabilite professionnelle
- Suivi des revenus
- Factures generees
- Commissions percues
- Export comptable (CSV, PDF)
- Gestion des depenses

---

## 18. MESSAGERIE

### 18.1 Fonctionnement
- Messagerie integree entre acheteurs et vendeurs
- Messagerie entre clients et garages
- Messagerie entre clients et depanneurs
- Messagerie interne (admin, employes)
- Chaque conversation est liee a une annonce ou un service

### 18.2 Fonctionnalites
- Envoi de messages texte
- Envoi de photos
- Notifications de nouveaux messages
- Historique des conversations
- Blocage d'utilisateurs

---

## 19. DOSSIER CLIENT

### 19.1 Contenu
Le dossier client regroupe toutes les interactions d'un utilisateur :
- **Vendus** : Vehicules vendus (details + boutons Facture/Historique)
- **Devis** : Devis recus et envoyes (details + boutons Relancer/Historique)
- **Reservations** : Reservations effectuees (details + boutons Details/Contacter)
- **Locations** : Vehicules loues (details + boutons Contrat/Prolonger)
- **Paiements** : Historique des paiements (details + bouton Telecharger facture)
- **Favoris** : Redirige vers la page Favoris
- **Messages** : Redirige vers la messagerie

### 19.2 Interface
- Onglets en haut pour naviguer entre les sections
- Chaque element est expandable (clic = details en dessous)
- Actions disponibles pour chaque element

---

## 20. DOSSIER VEHICULE NUMERIQUE

### 20.1 Contenu
Le dossier vehicule numerique est le carnet de sante numerique du vehicule :
- **Entretiens** : Type, garage, km, montant (+ bouton Voir facture)
- **Reparations** : Meme pattern que les entretiens
- **Controles techniques** : Date, resultat, organisme
- **Factures** : Toutes les factures liees au vehicule
- **Photos** : Galerie photo du vehicule

### 20.2 Interface
- Timeline interactive
- Chaque element est expandable
- Boutons d'action (Appeler, Message)
- Historique complet consultable

---

## REGLES D'INTERFACE GENERALES

### Layout
- **Grille responsive** : 2 a 4 colonnes selon la taille d'ecran
- **Pas de superposition** : Les details s'ouvrent en dessous de l'element clique, pas en popup/overlay
- **Accordeon** : Un seul element ouvert a la fois par section
- **Expandable** : Clic sur un element = details + boutons d'action s'affichent en dessous
- **Couleurs** : Or #D4AF37, Noir #111, Fond clair #F5F3EF
- **Detail panel** : `rounded-lg bg-[#F5F3EF] p-2` avec grille de 2-4 cellules

### Navigation
- Toutes les cartes de statistiques sont cliquables
- Tous les elements de liste sont cliquables
- Les boutons de retour sont toujours visibles
- Le menu principal permet d'acceder a tous les univers

### Identification vehicule
Le systeme d'identification par plaque/VIN est integre partout :
- Depot d'annonce
- Estimation
- Reparation (demande de devis garage)
- Catalogue technique (AutoData)
- Historique vehicule
- Pieces detachees

Le systeme auto-remplit : marque, modele, version, annee, motorisation, puissance, cylindree, energie, transmission.

---

*Document officiel MKA.P-MS V1 — Dossier 3/4*
*Ne pas diffuser sans autorisation de la Direction*
