---
name: testing-annonces-categorization
description: Test the annonces categorieAnnonce system (officielle/professionnelle/particulier) including admin-only selector, filters, routing, and badges. Use when verifying annonce deposit UI, category filtering, or routing changes.
---

# Testing Annonces Categorization System

## What to Test
- Admin-only "Type d'annonce" selector on Vendre page (visible only for admin/super_admin/employee)
- Category button switching (Officielle/Professionnelle/Particulier) with correct color-coded styling
- Role-based auto-defaulting (admin -> officielle, pro -> professionnelle, user -> particulier)
- "Publier au nom d'un client" section visibility for admin/employee roles
- Description text updates per category selection
- Rechercher page "Type d'annonce" filter buttons
- Home page "Voir tout" links with categorieAnnonce URL params
- Acheter page routing with categorieAnnonce filtering

## Test URLs (Local Dev)

Base URL: `http://localhost:5173`

| Page | Route | Notes |
|------|-------|-------|
| Vendre (admin) | `/vendre?_devRole=admin` | Shows admin selector |
| Vendre (user) | `/vendre?_devRole=user` | Hides admin selector |
| Vendre (employee) | `/vendre?_devRole=employee` | Shows admin selector |
| Acheter | `/acheter` | Universe selector (VenteGenerale) |
| Acheter Officiel | `/acheter/mkapms-officiel` | Official vehicles sub-page |
| Acheter Pro | `/acheter/professionnel` | Professional vehicles sub-page |
| Acheter Particulier | `/acheter/particulier` | Private vehicles sub-page |
| Rechercher (filters) | `/rechercher` | Has "Type d'annonce" filter section |
| Recherche geo | `/recherche` | Different component, NO category filter |
| Home | `/` | Has "Voir tout" links with categorieAnnonce params |

## Key Routing Architecture

**Critical:** The `/acheter` route renders `VenteGenerale` (App.tsx), NOT `Acheter.tsx`. The `Acheter` component with VENDEURS filter dropdown is imported but never routed - it may be dead code. Sub-routes like `/acheter/mkapms-officiel` render separate components (VenteMKAPMS, VentePro, VenteParticulier).

The "Voir tout" links from Home.tsx use `/acheter?categorieAnnonce=officielle` but VenteGenerale ignores query params. The correct fix is either:
1. Redirect `/acheter?categorieAnnonce=officielle` to `/acheter/mkapms-officiel`
2. Make VenteGenerale respect the categorieAnnonce param

## Components Under Test

| Component | File | Purpose |
|-----------|------|---------|
| Vendre | `client/src/pages/Vendre.tsx` | Deposit form with admin selector |
| VenteGenerale | `client/src/pages/VenteGenerale.tsx` | Acheter universe selector |
| Acheter (unused) | `client/src/pages/Acheter.tsx` | VENDEURS filter (dead code?) |
| Rechercher | `client/src/pages/Rechercher.tsx` | Filter panel with Type d'annonce |
| RechercheGeolocalisee | `client/src/pages/RechercheGeolocalisee.tsx` | Geo search (no category filter) |
| Home | `client/src/pages/Home.tsx` | Voir tout links |
| VehicleCard | `client/src/components/VehicleCard.tsx` | Badge display |

## Auth / Dev Mode

Without a backend, use the temporary `_devRole` URL parameter to inject user roles:
- `?_devRole=admin` - Admin user (shows admin selector, defaults to officielle)
- `?_devRole=employee` - Employee (shows admin selector)
- `?_devRole=user` - Regular user (hides admin selector)
- `?_devRole=pro` - Professional user

This is implemented in `client/src/lib/auth.tsx` as a dev-only feature. It must be reverted before production deployment.

## Test Procedure

### 1. Admin Selector Visibility
1. Navigate to `/vendre?_devRole=admin`
2. Click "Deposer mon annonce gratuite" to enter deposit mode
3. Verify gold-bordered section "TYPE D'ANNONCE (ADMINISTRATION)" with Crown icon
4. Verify 3 buttons: Officielle (gold), Professionnelle (blue), Particulier (green)
5. Verify "Officielle MKA.P-MS" is pre-selected (admin default)
6. Navigate to `/vendre?_devRole=user` and verify section is HIDDEN

### 2. Button Switching
1. From admin view, click each button one by one
2. Verify active button gets color fill (gold/blue/green)
3. Verify description text updates for each selection
4. Verify only one button can be active at a time

### 3. Rechercher Filter
1. Navigate to `/rechercher` (NOT `/recherche`)
2. Scroll down to "Type d'annonce" section (may require scrolling within inner container)
3. Click each button and verify color-coded activation
4. Verify toggle behavior (click active button to deselect)

### 4. Home Page Links
1. Navigate to `/`
2. Find "MKA.P-MS OFFICIEL" section
3. Verify "Voir tout" link href contains `categorieAnnonce=officielle`
4. Find "ANNONCES PARTICULIERS" section
5. Verify "Voir tout" link href contains `categorieAnnonce=particulier`

## Known Issues
- `/acheter` renders VenteGenerale which ignores categorieAnnonce URL params
- `useState` initializer for auto-detection runs before async auth loads (should be useEffect)
- `onBehalfOfEmail` is collected in UI but never sent in mutation payload
- Rechercher filter is on `/rechercher` route, NOT `/recherche` (easy to confuse)
- The Rechercher page has an inner scrollable container (`overflow-y-auto`); regular page scroll may not reach the "Type d'annonce" section - use JavaScript `scrollIntoView` or click within the filter panel area

## Design Colors
- Officielle: `#D4AF37` (gold)
- Professionnelle: `#3B82F6` (blue)
- Particulier: `#22C55E` (green)

## Devin Secrets Needed
- None required for local dev testing
- Login uses localStorage key `mkapms_token` (for admin features in production)
- Dev role injection via `_devRole` URL param (temporary, dev-only)
