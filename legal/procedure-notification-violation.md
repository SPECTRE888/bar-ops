# Procédure de notification de violation de données (Art. 33-34 RGPD) — BAR OPS

Responsable de traitement : Jérôme Jarrige — Jarrige.jerome@hotmail.fr
Autorité de contrôle compétente : **CNIL** — notifications.cnil.fr

---

## 1. Qu'est-ce qu'une violation de données ?

Tout incident de sécurité entraînant, de manière accidentelle ou illicite, la destruction, la perte, l'altération, la divulgation non autorisée de données personnelles, ou l'accès non autorisé à ces données. Exemples concrets pour BAR OPS :
- Compromission de la clé de service Supabase (`SUPABASE_SERVICE_KEY`) ou des secrets Stripe/SendGrid/Brevo
- Faille RLS exposant les données d'un abonné à un autre
- Exploitation d'une faille XSS permettant l'exfiltration de sessions/tokens
- Fuite de la base de données (backup mal sécurisé, accès non autorisé au dashboard Supabase/Vercel)
- Perte d'un appareil contenant des exports de données (ex. via la fonction "Exporter mes données")

## 2. Détection

Sources de détection possibles :
- Alertes Supabase (dashboard → Logs, tentatives d'accès anormales)
- Alertes Vercel (logs de fonctions, pics d'erreurs/trafic anormal)
- Signalement d'un utilisateur ou d'un chercheur en sécurité
- Constat interne lors d'une revue de code ou d'un audit (comme celui-ci)

**Dès qu'un incident potentiel est identifié, consigner immédiatement la date/heure de détection** — le délai légal de 72h court à partir de la connaissance de la violation, pas de sa survenue.

## 3. Évaluation (dans les 24h suivant la détection)

Répondre à ces questions et les consigner dans la fiche incident (§6) :

1. **Quelles données sont concernées ?** (catégories : identité, contact, financier, santé/sensible…)
2. **Combien de personnes sont concernées ?**
3. **Quelle est la gravité potentielle ?** (usurpation d'identité, fraude financière, atteinte à la vie privée…)
4. **Y a-t-il un risque pour les droits et libertés des personnes ?**
   - **Non** → documenter la décision de ne pas notifier, mais consigner l'incident dans le registre interne des violations (obligatoire dans tous les cas, Art. 33.5)
   - **Oui** → notification CNIL obligatoire sous 72h
   - **Risque élevé** → notification CNIL **et** communication directe aux personnes concernées (Art. 34)

## 4. Notification à la CNIL (si risque avéré) — délai 72h

Se fait sur **notifications.cnil.fr**. Contenu minimal requis :
- Nature de la violation
- Catégories et nombre approximatif de personnes concernées
- Catégories et volume approximatif de données concernées
- Conséquences probables
- Mesures prises ou envisagées pour remédier à la violation et en atténuer les effets
- Coordonnées du responsable de traitement (Jérôme Jarrige)

Si l'ensemble des informations n'est pas disponible sous 72h, notifier avec les éléments connus et compléter par notifications successives (la CNIL accepte une notification en plusieurs temps).

## 5. Communication aux personnes concernées (si risque élevé) — Art. 34

Obligatoire uniquement si le risque est **élevé** pour les droits et libertés des personnes (ex. fuite de mots de passe, de données financières, usurpation d'identité probable). Contenu :
- Description en langage clair de la nature de la violation
- Coordonnées de contact (Jarrige.jerome@hotmail.fr)
- Conséquences probables
- Mesures prises/recommandées (ex. "changez votre mot de passe", "surveillez vos relevés bancaires")

Canal recommandé : email direct aux comptes concernés (via SendGrid/Brevo).

**Exception** : la communication individuelle n'est pas requise si des mesures de protection ont rendu les données incompréhensibles (ex. chiffrement fort) ou si une communication publique équivalente a été faite.

## 6. Fiche incident type (à dupliquer pour chaque violation)

```
Date/heure de détection :
Date/heure de survenue (si connue) :
Détecté par :
Description de l'incident :
Données concernées :
Nombre de personnes concernées (estimation) :
Cause (technique/humaine/tierce) :
Risque évalué (faible/modéré/élevé) :
Notification CNIL requise ? (oui/non + justification) :
Date de notification CNIL (si applicable) :
Communication aux personnes concernées requise ? (oui/non + justification) :
Mesures correctives immédiates :
Mesures préventives à long terme :
Statut : en cours / clôturé
```

## 7. Registre interne des violations (Art. 33.5)

**Toute violation doit être consignée dans un registre interne, même si elle n'est pas notifiée à la CNIL.** Ce registre doit être présentable à la CNIL en cas de contrôle. Tenir un fichier séparé (ex. `legal/registre-violations.md`, non versionné publiquement si possible, ou stocké de façon sécurisée hors du repo) répertoriant chaque fiche incident du §6.

## 8. Points de contact utiles

- CNIL — notifications : https://notifications.cnil.fr
- CNIL — contact général : https://www.cnil.fr/fr/plaintes
- Supabase — support incident : dashboard.supabase.com (section Support)
- Vercel — support incident : vercel.com/support
- Stripe — sécurité : https://stripe.com/docs/security (contact via dashboard)

---

*Document créé le 2026-08-24 dans le cadre de l'audit RGPD. À revoir et valider par Jérôme Jarrige — notamment les seuils de gravité, qui restent une décision métier.*
