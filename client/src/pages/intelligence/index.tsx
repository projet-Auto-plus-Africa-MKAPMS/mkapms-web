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
  Laptop, Grid2X2, ClipboardCheck, KeyRound, X
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { trpc } from "../../lib/trpc";
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
import { Coffre } from "./modules/Coffre";
import "./workspace.css";

type CleModule =
  | "accueil" | "conversation" | "developpeur" | "voix" | "images" | "documents" | "recherche"
  | "memoire" | "projets" | "agents" | "outils" | "code" | "automatisations"
  | "integrations" | "parametres" | "permissions" | "usage" | "historique" | "coffre";

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
  { cle: "coffre", label: "Coffre secret", icone: KeyRound, Composant: Coffre },
  { cle: "parametres", label: "Paramètres", icone: Settings, Composant: Parametres },
];

const LABEL_NIVEAU: Record<NiveauIntelligence, string> = Object.fromEntries(
  NIVEAUX_INTELLIGENCE.map((n) => [n.niveau, n.label]),
) as Record<NiveauIntelligence, string>;

type Indicateur = { niveau: "ok" | "attention" | "ko" | "inconnu"; libelle: string; detail: string };
const PUCE: Record<Indicateur["niveau"], string> = { ok: "●", attention: "▲", ko: "■", inconnu: "○" };

function Etat({ ind, chargement }: { ind: Indicateur | undefined; chargement: boolean }) {
  if (chargement) return <span className="alhud-etat-inconnu" title="Vérification en cours">…</span>;
  if (!ind) return <span className="alhud-etat-inconnu" title="État non vérifié : le serveur n'a pas répondu">○ Non vérifié</span>;
  return <span className={`alhud-etat-${ind.niveau}`} title={ind.detail}>{PUCE[ind.niveau]} {ind.libelle}</span>;
}

