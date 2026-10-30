-- Instruction PDG du 30/10 : activation des 62 offres AL-HOUDOUD·M déjà enregistrées.
-- Ne touche QUE la colonne active : aucun prix, aucune durée, aucun crédit, aucun quota,
-- aucune fonctionnalité n'est modifié. N'affecte que le registre existant (payment_products,
-- univers="ia") ; sans effet si les lignes n'ont pas encore été amorcées (seedIaCatalog en
-- seedera désormais directement active=true, voir server/ia-commerce/catalog.ts).
UPDATE payment_products SET active = true, updated_at = now() WHERE univers = 'ia' AND active = false;
