/**
 * MKA.P-MS Intelligence — application dédiée (4e variante mobile,
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
import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
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
  if (!user) return <Navigate to="/connexion" replace />;
  if (niveau !== "pdg") {
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-black/30" />
        <h1 className="mt-3 text-lg font-black text-[#111]">Espace réservé pour l'instant</h1>
        <p className="mt-2 text-sm text-black/60">
          Le moteur réel derrière MKA.P-MS Intelligence (conversation, mémoire, projets, outils) est
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
          <h1 className="text-lg font-black">MKA.P-MS Intelligence</h1>
        </div>
        <p className="mt-1 text-xs text-white/50">
          Niveau d'accès : {LABEL_NIVEAU[niveau]}
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4 md:flex-row">
        <nav className="flex shrink-0 flex-row gap-1.5 overflow-x-auto md:w-56 md:flex-col md:overflow-visible">
          {MODULES.map((m) => (
            <button
              key={m.cle}
              onClick={() => setModule(m.cle)}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors ${
                module === m.cle ? "bg-[#111] text-white" : "bg-black/5 text-black/60 hover:bg-black/10"
              }`}
            >
              <m.icone className="h-4 w-4 shrink-0" />
              {m.label}
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          <Actif />
        </main>
      </div>
    </div>
  );
}
