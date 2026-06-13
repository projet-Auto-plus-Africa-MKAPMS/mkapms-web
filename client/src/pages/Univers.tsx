import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";

const STATUS_LABEL: Record<string, string> = {
  active: "Actif",
  masque: "Bientôt",
  maintenance: "Maintenance",
  desactive: "Désactivé",
};

const LINKS: Record<string, string> = {
  vente: "/acheter",
  location: "/louer",
  garage: "/garages",
  devis: "/devis",
  pieces: "/pieces",
  livraison: "/livraison",
  depannage: "/depannage",
  vtc_taxi: "/vtc-taxi",
  import_africa: "/import-africa",
  historique: "/historique",
  wallet: "/wallet",
};

export default function Univers() {
  const modules = trpc.modules.list.useQuery();

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Les univers MKA.P-MS</h1>
      <p className="mt-1 text-sm text-slate-500">
        Chaque univers fonctionne de façon indépendante — « comme un pays dans une fédération ».
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {modules.data?.filter((m) => m.visiblePublic).map((m) => {
          const to = LINKS[m.code];
          const inner = (
            <div className={`card h-full p-5 transition ${m.status === "active" ? "hover:shadow-md" : "opacity-70"}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{m.nom}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${m.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {STATUS_LABEL[m.status] ?? m.status}
                </span>
              </div>
              {m.description && <p className="mt-2 text-sm text-slate-500">{m.description}</p>}
            </div>
          );
          return to && m.status === "active" ? (
            <Link key={m.id} to={to}>{inner}</Link>
          ) : (
            <div key={m.id}>{inner}</div>
          );
        })}
        {modules.data && modules.data.length === 0 && (
          <p className="col-span-full py-8 text-center text-slate-500">Modules en cours d'initialisation.</p>
        )}
      </div>
    </div>
  );
}
