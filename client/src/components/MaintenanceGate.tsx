/**
 * Point 73 — écran de fermeture au public.
 *
 * Avant, « mode maintenance » ne changeait rien pour un visiteur. Ici, quand la
 * portée qui le concerne est fermée, le visiteur voit une page claire au lieu
 * d'un site à moitié fonctionnel — et la direction, elle, continue de naviguer
 * normalement : fermer au public n'est pas éteindre la plateforme.
 */
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/** Chemins jamais masqués : sans eux, personne ne pourrait rouvrir. */
const TOUJOURS_ACCESSIBLES = ["/connexion", "/admin", "/superadmin"];

export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const acces = trpc.resilience.acces.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  // Tant que l'état n'est pas connu, on n'invente pas une fermeture.
  const exempt = TOUJOURS_ACCESSIBLES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isDirection || exempt || !acces.data || acces.data.open) return <>{children}</>;

  const { level, scope, scopeKey, message } = acces.data;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/15">
          <LifeBuoy size={22} className="text-[#D4AF37]" />
        </div>
        <h1 className="mt-4 text-lg font-black text-[#111]">
          {level === "urgence" ? "MKA.P-MS est momentanément fermée" : "Maintenance en cours"}
        </h1>
        <p className="mt-2 text-sm text-black/60">
          {message ??
            "Le service est temporairement fermé au public. Vos données, vos annonces et vos commandes sont intactes."}
        </p>
        <p className="mt-3 text-[11px] text-black/40">
          {scope === "mondial"
            ? "Fermeture générale"
            : `Fermeture limitée à ${scope === "pays" ? "la juridiction" : "l'univers"} ${scopeKey}`}
        </p>
      </div>
    </div>
  );
}
