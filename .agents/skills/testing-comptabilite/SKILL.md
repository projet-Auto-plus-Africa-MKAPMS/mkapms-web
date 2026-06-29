---
name: testing-comptabilite
description: Test comptabilite modules (TVA, Facturation, Paiements, Alertes, Rapports, Banque, Analytique, Abonnements, Publicites) and Centre de Pilotage Groupe PDG (80 tabs across 6 Parties). Use when verifying accounting module UI, tab navigation, modals, expandable rows, progress bars, or cross-module clickable navigation.
---

# Testing Comptabilite Modules + Centre de Pilotage Groupe

## What to Test
- Centre de Pilotage Groupe PDG (80 tabs across 6 Parties, KPIs, expandable rows, cross-module navigation)
  - Partie 1-2: 20 original tabs (Accueil, Performance, Pays, Agences, etc.)
  - Partie 3: 12 tabs (Automatisation, API & Integrations, Surveillance, Securite, Clients, Professionnels, Documents, Sauvegarde, Analyse Strat., Croissance, Tableau Executif, Innovation & R&D)
  - Partie 4: 14 tabs (Centre R&D, Centre Innovation, Investisseurs, Partenariats, Marques, Propriete IP, Expansion, Applications, Domaines, Licences, Formation, Communication, Audits, Gouvernance)
  - Partie 5: 10 tabs (ESG & Durable, Qualite, Conformite, Continuite, Observation Marche, Experience Client, Rewards, IA MKA Centre, Personnalisation, Indicateurs Exec.)
  - Partie 6: 15 tabs (Connecteurs, Marketplaces, Fournisseurs, Constructeurs, Partenaires Fin., Assurances, Transporteurs, Administrations, API Internes, Developpeurs, Apps Connectees, Objets Connectes, Donnees, Supervision, Vision MKA)
- TVA module (4 tabs, declarations list, expandable detail)
- Facturation (invoice list, modal detail with HT/TVA/TTC, creation form, PDF/Excel export)
- Paiements (status filters, method filters, search, transaction list)
- MKA.P-MS Banque (encaissements/decaissements, rapprochement, 6-month previsions)
- Alertes (gravite badges, category filtering, unread indicators)
- Rapports (generation form, historique list, automated schedules with toggles)
- Comptabilite Analytique (dimension filters)
- Abonnements Compta (plan list, status filters)
- Publicites Revenu (campaign tracking)

## Test URLs (Local Dev)

Base URL: `http://localhost:5173` (or next available port like 5174)

| Module | Route |
|--------|-------|
| Centre de Pilotage | `/comptabilite/centre-pilotage` |
| TVA | `/comptabilite/tva` |
| Facturation | `/comptabilite/facturation` |
| Paiements | `/comptabilite/paiements` |
| Analytique | `/comptabilite/analytique` |
| Abonnements | `/comptabilite/abonnements` |
| Publicites | `/comptabilite/publicites` |
| Alertes | `/comptabilite/alertes` |
| Rapports | `/comptabilite/rapports` |
| Banque | `/operations/m-k-a-p-m-s-banque` |

## Components Under Test

| Component | File |
|-----------|------|
| CentrePilotage | `client/src/pages/comptabilite/CentrePilotage.tsx` |
| TVA | `client/src/pages/comptabilite/TVA.tsx` |
| FacturationAvancee | `client/src/pages/comptabilite/FacturationAvancee.tsx` |
| Paiements | `client/src/pages/comptabilite/Paiements.tsx` |
| ComptaAnalytique | `client/src/pages/comptabilite/ComptaAnalytique.tsx` |
| AbonnementsCompta | `client/src/pages/comptabilite/AbonnementsCompta.tsx` |
| PublicitesRevenu | `client/src/pages/comptabilite/PublicitesRevenu.tsx` |
| Alertes | `client/src/pages/comptabilite/Alertes.tsx` |
| Rapports | `client/src/pages/comptabilite/Rapports.tsx` |
| MKAPMSBanque | `client/src/pages/comptabilite/MKAPMSBanque.tsx` |

## Test Procedure

