/**
 * MKA.P-MS AI — application dédiée (4e variante mobile,
 * com.mkapms.intelligence, chemin /intelligence).
 *
 * Produit autonome, distinct de l'assistant intégré (AssistantIntelligences.tsx,
 * route /intelligences) qui reste dans les autres applications. Les deux
 * partagent le même moteur derrière (server/intelligences/) — cette page ne
 * duplique rien, elle est une seconde façade.
 *
 * Socle uniquement : cette page racine est un shell léger — navigation entre
 * modules et niveau d'accès affiché. Chaque module vit dans son propre
 * fichier sous ./modules/, aujourd'hui à l'état de squelette (aucun n'est
 * encore construit), pour que cette page ne devienne jamais un fichier
 * unique contenant tout le produit.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AssistantBrand } from "./WorkspaceRail";
import { Link } from "react-router-dom";
import {
  Bot,
  ChevronLeft,
  Code2,
  FileText,
  FolderKanban,
  Gauge,
  History,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  Plug,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Wrench,
  Brain as BrainIcon,
  Workflow,
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

type CleModule =
  | "conversation"
  | "voix"
  | "images"
  | "documents"
  | "recherche"
  | "memoire"
  | "projets"
  | "agents"
  | "outils"
  | "code"
  | "automatisations"
  | "integrations"
  | "parametres"
  | "permissions"
  | "usage"
  | "historique";

const MODULES: { cle: CleModule; label: string; icone: typeof MessageCircle; Composant: () => JSX.Element }[] = [
  { cle: "conversation", label: "Conversation", icone: MessageCircle, Composant: Conversation },
  { cle: "voix", label: "Voix & temps réel", icone: Mic, Composant: VoixTempsReel },
  { cle: "images", label: "Images", icone: ImageIcon, Composant: Images },
  { cle: "documents", label: "Fichiers & documents", icone: FileText, Composant: FichiersDocuments },
  { cle: "recherche", label: "Recherche", icone: Search, Composant: Recherche },
  { cle: "memoire", label: "Mémoire", icone: BrainIcon, Composant: Memoire },
  { cle: "projets", label: "Projets", icone: FolderKanban, Composant: Projets },
  { cle: "agents", label: "Agents", icone: Bot, Composant: Agents },
  { cle: "outils", label: "Outils", icone: Wrench, Composant: Outils },
  { cle: "code", label: "Code & développement", icone: Code2, Composant: CodeDeveloppement },
  { cle: "automatisations", label: "Automatisations", icone: Workflow, Composant: Automatisations },
  { cle: "integrations", label: "Intégrations & API", icone: Plug, Composant: IntegrationsApi },
  { cle: "usage", label: "Usage & coûts", icone: Gauge, Composant: UsageCouts },
  { cle: "historique", label: "Historique", icone: History, Composant: Historique },
  { cle: "permissions", label: "Permissions", icone: ShieldCheck, Composant: Permissions },
  { cle: "parametres", label: "Paramètres", icone: Settings, Composant: Parametres },
];

const LABEL_NIVEAU: Record<NiveauIntelligence, string> = Object.fromEntries(
  NIVEAUX_INTELLIGENCE.map((n) => [n.niveau, n.label]),
) as Record<NiveauIntelligence, string>;

export default function MKAPMSIntelligence() {
  const { user } = useAuth();
  const [module, setModule] = useState<CleModule>("conversation");
  const [moduleSearch, setModuleSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const appDrawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog=appDrawer.current;
    if(!dialog)return;
    if(drawerOpen && !dialog.open)dialog.showModal();
    if(!drawerOpen && dialog.open)dialog.close();
  },[drawerOpen]);

  // Clé développeur active : non branché ici (aucune fonctionnalité de module
  // n'existe encore) — false tant qu'un vrai module ne le demande.
  const niveau = useMemo(() => niveauDepuis({ role: user?.role ?? null }), [user?.role]);

  const Actif = MODULES.find((m) => m.cle === module)?.Composant ?? Conversation;

  // LOT IA02B — le moteur réel derrière chaque module construit dans ce lot
  // (conversation, historique, mémoire, projets, outils, permissions,
  // paramètres, intégrations, usage) reste aujourd'hui réservé à la
  // direction (server/intelligences/index.ts::pdgProcedure) : ouvrir l'accès
  // aux autres niveaux de l'échelle est un lot suivant, pas une omission de
  // celui-ci. Même message que le côté direction historique
  // (CentreIntelligences.tsx) pour ne pas inventer un second discours.
  //
  // Jamais de redirection immédiate vers /connexion ici : `user` reste null
  // le temps que la session s'hydrate au chargement (AuthProvider), même pour
  // un PDG déjà connecté — une redirection sur ce court instant renverrait un
  // compte PDG réel hors de la page avant même que son rôle soit connu. Comme
  // CentreIntelligences.tsx, on affiche le même écran « réservé » tant que
  // `user` n'est pas encore résolu ; il se corrige seul dès que la session
  // charge, sans navigation forcée.
  if (niveau !== "pdg") {
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-black/30" />
        <h1 className="mt-3 text-lg font-black text-[#111]">Espace réservé pour l'instant</h1>
        <p className="mt-2 text-sm text-black/60">
          Le moteur réel derrière AL-HUDHUD·M (conversation, mémoire, projets, outils) est
          aujourd'hui réservé au compte PDG. Les autres niveaux d'accès (professionnel, développeur,
          équipe interne, direction) arriveront avec les lots suivants — l'assistant public reste
          accessible partout ailleurs sur la plateforme.
        </p>
        <Link to="/intelligences" className="mt-4 inline-block text-sm font-bold text-[#8B7500]">
          Ouvrir l'assistant public
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-black/5 bg-[#0B0B0F] px-4 py-4 text-white">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-white/60">
          <ChevronLeft className="h-3.5 w-3.5" /> MKA.P-MS
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#D4AF37]" />
          <h1 className="text-lg font-black">AL-HUDHUD·M</h1>
        </div>
        <p className="mt-1 text-xs text-white/50">
          Niveau d'accès : {LABEL_NIVEAU[niveau]}
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4 md:flex-row">
        <aside className="hidden w-64 shrink-0 md:block"><div className="alhud-app-sidebar">
            <AssistantBrand />
            <label className="alhud-search"><input type="search" aria-label="Rechercher un outil" value={moduleSearch} onChange={e=>setModuleSearch(e.target.value)} placeholder="Rechercher un outil…" /></label>
            <nav className="alhud-app-modules" aria-label="Outils de l’assistant">
              {MODULES.filter(item=>item.label.toLocaleLowerCase().includes(moduleSearch.toLocaleLowerCase())).map(item=>(
                <button key={item.cle} type="button" aria-current={module===item.cle?'page':undefined} onClick={()=>{setModule(item.cle);setDrawerOpen(false);}} className={module===item.cle?'rounded-xl bg-[#111] px-3 py-2 text-sm font-bold text-white':'rounded-xl px-3 py-2 text-sm text-black/70 hover:bg-black/5'}><item.icone className="mr-2 inline-block h-4 w-4" />{item.label}</button>
              ))}
            </nav>
          </div></aside>
        <button className="alhud-menu-button md:!hidden" type="button" aria-haspopup="dialog" aria-expanded={drawerOpen} onClick={()=>setDrawerOpen(true)}>Conversations et outils</button>
        <dialog ref={appDrawer} className="alhud-drawer" aria-label="Outils de l’assistant" onCancel={e=>{e.preventDefault();setDrawerOpen(false);}}><button type="button" className="alhud-icon-control" onClick={()=>setDrawerOpen(false)}>Fermer</button><div className="alhud-app-sidebar">
            <AssistantBrand />
            <label className="alhud-search"><input type="search" aria-label="Rechercher un outil" value={moduleSearch} onChange={e=>setModuleSearch(e.target.value)} placeholder="Rechercher un outil…" /></label>
            <nav className="alhud-app-modules" aria-label="Outils de l’assistant">
              {MODULES.filter(item=>item.label.toLocaleLowerCase().includes(moduleSearch.toLocaleLowerCase())).map(item=>(
                <button key={item.cle} type="button" aria-current={module===item.cle?'page':undefined} onClick={()=>{setModule(item.cle);setDrawerOpen(false);}} className={module===item.cle?'rounded-xl bg-[#111] px-3 py-2 text-sm font-bold text-white':'rounded-xl px-3 py-2 text-sm text-black/70 hover:bg-black/5'}><item.icone className="mr-2 inline-block h-4 w-4" />{item.label}</button>
              ))}
            </nav>
          </div></dialog>


        <main className="min-w-0 flex-1">
          <div hidden={module !== "conversation"}><Conversation /></div>
          {module !== "conversation" ? <Actif /> : null}
        </main>
      </div>
    </div>
  );
}
