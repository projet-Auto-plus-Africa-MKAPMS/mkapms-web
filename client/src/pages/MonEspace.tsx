/**
 * Point d'entrée unique : « ramène-moi dans mon espace ».
 *
 * La destination vient de l'Account Routing Engine (serveur), avec repli
 * immédiat sur la résolution partagée pour ne pas laisser l'écran vide.
 */
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { homePathForSession } from "../lib/accountRoute";

export default function MonEspace() {
  const { user, isSessionLoading } = useAuth();
  const navigate = useNavigate();
  const mine = trpc.accountRouting.mine.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (!user) return;
    const target = mine.data?.homePath ?? homePathForSession(user);
    navigate(target, { replace: true });
  }, [user, mine.data, navigate]);

  if (!isSessionLoading && !user) return <Navigate to="/connexion" replace />;

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-[#9CA3AF]">
      <Loader2 size={20} className="animate-spin" />
    </div>
  );
}
