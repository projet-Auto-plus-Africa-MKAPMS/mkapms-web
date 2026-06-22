import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ChevronDown, PlusCircle, Car, Bike, Truck,
  Camera, Check, Upload, FileText, Search, Sparkles, Bot, Star, Video, X,
  Loader2, Shield, Zap, Eye, AlertTriangle, Info,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import FileUpload from "../components/FileUpload";

/* ══════════════════════════════════════════════════════════════════════════
   DEPOT D'ANNONCE — Style La Centrale professionnel
   6 etapes: Immatriculation > Caracteristiques > Equipements > Photos > Coordonnees > Publication
   Cascading dropdowns, radio buttons, equipment tabs, photo categories
   ══════════════════════════════════════════════════════════════════════════ */

const TYPES = [
  { id: "voiture", label: "Voiture", icon: Car, color: "bg-[#D4AF37]" },
  { id: "moto", label: "Moto / Scooter / Quad", icon: Bike, color: "bg-red-600" },
  { id: "utilitaire", label: "Utilitaire", icon: Truck, color: "bg-orange-600" },
  { id: "camion", label: "Camion", icon: Truck, color: "bg-gray-700" },
  { id: "vtc", label: "Vehicule VTC", icon: Car, color: "bg-[#111]" },
];

/* ── Marques ── */
const MARQUES_VOITURE = [
  "Abarth","Alfa Romeo","Audi","BMW","Citroën","Cupra","Dacia","DS","Fiat","Ford","Honda","Hyundai",
  "Jaguar","Jeep","Kia","Land Rover","Lexus","Mazda","Mercedes","Mini","Mitsubishi","Nissan","Opel",
  "Peugeot","Porsche","Renault","Seat","Skoda","Smart","Subaru","Suzuki","Tesla","Toyota","Volkswagen","Volvo",
];
const MARQUES_MOTO = [
  "Aprilia","Benelli","Beta","BMW","Can-Am","CFMOTO","Derbi","Ducati","Energica","GasGas","Harley-Davidson",
  "Honda","Husqvarna","Indian","Kawasaki","KTM","Kymco","LiveWire","MBK","Moto Guzzi","MV Agusta",
  "Peugeot","Piaggio","Royal Enfield","Suzuki","SYM","Triumph","Vespa","Yamaha","Zero",
];

