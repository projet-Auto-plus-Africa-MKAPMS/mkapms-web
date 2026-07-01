---
name: testing-location-pages
description: Test location product pages (photo categories, expandable pricing, gallery) across all universes. Use when verifying location page UI or photo/pricing changes.
---

# Testing Location Product Pages

## What to Test
- Photo category filtering (10 tabs: Toutes, Extérieur, Intérieur, Sièges, Tableau de bord, Coffre, Moteur, Roues, Documents, Autres)
- Expandable pricing section (6 tiers in 3x2 grid, collapsed by default)
- Full-screen gallery with preserved category tabs
- Consistency across all location universes

## Test URLs (Staging)

Base URL: `https://mkapms-app-production.up.railway.app`

| Universe | Route | Valid Demo IDs |
|----------|-------|----------------|
| VTC/Taxi | `/louer/vtc-taxi/vehicule/:id` | `1` |
| Particulier | `/louer/particulier/vehicule/:id` | `1` |
| Pro | `/louer/pro/vehicule/:id` | `8001`-`8010` |
| Camions | `/louer/camions/vehicule/:id` | `7001`-`7008` |
| Minibus | `/louer/minibus/vehicule/:id` | `6001`-`6007` |
| Utilitaires | `/louer/utilitaires/vehicule/:id` | Same as Pro (`8001`+) |

**Important:** Pro/Camions/Minibus/Utilitaires do NOT use ID `1`. Using invalid IDs shows "Véhicule introuvable" — this is expected behavior.

## Components Under Test

| Component | File |
|-----------|------|
| ProduitVtcTaxi | `client/src/pages/ProduitVtcTaxi.tsx` |
| ProduitParticulier | `client/src/pages/ProduitParticulier.tsx` |
| ProduitLocation (Pro/Utilitaires/Camions/Minibus) | `client/src/pages/ProduitLocation.tsx` |

## Test Procedure

### 1. Photo Category Filtering
1. Navigate to a product page
2. Verify "Toutes" tab is active (gold highlight) with total photo count
3. Click different category tabs (Extérieur, Sièges, Coffre, etc.)
4. **Verify:** Counter changes to reflect only photos in that category
5. **Verify:** Active tab gets gold highlight, others lose it

### 2. Expandable Pricing
1. Scroll to "Tarifs de location" gold button
2. **Verify:** Shows "À partir de X €/jour" and pricing grid is NOT visible
3. Click the button
4. **Verify:** 6 tiers appear in 3x2 grid (Jour, 3 Jours, Semaine, 2 Sem., Mois, 3 Mois)
5. Click again → **Verify:** Grid collapses

### 3. Full-Screen Gallery
1. Click the main photo
2. **Verify:** Full-screen overlay opens with same category tabs
3. **Verify:** Category selection is preserved from main page
4. Click a different tab → **Verify:** Counter updates
5. Click back/close → **Verify:** Returns to main page

## Price Calculation Formula
```
Jour = prixJour
3 Jours = Math.round(prixJour * 2.7)
Semaine = prixSemaine
2 Sem. = Math.round(prixSemaine * 1.8)
Mois = prixMois
3 Mois = Math.round(prixMois * 2.7)
```

## Known Issues
- Left/right arrow nav buttons might still be present on ProduitLocation photo area (user requested removal on home page cards, may need clarification for product pages)
- VTC/Taxi and Particulier pages have arrows removed via CSS

## Devin Secrets Needed
- None required for testing (staging is publicly accessible)
- Login uses localStorage key `mkapms_token` (for admin features)
