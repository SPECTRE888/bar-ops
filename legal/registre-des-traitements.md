# Registre des traitements — BAR OPS (Art. 30 RGPD)

Responsable de traitement : **Jérôme Jarrige**, entrepreneur individuel, 63 avenue Pasteur, 93100 Montreuil — Jarrige.jerome@hotmail.fr
DPO : non désigné (non obligatoire au regard de la taille et de l'activité actuelles — à réévaluer si la volumétrie de données augmente significativement).

> Document généré à partir d'un audit du code le 2026-08-24. Les durées de conservation marquées **[À VALIDER]** sont des propositions à trancher par Jérôme Jarrige — je n'ai pas la légitimité pour fixer une politique de rétention à sa place.

---

## 1. Comptes utilisateurs & authentification

| | |
|---|---|
| **Finalité** | Créer et gérer les comptes des professionnels utilisant BAR OPS ; authentification |
| **Données traitées** | Email, nom (profil Google), rôle (COMPANY_ADMIN / AGENT / SUPER_ADMIN), permissions, statut du compte |
| **Personnes concernées** | Utilisateurs professionnels de BAR OPS (gérants de bar/événementiel) et leurs collaborateurs invités |
| **Base légale** | Exécution du contrat (Art. 6.1.b) |
| **Destinataires / sous-traitants** | Supabase (hébergement DB + auth, UE — Irlande), Vercel Inc. (hébergement fonctions serveur, US, clauses contractuelles types), Google (fournisseur OAuth) |
| **Transferts hors UE** | Vercel Inc. (société US) — encadré par clauses contractuelles types |
| **Durée de conservation** | Durée du compte actif. **[À VALIDER]** proposition : suppression sous 30 jours après une demande d'effacement (déjà techniquement immédiate via `delete-account.js`), ou après une période d'inactivité de compte non payant à définir. |
| **Sécurité** | RLS Postgres (policies `profile_read`/`profile_self_write`/`profile_admin_write`), clé service réservée au backend, HTTPS/TLS |

## 2. Abonnement & facturation

| | |
|---|---|
| **Finalité** | Gestion de l'abonnement SaaS, facturation, prévention de la fraude (fingerprint carte contre les abus d'essai gratuit) |
| **Données traitées** | Email (haché SHA-256 pour la table `subscriptions`), identifiants Stripe (customer/subscription/session), empreinte de carte pseudonymisée (`card_fingerprint`), statut et dates d'abonnement |
| **Base légale** | Exécution du contrat + obligation légale (archivage comptable, Art. L123-22 Code de commerce) |
| **Destinataires / sous-traitants** | Stripe (traitement des paiements — aucune donnée de carte en clair n'est stockée par BAR OPS) |
| **Durée de conservation** | Documents comptables : 10 ans (obligation légale). Données d'abonnement actives : durée du compte. |
| **Sécurité** | Webhook signé (`STRIPE_WEBHOOK_SECRET`), filtrage par `metadata.app` depuis 2026-08-24, aucune clé secrète Stripe côté client |

## 3. Données clients de l'utilisateur (CRM interne à l'app)

| | |
|---|---|
| **Finalité** | Permettre à l'abonné BAR OPS de gérer ses propres clients (événementiel/bar) |
| **Données traitées** | Nom, email, téléphone, adresse des clients de l'abonné |
| **Personnes concernées** | Clients finaux des utilisateurs de BAR OPS — pas de relation directe avec Jérôme Jarrige |
| **Répartition des responsabilités** | L'abonné BAR OPS est **responsable de traitement** de ses propres données clients. Jérôme Jarrige (BAR OPS) agit comme **sous-traitant technique** au sens de l'Art. 28 pour cette catégorie de données — un DPA (Data Processing Agreement) avec les abonnés professionnels serait recommandé si ce n'est pas déjà couvert par les CGV. **[À VALIDER]** |
| **Destinataires / sous-traitants** | Supabase (stockage), Brevo (envoi des devis aux clients finaux) |
| **Durée de conservation** | À la discrétion de l'abonné BAR OPS, dans la limite de la durée du compte |

## 4. Gestion d'équipe (staff)

| | |
|---|---|
| **Finalité** | Organisation logistique des événements (staffing) |
| **Données traitées** | Nom, téléphone, email, type de poste, tarif horaire, mensurations (pour tenue de travail) |
| **Base légale** | Exécution du contrat (pour le compte de l'abonné, cf. répartition point 3) |
| **Durée de conservation** | Durée du compte de l'abonné |

## 5. Devis clients (portail public + signature électronique)

| | |
|---|---|
| **Finalité** | Émission, envoi et signature électronique de devis |
| **Données traitées** | Nom du signataire, image de signature manuscrite, email, détails de la commande, IBAN du professionnel émetteur |
| **Base légale** | Exécution du contrat (relation entre l'abonné BAR OPS et son client final) |
| **Destinataires / sous-traitants** | Brevo (envoi email des devis), Supabase (stockage) |
| **Durée de conservation** | 5 ans — archivage légal déjà en place (Art. L.110-4 Code de commerce, Art. 286 I-3° CGI) |

## 6. Emails transactionnels

| | |
|---|---|
| **Finalité** | Confirmation d'abonnement, envoi de devis, notifications d'invitation |
| **Données traitées** | Adresse email destinataire, contenu du message |
| **Sous-traitants** | **SendGrid** (confirmation d'abonnement, `api/webhook.js`) et **Brevo/Sendinblue** (devis clients, `api/send-quote.js`) — deux sous-traitants distincts, tous deux à mentionner dans la politique de confidentialité (fait le 2026-08-24) |
| **Durée de conservation** | Logs d'envoi le temps nécessaire à la lutte anti-abus (table `email_rate_limit`) — **[À VALIDER]** durée de purge des logs |

## 7. Invitations & gestion multi-utilisateurs (agents)

| | |
|---|---|
| **Finalité** | Inviter des collaborateurs, gérer leurs rôles et permissions |
| **Données traitées** | Email invité, rôle, permissions accordées |
| **Base légale** | Exécution du contrat |
| **Durée de conservation** | Invitations expirées après 7 jours (déjà en base) ; historique conservé tant que le compte existe |

## 8. Journal d'audit (`audit_logs`)

| | |
|---|---|
| **Finalité** | Traçabilité des actions administratives (sécurité, litiges internes) |
| **Données traitées** | Identifiant de l'acteur, action réalisée, cible, métadonnées (peut inclure un email) |
| **Base légale** | Intérêt légitime (sécurité du service et de ses utilisateurs, Art. 6.1.f) |
| **Durée de conservation** | **[À VALIDER]** proposition : 1 an glissant |

---

## Sous-traitants (Art. 28) — synthèse

| Sous-traitant | Rôle | Localisation | Garantie transfert |
|---|---|---|---|
| Supabase | Base de données, authentification | UE (Irlande, eu-west-1) | — (intra-UE) |
| Vercel Inc. | Hébergement site + fonctions serveur | USA | Clauses contractuelles types |
| Stripe | Paiement | UE/US selon flux | Clauses contractuelles types (couvertes par Stripe) |
| SendGrid | Email transactionnel (confirmation abonnement) | USA | Clauses contractuelles types |
| Brevo (Sendinblue) | Email transactionnel (devis clients) | UE (France) | — (intra-UE) |
| Google | Authentification OAuth | — | — |

---

## Prochaines étapes suggérées

1. Trancher les cases **[À VALIDER]** (durées de conservation exactes).
2. Vérifier/mettre en place un DPA formel avec Supabase, Vercel, Stripe, SendGrid, Brevo s'il n'existe pas déjà (les CGU de ces prestataires en tiennent généralement lieu, mais à vérifier).
3. Tenir ce registre à jour à chaque ajout de sous-traitant ou de nouvelle finalité de traitement.
