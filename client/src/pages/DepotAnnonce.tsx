import { useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ChevronDown, PlusCircle, Car, Bike, Truck,
  Camera, Check, Upload, FileText, Search, Sparkles, Bot, Star, Video, X,
  Loader2, Shield, Zap, Eye, AlertTriangle, Info, Clock, Award, MapPin,
  Phone, Mail, User, Calendar, Gauge, Fuel, Key, Globe, Leaf, Hash, CircleDot,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import FileUpload from "../components/FileUpload";

/* ══════════════════════════════════════════════════════════════════════════
   DEPOT D'ANNONCE — MKA.P-MS Ultra Pro (depasse La Centrale)
   7 etapes: Immatriculation > Caracteristiques > Equipements > Photos > Description > Coordonnees > Publication
   4 niveaux cascading: Marque > Modele > Motorisation > Version > Finition
   Validation temps reel, VIN verification, barre de progression, estimation prix
   ══════════════════════════════════════════════════════════════════════════ */

const TYPES = [
  { id: "voiture", label: "Voiture", icon: Car, color: "bg-[#D4AF37]", desc: "Berline, SUV, Citadine, Break..." },
  { id: "moto", label: "Moto / Scooter / Quad", icon: Bike, color: "bg-red-600", desc: "Roadster, Sportive, Trail, Scooter..." },
  { id: "utilitaire", label: "Utilitaire", icon: Truck, color: "bg-orange-600", desc: "Fourgon, Camionnette, Pick-up..." },
  { id: "camion", label: "Camion", icon: Truck, color: "bg-gray-700", desc: "Poids lourd, Semi-remorque..." },
  { id: "vtc", label: "Vehicule VTC", icon: Car, color: "bg-[#111]", desc: "Berline confort, Van..." },
];

/* ── Catégories véhicule ── */
const CATEGORIES_VOITURE = [
  "Berline","Break","Cabriolet","Citadine","Coupé","Monospace","Pick-up","SUV","4x4","Crossover","Compact","Familiale","Hybride","Électrique","Utilitaire","Premium",
];

/* ── Détection automatique de catégorie par modèle ── */
const AUTO_CATEGORIE: Record<string, string> = {
  // Citadines
  "108":"Citadine","208":"Citadine","Clio":"Citadine","Twingo":"Citadine","C1":"Citadine","C3":"Citadine",
  "Polo":"Citadine","Fiesta":"Citadine","Sandero":"Citadine","i10":"Citadine","i20":"Citadine",
  "Picanto":"Citadine","Micra":"Citadine","500":"Citadine","Corsa":"Citadine","Fabia":"Citadine",
  "Ibiza":"Citadine","Mazda2":"Citadine","Aygo X":"Citadine","Yaris":"Citadine","Panda":"Citadine",
  "Fortwo":"Citadine","Forfour":"Citadine","Mini 3 portes":"Citadine","Mini 5 portes":"Citadine",
  "Jazz":"Citadine","Swift":"Citadine","Ignis":"Citadine","Rio":"Citadine",
  // Berlines
  "308":"Berline","508":"Berline","408":"Berline","Megane":"Berline","Focus":"Berline",
  "Golf":"Berline","Astra":"Berline","Scala":"Berline","Leon":"Berline","Octavia":"Berline",
  "Serie 1":"Berline","Serie 3":"Berline","Serie 5":"Berline","Serie 7":"Berline",
  "Classe A":"Berline","Classe C":"Berline","Classe E":"Berline","Classe S":"Berline",
  "A3":"Berline","A4":"Berline","A6":"Berline","A8":"Berline",
  "Model 3":"Berline","Mazda3":"Berline","Corolla":"Berline","i30":"Berline",
  "Ceed":"Berline","Tipo":"Berline","Superb":"Berline","XE":"Berline","XF":"Berline",
  "S60":"Berline","S90":"Berline","IS":"Berline","ES":"Berline","Civic":"Berline",
  // SUV
  "3008":"SUV","5008":"SUV","2008":"SUV","Captur":"SUV","Austral":"SUV","Arkana":"SUV",
  "C3 Aircross":"SUV","C4":"SUV","C4 X":"SUV","C5 X":"SUV","C5 Aircross":"SUV",
  "X1":"SUV","X2":"SUV","X3":"SUV","X4":"SUV","X5":"SUV","X6":"SUV","X7":"SUV",
  "GLA":"SUV","GLB":"SUV","GLC":"SUV","GLE":"SUV","GLS":"SUV",
  "Q2":"SUV","Q3":"SUV","Q5":"SUV","Q7":"SUV","Q8":"SUV",
  "T-Roc":"SUV","Tiguan":"SUV","Touareg":"SUV","T-Cross":"SUV","Taigo":"SUV",
  "Puma":"SUV","Kuga":"SUV","Explorer":"SUV",
  "Duster":"SUV","Sandero Stepway":"SUV","Jogger":"SUV",
  "Kona":"SUV","Tucson":"SUV","Santa Fe":"SUV","Bayon":"SUV",
  "Sportage":"SUV","Sorento":"SUV","Niro":"SUV","Stonic":"SUV",
  "Juke":"SUV","Qashqai":"SUV","X-Trail":"SUV",
  "500X":"SUV","Mokka":"SUV","Crossland":"SUV","Grandland":"SUV",
  "XC40":"SUV","XC60":"SUV","XC90":"SUV","C40":"SUV",
  "Kamiq":"SUV","Karoq":"SUV","Kodiaq":"SUV",
  "Arona":"SUV","Ateca":"SUV","Tarraco":"SUV",
  "Cayenne":"SUV","Macan":"SUV",
  "CX-3":"SUV","CX-30":"SUV","CX-5":"SUV","CX-60":"SUV",
  "Renegade":"SUV","Compass":"SUV","Cherokee":"SUV","Grand Cherokee":"SUV","Avenger":"SUV",
  "Yaris Cross":"SUV","C-HR":"SUV","RAV4":"SUV",
  "E-Pace":"SUV","F-Pace":"SUV","NX":"SUV","RX":"SUV","UX":"SUV",
  "HR-V":"SUV","ZR-V":"SUV","CR-V":"SUV","Vitara":"SUV","S-Cross":"SUV","Across":"SUV",
  "XCeed":"SUV","Proceed":"Coupé",
  // 4x4
  "Defender":"4x4","Discovery":"4x4","Discovery Sport":"4x4",
  "Range Rover":"4x4","Range Rover Sport":"4x4","Range Rover Evoque":"4x4","Range Rover Velar":"4x4",
  "Wrangler":"4x4","Gladiator":"4x4","Land Cruiser":"4x4","Highlander":"4x4","Jimny":"4x4",
  // Breaks
  "V60":"Break","V90":"Break","Passat":"Break","Swace":"Break",
  // Cabriolets
  "Z4":"Cabriolet","718 Boxster":"Cabriolet","MX-5":"Cabriolet","Mini Cabriolet":"Cabriolet","F-Type":"Cabriolet",
  // Monospaces
  "Scenic":"Monospace","Espace":"Monospace","Kangoo":"Monospace",
  "Berlingo":"Monospace","SpaceTourer":"Monospace","Rifter":"Monospace",
  // Coupés
  "Serie 2":"Coupé","Serie 4":"Coupé","CLA":"Coupé","CLS":"Coupé",
  "A5":"Coupé","A7":"Coupé","TT":"Coupé","RS3":"Coupé","RS4":"Coupé","RS5":"Coupé","RS6":"Coupé",
  "911":"Coupé","Panamera":"Coupé","718 Cayman":"Coupé",
  "Arteon":"Coupé","Supra":"Coupé","GR86":"Coupé","LC":"Coupé",
  "Mustang":"Coupé","M3":"Coupé","M4":"Coupé","AMG GT":"Coupé",
  // Pick-up
  "Ranger":"Pick-up","Hilux":"Pick-up","Navara":"Pick-up",
  // Électriques
  "Zoe":"Électrique","Spring":"Électrique","Megane E-Tech":"Électrique",
  "e-208":"Électrique","e-2008":"Électrique","e-308":"Électrique","e-3008":"Électrique",
  "Ami":"Électrique","e-C4":"Électrique",
  "Model Y":"Électrique","Model S":"Électrique","Model X":"Électrique",
  "ID.3":"Électrique","ID.4":"Électrique","ID.5":"Électrique","ID.Buzz":"Électrique",
  "Ioniq 5":"Électrique","Ioniq 6":"Électrique","EV6":"Électrique","EV9":"Électrique",
  "Ariya":"Électrique","Leaf":"Électrique",
  "500e":"Électrique","600e":"Électrique",
  "iX3":"Électrique","iX":"Électrique","i4":"Électrique","i7":"Électrique",
  "EQA":"Électrique","EQB":"Électrique","EQC":"Électrique","EQE":"Électrique","EQS":"Électrique",
  "Q4 e-tron":"Électrique","e-tron":"Électrique",
  "bZ4X":"Électrique","MX-30":"Électrique","EX30":"Électrique","EX90":"Électrique",
  "Enyaq":"Électrique","#1":"Électrique","Mini Cooper SE":"Électrique",
  "RZ":"Électrique","I-Pace":"Électrique","LBX":"Électrique","Honda e":"Électrique","e:Ny1":"Électrique",
  "Taycan":"Électrique",
  // Utilitaires
  "Partner":"Utilitaire","Expert":"Utilitaire","Boxer":"Utilitaire",
  "Trafic":"Utilitaire","Master":"Utilitaire",
  "Jumpy":"Utilitaire","Jumper":"Utilitaire",
  "Transit":"Utilitaire","Transit Custom":"Utilitaire","Tourneo":"Utilitaire",
  "Transporter":"Utilitaire","Caddy":"Utilitaire",
  "Vivaro":"Utilitaire","Movano":"Utilitaire","Combo":"Utilitaire",
  "Doblo":"Utilitaire","Ducato":"Utilitaire","Scudo":"Utilitaire",
  "Primastar":"Utilitaire","Townstar":"Utilitaire","Proace":"Utilitaire",
};

/* ── Marques ── */
const MARQUES_VOITURE = [
  "Abarth","Alfa Romeo","Audi","BMW","Citroen","Cupra","Dacia","DS","Fiat","Ford","Honda","Hyundai",
  "Jaguar","Jeep","Kia","Land Rover","Lexus","Mazda","Mercedes","Mini","Mitsubishi","Nissan","Opel",
  "Peugeot","Porsche","Renault","Seat","Skoda","Smart","Subaru","Suzuki","Tesla","Toyota","Volkswagen","Volvo",
];
const MARQUES_MOTO = [
  "Aprilia","Benelli","Beta","BMW","Can-Am","CFMOTO","Derbi","Ducati","Energica","GasGas","Harley-Davidson",
  "Honda","Husqvarna","Indian","Kawasaki","KTM","Kymco","LiveWire","MBK","Moto Guzzi","MV Agusta",
  "Peugeot","Piaggio","Royal Enfield","Suzuki","SYM","Triumph","Vespa","Yamaha","Zero",
];

/* ── Modeles par marque ── */
const MODELES: Record<string, string[]> = {
  Peugeot: ["108","208","308","408","508","2008","3008","5008","Partner","Rifter","Expert","Boxer","e-208","e-308","e-2008","e-3008"],
  Renault: ["Clio","Captur","Megane","Austral","Arkana","Scenic","Espace","Kangoo","Trafic","Master","Twingo","Zoe","Megane E-Tech"],
  "Citroen": ["C1","C3","C3 Aircross","C4","C4 X","C5 X","C5 Aircross","Berlingo","SpaceTourer","Jumpy","Jumper","Ami","e-C4"],
  BMW: ["Serie 1","Serie 2","Serie 3","Serie 4","Serie 5","Serie 7","X1","X2","X3","X4","X5","X6","X7","iX","iX3","i4","i7","Z4","M3","M4"],
  Mercedes: ["Classe A","Classe B","Classe C","Classe E","Classe S","CLA","CLS","GLA","GLB","GLC","GLE","GLS","EQA","EQB","EQC","EQE","EQS","AMG GT"],
  Audi: ["A1","A3","A4","A5","A6","A7","A8","Q2","Q3","Q4 e-tron","Q5","Q7","Q8","e-tron","TT","RS3","RS4","RS5","RS6"],
  Volkswagen: ["Polo","Golf","T-Roc","Tiguan","Touareg","Passat","Arteon","T-Cross","Taigo","ID.3","ID.4","ID.5","ID.Buzz","Caddy","Transporter"],
  Toyota: ["Aygo X","Yaris","Yaris Cross","Corolla","C-HR","RAV4","Highlander","Land Cruiser","Supra","GR86","Proace","Hilux","bZ4X"],
  Ford: ["Fiesta","Focus","Puma","Kuga","Explorer","Mustang","Mustang Mach-E","Ranger","Transit","Transit Custom","Tourneo"],
  Dacia: ["Sandero","Sandero Stepway","Duster","Jogger","Spring","Logan"],
  Hyundai: ["i10","i20","i30","Kona","Tucson","Santa Fe","Ioniq 5","Ioniq 6","Bayon","Staria"],
  Kia: ["Picanto","Rio","Ceed","XCeed","Sportage","Sorento","EV6","EV9","Niro","Stonic","Proceed"],
  Nissan: ["Micra","Juke","Qashqai","X-Trail","Ariya","Leaf","Townstar","Navara","Primastar"],
  Tesla: ["Model 3","Model Y","Model S","Model X"],
  Fiat: ["500","500X","Tipo","Panda","500e","600e","Doblo","Ducato","Scudo"],
  Opel: ["Corsa","Astra","Mokka","Crossland","Grandland","Combo","Vivaro","Movano"],
  Volvo: ["XC40","XC60","XC90","S60","S90","V60","V90","C40","EX30","EX90"],
  Skoda: ["Fabia","Scala","Octavia","Superb","Kamiq","Karoq","Kodiaq","Enyaq"],
  Seat: ["Ibiza","Arona","Leon","Ateca","Tarraco"],
  Porsche: ["911","Cayenne","Macan","Panamera","Taycan","718 Boxster","718 Cayman"],
  Mini: ["Mini 3 portes","Mini 5 portes","Mini Clubman","Mini Countryman","Mini Cabriolet","Mini Cooper SE"],
  Mazda: ["Mazda2","Mazda3","CX-3","CX-30","CX-5","CX-60","MX-5","MX-30"],
  Jeep: ["Renegade","Compass","Cherokee","Grand Cherokee","Wrangler","Gladiator","Avenger"],
  "Land Rover": ["Defender","Discovery","Discovery Sport","Range Rover","Range Rover Sport","Range Rover Evoque","Range Rover Velar"],
  Jaguar: ["E-Pace","F-Pace","I-Pace","XE","XF","F-Type"],
  Lexus: ["UX","NX","RX","ES","IS","LC","LS","LBX","RZ"],
  Smart: ["Fortwo","Forfour","#1"],
  Honda: ["Jazz","Civic","HR-V","ZR-V","CR-V","e:Ny1","Honda e"],
  Suzuki: ["Swift","Ignis","Vitara","S-Cross","Jimny","Across","Swace"],
};

/* ── Motorisations ── */
const MOTORISATIONS: Record<string, string[]> = {
  "Peugeot_308": ["1.2 PureTech 110","1.2 PureTech 130","1.2 PureTech 130 EAT8","1.5 BlueHDi 130","1.5 BlueHDi 130 EAT8","1.6 PureTech 180 EAT8","1.6 Hybrid 180 e-EAT8","1.6 Hybrid 225 e-EAT8"],
  "Peugeot_3008": ["1.2 PureTech 130","1.2 PureTech 130 EAT8","1.5 BlueHDi 130","1.5 BlueHDi 130 EAT8","1.6 PureTech 180 EAT8","1.6 Hybrid 180 e-EAT8","1.6 Hybrid 225 e-EAT8","1.6 Hybrid4 300 e-EAT8"],
  "Peugeot_208": ["1.2 PureTech 75","1.2 PureTech 100","1.2 PureTech 130 EAT8","1.5 BlueHDi 100","e-208 136ch"],
  "Peugeot_2008": ["1.2 PureTech 100","1.2 PureTech 130","1.2 PureTech 130 EAT8","1.5 BlueHDi 110","1.5 BlueHDi 130 EAT8","e-2008 136ch"],
  "Renault_Clio": ["1.0 SCe 65","1.0 TCe 90","1.0 TCe 90 CVT","1.3 TCe 140 EDC","1.6 E-Tech 145"],
  "Renault_Captur": ["1.0 TCe 90","1.3 TCe 140","1.3 TCe 140 EDC","1.6 E-Tech 145","1.6 E-Tech Plug-in 160"],
  "Renault_Megane": ["1.3 TCe 140","1.3 TCe 140 EDC","1.5 Blue dCi 115","1.5 Blue dCi 115 EDC","1.6 E-Tech 160"],
  "BMW_Serie 3": ["318i 156ch","320i 184ch","330i 258ch","M340i 374ch","318d 150ch","320d 190ch","330d 286ch","330e Hybride 292ch"],
  "BMW_X1": ["sDrive18i 136ch","xDrive23i 218ch","xDrive30e 326ch","sDrive18d 150ch","xDrive23d 211ch","iX1 xDrive30 313ch"],
  "BMW_X3": ["xDrive20i 184ch","xDrive30i 245ch","M40i 360ch","xDrive20d 190ch","xDrive30d 286ch","xDrive30e 292ch"],
  "Mercedes_Classe A": ["A 180 136ch","A 200 163ch","A 250 224ch","A 35 AMG 306ch","A 180d 116ch","A 200d 150ch","A 220d 190ch","A 250e 218ch"],
  "Mercedes_Classe C": ["C 180 170ch","C 200 204ch","C 300 258ch","C 43 AMG 408ch","C 200d 163ch","C 220d 200ch","C 300d 265ch","C 300e 313ch"],
  "Audi_A3": ["30 TFSI 110ch","35 TFSI 150ch","40 TFSI e 204ch","S3 310ch","30 TDI 116ch","35 TDI 150ch"],
  "Volkswagen_Golf": ["1.0 TSI 110","1.5 TSI 130","1.5 TSI 150","2.0 TSI GTI 245","2.0 TSI R 320","2.0 TDI 115","2.0 TDI 150","1.4 eHybrid 204","1.4 eHybrid GTE 245"],
  "default": ["1.0","1.2","1.4","1.5","1.6","1.8","2.0","2.2","2.5","3.0","Electrique","Hybride"],
};

/* ── Versions ── */
const VERSIONS: Record<string, string[]> = {
  "Peugeot_308_1.2 PureTech 130": ["Active Pack","Allure","Allure Pack","GT","GT Pack"],
  "Peugeot_308_1.5 BlueHDi 130": ["Active Pack","Allure","Allure Pack","GT","GT Pack"],
  "Peugeot_308_1.2 PureTech 130 EAT8": ["Active Pack","Allure","Allure Pack","GT","GT Pack"],
  "Peugeot_3008_1.2 PureTech 130 EAT8": ["Active Pack","Allure","Allure Pack","GT","GT Pack"],
  "Peugeot_3008_1.5 BlueHDi 130 EAT8": ["Active Pack","Allure","Allure Pack","GT","GT Pack"],
  "Peugeot_208_1.2 PureTech 100": ["Active","Active Pack","Allure","Allure Pack","GT","GT Pack"],
  "Renault_Clio_1.0 TCe 90": ["Life","Zen","Intens","RS Line","Initiale Paris"],
  "Renault_Clio_1.3 TCe 140 EDC": ["Intens","RS Line","Initiale Paris"],
  "BMW_Serie 3_320i 184ch": ["Lounge","Business","Luxury","M Sport","M Sport Pro"],
  "BMW_Serie 3_320d 190ch": ["Lounge","Business","Luxury","M Sport","M Sport Pro"],
  "Mercedes_Classe C_C 200 204ch": ["Avantgarde","AMG Line","AMG Line Premium","AMG Line Premium Plus"],
  "Audi_A3_35 TFSI 150ch": ["Design","Design Luxe","S line","S line Plus"],
  "Volkswagen_Golf_1.5 TSI 130": ["Life","Style","R-Line","Match"],
  "default": ["Standard","Confort","Sport","Luxe","Premium"],
};

/* ── Finitions (4eme niveau cascading) ── */
const FINITIONS: Record<string, string[]> = {
  "Peugeot_308_GT": ["GT","GT Pack","GT Pack EAT8"],
  "Peugeot_308_Allure": ["Allure","Allure Pack","Allure Business"],
  "BMW_Serie 3_M Sport": ["M Sport","M Sport Pro","M Sport Edition"],
  "default": ["Standard","Pack","Premium","Business","Edition speciale"],
};

/* ── Couleurs ── */
const COULEURS_EXT = ["Noir","Blanc","Gris","Argent","Bleu","Rouge","Vert","Marron","Beige","Orange","Jaune","Violet","Bordeaux","Anthracite"];
const COULEURS_INT = ["Noir","Beige","Gris","Marron","Blanc","Rouge","Bleu"];
const TYPES_PEINTURE = ["Opaque","Metallisee","Nacree","Mat"];
const MATIERES_SIEGES = ["Tissu","Cuir","Cuir / Alcantara","Alcantara","Simili cuir","Velours"];
const ETATS = ["Neuf","Excellent","Tres bon","Bon etat","Correct","A reviser","Accidente"];
const EMISSIONS = ["EURO 1","EURO 2","EURO 3","EURO 4","EURO 5","EURO 6","EURO 6d","EURO 6d-TEMP","EURO 7"];

/* ── Moto specifics ── */
const CATEGORIES_MOTO = [
  "Roadster","Sportive","Trail","Adventure","Custom","Cruiser","Touring","Naked","Cafe Racer",
  "Scrambler","Enduro","Supermotard","Cross","Trial","Scooter","Scooter GT","125 cm3","50 cm3","Electrique","3 roues","Quad",
];
const CYLINDREES_MOTO = ["50","125","250","300","400","500","600","650","700","750","800","900","1000","1100","1200","1300+"];
const PERMIS_MOTO = ["AM (50 cm3)","A1 (125 cm3)","A2 (35 kW max)","A (toutes)"];

/* ── Equipements par categorie (enrichi + Antivol) ── */
const EQUIP_CATEGORIES = [
  { key: "exterieur", label: "Exterieur", items: [
    "Jantes alliage","Jantes alliage 17\"","Jantes alliage 18\"","Jantes alliage 19\"","Barres de toit","Pack carrosserie",
    "Vitres surteintees","Retroviseurs electriques","Retroviseurs rabattables","Retroviseurs rabattables electriquement",
    "Retroviseurs degivrants","Antibrouillards","Feux LED","Feux Full LED","Feux xenon","Feux adaptatifs",
    "Phares directionnels","Becquet","Attelage","Aileron","Peinture metallisee",
    "Rampes de pavillon alu","Rampes de pavillon noires","Sorties echappement chromees",
    "Stickers decoratifs","Suspension magnetique","Suspension pneumatique","Suspension sport",
    "PSM","Radar de recul",
  ]},
  { key: "interieur", label: "Interieur", items: [
    "Sieges chauffants","Sieges electriques","Sieges massants","Sieges ventiles","Sieges sport",
    "Banquette rabattable 1/3 - 2/3","Volant cuir","Volant chauffant","Volant multifonction",
    "Accoudoir central","Eclairage ambiance","Eclairage ambiance multicolore","Toit ouvrant","Toit panoramique",
    "Retroviseur interieur jour/nuit auto","Palette au volant","Pedalier alu",
    "Ciel de toit noir","Sellerie cuir","Sellerie Alcantara","Plancher coffre reversible",
  ]},
  { key: "confort", label: "Confort", items: [
    "Climatisation manuelle","Climatisation automatique","Climatisation bi-zone","Climatisation tri-zone",
    "Regulateur de vitesse","Regulateur adaptatif ACC","Limiteur de vitesse",
    "Demarrage sans cle","Fermeture centralisee","Ouverture mains libres",
    "Hayon electrique","Vitres electriques AV/AR","Direction assistee variable",
    "Aide au stationnement AV","Aide au stationnement AR","Park Assist automatique",
    "Boite automatique","Volant reglable en profondeur","Accoudoir AR",
  ]},
  { key: "securite", label: "Securite", items: [
    "ABS","ESP","ASR","Airbags frontaux","Airbags lateraux","Airbags rideaux","Airbag genoux",
    "Controle de traction","ISOFIX","Alerte franchissement de ligne","Freinage urgence automatique",
    "Camera de recul","Camera 360","Radar de recul avant","Radar de recul arriere",
    "Surveillance angle mort","Alerte fatigue","Regulateur de distance","Detection panneaux",
    "Aide au maintien de voie","Feux de route automatiques",
  ]},
  { key: "antivol", label: "Antivol", items: [
    "Alarme","Alarme volumetrique","Antivol de roues","Gravage des vitres",
    "Systeme anti-demarrage","Traceur GPS","Verrou de direction renforce",
    "Serrure renforcee","Camera de surveillance","Bloque-volant",
  ]},
  { key: "multimedia", label: "Multimedia", items: [
    "GPS integre","Apple CarPlay","Android Auto","Apple CarPlay sans fil","Android Auto sans fil",
    "Bluetooth","Ecran tactile 7\"","Ecran tactile 10\"","Ecran tactile 12\"","Affichage tete haute",
    "Sono premium","Sono Bose","Sono Harman Kardon","Sono Bang & Olufsen","Sono Focal",
    "Charge sans fil Qi","Prises USB-C","Port AUX","DAB+","Commandes vocales",
  ]},
  { key: "autres", label: "Autres", items: [
    "Roue de secours","Kit crevaison","Extincteur","Triangle","Gilet fluorescent",
    "Cric","Housse de siege","Tapis de sol","Filet de coffre","Cache-bagages",
  ]},
];

/* ── Photo categories ── */
const PHOTO_CATS_VOITURE = [
  { key: "ext", label: "Exterieures", slots: ["Face avant","3/4 avant gauche","Profil gauche","3/4 arriere gauche","Face arriere","3/4 arriere droit","Profil droit","3/4 avant droit"] },
  { key: "int", label: "Interieures", slots: ["Tableau de bord","Compteur / i-cockpit","Ecran multimedia","Sieges avant","Sieges arriere","Console centrale","Volant","Ciel de toit"] },
  { key: "coffre", label: "Coffre", slots: ["Coffre ouvert","Coffre charge","Plancher coffre"] },
  { key: "moteur", label: "Moteur", slots: ["Compartiment moteur","Detail moteur"] },
  { key: "roues", label: "Pneus / Jantes", slots: ["Roue avant gauche","Roue arriere gauche","Roue avant droite","Roue arriere droite"] },
  { key: "defauts", label: "Defauts / Imperfections", slots: ["Defaut 1","Defaut 2","Defaut 3","Defaut 4"] },
];

const PHOTO_CATS_MOTO = [
  { key: "ext", label: "Exterieures", slots: ["Face avant","Profil gauche","Face arriere","Profil droit","Vue plongeante"] },
  { key: "details", label: "Details", slots: ["Tableau de bord / Compteur","Moteur","Pot echappement","Reservoir","Selle"] },
  { key: "roues", label: "Pneus", slots: ["Roue avant","Roue arriere"] },
  { key: "defauts", label: "Defauts", slots: ["Defaut 1","Defaut 2"] },
];

/* ══════════════════════════════════════════════════════════════════════════ */

export default function DepotAnnonce() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [plaqueMode, setPlaqueMode] = useState<"plaque" | "vin" | "manuel">("plaque");
  const [plaqueFound, setPlaqueFound] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [equipTab, setEquipTab] = useState("exterieur");
  const [equipSearch, setEquipSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [form, setForm] = useState({
    plaque: "", vin: "",
    marque: "", modele: "", annee: "", motorisation: "", version: "", finition: "",
    categorie: "", energie: "", categorieMoto: "", cylindree: "", cylindreeCcm: "", permis: "",
    kilometrage: "", prix: "", couleurExt: "", couleurInt: "", typePeinture: "", matiereSieges: "",
    portes: "", places: "", puissanceCv: "", puissanceFiscale: "",
    etat: "", reparations: "", boite: "", premierMain: "",
    nbProprietaires: "", paysOrigine: "FR", classeEnvironnementale: "", emissionsCo2: "", nbCles: "2",
    dateProchaineCT: "",
    description: "", pointsForts: "",
    contactNom: "", contactEmail: "", contactTelephone: "", contactVille: "", contactCodePostal: "",
  });
  const [selectedEquip, setSelectedEquip] = useState<Record<string, string[]>>({
    exterieur: [], interieur: [], confort: [], securite: [], antivol: [], multimedia: [], autres: [],
  });
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const set = (k: string, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErrors(e => { const n = {...e}; delete n[k]; return n; }); };

  const isMoto = selectedType === "moto";
  const marques = isMoto ? MARQUES_MOTO : MARQUES_VOITURE;
  const photoCats = isMoto ? PHOTO_CATS_MOTO : PHOTO_CATS_VOITURE;

  // Cascading logic (4 niveaux)
  const availableModeles = form.marque ? (MODELES[form.marque] || ["Autre"]) : [];
  const motoKey = `${form.marque}_${form.modele}`;
  const availableMotorisations = form.marque && form.modele
    ? (MOTORISATIONS[motoKey] || MOTORISATIONS["default"] || [])
    : [];
  const versionKey = `${form.marque}_${form.modele}_${form.motorisation}`;
  const availableVersions = form.motorisation
    ? (VERSIONS[versionKey] || VERSIONS["default"] || [])
    : [];
  const finitionKey = `${form.marque}_${form.modele}_${form.version}`;
  const availableFinitions = form.version
    ? (FINITIONS[finitionKey] || FINITIONS["default"] || [])
    : [];

  // Equipment search filter
  const filteredEquipItems = useMemo(() => {
    const cat = EQUIP_CATEGORIES.find(c => c.key === equipTab);
    if (!cat) return [];
    if (!equipSearch.trim()) return cat.items;
    const q = equipSearch.toLowerCase();
    return cat.items.filter(item => item.toLowerCase().includes(q));
  }, [equipTab, equipSearch]);

  // Plate lookup
  const utils = trpc.useUtils();
  const [plateLoading, setPlateLoading] = useState(false);

  async function lookupPlate() {
    const query = form.plaque.trim() || form.vin.trim();
    const type = form.plaque.trim() ? "plaque" : "vin";
    if (!query) { showToast("Entrez une plaque ou un VIN"); return; }
    setPlateLoading(true);
    try {
      const r = await utils.annonces.lookupPlate.fetch({ type, query });
      if (r) {
        if (r.marque) set("marque", r.marque);
        if (r.modele) set("modele", r.modele);
        if (r.version) set("motorisation", r.version);
        if (r.annee) set("annee", String(r.annee));
        if (r.carburant) set("energie", r.carburant);
        if (r.boite) set("boite", r.boite);
        setPlaqueFound(true);
        showToast("Vehicule identifie !");
      }
    } catch {
      setPlaqueFound(true);
      showToast("Vehicule non trouve — saisie manuelle activee");
    } finally {
      setPlateLoading(false);
    }
  }

  // Create annonce mutation
  const create = trpc.annonces.create.useMutation({
    onSuccess: () => {
      showToast("Annonce publiee avec succes !");
    },
    onError: (err) => {
      showToast("Erreur: " + err.message);
    },
  });

  function validateStep(s: number): boolean {
    const newErrors: Record<string, string> = {};
    if (s === 0) {
      if (!form.marque) newErrors.marque = "Ce champ est obligatoire";
      if (!form.modele) newErrors.modele = "Ce champ est obligatoire";
    } else if (s === 1) {
      if (!form.kilometrage) newErrors.kilometrage = "Ce champ est obligatoire";
      if (!form.prix) newErrors.prix = "Ce champ est obligatoire";
      if (!form.couleurExt) newErrors.couleurExt = "Ce champ est obligatoire";
      if (!form.etat) newErrors.etat = "Ce champ est obligatoire";
    } else if (s === 5) {
      if (!form.contactVille) newErrors.contactVille = "Ce champ est obligatoire";
      if (!form.contactTelephone) newErrors.contactTelephone = "Ce champ est obligatoire";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Veuillez remplir tous les champs obligatoires");
      return false;
    }
    return true;
  }

  function handlePublish() {
    if (!form.marque || !form.modele) { showToast("Marque et modele obligatoires"); return; }
    if (!form.prix) { showToast("Le prix est obligatoire"); return; }
    const allPhotos = Object.entries(photoUrls)
      .filter(([, url]) => Boolean(url))
      .map(([key, url]) => {
        const catKey = key.split("_")[0]; // ext, int, coffre, moteur, roues, defauts, details
        const catMap: Record<string, string> = { ext: "exterieur", int: "interieur", coffre: "coffre", moteur: "moteur", roues: "roues", defauts: "autres", details: "autres" };
        return { url, categorie: catMap[catKey] || "autres" };
      });
    const allEquip = Object.values(selectedEquip).flat();
    const confortItems = selectedEquip.confort || [];
    const securiteItems = selectedEquip.securite || [];
    const multimediaItems = selectedEquip.multimedia || [];

    create.mutate({
      type: "vente",
      titre: `${form.marque} ${form.modele} ${form.motorisation || ""} ${form.annee}`.trim(),
      marque: form.marque,
      modele: form.modele,
      version: form.version || form.motorisation || undefined,
      famille: isMoto ? "moto" : "auto",
      carburant: form.energie || "essence",
      boite: form.boite || "manuelle",
      annee: form.annee ? Number(form.annee) : undefined,
      kilometrage: form.kilometrage ? Number(form.kilometrage.replace(/\s/g, "")) : undefined,
      prix: form.prix ? Number(form.prix.replace(/\s/g, "")) : 0,
      couleur: form.couleurExt || undefined,
      puissanceCv: form.puissanceCv ? Number(form.puissanceCv) : undefined,
      portes: form.portes ? Number(form.portes) : undefined,
      places: form.places ? Number(form.places) : undefined,
      ville: form.contactVille || undefined,
      codePostal: form.contactCodePostal || undefined,
      contactTelephone: form.contactTelephone || undefined,
      description: form.description || undefined,
      photos: allPhotos,
      equipements: allEquip,
      sellerie: form.matiereSieges || undefined,
      cylindree: form.cylindree || form.cylindreeCcm || undefined,
      confort: confortItems,
      securite: securiteItems,
      multimedia: multimediaItems,
      videosNormales: videoUrls,
    });
  }

  // Progress percentage
  const ETAPES = ["Immatriculation","Caracteristiques","Equipements","Photos","Description","Coordonnees","Publication"];
  const progress = ((step) / (ETAPES.length - 1)) * 100;

  // ── Type selection screen ──
  if (!selectedType) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-[#111] px-4 pt-6 pb-5">
          <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-3"><ChevronLeft size={14} /> Retour</Link>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><PlusCircle size={22} className="text-[#D4AF37]" /> Deposer une annonce</h1>
          <p className="mt-1 text-sm text-white/60">Vendez votre vehicule sur MKA.P-MS — simple, rapide, efficace</p>
        </div>
        <div className="px-4 mt-6">
          <h2 className="text-base font-bold text-[#111] mb-1">Que souhaitez-vous vendre ?</h2>
          <p className="text-xs text-[#6B7280] mb-4">Selectionnez le type de vehicule</p>
          <div className="space-y-2.5">
            {TYPES.map((t) => { const Icon = t.icon; return (
              <button key={t.id} onClick={() => { setSelectedType(t.id); setStep(0); setPlaqueFound(false); }} className="w-full flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 active:scale-[0.99] transition hover:border-[#D4AF37] hover:shadow-sm">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.color}`}><Icon size={20} className="text-white" /></div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-bold text-[#111]">{t.label}</span>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">{t.desc}</p>
                </div>
                <ChevronRight size={16} className="text-[#D4AF37]" />
              </button>
            ); })}
          </div>
        </div>
      </div>
    );
  }

  /* ── Helper: dropdown field with validation ── */
  function SelectField({ label, value, onChange, options, required, placeholder, errorKey }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean; placeholder?: string; errorKey?: string;
  }) {
    const hasError = errorKey && errors[errorKey];
    return (
      <div>
        <label className="block text-sm font-semibold text-[#111] mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        <div className="relative">
          <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full appearance-none rounded-xl border px-4 py-3 text-sm pr-10 transition ${
            hasError ? "border-red-400 bg-red-50" : value ? "border-[#D4AF37] bg-[#FFFDF5]" : "border-[#E5E7EB] bg-white hover:border-[#D4AF37]/50"
          }`}>
            <option value="">{placeholder || "Choisir..."}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        </div>
        {hasError && <p className="text-xs text-red-500 mt-1">{errors[errorKey!]}</p>}
      </div>
    );
  }

  /* ── Helper: radio group (vertical circles like La Centrale) ── */
  function RadioGroup({ label, value, onChange, options, vertical, required }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]; vertical?: boolean; required?: boolean;
  }) {
    return (
      <div>
        <label className="block text-sm font-semibold text-[#111] mb-2">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        <div className={vertical ? "space-y-2.5" : "flex flex-wrap gap-2.5"}>
          {options.map(o => (
            <button key={o} onClick={() => onChange(o)} className={`flex items-center gap-3 ${vertical ? "w-full" : ""} text-left`}>
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                value === o ? "border-[#E53E3E]" : "border-[#D1D5DB]"
              }`}>
                {value === o && <div className="h-2.5 w-2.5 rounded-full bg-[#E53E3E]" />}
              </div>
              <span className={`text-sm ${value === o ? "font-semibold text-[#111]" : "text-[#374151]"}`}>{o}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Helper: input field ── */
  function InputField({ label, value, onChange, placeholder, suffix, type, required, errorKey }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; suffix?: string; type?: string; required?: boolean; errorKey?: string;
  }) {
    const hasError = errorKey && errors[errorKey];
    return (
      <div>
        <label className="block text-sm font-semibold text-[#111] mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        <div className="relative">
          <input value={value} onChange={(e) => onChange(e.target.value)} type={type || "text"} placeholder={placeholder}
            className={`w-full rounded-xl border px-4 py-3 text-sm transition ${suffix ? "pr-12" : ""} ${
              hasError ? "border-red-400 bg-red-50" : value ? "border-[#D4AF37] bg-[#FFFDF5]" : "border-[#E5E7EB] bg-white hover:border-[#D4AF37]/50"
            }`} />
          {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[#9CA3AF]">{suffix}</span>}
        </div>
        {hasError && <p className="text-xs text-red-500 mt-1">{errors[errorKey!]}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* Header */}
      <div className={`px-4 pt-6 pb-4 ${isMoto ? "bg-red-600" : "bg-[#111]"}`}>
        <button onClick={() => { if (step > 0) setStep(step - 1); else setSelectedType(null); }} className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> {step === 0 ? "Changer de type" : "Etape precedente"}
        </button>
        <h1 className="text-lg font-black text-white flex items-center gap-2">
          {isMoto ? <Bike size={20} /> : <Car size={20} />}
          Deposer : {TYPES.find((t) => t.id === selectedType)?.label}
        </h1>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#E5E7EB]">
        <div className="h-full bg-[#E53E3E] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Breadcrumb Steps — scrollable like La Centrale */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto bg-white border-b border-[#E5E7EB]">
        {ETAPES.map((e, i) => (
          <button key={i} onClick={() => { if (i < step) setStep(i); }}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition border ${
              i === step ? "bg-blue-50 text-blue-700 border-blue-200" : i < step ? "bg-green-50 text-green-700 border-green-200" : "bg-white text-[#9CA3AF] border-[#E5E7EB]"
            }`}>
            {i < step ? <Check size={12} className="text-green-500" /> : i === step ? <CircleDot size={12} /> : null}
            <span>{e}</span>
            {i < ETAPES.length - 1 && <ChevronRight size={10} className="text-[#D1D5DB] ml-0.5" />}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 0: IMMATRICULATION
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 0 && (
        <div className="px-4 mt-5 space-y-4">
          {/* Mode selector */}
          <div className="flex gap-2 rounded-xl bg-white border border-[#E5E7EB] p-1.5">
            {(["plaque", "vin", "manuel"] as const).map(m => (
              <button key={m} onClick={() => { setPlaqueMode(m); setPlaqueFound(false); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${
                  plaqueMode === m ? "bg-[#111] text-white shadow-sm" : "text-[#6B7280] hover:bg-[#F5F3EF]"
                }`}>
                {m === "plaque" ? "Plaque" : m === "vin" ? "N° VIN" : "Saisie manuelle"}
              </button>
            ))}
          </div>

          {plaqueMode === "plaque" && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#111] mb-1">Plaque d'immatriculation</p>
              <p className="text-xs text-[#9CA3AF] mb-3">Identifiez votre vehicule automatiquement</p>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-xl border-2 border-[#1E3A8A] bg-white px-3 py-2.5">
                  <div className="flex h-7 w-6 items-center justify-center rounded bg-[#1E3A8A]"><span className="text-[8px] font-bold text-white">F</span></div>
                  <input value={form.plaque} onChange={(e) => set("plaque", e.target.value.toUpperCase())} placeholder="AA-123-BB" className="flex-1 text-center text-base font-black uppercase tracking-wider outline-none" onKeyDown={(e) => { if (e.key === "Enter") lookupPlate(); }} />
                </div>
                <button onClick={lookupPlate} disabled={plateLoading} className="px-5 rounded-xl bg-[#111] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#333] transition disabled:opacity-50">
                  {plateLoading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={14} /> OK</>}
                </button>
              </div>
            </div>
          )}

          {plaqueMode === "vin" && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#111] mb-1">Numero VIN</p>
              <p className="text-xs text-[#9CA3AF] mb-3">17 caracteres — visible sur carte grise (case E)</p>
              <div className="flex gap-2">
                <input value={form.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} placeholder="VF1XXXXXXXXX12345" className="flex-1 rounded-xl border border-[#E5E7EB] px-4 py-3 text-xs font-mono tracking-wider" onKeyDown={(e) => { if (e.key === "Enter") lookupPlate(); }} />
                <button onClick={lookupPlate} disabled={plateLoading} className="px-5 rounded-xl bg-[#111] text-white text-xs font-bold disabled:opacity-50">
                  {plateLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Post-lookup or Manuel: cascading dropdowns */}
          {(plaqueMode === "manuel" || plaqueFound) && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 shadow-sm space-y-4">
              {plaqueFound && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 mb-2">
                  <Check size={16} className="text-green-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-green-800">Vehicule identifie</span>
                    <p className="text-[10px] text-green-700 mt-0.5">Completez ou corrigez les informations ci-dessous</p>
                  </div>
                </div>
              )}

              {/* Marque */}
              <SelectField label="Marque" value={form.marque} onChange={(v) => { set("marque", v); set("modele", ""); set("motorisation", ""); set("version", ""); set("finition", ""); }} options={marques} required placeholder="Selectionnez la marque" errorKey="marque" />

              {/* Modele — cascading */}
              {form.marque && (
                <SelectField label="Modele" value={form.modele} onChange={(v) => { set("modele", v); set("motorisation", ""); set("version", ""); set("finition", ""); const autoCat = AUTO_CATEGORIE[v]; if (autoCat) set("categorie", autoCat); }} options={availableModeles} required placeholder="Selectionnez le modele" errorKey="modele" />
              )}

              {/* Categorie */}
              {form.modele && !isMoto && (
                <SelectField label="Categorie" value={form.categorie} onChange={(v) => set("categorie", v)} options={CATEGORIES_VOITURE} placeholder="Selectionnez la categorie" />
              )}

              {/* Moto-specific */}
              {isMoto && form.modele && (
                <>
                  <SelectField label="Categorie moto" value={form.categorieMoto} onChange={(v) => set("categorieMoto", v)} options={CATEGORIES_MOTO} />
                  <SelectField label="Cylindree" value={form.cylindree} onChange={(v) => set("cylindree", v)} options={CYLINDREES_MOTO} />
                  <SelectField label="Permis requis" value={form.permis} onChange={(v) => set("permis", v)} options={PERMIS_MOTO} />
                </>
              )}

              {/* Motorisation — cascading */}
              {form.modele && !isMoto && (
                <SelectField label="Motorisation" value={form.motorisation} onChange={(v) => { set("motorisation", v); set("version", ""); set("finition", ""); }} options={availableMotorisations} required placeholder="Selectionnez la motorisation" />
              )}

              {/* Version — cascading */}
              {form.motorisation && !isMoto && (
                <SelectField label="Version" value={form.version} onChange={(v) => { set("version", v); set("finition", ""); }} options={availableVersions} required placeholder="Selectionnez la version" />
              )}

              {/* Finition — cascading (4eme niveau) */}
              {form.version && !isMoto && (
                <SelectField label="Finition" value={form.finition} onChange={(v) => set("finition", v)} options={availableFinitions} placeholder="Selectionnez la finition" />
              )}

              {/* Annee + Energie side by side */}
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Annee" value={form.annee} onChange={(v) => set("annee", v)} placeholder="2024" type="number" required />
                <SelectField label="Energie" value={form.energie} onChange={(v) => set("energie", v)} options={isMoto ? ["Essence","Electrique","Hybride"] : ["Essence","Diesel","Hybride","Hybride rechargeable","Electrique","GPL","GNV","Hydrogene","E85"]} required />
              </div>

              {/* Boite de vitesse — Radio vertical */}
              {!isMoto && (
                <RadioGroup label="Boite de vitesse" value={form.boite} onChange={(v) => set("boite", v)} options={["AUTOMATIQUE","MANUELLE","SEMI-AUTOMATIQUE"]} vertical />
              )}

              <button onClick={() => {
                if (!validateStep(0)) return;
                setStep(1);
              }} className="w-full py-3.5 rounded-xl bg-[#111] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#333] transition active:scale-[0.99]">
                Continuer <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 1: CARACTERISTIQUES
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="px-4 mt-5 space-y-4">
          {/* Vehicle ID bar */}
          <div className="rounded-xl bg-[#FFFDF5] border border-[#D4AF37]/30 p-3 flex items-center gap-3">
            <Car size={16} className="text-[#D4AF37] shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#111]">{form.marque} {form.modele} {form.motorisation}</p>
              <p className="text-[10px] text-[#6B7280]">{form.annee && `${form.annee} · `}{form.energie} · {form.boite || "—"}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 space-y-5">
            {/* Puissance fiscale — Radio vertical */}
            {!isMoto && (
              <RadioGroup label="Puissance fiscale" value={form.puissanceFiscale} onChange={(v) => set("puissanceFiscale", v)} options={["4","5","6","7","8","9","10","11","12","13","14","15+"]} required />
            )}

            {/* Nombre de portes */}
            {!isMoto && (
              <RadioGroup label="Nombre de portes" value={form.portes} onChange={(v) => set("portes", v)} options={["2","3","5"]} />
            )}

            {/* Premiere main */}
            <RadioGroup label="Premiere main" value={form.premierMain} onChange={(v) => set("premierMain", v)} options={["Oui","Non"]} required />

            {/* Kilometrage */}
            <InputField label="Kilometrage" value={form.kilometrage} onChange={(v) => set("kilometrage", v)} placeholder="Indiquez un kilometrage" suffix="km" required errorKey="kilometrage" />

            {/* Etat */}
            <SelectField label="Etat du vehicule" value={form.etat} onChange={(v) => set("etat", v)} options={ETATS} required placeholder="Choisissez un etat" errorKey="etat" />

            {/* Reparations */}
            <SelectField label="Reparations effectuees" value={form.reparations} onChange={(v) => set("reparations", v)} options={["Aucune","Direction","Distribution","Radiateur","Embrayage","Freins","Carrosserie","Peinture","Mecanique","Electricite","Interieur","Autre"]} placeholder="Selectionnez les reparations" />

            {/* Couleur exterieure */}
            <SelectField label="Couleur exterieure" value={form.couleurExt} onChange={(v) => set("couleurExt", v)} options={COULEURS_EXT} required placeholder="Choisissez une couleur" errorKey="couleurExt" />

            {/* Type de peinture */}
            <SelectField label="Type de peinture" value={form.typePeinture} onChange={(v) => set("typePeinture", v)} options={TYPES_PEINTURE} placeholder="Choisissez un type" />

            {/* Couleur interieure */}
            <SelectField label="Couleur interieure" value={form.couleurInt} onChange={(v) => set("couleurInt", v)} options={COULEURS_INT} required placeholder="Choisissez une couleur" />

            {/* Matiere des sieges */}
            <SelectField label="Matiere des sieges" value={form.matiereSieges} onChange={(v) => set("matiereSieges", v)} options={MATIERES_SIEGES} placeholder="Choisissez une matiere" />
          </div>

          {/* Infos complementaires */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#111] flex items-center gap-2"><Info size={14} className="text-[#D4AF37]" /> Informations complementaires</h3>

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Puissance DIN" value={form.puissanceCv} onChange={(v) => set("puissanceCv", v)} placeholder="130" suffix="ch" />
              <InputField label="Cylindree" value={form.cylindreeCcm} onChange={(v) => set("cylindreeCcm", v)} placeholder="1242" suffix="ccm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Nb proprietaires" value={form.nbProprietaires} onChange={(v) => set("nbProprietaires", v)} options={["1","2","3","4","5+"]} />
              <SelectField label="Nb de cles" value={form.nbCles} onChange={(v) => set("nbCles", v)} options={["1","2","3"]} />
            </div>

            {!isMoto && (
              <RadioGroup label="Nombre de places" value={form.places} onChange={(v) => set("places", v)} options={["2","4","5","6","7","8","9"]} />
            )}

            <SelectField label="Pays d'origine" value={form.paysOrigine} onChange={(v) => set("paysOrigine", v)} options={["FR","DE","BE","IT","ES","NL","LU","CH","UK","US","JP","Autre"]} />

            <SelectField label="Classe environnementale" value={form.classeEnvironnementale} onChange={(v) => set("classeEnvironnementale", v)} options={EMISSIONS} />

            <InputField label="Emissions CO2" value={form.emissionsCo2} onChange={(v) => set("emissionsCo2", v)} placeholder="142" suffix="g/km" />

            <InputField label="Date prochain CT" value={form.dateProchaineCT} onChange={(v) => set("dateProchaineCT", v)} placeholder="01/2026" />

            {/* VIN Verification badge */}
            {(form.plaque || form.vin) && (
              <div className="rounded-xl bg-[#F5F3EF] border border-[#E5E7EB] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#111]">Identifiant VIN</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><Shield size={10} /> Vendeur verifie</span>
                </div>
                <p className="text-[10px] text-[#6B7280] mt-1">Ajoutez votre VIN pour confirmer que vous etes le proprietaire et obtenir un badge "Vendeur verifie"</p>
                {!form.vin && (
                  <input value={form.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} placeholder="VF1XXXXXXXXX12345" className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-mono" />
                )}
              </div>
            )}
          </div>

          {/* Prix */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#111] flex items-center gap-2"><Gauge size={14} className="text-[#D4AF37]" /> Prix de vente</h3>
            <InputField label="Prix" value={form.prix} onChange={(v) => set("prix", v)} placeholder="25 000" suffix="EUR" required errorKey="prix" />
            <div className="rounded-lg bg-[#FFFDF5] border border-[#D4AF37]/20 p-3 flex items-start gap-2">
              <Sparkles size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-[#111]">Estimation marche MKA.P-MS</p>
                <p className="text-[9px] text-[#6B7280]">Notre IA analysera votre prix par rapport au marche apres publication</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3.5 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#374151] hover:bg-[#F5F3EF] transition">Retour</button>
            <button onClick={() => { if (!validateStep(1)) return; setStep(2); }} className="flex-1 py-3.5 rounded-xl bg-[#111] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#333] transition">
              Equipements <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 2: EQUIPEMENTS
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="px-4 mt-5 space-y-4">
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-5">
            <h3 className="text-base font-bold text-[#111] mb-1">Vos equipements de serie</h3>
            <p className="text-xs text-[#9CA3AF] mb-4">Selectionnez les equipements presents sur votre vehicule</p>

            {/* Search bar */}
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input value={equipSearch} onChange={(e) => setEquipSearch(e.target.value)} placeholder="Ex : Feux arrieres, Bluetooth, ..." className="w-full rounded-xl border border-[#E5E7EB] pl-9 pr-4 py-3 text-sm hover:border-[#D4AF37]/50 transition" />
            </div>

            {/* Category tabs — horizontal scroll like La Centrale */}
            <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
              {EQUIP_CATEGORIES.map(cat => {
                const count = (selectedEquip[cat.key] || []).length;
                const isActive = equipTab === cat.key;
                return (
                  <button key={cat.key} onClick={() => { setEquipTab(cat.key); setEquipSearch(""); }}
                    className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold border transition ${
                      isActive
                        ? "bg-[#111] text-white border-[#111]"
                        : "bg-white text-[#374151] border-[#E5E7EB] hover:border-[#111]"
                    }`}>
                    {cat.label}{count > 0 && ` (${count})`}
                  </button>
                );
              })}
            </div>

            {/* Checkbox list — La Centrale style (text left, checkbox right) */}
            <div className="mt-2 divide-y divide-[#F3F4F6] max-h-[400px] overflow-y-auto">
              {filteredEquipItems.map(item => {
                const checked = (selectedEquip[equipTab] || []).includes(item);
                return (
                  <button key={item} onClick={() => {
                    setSelectedEquip(prev => {
                      const arr = prev[equipTab] || [];
                      return { ...prev, [equipTab]: checked ? arr.filter(x => x !== item) : [...arr, item] };
                    });
                  }} className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-[#F9FAFB] transition">
                    <span className={`text-sm ${checked ? "font-semibold text-[#111]" : "text-[#374151]"}`}>{item}</span>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                      checked ? "bg-[#111] border-[#111]" : "border-[#D1D5DB] bg-white"
                    }`}>
                      {checked && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
              {filteredEquipItems.length === 0 && (
                <p className="py-6 text-center text-sm text-[#9CA3AF]">Aucun equipement trouve</p>
              )}
            </div>

            {/* Total count */}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-3">
              <Check size={14} className="text-green-500" />
              <span className="text-xs text-[#374151] font-medium">
                {Object.values(selectedEquip).flat().length} equipement(s) selectionne(s) au total
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#374151] hover:bg-[#F5F3EF] transition">Retour</button>
            <button onClick={() => setStep(3)} className="flex-1 py-3.5 rounded-xl bg-[#111] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#333] transition">
              Photos <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 3: PHOTOS
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="px-4 mt-5 space-y-4">
          <div className="rounded-xl bg-[#FFFDF5] border border-[#D4AF37]/30 p-3 flex items-start gap-2">
            <Camera size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#111]">Photos de qualite = vente rapide</p>
              <p className="text-[10px] text-[#6B7280]">Les annonces avec 10+ photos se vendent 3x plus vite</p>
            </div>
          </div>

          {photoCats.map(cat => (
            <div key={cat.key} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <h3 className="text-sm font-bold text-[#111] mb-0.5">{cat.label}</h3>
              <p className="text-[10px] text-[#9CA3AF] mb-3">Cliquez sur un emplacement pour telecharger une photo</p>

              {/* Compact inline slots — small clickable boxes */}
              <div className="grid grid-cols-4 gap-2">
                {cat.slots.map(slot => {
                  const slotKey = `${cat.key}_${slot}`;
                  const url = photoUrls[slotKey];
                  return (
                    <div key={slot} className="flex flex-col items-center">
                      <div className="relative w-full aspect-square">
                        {url ? (
                          <div className="relative w-full h-full">
                            <img src={url} alt={slot} className="w-full h-full rounded-lg object-cover border border-green-300" />
                            <button onClick={(e) => { e.stopPropagation(); setPhotoUrls(p => { const n = { ...p }; delete n[slotKey]; return n; }); }} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow">
                              <X size={10} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full h-full">
                            <FileUpload
                              label=""
                              accept="image/*"
                              multiple={false}
                              maxFiles={1}
                              onUploaded={(files) => { if (files[0]) { setPhotoUrls(p => ({ ...p, [slotKey]: files[0].url })); showToast(`${slot} ajoutee`); } }}
                            />
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-[8px] text-[#6B7280] text-center leading-tight truncate w-full">{slot}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Videos */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h3 className="text-sm font-bold text-[#111] mb-0.5 flex items-center gap-2"><Video size={14} className="text-[#D4AF37]" /> Videos (optionnel)</h3>
            <p className="text-[10px] text-[#9CA3AF] mb-3">MP4, WebM, MOV — max 50 MB par video</p>
            <FileUpload
              label={`Ajouter une video (${videoUrls.length}/5)`}
              accept="video/*"
              multiple
              maxFiles={5 - videoUrls.length}
              onUploaded={(files) => { setVideoUrls(prev => [...prev, ...files.map(f => f.url)].slice(0, 5)); showToast(`${files.length} video(s) ajoutee(s)`); }}
            />
            {videoUrls.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {videoUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] p-2">
                    <Video size={12} className="text-[#D4AF37]" />
                    <span className="flex-1 text-xs text-[#111] truncate">Video {i + 1}</span>
                    <button onClick={() => setVideoUrls(v => v.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Counter */}
          <div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] p-3">
            <Star size={14} className="text-[#D4AF37]" />
            <span className="text-xs text-[#374151] font-medium">{Object.keys(photoUrls).length} photo(s) · {videoUrls.length} video(s)</span>
            <span className="ml-auto text-[10px] font-bold text-[#D4AF37]">Score qualite calcule auto</span>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#374151] hover:bg-[#F5F3EF] transition">Retour</button>
            <button onClick={() => setStep(4)} className="flex-1 py-3.5 rounded-xl bg-[#111] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#333] transition">
              Description <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 4: DESCRIPTION & POINTS FORTS
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div className="px-4 mt-5 space-y-4">
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#111]">Commentaire vendeur</h3>
            <p className="text-xs text-[#9CA3AF]">Decrivez votre vehicule de maniere detaillee pour attirer plus d'acheteurs</p>

            <div>
              <label className="block text-sm font-semibold text-[#111] mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={isMoto ? "Decrivez votre moto : entretien, modifications, etat general, historique, raison de la vente..." : "Decrivez votre vehicule : historique complet, entretien suivi, options, etat general, raison de la vente..."} className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm h-32 resize-none hover:border-[#D4AF37]/50 transition" />
              <div className="flex items-center gap-2 mt-2 rounded-lg bg-[#FFFDF5] border border-[#D4AF37]/20 p-2.5">
                <Sparkles size={12} className="text-[#D4AF37]" />
                <span className="text-[10px] text-[#374151]">L'IA ameliorera automatiquement votre description apres publication</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#111] mb-1.5">Points forts du vehicule</label>
              <textarea value={form.pointsForts} onChange={(e) => set("pointsForts", e.target.value)} placeholder="Ex: Entretien suivi chez le concessionnaire, jamais accidente, CT vierge, pneus neufs, faible kilometrage..." className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm h-20 resize-none hover:border-[#D4AF37]/50 transition" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 py-3.5 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#374151] hover:bg-[#F5F3EF] transition">Retour</button>
            <button onClick={() => setStep(5)} className="flex-1 py-3.5 rounded-xl bg-[#111] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#333] transition">
              Coordonnees <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 5: COORDONNEES
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 5 && (
        <div className="px-4 mt-5 space-y-4">
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#111] flex items-center gap-2"><MapPin size={14} className="text-[#D4AF37]" /> Vos coordonnees</h3>
            <p className="text-xs text-[#9CA3AF]">Ces informations seront affichees sur votre annonce</p>

            <InputField label="Nom / Societe" value={form.contactNom} onChange={(v) => set("contactNom", v)} placeholder="Jean Dupont" />
            <InputField label="Adresse e-mail" value={form.contactEmail} onChange={(v) => set("contactEmail", v)} placeholder="contact@exemple.com" type="email" />
            <InputField label="Telephone" value={form.contactTelephone} onChange={(v) => set("contactTelephone", v)} placeholder="06 12 34 56 78" type="tel" required errorKey="contactTelephone" />

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Ville" value={form.contactVille} onChange={(v) => set("contactVille", v)} placeholder="Paris" required errorKey="contactVille" />
              <InputField label="Code postal" value={form.contactCodePostal} onChange={(v) => set("contactCodePostal", v)} placeholder="75001" />
            </div>

            <div className="rounded-lg bg-[#F5F3EF] p-3 text-[10px] text-[#6B7280]">
              Les donnees que vous renseignez dans ce formulaire sont traitees par MKA.P-MS en qualite de responsable de traitement. <span className="text-[#D4AF37] font-semibold cursor-pointer">Voir plus</span>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-[#F5F3EF] border border-[#E5E7EB] p-4 space-y-2">
            <p className="text-xs font-bold text-[#111] uppercase tracking-wide">Resume de votre annonce</p>
            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-xs text-[#6B7280]">Vehicule</span><span className="text-xs font-bold text-[#111]">{form.marque} {form.modele} {form.motorisation}</span></div>
              <div className="flex justify-between"><span className="text-xs text-[#6B7280]">Annee</span><span className="text-xs font-bold text-[#111]">{form.annee || "—"}</span></div>
              <div className="flex justify-between"><span className="text-xs text-[#6B7280]">Kilometrage</span><span className="text-xs font-bold text-[#111]">{form.kilometrage || "—"} km</span></div>
              <div className="flex justify-between"><span className="text-xs text-[#6B7280]">Prix</span><span className="text-xs font-bold text-[#D4AF37]">{form.prix || "—"} EUR</span></div>
              <div className="flex justify-between"><span className="text-xs text-[#6B7280]">Boite</span><span className="text-xs font-bold text-[#111]">{form.boite || "—"}</span></div>
              <div className="flex justify-between"><span className="text-xs text-[#6B7280]">Photos</span><span className="text-xs font-bold text-[#111]">{Object.keys(photoUrls).length}</span></div>
              <div className="flex justify-between"><span className="text-xs text-[#6B7280]">Equipements</span><span className="text-xs font-bold text-[#111]">{Object.values(selectedEquip).flat().length}</span></div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(4)} className="flex-1 py-3.5 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#374151] hover:bg-[#F5F3EF] transition">Retour</button>
            <button onClick={() => {
              if (!validateStep(5)) return;
              setStep(6);
            }} className="flex-1 py-3.5 rounded-xl bg-[#111] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#333] transition">
              Publication <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 6: PUBLICATION
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 6 && !create.isSuccess && (
        <div className="px-4 mt-5 space-y-4">
          {/* IA Verification */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 text-center">
            <Bot size={32} className="mx-auto text-[#D4AF37]" />
            <h3 className="text-base font-bold text-[#111] mt-2">Verification IA en cours</h3>
            <p className="text-xs text-[#6B7280] mt-1">Analyse automatique de votre annonce</p>
            <div className="mt-4 space-y-2 text-left">
              {[
                ["Coherence du prix par rapport au marche", true],
                ["Qualite des photos", true],
                ["Verification doublons", true],
                ["Detection tentatives de fraude", true],
                ["Score qualite global", true],
              ].map(([s]) => (
                <div key={s as string} className="flex items-center gap-3 text-sm py-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium text-[#111] flex-1">{s as string}</span>
                  <Check size={14} className="text-green-500" />
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-3">
              <p className="text-sm font-bold text-green-700">Score qualite : 85/100</p>
              <p className="text-[10px] text-green-600 mt-0.5">Votre annonce est bien complete !</p>
            </div>
          </div>

          {/* Final summary */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 space-y-3">
            <p className="text-sm font-bold text-[#111]">Resume final</p>
            <p className="text-base font-black text-[#111]">{form.marque} {form.modele} {form.motorisation} {form.version && `— ${form.version}`}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {form.annee && <div className="flex items-center gap-1.5"><Calendar size={12} className="text-[#9CA3AF]" /><span>{form.annee}</span></div>}
              {form.prix && <div className="flex items-center gap-1.5 font-bold text-[#D4AF37]"><span>{form.prix} EUR</span></div>}
              {form.kilometrage && <div className="flex items-center gap-1.5"><Gauge size={12} className="text-[#9CA3AF]" /><span>{form.kilometrage} km</span></div>}
              {form.energie && <div className="flex items-center gap-1.5"><Fuel size={12} className="text-[#9CA3AF]" /><span>{form.energie}</span></div>}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{Object.keys(photoUrls).length} photos</span>
              <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{Object.values(selectedEquip).flat().length} equipements</span>
              {videoUrls.length > 0 && <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{videoUrls.length} video(s)</span>}
            </div>
            {form.contactVille && <p className="text-xs text-[#6B7280] flex items-center gap-1"><MapPin size={12} /> {form.contactVille} {form.contactCodePostal}</p>}
          </div>

          <button
            onClick={handlePublish}
            disabled={create.isPending}
            className="w-full rounded-xl py-4 text-sm font-bold text-white bg-[#E53E3E] hover:bg-[#C53030] disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-lg shadow-red-200"
          >
            {create.isPending ? <><Loader2 size={16} className="animate-spin" /> Publication en cours...</> : <><Upload size={16} /> Publier mon annonce</>}
          </button>
          {create.error && <p className="text-xs text-red-600 font-semibold text-center">{create.error.message}</p>}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 6 (success): PUBLICATION REUSSIE
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 6 && create.isSuccess && (
        <div className="px-4 mt-5">
          <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center space-y-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-green-100">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-black text-green-800">Annonce publiee avec succes !</h3>
            <p className="text-sm text-green-700">Votre {isMoto ? "moto" : "vehicule"} est maintenant visible sur MKA.P-MS.</p>
            <div className="flex gap-2 justify-center">
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">VERIFIEE</span>
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">PUBLIEE</span>
              {(form.plaque || form.vin) && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">VENDEUR VERIFIE</span>}
            </div>
            <div className="flex gap-2 mt-4">
              <Link to="/acheter" className="flex-1 inline-block rounded-xl px-4 py-3.5 text-sm font-bold text-white text-center bg-[#111] hover:bg-[#333] transition">Voir mes annonces</Link>
              <button onClick={() => {
                setSelectedType(null); setStep(0); setPlaqueFound(false);
                setForm({ plaque: "", vin: "", marque: "", modele: "", annee: "", motorisation: "", version: "", finition: "", categorie: "", energie: "", categorieMoto: "", cylindree: "", cylindreeCcm: "", permis: "", kilometrage: "", prix: "", couleurExt: "", couleurInt: "", typePeinture: "", matiereSieges: "", portes: "", places: "", puissanceCv: "", puissanceFiscale: "", etat: "", reparations: "", boite: "", premierMain: "", nbProprietaires: "", paysOrigine: "FR", classeEnvironnementale: "", emissionsCo2: "", nbCles: "2", dateProchaineCT: "", description: "", pointsForts: "", contactNom: "", contactEmail: "", contactTelephone: "", contactVille: "", contactCodePostal: "" });
                setSelectedEquip({ exterieur: [], interieur: [], confort: [], securite: [], antivol: [], multimedia: [], autres: [] });
                setPhotoUrls({}); setVideoUrls([]);
              }} className="flex-1 rounded-xl border border-[#E5E7EB] px-4 py-3.5 text-sm font-bold text-[#374151] hover:bg-[#F5F3EF] transition">Nouvelle annonce</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] animate-in slide-in-from-bottom-4">
          <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-2xl flex items-center gap-2">
            <Check size={14} className="text-green-400 shrink-0" />
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