function Dashboard({ onOpen, boutique }: { onOpen: (key: CleModule) => void; boutique: BoutiqueAcces }) {
  const etats = trpc.intelligences.indicateursAccueil.useQuery(undefined, { refetchInterval: 60_000, refetchOnWindowFocus: false });
  const d = etats.data;
  const ia = d?.ia;
  const work = [
    ["Accueil", Home, "Vue d’ensemble", "accueil"],
    ["Menu", Menu, "Navigation et accès", "conversation"],
    ["Images", ImageIcon, "Créations et références privées", "images"],
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
        <button
          type="button"
          className={`alhud-status-ok alhud-status-${etats.isLoading ? "inconnu" : ia?.niveau ?? "inconnu"}`}
          onClick={() => onOpen(ia?.niveau === "ok" ? "conversation" : "integrations")}
          title={ia?.detail ?? "État de la connexion IA non vérifié"}
        >
          <span>{etats.isLoading ? "…" : PUCE[ia?.niveau ?? "inconnu"]}</span> IA {etats.isLoading ? "vérification…" : ia ? ia.libelle.toLocaleLowerCase() : "non vérifiée"} <ChevronRight />
        </button>
        <div className="alhud-status-list">
          <button type="button" onClick={() => onOpen("documents")}><FileText/>Documents <Etat ind={d?.documents} chargement={etats.isLoading}/></button>
          <button type="button" onClick={() => onOpen("outils")}><Settings/>Moteurs <Etat ind={d?.moteurs} chargement={etats.isLoading}/></button>
          <button type="button" onClick={() => onOpen("permissions")}><ShieldCheck/>Sécurité <Etat ind={d?.securite} chargement={etats.isLoading}/></button>
          <button type="button" onClick={() => onOpen("historique")}><Cloud/>Déploiement <span>Suivi</span></button>
        </div>
        {etats.error ? <p className="alhud-etat-erreur" role="status">États non vérifiés : {etats.error.message}</p> : null}
      </article>
      {boutique.url ? (
        <a className="alhud-platform-card alhud-platform-link" href={boutique.url} target="_blank" rel="noopener noreferrer" aria-label="Ouvrir la Boutique (nouvel onglet)">
          <div className="alhud-platform-heading"><span className="alhud-square violet"><ShoppingCart /></span><span><strong>Boutique</strong><small>Espace Fondateur SHOP · connexion séparée</small></span></div>
          <div className="alhud-status-ok"><span>●</span> Ouvrir la Boutique <ChevronRight /></div>
        </a>
      ) : (
        <article className="alhud-platform-card alhud-platform-disabled" aria-label="Boutique : adresse non configurée">
          <div className="alhud-platform-heading"><span className="alhud-square violet"><ShoppingCart /></span><span><strong>Boutique</strong><small>Adresse SHOP_PUBLIC_URL absente</small></span></div>
          <div className="alhud-status-wait">{boutique.chargement ? "Vérification…" : "Non reliée · adresse à configurer côté serveur"}</div>
        </article>
      )}
    </div>
    <div className="alhud-work-heading"><h2>Notre travail aujourd’hui</h2><button type="button" onClick={() => onOpen("conversation")}>Tout voir <ChevronRight/></button></div>
    <div className="alhud-work-grid">{work.map(([label,Icon,desc,key]) =>
      <button type="button" key={label} onClick={() => onOpen(key)}><span className="alhud-work-icon"><Icon/></span><span><strong>{label}</strong><small>{desc}</small></span><ChevronRight/></button>
    )}</div>
  </section>;
}

type BoutiqueAcces = { url: string | null; chargement: boolean };

export default function MKAPMSIntelligence() {
  const { user } = useAuth();
  const [module, setModule] = useState<CleModule>("conversation");
  const [workMode, setWorkMode] = useState(false);
  const [moduleSearch, setModuleSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [historySlot, setHistorySlot] = useState<HTMLDivElement | null>(null);
  const niveau = useMemo(() => niveauDepuis({ role: user?.role ?? null }), [user?.role]);
  const acces = trpc.intelligences.indicateursAccueil.useQuery(undefined, { enabled: niveau === "pdg", refetchOnWindowFocus: false, staleTime: 60_000 });
  const boutique: BoutiqueAcces = { url: acces.data?.boutique ?? null, chargement: acces.isLoading };

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
  const choose = (key: CleModule) => {
    if (key === "developpeur") { setWorkMode(true); setModule("conversation"); }
    else { if (key === "conversation") setWorkMode(false); setModule(key); }
    setMenuOpen(false);
  };
  const topItems = [
    ["Bibliothèque", Library, "documents"], ["Projets", FolderKanban, "projets"],
    ["Images", ImageIcon, "images"], ["Plugins", Plug, "integrations"], ["Planifié", Clock3, "automatisations"],
    ["À distance", Laptop, "developpeur"], ["Explorer", Grid2X2, "recherche"],
  ] as const;
  const workItems = [
    ["Accueil", Home, "accueil"], ["Suivi du chantier", BarChart3, "developpeur"],
    ["Images", ImageIcon, "images"], ["Documents", FileText, "documents"], ["Vérification IA", FileCheck2, "outils"],
    ["Audit", ClipboardCheck, "historique"], ["Coffre secret", KeyRound, "coffre"], ["Paramètres", Settings, "parametres"],
  ] as const;

  const renderNav = (withHistory: boolean) => <div className="alhud-approved-menu">
    <div className="alhud-menu-brand"><strong>AL-HUDHUD·M</strong><Search/></div>
    <label className="alhud-search"><input type="search" value={moduleSearch} onChange={e=>setModuleSearch(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher"/></label>
    <nav>{topItems.filter(([label])=>normalise(label).includes(normalise(moduleSearch))).map(([label,Icon,key])=><button key={label} type="button" onClick={()=>choose(key)}><Icon/><span>{label}</span><ChevronRight/></button>)}</nav>
    {withHistory ? <div ref={setHistorySlot} className="alhud-menu-history" aria-label="Conversations"/> : null}
    <h3>Espaces IA</h3>
    <button type="button" className="selected" onClick={()=>choose("accueil")}><Database/><span>Plateforme principale</span><ChevronRight/></button>
    {boutique.url
      ? <a href={boutique.url} target="_blank" rel="noopener noreferrer" onClick={()=>setMenuOpen(false)} aria-label="Ouvrir la Boutique (nouvel onglet)"><ShoppingCart/><span>Boutique</span><ChevronRight/></a>
      : <button type="button" disabled aria-disabled="true" title="Adresse SHOP_PUBLIC_URL non configurée côté serveur"><ShoppingCart/><span>Boutique</span><small>{boutique.chargement ? "…" : "non reliée"}</small></button>}
    <h3>Notre travail</h3>
    <nav>{workItems.map(([label,Icon,key])=><button key={label} type="button" onClick={()=>choose(key)}><Icon/><span>{label}</span><ChevronRight/></button>)}</nav>
    <button type="button" className="alhud-chat-cta" onClick={()=>choose("conversation")}><MessageCircle/> Chat</button>
  </div>;
  const nav = renderNav(false);

  return <div className="alhud-approved-shell">
    <header className="alhud-approved-header">
      <button type="button" className="alhud-round-button" onClick={()=>setMenuOpen(true)} aria-label="Ouvrir le menu"><Menu/></button>
      <div className="alhud-platform-switch" aria-label="Mode de travail">
        <button type="button" className={!workMode ? "active" : ""} onClick={()=>choose("conversation")}>Chat</button>
        <button type="button" className={workMode ? "active" : ""} onClick={()=>choose("developpeur")}>Travail</button>
      </div>
      <div className="alhud-header-actions">
        <button type="button" className="alhud-round-button" onClick={()=>choose("images")} aria-label="Créer une image"><ImageIcon/></button>
        <button type="button" className="alhud-round-button" onClick={()=>choose("recherche")} aria-label="Recherche"><Search/></button>
        <button type="button" className="alhud-round-button" onClick={()=>choose("conversation")} aria-label="Conversation"><MessageCircle/></button>
      </div>
    </header>
    {menuOpen ? <div className="alhud-menu-backdrop" onClick={()=>setMenuOpen(false)}><aside onClick={e=>e.stopPropagation()}><button type="button" className="alhud-menu-close" onClick={()=>setMenuOpen(false)}><X/> Fermer</button>{renderNav(true)}</aside></div> : null}
    <main className="alhud-approved-main">
      {module === "accueil" ? <Dashboard onOpen={choose} boutique={boutique}/> : null}
      <div hidden={module === "accueil"} className="alhud-conversation-slot">
        <Conversation
          key={`${String(user?.id ?? "anonymous")}-${workMode ? "travail" : "chat"}`}
          navigation={nav}
          active={module === "conversation"}
          mode={workMode ? "travail" : "chat"}
          onActivate={()=>setModule("conversation")}
          onChooseModule={(key)=>choose(key as CleModule)}
          searchQuery={moduleSearch}
          historySlot={menuOpen ? historySlot : null}
          onHistoryAction={()=>setMenuOpen(false)}
        >{module === "parametres"
          ? <Parametres onChooseModule={(key) => choose(key as CleModule)} />
          : module !== "conversation" && module !== "accueil" && module !== "developpeur"
            ? <Actif />
            : null}</Conversation>
      </div>
    </main>
    <footer className="alhud-approved-footer">Niveau d'accès : {LABEL_NIVEAU[niveau]} · Plateforme principale</footer>
  </div>;
}
