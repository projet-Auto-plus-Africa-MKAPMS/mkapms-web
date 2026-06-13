import { Link } from "react-router-dom";
import {
  ShieldCheck,
  BadgeCheck,
  FileCheck2,
  CreditCard,
  RefreshCcw,
  Flag,
  TrendingUp,
  Clock,
} from "lucide-react";

// Centre de confiance (Partie 5 §4) — page publique : sécurité, vérification,
// paiements, remboursements, signalements. Rassure comme les meilleures plateformes.
const PILIERS = [
  {
    icon: FileCheck2,
    titre: "Vérification des documents",
    texte:
      "Les professionnels sont validés (SIRET/KBIS/RIB, identité) avant de pouvoir vendre ou louer. Documents chiffrés, supprimés 30 j après la fin du contrat.",
  },
  {
    icon: ShieldCheck,
    titre: "Indice de Confiance",
    texte:
      "Chaque annonce reçoit un score /100 calculé sur des critères réels : vendeur vérifié, photos détaillées, avis, historique et complétude de l'annonce.",
  },
  {
    icon: TrendingUp,
    titre: "Estimation du juste prix",
    texte:
      "Une estimation intelligente du prix, basée sur les véhicules comparables de la plateforme, vous indique si une annonce est au bon prix.",
  },
  {
    icon: CreditCard,
    titre: "Paiements sécurisés",
    texte:
      "Tous les paiements passent par Stripe (PCI-DSS Level 1). Aucune donnée bancaire n'est stockée sur nos serveurs.",
  },
  {
    icon: RefreshCcw,
    titre: "Acomptes & remboursements",
    texte:
      "Réservation par acompte avec délai clair (24 h). En cas de litige, la procédure de remboursement est tracée et suivie par notre équipe.",
  },
  {
    icon: Flag,
    titre: "Signalement & modération",
    texte:
      "Un bouton de signalement sur chaque annonce. Notre équipe modère en continu et peut suspendre tout contenu non conforme.",
  },
];

const BADGES = [
  "Vendeur vérifié",
  "Vendeur professionnel",
  "Très bien noté",
  "Photos détaillées",
  "Historique disponible",
  "Paiement sécurisé",
];

export default function Confiance() {
  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl text-center">
        <span className="badge bg-brand/10 text-brand">Centre de confiance MKA.P-MS</span>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Acheter, vendre et louer en toute sérénité
        </h1>
        <p className="mt-3 text-slate-500">
          La confiance est au cœur de MKA.P-MS. Voici comment nous protégeons chaque transaction.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PILIERS.map((p) => (
          <div key={p.titre} className="card p-6">
            <p.icon className="text-brand" size={26} />
            <h2 className="mt-3 font-bold text-slate-900">{p.titre}</h2>
            <p className="mt-2 text-sm text-slate-600">{p.texte}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 card p-6">
        <h2 className="font-bold text-slate-900">Les badges qualité</h2>
        <p className="mt-1 text-sm text-slate-500">
          Repérez en un coup d'œil les annonces les plus fiables.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {BADGES.map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              <BadgeCheck size={15} className="text-brand" /> {b}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl bg-brand/5 p-8 text-center">
        <Clock className="text-brand" size={26} />
        <h2 className="text-xl font-bold text-slate-900">Une question, un litige ?</h2>
        <p className="max-w-xl text-sm text-slate-600">
          Notre équipe répond rapidement et suit chaque dossier. Consultez l'aide ou contactez-nous.
        </p>
        <div className="mt-2 flex gap-3">
          <Link to="/aide" className="btn-outline">
            Centre d'aide
          </Link>
          <Link to="/acheter" className="btn-primary">
            Voir les annonces
          </Link>
        </div>
      </div>
    </div>
  );
}
