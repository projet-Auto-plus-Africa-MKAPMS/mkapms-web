/**
 * IA centrale PDG — demandes non résolues : regroupement par signature (capacité/outil × gravité),
 * comptage, annotation PDG, et surtout confidentialité — jamais une fuite du texte libre utilisateur
 * (arguments_json/resultat_json d'in_outils_journal) dans le résultat regroupé. Base LOCALE jetable
 * (SHOP_KNOWLEDGE_TEST_DB, base « core_ai_test ») — jamais une base partagée.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("demandes non résolues : regroupement, comptage, annotation, aucune fuite de contenu privé", async () => {
  const url = new URL(process.env.SHOP_KNOWLEDGE_TEST_DB || "");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.equal(url.pathname, "/core_ai_test");
  process.env.DATABASE_URL = url.href;
  const { pool } = await import("../../db.js");
  try {
    await pool.query("DROP TABLE IF EXISTS in_outils_journal, in_capacite_refus_journal, in_demandes_annotations");
    await pool.query(readFileSync(new URL("../../../drizzle/0110_intelligences_outils_journal.sql", import.meta.url), "utf8"));
    await pool.query(`ALTER TABLE in_outils_journal ADD COLUMN IF NOT EXISTS trace_id varchar(40) NOT NULL DEFAULT ''`);
    await pool.query(readFileSync(new URL("../../../drizzle/0171_demandes_non_resolues.sql", import.meta.url), "utf8"));

    const { inOutilsJournal } = await import("../schema.js");
    const { signalerRefusCapacite, listerDemandesNonResolues, annoterDemande } = await import("../demandes-non-resolues.js");

    // 1. Signalement d'un refus de capacité (routeur.ts) : jamais le texte libre de la demande.
    await signalerRefusCapacite({
      capacite: "video" as any,
      moteur: "chat",
      role: "particulier",
      confidentialite: "publique",
      countryCode: "FR",
      motif: "Aucun fournisseur au catalogue pour cette capacité : elle n'est pas exécutable aujourd'hui.",
    });
    await signalerRefusCapacite({
      capacite: "video" as any,
      moteur: "travail",
      role: "pdg",
      motif: "Aucun fournisseur au catalogue pour cette capacité : elle n'est pas exécutable aujourd'hui.",
    });

    // 2. Trois occurrences d'un outil non implémenté (71 REGISTERED_NOT_IMPLEMENTED de l'audit), avec un
    //    « argument » contenant un secret apparent qui ne doit JAMAIS ressortir du regroupement.
    const secretUtilisateur = "mot de passe client : S3cr3t!2026 — numéro de carte 4111-1111-1111-1111";
    const { db } = await import("../../db.js");
    for (let i = 0; i < 3; i++) {
      await db.insert(inOutilsJournal).values({
        toolId: "dev.deployerSiteClient",
        moteur: "chat",
        role: "pro",
        verdictPolitique: "autorise",
        statutExecution: "non_implemente",
        motif: `« dev.deployerSiteClient » est enregistré (REGISTERED_NOT_IMPLEMENTED) mais pas encore câblé.`,
        argumentsJson: JSON.stringify({ texte: secretUtilisateur }),
        resultatJson: null,
      });
    }
    // Un appel réussi du même outil (hypothétiquement implémenté plus tard) ne doit jamais apparaître
    // dans le regroupement des demandes non résolues.
    await db.insert(inOutilsJournal).values({
      toolId: "dev.deployerSiteClient",
      moteur: "chat",
      role: "pro",
      verdictPolitique: "autorise",
      statutExecution: "execute",
      motif: "",
      argumentsJson: null,
      resultatJson: null,
    });
    // Un refus de politique pure (permission) : catégorie "politique", jamais "lacune".
    await db.insert(inOutilsJournal).values({
      toolId: "coffre.lireSecret",
      moteur: "chat",
      role: "particulier",
      verdictPolitique: "refuse",
      statutExecution: null,
      motif: "« Secrets du coffre » : permission non attribuée à ce moteur.",
      argumentsJson: null,
      resultatJson: null,
    });

    // 3. Le regroupement : une ligne par (domaine, clé, gravité), jamais par occurrence individuelle.
    const toutes = await listerDemandesNonResolues();
    const video = toutes.find((d) => d.domaine === "capacite" && d.cle === "video");
    assert.ok(video, "la capacité vidéo refusée doit apparaître");
    assert.equal(video!.occurrences, 2);
    assert.equal(video!.gravite, "lacune");
    assert.deepEqual(new Set(video!.moteurs), new Set(["chat", "travail"]));
    assert.deepEqual(new Set(video!.roles), new Set(["particulier", "pdg"]));

    const deploy = toutes.find((d) => d.domaine === "outil" && d.cle === "dev.deployerSiteClient");
    assert.ok(deploy, "l'outil non implémenté doit apparaître");
    assert.equal(deploy!.occurrences, 3, "seules les 3 occurrences non_implemente comptent, pas l'appel exécuté avec succès");
    assert.equal(deploy!.gravite, "lacune");
    assert.equal(deploy!.statut, "nouveau", "aucune annotation posée encore");

    const secretsRefus = toutes.find((d) => d.domaine === "outil" && d.cle === "coffre.lireSecret");
    assert.ok(secretsRefus, "le refus de politique doit aussi apparaître (signal de demande non satisfaite)");
    assert.equal(secretsRefus!.gravite, "politique", "un refus de permission n'est pas une lacune de compétence");

    // 4. Confidentialité : le secret utilisateur injecté dans arguments_json ne doit JAMAIS ressortir,
    //    ni dans les motifs exemples, ni ailleurs dans l'objet sérialisé.
    const serialise = JSON.stringify(toutes);
    assert.ok(!serialise.includes("S3cr3t"), "aucune fuite du contenu privé de l'utilisateur");
    assert.ok(!serialise.includes("4111-1111"), "aucune fuite du contenu privé de l'utilisateur");

    // 5. Filtre par gravité.
    const seulementLacunes = await listerDemandesNonResolues("lacune");
    assert.ok(seulementLacunes.every((d) => d.gravite === "lacune"));
    assert.ok(seulementLacunes.some((d) => d.cle === "dev.deployerSiteClient"));
    assert.ok(!seulementLacunes.some((d) => d.cle === "coffre.lireSecret"));

    // 6. Annotation PDG : upsert par signature, visible au prochain listing.
    await annoterDemande({ signature: deploy!.signature, statut: "planifie", note: "Mission X — en développement.", actorId: 7 });
    const apres = await listerDemandesNonResolues();
    const deployApres = apres.find((d) => d.signature === deploy!.signature);
    assert.equal(deployApres!.statut, "planifie");
    assert.equal(deployApres!.note, "Mission X — en développement.");
    // Rejouer l'annotation (changement de note) : une seule ligne en base, pas un historique qui s'accumule.
    await annoterDemande({ signature: deploy!.signature, statut: "resolu", note: "Déployé.", actorId: 7 });
    const compteAnnotations = (await pool.query("SELECT count(*)::int n FROM in_demandes_annotations")).rows[0].n;
    assert.equal(compteAnnotations, 1);
  } finally {
    await pool.end();
  }
});
