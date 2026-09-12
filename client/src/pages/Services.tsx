import { Link } from "react-router-dom";
import {
  Wrench, Truck, FileCheck, Search, Shield, TrendingUp, CreditCard, Package,
  type LucideIcon,
} from "lucide-react";

interface Service {
  icon: LucideIcon;
  label: string;
  desc: string;
  to: string;
}

const SERVICES: Service[] = [
  { icon: Wrench, label: "Garage & réparation", desc: "Trouver un garage vérifié, devis et rendez-vous", to: "/garages" },
  { icon: Search, label: "Contrôle technique", desc: "Prise en charge 100 % en ligne", to: "/garage/controle-technique" },
  { icon: TrendingUp, label: "Reprise & estimation", desc: "Estimation gratuite de votre véhicule", to: "/acheter/estimation" },
  { icon: Truck, label: "Livraison", desc: "France & international, suivi en temps réel", to: "/livraison" },
  { icon: Package, label: "Dépannage 24h/24", desc: "Assistance routière", to: "/depannage" },
  { icon: FileCheck, label: "Carte grise", desc: "Démarches administratives simplifiées", to: "/carte-grise" },
  { icon: CreditCard, label: "Financement", desc: "Crédit auto, LOA, paiement en plusieurs fois", to: "/finance" },
  { icon: Shield, label: "Démarches & documents", desc: "Suivi de dossier, signatures, archives", to: "/demarches" },
];

export default function Services() {
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Tous nos services</h1>
      <p className="mt-2 text-sm text-slate-500">
        Les services MKA.P-MS disponibles autour de votre véhicule, avant et après l'achat.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              to={s.to}
              className="card flex items-start gap-3 p-4 transition hover:shadow-md"
            >
              <Icon size={22} className="mt-0.5 shrink-0 text-[#D4AF37]" />
              <div>
                <p className="font-bold text-slate-900">{s.label}</p>
                <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
