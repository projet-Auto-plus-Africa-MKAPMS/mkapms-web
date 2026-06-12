import { router } from "./trpc.js";
import { authRouter } from "./routers/auth.js";
import { annoncesRouter } from "./routers/annonces.js";
import { garagesRouter } from "./routers/garages.js";
import { devisRouter } from "./routers/devis.js";
import { favorisRouter } from "./routers/favoris.js";
import { abonnementsRouter } from "./routers/abonnements.js";
import { reservationsRouter } from "./routers/reservations.js";
import { metaRouter } from "./routers/meta.js";
import { adminRouter } from "./routers/admin.js";
import { supportRouter } from "./routers/support.js";

export const appRouter = router({
  auth: authRouter,
  annonces: annoncesRouter,
  garages: garagesRouter,
  devis: devisRouter,
  favoris: favorisRouter,
  abonnements: abonnementsRouter,
  reservations: reservationsRouter,
  meta: metaRouter,
  admin: adminRouter,
  support: supportRouter,
});

export type AppRouter = typeof appRouter;
