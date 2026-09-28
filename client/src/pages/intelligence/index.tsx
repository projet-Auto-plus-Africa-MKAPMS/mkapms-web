/**
 * AL-HUDHUD·M — espace IA de la plateforme principale.
 * Façade mobile/desktop approuvée : Accueil, Menu, Conversation, Paramètres.
 * Les moteurs, permissions, conversations et données existants sont conservés.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3, Bot, ChevronLeft, ChevronRight, Code2, FileCheck2, FileText,
  FolderKanban, Gauge, History, Home, Image as ImageIcon, Menu, MessageCircle,
  Mic, Plug, Search, Settings, ShieldCheck, Sparkles, Wrench, Brain as BrainIcon,
  Workflow, Database, ShoppingCart, Cloud, SlidersHorizontal, Library, Clock3,
  Laptop, Grid2X2, ClipboardCheck, X
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { niveauDepuis, NIVEAUX_INTELLIGENCE, type NiveauIntelligence } from "./niveaux";
import { Conversation } from "./modules/Conversation";
import { VoixTempsReel } from "./modules/VoixTempsReel";
import { Images } from "./modules/Images";
import { FichiersDocuments } from "./modules/FichiersDocuments";
import { Recherche } from "./modules/Recherche";
import { Memoire } from "./modules/Memoire";
import { Projets } from "./modules/Projets";
import { Agents } from "./modules/Agents";
import { Outils } from "./modules/Outils";
import { CodeDeveloppement } from "./modules/CodeDeveloppement";
import { Automatisations } from "./modules/Automatisations";
import { IntegrationsApi } from "./modules/IntegrationsApi";
import { Parametres } from "./modules/Parametres";
import { Permissions } from "./modules/Permissions";
import { UsageCouts } from "./modules/UsageCouts";
import { Historique } from "./modules/Historique";
import { AgentDeveloppeur } from "./modules/AgentDeveloppeur";
import "./workspace.css";

type CleModule =
  | "accueil" | "conversation" | "developpeur" | "voix" | "images" | "documents" | "recherche"
  | "memoire" | "projets" | "agents" | "outils" | "code" | "automatisations"
  | "integrations" | "parametres" | "permissions" | "usage" | "historique";

const MODULES: { cle: Exclude<CleModule,"accueil">; label: string; icone: typeof MessageCircle; Composant: () => JSX.Element }[] = [
  { cle: "conversation", label: "Conversation", icone: MessageCircle, Composant: Conversation },
  { cle: "voix", label: "Voix & temps réel", icone: Mic, Composant: VoixTempsReel },
  { cle: "images", label: "Images", icone: ImageIcon, Composant: Images },
  { cle: "documents", label: "Fichiers & documents", icone: FileText, Composant: FichiersDocuments },
  { cle: "recherche", label: "Recherche", icone: Search, Composant: Recherche },
  { cle: "memoire", label: "Mémoire IA", icone: BrainIcon, Composant: Memoire },
  { cle: "projets", label: "Projets", icone: FolderKanban, Composant: Projets },
  { cle: "agents", label: "Agents", icone: Bot, Composant: Agents },
  { cle: "outils", label: "Outils", icone: Wrench, Composant: Outils },
  { cle: "code", label: "Code & développement", icone: Code2, Composant: CodeDeveloppement },
  { cle: "automatisations", label: "Planifié", icone: Workflow, Composant: Automatisations },
  { cle: "integrations", label: "Plugins & API", icone: Plug, Composant: IntegrationsApi },
  { cle: "usage", label: "Usage & coûts", icone: Gauge, Composant: UsageCouts },
  { cle: "historique", label: "Historique", icone: History, Composant: Historique },
  { cle: "permissions", label: "Sécurité & permissions", icone: ShieldCheck, Composant: Permissions },
  { cle: "parametres", label: "Paramètres", icone: Settings, Composant: Parametres },
];

const LABEL_NIVEAU: Record<NiveauIntelligence, string> = Object.fromEntries(
  NIVEAUX_INTELLIGENCE.map((n) => [n.niveau, n.label]),
) as Record<NiveauIntelligence, string>;

function Dashboard({ onOpen }: { onOpen: (key: CleModule) => void }) {
  const work = [
    ["Accueil", Home, "Vue d’ensemble", "accueil"],
    ["Menu", Menu, "Navigation et accès", "conversation"],
    ["Paramètres", Settings, "Configuration et préférences", "parametres"],
    ["Documents", FileText, "Fichiers, ressources et contrôles", "documents"],
    ["Contrôle IA", BrainIcon, "Tests et performances", "outils"],
    ["Audit", BarChart3, "Suivi, rapports et conformité", "historique"],
  ] as const;
  return <section className="alhud-home" aria-label="Accueil AL-HUDHUD·M">
    <div className="alhud-home-title">
      <h1>AL-HUDHUD·M</h1>
      <p>Plateforme principale · espace IA privé</p>
    </div>
    <button type="button" className="alhud-project-card" onClick={() => onOpen("conversation")}>
      <span className="alhud-project-icon"><Laptop /></span>
      <span><strong>Suivi du chantier MKA.P-MS</strong><small>Analyse · Organisation · Déploiement</small></span>
      <ChevronRight />
    </button>
    <div className="alhud-platform-grid">
      <article className="alhud-platform-card">
        <div className="alhud-platform-heading"><span className="alhud-square blue"><Database /></span><span><strong>Plateforme principale</strong><small>Infrastructure & opérations</small></span></div>
        <button type="button" className="alhud-status-ok" onClick={() => onOpen("conversation")}><span>●</span> IA connectée <ChevronRight /></button>
        <div className="alhud-status-list">
          <button type="button" onClick={() => onOpen("documents")}><FileText/>Documents <span>● OK</span></button>
          <button type="button" onClick={() => onOpen("outils")}><Settings/>Moteurs <span>● Actifs</span></button>
          <button type="button" onClick={() => onOpen("permissions")}><ShieldCheck/>Sécurité <span>● Protégée</span></button>
          <button type="button" onClick={() => onOpen("historique")}><Cloud/>Déploiement <span>Suivi</span></button>
        </div>
      </article>
      <article className="alhud-platform-card alhud-platform-disabled" aria-label="Boutique non activée dans ce lot">
        <div className="alhud-platform-heading"><span className="alhud-square violet"><ShoppingCart /></span><span><strong>Boutique</strong><small>Étape suivante après validation</small></span></div>
        <div className="alhud-status-wait">Non modifiée · en attente de votre test</div>
      </article>
    </div>
    <div className="alhud-work-heading"><h2>Notre travail aujourd’hui</h2><button type="button" onClick={() => onOpen("conversation")}>Tout voir <ChevronRight/></button></div>
    <div className="alhud-work-grid">{work.map(([label,Icon,desc,key]) =>
      <button type="button" key={label} onClick={() => onOpen(key)}><span className="alhud-work-icon"><Icon/></span><span><strong>{label}</strong><small>{desc}</small></span><ChevronRight/></button>
    )}</div>
  </section>;
}

export default function MKAPMSIntelligence() {
  const { user } = useAuth();
  const [module, setModule] = useState<CleModule>("accueil");
  const [moduleSearch, setModuleSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [workInstruction, setWorkInstruction] = useState("");
  const niveau = useMemo(() => niveauDepuis({ role: user?.role ?? null }), [user?.role]);

  if (niveau !== "pdg") {
    return <div className="mx-auto max-w-xl p-6 text-center">
      <ShieldCheck className="mx-auto h-8 w-8 text-black/30" />
      <h1 className="mt-3 text-lg font-black text-[#111]">Espace réservé pour l'instant</h1>
      <p className="mt-2 text-sm text-black/60">Le moteur réel derrière AL-HUDHUD·M est aujourd'hui réservé au compte PDG. L'assistant public reste accessible ailleurs sur la plateforme.</p>
      <Link to="/intelligences" className="mt-4 inline-block text-sm font-bold text-[#8B7500]">Ouvrir l'assistant public</Link>
    </div>;
  }

  const normalise = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const actifDef = MODULES.find((m) => m.cle === module);
  const Actif = actifDef?.Composant ?? Conversation;
  const choose = (key: CleModule) => { setModule(key); setMenuOpen(false); };
  const topItems = [
    ["Bibliothèque", Library, "documents"], ["Projets", FolderKanban, "projets"],
    ["Plugins", Plug, "integrations"], ["Planifié", Clock3, "automatisations"],
    ["À distance", Laptop, "developpeur"], ["Explorer", Grid2X2, "recherche"],
  ] as const;
  const workItems = [
    ["Accueil", Home, "accueil"], ["Suivi du chantier", BarChart3, "developpeur"],
    ["Documents", FileText, "documents"], ["Vérification IA", FileCheck2, "outils"],
    ["Audit", ClipboardCheck, "historique"], ["Paramètres", Settings, "parametres"],
  ] as const;

  const nav = <div className="alhud-approved-menu">
    <div className="alhud-menu-brand"><strong>AL-HUDHUD·M</strong><Search/></div>
    <label className="alhud-search"><input type="search" value={moduleSearch} onChange={e=>setModuleSearch(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher"/></label>
    <nav>{topItems.filter(([label])=>normalise(label).includes(normalise(moduleSearch))).map(([label,Icon,key])=><button key={label} type="button" onClick={()=>choose(key)}><Icon/><span>{label}</span><ChevronRight/></button>)}</nav>
    <h3>Espaces IA</h3>
    <button type="button" className="selected" onClick={()=>choose("accueil")}><Database/><span>Plateforme principale</span><ChevronRight/></button>
    <button type="button" onClick={()=>choose("accueil")} title="La Boutique reste hors de ce lot de modification"><ShoppingCart/><span>Boutique</span><small>ensuite</small></button>
    <h3>Notre travail</h3>
    <nav>{workItems.map(([label,Icon,key])=><button key={label} type="button" onClick={()=>choose(key)}><Icon/><span>{label}</span><ChevronRight/></button>)}</nav>
    <button type="button" className="alhud-chat-cta" onClick={()=>choose("conversation")}><MessageCircle/> Chat</button>
  </div>;

  return <div className="alhud-approved-shell">
    <header className="alhud-approved-header">
      <button type="button" className="alhud-round-button" onClick={()=>setMenuOpen(true)} aria-label="Ouvrir le menu"><Menu/></button>
      <div className="alhud-platform-switch" aria-label="Mode de travail">
        <button type="button" className={module !== "developpeur" ? "active" : ""} onClick={()=>choose("conversation")}>Chat</button>
        <button type="button" className={module === "developpeur" ? "active" : ""} onClick={()=>choose("developpeur")}>Travail</button>
      </div>
      <button type="button" className="alhud-round-button" onClick={()=>choose("conversation")} aria-label="Conversation"><MessageCircle/></button>
    </header>
    {menuOpen ? <div className="alhud-menu-backdrop" onClick={()=>setMenuOpen(false)}><aside onClick={e=>e.stopPropagation()}><button type="button" className="alhud-menu-close" onClick={()=>setMenuOpen(false)}><X/> Fermer</button>{nav}</aside></div> : null}
    <main className="alhud-approved-main">
      {module === "accueil" ? <Dashboard onOpen={choose}/> :
       module === "developpeur" ? <AgentDeveloppeur initialInstruction={workInstruction} onConsumed={()=>setWorkInstruction("")}/> :
        <Conversation
          key={String(user?.id ?? "anonymous")}
          navigation={nav}
          active={module === "conversation"}
          onActivate={()=>setModule("conversation")}
          onChooseModule={(key)=>choose(key as CleModule)}
          onSendToDeveloper={(instruction)=>{setWorkInstruction(instruction); choose("developpeur");}}
          searchQuery={moduleSearch}
        >{module !== "conversation" ? <Actif/> : null}</Conversation>}
    </main>
    <footer className="alhud-approved-footer">Niveau d'accès : {LABEL_NIVEAU[niveau]} · Plateforme principale</footer>
  </div>;
}
