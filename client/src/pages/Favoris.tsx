import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import VehicleCard from "../components/VehicleCard";

export default function Favoris() {
  const { user } = useAuth();
  const favoris = trpc.favoris.mine.useQuery(undefined, { enabled: !!user });

  if (!user) {
    return (
      <div className="container-page py-16 text-center">
        <Heart className="mx-auto mb-3 text-slate-300" size={40} />
        <p className="text-slate-500">Connectez-vous pour retrouver vos véhicules favoris.</p>
        <Link to="/connexion" className="btn-primary mt-4 inline-flex">Se connecter</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center gap-2">
        <Heart className="text-gold-dark" size={22} />
        <h1 className="text-2xl font-extrabold text-slate-900">Mes favoris</h1>
      </div>

      {favoris.isLoading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card aspect-[4/5] animate-pulse bg-slate-100" />
          ))}
        </div>
      )}

      {favoris.data && favoris.data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {favoris.data.map((f) => (
            <VehicleCard key={f.annonce.id} v={f.annonce as any} />
          ))}
        </div>
      )}

      {favoris.data && favoris.data.length === 0 && (
        <div className="card mx-auto max-w-md p-8 text-center">
          <Heart className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="font-semibold text-slate-700">Aucun favori pour le moment</p>
          <p className="mt-1 text-sm text-slate-500">
            Cliquez sur le cœur d'une annonce pour l'enregistrer ici et la retrouver facilement.
          </p>
          <Link to="/acheter" className="btn-primary mt-4 inline-flex">Parcourir les véhicules</Link>
        </div>
      )}
    </div>
  );
}