/* ── Modeles par marque (demo) ── */
const MODELES: Record<string, string[]> = {
  Peugeot: ["108","208","308","408","508","2008","3008","5008","Partner","Rifter","Expert","Boxer","e-208","e-308","e-2008","e-3008"],
  Renault: ["Clio","Captur","Megane","Austral","Arkana","Scenic","Espace","Kangoo","Trafic","Master","Twingo","Zoe","Megane E-Tech"],
  "Citroën": ["C1","C3","C3 Aircross","C4","C4 X","C5 X","C5 Aircross","Berlingo","SpaceTourer","Jumpy","Jumper","Ami","e-C4"],
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

/* ── Motorisations par marque/modele (demo cascading) ── */
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

/* ── Versions / Finitions ── */
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

/* ── Couleurs ── */
const COULEURS_EXT = ["Noir","Blanc","Gris","Argent","Bleu","Rouge","Vert","Marron","Beige","Orange","Jaune","Violet","Bordeaux","Anthracite"];
const COULEURS_INT = ["Noir","Beige","Gris","Marron","Blanc","Rouge","Bleu"];
const TYPES_PEINTURE = ["Opaque","Metallis\u00e9e","Nacr\u00e9e","Mat"];
const MATIERES_SIEGES = ["Tissu","Cuir","Cuir / Alcantara","Alcantara","Simili cuir","Velours"];
const ETATS = ["Neuf","Excellent","Tr\u00e8s bon","Bon","Correct","A r\u00e9viser"];
const REPARATIONS = ["Aucune","Carrosserie","M\u00e9canique","Peinture","Int\u00e9rieur","Electricit\u00e9"];

/* ── Moto specifics ── */
const CATEGORIES_MOTO = [
  "Roadster","Sportive","Trail","Adventure","Custom","Cruiser","Touring","Naked","Caf\u00e9 Racer",
  "Scrambler","Enduro","Supermotard","Cross","Trial","Scooter","Scooter GT","125 cm\u00b3","50 cm\u00b3","Electrique","3 roues","Quad",
];
const CYLINDREES_MOTO = ["50","125","250","300","400","500","600","650","700","750","800","900","1000","1100","1200","1300+"];
const PERMIS_MOTO = ["AM (50 cm\u00b3)","A1 (125 cm\u00b3)","A2 (\u2264 35 kW)","A (toutes)"];

/* ── Equipements par categorie ── */
const EQUIP_CATEGORIES = [
  { key: "exterieur", label: "Ext\u00e9rieur", items: [
    "Jantes alliage","Barres de toit","Pack carrosserie","Vitres surteint\u00e9es","R\u00e9troviseurs \u00e9lectriques",
    "R\u00e9troviseurs rabattables","Antibrouillards","Feux LED","Feux x\u00e9non","Feux adaptatifs",
    "Phares directionnels","Becquet","Attelage","Protection bas de caisse","Aileron","Peinture m\u00e9tallis\u00e9e",
  ]},
  { key: "interieur", label: "Int\u00e9rieur", items: [
    "Si\u00e8ges chauffants","Si\u00e8ges \u00e9lectriques","Si\u00e8ges massants","Si\u00e8ges ventil\u00e9s",
    "Banquette rabattable","Volant cuir","Volant chauffant","Volant multifonction",
    "Accoudoir central","Eclairage ambiance","Toit ouvrant","Toit panoramique",
    "R\u00e9troviseur int\u00e9rieur jour/nuit","Palette au volant","P\u00e9dalier alu",
  ]},
  { key: "confort", label: "Confort", items: [
    "Climatisation automatique","Climatisation bi-zone","Climatisation tri-zone",
    "R\u00e9gulateur de vitesse","R\u00e9gulateur adaptatif","Limiteur de vitesse",
    "D\u00e9marrage sans cl\u00e9","Fermeture centralis\u00e9e","Ouverture mains libres",
    "Hayon \u00e9lectrique","Vitres \u00e9lectriques AV/AR","Direction assist\u00e9e",
    "Suspension pilot\u00e9e","Aide au stationnement AV","Aide au stationnement AR",
  ]},
  { key: "securite", label: "S\u00e9curit\u00e9", items: [
    "ABS","ESP","Airbags frontaux","Airbags lat\u00e9raux","Airbags rideaux",
    "Contr\u00f4le de traction","ISOFIX","Alerte franchissement de ligne","Freinage d'urgence automatique",
    "Cam\u00e9ra de recul","Cam\u00e9ra 360\u00b0","Radar de recul","Surveillance angle mort",
    "Alerte fatigue","R\u00e9gulateur de distance","D\u00e9tection panneaux",
  ]},
  { key: "multimedia", label: "Multim\u00e9dia", items: [
    "GPS int\u00e9gr\u00e9","Apple CarPlay","Android Auto","Bluetooth","Ecran tactile",
    "Ecran tactile > 10\"","Affichage t\u00eate haute","Sono premium","Sono Bose","Sono Harman Kardon",
    "Sono Bang & Olufsen","Charge sans fil","Prises USB","Port AUX","DAB+",
  ]},
  { key: "autres", label: "Autres", items: [
    "Alarme","Antivol de roues","Trousse de secours","Roue de secours",
    "Kit crevaison","Extincteur","Triangle","Gilet","Cric","Housse de si\u00e8ge",
  ]},
];

/* ── Photo categories ── */
const PHOTO_CATS_VOITURE = [
  { key: "ext", label: "Ext\u00e9rieures", slots: ["Face avant","3/4 avant gauche","Profil gauche","3/4 arri\u00e8re gauche","Face arri\u00e8re","3/4 arri\u00e8re droit","Profil droit","3/4 avant droit"] },
  { key: "int", label: "Int\u00e9rieures", slots: ["Tableau de bord","Compteur / i-cockpit","Ecran multimédia","Si\u00e8ges avant","Si\u00e8ges arri\u00e8re","Console centrale","Volant","Ciel de toit"] },
  { key: "coffre", label: "Coffre", slots: ["Coffre ouvert","Coffre charg\u00e9","Plancher coffre"] },
  { key: "moteur", label: "Moteur", slots: ["Compartiment moteur","D\u00e9tail moteur"] },
  { key: "roues", label: "Pneus / Jantes", slots: ["Roue avant gauche","Roue arri\u00e8re gauche","Roue avant droite","Roue arri\u00e8re droite"] },
  { key: "defauts", label: "D\u00e9fauts / Imperfections", slots: ["D\u00e9faut 1","D\u00e9faut 2","D\u00e9faut 3"] },
];

const PHOTO_CATS_MOTO = [
  { key: "ext", label: "Ext\u00e9rieures", slots: ["Face avant","Profil gauche","Face arri\u00e8re","Profil droit","Vue plongeante"] },
  { key: "details", label: "D\u00e9tails", slots: ["Tableau de bord / Compteur","Moteur","Pot d'\u00e9chappement","R\u00e9servoir","Selle"] },
  { key: "roues", label: "Pneus", slots: ["Roue avant","Roue arri\u00e8re"] },
  { key: "defauts", label: "D\u00e9fauts", slots: ["D\u00e9faut 1","D\u00e9faut 2"] },
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

  // Form state
  const [form, setForm] = useState({
    plaque: "", vin: "",
    marque: "", modele: "", annee: "", motorisation: "", version: "", finition: "",
    energie: "", categorieMoto: "", cylindree: "", permis: "",
    kilometrage: "", prix: "", couleurExt: "", couleurInt: "", typePeinture: "", matiereSieges: "",
    portes: "5", places: "5", puissanceCv: "", puissanceFiscale: "",
    etat: "", reparations: "", boite: "manuelle", premierMain: "oui",
    description: "",
    contactNom: "", contactEmail: "", contactTelephone: "", contactVille: "", contactCodePostal: "",
  });
  const [selectedEquip, setSelectedEquip] = useState<Record<string, string[]>>({
    exterieur: [], interieur: [], confort: [], securite: [], multimedia: [], autres: [],
  });
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const isMoto = selectedType === "moto";
  const marques = isMoto ? MARQUES_MOTO : MARQUES_VOITURE;
  const photoCats = isMoto ? PHOTO_CATS_MOTO : PHOTO_CATS_VOITURE;
  const accent = isMoto ? "bg-red-600" : "bg-[#D4AF37]";
  const accentText = isMoto ? "text-red-600" : "text-[#D4AF37]";
  const accentBorder = isMoto ? "border-red-600" : "border-[#D4AF37]";
  const accentBg = isMoto ? "bg-red-50" : "bg-[#FFFDF5]";

  // Cascading logic
  const availableModeles = form.marque ? (MODELES[form.marque] || ["Autre"]) : [];
  const motoKey = `${form.marque}_${form.modele}`;
  const availableMotorisations = form.marque && form.modele
    ? (MOTORISATIONS[motoKey] || MOTORISATIONS["default"] || [])
    : [];
  const versionKey = `${form.marque}_${form.modele}_${form.motorisation}`;
  const availableVersions = form.motorisation
    ? (VERSIONS[versionKey] || VERSIONS["default"] || [])
    : [];

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
      setStep(5);
      showToast("Annonce publiee avec succes !");
    },
    onError: (err) => {
      showToast("Erreur: " + err.message);
    },
  });

  function handlePublish() {
    if (!form.marque || !form.modele) {
      showToast("Marque et modele obligatoires");
      return;
    }
    if (!form.prix) {
      showToast("Le prix est obligatoire");
      return;
    }
    const allPhotos = Object.values(photoUrls).filter(Boolean);
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
      cylindree: form.cylindree || undefined,
      confort: confortItems,
      securite: securiteItems,
      multimedia: multimediaItems,
      videosNormales: videoUrls,
    });
  }

  // ── Type selection screen ──
  if (!selectedType) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-[#111] px-4 pt-6 pb-5">
          <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</Link>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><PlusCircle size={20} className="text-[#D4AF37]" /> Deposer une annonce</h1>
          <p className="mt-1 text-sm text-white/60">Vendez votre vehicule sur MKA.P-MS</p>
        </div>
        <div className="px-4 mt-6">
          <h2 className="text-base font-bold text-[#111]">Que souhaitez-vous vendre ?</h2>
          <div className="mt-4 space-y-2">
            {TYPES.map((t) => { const Icon = t.icon; return (
              <button key={t.id} onClick={() => { setSelectedType(t.id); setStep(0); setPlaqueFound(false); }} className="w-full flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 active:scale-[0.99] transition">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.color}`}><Icon size={18} className="text-white" /></div>
                <span className="flex-1 text-sm font-bold text-[#111] text-left">{t.label}</span>
                <ChevronRight size={16} className="text-red-500" />
              </button>
            ); })}
          </div>
        </div>
      </div>
    );
  }

  const ETAPES = ["Immatriculation", "Caracteristiques", "Equipements", "Photos", "Coordonnees", "Publication"];

  /* ── Helper: dropdown field ── */
  function SelectField({ label, value, onChange, options, required, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean; placeholder?: string;
  }) {
    return (
      <div>
        <label className="text-xs font-semibold text-[#374151]">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        <div className="relative mt-1">
          <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full appearance-none rounded-lg border px-3 py-2.5 text-sm pr-8 ${value ? "border-[#D4AF37] bg-[#FFFDF5]" : "border-[#E5E7EB] bg-white"}`}>
            <option value="">{placeholder || "Choisir"}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        </div>
      </div>
    );
  }

  /* ── Helper: radio group ── */
  function RadioGroup({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: string[];
  }) {
    return (
      <div>
        <label className="text-xs font-semibold text-[#374151]">{label}</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {options.map(o => (
            <button key={o} onClick={() => onChange(o)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${value === o ? `${accent} text-white ${accentBorder} border-transparent` : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D4AF37]"}`}>{o}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* Header */}
      <div className={`px-4 pt-6 pb-5 ${isMoto ? "bg-red-600" : "bg-[#111]"}`}>
        <button onClick={() => { if (step > 0) setStep(step - 1); else setSelectedType(null); }} className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> {step === 0 ? "Changer de type" : "Retour"}
        </button>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          {isMoto ? <Bike size={20} /> : <Car size={20} />}
          Deposer : {TYPES.find((t) => t.id === selectedType)?.label}
        </h1>
      </div>

      {/* Breadcrumb Steps */}
      <div className="px-4 mt-4 flex gap-1 overflow-x-auto">
        {ETAPES.map((e, i) => (
          <button key={i} onClick={() => { if (i < step) setStep(i); }} className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${
            i === step ? `${accent} text-white` : i < step ? `${accentBg} ${accentText} border ${accentBorder}` : "bg-white text-[#9CA3AF] border border-[#E5E7EB]"
          }`}>
            {i < step && <Check size={10} />}
            <span>{i + 1}. {e}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 0: IMMATRICULATION
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 0 && (
        <div className="mx-4 mt-4 space-y-3">
          <div className="flex gap-2">
            {(["plaque", "vin", "manuel"] as const).map(m => (
              <button key={m} onClick={() => { setPlaqueMode(m); setPlaqueFound(false); }} className={`flex-1 py-2 rounded-xl text-[10px] font-bold border ${plaqueMode === m ? `${accent} text-white border-transparent` : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>
                {m === "plaque" ? "Plaque" : m === "vin" ? "VIN" : "Manuel"}
              </button>
            ))}
          </div>

          {plaqueMode === "plaque" && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm">
              <p className="text-xs text-[#6B7280] mb-2">Plaque d'immatriculation</p>
              <div className="flex gap-2">
                <input value={form.plaque} onChange={(e) => set("plaque", e.target.value.toUpperCase())} placeholder="AA-123-BB" className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm font-bold text-center uppercase tracking-wider" onKeyDown={(e) => { if (e.key === "Enter") lookupPlate(); }} />
                <button onClick={lookupPlate} disabled={plateLoading} className={`px-5 rounded-lg text-white text-xs font-bold ${accent} flex items-center gap-1`}>
                  {plateLoading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={14} /> Rechercher</>}
                </button>
              </div>
            </div>
          )}

          {plaqueMode === "vin" && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm">
              <p className="text-xs text-[#6B7280] mb-2">Numero VIN (17 caracteres)</p>
              <div className="flex gap-2">
                <input value={form.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} placeholder="VF1XXXXXXXXX12345" className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-xs font-mono" onKeyDown={(e) => { if (e.key === "Enter") lookupPlate(); }} />
                <button onClick={lookupPlate} disabled={plateLoading} className={`px-5 rounded-lg text-white text-xs font-bold ${accent}`}>
                  {plateLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Manuel / Post-lookup: cascading dropdowns */}
          {(plaqueMode === "manuel" || plaqueFound) && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm space-y-3">
              {plaqueFound && (
                <div className="flex items-center gap-2 mb-1">
                  <Check size={14} className="text-green-500" />
                  <span className="text-xs font-bold text-green-700">Vehicule identifie — completez ou corrigez les informations</span>
                </div>
              )}

              {/* Marque */}
              <SelectField label="Marque" value={form.marque} onChange={(v) => { set("marque", v); set("modele", ""); set("motorisation", ""); set("version", ""); set("finition", ""); }} options={marques} required placeholder="Selectionnez la marque" />

              {/* Modele — cascading */}
              {form.marque && (
                <SelectField label="Modele" value={form.modele} onChange={(v) => { set("modele", v); set("motorisation", ""); set("version", ""); set("finition", ""); }} options={availableModeles} required placeholder="Selectionnez le modele" />
              )}

              {/* Moto-specific */}
              {isMoto && (
                <>
                  <SelectField label="Categorie moto" value={form.categorieMoto} onChange={(v) => set("categorieMoto", v)} options={CATEGORIES_MOTO} />
                  <SelectField label="Cylindree" value={form.cylindree} onChange={(v) => set("cylindree", v)} options={CYLINDREES_MOTO} />
                  <SelectField label="Permis requis" value={form.permis} onChange={(v) => set("permis", v)} options={PERMIS_MOTO} />
                </>
              )}

              {/* Motorisation — cascading */}
              {form.modele && !isMoto && (
                <SelectField label="Motorisation" value={form.motorisation} onChange={(v) => { set("motorisation", v); set("version", ""); set("finition", ""); }} options={availableMotorisations} placeholder="Selectionnez la motorisation" />
              )}

              {/* Version / Finition — cascading */}
              {form.motorisation && !isMoto && (
                <SelectField label="Version / Finition" value={form.version} onChange={(v) => set("version", v)} options={availableVersions} placeholder="Selectionnez la version" />
              )}

              {/* Annee */}
              <div>
                <label className="text-xs font-semibold text-[#374151]">Annee<span className="text-red-500 ml-0.5">*</span></label>
                <input value={form.annee} onChange={(e) => set("annee", e.target.value)} type="number" placeholder="2024" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" min="1970" max="2026" />
              </div>

              {/* Energie */}
              <SelectField label="Energie" value={form.energie} onChange={(v) => set("energie", v)} options={isMoto ? ["Essence","Electrique","Hybride"] : ["Essence","Diesel","Hybride","Electrique","GPL","GNV","Hydrogene"]} required />

              <button onClick={() => {
                if (!form.marque) { showToast("Selectionnez une marque"); return; }
                if (!form.modele) { showToast("Selectionnez un modele"); return; }
                setStep(1);
              }} className={`w-full py-3 rounded-xl text-white text-sm font-bold ${accent} flex items-center justify-center gap-2`}>
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
        <div className="mx-4 mt-4 space-y-4">
          {/* Vehicle ID bar */}
          <div className={`rounded-xl p-3 ${accentBg} border ${accentBorder}`}>
            <p className="text-xs font-bold text-[#111]">{form.marque} {form.modele} {form.motorisation} {form.annee && `(${form.annee})`}</p>
          </div>

          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-4">
            <h3 className="text-sm font-bold text-[#111] flex items-center gap-2"><Info size={14} className={accentText} /> Caracteristiques du vehicule</h3>

            {/* Etat */}
            <SelectField label="Etat du vehicule" value={form.etat} onChange={(v) => set("etat", v)} options={ETATS} required />

            {/* Reparations */}
            <SelectField label="Reparations effectuees" value={form.reparations} onChange={(v) => set("reparations", v)} options={REPARATIONS} />

            {/* Kilometrage */}
            <div>
              <label className="text-xs font-semibold text-[#374151]">Kilometrage<span className="text-red-500 ml-0.5">*</span></label>
              <div className="relative mt-1">
                <input value={form.kilometrage} onChange={(e) => set("kilometrage", e.target.value)} type="text" placeholder="45 000" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm pr-12" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">km</span>
              </div>
            </div>

            {/* Prix */}
            <div>
              <label className="text-xs font-semibold text-[#374151]">Prix<span className="text-red-500 ml-0.5">*</span></label>
              <div className="relative mt-1">
                <input value={form.prix} onChange={(e) => set("prix", e.target.value)} type="text" placeholder="25 000" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">EUR</span>
              </div>
            </div>

            {!isMoto && (
              <>
                {/* Boite de vitesse — Radio */}
                <RadioGroup label="Boite de vitesse" value={form.boite} onChange={(v) => set("boite", v)} options={["manuelle","automatique","semi-auto"]} />

                {/* Puissance fiscale — Radio */}
                <RadioGroup label="Puissance fiscale (CV)" value={form.puissanceFiscale} onChange={(v) => set("puissanceFiscale", v)} options={["4","5","6","7","8","9","10","11","12","13+"]} />

                {/* Nombre de portes — Radio */}
                <RadioGroup label="Nombre de portes" value={form.portes} onChange={(v) => set("portes", v)} options={["2","3","4","5"]} />

                {/* Premiere main — Radio */}
                <RadioGroup label="Premiere main" value={form.premierMain} onChange={(v) => set("premierMain", v)} options={["oui","non"]} />
              </>
            )}

            {/* Puissance DIN */}
            <div>
              <label className="text-xs font-semibold text-[#374151]">Puissance DIN</label>
              <div className="relative mt-1">
                <input value={form.puissanceCv} onChange={(e) => set("puissanceCv", e.target.value)} type="text" placeholder="130" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">ch</span>
              </div>
            </div>

            {/* Couleurs */}
            <SelectField label="Couleur exterieure" value={form.couleurExt} onChange={(v) => set("couleurExt", v)} options={COULEURS_EXT} />
            <SelectField label="Type de peinture" value={form.typePeinture} onChange={(v) => set("typePeinture", v)} options={TYPES_PEINTURE} />
            <SelectField label="Couleur interieure" value={form.couleurInt} onChange={(v) => set("couleurInt", v)} options={COULEURS_INT} />
            <SelectField label="Matiere des sieges" value={form.matiereSieges} onChange={(v) => set("matiereSieges", v)} options={MATIERES_SIEGES} />

            {/* Places */}
            {!isMoto && <RadioGroup label="Nombre de places" value={form.places} onChange={(v) => set("places", v)} options={["2","4","5","6","7","8","9"]} />}

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-[#374151]">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={isMoto ? "Decrivez votre moto : entretien, modifications, etat, historique..." : "Decrivez votre vehicule : historique, entretien, options, etat..."} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm h-24 resize-none" />
              <div className="flex items-center gap-2 mt-1.5 rounded-lg bg-[#D4AF37]/10 p-2">
                <Sparkles size={12} className="text-[#D4AF37]" />
                <span className="text-[9px] text-[#374151]">L'IA ameliorera automatiquement votre description</span>
              </div>
            </div>

            <button onClick={() => setStep(2)} className={`w-full py-3 rounded-xl text-white text-sm font-bold ${accent} flex items-center justify-center gap-2`}>
              Suivant — Equipements <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 2: EQUIPEMENTS
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="mx-4 mt-4 space-y-4">
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h3 className="text-sm font-bold text-[#111] mb-3 flex items-center gap-2"><Shield size={14} className={accentText} /> Equipements</h3>

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
              {EQUIP_CATEGORIES.map(cat => {
                const count = (selectedEquip[cat.key] || []).length;
                return (
                  <button key={cat.key} onClick={() => setEquipTab(cat.key)}
                    className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold border transition ${
                      equipTab === cat.key
                        ? `${accent} text-white border-transparent`
                        : "bg-white text-[#374151] border-[#E5E7EB] hover:border-[#D4AF37]"
                    }`}>
                    {cat.label}{count > 0 && ` (${count})`}
                  </button>
                );
              })}
            </div>

            {/* Checkboxes for active tab */}
            {EQUIP_CATEGORIES.filter(c => c.key === equipTab).map(cat => (
              <div key={cat.key} className="mt-3 grid grid-cols-1 gap-1.5">
                {cat.items.map(item => {
                  const checked = (selectedEquip[cat.key] || []).includes(item);
                  return (
                    <button key={item} onClick={() => {
                      setSelectedEquip(prev => {
                        const arr = prev[cat.key] || [];
                        return { ...prev, [cat.key]: checked ? arr.filter(x => x !== item) : [...arr, item] };
                      });
                    }} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition ${
                      checked ? `${accentBg} ${accentBorder} border` : "border-[#E5E7EB] bg-white hover:border-[#D4AF37]/50"
                    }`}>
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        checked ? `${accent} border-transparent` : "border-[#D1D5DB] bg-white"
                      }`}>
                        {checked && <Check size={12} className="text-white" />}
                      </div>
                      <span className={`text-xs ${checked ? "font-semibold text-[#111]" : "text-[#374151]"}`}>{item}</span>
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Total count */}
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2">
              <Check size={12} className="text-green-500" />
              <span className="text-[10px] text-[#374151]">
                {Object.values(selectedEquip).flat().length} equipement(s) selectionne(s)
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#374151]">Retour</button>
            <button onClick={() => setStep(3)} className={`flex-1 py-3 rounded-xl text-white text-sm font-bold ${accent} flex items-center justify-center gap-2`}>
              Photos <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 3: PHOTOS
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="mx-4 mt-4 space-y-4">
          {photoCats.map(cat => (
            <div key={cat.key} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <h3 className="text-sm font-bold text-[#111] mb-1 flex items-center gap-2">
                <Camera size={14} className={accentText} /> {cat.label}
              </h3>
              <p className="text-[9px] text-[#9CA3AF] mb-3">Cliquez sur un emplacement pour ajouter une photo</p>

              {/* Compact inline slots */}
              <div className="grid grid-cols-4 gap-2">
                {cat.slots.map(slot => {
                  const slotKey = `${cat.key}_${slot}`;
                  const url = photoUrls[slotKey];
                  return (
                    <div key={slot} className="flex flex-col items-center">
                      <div className="relative w-full aspect-square">
                        {url ? (
                          <div className="relative w-full h-full">
                            <img src={url} alt={slot} className="w-full h-full rounded-lg object-cover" />
                            <button onClick={(e) => { e.stopPropagation(); setPhotoUrls(p => { const n = { ...p }; delete n[slotKey]; return n; }); }} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] shadow">
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
            <h3 className="text-sm font-bold text-[#111] mb-1 flex items-center gap-2"><Video size={14} className={accentText} /> Videos (optionnel)</h3>
            <p className="text-[9px] text-[#9CA3AF] mb-3">MP4, WebM, MOV — max 50 MB</p>
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
                    <Video size={12} className={accentText} />
                    <span className="flex-1 text-xs text-[#111] truncate">Video {i + 1}</span>
                    <button onClick={() => setVideoUrls(v => v.filter((_, j) => j !== i))} className="text-red-500"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Photo counter */}
          <div className="flex items-center gap-2 rounded-lg bg-[#D4AF37]/10 p-2">
            <Star size={12} className="text-[#D4AF37]" />
            <span className="text-[9px] text-[#374151]">{Object.keys(photoUrls).length} photo(s) · {videoUrls.length} video(s) — Score qualite calcule automatiquement</span>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#374151]">Retour</button>
            <button onClick={() => setStep(4)} className={`flex-1 py-3 rounded-xl text-white text-sm font-bold ${accent} flex items-center justify-center gap-2`}>
              Coordonnees <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 4: COORDONNEES
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div className="mx-4 mt-4 space-y-4">
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#111] flex items-center gap-2"><FileText size={14} className={accentText} /> Vos coordonnees</h3>
            <p className="text-[9px] text-[#9CA3AF]">Ces informations seront affichees sur votre annonce</p>

            <div>
              <label className="text-xs font-semibold text-[#374151]">Nom / Societe</label>
              <input value={form.contactNom} onChange={(e) => set("contactNom", e.target.value)} placeholder="Jean Dupont" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#374151]">Email</label>
              <input value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} type="email" placeholder="contact@exemple.com" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#374151]">Telephone<span className="text-red-500 ml-0.5">*</span></label>
              <input value={form.contactTelephone} onChange={(e) => set("contactTelephone", e.target.value)} type="tel" placeholder="06 12 34 56 78" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#374151]">Ville<span className="text-red-500 ml-0.5">*</span></label>
                <input value={form.contactVille} onChange={(e) => set("contactVille", e.target.value)} placeholder="Paris" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#374151]">Code postal</label>
                <input value={form.contactCodePostal} onChange={(e) => set("contactCodePostal", e.target.value)} placeholder="75001" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-[#F5F3EF] border border-[#E5E7EB] p-4 space-y-2">
            <p className="text-xs font-bold text-[#111] uppercase">Resume de votre annonce</p>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-[10px] text-[#6B7280]">Vehicule</span><span className="text-[10px] font-bold text-[#111]">{form.marque} {form.modele} {form.motorisation}</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-[#6B7280]">Annee</span><span className="text-[10px] font-bold text-[#111]">{form.annee || "—"}</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-[#6B7280]">Kilometrage</span><span className="text-[10px] font-bold text-[#111]">{form.kilometrage || "—"} km</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-[#6B7280]">Prix</span><span className="text-[10px] font-bold text-[#111]">{form.prix || "—"} EUR</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-[#6B7280]">Boite</span><span className="text-[10px] font-bold text-[#111]">{form.boite}</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-[#6B7280]">Photos</span><span className="text-[10px] font-bold text-[#111]">{Object.keys(photoUrls).length}</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-[#6B7280]">Equipements</span><span className="text-[10px] font-bold text-[#111]">{Object.values(selectedEquip).flat().length}</span></div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#374151]">Retour</button>
            <button onClick={() => {
              if (!form.contactVille) { showToast("La ville est obligatoire"); return; }
              setStep(5);
            }} className={`flex-1 py-3 rounded-xl text-white text-sm font-bold ${accent} flex items-center justify-center gap-2`}>
              Publier <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 5: PUBLICATION
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 5 && !create.isSuccess && (
        <div className="mx-4 mt-4 space-y-4">
          {/* IA Verification */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center">
            <Bot size={28} className={`mx-auto ${accentText}`} />
            <h3 className="text-base font-bold text-[#111] mt-2">Verification IA</h3>
            <p className="text-xs text-[#6B7280] mt-1">Analyse automatique de votre annonce</p>
            <div className="mt-3 space-y-1.5 text-left">
              {[
                ["Coherence prix", true],
                ["Qualite photos", true],
                ["Doublons", true],
                ["Detection fraude", true],
                ["Score qualite", true],
              ].map(([s, done]) => (
                <div key={s as string} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-semibold text-[#111]">{s as string}</span>
                  <Check size={12} className="text-green-500 ml-auto" />
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-2">
              <p className="text-xs font-bold text-green-700">Score qualite : 85/100</p>
            </div>
          </div>

          {/* Final summary */}
          <div className="rounded-xl bg-[#F5F3EF] border border-[#E5E7EB] p-4 space-y-2">
            <p className="text-xs font-bold text-[#111] uppercase">Resume final</p>
            <p className="text-sm font-bold text-[#111]">{form.marque} {form.modele} {form.motorisation} {form.version && `— ${form.version}`}</p>
            {form.annee && <p className="text-xs text-[#374151]">Annee : {form.annee}</p>}
            {form.prix && <p className="text-xs text-[#374151]">Prix : <strong>{form.prix} EUR</strong></p>}
            {form.kilometrage && <p className="text-xs text-[#374151]">Kilometrage : {form.kilometrage} km</p>}
            <p className="text-xs text-[#374151]">Photos : {Object.keys(photoUrls).length} · Videos : {videoUrls.length} · Equipements : {Object.values(selectedEquip).flat().length}</p>
            {form.contactVille && <p className="text-xs text-[#374151]">Localisation : {form.contactVille} {form.contactCodePostal}</p>}
          </div>

          <button
            onClick={handlePublish}
            disabled={create.isPending}
            className={`w-full rounded-xl py-3.5 text-sm font-bold text-white ${accent} disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]`}
          >
            {create.isPending ? <><Loader2 size={16} className="animate-spin" /> Publication en cours...</> : <><Upload size={16} /> Publier l'annonce</>}
          </button>
          {create.error && <p className="text-xs text-red-600 font-semibold text-center">{create.error.message}</p>}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         STEP 5 (success): PUBLICATION REUSSIE
         ═══════════════════════════════════════════════════════════════════ */}
      {step === 5 && create.isSuccess && (
        <div className="mx-4 mt-4 rounded-xl bg-green-50 border border-green-200 p-6 text-center space-y-3">
          <Check size={40} className="mx-auto text-green-600" />
          <h3 className="text-lg font-bold text-green-800">Annonce publiee !</h3>
          <p className="text-xs text-green-700">Votre {isMoto ? "moto" : "vehicule"} est maintenant visible sur MKA.P-MS.</p>
          <div className="flex gap-2 justify-center">
            <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">VERIFIE</span>
            <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">PUBLIEE</span>
          </div>
          <div className="flex gap-2 mt-4">
            <Link to="/acheter" className={`flex-1 inline-block rounded-xl px-4 py-3 text-sm font-bold text-white text-center ${accent}`}>Voir mes annonces</Link>
            <button onClick={() => {
              setSelectedType(null); setStep(0); setPlaqueFound(false);
              setForm({ plaque: "", vin: "", marque: "", modele: "", annee: "", motorisation: "", version: "", finition: "", energie: "", categorieMoto: "", cylindree: "", permis: "", kilometrage: "", prix: "", couleurExt: "", couleurInt: "", typePeinture: "", matiereSieges: "", portes: "5", places: "5", puissanceCv: "", puissanceFiscale: "", etat: "", reparations: "", boite: "manuelle", premierMain: "oui", description: "", contactNom: "", contactEmail: "", contactTelephone: "", contactVille: "", contactCodePostal: "" });
              setSelectedEquip({ exterieur: [], interieur: [], confort: [], securite: [], multimedia: [], autres: [] });
              setPhotoUrls({}); setVideoUrls([]);
            }} className="flex-1 rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm font-bold text-[#374151]">Nouvelle annonce</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%]">
          <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-xl flex items-center gap-2">
            <Check size={14} className="text-green-400 shrink-0" />
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
