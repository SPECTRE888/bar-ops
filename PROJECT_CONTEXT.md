# Bar Ops — Plateforme SaaS Gestion Événementielle

## Vision
Plateforme simple et fiable pour gérer l'organisation complète d'événements bar/catering : clients, cocktails, staff, logistique, devis.

## Stack
- **Frontend** : HTML/JS vanilla (zéro dépendances)
- **Backend** : Supabase (auth + DB)
- **Paiement** : Stripe
- **Hosting** : Netlify (auto-deploy)

## Architecture Principale

### Pages Clés
- **Événements** : Création et gestion complète des prestations
- **Cocktails** : Catalogue avec coûts, prix, ingrédients
- **Équipe** : Gestion staff avec tarifs horaires
- **Fiche Prestation** : Vue complète d'un événement avec devis
- **Liste de courses** : Génération automatique depuis cocktails sélectionnés
- **Suivi** : Dashboard financier avec CA, marges, acomptes
- **Planning** : Calendrier mensuel des événements
- **Historique** : Récapitulatif des prestations passées avec recherche

### Flux Métier
```
Client → Événement → Cocktails → Staff → Logistique → Devis → Paiement
```

## Données Clés

### Event
```javascript
{
  id, name, date, location, nGuests,
  nBartenders, arrBrt, depBrt,
  nWaiters, arrWtr, depWtr,
  nManagers, arrMgr, depMgr,
  nManutentionnaires, arrMan, depMan,
  cocktails: [{id, qty}],
  deliveryCostHT, deliveryBillHT,
  assignedStaff: [staffId],
  paid, acompte,
  stockRetourDone
}
```

### Staff Item
```javascript
{
  id, name, type: 'Bartender|Serveur|Bar Manager|Manutentionnaire',
  rateHT, billHT, per: 'per hour'
}
```

### Cocktail
```javascript
{
  id, name, code, category,
  ingredients: [{name, qty, unit, cost, brand}],
  priceHT, vat, totalCost
}
```

## Principes de Développement

### 1. Simplicité Maximale
- UX ultra-intuitive
- Réduction des étapes utilisateur
- Pas de systèmes parallèles inutiles
- Chaque action doit être évidente

### 2. Fiabilité > Richesse Fonctionnelle
- Système robuste plutôt que riche
- Pas de features fragiles
- Pas de sur-ingénierie

### 3. Modification PATCH ONLY
- Jamais réécrire fichiers complets
- Modifications minimales et ciblées
- Code existant préservé sauf refonte explicite

### 4. Cohérence Métier Stricte
- Respect du flux client → event → cocktails → staff → logistique → devis
- Données centralisées et cohérentes
- Pas de duplication inutile

## Conventions de Code

### Noms Staff
- `'Bartender'` (pas Head Bartender, Bar Supervisor)
- `'Serveur'` (pas Waiter/Server)
- `'Bar Manager'`
- `'Manutentionnaire'`

### Tarification Staff
- Uniquement `'per hour'` (pas `'per event'`)
- Tous les calculs basés sur heures × tarif

### Variables Event
- `nBartenders`, `arrBrt`, `depBrt`
- `nWaiters`, `arrWtr`, `depWtr`
- `nManagers`, `arrMgr`, `depMgr`
- `nManutentionnaires`, `arrMan`, `depMan`

## Dépendances Critiques

### Locales
- `SK` : storage key (user-scoped)
- `state` : state global en mémoire
- `save()` / `load()` : localStorage sync
- `cloudPush()` / `cloudPull()` : Supabase sync

### Externes
- Supabase Auth
- Stripe API
- Netlify Deploy

## Mode Demo
- URL: `?demo=1`
- Pas d'accès cloud
- État local uniquement (`freshState()`)
- Banner "MODE VISUALISATION"

## Deploy
```bash
git add .
git commit -m "message"
git push origin main
# → Netlify redéploie auto en ~30s
```

## Contacts & Clés
- Email: contact@intelligencespotlighted.com
- Supabase: https://hrpcdtkhnewigewomcvv.supabase.co
- GitHub: https://github.com/SPECTRE888/bar-ops
- Live: https://resplendent-truffle-db8c68.netlify.app

## Roadmap Récent
- ✅ Fiche prestation affichage direct sans select
- ✅ Staff: calcul prix en temps réel selon heures
- ✅ Manutentionnaire ajouté
- ✅ Livraison: champs libres (coût/facturé)
- ✅ Planning: calendrier mensuel simple
- ✅ Historique: recherche en topbar
- ✅ Cocktails: séparation en boîtes indépendantes
