# BAR OPS — Briefing Projet

## 🎯 Contexte
SaaS de gestion événementielle pour bars/catering (vanilla JS, Supabase, Stripe, SendGrid).

**Live:** https://mellifluous-sable-fa6f21.netlify.app/app.html  
**Repo:** https://github.com/SPECTRE888/bar-ops  
**Token GitHub:** `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`

---

## ⚙️ Stack Technique
- **Frontend:** Vanilla JS (fichier unique `app.html` ~6800 lignes)
- **Backend:** Supabase (auth + DB)
- **Paiement:** Stripe
- **Email:** SendGrid (devis envoyés en HTML inline)
- **Hosting:** Netlify
- **Functions:** `netlify/functions/send-quote.js`

---

## 📐 Principes Fondamentaux

### 1. PATCH ONLY — Mode obligatoire
- **JAMAIS** réécrire un fichier complet
- Modifications ciblées uniquement (str_replace, sed, python patch)
- Exception: refonte architecturale majeure explicitement demandée

### 2. Token Efficiency 99%
- Réponses minimales (pas d'explication, pas de répétition)
- Code minimal pour impact maximal
- Pas de meta-commentaire sauf si demandé

### 3. Simplicité Maximale
- UX ultra intuitive
- Réduire les étapes utilisateur
- Pas de systèmes parallèles inutiles
- Cohérence métier stricte

### 4. Workflow Métier
```
Client → Événement → Cocktails → Staff → Logistique → Devis
```

---

## 🔧 Architecture App

### Fichiers Clés
```
app.html          # App principale (6800 lignes)
index.html        # Landing page
auth.html         # Inscription/connexion
netlify/functions/send-quote.js  # Envoi email devis
```

### Structure State (localStorage)
```javascript
state = {
  events: [],        // Événements
  clients: [],       // Clients
  cocktails: [],     // Catalogue cocktails
  staffItems: [],    // Équipe
  products: [],      // Ingrédients
  profile: {
    senderEmail: '',
    sendgridApiKey: '',
    barName: '',
    logo: ''
  }
}
```

### Onglets Principaux
- **Événements** — Liste + recherche
- **Clients** — Gestion contacts
- **Cocktails** — Catalogue + coûts/marges
- **Équipe** — Staff (nom/rôle/tél/tarifs)
- **Produits** — Ingrédients/stock
- **Fiche Prestation** — Staff assigné + fiche complète scrollable + brief WhatsApp
- **Profil** — SendGrid + logo

---

## 🎨 UI/UX Actuel

### Fiche Prestation (layout final validé)
```
┌─────────────────────────────────────────┐
│ ÉQUIPE (card top)                        │
│ - Colonnes: Nom | Rôle | Tél | Dispo   │
│ - Boutons: Dispo? / Brief / ×          │
│ - + Ajouter en bas                      │
├─────────────────────────────────────────┤
│ FICHE PRESTATION (scrollable, fullwidth)│
│ - Client, logistique, planning, cocktails│
│ - NO max-width, NO margin auto          │
└─────────────────────────────────────────┘
```

### Landing Page (index.html)
```
Hero centré:
  BAR OPS (logo)
  "Une nouvelle manière..." (tagline)
  [Accéder à la plateforme]

Footer:
  5 features grid (Cocktails | Équipe | Logistique | Analytique | Automatisation)
  Legal: © 2026 BAR OPS · email · Politique · Mentions
  Modal noir/doré pour légales
```

### Staff Flow (WhatsApp automatisé)
1. Ajouter staff → bouton "Dispo?"
2. Envoie message WhatsApp avec détails presta
3. User coche Oui → marque confirmé + envoie brief auto
4. User coche Non → marque indisponible

### Devis
- Génération: HTML complet via `buildDevisHTML()`
- Ouverture: même onglet (blob URL)
- Envoi: email inline via SendGrid (pas PDF, juste HTML dans corps)

---

## 🔐 SendGrid Config
**Erreur fréquente:** "from address does not match verified Sender Identity"

**Solution côté user:**
1. Aller sur app.sendgrid.com/settings/sender_auth
2. Verify a Single Sender
3. Entrer exactement le même email que dans Profil → Email d'envoi
4. Vérifier dans boîte mail
5. Créer API Key (Full Access)
6. Copier clé dans Profil

**Code ne peut PAS fixer cette erreur** — c'est une restriction SendGrid obligatoire.

---

## 📋 États Problèmes Connus

### ✅ Résolu
- Fiche prestation pleine largeur (supprimé max-width:820px)
- Staff grid aligné (1.8fr 1.2fr 1.4fr 1.2fr 100px)
- Brief WhatsApp complet (date, lieu, setup, cocktails+recettes, tenue)
- Devis s'ouvre dans même onglet
- Email déjà utilisé → popup clair
- Landing: mentions légales FR conformes, modal noir/doré

### ⚠️ À Surveiller
- app.html = 6800 lignes (envisager découpe future si >8000)
- Backticks équilibrés (844 pairs) — attention emojis dans template literals
- SendGrid rate limits (100 req/h)

---

## 🛠️ Commandes Fréquentes

### Deploy
```bash
cd /home/claude/bar-ops
git add -A
git commit -m "fix: description"
git push https://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@github.com/SPECTRE888/bar-ops.git main
```

### Vérif Syntax
```bash
grep -n "\\`" app.html | wc -l  # Compte backticks (doit être pair)
python3 -c "c=open('app.html').read();print('Backticks:',c.count('\`'),'even:',c.count('\`')%2==0)"
```

### Patch Pattern
```python
with open('app.html','r') as f: c=f.read()
old_start = c.index('function targetFunc(){')
old_end = c.index('\nfunction nextFunc(){')
new = '''function targetFunc(){ /* new code */ }'''
c = c[:old_start] + new + c[old_end:]
with open('app.html','w') as f: f.write(c)
```

---

## 🚫 Anti-Patterns (INTERDITS)

1. **Ne JAMAIS** réécrire app.html en entier
2. **Ne JAMAIS** utiliser Artifacts pour expliquer (code only)
3. **Ne JAMAIS** sur-documenter les réponses
4. **Ne JAMAIS** modifier la logique métier sans nécessité
5. **Ne JAMAIS** créer plusieurs systèmes pour une fonction
6. **Ne JAMAIS** casser la cohérence des données

---

## 📞 Contact Projet
- **Email projet:** contact@intelligencespotlighted.com
- **Adresse:** 63 avenue Pasteur, 93100 Montreuil
- **Directeur publication:** Jérôme

---

## 🎯 Objectif Final
Plateforme simple, fiable, rapide permettant d'organiser un événement bar/catering de A à Z sans friction.

**Question guide:** "Est-ce que ça rend l'organisation d'un événement plus simple et plus rapide ?"  
Si non → ne pas implémenter.

---

**Dernière mise à jour:** 27 avril 2026  
**Version app:** Production live  
**Commits récents:** legal footer, staff flow, devis email inline
