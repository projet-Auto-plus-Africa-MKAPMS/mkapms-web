import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Crown, Globe, Building2, Wrench, Users, TrendingUp,
  TrendingDown, Euro, CreditCard, Target, Award, ChevronDown,
  Download, CheckCircle, X, Eye, Bell, BarChart3, Zap, Car, Key,
  Gavel, Megaphone, FileText, Shield, Clock, AlertTriangle,
  MapPin, Phone, Mail, Briefcase, Settings, Brain, Landmark,
  Truck, Fuel, Bolt, PieChart, Activity, UserCheck,
  Cog, Link2, Server, Lock, UserCircle, HardDrive, Search,
  RefreshCw, Database,
  FolderOpen, Archive, Lightbulb, Layout,
  Rocket, Handshake, DollarSign, Bookmark, Globe2, Smartphone,
  GraduationCap, MessageSquare, ClipboardCheck, Scale, BookOpen, Hash,
  Leaf, Star, FileCheck, ShieldCheck, LineChart, Heart,
  Gift, Cpu, Palette, Gauge,
  Plug, ShoppingCart, PackageOpen, Factory, Banknote,
  Umbrella, Navigation, Building, Code2, Monitor, Wifi, HardDriveDownload,
  Radar, Compass
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   CENTRE DE PILOTAGE GROUPE MKA.P-MS
   Reserve PDG & Direction Generale — Vue globale de tout l'ecosysteme
   18 sections + Module Conseil d'Administration
   ══════════════════════════════════════════════════════════════════════════ */

type MainTab = "accueil" | "performance" | "pays" | "agences" | "franchises" |
  "employes" | "financier" | "abonnements" | "commercial" | "marketing" |
  "electric" | "finance_plus" | "encheres" | "garage" | "carrosserie" |
  "alertes" | "journal" | "ia" | "parametres" | "conseil" |
  "automatisation" | "api" | "surveillance" | "securite" | "clients" |
  "professionnels" | "documents" | "sauvegarde" | "analyse_strat" |
  "croissance" | "executif" | "innovation" |
  "rd" | "centre_innovation" | "investisseurs" | "partenariats" | "marques" |
  "propriete_ip" | "expansion" | "applications" | "domaines" | "licences" |
  "formation" | "communication" | "audits" | "gouvernance" |
  "esg" | "qualite" | "conformite" | "continuite" | "observation" |
  "experience" | "rewards" | "ia_centre" | "personnalisation" | "indicateurs" |
  "connecteurs" | "marketplaces" | "fournisseurs" | "constructeurs" |
  "partenaires_fin" | "assurances" | "transporteurs" | "administrations" |
  "api_internes" | "developpeurs" | "apps_connectees" | "objets_connectes" |
  "donnees" | "supervision" | "vision";

interface KPI { label: string; value: string; color: string; icon: typeof Euro; path?: string; }

const TABS: { id: MainTab; label: string; icon: typeof Crown }[] = [
  { id: "accueil", label: "Accueil", icon: Crown },
  { id: "performance", label: "Performance", icon: BarChart3 },
  { id: "pays", label: "Pays", icon: Globe },
  { id: "agences", label: "Agences", icon: Building2 },
  { id: "franchises", label: "Franchises", icon: Landmark },
  { id: "employes", label: "Employes", icon: Users },
  { id: "financier", label: "Financier", icon: Euro },
  { id: "abonnements", label: "Abonnements", icon: CreditCard },
  { id: "commercial", label: "Commercial", icon: Car },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "electric", label: "Electric+", icon: Bolt },
  { id: "finance_plus", label: "Finance+", icon: PieChart },
  { id: "encheres", label: "Encheres", icon: Gavel },
  { id: "garage", label: "Garage+", icon: Wrench },
  { id: "carrosserie", label: "Carrosserie", icon: Wrench },
  { id: "alertes", label: "Alertes", icon: Bell },
  { id: "journal", label: "Journal", icon: Clock },
  { id: "ia", label: "IA MKA", icon: Brain },
  { id: "parametres", label: "Parametres", icon: Settings },
  { id: "conseil", label: "Conseil d'Admin", icon: Shield },
  { id: "automatisation", label: "Automatisation", icon: Cog },
  { id: "api", label: "API & Integrations", icon: Link2 },
  { id: "surveillance", label: "Surveillance", icon: Server },
  { id: "securite", label: "Securite", icon: Lock },
  { id: "clients", label: "Clients", icon: UserCircle },
  { id: "professionnels", label: "Professionnels", icon: Briefcase },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "sauvegarde", label: "Sauvegarde", icon: HardDrive },
  { id: "analyse_strat", label: "Analyse Strat.", icon: PieChart },
  { id: "croissance", label: "Croissance", icon: Globe },
  { id: "executif", label: "Tableau Executif", icon: Layout },
  { id: "innovation", label: "Innovation & R&D", icon: Lightbulb },
  { id: "rd", label: "Centre R&D", icon: Rocket },
  { id: "centre_innovation", label: "Centre Innovation", icon: Lightbulb },
  { id: "investisseurs", label: "Investisseurs", icon: DollarSign },
  { id: "partenariats", label: "Partenariats", icon: Handshake },
  { id: "marques", label: "Marques", icon: Bookmark },
  { id: "propriete_ip", label: "Propriete IP", icon: Shield },
  { id: "expansion", label: "Expansion", icon: Globe2 },
  { id: "applications", label: "Applications", icon: Smartphone },
  { id: "domaines", label: "Domaines", icon: Globe },
  { id: "licences", label: "Licences", icon: Key },
  { id: "formation", label: "Formation", icon: GraduationCap },
  { id: "communication", label: "Communication", icon: MessageSquare },
  { id: "audits", label: "Audits", icon: ClipboardCheck },
  { id: "gouvernance", label: "Gouvernance", icon: Scale },
  { id: "esg", label: "ESG & Durable", icon: Leaf },
  { id: "qualite", label: "Qualite", icon: Star },
  { id: "conformite", label: "Conformite", icon: FileCheck },
  { id: "continuite", label: "Continuite", icon: ShieldCheck },
  { id: "observation", label: "Observation Marche", icon: LineChart },
  { id: "experience", label: "Experience Client", icon: Heart },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "ia_centre", label: "IA MKA Centre", icon: Cpu },
  { id: "personnalisation", label: "Personnalisation", icon: Palette },
  { id: "indicateurs", label: "Indicateurs Exec.", icon: Gauge },
  { id: "connecteurs", label: "Connecteurs", icon: Plug },
  { id: "marketplaces", label: "Marketplaces", icon: ShoppingCart },
  { id: "fournisseurs", label: "Fournisseurs", icon: PackageOpen },
  { id: "constructeurs", label: "Constructeurs", icon: Factory },
  { id: "partenaires_fin", label: "Partenaires Fin.", icon: Banknote },
  { id: "assurances", label: "Assurances", icon: Umbrella },
  { id: "transporteurs", label: "Transporteurs", icon: Navigation },
  { id: "administrations", label: "Administrations", icon: Building },
  { id: "api_internes", label: "API Internes", icon: Code2 },
  { id: "developpeurs", label: "Developpeurs", icon: Code2 },
  { id: "apps_connectees", label: "Apps Connectees", icon: Monitor },
  { id: "objets_connectes", label: "Objets Connectes", icon: Wifi },
  { id: "donnees", label: "Donnees", icon: HardDriveDownload },
  { id: "supervision", label: "Supervision", icon: Radar },
  { id: "vision", label: "Vision MKA", icon: Compass },
];

/* ---------- static data ---------- */
const PERF_UNIVERS = [
  { univers: "Vente", icon: Car, ca: "142 500", transactions: 47, croissance: "+8.2%", up: true, objectif: "160 000", marge: "18%", rentabilite: "92%" },
  { univers: "Location", icon: Key, ca: "68 200", transactions: 156, croissance: "+15.1%", up: true, objectif: "70 000", marge: "35%", rentabilite: "97%" },
  { univers: "Garage", icon: Wrench, ca: "34 800", transactions: 89, croissance: "+22.3%", up: true, objectif: "40 000", marge: "42%", rentabilite: "88%" },
  { univers: "Carrosserie", icon: Wrench, ca: "18 900", transactions: 45, croissance: "+12.5%", up: true, objectif: "22 000", marge: "38%", rentabilite: "85%" },
  { univers: "Pieces auto", icon: Settings, ca: "24 600", transactions: 156, croissance: "+30.5%", up: true, objectif: "25 000", marge: "25%", rentabilite: "90%" },
  { univers: "Depannage", icon: Truck, ca: "8 900", transactions: 28, croissance: "+11.4%", up: true, objectif: "12 000", marge: "45%", rentabilite: "82%" },
  { univers: "Livraison", icon: Truck, ca: "6 200", transactions: 34, croissance: "+18.9%", up: true, objectif: "10 000", marge: "30%", rentabilite: "78%" },
  { univers: "Encheres Pro", icon: Gavel, ca: "28 950", transactions: 12, croissance: "+5.7%", up: true, objectif: "35 000", marge: "15%", rentabilite: "95%" },
  { univers: "Finance+", icon: PieChart, ca: "15 800", transactions: 22, croissance: "+25.3%", up: true, objectif: "20 000", marge: "60%", rentabilite: "88%" },
  { univers: "Electric+", icon: Bolt, ca: "9 400", transactions: 180, croissance: "+45.2%", up: true, objectif: "15 000", marge: "55%", rentabilite: "75%" },
  { univers: "Publicites", icon: Megaphone, ca: "13 000", transactions: 34, croissance: "-3.2%", up: false, objectif: "15 000", marge: "85%", rentabilite: "92%" },
  { univers: "Abonnements", icon: CreditCard, ca: "18 500", transactions: 241, croissance: "+19.8%", up: true, objectif: "22 000", marge: "90%", rentabilite: "98%" },
];

const PAYS_DATA = [
  { pays: "France", ca: 287450, clients: 12500, garages: 12, pros: 450, employes: 28, franchises: 1, pct: "+12.4%", up: true, statut: "actif" },
  { pays: "Cote d'Ivoire", ca: 85200, clients: 4200, garages: 8, pros: 230, employes: 15, franchises: 1, pct: "+28.1%", up: true, statut: "actif" },
  { pays: "Senegal", ca: 62300, clients: 3100, garages: 5, pros: 175, employes: 10, franchises: 0, pct: "+15.6%", up: true, statut: "actif" },
  { pays: "Maroc", ca: 54800, clients: 2800, garages: 4, pros: 140, employes: 8, franchises: 0, pct: "+8.3%", up: true, statut: "actif" },
  { pays: "Cameroun", ca: 38500, clients: 1900, garages: 3, pros: 95, employes: 6, franchises: 0, pct: "-2.1%", up: false, statut: "actif" },
  { pays: "Belgique", ca: 28900, clients: 1400, garages: 2, pros: 65, employes: 4, franchises: 0, pct: "+5.9%", up: true, statut: "actif" },
  { pays: "Mali", ca: 18200, clients: 800, garages: 2, pros: 42, employes: 3, franchises: 0, pct: "+35.2%", up: true, statut: "actif" },
  { pays: "Guinee", ca: 12800, clients: 550, garages: 1, pros: 28, employes: 2, franchises: 0, pct: "+22.5%", up: true, statut: "actif" },
  { pays: "Tunisie", ca: 0, clients: 0, garages: 0, pros: 0, employes: 0, franchises: 0, pct: "—", up: true, statut: "preparation" },
  { pays: "Congo", ca: 0, clients: 0, garages: 0, pros: 0, employes: 0, franchises: 0, pct: "—", up: true, statut: "preparation" },
  { pays: "Togo", ca: 0, clients: 0, garages: 0, pros: 0, employes: 0, franchises: 0, pct: "—", up: true, statut: "lancer" },
];

const AGENCES = [
  { nom: "Siege MKA.P-MS Paris", directeur: "Moussa K.", pays: "France", region: "Ile-de-France", adresse: "Paris 93", ca: "98 500", effectif: 12, resultat: "+15.3%", objectif: "110 000" },
  { nom: "Agence Abidjan Plateau", directeur: "Awa S.", pays: "Cote d'Ivoire", region: "Abidjan", adresse: "Plateau, Abidjan", ca: "52 300", effectif: 8, resultat: "+22.1%", objectif: "55 000" },
  { nom: "Agence Dakar Almadies", directeur: "Ibrahima D.", pays: "Senegal", region: "Dakar", adresse: "Almadies, Dakar", ca: "38 900", effectif: 6, resultat: "+12.8%", objectif: "42 000" },
  { nom: "Agence Lyon Part-Dieu", directeur: "Karim B.", pays: "France", region: "Auvergne-Rhone-Alpes", adresse: "Part-Dieu, Lyon", ca: "34 200", effectif: 5, resultat: "+7.6%", objectif: "38 000" },
  { nom: "Agence Casablanca Maarif", directeur: "Youssef M.", pays: "Maroc", region: "Casablanca-Settat", adresse: "Maarif, Casablanca", ca: "28 700", effectif: 4, resultat: "+5.1%", objectif: "32 000" },
];

const FRANCHISES = [
  { nom: "MKA Franchise Lyon", franchise: "Karim B.", pays: "France", ville: "Lyon", ca: "34 200", abonnes: 89, contrat: "5 ans", echeance: "01/01/2031", performance: 92 },
  { nom: "MKA Franchise Abidjan", franchise: "Awa D.", pays: "Cote d'Ivoire", ville: "Abidjan", ca: "28 500", abonnes: 67, contrat: "5 ans", echeance: "15/06/2030", performance: 88 },
  { nom: "MKA Franchise Bruxelles", franchise: "Marc V.", pays: "Belgique", ville: "Bruxelles", ca: "22 400", abonnes: 45, contrat: "3 ans", echeance: "01/03/2029", performance: 85 },
];

const EMPLOYES_DIR = [
  { nom: "Karim M.", fonction: "Mecanicien senior", dept: "Atelier", presence: "98%", productivite: 92, objectif: 95, salaire: "2 800", embauche: "01/06/2021" },
  { nom: "Sarah K.", fonction: "Resp. location", dept: "Location", presence: "97%", productivite: 94, objectif: 90, salaire: "3 200", embauche: "01/01/2020" },
  { nom: "Mohamed A.", fonction: "Commercial vente", dept: "Vente", presence: "96%", productivite: 88, objectif: 85, salaire: "2 600", embauche: "01/09/2022" },
  { nom: "Fatima B.", fonction: "Comptable", dept: "Finance", presence: "99%", productivite: 96, objectif: 90, salaire: "2 900", embauche: "01/01/2019" },
  { nom: "Omar L.", fonction: "Mecanicien", dept: "Atelier", presence: "90%", productivite: 78, objectif: 80, salaire: "2 000", embauche: "01/06/2024" },
  { nom: "Ahmed T.", fonction: "Developpeur", dept: "Tech", presence: "95%", productivite: 95, objectif: 90, salaire: "3 500", embauche: "15/06/2025" },
  { nom: "Amina D.", fonction: "Accueil / Admin", dept: "Administration", presence: "100%", productivite: 91, objectif: 85, salaire: "2 400", embauche: "01/06/2022" },
];

