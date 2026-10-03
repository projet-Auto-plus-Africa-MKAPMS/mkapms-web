/**
 * Demande du PDG (3 octobre 2026) : « chaque envoi en mode Travail refait un début de conversation ; je veux rester dans la même
 * tant que je n'en ai pas créé une nouvelle ». Cause : la mission du mode Travail appelait demander() SANS la conversation ouverte
 * (une nouvelle conversation, sans l'historique, à chaque ordre) et l'écran n'adoptait jamais la conversation créée.
 * Sans base : le branchement est vérifié de bout en bout dans le code (écran → routeur → orchestrateur → demander).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (p: string) => readFileSync(p, "utf8");

test("écran : l'ordre du mode Travail porte la conversation ouverte et adopte celle qui lui est renvoyée", () => {
  const ecran = lire("client/src/pages/intelligence/modules/Conversation.tsx");
  assert.match(ecran, /mission\.mutate\(\{[\s\S]*?\n\s+sessionId,\n/, "sessionId transmis avec la mission");
  assert.match(ecran, /typeof r\.sessionId === "number" && r\.sessionId > 0/, "la conversation renvoyée est adoptée");
  assert.match(ecran, /setSessionId\(r\.sessionId\);/);
  assert.match(ecran, /sessionChargee\.current = r\.sessionId;/, "le fil affiché n'est pas rechargé (il garde les étapes de la mission)");
});

test("routeur : la conversation reçue est vérifiée (propriétaire) puis transmise à l'orchestrateur", () => {
  const routeur = lire("server/intelligences/index.ts");
  const mission = routeur.slice(routeur.indexOf("lancerMission:"), routeur.indexOf("progressionMission: pdgProcedure"));
  assert.match(mission, /sessionId: z\.number\(\)\.int\(\)\.positive\(\)\.nullable\(\)\.optional\(\)/);
  assert.match(mission, /exigerProprieteConversation\(input\.sessionId, ctx\.user\.uid\)/);
  assert.match(mission, /sessionId: input\.sessionId \?\? null/);
});

test("orchestrateur : le travail se poursuit dans la conversation ouverte et la renvoie", () => {
  const o = lire("server/intelligences/orchestrateur.ts");
  assert.match(o, /sessionId\?: number \| null;/);
  const travail = o.slice(o.indexOf("async function travailOutille"));
  assert.match(travail, /mode: "travail",[\s\S]*?sessionId: input\.sessionId \?\? null,/, "demander() reçoit la conversation");
  assert.match(travail, /if \(r\.sessionId > 0\) sessionTravail = r\.sessionId;/);
  assert.match(travail, /sessionId: sessionTravail,/, "la mission renvoie la conversation utilisée");
});
