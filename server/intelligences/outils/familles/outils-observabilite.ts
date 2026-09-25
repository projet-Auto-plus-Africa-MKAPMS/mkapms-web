/** Lecture de la supervision existante, réservée à la Direction authentifiée. */
import { registryOverview } from '../../../engine-registry/readiness.js';
import { MOTEURS } from '../../../data/moteurs.js';
import type { ImplementationOutil } from '../outils-test.js';

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  'observabilite.getSystemHealth': async (args, context) => {
    if (!context?.actorId || !['admin', 'super_admin'].includes(context.role ?? '')) {
      throw new Error('Session Direction authentifiée requise.');
    }
    if (args.engine !== undefined && (typeof args.engine !== 'string' || !args.engine.trim())) {
      throw new Error('Identifiant moteur invalide.');
    }
    const overview = await registryOverview();
    const engine = typeof args.engine === 'string' ? args.engine : undefined;
    if (engine && !overview.moteurs.some(m => m.name === engine) && !MOTEURS.some(m => m.moteur === engine)) {
      throw new Error(`Moteur introuvable : ${engine}.`);
    }
    const names = new Set([...MOTEURS.map(m => m.moteur), ...overview.moteurs.map(m => m.name)]);
    const motors = [...names].filter(name => !engine || name === engine).map(name => {
      const live = overview.moteurs.find(m => m.name === name);
      const source = MOTEURS.find(m => m.moteur === name);
      return {
        name,
        etatObserve: live ?? null,
        registreAbsent: !live,
        inventaireCode: source ? {
          routeurs: source.routeurs,
          procedures: engine ? source.procedures : source.procedures.length,
          dependances: source.dependances,
          dependants: source.dependants,
          manques: engine ? source.manques : source.manques.length,
          battementDeclare: source.battement,
        } : null,
      };
    });
    return {
      checkedAt: overview.checkedAt,
      totalEnregistre: overview.total,
      totalCatalogue: MOTEURS.length,
      parEtat: overview.parEtat,
      moteurs: motors,
      limite: 'État observé du registre et inventaire statique distincts. Aucun test métier exécuté ni correction ou activation appliquée par cette lecture.',
    };
  },
};