const ALERTES = [
  { type: "critique", msg: "Paiement refuse — 1 580 EUR — Jean-Pierre D.", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  { type: "fraude", msg: "Tentative de fraude detectee — IP 185.xx.xx.xx", icon: Shield, color: "text-red-600", bg: "bg-red-50" },
  { type: "stock", msg: "Rupture stock — Plaquettes frein Bosch — 0 unite", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  { type: "abo", msg: "Abonnement expire — Garage Auto 93 — Pro Premium", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  { type: "objectif", msg: "Objectif CA Location atteint — 105%", icon: Target, color: "text-green-600", bg: "bg-green-50" },
  { type: "objectif", msg: "Objectif Garage non atteint — 87% seulement", icon: Target, color: "text-red-600", bg: "bg-red-50" },
  { type: "activite", msg: "Activite inhabituelle — 12 connexions depuis la meme IP", icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
  { type: "paiement", msg: "Paiement recu — 28 500 EUR — Martin D.", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
];

const JOURNAL_STRAT = [
  { action: "Validation annonce #A-45623", user: "Moussa K. (PDG)", dept: "Direction", date: "09/06/2026 18:10", ip: "92.184.xx.xx" },
  { action: "Suppression annonce #A-45601 — fausse annonce", user: "Directeur Awa S.", dept: "Direction", date: "09/06/2026 17:55", ip: "41.202.xx.xx" },
  { action: "Modification tarif Pro Premium: 79 → 89 EUR", user: "Moussa K. (PDG)", dept: "Direction", date: "09/06/2026 17:25", ip: "92.184.xx.xx" },
  { action: "Validation KYC — Garage AutoPro 77", user: "Moussa K. (PDG)", dept: "Direction", date: "09/06/2026 16:45", ip: "92.184.xx.xx" },
  { action: "Changement role — Fatou D. → Pro Vente", user: "Karima L.", dept: "RH", date: "09/06/2026 16:15", ip: "91.168.xx.xx" },
  { action: "Export donnees utilisateurs", user: "admin@mkapms.fr", dept: "Tech", date: "09/06/2026 14:20", ip: "91.168.xx.xx" },
];

const IA_RECOMMANDATIONS = [
  { titre: "Expansion Mali recommandee", detail: "Croissance +35.2% — marche sous-exploite. Recommandation: ouvrir 2 garages supplementaires et recruter 3 employes.", type: "opportunite" },
  { titre: "Baisse CA Cameroun", detail: "Baisse de -2.1% depuis 2 mois consecutifs. Analyse: concurrence locale accrue. Action: campagne pub ciblee + promotion abonnements.", type: "alerte" },
  { titre: "Electric+ en forte croissance", detail: "+45.2% ce mois. Prevision: CA annuel 150 000 EUR. Recommandation: investir dans 10 bornes supplementaires.", type: "prevision" },
  { titre: "Optimisation commissions Encheres", detail: "Marge actuelle 15%. Benchmark secteur: 20%. Recommandation: augmenter commission a 6% (actuellement 5%).", type: "optimisation" },
  { titre: "Prevision tresorerie Q3 2026", detail: "Tresorerie estimee: 450 000 EUR. Suffisante pour expansion Tunisie/Congo. Risque faible.", type: "prevision" },
];

const CONSEIL_PROJETS = [
  { projet: "Expansion Tunisie", statut: "En preparation", budget: "50 000 EUR", echeance: "Q3 2026", responsable: "Moussa K." },
  { projet: "Expansion Congo", statut: "En preparation", budget: "40 000 EUR", echeance: "Q3 2026", responsable: "Awa S." },
  { projet: "Expansion Togo", statut: "Planifie", budget: "35 000 EUR", echeance: "Q4 2026", responsable: "A definir" },
  { projet: "Acquisition Garage Meca Plus", statut: "Negociation", budget: "120 000 EUR", echeance: "Q2 2026", responsable: "Moussa K." },
  { projet: "Lancement Finance+ International", statut: "Planifie", budget: "80 000 EUR", echeance: "Q4 2026", responsable: "A definir" },
  { projet: "Objectif 50 garages 2026", statut: "En cours", budget: "—", echeance: "31/12/2026", responsable: "Direction" },
];

/* ---------- new section data (31-41 + Innovation) ---------- */
const AUTOMATIONS = [
  { nom: "Facturation auto abonnements", categorie: "Comptabilite", statut: "actif", executions: 1245, derniere: "09/06/2026 18:00", erreurs: 0 },
  { nom: "Notifications paiement recu", categorie: "Notifications", statut: "actif", executions: 3890, derniere: "09/06/2026 18:05", erreurs: 2 },
  { nom: "Indexation Google annonces", categorie: "SEO", statut: "actif", executions: 892, derniere: "09/06/2026 17:30", erreurs: 0 },
  { nom: "Sauvegarde BDD quotidienne", categorie: "Sauvegardes", statut: "actif", executions: 365, derniere: "09/06/2026 03:00", erreurs: 1 },
  { nom: "Sync stock pieces fournisseurs", categorie: "Pieces Auto", statut: "pause", executions: 145, derniere: "05/06/2026 08:00", erreurs: 5 },
  { nom: "Relance factures impayees", categorie: "Comptabilite", statut: "actif", executions: 234, derniere: "09/06/2026 09:00", erreurs: 0 },
  { nom: "Envoi rapport hebdomadaire PDG", categorie: "Comptabilite", statut: "actif", executions: 52, derniere: "08/06/2026 08:00", erreurs: 0 },
  { nom: "Verification KYC automatique", categorie: "Garage", statut: "erreur", executions: 78, derniere: "07/06/2026 14:30", erreurs: 12 },
  { nom: "Campagne pub auto rotation", categorie: "Publicite", statut: "actif", executions: 180, derniere: "09/06/2026 12:00", erreurs: 0 },
  { nom: "Mise a jour taux de change", categorie: "API", statut: "actif", executions: 730, derniere: "09/06/2026 18:01", erreurs: 0 },
];

const API_INTEGRATIONS = [
  { nom: "Stripe", statut: "connecte", sync: "09/06/2026 18:05", version: "v2024-06", type: "Paiement" },
  { nom: "Railway", statut: "connecte", sync: "09/06/2026 18:00", version: "API v1", type: "Hebergement" },
  { nom: "GitHub", statut: "connecte", sync: "09/06/2026 17:55", version: "REST v3", type: "Developpement" },
  { nom: "Google Maps", statut: "connecte", sync: "09/06/2026 17:30", version: "v3.55", type: "Geolocalisation" },
  { nom: "Google Indexing", statut: "connecte", sync: "09/06/2026 17:00", version: "v3", type: "SEO" },
  { nom: "SendGrid (Emails)", statut: "connecte", sync: "09/06/2026 18:01", version: "v3", type: "Communication" },
  { nom: "Twilio (SMS)", statut: "connecte", sync: "09/06/2026 16:45", version: "v2", type: "Communication" },
  { nom: "WhatsApp Business", statut: "desactive", sync: "—", version: "—", type: "Communication" },
  { nom: "Catalogue TecDoc", statut: "connecte", sync: "08/06/2026 22:00", version: "v2.5", type: "Pieces auto" },
  { nom: "ERP Bosch Partenaire", statut: "en_test", sync: "05/06/2026 10:00", version: "v1-beta", type: "Fournisseur" },
];

const SERVEURS = [
  { nom: "Production Web", disponibilite: "99.98%", reponse: "142ms", cpu: "34%", ram: "62%", stockage: "45%", ssl: "Valide (exp. 15/12/2026)" },
  { nom: "Base de donnees PostgreSQL", disponibilite: "99.99%", reponse: "8ms", cpu: "28%", ram: "55%", stockage: "38%", ssl: "Interne" },
  { nom: "CDN / Assets statiques", disponibilite: "100%", reponse: "22ms", cpu: "5%", ram: "12%", stockage: "25%", ssl: "Valide" },
  { nom: "Serveur Sauvegardes", disponibilite: "99.95%", reponse: "—", cpu: "15%", ram: "30%", stockage: "72%", ssl: "Interne" },
];

const SECURITE_DATA = [
  { event: "Connexion reussie", user: "moussa@mkapms.fr", appareil: "Chrome / MacOS", ip: "92.184.xx.xx", date: "09/06/2026 18:10", type: "succes" },
  { event: "Connexion reussie", user: "awa.s@mkapms.fr", appareil: "Safari / iPhone", ip: "41.202.xx.xx", date: "09/06/2026 17:55", type: "succes" },
  { event: "Tentative echouee (3x)", user: "inconnu", appareil: "Firefox / Linux", ip: "185.22.xx.xx", date: "09/06/2026 17:42", type: "echec" },
  { event: "2FA active", user: "karim.b@mkapms.fr", appareil: "—", ip: "91.168.xx.xx", date: "09/06/2026 16:30", type: "info" },
  { event: "Compte verrouille (5 tentatives)", user: "test@fake.com", appareil: "Bot", ip: "185.22.xx.xx", date: "09/06/2026 15:20", type: "bloque" },
  { event: "Session fermee par admin", user: "omar.l@mkapms.fr", appareil: "Chrome / Windows", ip: "90.45.xx.xx", date: "08/06/2026 22:00", type: "admin" },
];

const CLIENTS_DATA = [
  { nom: "Martin Dupont", type: "Particulier", achats: 2, ventes: 1, locations: 3, paiements: "28 500 EUR", fidelite: "Gold", messages: 5, reclamations: 0 },
  { nom: "Sophie Laurent", type: "Particulier", achats: 0, ventes: 0, locations: 8, paiements: "12 400 EUR", fidelite: "Silver", messages: 2, reclamations: 1 },
  { nom: "Pierre Kamara", type: "Pro", achats: 12, ventes: 5, locations: 0, paiements: "185 000 EUR", fidelite: "Platinum", messages: 18, reclamations: 0 },
  { nom: "Jean-Pierre Diallo", type: "Particulier", achats: 1, ventes: 0, locations: 0, paiements: "15 900 EUR", fidelite: "Bronze", messages: 1, reclamations: 2 },
  { nom: "Garage AutoPro 77", type: "Pro", achats: 0, ventes: 45, locations: 0, paiements: "342 000 EUR", fidelite: "Platinum", messages: 34, reclamations: 0 },
  { nom: "Ahmed Mansour", type: "Particulier", achats: 3, ventes: 2, locations: 5, paiements: "67 200 EUR", fidelite: "Gold", messages: 8, reclamations: 0 },
];

const PROS_DATA = [
  { nom: "Garage Meca Plus", type: "Garage", abonnement: "Pro Premium 89 EUR", ca: "52 300 EUR", annonces: 24, note: "4.8/5", kyc: "Verifie", performance: 94 },
  { nom: "Carrosserie Express", type: "Carrossier", abonnement: "Pro 59 EUR", ca: "18 900 EUR", annonces: 8, note: "4.5/5", kyc: "Verifie", performance: 88 },
  { nom: "Auto Select Lyon", type: "Marchand", abonnement: "Elite 129 EUR", ca: "98 400 EUR", annonces: 56, note: "4.9/5", kyc: "Verifie", performance: 96 },
  { nom: "LouAuto VTC", type: "VTC & Taxi", abonnement: "Pro 69 EUR", ca: "34 200 EUR", annonces: 12, note: "4.6/5", kyc: "Verifie", performance: 91 },
  { nom: "Depannage Rapide", type: "Depanneur", abonnement: "Start 39 EUR", ca: "8 900 EUR", annonces: 0, note: "4.2/5", kyc: "En attente", performance: 78 },
  { nom: "PiecesAuto Direct", type: "Vendeur pieces", abonnement: "Pro 49 EUR", ca: "24 600 EUR", annonces: 345, note: "4.7/5", kyc: "Verifie", performance: 92 },
];

const DOCUMENTS_DATA = [
  { nom: "Contrat Franchise Lyon", categorie: "Contrats", date: "01/01/2026", taille: "2.4 MB", versions: 3 },
  { nom: "Facture Railway Juin 2026", categorie: "Factures", date: "01/06/2026", taille: "145 KB", versions: 1 },
  { nom: "Rapport Trimestriel Q1 2026", categorie: "Rapports", date: "01/04/2026", taille: "8.2 MB", versions: 2 },
  { nom: "Devis Acquisition Garage Meca Plus", categorie: "Devis", date: "15/05/2026", taille: "1.1 MB", versions: 4 },
  { nom: "Bilan Comptable 2025", categorie: "Comptabilite", date: "15/01/2026", taille: "5.6 MB", versions: 1 },
  { nom: "Procedure KYC Garages", categorie: "Procedures", date: "10/03/2026", taille: "890 KB", versions: 6 },
  { nom: "CGV MKA.P-MS v3.2", categorie: "Juridique", date: "01/02/2026", taille: "420 KB", versions: 8 },
  { nom: "Contrat Emploi Ahmed T.", categorie: "RH", date: "15/06/2025", taille: "350 KB", versions: 1 },
];

const SAUVEGARDES = [
  { type: "Automatique quotidienne", statut: "succes", date: "09/06/2026 03:00", taille: "2.8 GB", duree: "4min 32s" },
  { type: "Automatique quotidienne", statut: "succes", date: "08/06/2026 03:00", taille: "2.7 GB", duree: "4min 18s" },
  { type: "Automatique quotidienne", statut: "succes", date: "07/06/2026 03:00", taille: "2.7 GB", duree: "4min 25s" },
  { type: "Manuelle (pre-deploy)", statut: "succes", date: "06/06/2026 14:30", taille: "2.7 GB", duree: "4min 40s" },
  { type: "Automatique quotidienne", statut: "echec", date: "05/06/2026 03:00", taille: "—", duree: "—" },
  { type: "Automatique hebdomadaire", statut: "succes", date: "02/06/2026 03:00", taille: "12.5 GB", duree: "18min 12s" },
];

const CROISSANCE_PAYS = [
  { pays: "Tunisie", etape: "Etude de marche", avancement: 65, reglementation: "TVA 19%", paiement: "Virement, D17", lancement: "Q3 2026", partenaires: 2 },
  { pays: "Congo", etape: "Partenariats", avancement: 40, reglementation: "TVA 16%", paiement: "Mobile Money, Virement", lancement: "Q3 2026", partenaires: 1 },
  { pays: "Togo", etape: "Planification", avancement: 15, reglementation: "TVA 18%", paiement: "Mobile Money, Flooz", lancement: "Q4 2026", partenaires: 0 },
  { pays: "Gabon", etape: "Prospection", avancement: 5, reglementation: "TVA 18%", paiement: "A definir", lancement: "2027", partenaires: 0 },
  { pays: "Canada", etape: "Analyse", avancement: 10, reglementation: "TPS 5% + TVQ 9.975%", paiement: "Stripe, Virement", lancement: "2027", partenaires: 0 },
];

const INNOVATION_PROJETS = [
  { nom: "IA Detection fraude annonces", statut: "Prototype", phase: "R&D", debut: "01/04/2026", equipe: "Tech", priorite: "Haute", avancement: 45 },
  { nom: "App Mobile native (iOS/Android)", statut: "En cours", phase: "Developpement", debut: "01/03/2026", equipe: "Tech", priorite: "Haute", avancement: 30 },
  { nom: "Scoring financier automatique", statut: "Idee", phase: "Conception", debut: "—", equipe: "Finance", priorite: "Moyenne", avancement: 10 },
  { nom: "Chatbot IA service client", statut: "En test", phase: "Beta", debut: "15/05/2026", equipe: "Tech", priorite: "Haute", avancement: 75 },
  { nom: "Vehicule inspection 360°", statut: "Idee", phase: "Recherche", debut: "—", equipe: "Innovation", priorite: "Basse", avancement: 5 },
  { nom: "Blockchain certificat vehicule", statut: "Etude", phase: "Faisabilite", debut: "01/06/2026", equipe: "Tech", priorite: "Moyenne", avancement: 15 },
  { nom: "Prediction prix marche auto", statut: "Prototype", phase: "R&D", debut: "15/04/2026", equipe: "Data", priorite: "Moyenne", avancement: 35 },
];

/* ---------- Partie 4 data (42-55) ---------- */
const RD_PROJETS = [
  { nom: "IA Detection fraude v2", categorie: "Intelligence artificielle", responsable: "Karim B.", budget: "45 000 EUR", priorite: "Haute", avancement: 55, cible: "Q4 2026", validation: "Approuve" },
  { nom: "App Garage+ standalone", categorie: "Applications mobiles", responsable: "Ahmed T.", budget: "80 000 EUR", priorite: "Haute", avancement: 25, cible: "Q1 2027", validation: "En attente" },
  { nom: "Moteur de recommandation", categorie: "Intelligence artificielle", responsable: "Data Team", budget: "35 000 EUR", priorite: "Moyenne", avancement: 15, cible: "Q2 2027", validation: "Approuve" },
  { nom: "Inspection vehicule AR", categorie: "Objets connectes", responsable: "Innovation", budget: "120 000 EUR", priorite: "Basse", avancement: 5, cible: "2028", validation: "Planifie" },
  { nom: "Dashboard Electric+ v2", categorie: "Electric+", responsable: "Awa S.", budget: "20 000 EUR", priorite: "Moyenne", avancement: 40, cible: "Q3 2026", validation: "Approuve" },
  { nom: "API Marketplace externe", categorie: "Outils internes", responsable: "Tech", budget: "15 000 EUR", priorite: "Haute", avancement: 60, cible: "Q3 2026", validation: "Approuve" },
];

const IDEES_INNOVATION = [
  { titre: "Livraison par drone", auteur: "Moussa K. (PDG)", date: "01/06/2026", impact: "Eleve", cout: "200 000 EUR", difficulte: "Haute", priorite: "Basse", decision: "Report 2028" },
  { titre: "Assurance integree MKA", auteur: "Awa S. (Dir.)", date: "15/05/2026", impact: "Eleve", cout: "50 000 EUR", difficulte: "Moyenne", priorite: "Haute", decision: "Approuve" },
  { titre: "Abonnement famille", auteur: "Client via feedback", date: "20/05/2026", impact: "Moyen", cout: "5 000 EUR", difficulte: "Basse", priorite: "Moyenne", decision: "En etude" },
  { titre: "Mode sombre app", auteur: "Ahmed T. (Dev)", date: "10/06/2026", impact: "Faible", cout: "2 000 EUR", difficulte: "Basse", priorite: "Basse", decision: "Planifie" },
  { titre: "Chatbot vocal", auteur: "Partenaire Google", date: "05/06/2026", impact: "Moyen", cout: "30 000 EUR", difficulte: "Haute", priorite: "Moyenne", decision: "En etude" },
];

const INVESTISSEURS_DATA = [
  { nom: "Serie Pre-Seed", montant: "150 000 EUR", date: "01/01/2025", investisseur: "Fondateur", participation: "100%", statut: "Realise" },
  { nom: "Serie Seed (prevue)", montant: "500 000 EUR", date: "Q4 2026", investisseur: "A definir", participation: "15-20%", statut: "Planifie" },
  { nom: "Serie A (prevue)", montant: "2 000 000 EUR", date: "2027", investisseur: "A definir", participation: "20-25%", statut: "Vision" },
];

const PARTENAIRES_DATA = [
  { nom: "TecDoc", type: "Fournisseur catalogue", responsable: "Tech", ca: "—", contrat: "01/01/2026 - 31/12/2026", niveau: "Gold" },
  { nom: "Stripe", type: "Paiement", responsable: "Finance", ca: "Commission 2.9%", contrat: "Illimite", niveau: "Platinum" },
  { nom: "Railway", type: "Hebergement", responsable: "Tech", ca: "~200 EUR/mois", contrat: "Mensuel", niveau: "Standard" },
  { nom: "Google Cloud", type: "Technologie", responsable: "Tech", ca: "~150 EUR/mois", contrat: "Pay-as-you-go", niveau: "Standard" },
  { nom: "Bosch Car Service", type: "Reseau de garages", responsable: "Direction", ca: "Partenariat", contrat: "En negociation", niveau: "En attente" },
  { nom: "AXA Assurance", type: "Assurance", responsable: "Direction", ca: "A definir", contrat: "En discussion", niveau: "En attente" },
];

const MARQUES_DATA = [
  { nom: "MKA.P-MS", logo: "Enregistre", pays: "France, CI, Senegal", depot: "INPI 2024", renouvellement: "2034", statut: "Actif", responsable: "Moussa K." },
  { nom: "Garage+", logo: "Enregistre", pays: "France", depot: "INPI 2025", renouvellement: "2035", statut: "Actif", responsable: "Moussa K." },
  { nom: "Finance+", logo: "Enregistre", pays: "France", depot: "INPI 2025", renouvellement: "2035", statut: "Actif", responsable: "Moussa K." },
  { nom: "Electric+", logo: "En cours", pays: "France", depot: "INPI 2026", renouvellement: "—", statut: "En depot", responsable: "Moussa K." },
  { nom: "Rewards MKA", logo: "Planifie", pays: "—", depot: "—", renouvellement: "—", statut: "Planifie", responsable: "A definir" },
  { nom: "Encheres Pro", logo: "Enregistre", pays: "France", depot: "INPI 2025", renouvellement: "2035", statut: "Actif", responsable: "Moussa K." },
  { nom: "Atelier Pro", logo: "Enregistre", pays: "France", depot: "INPI 2025", renouvellement: "2035", statut: "Actif", responsable: "Moussa K." },
];

const PROPRIETE_IP = [
  { actif: "Marque MKA.P-MS", type: "Marque", depot: "INPI", expiration: "2034", statut: "Protege" },
  { actif: "Logo MKA.P-MS", type: "Design", depot: "INPI", expiration: "2034", statut: "Protege" },
  { actif: "mkapms.com", type: "Nom de domaine", depot: "Registrar", expiration: "15/06/2027", statut: "Actif" },
  { actif: "Code source plateforme", type: "Logiciel", depot: "GitHub (prive)", expiration: "—", statut: "Protege" },
  { actif: "Base de donnees utilisateurs", type: "Base de donnees", depot: "Interne", expiration: "—", statut: "RGPD" },
  { actif: "Brevet inspection AR (futur)", type: "Brevet", depot: "A deposer", expiration: "—", statut: "Planifie" },
];

const EXPANSION_DATA = [
  { pays: "Guinee", etude: "Completee", budget: "25 000 EUR", planning: "Q4 2026", recrutement: "2 postes", partenaires: "1 local", reglementation: "TVA 18%", fiscalite: "IS 25%", langues: "Francais", paiement: "Orange Money", ouverture: "01/12/2026" },
  { pays: "Mali", etude: "En cours", budget: "20 000 EUR", planning: "Q1 2027", recrutement: "1 poste", partenaires: "En recherche", reglementation: "TVA 18%", fiscalite: "IS 30%", langues: "Francais", paiement: "Mobile Money", ouverture: "01/03/2027" },
  { pays: "Belgique", etude: "Planifiee", budget: "40 000 EUR", planning: "Q2 2027", recrutement: "3 postes", partenaires: "0", reglementation: "TVA 21%", fiscalite: "IS 25%", langues: "FR/NL", paiement: "Stripe, Bancontact", ouverture: "01/06/2027" },
  { pays: "Suisse", etude: "Analyse", budget: "60 000 EUR", planning: "2028", recrutement: "A definir", partenaires: "0", reglementation: "TVA 7.7%", fiscalite: "Variable", langues: "FR/DE/IT", paiement: "Stripe, TWINT", ouverture: "2028" },
];

const APPS_DATA = [
  { nom: "App Particuliers", version: "1.0.0", utilisateurs: "26 025", mises_a_jour: 12, bugs: 3, note: "4.6/5", telechargements: "28 400" },
  { nom: "App Professionnels", version: "1.0.0", utilisateurs: "1 225", mises_a_jour: 8, bugs: 1, note: "4.7/5", telechargements: "1 890" },
  { nom: "App Garage+", version: "0.9-beta", utilisateurs: "37", mises_a_jour: 4, bugs: 5, note: "4.2/5", telechargements: "120" },
  { nom: "App Electric+", version: "Planifiee", utilisateurs: "—", mises_a_jour: 0, bugs: 0, note: "—", telechargements: "—" },
  { nom: "App Finance+", version: "Planifiee", utilisateurs: "—", mises_a_jour: 0, bugs: 0, note: "—", telechargements: "—" },
  { nom: "App Direction", version: "0.5-alpha", utilisateurs: "3", mises_a_jour: 2, bugs: 2, note: "—", telechargements: "3" },
];

const DOMAINES_DATA = [
  { domaine: "mkapms.com", registrar: "Namecheap", expiration: "15/06/2027", dns: "Cloudflare", ssl: "Let's Encrypt (auto)", redirections: 2, statut: "Actif" },
  { domaine: "mkapms.fr", registrar: "OVH", expiration: "01/03/2027", dns: "OVH", ssl: "Actif", redirections: 1, statut: "Actif" },
  { domaine: "mkapms.pro", registrar: "Namecheap", expiration: "15/06/2027", dns: "Cloudflare", ssl: "Actif", redirections: 1, statut: "Actif" },
  { domaine: "mkapms.site", registrar: "Namecheap", expiration: "15/06/2027", dns: "Cloudflare", ssl: "—", redirections: 0, statut: "Reserve" },
  { domaine: "mkapms.ci", registrar: "A reserver", expiration: "—", dns: "—", ssl: "—", redirections: 0, statut: "Planifie" },
  { domaine: "mkapms.sn", registrar: "A reserver", expiration: "—", dns: "—", ssl: "—", redirections: 0, statut: "Planifie" },
];

const LICENCES_DATA = [
  { logiciel: "Railway (Hebergement)", cout: "~200 EUR/mois", renouvellement: "Mensuel", responsable: "Tech", utilisation: "Production" },
  { logiciel: "Stripe (Paiement)", cout: "Commission 2.9%", renouvellement: "—", responsable: "Finance", utilisation: "Production" },
  { logiciel: "Google Maps API", cout: "~50 EUR/mois", renouvellement: "Pay-as-you-go", responsable: "Tech", utilisation: "Production" },
  { logiciel: "SendGrid (Emails)", cout: "~30 EUR/mois", renouvellement: "Mensuel", responsable: "Tech", utilisation: "Production" },
  { logiciel: "TecDoc API", cout: "~100 EUR/mois", renouvellement: "Annuel", responsable: "Tech", utilisation: "Production" },
  { logiciel: "GitHub (Pro)", cout: "~20 EUR/mois", renouvellement: "Mensuel", responsable: "Tech", utilisation: "Developpement" },
];

const FORMATIONS_DATA = [
  { titre: "Onboarding nouvel employe", type: "Guide", acces: "Tous", duree: "2h", completions: 76 },
  { titre: "Utilisation Garage+", type: "Tutoriel video", acces: "Garages", duree: "45min", completions: 32 },
  { titre: "Gestion des encheres", type: "Procedure", acces: "Equipe Encheres", duree: "1h", completions: 8 },
  { titre: "RGPD et donnees personnelles", type: "Certification", acces: "Tous", duree: "3h", completions: 45 },
  { titre: "Service client MKA", type: "Formation", acces: "Support", duree: "4h", completions: 12 },
  { titre: "Comptabilite plateforme", type: "Guide", acces: "Comptabilite", duree: "2h30", completions: 5 },
];

const COMMUNICATIONS_DATA = [
  { titre: "Lancement Electric+ Cote d'Ivoire", type: "Annonce", departement: "Tous", date: "09/06/2026", statut: "Diffuse" },
  { titre: "Reunion strategie Q3 2026", type: "Reunion", departement: "Direction", date: "15/06/2026", statut: "Planifie" },
  { titre: "Mise a jour CGV v3.2", type: "Note de service", departement: "Juridique", date: "01/06/2026", statut: "Diffuse" },
  { titre: "Formation securite informatique", type: "Evenement", departement: "Tech", date: "20/06/2026", statut: "Planifie" },
  { titre: "Objectifs commerciaux Juillet", type: "Note de service", departement: "Commercial", date: "28/06/2026", statut: "Brouillon" },
];

const AUDITS_DATA = [
  { titre: "Audit financier annuel 2025", type: "Financier", date: "15/01/2026", statut: "Termine", recommandations: 3, actions: 3, validation: "PDG" },
  { titre: "Audit RGPD", type: "RGPD", date: "01/03/2026", statut: "Termine", recommandations: 5, actions: 4, validation: "DPO" },
  { titre: "Audit securite informatique", type: "Informatique", date: "15/04/2026", statut: "En cours", recommandations: 8, actions: 2, validation: "En attente" },
  { titre: "Audit qualite services", type: "Qualite", date: "01/05/2026", statut: "Planifie", recommandations: 0, actions: 0, validation: "—" },
  { titre: "Audit juridique international", type: "Juridique", date: "Q3 2026", statut: "Planifie", recommandations: 0, actions: 0, validation: "—" },
];

const GOUVERNANCE_DATA = [
  { decision: "Lancement Garage+ franchise", date: "01/03/2026", type: "Expansion", statut: "Approuve", responsable: "PDG" },
  { decision: "Levee de fonds Seed Q4 2026", date: "15/04/2026", type: "Investissement", statut: "En preparation", responsable: "PDG" },
  { decision: "Expansion Tunisie", date: "01/05/2026", type: "International", statut: "Approuve", responsable: "Direction" },
  { decision: "Recrutement 10 postes Q3", date: "01/06/2026", type: "RH", statut: "Valide", responsable: "DRH" },
  { decision: "Budget marketing +30%", date: "15/06/2026", type: "Budget", statut: "En discussion", responsable: "PDG" },
];

/* ---------- Partie 5 data (56-65) ---------- */
const ESG_DATA = [
  { indicateur: "Emissions CO2 evitees", valeur: "12.5 tonnes", objectif: "20 tonnes", progression: 62 },
  { indicateur: "Vehicules electriques promus", valeur: "89", objectif: "150", progression: 59 },
  { indicateur: "Pieces reutilisees", valeur: "1 245", objectif: "2 000", progression: 62 },
  { indicateur: "Consommation serveurs (green)", valeur: "78%", objectif: "100%", progression: 78 },
  { indicateur: "Score ESG global", valeur: "B+", objectif: "A", progression: 72 },
];

const QUALITE_DATA = [
  { service: "Vente", satisfaction: "4.7/5", reclamations: 3, tempsTraitement: "24h", objectif: "4.8/5" },
  { service: "Location", satisfaction: "4.5/5", reclamations: 7, tempsTraitement: "12h", objectif: "4.7/5" },
  { service: "Garage+", satisfaction: "4.8/5", reclamations: 1, tempsTraitement: "48h", objectif: "4.9/5" },
  { service: "Carrosserie", satisfaction: "4.4/5", reclamations: 2, tempsTraitement: "72h", objectif: "4.6/5" },
  { service: "Pieces auto", satisfaction: "4.6/5", reclamations: 5, tempsTraitement: "6h", objectif: "4.7/5" },
  { service: "Electric+", satisfaction: "4.3/5", reclamations: 4, tempsTraitement: "2h", objectif: "4.5/5" },
  { service: "Finance+", satisfaction: "4.2/5", reclamations: 8, tempsTraitement: "48h", objectif: "4.5/5" },
  { service: "Depannage", satisfaction: "4.9/5", reclamations: 0, tempsTraitement: "30min", objectif: "4.9/5" },
];

const CONFORMITE_DATA = [
  { regle: "RGPD", pays: "Europe", statut: "Conforme", dernierAudit: "01/03/2026", prochainAudit: "01/03/2027" },
  { regle: "KYC Professionnels", pays: "Tous", statut: "Conforme", dernierAudit: "15/04/2026", prochainAudit: "15/04/2027" },
  { regle: "TVA multi-pays", pays: "France, CI, Senegal", statut: "Conforme", dernierAudit: "01/01/2026", prochainAudit: "01/01/2027" },
  { regle: "Protection consommateurs", pays: "France", statut: "Conforme", dernierAudit: "15/02/2026", prochainAudit: "15/02/2027" },
  { regle: "Normes automobiles", pays: "France", statut: "En cours", dernierAudit: "—", prochainAudit: "Q3 2026" },
  { regle: "Lutte anti-fraude", pays: "Tous", statut: "Conforme", dernierAudit: "01/05/2026", prochainAudit: "01/11/2026" },
];

const OBSERVATION_MARCHE = [
  { indicateur: "Prix moyen vehicule occasion", valeur: "14 800 EUR", tendance: "+3.2%", direction: "up" },
  { indicateur: "Marque la plus recherchee", valeur: "Peugeot", tendance: "Stable", direction: "stable" },
  { indicateur: "Modele le plus recherche", valeur: "308 SW", tendance: "+12%", direction: "up" },
  { indicateur: "Segment en croissance", valeur: "SUV Electrique", tendance: "+45%", direction: "up" },
  { indicateur: "Pays le plus dynamique", valeur: "Cote d'Ivoire", tendance: "+28%", direction: "up" },
  { indicateur: "Prix moyen location/jour", valeur: "42 EUR", tendance: "-1.5%", direction: "down" },
];

const EXPERIENCE_CLIENT = [
  { metrique: "Temps moyen sur plateforme", valeur: "8min 32s", evolution: "+12%" },
  { metrique: "Taux de conversion achat", valeur: "3.8%", evolution: "+0.4%" },
  { metrique: "Taux de conversion location", valeur: "5.2%", evolution: "+0.8%" },
  { metrique: "Taux d'abandon panier", valeur: "22%", evolution: "-3%" },
  { metrique: "NPS (Net Promoter Score)", valeur: "72", evolution: "+5" },
  { metrique: "Taux de fidelite (retour 90j)", valeur: "45%", evolution: "+8%" },
  { metrique: "Satisfaction globale", valeur: "4.7/5", evolution: "+0.2" },
];

const REWARDS_DATA = [
  { niveau: "Bronze", membres: 18500, points_distribues: "185 000", points_utilises: "42 000", offres: 3 },
  { niveau: "Silver", membres: 5200, points_distribues: "312 000", points_utilises: "128 000", offres: 5 },
  { niveau: "Gold", membres: 1800, points_distribues: "540 000", points_utilises: "310 000", offres: 8 },
  { niveau: "Platinum", membres: 450, points_distribues: "675 000", points_utilises: "520 000", offres: 12 },
];

const PERSONNALISATION_PAYS = [
  { pays: "France", devise: "EUR", langue: "Francais", tva: "20%", paiements: "Stripe, CB, Virement", services: "Tous" },
  { pays: "Cote d'Ivoire", devise: "XOF", langue: "Francais", tva: "18%", paiements: "Orange Money, Wave, Virement", services: "Tous sauf Finance+" },
  { pays: "Senegal", devise: "XOF", langue: "Francais", tva: "18%", paiements: "Orange Money, Wave", services: "Tous sauf Finance+" },
  { pays: "Maroc", devise: "MAD", langue: "Francais/Arabe", tva: "20%", paiements: "CMI, Virement", services: "Vente, Location, Garage" },
  { pays: "Cameroun", devise: "XAF", langue: "Francais", tva: "19.25%", paiements: "MTN MoMo, Orange Money", services: "Vente, Location" },
];

/* ---------- Partie 6 data (66-80) ---------- */
const CONNECTEURS_DATA = [
  { nom: "Stripe", categorie: "Paiements", statut: "actif", derniere_sync: "09/06/2026 18:05" },
  { nom: "Railway", categorie: "Hebergement", statut: "actif", derniere_sync: "09/06/2026 18:00" },
  { nom: "Google Maps", categorie: "Geolocalisation", statut: "actif", derniere_sync: "09/06/2026 17:30" },
  { nom: "TecDoc", categorie: "Constructeurs", statut: "actif", derniere_sync: "08/06/2026 22:00" },
  { nom: "AXA Assurance", categorie: "Assurances", statut: "desactive", derniere_sync: "—" },
  { nom: "La Poste", categorie: "Transporteurs", statut: "desactive", derniere_sync: "—" },
  { nom: "ANTS (Immat.)", categorie: "Administrations", statut: "planifie", derniere_sync: "—" },
  { nom: "BNP Paribas API", categorie: "Banques", statut: "planifie", derniere_sync: "—" },
];

const MARKETPLACES_DATA = [
  { nom: "LeBonCoin", statut: "planifie", annonces_sync: 0, prix_sync: false, stock_sync: false },
  { nom: "AutoScout24", statut: "planifie", annonces_sync: 0, prix_sync: false, stock_sync: false },
  { nom: "La Centrale", statut: "planifie", annonces_sync: 0, prix_sync: false, stock_sync: false },
  { nom: "MKA.P-MS Interne", statut: "actif", annonces_sync: 1245, prix_sync: true, stock_sync: true },
];

const FOURNISSEURS_DATA = [
  { nom: "TecDoc / TecAlliance", categorie: "Pieces auto", contrat: "Actif", delai: "24-72h", performance: 95 },
  { nom: "Bosch Car Parts", categorie: "Pieces auto", contrat: "Actif", delai: "48h", performance: 92 },
  { nom: "Michelin", categorie: "Pneus", contrat: "En negociation", delai: "72h", performance: 0 },
  { nom: "Wurth", categorie: "Outillage", contrat: "Actif", delai: "24h", performance: 97 },
  { nom: "Axial", categorie: "Carrosserie", contrat: "Planifie", delai: "—", performance: 0 },
];

const CONSTRUCTEURS_DATA = [
  { marque: "Peugeot", modeles: 45, generations: 120, motorisations: 380, references: "12 500", integration: "TecDoc" },
  { marque: "Renault", modeles: 42, generations: 110, motorisations: 350, references: "11 800", integration: "TecDoc" },
  { marque: "Citroen", modeles: 35, generations: 90, motorisations: 280, references: "9 200", integration: "TecDoc" },
  { marque: "BMW", modeles: 38, generations: 95, motorisations: 310, references: "10 500", integration: "TecDoc" },
  { marque: "Mercedes", modeles: 40, generations: 100, motorisations: 340, references: "11 200", integration: "TecDoc" },
  { marque: "Toyota", modeles: 30, generations: 75, motorisations: 220, references: "8 900", integration: "TecDoc" },
];

const PARTENAIRES_FIN_DATA = [
  { nom: "Cetelem (BNP)", produit: "Credit auto", taux: "3.9% - 7.2%", commission: "1.5%", pays: "France", statut: "Planifie" },
  { nom: "Cofidis", produit: "Credit conso", taux: "4.5% - 9.8%", commission: "2%", pays: "France", statut: "Planifie" },
  { nom: "Franfinance", produit: "LOA / LLD", taux: "Variable", commission: "1.8%", pays: "France", statut: "Planifie" },
];

const ASSURANCES_DATA = [
  { nom: "AXA", services: "Auto, Garantie mecanique, Assistance", pays: "France", statut: "En discussion" },
  { nom: "Allianz", services: "Auto, Extension garantie", pays: "Europe", statut: "Planifie" },
  { nom: "NSIA", services: "Auto, Assistance", pays: "Cote d'Ivoire, Senegal", statut: "En discussion" },
];

const TRANSPORTEURS_DATA = [
  { nom: "Allo Colis", type: "Livraison locale", disponibilite: "Lun-Sam", delai: "24-48h", tarif: "A partir de 15 EUR", qualite: "4.5/5" },
  { nom: "Convoyage Express", type: "Porte-voitures", disponibilite: "7j/7", delai: "3-5 jours", tarif: "A partir de 350 EUR", qualite: "4.7/5" },
  { nom: "DHL Express", type: "International", disponibilite: "7j/7", delai: "5-10 jours", tarif: "Variable", qualite: "4.3/5" },
  { nom: "Transporteur local CI", type: "Livraison Afrique", disponibilite: "Lun-Ven", delai: "3-7 jours", tarif: "Variable", qualite: "4.0/5" },
];

const API_INTERNES_DATA = [
  { nom: "API Annonces", version: "v2.1", securite: "JWT + Rate limiting", requetes_jour: 45000, uptime: "99.98%" },
  { nom: "API Paiements", version: "v1.3", securite: "JWT + Webhook verify", requetes_jour: 8500, uptime: "99.99%" },
  { nom: "API Utilisateurs", version: "v2.0", securite: "JWT + 2FA", requetes_jour: 22000, uptime: "99.97%" },
  { nom: "API Garage+", version: "v1.0", securite: "JWT", requetes_jour: 3200, uptime: "99.95%" },
  { nom: "API Admin", version: "v1.5", securite: "JWT + IP whitelist", requetes_jour: 1200, uptime: "99.99%" },
];

const DEV_DATA = [
  { env: "Production", version: "v2.8.4", dernier_deploy: "09/06/2026 16:30", statut: "stable", bugs_ouverts: 3 },
  { env: "Staging", version: "v2.9.0-rc1", dernier_deploy: "09/06/2026 18:00", statut: "test", bugs_ouverts: 7 },
  { env: "Development", version: "v2.9.0-dev", dernier_deploy: "09/06/2026 18:15", statut: "dev", bugs_ouverts: 12 },
];

const OBJETS_CONNECTES_DATA = [
  { type: "Bornes Electric+", deployes: 12, actifs: 10, en_panne: 2, pays: "France, CI" },
  { type: "Balises GPS vehicules", deployes: 0, actifs: 0, en_panne: 0, pays: "Planifie" },
  { type: "Boitiers telematiques", deployes: 0, actifs: 0, en_panne: 0, pays: "Planifie" },
  { type: "Lecteurs OBD Garage+", deployes: 5, actifs: 5, en_panne: 0, pays: "France" },
  { type: "Capteurs atelier", deployes: 0, actifs: 0, en_panne: 0, pays: "Planifie" },
];

/* ================================================================ */

export default function CentrePilotage() {
  const [tab, setTab] = useState<MainTab>("accueil");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const navigate = useNavigate();
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const totalCA = PAYS_DATA.reduce((s, p) => s + p.ca, 0);
  const totalClients = PAYS_DATA.reduce((s, p) => s + p.clients, 0);
  const totalGarages = PAYS_DATA.reduce((s, p) => s + p.garages, 0);
  const totalPros = PAYS_DATA.reduce((s, p) => s + p.pros, 0);
  const totalEmployes = PAYS_DATA.reduce((s, p) => s + p.employes, 0);

  const SectionCard = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: typeof Euro }) => (
    <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
      <div className="bg-[#111] px-3 py-2 flex items-center gap-2"><Icon size={12} className="text-[#D4AF37]" /><h3 className="text-xs font-bold text-[#D4AF37]">{title}</h3></div>
      {children}
    </div>
  );

  const StatCard = ({ label, value, color, onClick }: { label: string; value: string; color: string; onClick?: () => void }) => (
    <button onClick={onClick} className="rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-center active:scale-[0.97] transition">
      <p className={`text-lg font-black ${color}`}>{value}</p>
      <p className="text-[8px] text-[#6B7280]">{label}</p>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/compta-dirigeant" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Comptabilite</Link>
        <div className="flex items-center gap-2">
          <Crown size={22} className="text-[#D4AF37]" />
          <div>
            <h1 className="text-xl font-black text-white">Centre de Pilotage Groupe</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">RESERVE PDG & DIRECTION GENERALE</p>
          </div>
        </div>
      </div>

      {/* TABS SCROLL */}
      <div className="px-4 mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setExpanded(null); }} className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition ${tab === t.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={10} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-4">
        {/* ━━━━ ACCUEIL ━━━━ */}
        {tab === "accueil" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <p className="text-[10px] text-white/40 uppercase">CA mondial mensuel</p>
              <p className="text-3xl font-black text-[#D4AF37]">{totalCA.toLocaleString("fr-FR")} EUR</p>
              <p className="text-xs text-green-400 flex items-center gap-1 mt-1"><TrendingUp size={12} /> +14.8% vs mois precedent</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Benefice net" value="185 200 EUR" color="text-green-600" onClick={() => setTab("financier")} />
              <StatCard label="Tresorerie" value="342 800 EUR" color="text-blue-600" onClick={() => setTab("financier")} />
              <StatCard label="Utilisateurs" value={totalClients.toLocaleString()} color="text-[#D4AF37]" onClick={() => setTab("pays")} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <StatCard label="Pros" value={totalPros.toLocaleString()} color="text-purple-600" onClick={() => setTab("commercial")} />
              <StatCard label="Particuliers" value={(totalClients - totalPros).toLocaleString()} color="text-blue-500" onClick={() => setTab("commercial")} />
              <StatCard label="Garages" value={totalGarages.toString()} color="text-green-600" onClick={() => setTab("garage")} />
              <StatCard label="Carrossiers" value="18" color="text-amber-600" onClick={() => setTab("carrosserie")} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <StatCard label="Loueurs" value="67" color="text-indigo-600" onClick={() => setTab("commercial")} />
              <StatCard label="Vente" value="1 245" color="text-[#D4AF37]" onClick={() => setTab("commercial")} />
              <StatCard label="Location" value="892" color="text-blue-600" onClick={() => setTab("commercial")} />
              <StatCard label="Encheres" value="34" color="text-purple-600" onClick={() => setTab("encheres")} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <StatCard label="Pieces auto" value="4 520" color="text-orange-600" onClick={() => setTab("commercial")} />
              <StatCard label="Pays actifs" value={PAYS_DATA.filter(p => p.statut === "actif").length.toString()} color="text-green-600" onClick={() => setTab("pays")} />
              <StatCard label="Franchises" value={FRANCHISES.length.toString()} color="text-[#D4AF37]" onClick={() => setTab("franchises")} />
              <StatCard label="Employes" value={totalEmployes.toString()} color="text-blue-600" onClick={() => setTab("employes")} />
            </div>
            <StatCard label="Abonnements actifs" value="1 225" color="text-[#D4AF37]" onClick={() => setTab("abonnements")} />
          </div>
        )}

        {/* ━━━━ PERFORMANCE GLOBALE ━━━━ */}
        {tab === "performance" && (
          <div className="space-y-2">
            {PERF_UNIVERS.map((u, i) => {
              const Icon = u.icon;
              const isExp = expanded === i;
              return (
                <div key={u.univers} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-[#D4AF37]/10 grid place-items-center"><Icon size={14} className="text-[#D4AF37]" /></div>
                      <div>
                        <p className="text-sm font-bold text-[#111]">{u.univers}</p>
                        <p className="text-[10px] text-[#6B7280]">{u.transactions} transactions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-black text-[#111]">{u.ca} EUR</p>
                        <p className={`text-[10px] font-bold ${u.up ? "text-green-500" : "text-red-500"}`}>{u.croissance}</p>
                      </div>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Objectif</span><p className="font-bold text-[#111]">{u.objectif} EUR</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Marge</span><p className="font-bold text-[#D4AF37]">{u.marge}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Rentabilite</span><p className="font-bold text-green-600">{u.rentabilite}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━ PAYS (CARTE) ━━━━ */}
        {tab === "pays" && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-xl bg-green-50 border border-green-200 p-2 text-center"><p className="text-lg font-black text-green-700">{PAYS_DATA.filter(p => p.statut === "actif").length}</p><p className="text-[8px] text-green-600">Actifs</p></div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-center"><p className="text-lg font-black text-amber-700">{PAYS_DATA.filter(p => p.statut === "preparation").length}</p><p className="text-[8px] text-amber-600">En preparation</p></div>
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-2 text-center"><p className="text-lg font-black text-blue-700">{PAYS_DATA.filter(p => p.statut === "lancer").length}</p><p className="text-[8px] text-blue-600">A lancer</p></div>
            </div>
            {PAYS_DATA.map((p, i) => {
              const isExp = expanded === i;
              return (
                <div key={p.pays} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-[#D4AF37]" />
                      <div>
                        <p className="text-sm font-bold text-[#111]">{p.pays}</p>
                        <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${p.statut === "actif" ? "bg-green-50 text-green-700" : p.statut === "preparation" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{p.statut}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#111]">{p.ca > 0 ? `${p.ca.toLocaleString()} EUR` : "—"}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && p.statut === "actif" && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Clients</span><p className="font-bold text-[#111]">{p.clients.toLocaleString()}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Garages</span><p className="font-bold text-[#111]">{p.garages}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Pros</span><p className="font-bold text-[#111]">{p.pros}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Employes</span><p className="font-bold text-[#111]">{p.employes}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Franchises</span><p className="font-bold text-[#111]">{p.franchises}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Croissance</span><p className={`font-bold ${p.up ? "text-green-600" : "text-red-500"}`}>{p.pct}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━ AGENCES ━━━━ */}
        {tab === "agences" && (
          <div className="space-y-2">
            {AGENCES.map((a, i) => {
              const isExp = expanded === i;
              return (
                <div key={a.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#111]">{a.nom}</p>
                      <p className="text-[10px] text-[#6B7280]">{a.directeur} · {a.pays}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#D4AF37]">{a.ca} EUR</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Region</span><p className="font-bold">{a.region}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Effectif</span><p className="font-bold">{a.effectif}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Resultat</span><p className="font-bold text-green-600">{a.resultat}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Objectif</span><p className="font-bold">{a.objectif} EUR</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━ FRANCHISES ━━━━ */}
        {tab === "franchises" && (
          <div className="space-y-2">
            {FRANCHISES.map((f, i) => {
              const isExp = expanded === i;
              return (
                <div key={f.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#111]">{f.nom}</p>
                      <p className="text-[10px] text-[#6B7280]">{f.franchise} · {f.ville}, {f.pays}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#D4AF37]">{f.ca} EUR</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Abonnes</span><p className="font-bold">{f.abonnes}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Contrat</span><p className="font-bold">{f.contrat}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Echeance</span><p className="font-bold">{f.echeance}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Performance</span><p className="font-bold text-green-600">{f.performance}%</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━ EMPLOYES ━━━━ */}
        {tab === "employes" && (
          <div className="space-y-2">
            {EMPLOYES_DIR.map((e, i) => {
              const isExp = expanded === i;
              return (
                <div key={e.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#D4AF37]/10 grid place-items-center"><Users size={14} className="text-[#D4AF37]" /></div>
                      <div>
                        <p className="text-sm font-bold text-[#111]">{e.nom}</p>
                        <p className="text-[10px] text-[#6B7280]">{e.fonction} · {e.dept}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${e.productivite >= 90 ? "text-green-600" : "text-amber-600"}`}>{e.productivite}%</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Presence</span><p className="font-bold">{e.presence}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Objectif</span><p className="font-bold">{e.objectif}%</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Salaire</span><p className="font-bold">{e.salaire} EUR</p></div>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={() => navigate("/superadmin/admin-employes")} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Users size={14} /> Gestion complete des employes</button>
          </div>
        )}

        {/* ━━━━ FINANCIER ━━━━ */}
        {tab === "financier" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate("/comptabilite/paiements")} className="rounded-xl bg-white border border-[#E5E7EB] p-3"><TrendingUp size={14} className="text-green-500 mb-1" /><p className="text-lg font-black text-green-600">342 800 EUR</p><p className="text-[9px] text-[#6B7280]">Encaissements</p></button>
              <button onClick={() => navigate("/comptabilite/paiements")} className="rounded-xl bg-white border border-[#E5E7EB] p-3"><TrendingDown size={14} className="text-red-500 mb-1" /><p className="text-lg font-black text-red-500">157 600 EUR</p><p className="text-[9px] text-[#6B7280]">Decaissements</p></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate("/comptabilite/tva")} className="rounded-xl bg-white border border-[#E5E7EB] p-3"><p className="text-lg font-black text-amber-600">23 940 EUR</p><p className="text-[9px] text-[#6B7280]">TVA collectee</p></button>
              <button onClick={() => navigate("/comptabilite/facturation")} className="rounded-xl bg-white border border-[#E5E7EB] p-3"><p className="text-lg font-black text-[#D4AF37]">185 200 EUR</p><p className="text-[9px] text-[#6B7280]">Benefice net</p></button>
            </div>
            {[
              { label: "Marges moyennes", value: "38%", nav: "/comptabilite/analytique" },
              { label: "Tresorerie disponible", value: "342 800 EUR", nav: "/operations/m-k-a-p-m-s-banque" },
              { label: "Prevision Q3", value: "+15% estime", nav: "/comptabilite/rapports" },
              { label: "Investissements en cours", value: "125 000 EUR", nav: "/comptabilite/centre-pilotage" },
            ].map(r => (
              <button key={r.label} onClick={() => navigate(r.nav)} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between active:scale-[0.98] transition">
                <span className="text-sm font-semibold text-[#111]">{r.label}</span>
                <span className="text-sm font-black text-[#D4AF37]">{r.value}</span>
              </button>
            ))}
          </div>
        )}

        {/* ━━━━ ABONNEMENTS ━━━━ */}
        {tab === "abonnements" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Nouveaux ce mois" value="85" color="text-green-600" onClick={() => navigate("/comptabilite/abonnements")} />
              <StatCard label="Renouvellements" value="42" color="text-blue-600" onClick={() => navigate("/comptabilite/abonnements")} />
              <StatCard label="Resiliations" value="8" color="text-red-500" onClick={() => navigate("/comptabilite/abonnements")} />
              <StatCard label="Revenu mensuel" value="18 500 EUR" color="text-[#D4AF37]" onClick={() => navigate("/comptabilite/abonnements")} />
            </div>
            <SectionCard title="Repartition par categorie" icon={CreditCard}>
              {[
                { cat: "Vente Pro", actifs: 57, revenu: "5 073 EUR" },
                { cat: "Location Pro", actifs: 67, revenu: "5 963 EUR" },
                { cat: "Garage Pro", actifs: 62, revenu: "4 518 EUR" },
                { cat: "Carrosserie", actifs: 18, revenu: "1 062 EUR" },
                { cat: "Encheres Pro", actifs: 15, revenu: "735 EUR" },
                { cat: "Comptabilite", actifs: 22, revenu: "1 298 EUR" },
                { cat: "VTC & Taxi", actifs: 34, revenu: "3 026 EUR" },
                { cat: "Pieces", actifs: 28, revenu: "1 652 EUR" },
                { cat: "Finance+", actifs: 12, revenu: "1 548 EUR" },
                { cat: "Electric+", actifs: 8, revenu: "792 EUR" },
                { cat: "Franchise", actifs: 3, revenu: "1 497 EUR" },
              ].map(c => (
                <button key={c.cat} onClick={() => navigate("/comptabilite/abonnements")} className="w-full flex items-center justify-between px-3 py-2 border-b border-[#F3F4F6] last:border-0 active:bg-[#F5F3EF] transition">
                  <span className="text-xs font-semibold text-[#111]">{c.cat} <span className="text-[#6B7280]">({c.actifs})</span></span>
                  <span className="text-xs font-bold text-[#D4AF37]">{c.revenu}/mois</span>
                </button>
              ))}
            </SectionCard>
          </div>
        )}

        {/* ━━━━ COMMERCIAL ━━━━ */}
        {tab === "commercial" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Vehicules vendus", value: "47", color: "text-green-600" },
                { label: "Vehicules loues", value: "156", color: "text-blue-600" },
                { label: "Reprises", value: "12", color: "text-purple-600" },
                { label: "Encheres", value: "12", color: "text-[#D4AF37]" },
                { label: "Pieces vendues", value: "456", color: "text-orange-600" },
                { label: "Devis realises", value: "89", color: "text-slate-600" },
                { label: "Devis acceptes", value: "67", color: "text-green-600" },
                { label: "Taux conversion", value: "75%", color: "text-[#D4AF37]" },
              ].map(s => <StatCard key={s.label} {...s} />)}
            </div>
          </div>
        )}

        {/* ━━━━ MARKETING ━━━━ */}
        {tab === "marketing" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Pubs actives" value="5" color="text-[#D4AF37]" onClick={() => navigate("/comptabilite/publicites")} />
              <StatCard label="Revenus pub" value="13 000 EUR" color="text-green-600" onClick={() => navigate("/comptabilite/publicites")} />
              <StatCard label="Impressions" value="48.3k" color="text-blue-600" onClick={() => navigate("/comptabilite/publicites")} />
              <StatCard label="Clics" value="1 288" color="text-purple-600" onClick={() => navigate("/comptabilite/publicites")} />
            </div>
            {[
              { label: "ROI campagnes", value: "+340%" },
              { label: "QR codes scannes", value: "2 450" },
              { label: "Domaine le plus visite", value: "mkapms.fr" },
              { label: "CTR moyen", value: "2.67%" },
            ].map(r => (
              <button key={r.label} onClick={() => navigate("/comptabilite/publicites")} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between active:scale-[0.98]">
                <span className="text-sm font-semibold text-[#111]">{r.label}</span>
                <span className="text-sm font-black text-[#D4AF37]">{r.value}</span>
              </button>
            ))}
          </div>
        )}

        {/* ━━━━ ELECTRIC+ ━━━━ */}
        {tab === "electric" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Bornes installees", value: "24", color: "text-green-600" },
                { label: "Bornes disponibles", value: "18", color: "text-blue-600" },
                { label: "Bornes hors service", value: "2", color: "text-red-500" },
                { label: "Recharges ce mois", value: "180", color: "text-[#D4AF37]" },
                { label: "Revenus Electric+", value: "9 400 EUR", color: "text-green-600" },
                { label: "Cartes actives", value: "145", color: "text-purple-600" },
              ].map(s => <StatCard key={s.label} {...s} />)}
            </div>
            <button className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between"><span className="text-sm font-semibold text-[#111]">Consommation energetique</span><span className="text-sm font-black text-[#D4AF37]">12 450 kWh</span></button>
          </div>
        )}

        {/* ━━━━ FINANCE+ ━━━━ */}
        {tab === "finance_plus" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Demandes financement", value: "34", color: "text-blue-600" },
                { label: "Dossiers valides", value: "22", color: "text-green-600" },
                { label: "Dossiers refuses", value: "8", color: "text-red-500" },
                { label: "En cours traitement", value: "4", color: "text-amber-600" },
                { label: "Paiements recus", value: "15 800 EUR", color: "text-[#D4AF37]" },
                { label: "Encours total", value: "245 000 EUR", color: "text-purple-600" },
              ].map(s => <StatCard key={s.label} {...s} />)}
            </div>
            <button className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between"><span className="text-sm font-semibold text-[#111]">Prochaines echeances</span><span className="text-sm font-black text-amber-600">12 dossiers</span></button>
          </div>
        )}

        {/* ━━━━ ENCHERES ━━━━ */}
        {tab === "encheres" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Encheres en cours", value: "8", color: "text-[#D4AF37]" },
                { label: "Vehicules vendus", value: "12", color: "text-green-600" },
                { label: "Prix moyen", value: "38 500 EUR", color: "text-blue-600" },
                { label: "Revenus", value: "28 950 EUR", color: "text-[#D4AF37]" },
              ].map(s => <StatCard key={s.label} {...s} />)}
            </div>
            <SectionCard title="Meilleurs acheteurs" icon={Users}>
              {["Pierre K. — 3 vehicules", "Marc D. — 2 vehicules", "Top Auto — 2 vehicules"].map(b => (
                <div key={b} className="px-3 py-2 border-b border-[#F3F4F6] last:border-0 text-xs text-[#111]">{b}</div>
              ))}
            </SectionCard>
          </div>
        )}

        {/* ━━━━ GARAGE+ ━━━━ */}
        {tab === "garage" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Vehicules en atelier", value: "23", color: "text-blue-600" },
                { label: "Temps moyen interv.", value: "3.2h", color: "text-[#D4AF37]" },
                { label: "Productivite", value: "88%", color: "text-green-600" },
                { label: "Satisfaction client", value: "4.7/5", color: "text-[#D4AF37]" },
                { label: "Stock pieces", value: "1 245", color: "text-purple-600" },
                { label: "Alertes stock", value: "3", color: "text-red-500" },
              ].map(s => <StatCard key={s.label} {...s} />)}
            </div>
          </div>
        )}

        {/* ━━━━ CARROSSERIE ━━━━ */}
        {tab === "carrosserie" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Dossiers ouverts", value: "15", color: "text-blue-600" },
                { label: "Dossiers termines", value: "42", color: "text-green-600" },
                { label: "Temps moyen", value: "5.8j", color: "text-[#D4AF37]" },
                { label: "CA carrosserie", value: "18 900 EUR", color: "text-[#D4AF37]" },
                { label: "Satisfaction", value: "4.5/5", color: "text-green-600" },
              ].map(s => <StatCard key={s.label} {...s} />)}
            </div>
          </div>
        )}

        {/* ━━━━ ALERTES ━━━━ */}
        {tab === "alertes" && (
          <div className="space-y-2">
            {ALERTES.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className={`rounded-xl ${a.bg} border border-[#E5E7EB] p-3 flex items-start gap-3`}>
                  <div className="mt-0.5"><Icon size={14} className={a.color} /></div>
                  <p className={`text-xs font-semibold ${a.color}`}>{a.msg}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━ JOURNAL STRATEGIQUE ━━━━ */}
        {tab === "journal" && (
          <div className="space-y-2">
            {JOURNAL_STRAT.map((j, i) => (
              <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <p className="text-sm font-bold text-[#111]">{j.action}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-[#6B7280]">
                  <span>{j.user}</span>
                  <span>{j.dept}</span>
                  <span>{j.date}</span>
                  <span>IP: {j.ip}</span>
                </div>
              </div>
            ))}
            <button onClick={() => navigate("/journal-activite")} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Clock size={14} /> Journal complet</button>
          </div>
        )}

        {/* ━━━━ IA MKA.P-MS ━━━━ */}
        {tab === "ia" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={16} className="text-[#D4AF37]" />
                <p className="text-sm font-bold text-white">Assistant MKA.P-MS</p>
              </div>
              <p className="text-[10px] text-white/50">Analyse automatique des performances, tendances et recommandations strategiques.</p>
            </div>
            {IA_RECOMMANDATIONS.map((r, i) => (
              <div key={i} className={`rounded-xl border p-4 ${r.type === "alerte" ? "bg-red-50 border-red-200" : r.type === "opportunite" ? "bg-green-50 border-green-200" : r.type === "prevision" ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}`}>
                <p className={`text-xs font-bold mb-1 ${r.type === "alerte" ? "text-red-700" : r.type === "opportunite" ? "text-green-700" : r.type === "prevision" ? "text-blue-700" : "text-amber-700"}`}>{r.titre}</p>
                <p className={`text-[11px] leading-snug ${r.type === "alerte" ? "text-red-600" : r.type === "opportunite" ? "text-green-600" : r.type === "prevision" ? "text-blue-600" : "text-amber-600"}`}>{r.detail}</p>
              </div>
            ))}
          </div>
        )}

        {/* ━━━━ PARAMETRES STRATEGIQUES ━━━━ */}
        {tab === "parametres" && (
          <div className="space-y-2">
            {[
              { label: "Abonnements & Tarifs", path: "/comptabilite/abonnements", icon: CreditCard },
              { label: "Commissions", path: "/superadmin/admin-commissions", icon: Euro },
              { label: "Pays disponibles", path: "/comptabilite/centre-pilotage", icon: Globe },
              { label: "Langues & Devises", path: "/comptabilite/centre-pilotage", icon: Globe },
              { label: "Taxes & TVA", path: "/comptabilite/tva", icon: FileText },
              { label: "Roles & Permissions", path: "/superadmin/admin-employes", icon: Shield },
              { label: "Modules actives", path: "/superadmin", icon: Settings },
              { label: "Integrations API", path: "/superadmin", icon: Zap },
              { label: "Securite", path: "/superadmin", icon: Shield },
            ].map(p => {
              const Icon = p.icon;
              return (
                <button key={p.label} onClick={() => navigate(p.path)} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3 active:scale-[0.98] transition">
                  <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/10 grid place-items-center"><Icon size={14} className="text-[#D4AF37]" /></div>
                  <span className="text-sm font-semibold text-[#111]">{p.label}</span>
                  <ChevronDown size={12} className="ml-auto text-[#9CA3AF] -rotate-90" />
                </button>
              );
            })}
          </div>
        )}

        {/* ━━━━ CONSEIL D'ADMINISTRATION ━━━━ */}
        {tab === "conseil" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-[#D4AF37]" />
                <p className="text-sm font-bold text-white">Module Conseil d'Administration</p>
              </div>
              <p className="text-[10px] text-white/50">Reserve PDG & Associes — Decisions strategiques, acquisitions, investissements</p>
            </div>

            <SectionCard title="Projets en cours" icon={Target}>
              {CONSEIL_PROJETS.map((p, i) => (
                <button key={i} onClick={() => showToast(`Detail projet: ${p.projet}`)} className="w-full text-left px-3 py-2.5 border-b border-[#F3F4F6] last:border-0 active:bg-[#F5F3EF] transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#111]">{p.projet}</p>
                      <p className="text-[10px] text-[#6B7280]">{p.responsable} · {p.echeance}</p>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${p.statut === "En cours" ? "bg-green-50 text-green-700" : p.statut === "Negociation" ? "bg-amber-50 text-amber-700" : p.statut === "En preparation" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{p.statut}</span>
                      <p className="text-[10px] font-bold text-[#D4AF37] mt-0.5">{p.budget}</p>
                    </div>
                  </div>
                </button>
              ))}
            </SectionCard>

            <SectionCard title="Objectifs strategiques" icon={Award}>
              {[
                { label: "Objectif 1 an", detail: "50 garages, 10 franchises, 15 pays" },
                { label: "Objectif 3 ans", detail: "200 garages, 30 franchises, 25 pays, 50M EUR CA" },
                { label: "Objectif 5 ans", detail: "Leader africain automobile, IPO possible" },
                { label: "Objectif 10 ans", detail: "Groupe international, presence sur 5 continents" },
              ].map(o => (
                <div key={o.label} className="px-3 py-2.5 border-b border-[#F3F4F6] last:border-0">
                  <p className="text-xs font-bold text-[#111]">{o.label}</p>
                  <p className="text-[10px] text-[#6B7280]">{o.detail}</p>
                </div>
              ))}
            </SectionCard>

            <SectionCard title="Budget annuel 2026" icon={Euro}>
              {[
                { poste: "Expansion internationale", budget: "250 000 EUR" },
                { poste: "Marketing & Publicite", budget: "120 000 EUR" },
                { poste: "Developpement plateforme", budget: "180 000 EUR" },
                { poste: "Masse salariale", budget: "420 000 EUR" },
                { poste: "Infrastructure & Serveurs", budget: "45 000 EUR" },
                { poste: "Acquisitions garages", budget: "200 000 EUR" },
              ].map(b => (
                <div key={b.poste} className="flex items-center justify-between px-3 py-2 border-b border-[#F3F4F6] last:border-0">
                  <span className="text-xs font-semibold text-[#111]">{b.poste}</span>
                  <span className="text-xs font-black text-[#D4AF37]">{b.budget}</span>
                </div>
              ))}
            </SectionCard>
          </div>
        )}
        {/* ━━━━ AUTOMATISATION ━━━━ */}
        {tab === "automatisation" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="rounded-xl bg-green-50 border border-green-200 p-2 text-center"><p className="text-lg font-black text-green-700">{AUTOMATIONS.filter(a => a.statut === "actif").length}</p><p className="text-[8px] text-green-600">Actifs</p></div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-center"><p className="text-lg font-black text-amber-700">{AUTOMATIONS.filter(a => a.statut === "pause").length}</p><p className="text-[8px] text-amber-600">En pause</p></div>
              <div className="rounded-xl bg-red-50 border border-red-200 p-2 text-center"><p className="text-lg font-black text-red-700">{AUTOMATIONS.filter(a => a.statut === "erreur").length}</p><p className="text-[8px] text-red-600">En erreur</p></div>
            </div>
            {AUTOMATIONS.map((a, i) => {
              const isExp = expanded === i;
              return (
                <div key={a.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${a.statut === "actif" ? "bg-green-500" : a.statut === "pause" ? "bg-amber-500" : "bg-red-500"}`} />
                      <div>
                        <p className="text-sm font-bold text-[#111]">{a.nom}</p>
                        <p className="text-[10px] text-[#6B7280]">{a.categorie}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${a.statut === "actif" ? "bg-green-50 text-green-700" : a.statut === "pause" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{a.statut}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Executions</span><p className="font-bold">{a.executions.toLocaleString()}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Derniere</span><p className="font-bold">{a.derniere}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Erreurs</span><p className={`font-bold ${a.erreurs > 0 ? "text-red-600" : "text-green-600"}`}>{a.erreurs}</p></div>
                      <button onClick={() => showToast(`Workflow "${a.nom}" relance`)} className="col-span-3 rounded-lg bg-[#111] py-2 text-[10px] font-bold text-[#D4AF37] flex items-center justify-center gap-1"><RefreshCw size={10} /> Relancer</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━ API & INTEGRATIONS ━━━━ */}
        {tab === "api" && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="rounded-xl bg-green-50 border border-green-200 p-2 text-center"><p className="text-lg font-black text-green-700">{API_INTEGRATIONS.filter(a => a.statut === "connecte").length}</p><p className="text-[8px] text-green-600">Connectes</p></div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-center"><p className="text-lg font-black text-amber-700">{API_INTEGRATIONS.filter(a => a.statut === "en_test").length}</p><p className="text-[8px] text-amber-600">En test</p></div>
              <div className="rounded-xl bg-red-50 border border-red-200 p-2 text-center"><p className="text-lg font-black text-red-700">{API_INTEGRATIONS.filter(a => a.statut === "desactive").length}</p><p className="text-[8px] text-red-600">Desactives</p></div>
            </div>
            {API_INTEGRATIONS.map((a, i) => {
              const isExp = expanded === i;
              return (
                <div key={a.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#111]">{a.nom}</p>
                      <p className="text-[10px] text-[#6B7280]">{a.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${a.statut === "connecte" ? "bg-green-50 text-green-700" : a.statut === "en_test" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{a.statut}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Derniere sync</span><p className="font-bold">{a.sync}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Version</span><p className="font-bold">{a.version}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━ SURVEILLANCE SERVEURS ━━━━ */}
        {tab === "surveillance" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-green-600 to-green-700 p-4">
              <p className="text-xs text-white/60 uppercase">Statut global</p>
              <p className="text-2xl font-black text-white">Tous les systemes operationnels</p>
              <p className="text-xs text-white/70 mt-1">Derniere verification: 09/06/2026 18:10</p>
            </div>
            {SERVEURS.map((s, i) => {
              const isExp = expanded === i;
              return (
                <div key={s.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server size={14} className="text-[#D4AF37]" />
                      <div>
                        <p className="text-sm font-bold text-[#111]">{s.nom}</p>
                        <p className="text-[10px] text-green-600 font-bold">Disponibilite: {s.disponibilite}</p>
                      </div>
                    </div>
                    <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Temps reponse</span><p className="font-bold">{s.reponse}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">CPU</span><p className="font-bold">{s.cpu}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">RAM</span><p className="font-bold">{s.ram}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Stockage</span><p className="font-bold">{s.stockage}</p></div>
                      <div className="col-span-2 rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">SSL</span><p className="font-bold">{s.ssl}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━ SECURITE ━━━━ */}
        {tab === "securite" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Sessions actives", value: "12", color: "text-blue-600" },
                { label: "2FA actives", value: "8/12", color: "text-green-600" },
                { label: "Comptes verrouilles", value: "1", color: "text-red-500" },
                { label: "Tentatives echouees (24h)", value: "7", color: "text-amber-600" },
              ].map(s => <StatCard key={s.label} {...s} />)}
            </div>
            <SectionCard title="Historique des connexions" icon={Lock}>
              {SECURITE_DATA.map((s, i) => (
                <button key={i} onClick={() => s.type === "bloque" ? showToast(`Compte ${s.user} deverrouille`) : s.type === "echec" ? showToast(`IP ${s.ip} bloquee`) : showToast(`Detail: ${s.event}`)} className="w-full text-left px-3 py-2.5 border-b border-[#F3F4F6] last:border-0 active:bg-[#F5F3EF] transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#111]">{s.event}</p>
                      <p className="text-[10px] text-[#6B7280]">{s.user} · {s.appareil}</p>
                    </div>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${s.type === "succes" ? "bg-green-50 text-green-700" : s.type === "echec" ? "bg-red-50 text-red-700" : s.type === "bloque" ? "bg-red-50 text-red-700" : s.type === "admin" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}>{s.type}</span>
                  </div>
                  <p className="text-[9px] text-[#9CA3AF] mt-0.5">{s.date} · IP: {s.ip}</p>
                </button>
              ))}
            </SectionCard>
            <button onClick={() => showToast("Toutes les sessions sauf la votre fermees")} className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97]"><Lock size={14} /> Fermer toutes les sessions</button>
          </div>
        )}

        {/* ━━━━ CLIENTS ━━━━ */}
        {tab === "clients" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Total clients" value={totalClients.toLocaleString()} color="text-[#D4AF37]" />
              <StatCard label="Particuliers" value={(totalClients - totalPros).toLocaleString()} color="text-blue-600" />
              <StatCard label="Professionnels" value={totalPros.toLocaleString()} color="text-purple-600" />
            </div>
            {CLIENTS_DATA.map((c, i) => {
              const isExp = expanded === i;
              return (
                <div key={c.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#D4AF37]/10 grid place-items-center"><UserCircle size={14} className="text-[#D4AF37]" /></div>
                      <div>
                        <p className="text-sm font-bold text-[#111]">{c.nom}</p>
                        <p className="text-[10px] text-[#6B7280]">{c.type} · {c.fidelite}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#D4AF37]">{c.paiements}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Achats</span><p className="font-bold">{c.achats}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Ventes</span><p className="font-bold">{c.ventes}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Locations</span><p className="font-bold">{c.locations}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Messages</span><p className="font-bold">{c.messages}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Reclamations</span><p className={`font-bold ${c.reclamations > 0 ? "text-red-600" : "text-green-600"}`}>{c.reclamations}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Fidelite</span><p className="font-bold text-[#D4AF37]">{c.fidelite}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━ PROFESSIONNELS ━━━━ */}
        {tab === "professionnels" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Total pros" value={totalPros.toLocaleString()} color="text-[#D4AF37]" />
              <StatCard label="KYC verifies" value={PROS_DATA.filter(p => p.kyc === "Verifie").length.toString()} color="text-green-600" />
              <StatCard label="En attente KYC" value={PROS_DATA.filter(p => p.kyc === "En attente").length.toString()} color="text-amber-600" />
            </div>
            {PROS_DATA.map((p, i) => {
              const isExp = expanded === i;
              return (
                <div key={p.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#D4AF37]/10 grid place-items-center"><Briefcase size={14} className="text-[#D4AF37]" /></div>
                      <div>
                        <p className="text-sm font-bold text-[#111]">{p.nom}</p>
                        <p className="text-[10px] text-[#6B7280]">{p.type} · {p.abonnement}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${p.performance >= 90 ? "text-green-600" : "text-amber-600"}`}>{p.performance}%</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">CA</span><p className="font-bold text-[#D4AF37]">{p.ca}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Annonces</span><p className="font-bold">{p.annonces}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Note</span><p className="font-bold">{p.note}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">KYC</span><p className={`font-bold ${p.kyc === "Verifie" ? "text-green-600" : "text-amber-600"}`}>{p.kyc}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━ DOCUMENTS ━━━━ */}
        {tab === "documents" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Total documents" value={DOCUMENTS_DATA.length.toString()} color="text-[#D4AF37]" />
              <StatCard label="Categories" value="8" color="text-blue-600" />
            </div>
            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2 flex items-center gap-2"><Search size={12} className="text-[#D4AF37]" /><span className="text-xs font-bold text-[#D4AF37]">Recherche rapide</span></div>
              <div className="p-3"><input className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs" placeholder="Rechercher un document..." /></div>
            </div>
            {DOCUMENTS_DATA.map((d, i) => {
              const isExp = expanded === i;
              return (
                <div key={d.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen size={14} className="text-[#D4AF37]" />
                      <div>
                        <p className="text-sm font-bold text-[#111]">{d.nom}</p>
                        <p className="text-[10px] text-[#6B7280]">{d.categorie} · {d.date}</p>
                      </div>
                    </div>
                    <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Taille</span><p className="font-bold">{d.taille}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Versions</span><p className="font-bold">{d.versions}</p></div>
                      <button onClick={() => showToast(`Telechargement: ${d.nom}`)} className="rounded-lg bg-[#111] p-2 text-[#D4AF37] font-bold flex items-center justify-center gap-1"><Download size={10} /> PDF</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━ SAUVEGARDE ━━━━ */}
        {tab === "sauvegarde" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Derniere sauvegarde" value="09/06 03:00" color="text-green-600" />
              <StatCard label="Taille totale" value="2.8 GB" color="text-blue-600" />
            </div>
            <button onClick={() => showToast("Sauvegarde manuelle lancee...")} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Database size={14} /> Lancer une sauvegarde manuelle</button>
            <SectionCard title="Historique des sauvegardes" icon={Archive}>
              {SAUVEGARDES.map((s, i) => (
                <button key={i} onClick={() => s.statut === "succes" ? showToast(`Restauration depuis ${s.date} lancee`) : showToast("Impossible: sauvegarde echouee")} className="w-full text-left px-3 py-2.5 border-b border-[#F3F4F6] last:border-0 active:bg-[#F5F3EF] transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#111]">{s.type}</p>
                      <p className="text-[10px] text-[#6B7280]">{s.date} · {s.taille} · {s.duree}</p>
                    </div>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${s.statut === "succes" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{s.statut}</span>
                  </div>
                </button>
              ))}
            </SectionCard>
            <SectionCard title="Restauration selective" icon={RefreshCw}>
              {["Base de donnees complete", "Module Comptabilite", "Documents & Factures", "Comptes utilisateurs", "Configuration systeme"].map(r => (
                <button key={r} onClick={() => showToast(`Restauration "${r}" lancee`)} className="w-full text-left px-3 py-2.5 border-b border-[#F3F4F6] last:border-0 active:bg-[#F5F3EF] transition flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#111]">{r}</span>
                  <RefreshCw size={12} className="text-[#D4AF37]" />
                </button>
              ))}
            </SectionCard>
          </div>
        )}

        {/* ━━━━ ANALYSE STRATEGIQUE ━━━━ */}
        {tab === "analyse_strat" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <p className="text-xs text-white/60 uppercase">Analyse automatique</p>
              <p className="text-lg font-black text-[#D4AF37]">5 recommandations strategiques</p>
              <p className="text-[10px] text-white/40">Derniere analyse: 09/06/2026</p>
            </div>
            <SectionCard title="Services les plus rentables" icon={TrendingUp}>
              {[
                { service: "Abonnements", marge: "90%", tendance: "+19.8%" },
                { service: "Publicites", marge: "85%", tendance: "-3.2%" },
                { service: "Finance+", marge: "60%", tendance: "+25.3%" },
                { service: "Electric+", marge: "55%", tendance: "+45.2%" },
                { service: "Depannage", marge: "45%", tendance: "+11.4%" },
              ].map(s => (
                <div key={s.service} className="flex items-center justify-between px-3 py-2 border-b border-[#F3F4F6] last:border-0">
                  <span className="text-xs font-semibold text-[#111]">{s.service}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#D4AF37]">Marge {s.marge}</span>
                    <span className={`text-[10px] font-bold ${s.tendance.startsWith("+") ? "text-green-600" : "text-red-500"}`}>{s.tendance}</span>
                  </div>
                </div>
              ))}
            </SectionCard>
            <SectionCard title="Pays les plus performants" icon={Globe}>
              {PAYS_DATA.filter(p => p.statut === "actif").sort((a, b) => b.ca - a.ca).slice(0, 5).map(p => (
                <div key={p.pays} className="flex items-center justify-between px-3 py-2 border-b border-[#F3F4F6] last:border-0">
                  <span className="text-xs font-semibold text-[#111]">{p.pays}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#D4AF37]">{p.ca.toLocaleString()} EUR</span>
                    <span className={`text-[10px] font-bold ${p.up ? "text-green-600" : "text-red-500"}`}>{p.pct}</span>
                  </div>
                </div>
              ))}
            </SectionCard>
            <SectionCard title="Depenses inhabituelles" icon={AlertTriangle}>
              {[
                { depense: "Marketing Google Ads", montant: "+16% vs budget", gravite: "haute" },
                { depense: "Frais serveur supplementaires", montant: "+8% vs prevu", gravite: "moyenne" },
              ].map(d => (
                <div key={d.depense} className="flex items-center justify-between px-3 py-2.5 border-b border-[#F3F4F6] last:border-0">
                  <span className="text-xs font-semibold text-[#111]">{d.depense}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${d.gravite === "haute" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{d.montant}</span>
                </div>
              ))}
            </SectionCard>
          </div>
        )}

        {/* ━━━━ CROISSANCE MONDIALE ━━━━ */}
        {tab === "croissance" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <p className="text-xs text-white/60 uppercase">Expansion internationale</p>
              <p className="text-2xl font-black text-[#D4AF37]">{PAYS_DATA.filter(p => p.statut === "actif").length + CROISSANCE_PAYS.length} pays</p>
              <p className="text-xs text-white/50">{PAYS_DATA.filter(p => p.statut === "actif").length} actifs · {CROISSANCE_PAYS.length} en expansion</p>
            </div>
            {CROISSANCE_PAYS.map((p, i) => {
              const isExp = expanded === i;
              return (
                <div key={p.pays} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-[#D4AF37]" />
                      <div>
                        <p className="text-sm font-bold text-[#111]">{p.pays}</p>
                        <p className="text-[10px] text-[#6B7280]">{p.etape} · Lancement: {p.lancement}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 rounded-full bg-[#E5E7EB]"><div className="h-2 rounded-full bg-[#D4AF37]" style={{ width: `${p.avancement}%` }} /></div>
                      <span className="text-[10px] font-bold text-[#D4AF37]">{p.avancement}%</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Reglementation</span><p className="font-bold">{p.reglementation}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Paiements</span><p className="font-bold">{p.paiement}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Partenaires</span><p className="font-bold">{p.partenaires}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Lancement</span><p className="font-bold text-[#D4AF37]">{p.lancement}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━ TABLEAU EXECUTIF ━━━━ */}
        {tab === "executif" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <p className="text-[10px] text-white/40 uppercase">Synthese globale PDG</p>
              <p className="text-3xl font-black text-[#D4AF37]">{totalCA.toLocaleString("fr-FR")} EUR</p>
              <p className="text-xs text-green-400 flex items-center gap-1 mt-1"><TrendingUp size={12} /> +14.8% vs mois precedent</p>
            </div>
            <SectionCard title="Indicateurs financiers" icon={Euro}>
              {[
                { label: "Benefice net", value: "185 200 EUR", color: "text-green-600" },
                { label: "Tresorerie", value: "342 800 EUR", color: "text-blue-600" },
                { label: "TVA collectee", value: "23 940 EUR", color: "text-amber-600" },
                { label: "Encours Finance+", value: "245 000 EUR", color: "text-purple-600" },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between px-3 py-2 border-b border-[#F3F4F6] last:border-0">
                  <span className="text-xs font-semibold text-[#111]">{f.label}</span>
                  <span className={`text-xs font-black ${f.color}`}>{f.value}</span>
                </div>
              ))}
            </SectionCard>
            <SectionCard title="Activite commerciale" icon={Car}>
              {[
                { label: "Vehicules vendus", value: "47" },
                { label: "Vehicules loues", value: "156" },
                { label: "Encheres conclues", value: "12" },
                { label: "Pieces vendues", value: "456" },
              ].map(a => (
                <div key={a.label} className="flex items-center justify-between px-3 py-2 border-b border-[#F3F4F6] last:border-0">
                  <span className="text-xs font-semibold text-[#111]">{a.label}</span>
                  <span className="text-xs font-black text-[#D4AF37]">{a.value}</span>
                </div>
              ))}
            </SectionCard>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Sante serveurs" value="99.98%" color="text-green-600" onClick={() => setTab("surveillance")} />
              <StatCard label="Satisfaction clients" value="4.7/5" color="text-[#D4AF37]" onClick={() => setTab("clients")} />
              <StatCard label="Alertes critiques" value="2" color="text-red-500" onClick={() => setTab("alertes")} />
              <StatCard label="Decisions en attente" value="3" color="text-amber-600" onClick={() => setTab("conseil")} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Employes actifs" value={totalEmployes.toString()} color="text-blue-600" onClick={() => setTab("employes")} />
              <StatCard label="Objectifs atteints" value="8/12" color="text-green-600" onClick={() => setTab("performance")} />
            </div>
          </div>
        )}

        {/* ━━━━ INNOVATION & R&D ━━━━ */}
        {tab === "innovation" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-[#D4AF37]" />
                <p className="text-sm font-bold text-white">Centre d'Innovation & R&D</p>
              </div>
              <p className="text-[10px] text-white/50">Gestion des futures fonctionnalites, prototypes et feuilles de route</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Projets actifs" value={INNOVATION_PROJETS.filter(p => p.statut !== "Idee").length.toString()} color="text-[#D4AF37]" />
              <StatCard label="En R&D" value={INNOVATION_PROJETS.filter(p => p.phase === "R&D").length.toString()} color="text-blue-600" />
              <StatCard label="En beta" value={INNOVATION_PROJETS.filter(p => p.phase === "Beta").length.toString()} color="text-green-600" />
            </div>
            {INNOVATION_PROJETS.map((p, i) => {
              const isExp = expanded === i;
              return (
                <div key={p.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={14} className="text-[#D4AF37]" />
                      <div>
                        <p className="text-sm font-bold text-[#111]">{p.nom}</p>
                        <p className="text-[10px] text-[#6B7280]">{p.equipe} · {p.phase}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 rounded-full bg-[#E5E7EB]"><div className="h-2 rounded-full bg-[#D4AF37]" style={{ width: `${p.avancement}%` }} /></div>
                      <span className="text-[10px] font-bold text-[#D4AF37]">{p.avancement}%</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Statut</span><p className="font-bold">{p.statut}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Debut</span><p className="font-bold">{p.debut}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Priorite</span><p className={`font-bold ${p.priorite === "Haute" ? "text-red-600" : p.priorite === "Moyenne" ? "text-amber-600" : "text-blue-600"}`}>{p.priorite}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════ PARTIE 4 — Vision Strategique & Gouvernance (42-55) ═══════ */}

        {/* 42. CENTRE R&D */}
        {tab === "rd" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Projets actifs" value={String(RD_PROJETS.length)} color="text-[#D4AF37]" onClick={() => showToast("Projets R&D actifs")} />
              <StatCard label="Budget total" value="315K EUR" color="text-green-600" onClick={() => navigate("/comptabilite/paiements")} />
              <StatCard label="Approuves" value={String(RD_PROJETS.filter(p => p.validation === "Approuve").length)} color="text-blue-600" onClick={() => showToast("Projets approuves par la Direction")} />
            </div>
            {RD_PROJETS.map((p, i) => {
              const isExp = expanded === i;
              return (
                <div key={p.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Rocket size={14} className="text-[#D4AF37]" />
                      <div><p className="text-sm font-bold text-[#111]">{p.nom}</p><p className="text-[10px] text-[#6B7280]">{p.categorie} · {p.responsable}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 rounded-full bg-[#E5E7EB]"><div className="h-2 rounded-full bg-[#D4AF37]" style={{ width: `${p.avancement}%` }} /></div>
                      <span className="text-[10px] font-bold text-[#D4AF37]">{p.avancement}%</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Budget</span><p className="font-bold">{p.budget}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Cible</span><p className="font-bold">{p.cible}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Validation</span><p className={`font-bold ${p.validation === "Approuve" ? "text-green-600" : "text-amber-600"}`}>{p.validation}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 43. CENTRE INNOVATION */}
        {tab === "centre_innovation" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Idees soumises" value={String(IDEES_INNOVATION.length)} color="text-[#D4AF37]" />
              <StatCard label="Approuvees" value={String(IDEES_INNOVATION.filter(i => i.decision === "Approuve").length)} color="text-green-600" />
              <StatCard label="En etude" value={String(IDEES_INNOVATION.filter(i => i.decision === "En etude").length)} color="text-amber-600" />
            </div>
            {IDEES_INNOVATION.map((idee, i) => {
              const isExp = expanded === i;
              return (
                <div key={idee.titre} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div><p className="text-sm font-bold text-[#111]">{idee.titre}</p><p className="text-[10px] text-[#6B7280]">{idee.auteur} · {idee.date}</p></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${idee.decision === "Approuve" ? "text-green-600" : idee.decision === "En etude" ? "text-amber-600" : "text-[#6B7280]"}`}>{idee.decision}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Impact</span><p className="font-bold">{idee.impact}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Cout</span><p className="font-bold">{idee.cout}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Difficulte</span><p className={`font-bold ${idee.difficulte === "Haute" ? "text-red-600" : idee.difficulte === "Moyenne" ? "text-amber-600" : "text-green-600"}`}>{idee.difficulte}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 44. INVESTISSEURS */}
        {tab === "investisseurs" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-white">
              <p className="text-[10px] text-white/50 uppercase">Valorisation estimee</p>
              <p className="text-2xl font-black text-[#D4AF37]">1 200 000 EUR</p>
              <p className="text-[10px] text-white/40">Basee sur CA annuel x multiplicateur SaaS</p>
            </div>
            <SectionCard title="Historique & Previsions" icon={DollarSign}>
              <div className="divide-y divide-[#E5E7EB]">
                {INVESTISSEURS_DATA.map(inv => (
                  <button key={inv.nom} onClick={() => showToast(`Details: ${inv.nom}`)} className="w-full text-left p-3 flex justify-between items-center">
                    <div><p className="text-sm font-bold text-[#111]">{inv.nom}</p><p className="text-[10px] text-[#6B7280]">{inv.investisseur} · {inv.date}</p></div>
                    <div className="text-right"><p className="text-sm font-bold text-[#D4AF37]">{inv.montant}</p><p className={`text-[10px] ${inv.statut === "Realise" ? "text-green-600" : "text-amber-600"}`}>{inv.statut}</p></div>
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* 45. PARTENARIATS */}
        {tab === "partenariats" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Partenaires actifs" value={String(PARTENAIRES_DATA.filter(p => p.niveau !== "En attente").length)} color="text-green-600" />
              <StatCard label="En negociation" value={String(PARTENAIRES_DATA.filter(p => p.niveau === "En attente").length)} color="text-amber-600" />
              <StatCard label="Total" value={String(PARTENAIRES_DATA.length)} color="text-[#D4AF37]" />
            </div>
            {PARTENAIRES_DATA.map((p, i) => {
              const isExp = expanded === i;
              return (
                <div key={p.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div><p className="text-sm font-bold text-[#111]">{p.nom}</p><p className="text-[10px] text-[#6B7280]">{p.type} · {p.responsable}</p></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.niveau === "Platinum" ? "bg-[#D4AF37]/10 text-[#D4AF37]" : p.niveau === "Gold" ? "bg-amber-50 text-amber-600" : p.niveau === "En attente" ? "bg-gray-100 text-[#6B7280]" : "bg-blue-50 text-blue-600"}`}>{p.niveau}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">CA genere</span><p className="font-bold">{p.ca}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Contrat</span><p className="font-bold">{p.contrat}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 46. MARQUES */}
        {tab === "marques" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Marques deposees" value={String(MARQUES_DATA.filter(m => m.statut === "Actif").length)} color="text-green-600" />
              <StatCard label="En depot" value={String(MARQUES_DATA.filter(m => m.statut === "En depot").length)} color="text-amber-600" />
              <StatCard label="Total" value={String(MARQUES_DATA.length)} color="text-[#D4AF37]" />
            </div>
            {MARQUES_DATA.map((m, i) => {
              const isExp = expanded === i;
              return (
                <div key={m.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Bookmark size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{m.nom}</p><p className="text-[10px] text-[#6B7280]">{m.depot} · {m.pays}</p></div></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${m.statut === "Actif" ? "text-green-600" : m.statut === "En depot" ? "text-amber-600" : "text-[#6B7280]"}`}>{m.statut}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Logo</span><p className="font-bold">{m.logo}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Renouvellement</span><p className="font-bold">{m.renouvellement}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Responsable</span><p className="font-bold">{m.responsable}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 47. PROPRIETE INTELLECTUELLE */}
        {tab === "propriete_ip" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <StatCard label="Actifs proteges" value={String(PROPRIETE_IP.filter(p => p.statut === "Protege" || p.statut === "Actif").length)} color="text-green-600" />
              <StatCard label="Total actifs IP" value={String(PROPRIETE_IP.length)} color="text-[#D4AF37]" />
            </div>
            {PROPRIETE_IP.map((p, i) => {
              const isExp = expanded === i;
              return (
                <div key={p.actif} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div><p className="text-sm font-bold text-[#111]">{p.actif}</p><p className="text-[10px] text-[#6B7280]">{p.type} · {p.depot}</p></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${p.statut === "Protege" || p.statut === "Actif" ? "text-green-600" : p.statut === "RGPD" ? "text-blue-600" : "text-amber-600"}`}>{p.statut}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Expiration</span><p className="font-bold">{p.expiration || "—"}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 48. EXPANSION */}
        {tab === "expansion" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-white">
              <p className="text-[10px] text-white/50 uppercase">Expansion mondiale</p>
              <p className="text-2xl font-black text-[#D4AF37]">{EXPANSION_DATA.length} pays en preparation</p>
              <p className="text-[10px] text-white/40">+ 8 pays deja actifs</p>
            </div>
            {EXPANSION_DATA.map((p, i) => {
              const isExp = expanded === i;
              return (
                <div key={p.pays} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Globe2 size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{p.pays}</p><p className="text-[10px] text-[#6B7280]">{p.etude} · Ouverture: {p.ouverture}</p></div></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#D4AF37]">{p.budget}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Recrutement</span><p className="font-bold">{p.recrutement}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Fiscalite</span><p className="font-bold">{p.fiscalite}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Paiement</span><p className="font-bold">{p.paiement}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Reglementation</span><p className="font-bold">{p.reglementation}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Langues</span><p className="font-bold">{p.langues}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Partenaires</span><p className="font-bold">{p.partenaires}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 49. APPLICATIONS */}
        {tab === "applications" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Apps actives" value={String(APPS_DATA.filter(a => a.version !== "Planifiee").length)} color="text-green-600" />
              <StatCard label="Planifiees" value={String(APPS_DATA.filter(a => a.version === "Planifiee").length)} color="text-amber-600" />
              <StatCard label="Total" value={String(APPS_DATA.length)} color="text-[#D4AF37]" />
            </div>
            {APPS_DATA.map((a, i) => {
              const isExp = expanded === i;
              return (
                <div key={a.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Smartphone size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{a.nom}</p><p className="text-[10px] text-[#6B7280]">v{a.version} · {a.utilisateurs} utilisateurs</p></div></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#D4AF37]">{a.note}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">MAJ</span><p className="font-bold">{a.mises_a_jour}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Bugs</span><p className={`font-bold ${a.bugs > 3 ? "text-red-600" : "text-green-600"}`}>{a.bugs}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">DL</span><p className="font-bold">{a.telechargements}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 50. DOMAINES */}
        {tab === "domaines" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Actifs" value={String(DOMAINES_DATA.filter(d => d.statut === "Actif").length)} color="text-green-600" />
              <StatCard label="Reserves" value={String(DOMAINES_DATA.filter(d => d.statut === "Reserve").length)} color="text-blue-600" />
              <StatCard label="Planifies" value={String(DOMAINES_DATA.filter(d => d.statut === "Planifie").length)} color="text-amber-600" />
            </div>
            {DOMAINES_DATA.map((d, i) => {
              const isExp = expanded === i;
              return (
                <div key={d.domaine} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div><p className="text-sm font-bold text-[#111]">{d.domaine}</p><p className="text-[10px] text-[#6B7280]">{d.registrar} · Exp: {d.expiration}</p></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${d.statut === "Actif" ? "text-green-600" : d.statut === "Reserve" ? "text-blue-600" : "text-amber-600"}`}>{d.statut}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">DNS</span><p className="font-bold">{d.dns}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">SSL</span><p className="font-bold">{d.ssl}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Redirections</span><p className="font-bold">{d.redirections}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 51. LICENCES */}
        {tab === "licences" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <StatCard label="Licences actives" value={String(LICENCES_DATA.length)} color="text-green-600" />
              <StatCard label="Cout mensuel estime" value="~600 EUR" color="text-[#D4AF37]" onClick={() => navigate("/comptabilite/depenses")} />
            </div>
            {LICENCES_DATA.map((l, i) => {
              const isExp = expanded === i;
              return (
                <div key={l.logiciel} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div><p className="text-sm font-bold text-[#111]">{l.logiciel}</p><p className="text-[10px] text-[#6B7280]">{l.responsable} · {l.utilisation}</p></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#D4AF37]">{l.cout}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Renouvellement</span><p className="font-bold">{l.renouvellement}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 52. FORMATION */}
        {tab === "formation" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Formations" value={String(FORMATIONS_DATA.length)} color="text-[#D4AF37]" />
              <StatCard label="Completions" value={String(FORMATIONS_DATA.reduce((s, f) => s + f.completions, 0))} color="text-green-600" />
              <StatCard label="Types" value="4" color="text-blue-600" />
            </div>
            {FORMATIONS_DATA.map((f, i) => {
              const isExp = expanded === i;
              return (
                <div key={f.titre} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><GraduationCap size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{f.titre}</p><p className="text-[10px] text-[#6B7280]">{f.type} · {f.duree}</p></div></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-green-600">{f.completions} completions</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Acces</span><p className="font-bold">{f.acces}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 53. COMMUNICATION */}
        {tab === "communication" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Diffusees" value={String(COMMUNICATIONS_DATA.filter(c => c.statut === "Diffuse").length)} color="text-green-600" />
              <StatCard label="Planifiees" value={String(COMMUNICATIONS_DATA.filter(c => c.statut === "Planifie").length)} color="text-amber-600" />
              <StatCard label="Brouillons" value={String(COMMUNICATIONS_DATA.filter(c => c.statut === "Brouillon").length)} color="text-[#6B7280]" />
            </div>
            {COMMUNICATIONS_DATA.map((c, i) => (
              <div key={c.titre} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-bold text-[#111]">{c.titre}</p><p className="text-[10px] text-[#6B7280]">{c.type} · {c.departement} · {c.date}</p></div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.statut === "Diffuse" ? "bg-green-50 text-green-600" : c.statut === "Planifie" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-[#6B7280]"}`}>{c.statut}</span>
                </div>
              </div>
            ))}
            <button onClick={() => showToast("Nouvelle communication creee")} className="w-full rounded-xl bg-[#111] py-2 text-[10px] font-bold text-[#D4AF37] flex items-center justify-center gap-1"><MessageSquare size={10} /> Nouvelle communication</button>
          </div>
        )}

        {/* 54. AUDITS */}
        {tab === "audits" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Termines" value={String(AUDITS_DATA.filter(a => a.statut === "Termine").length)} color="text-green-600" />
              <StatCard label="En cours" value={String(AUDITS_DATA.filter(a => a.statut === "En cours").length)} color="text-amber-600" />
              <StatCard label="Planifies" value={String(AUDITS_DATA.filter(a => a.statut === "Planifie").length)} color="text-blue-600" />
            </div>
            {AUDITS_DATA.map((a, i) => {
              const isExp = expanded === i;
              return (
                <div key={a.titre} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><ClipboardCheck size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{a.titre}</p><p className="text-[10px] text-[#6B7280]">{a.type} · {a.date}</p></div></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${a.statut === "Termine" ? "text-green-600" : a.statut === "En cours" ? "text-amber-600" : "text-blue-600"}`}>{a.statut}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Recommandations</span><p className="font-bold">{a.recommandations}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Actions</span><p className="font-bold">{a.actions}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Validation</span><p className="font-bold">{a.validation}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 55. GOUVERNANCE EXECUTIVE */}
        {tab === "gouvernance" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-white">
              <p className="text-[10px] text-white/50 uppercase">Gouvernance Executive</p>
              <p className="text-lg font-black text-[#D4AF37]">Decisions strategiques du groupe</p>
              <p className="text-[10px] text-white/40">Acces reserve PDG, DG & Conseil d&apos;Administration</p>
            </div>
            <SectionCard title="Objectifs strategiques" icon={Target}>
              <div className="p-3 grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-lg bg-green-50 p-2"><span className="text-green-600 font-bold">1 an</span><p className="text-[#111]">8 pays actifs, 50 garages</p></div>
                <div className="rounded-lg bg-blue-50 p-2"><span className="text-blue-600 font-bold">3 ans</span><p className="text-[#111]">15 pays, 200 garages, Serie A</p></div>
                <div className="rounded-lg bg-amber-50 p-2"><span className="text-amber-600 font-bold">5 ans</span><p className="text-[#111]">25 pays, leader Afrique</p></div>
                <div className="rounded-lg bg-purple-50 p-2"><span className="text-purple-600 font-bold">10 ans</span><p className="text-[#111]">50 pays, IPO envisagee</p></div>
              </div>
            </SectionCard>
            <SectionCard title="Decisions recentes" icon={Scale}>
              <div className="divide-y divide-[#E5E7EB]">
                {GOUVERNANCE_DATA.map(g => (
                  <button key={g.decision} onClick={() => showToast(`Decision: ${g.decision}`)} className="w-full text-left p-3 flex justify-between items-center">
                    <div><p className="text-sm font-bold text-[#111]">{g.decision}</p><p className="text-[10px] text-[#6B7280]">{g.type} · {g.date} · {g.responsable}</p></div>
                    <span className={`text-[10px] font-bold ${g.statut === "Approuve" || g.statut === "Valide" ? "text-green-600" : g.statut === "En preparation" ? "text-amber-600" : "text-blue-600"}`}>{g.statut}</span>
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ═══════ PARTIE 5 — Modules Strategiques Avances (56-65) ═══════ */}

        {/* 56. ESG & DEVELOPPEMENT DURABLE */}
        {tab === "esg" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-green-800 to-green-600 p-4 text-white">
              <p className="text-[10px] text-white/50 uppercase">ESG & Developpement Durable</p>
              <p className="text-2xl font-black">Score B+</p>
              <p className="text-[10px] text-white/60">Objectif: A d&apos;ici 2027</p>
            </div>
            {ESG_DATA.map((e, i) => (
              <div key={e.indicateur} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold text-[#111]">{e.indicateur}</p>
                  <p className="text-sm font-bold text-green-600">{e.valeur}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[#E5E7EB]"><div className="h-2 rounded-full bg-green-500" style={{ width: `${e.progression}%` }} /></div>
                  <span className="text-[10px] font-bold text-green-600">{e.progression}%</span>
                </div>
                <p className="text-[10px] text-[#6B7280] mt-1">Objectif: {e.objectif}</p>
              </div>
            ))}
          </div>
        )}

        {/* 57. QUALITE GROUPE */}
        {tab === "qualite" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Satisfaction moy." value="4.55/5" color="text-green-600" />
              <StatCard label="Reclamations" value={String(QUALITE_DATA.reduce((s, q) => s + q.reclamations, 0))} color="text-red-600" />
              <StatCard label="Services" value={String(QUALITE_DATA.length)} color="text-[#D4AF37]" />
            </div>
            {QUALITE_DATA.map((q, i) => {
              const isExp = expanded === i;
              return (
                <div key={q.service} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div><p className="text-sm font-bold text-[#111]">{q.service}</p><p className="text-[10px] text-[#6B7280]">Objectif: {q.objectif}</p></div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#D4AF37]">{q.satisfaction}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Reclamations</span><p className={`font-bold ${q.reclamations > 5 ? "text-red-600" : "text-green-600"}`}>{q.reclamations}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Temps trait.</span><p className="font-bold">{q.tempsTraitement}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 58. CONFORMITE */}
        {tab === "conformite" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <StatCard label="Conformes" value={String(CONFORMITE_DATA.filter(c => c.statut === "Conforme").length)} color="text-green-600" />
              <StatCard label="En cours" value={String(CONFORMITE_DATA.filter(c => c.statut === "En cours").length)} color="text-amber-600" />
            </div>
            {CONFORMITE_DATA.map((c, i) => {
              const isExp = expanded === i;
              return (
                <div key={c.regle} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><FileCheck size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{c.regle}</p><p className="text-[10px] text-[#6B7280]">{c.pays}</p></div></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${c.statut === "Conforme" ? "text-green-600" : "text-amber-600"}`}>{c.statut}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Dernier audit</span><p className="font-bold">{c.dernierAudit}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Prochain audit</span><p className="font-bold">{c.prochainAudit}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 59. CONTINUITE D'ACTIVITE */}
        {tab === "continuite" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-white">
              <p className="text-[10px] text-white/50 uppercase">Plan de continuite d&apos;activite</p>
              <p className="text-2xl font-black text-green-400">Operationnel</p>
              <p className="text-[10px] text-white/40">Derniere verification: 09/06/2026</p>
            </div>
            <SectionCard title="Sauvegardes" icon={Database}>
              <div className="p-3 space-y-2 text-[10px]">
                <div className="flex justify-between"><span>Sauvegarde auto quotidienne</span><span className="text-green-600 font-bold">Actif</span></div>
                <div className="flex justify-between"><span>Sauvegarde hebdo complete</span><span className="text-green-600 font-bold">Actif</span></div>
                <div className="flex justify-between"><span>Serveur de secours</span><span className="text-green-600 font-bold">Pret</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Tests de restauration" icon={RefreshCw}>
              <div className="p-3 space-y-2 text-[10px]">
                <div className="flex justify-between"><span>Dernier test complet</span><span className="font-bold">02/06/2026 — Succes</span></div>
                <div className="flex justify-between"><span>Temps de restauration</span><span className="font-bold">18min 12s</span></div>
                <div className="flex justify-between"><span>Prochain test planifie</span><span className="font-bold">01/07/2026</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Gestion de crise" icon={AlertTriangle}>
              <div className="p-3 space-y-2 text-[10px]">
                <div className="flex justify-between"><span>Responsable crise</span><span className="font-bold">Moussa K. (PDG)</span></div>
                <div className="flex justify-between"><span>Equipe d&apos;astreinte</span><span className="font-bold">3 personnes</span></div>
                <div className="flex justify-between"><span>Temps de reaction max</span><span className="font-bold">15 min</span></div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* 60. OBSERVATION DU MARCHE */}
        {tab === "observation" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-white">
              <p className="text-[10px] text-white/50 uppercase">Observation du marche automobile</p>
              <p className="text-lg font-black text-[#D4AF37]">Analyse en temps reel</p>
              <p className="text-[10px] text-white/40">Mise a jour: 09/06/2026</p>
            </div>
            {OBSERVATION_MARCHE.map(o => (
              <div key={o.indicateur} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex justify-between items-center">
                <div><p className="text-sm font-bold text-[#111]">{o.indicateur}</p><p className="text-lg font-black text-[#D4AF37]">{o.valeur}</p></div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${o.direction === "up" ? "text-green-600" : o.direction === "down" ? "text-red-600" : "text-[#6B7280]"}`}>
                    {o.direction === "up" ? "▲" : o.direction === "down" ? "▼" : "●"} {o.tendance}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 61. EXPERIENCE CLIENT */}
        {tab === "experience" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="NPS" value="72" color="text-green-600" />
              <StatCard label="Satisfaction" value="4.7/5" color="text-[#D4AF37]" />
              <StatCard label="Fidelite 90j" value="45%" color="text-blue-600" />
            </div>
            {EXPERIENCE_CLIENT.map(e => (
              <div key={e.metrique} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex justify-between items-center">
                <p className="text-sm font-bold text-[#111]">{e.metrique}</p>
                <div className="text-right">
                  <p className="text-lg font-black text-[#D4AF37]">{e.valeur}</p>
                  <p className="text-[10px] font-bold text-green-600">{e.evolution}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 62. REWARDS */}
        {tab === "rewards" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <StatCard label="Membres total" value={String(REWARDS_DATA.reduce((s, r) => s + r.membres, 0).toLocaleString())} color="text-[#D4AF37]" />
              <StatCard label="Points distribues" value="1.71M" color="text-green-600" />
            </div>
            {REWARDS_DATA.map((r, i) => {
              const isExp = expanded === i;
              const colors: Record<string, string> = { Bronze: "text-amber-700", Silver: "text-gray-500", Gold: "text-[#D4AF37]", Platinum: "text-purple-600" };
              return (
                <div key={r.niveau} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Gift size={14} className={colors[r.niveau] || "text-[#D4AF37]"} /><div><p className={`text-sm font-bold ${colors[r.niveau] || "text-[#111]"}`}>{r.niveau}</p><p className="text-[10px] text-[#6B7280]">{r.membres.toLocaleString()} membres · {r.offres} offres</p></div></div>
                    <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Points distribues</span><p className="font-bold">{r.points_distribues}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Points utilises</span><p className="font-bold">{r.points_utilises}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 63. IA MKA CENTRE */}
        {tab === "ia_centre" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-white">
              <div className="flex items-center gap-2 mb-2"><Cpu size={18} className="text-[#D4AF37]" /><p className="text-lg font-black text-[#D4AF37]">Assistant MKA.P-MS</p></div>
              <p className="text-[10px] text-white/60">Systeme d&apos;intelligence strategique reserve a la Direction</p>
            </div>
            <SectionCard title="Previsions automatiques" icon={TrendingUp}>
              <div className="p-3 space-y-2 text-[10px]">
                <div className="flex justify-between"><span>CA prevu Juillet 2026</span><span className="font-bold text-green-600">625 000 EUR (+6.3%)</span></div>
                <div className="flex justify-between"><span>CA prevu Q3 2026</span><span className="font-bold text-green-600">1 850 000 EUR</span></div>
                <div className="flex justify-between"><span>Nouveaux abonnes prevus</span><span className="font-bold">+180/mois</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Anomalies detectees" icon={AlertTriangle}>
              <div className="p-3 space-y-2 text-[10px]">
                <div className="flex justify-between"><span>Depense marketing +16% vs budget</span><span className="font-bold text-red-600">Alerte</span></div>
                <div className="flex justify-between"><span>Taux abandon panier Location CI</span><span className="font-bold text-amber-600">Surveiller</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Recommandations" icon={Brain}>
              <div className="p-3 space-y-2 text-[10px]">
                <p className="text-[#111]">• Augmenter le budget Electric+ (+45% de croissance)</p>
                <p className="text-[#111]">• Lancer Garage+ en Cote d&apos;Ivoire (forte demande detectee)</p>
                <p className="text-[#111]">• Optimiser SEO sur les annonces motos (segment en hausse)</p>
                <p className="text-[#111]">• Reduire les frais serveur (-8% possible avec cache CDN)</p>
              </div>
            </SectionCard>
          </div>
        )}

        {/* 64. PERSONNALISATION */}
        {tab === "personnalisation" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <StatCard label="Pays configures" value={String(PERSONNALISATION_PAYS.length)} color="text-green-600" />
              <StatCard label="Devises actives" value="5" color="text-[#D4AF37]" />
            </div>
            {PERSONNALISATION_PAYS.map((p, i) => {
              const isExp = expanded === i;
              return (
                <div key={p.pays} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Palette size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{p.pays}</p><p className="text-[10px] text-[#6B7280]">{p.devise} · {p.langue}</p></div></div>
                    <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">TVA</span><p className="font-bold">{p.tva}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Paiements</span><p className="font-bold">{p.paiements}</p></div>
                      <div className="col-span-2 rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Services actifs</span><p className="font-bold">{p.services}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 65. INDICATEURS EXECUTIFS */}
        {tab === "indicateurs" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-white">
              <p className="text-[10px] text-white/50 uppercase">Indicateurs Executifs</p>
              <p className="text-lg font-black text-[#D4AF37]">100 KPI en temps reel</p>
              <p className="text-[10px] text-white/40">Derniere MAJ: 09/06/2026 18:15</p>
            </div>
            <SectionCard title="Financiers" icon={Euro}>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="flex justify-between"><span>CA mondial mensuel</span><button onClick={() => navigate("/comptabilite/revenus")} className="font-bold text-[#D4AF37]">588 150 EUR</button></div>
                <div className="flex justify-between"><span>Benefice net</span><button onClick={() => navigate("/comptabilite/revenus")} className="font-bold text-green-600">185 200 EUR</button></div>
                <div className="flex justify-between"><span>Tresorerie</span><button onClick={() => navigate("/comptabilite/paiements")} className="font-bold text-green-600">342 800 EUR</button></div>
                <div className="flex justify-between"><span>Marge moyenne</span><span className="font-bold">31.5%</span></div>
                <div className="flex justify-between"><span>TVA collectee</span><button onClick={() => navigate("/comptabilite/tva")} className="font-bold text-[#D4AF37]">23 940 EUR</button></div>
              </div>
            </SectionCard>
            <SectionCard title="Clients & Activite" icon={Users}>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="flex justify-between"><span>Utilisateurs totaux</span><span className="font-bold">27 250</span></div>
                <div className="flex justify-between"><span>Nouveaux ce mois</span><span className="font-bold text-green-600">+1 245</span></div>
                <div className="flex justify-between"><span>Abonnements actifs</span><button onClick={() => navigate("/comptabilite/abonnements")} className="font-bold text-[#D4AF37]">1 225</button></div>
                <div className="flex justify-between"><span>Taux satisfaction</span><span className="font-bold">4.7/5</span></div>
                <div className="flex justify-between"><span>NPS</span><span className="font-bold text-green-600">72</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Operations" icon={Activity}>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="flex justify-between"><span>Vehicules vendus (mois)</span><span className="font-bold">47</span></div>
                <div className="flex justify-between"><span>Vehicules loues (mois)</span><span className="font-bold">156</span></div>
                <div className="flex justify-between"><span>Pieces vendues</span><span className="font-bold">456</span></div>
                <div className="flex justify-between"><span>Sante serveurs</span><span className="font-bold text-green-600">99.98%</span></div>
                <div className="flex justify-between"><span>Pays actifs</span><span className="font-bold">8</span></div>
                <div className="flex justify-between"><span>Employes</span><span className="font-bold">76</span></div>
                <div className="flex justify-between"><span>Objectifs atteints</span><span className="font-bold">8/12</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Croissance" icon={TrendingUp}>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="flex justify-between"><span>Croissance CA mensuel</span><span className="font-bold text-green-600">+14.8%</span></div>
                <div className="flex justify-between"><span>Croissance abonnements</span><span className="font-bold text-green-600">+19.8%</span></div>
                <div className="flex justify-between"><span>Meilleur service (croissance)</span><span className="font-bold">Electric+ (+45.2%)</span></div>
                <div className="flex justify-between"><span>Expansion internationale</span><span className="font-bold">5 pays en preparation</span></div>
                <div className="flex justify-between"><span>Rentabilite globale</span><span className="font-bold text-green-600">89%</span></div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ═══════ PARTIE 6 — Connecteurs Strategiques & Ecosysteme Mondial (66-80) ═══════ */}

        {/* 66. CONNECTEURS */}
        {tab === "connecteurs" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Actifs" value={String(CONNECTEURS_DATA.filter(c => c.statut === "actif").length)} color="text-green-600" />
              <StatCard label="Desactives" value={String(CONNECTEURS_DATA.filter(c => c.statut === "desactive").length)} color="text-red-600" />
              <StatCard label="Planifies" value={String(CONNECTEURS_DATA.filter(c => c.statut === "planifie").length)} color="text-amber-600" />
            </div>
            {CONNECTEURS_DATA.map((c, i) => {
              const isExp = expanded === i;
              return (
                <div key={c.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Plug size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{c.nom}</p><p className="text-[10px] text-[#6B7280]">{c.categorie}</p></div></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.statut === "actif" ? "bg-green-50 text-green-600" : c.statut === "desactive" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{c.statut}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 text-[10px] space-y-2">
                      <div className="flex justify-between"><span className="text-[#6B7280]">Derniere sync</span><span className="font-bold">{c.derniere_sync}</span></div>
                      <button onClick={() => showToast(`Connecteur ${c.nom} ${c.statut === "actif" ? "desactive" : "active"}`)} className="w-full rounded-lg bg-[#111] py-1.5 text-[10px] font-bold text-[#D4AF37]">{c.statut === "actif" ? "Desactiver" : "Activer"}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 67. MARKETPLACES */}
        {tab === "marketplaces" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <StatCard label="Actives" value={String(MARKETPLACES_DATA.filter(m => m.statut === "actif").length)} color="text-green-600" />
              <StatCard label="Planifiees" value={String(MARKETPLACES_DATA.filter(m => m.statut === "planifie").length)} color="text-amber-600" />
            </div>
            {MARKETPLACES_DATA.map((m, i) => {
              const isExp = expanded === i;
              return (
                <div key={m.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><ShoppingCart size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{m.nom}</p><p className="text-[10px] text-[#6B7280]">{m.annonces_sync} annonces sync</p></div></div>
                    <span className={`text-[10px] font-bold ${m.statut === "actif" ? "text-green-600" : "text-amber-600"}`}>{m.statut}</span>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Prix sync</span><p className={`font-bold ${m.prix_sync ? "text-green-600" : "text-red-600"}`}>{m.prix_sync ? "Oui" : "Non"}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Stock sync</span><p className={`font-bold ${m.stock_sync ? "text-green-600" : "text-red-600"}`}>{m.stock_sync ? "Oui" : "Non"}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Annonces</span><p className="font-bold">{m.annonces_sync}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 68. FOURNISSEURS */}
        {tab === "fournisseurs" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Actifs" value={String(FOURNISSEURS_DATA.filter(f => f.contrat === "Actif").length)} color="text-green-600" />
              <StatCard label="Negociation" value={String(FOURNISSEURS_DATA.filter(f => f.contrat === "En negociation").length)} color="text-amber-600" />
              <StatCard label="Total" value={String(FOURNISSEURS_DATA.length)} color="text-[#D4AF37]" />
            </div>
            {FOURNISSEURS_DATA.map((f, i) => {
              const isExp = expanded === i;
              return (
                <div key={f.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div><p className="text-sm font-bold text-[#111]">{f.nom}</p><p className="text-[10px] text-[#6B7280]">{f.categorie} · Delai: {f.delai}</p></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${f.contrat === "Actif" ? "text-green-600" : "text-amber-600"}`}>{f.contrat}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && f.performance > 0 && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 text-[10px]">
                      <div className="flex items-center gap-2"><span className="text-[#6B7280]">Performance</span><div className="flex-1 h-2 rounded-full bg-[#E5E7EB]"><div className="h-2 rounded-full bg-green-500" style={{ width: `${f.performance}%` }} /></div><span className="font-bold text-green-600">{f.performance}%</span></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 69. CONSTRUCTEURS */}
        {tab === "constructeurs" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <StatCard label="Marques referencees" value={String(CONSTRUCTEURS_DATA.length)} color="text-[#D4AF37]" />
              <StatCard label="References totales" value="64 100" color="text-green-600" />
            </div>
            {CONSTRUCTEURS_DATA.map((c, i) => {
              const isExp = expanded === i;
              return (
                <div key={c.marque} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Factory size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{c.marque}</p><p className="text-[10px] text-[#6B7280]">{c.modeles} modeles · {c.references} refs</p></div></div>
                    <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Generations</span><p className="font-bold">{c.generations}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Motorisations</span><p className="font-bold">{c.motorisations}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Integration</span><p className="font-bold">{c.integration}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 70. PARTENAIRES FINANCIERS */}
        {tab === "partenaires_fin" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-white">
              <p className="text-[10px] text-white/50 uppercase">Partenaires financiers</p>
              <p className="text-lg font-black text-[#D4AF37]">{PARTENAIRES_FIN_DATA.length} partenaires</p>
              <p className="text-[10px] text-white/40">Credit auto, LOA, LLD</p>
            </div>
            {PARTENAIRES_FIN_DATA.map((p, i) => {
              const isExp = expanded === i;
              return (
                <div key={p.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div><p className="text-sm font-bold text-[#111]">{p.nom}</p><p className="text-[10px] text-[#6B7280]">{p.produit} · {p.pays}</p></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-600">{p.statut}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Taux</span><p className="font-bold">{p.taux}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Commission</span><p className="font-bold">{p.commission}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 71. ASSURANCES */}
        {tab === "assurances" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <StatCard label="En discussion" value={String(ASSURANCES_DATA.filter(a => a.statut === "En discussion").length)} color="text-amber-600" />
              <StatCard label="Planifies" value={String(ASSURANCES_DATA.filter(a => a.statut === "Planifie").length)} color="text-blue-600" />
            </div>
            {ASSURANCES_DATA.map((a, i) => (
              <div key={a.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><Umbrella size={14} className="text-[#D4AF37]" /><p className="text-sm font-bold text-[#111]">{a.nom}</p></div>
                  <span className={`text-[10px] font-bold ${a.statut === "En discussion" ? "text-amber-600" : "text-blue-600"}`}>{a.statut}</span>
                </div>
                <p className="text-[10px] text-[#6B7280]">{a.services}</p>
                <p className="text-[10px] text-[#6B7280] mt-1">Pays: {a.pays}</p>
              </div>
            ))}
          </div>
        )}

        {/* 72. TRANSPORTEURS */}
        {tab === "transporteurs" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <StatCard label="Transporteurs" value={String(TRANSPORTEURS_DATA.length)} color="text-[#D4AF37]" />
              <StatCard label="Note moyenne" value="4.4/5" color="text-green-600" />
            </div>
            {TRANSPORTEURS_DATA.map((t, i) => {
              const isExp = expanded === i;
              return (
                <div key={t.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Navigation size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{t.nom}</p><p className="text-[10px] text-[#6B7280]">{t.type}</p></div></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#D4AF37]">{t.qualite}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Disponibilite</span><p className="font-bold">{t.disponibilite}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Delai</span><p className="font-bold">{t.delai}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Tarif</span><p className="font-bold">{t.tarif}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 73. ADMINISTRATIONS */}
        {tab === "administrations" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-white">
              <p className="text-[10px] text-white/50 uppercase">Connexions administratives</p>
              <p className="text-lg font-black text-[#D4AF37]">Services publics par pays</p>
              <p className="text-[10px] text-white/40">Activees selon reglementation locale</p>
            </div>
            {[
              { pays: "France", services: ["ANTS (Immatriculations)", "SIV (Cartes grises)", "Controle technique", "URSSAF"], statut: "Planifie" },
              { pays: "Cote d'Ivoire", services: ["Immatriculations (DGTTC)", "Permis de conduire", "Douanes"], statut: "Planifie" },
              { pays: "Senegal", services: ["DTT (Transport)", "Direction Impots", "Douanes"], statut: "Planifie" },
            ].map((p, i) => {
              const isExp = expanded === i;
              return (
                <div key={p.pays} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Building size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{p.pays}</p><p className="text-[10px] text-[#6B7280]">{p.services.length} services</p></div></div>
                    <span className="text-[10px] font-bold text-amber-600">{p.statut}</span>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 text-[10px] space-y-1">
                      {p.services.map(s => <p key={s} className="text-[#111]">• {s}</p>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 74. API INTERNES */}
        {tab === "api_internes" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="APIs actives" value={String(API_INTERNES_DATA.length)} color="text-green-600" />
              <StatCard label="Requetes/jour" value={String(API_INTERNES_DATA.reduce((s, a) => s + a.requetes_jour, 0).toLocaleString())} color="text-[#D4AF37]" />
              <StatCard label="Uptime moyen" value="99.98%" color="text-green-600" />
            </div>
            {API_INTERNES_DATA.map((a, i) => {
              const isExp = expanded === i;
              return (
                <div key={a.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Code2 size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{a.nom}</p><p className="text-[10px] text-[#6B7280]">{a.version} · {a.uptime} uptime</p></div></div>
                    <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Securite</span><p className="font-bold">{a.securite}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Requetes/jour</span><p className="font-bold">{a.requetes_jour.toLocaleString()}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 75. DEVELOPPEURS */}
        {tab === "developpeurs" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-white">
              <p className="text-[10px] text-white/50 uppercase">Centre des developpeurs</p>
              <p className="text-lg font-black text-[#D4AF37]">Gestion technique</p>
            </div>
            {DEV_DATA.map((d, i) => {
              const isExp = expanded === i;
              return (
                <div key={d.env} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Code2 size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{d.env}</p><p className="text-[10px] text-[#6B7280]">{d.version} · Deploy: {d.dernier_deploy}</p></div></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.statut === "stable" ? "bg-green-50 text-green-600" : d.statut === "test" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>{d.statut}</span>
                      <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 text-[10px]">
                      <div className="flex justify-between"><span className="text-[#6B7280]">Bugs ouverts</span><span className={`font-bold ${d.bugs_ouverts > 5 ? "text-red-600" : "text-green-600"}`}>{d.bugs_ouverts}</span></div>
                    </div>
                  )}
                </div>
              );
            })}
            <SectionCard title="Roadmap technique" icon={Target}>
              <div className="p-3 space-y-2 text-[10px]">
                <div className="flex justify-between"><span>v2.9 — Centre Pilotage P4-P6</span><span className="font-bold text-green-600">En cours</span></div>
                <div className="flex justify-between"><span>v3.0 — App Mobile native</span><span className="font-bold text-amber-600">Q4 2026</span></div>
                <div className="flex justify-between"><span>v3.1 — API Marketplace</span><span className="font-bold text-blue-600">Q1 2027</span></div>
                <div className="flex justify-between"><span>v3.2 — IA Assistant avance</span><span className="font-bold text-blue-600">Q2 2027</span></div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* 76. APPS CONNECTEES */}
        {tab === "apps_connectees" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Apps actives" value={String(APPS_DATA.filter(a => a.version !== "Planifiee").length)} color="text-green-600" />
              <StatCard label="Utilisateurs" value="27 288" color="text-[#D4AF37]" />
              <StatCard label="Incidents" value="0" color="text-green-600" />
            </div>
            {APPS_DATA.map((a, i) => (
              <div key={a.nom + "_conn"} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between">
                <div className="flex items-center gap-2"><Monitor size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{a.nom}</p><p className="text-[10px] text-[#6B7280]">v{a.version} · {a.utilisateurs} users · {a.note}</p></div></div>
                <span className={`text-[10px] font-bold ${a.version !== "Planifiee" ? "text-green-600" : "text-amber-600"}`}>{a.version !== "Planifiee" ? "Actif" : "Planifie"}</span>
              </div>
            ))}
          </div>
        )}

        {/* 77. OBJETS CONNECTES */}
        {tab === "objets_connectes" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatCard label="Deployes" value={String(OBJETS_CONNECTES_DATA.reduce((s, o) => s + o.deployes, 0))} color="text-[#D4AF37]" />
              <StatCard label="Actifs" value={String(OBJETS_CONNECTES_DATA.reduce((s, o) => s + o.actifs, 0))} color="text-green-600" />
              <StatCard label="En panne" value={String(OBJETS_CONNECTES_DATA.reduce((s, o) => s + o.en_panne, 0))} color="text-red-600" />
            </div>
            {OBJETS_CONNECTES_DATA.map((o, i) => {
              const isExp = expanded === i;
              return (
                <div key={o.type} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : i)} className="w-full text-left p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Wifi size={14} className="text-[#D4AF37]" /><div><p className="text-sm font-bold text-[#111]">{o.type}</p><p className="text-[10px] text-[#6B7280]">{o.deployes} deployes · {o.pays}</p></div></div>
                    <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Deployes</span><p className="font-bold">{o.deployes}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Actifs</span><p className="font-bold text-green-600">{o.actifs}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">En panne</span><p className={`font-bold ${o.en_panne > 0 ? "text-red-600" : "text-green-600"}`}>{o.en_panne}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 78. DONNEES */}
        {tab === "donnees" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-white">
              <p className="text-[10px] text-white/50 uppercase">Centre des donnees</p>
              <p className="text-2xl font-black text-[#D4AF37]">28.5 GB</p>
              <p className="text-[10px] text-white/40">Donnees totales plateforme</p>
            </div>
            <SectionCard title="Sauvegardes" icon={Database}>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="flex justify-between"><span>Derniere sauvegarde</span><span className="font-bold text-green-600">09/06/2026 03:00</span></div>
                <div className="flex justify-between"><span>Taille</span><span className="font-bold">2.8 GB</span></div>
                <div className="flex justify-between"><span>Frequence</span><span className="font-bold">Quotidienne + hebdomadaire</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Qualite des donnees" icon={CheckCircle}>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="flex justify-between"><span>Doublons detectes</span><span className="font-bold text-amber-600">23</span></div>
                <div className="flex justify-between"><span>Donnees obsoletes</span><span className="font-bold text-amber-600">156 fiches</span></div>
                <div className="flex justify-between"><span>Score qualite</span><span className="font-bold text-green-600">94%</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Securite & Conservation" icon={Shield}>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="flex justify-between"><span>Chiffrement</span><span className="font-bold text-green-600">AES-256</span></div>
                <div className="flex justify-between"><span>Conservation</span><span className="font-bold">10 ans (legal)</span></div>
                <div className="flex justify-between"><span>Archivage auto</span><span className="font-bold text-green-600">Actif</span></div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* 79. SUPERVISION MONDIALE */}
        {tab === "supervision" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-white">
              <div className="flex items-center gap-2 mb-2"><Radar size={18} className="text-[#D4AF37]" /><p className="text-lg font-black text-[#D4AF37]">Supervision mondiale</p></div>
              <p className="text-[10px] text-white/60">Vue temps reel de l&apos;ecosysteme MKA.P-MS</p>
            </div>
            <SectionCard title="Utilisateurs en ligne" icon={Users}>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="flex justify-between"><span>Utilisateurs connectes</span><span className="font-bold text-green-600">342</span></div>
                <div className="flex justify-between"><span>France</span><span className="font-bold">189</span></div>
                <div className="flex justify-between"><span>Cote d&apos;Ivoire</span><span className="font-bold">78</span></div>
                <div className="flex justify-between"><span>Senegal</span><span className="font-bold">45</span></div>
                <div className="flex justify-between"><span>Autres pays</span><span className="font-bold">30</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Transactions en cours" icon={Euro}>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="flex justify-between"><span>Paiements en attente</span><button onClick={() => navigate("/comptabilite/paiements")} className="font-bold text-amber-600">12</button></div>
                <div className="flex justify-between"><span>Encheres actives</span><span className="font-bold">3</span></div>
                <div className="flex justify-between"><span>Locations en cours</span><span className="font-bold">156</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Incidents" icon={AlertTriangle}>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="flex justify-between"><span>Incidents actifs</span><span className="font-bold text-green-600">0</span></div>
                <div className="flex justify-between"><span>Derniere alerte</span><span className="font-bold">08/06/2026 — Resolu</span></div>
                <div className="flex justify-between"><span>Serveurs</span><span className="font-bold text-green-600">100% operationnels</span></div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* 80. VISION MKA.P-MS */}
        {tab === "vision" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] p-4 text-white">
              <div className="flex items-center gap-2 mb-2"><Compass size={18} className="text-white" /><p className="text-lg font-black">Vision MKA.P-MS</p></div>
              <p className="text-[10px] text-white/80">Reserve au fondateur — Grandes orientations strategiques</p>
            </div>
            <SectionCard title="Mission" icon={Target}>
              <div className="p-3 text-[10px] text-[#111]">
                <p>Devenir la plateforme automobile de reference en Afrique et dans le monde, en offrant un ecosysteme complet pour l&apos;achat, la vente, la location, l&apos;entretien et le financement automobile.</p>
              </div>
            </SectionCard>
            <SectionCard title="Feuille de route" icon={Compass}>
              <div className="p-3 space-y-2 text-[10px]">
                <div className="rounded-lg bg-green-50 p-2"><span className="text-green-700 font-bold">2026 — Phase de lancement</span><p className="text-[#111]">8 pays, 50 garages, 27 000+ utilisateurs, modules complets</p></div>
                <div className="rounded-lg bg-blue-50 p-2"><span className="text-blue-700 font-bold">2027 — Phase de croissance</span><p className="text-[#111]">15 pays, 200 garages, App mobile, Serie A, API Marketplace</p></div>
                <div className="rounded-lg bg-amber-50 p-2"><span className="text-amber-700 font-bold">2028-2030 — Phase d&apos;expansion</span><p className="text-[#111]">25 pays, leader Afrique, IA avancee, objets connectes, ERP</p></div>
                <div className="rounded-lg bg-purple-50 p-2"><span className="text-purple-700 font-bold">2030-2035 — Phase internationale</span><p className="text-[#111]">50 pays, IPO envisagee, ecosystem mondial automobile</p></div>
              </div>
            </SectionCard>
            <SectionCard title="Priorites actuelles" icon={Star}>
              <div className="p-3 space-y-1 text-[10px]">
                <p className="text-[#111]">1. Finaliser modules comptabilite et pilotage</p>
                <p className="text-[#111]">2. Expansion Tunisie et Congo (Q3 2026)</p>
                <p className="text-[#111]">3. App mobile native iOS/Android</p>
                <p className="text-[#111]">4. Partenariats garages et assurances</p>
                <p className="text-[#111]">5. Preparation levee de fonds Seed</p>
              </div>
            </SectionCard>
            <SectionCard title="Projets confidentiels" icon={Lock}>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="flex justify-between"><span>Acquisition reseau garages</span><span className="font-bold text-amber-600">Negociation</span></div>
                <div className="flex justify-between"><span>Partenariat constructeur</span><span className="font-bold text-blue-600">Analyse</span></div>
                <div className="flex justify-between"><span>Vehicule MKA.P-MS (concept)</span><span className="font-bold text-purple-600">Vision 2030</span></div>
              </div>
            </SectionCard>
          </div>
        )}
      </div>

      {/* EXPORT GLOBAL */}
      <div className="px-4 mt-4">
        <button onClick={() => showToast("Rapport global PDG exporte en PDF")} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={14} /> Exporter le rapport global</button>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[90%]">
          <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-xl flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400 shrink-0" /><span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-white/40 hover:text-white">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
