# AL-HUDHUD·M — MAIN workspace and public identity

Scope: additive presentation changes. Existing Centre tabs, persisted conversations, image/voice/transcription, memory, tools, permissions and APIs are preserved. No migrations, provider activation, production secret access or SHOP data transfer.

The Centre now has a single side rail for its existing groups and the existing direction conversation API. Drafts and attachments are kept in component memory by selected conversation while the Centre remains mounted; they are not written to browser storage. Opening history is guarded during a pending send, dictation or history load.

The dedicated app retains every module and keeps the conversation mounted when another tool opens. Mobile navigation uses a native dialog.

Public product name: AL-HUDHUD·M. Generic IA, MKA.P-MS company name, routes, package identifiers, API names, database and MAP are not renamed. Public labels changed by AST string/JSX-text edits:

- client/src/App.tsx
- client/src/components/AssistantFlottant.tsx
- client/src/components/BoutonIntelligences.tsx
- client/src/components/IaConfigWarning.tsx
- client/src/pages/Admin.tsx
- client/src/pages/AssistantIntelligences.tsx
- client/src/pages/CentreAutoBranchement.tsx
- client/src/pages/CentreIntelligences.tsx
- client/src/pages/Compte.tsx
- client/src/pages/DepotAnnonce.tsx
- client/src/pages/Parametres.tsx
- client/src/pages/Vendre.tsx
- client/src/pages/comptabilite/CentrePilotage.tsx
- client/src/pages/depot-annonce/DescriptionAnnonce.tsx
- client/src/pages/depot-annonce/DocumentsAnnonce.tsx
- client/src/pages/intelligence/index.tsx
- client/src/pages/intelligence/modules/Agents.tsx
- client/src/pages/intelligence/modules/Conversation.tsx
- client/src/pages/investissement/modules/Assistant.tsx
- server/intelligences/identite.ts

Logo: AWAITING_APPROVED_ASSET. The exact approved file was not available in this task. No substitute artwork, generated logo or arbitrary external image has been added. public/ai-identity.json accepts only the approved local asset; compact-logo rollout remains pending.

Validation: consult the feature commit CI and the preparation workflow report. Do not infer deployed functionality from this document. Unpublished drafts not pushed by other agents cannot be recovered from GitHub. No open PR was found at initial inspection; merged work up to PR474 is preserved.