### 1. Centre de Pilotage Groupe (80 tabs across 6 Parties)
1. Navigate to `/comptabilite/centre-pilotage`
2. **Verify:** Header "Centre de Pilotage Groupe" with gold accent
3. **Verify:** Accueil tab active with 18+ KPI cards (CA 588 150 EUR, etc.)
4. **Tip:** Tab bar scrolls horizontally — scroll right extensively to reach Partie 4-6 tabs
5. Click through representative tabs from each Partie:
   - Partie 1-2: Performance, Pays, Financier, Conseil d'Admin
   - Partie 3: Automatisation, Surveillance, Analyse Strat.
   - Partie 4: Centre R&D (6 projects, expandable rows, 3 stat cards), Gouvernance
   - Partie 5: ESG & Durable (5 progress bars), Indicateurs Exec. (100 KPIs in 4 sections)
   - Partie 6: Connecteurs (8 rows with status badges), Supervision (real-time data), Vision MKA (tab #80)
6. **Verify:** Each tab renders its content (no blank screens)

### 2. Cross-Module Navigation (Clickable Financial Numbers)
1. On Centre de Pilotage, go to Financier tab
2. Click "Encaissements" card → **Verify:** navigates to `/comptabilite/paiements`
3. On Centre R&D tab, click "315K EUR" stat card → **Verify:** navigates to `/comptabilite/paiements`
4. On Indicateurs Exec. tab, click "588 150 EUR" → **Verify:** navigates to `/comptabilite/revenus`
5. On Supervision tab, click "12" (Paiements en attente) → **Verify:** navigates to `/comptabilite/paiements`
6. **Key requirement:** User wants ALL financial numbers to be clickable and redirect to the correct module

### 2b. Key Tab-Specific Assertions
- **Centre R&D:** 3 stat cards (Projets actifs=6, Budget total=315K EUR, Approuves=4), 6 project rows with progress bars, expandable details (Budget, Priorite, Cible, Validation)
- **Connecteurs:** 3 stat cards (Actifs=4 green, Desactives=2 red, Planifies=2 amber), 8 connector rows, expand Stripe → Derniere sync date + Desactiver button
- **ESG & Durable:** Green header with Score B+, 5 indicators with progress bars (CO2 12.5t/62%, EV 89/59%, Pieces 1245/62%, Serveurs 78%, Score B+/72%)
- **Indicateurs Exec.:** Gold header, 4 sections (Financiers, Clients, Operations, Croissance) with ~100 KPIs
- **Vision MKA (tab #80):** Gold header "Reserve au fondateur", Mission section, 4-phase roadmap (2026-2035), 5 priorities, 3 confidential projects
- **Supervision:** Dark header, Utilisateurs en ligne (342), Transactions en cours, Incidents (0 actifs)

### 3. TVA Module
1. Navigate to `/comptabilite/tva`
2. **Verify:** 3 summary cards (Collectee, Deductible, Nette)
3. **Verify:** 4 tabs (Resume, Declarations, Historique, Simulation)
4. Click declaration row → **Verify:** expandable detail with Collectee/Deductible/Nette + Detail/PDF buttons

### 4. Facturation
1. Navigate to `/comptabilite/facturation`
2. **Verify:** Summary cards, 5 filter tabs (Toutes, Manuelles, Auto, Avoirs, Brouillons)
3. **Verify:** 10 invoices with status badges (Payee, Envoyee, En retard, Brouillon, Annulee, Avoir)
4. Click invoice → **Verify:** modal with HT/TVA/TTC breakdown + Apercu/PDF/Envoyer/Imprimer/Avoir buttons

### 5. MKA.P-MS Banque
1. Navigate to `/operations/m-k-a-p-m-s-banque`
2. **Verify:** 3 summary cards (Encaissements green, Decaissements red, Solde gold)
3. **Verify:** 5 tabs (Resume, Encaissements, Decaissements, Rapproch., Previsions)
4. Click Previsions → **Verify:** 6-month forecast (Jul-Dec) with Entrees/Sorties/Solde per month
5. **Verify:** "Non rapproche" badges on unreconciled transactions

### 6. Alertes
1. Navigate to `/comptabilite/alertes`
2. **Verify:** 6 filter tabs (Toutes, Urgentes, Paiements, Stock, Abonnements, Securite)
3. **Verify:** Gravite badges with correct colors (Critique=red, Haute=orange, Moyenne=yellow, Info=blue/green)
4. Click Urgentes → **Verify:** only Critique and Haute alerts displayed

### 7. Rapports
1. Navigate to `/comptabilite/rapports`
2. **Verify:** 3 tabs (Generer, Historique, Automatiques)
3. Generer: Type selector (Quotidien/Hebdo/Mensuel/Trimestriel/Annuel), Format selector (PDF/Excel/PDF+Excel)
4. Historique: List of reports with frequency badges and download icons
5. Automatiques: 5 schedules with toggle switches, email recipients

## Important Notes
- All modules use mock data — no backend API calls needed for testing
- Vite dev server may use port 5174-5178 if lower ports are busy — check terminal output
- Centre de Pilotage has 80 tabs in a horizontally scrollable tab bar — scroll right extensively to reach Partie 4-6 tabs (Connecteurs, Supervision, Vision MKA are near the end)
- All financial numbers should be clickable via useNavigate() hooks
- Design uses consistent colors: #111 (dark), #D4AF37 (gold), #F5F3EF (beige), #6B7280 (gray)
- Routes are defined in App.tsx (lazy imports + route definitions)
- CentrePilotage.tsx is ~2800 lines — all 80 tabs in a single file with conditional rendering via useState<MainTab>
- Mock data arrays are at the top of the file (e.g., CONNECTEURS_DATA, RD_PROJECTS, ESG_INDICATORS)
- Expandable rows use a toggle pattern with ChevronDown icon and expanded state
- Status badges use color-coded classes: actif (green), desactive (red), planifie (amber)
- Progress bars render as colored div elements with percentage width

## Starting the Dev Server
```bash
cd /home/ubuntu/repos/mkapms-web
npm run dev
```
The Vite server starts on port 5173 (or next available).

## Devin Secrets Needed
- None required for testing (all modules use mock data)
- Login uses localStorage key `mkapms_token` (for admin features if needed)
