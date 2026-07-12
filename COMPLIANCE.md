# COMPLIANCE.md — RGPD & MiCA

Document technique interne (pas une politique de confidentialité publique — voir
§1.6 pour le statut de la page front). Rédigé à partir du code réel du repo en
juillet 2026 (Phase 6 du plan d'intégration smart contracts, branche
`integrate/contracts`) ; toute évolution du produit qui touche aux points
ci-dessous doit mettre à jour ce document dans le même commit.

## 1. RGPD

### 1.1 Périmètre des données personnelles traitées

| Donnée | Où | Base légale probable |
|---|---|---|
| Email, prénom/nom, username, tranche d'âge | `user` (Postgres) | Exécution du contrat (création de compte) |
| Mot de passe (hash bcrypt) | `user.password_hash` | Exécution du contrat |
| Adresse wallet (`user.blockchain_address`) | `user` (Postgres) + lisible on-chain | Exécution du contrat (lier un wallet aux achats) |
| Avatar (photo éventuelle) | Upload libre → IPFS (Pinata) | Consentement (upload volontaire) |
| Email de contact candidature marque | `brand_application` | Exécution du contrat / intérêt légitime (instruction de la candidature) |
| Logo/médias de marque | Upload → IPFS (Pinata) | Exécution du contrat (peut contenir des personnes si le média en montre) |

### 1.2 Adresse wallet : position CNIL/EDPB

L'adresse blockchain (`0x...`) est traitée comme **donnée personnelle** dès lors
qu'elle est reliée à un compte utilisateur identifié (`user.blockchain_address`,
`UNIQUE`, un seul wallet par compte) — c'est la position constante de la CNIL et de
l'EDPB : une adresse on-chain est pseudonyme, pas anonyme, et devient une donnée à
caractère personnel identifiable dès qu'un lien (ici applicatif, en base) existe
entre elle et une personne physique. Conséquence pratique dans ce repo :

- L'adresse n'est **jamais** utilisée seule comme identifiant public affiché à
  d'autres utilisateurs sans le consentement implicite de la mise en relation
  (achat de badge, ticket) prévue par le produit.
- Elle est traitée avec le même niveau de protection que l'email (accès restreint,
  chiffrement du transport, jamais loguée en clair dans Sentry — à vérifier lors de
  toute intégration de logging supplémentaire).

### 1.3 Droit à l'effacement / délink — implémentation existante

`UnlinkUserChainDataUseCase`
(`back/src/modules/chain-sync/application/unlink-user-chain-data.use-case.ts`) :

1. `token_transaction.from_user_id`/`.to_user_id` → `NULL` pour l'utilisateur
   (`TokenTransactionRepository.unlinkUser`), dans une transaction DB.
2. `user.blockchain_address` → `NULL` (`UserRepository.clearBlockchainAddress`).

Ce use-case ne supprime **pas** `token_holder` (le solde reste rattaché à
`user_id`, colonne `NOT NULL` — la suppression complète du compte cascade dessus
via `ON DELETE CASCADE`, ce use-case couvre le cas où le compte est conservé mais
le lien wallet doit être effacé, pas une suppression de compte).

**Limite structurelle documentée, pas un bug** : l'effacement ci-dessus retire le
lien *applicatif* (base de données) entre la personne et l'adresse. Il ne peut
techniquement pas retirer l'historique déjà écrit *on-chain* (Avalanche Fuji/
mainnet) ni le contenu déjà épinglé sur IPFS avant suppression — c'est une
limite inhérente à toute blockchain publique, reconnue par la CNIL/EDPB (le droit à
l'effacement s'applique à ce qui est sous le contrôle du responsable de traitement ;
l'immutabilité on-chain motive le choix produit de **ne jamais écrire de donnée
directement identifiante on-chain**, cf. §1.4).

Aucun endpoint `DELETE /users/me` complet (suppression de compte) n'existe
aujourd'hui dans `back/src/modules/users/` — seul le délink ci-dessus est
implémenté. **Backlog** : endpoint de suppression de compte complet (email,
username anonymisés ou compte supprimé, cascade sur les tables dépendantes).

### 1.4 Règle « zéro donnée directement identifiante on-chain »

Vérifié dans le code des contrats (`contracts/src/`) : aucun champ email/nom/
username n'est jamais passé en paramètre d'une transaction ou stocké dans un
contrat. Seule l'adresse wallet apparaît on-chain (inhérent à tout système EVM).
Les métadonnées de token/event (`tokenImageURI`, `uri` event) pointent vers IPFS,
jamais vers un enregistrement contenant des données utilisateur.

**Nuance à documenter honnêtement** (contrairement à une lecture trop optimiste de
cette règle) : IPFS **n'est pas** hors périmètre RGPD. Les avatars utilisateur
(`ProfileAvatar.tsx` → `PinataService.uploadFile`) et les logos/médias de marque
sont uploadés sur IPFS via Pinata et peuvent contenir des données personnelles
(photo de profil = donnée personnelle, potentiellement donnée sensible si elle
révèle une caractéristique protégée). Une fois épinglé, un contenu IPFS est public
et potentiellement répliqué par d'autres nœuds — `PinataService.deleteFile` retire
l'épinglage côté Pinata (donc l'accessibilité pratique via la gateway du projet)
mais ne garantit pas l'effacement sur des nœuds tiers ayant déjà mis le contenu en
cache. **Recommandation** : ne jamais uploader autre chose que des visuels
volontairement publics (avatar, logo) — ne jamais utiliser IPFS pour un document
justificatif contenant des données sensibles (ex. pièce d'identité d'une
candidature marque) ; vérifier qu'aucun flux actuel ne le fait
(`brand-application/FileUpload.tsx` à auditer si des justificatifs y transitent).

### 1.5 Sous-traitants — registre

Registre formalisé au 2026-07-12 (au sens Art. 30 RGPD, tenu par le
responsable de traitement — ce document liste les sous-traitants connus du
code, il ne remplace pas le registre officiel à tenir par l'organisation).
**Aucun DPA n'est signé à ce jour** — c'est un prérequis juridique/contractuel
avec chaque fournisseur, que ce document ne peut pas remplir lui-même :
l'action reste à faire par le responsable de traitement, pas par ce repo.

| Sous-traitant | Donnée transmise | Localisation / transfert hors UE | DPA signé ? |
|---|---|---|---|
| **Dynamic Labs** (`@dynamic-labs/*`, `Web3Provider.tsx`) | Widget de connexion wallet côté client — l'adresse publique transite par leur SDK ; email seulement si l'utilisateur choisit une méthode de connexion email via leur widget (à confirmer selon la config de l'environnement Dynamic utilisé, `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`) | US-based — transfert hors UE, nécessite un mécanisme de transfert valide (SCC ou équivalent) | ◻ à faire — vérifier leur DPA/trust center avant mise en prod |
| **Pinata** (IPFS pinning) | Fichiers uploadés (avatars, logos, médias, métadonnées JSON) | À vérifier dans leur DPA — infrastructure IPFS distribuée par nature | ◻ à faire — vérifier leur DPA/trust center avant mise en prod |
| **Resend** (`back/.env` → `RESEND_API_KEY`) | Email, contenu des emails transactionnels (vérification, reset password, rappel de rotation de mot de passe, notifications candidature) | US-based — transfert hors UE, nécessite un mécanisme de transfert valide (SCC ou équivalent) | ◻ à faire — vérifier leur DPA/trust center avant mise en prod (`RESEND_API_KEY` vide = mode simulation) |
| **Sentry** (`SENTRY_DSN`) | Stack traces, contexte de requête (à auditer pour s'assurer qu'aucun PII n'y fuite — email/mot de passe ne doivent jamais apparaître dans un message d'exception) | Selon la région du projet Sentry configuré | ◻ à faire — vérifier leur DPA/trust center avant mise en prod |

**Ce qu'un agent de code peut faire vs. ce qui reste une action humaine** :
tenir ce tableau à jour dans le repo (fait) ; **signer/accepter un DPA est un
acte contractuel** qui doit être fait directement sur le compte du
fournisseur (la plupart proposent un DPA en libre-acceptation depuis leur
dashboard ou trust center — à vérifier au cas par cas) ou par échange avec
leur service juridique. Aucun outil de ce repo ne peut le faire à la place du
responsable de traitement. **Backlog** : DPA acceptés/signés pour les 4
sous-traitants ci-dessus avant toute mise en production avec des utilisateurs
réels.

### 1.6 Politique de confidentialité front

Page publique ajoutée le 2026-07-12 : `client/src/app/privacy/page.tsx`, en
français (contenu spécifique RGPD/CNIL, jurisdiction France), rédigée à partir
de la base factuelle de ce document. Le lien « Privacy » du footer
(`client/src/components/landing/Footer.tsx`) pointe désormais vers `/privacy`
au lieu d'une ancre morte. « Terms » et « Legal » restent des ancres mortes —
hors périmètre (CGU à rédiger séparément, cf. §3).

**Statut juridique** : rédigée à partir du code réel (même exigence que ce
document), pas un boilerplate générique. **Reste un prérequis avant mise en
production avec des utilisateurs réels** : relecture par un juriste/DPO — ce
n'est pas un avis juridique et ce document ne le remplace pas.

### 1.7 Politique de mot de passe (CNIL)

Ajoutée le 2026-07-12, backlog sécu CNIL :

- **Longueur** : 12 caractères minimum (`IsStrongPassword`,
  `back/src/modules/auth/application/dto/password.rules.ts`) + 1 chiffre + 1
  caractère spécial — recommandation CNIL pour une authentification par mot
  de passe seul (pas de second facteur obligatoire ; le 2FA TOTP reste
  optionnel, cf. §2FA dans le runbook).
- **Anti-brute-force** : throttler + lockout du challenge 2FA (H-2, cf.
  `SECURITY_AUDIT.md`) — pas de lockout de compte séparé sur le mot de passe
  seul, jugé redondant avec le rate-limiting déjà en place.
- **Rotation** : rappel par email tous les 60 jours
  (`PASSWORD_ROTATION_DAYS`, `SendPasswordExpiryRemindersUseCase` +
  `PasswordExpiryReminderScheduler`, cron quotidien). **Volontairement non
  bloquant** : pas de bannière, pas de blocage à la connexion — décision
  produit du 2026-07-12, cohérente avec le choix déjà fait sur M-2
  (`SECURITY_AUDIT.md`) de privilégier des mesures non intrusives. Les
  comptes Google OAuth (sans mot de passe local) sont exclus du rappel.

## 2. MiCA (Markets in Crypto-Assets)

### 2.1 Non-applicabilité actuelle (testnet)

Le déploiement actuel tourne sur Avalanche **Fuji (testnet)** avec **MockUSDC**
(`contracts/src/mocks/MockUSDC.sol`) comme seul moyen de paiement — confirmé dans
`contracts/config/deploy.json` (`deployed.mockUSDC`). MiCA encadre les offres au
public de crypto-actifs **contre rémunération** et les services sur crypto-actifs
(CASP) : aucune des deux conditions n'est réunie ici — MockUSDC n'a aucune valeur
réelle, il n'y a donc **aucune offre contre rémunération réelle**. Cette section
devient pertinente **uniquement** au passage en mainnet avec un stablecoin réel.

### 2.2 Checklist avant mainnet

- [ ] **White paper crypto-actifs (Titre II MiCA) par marque** — chaque `brand`
  qui ouvre une vente de badge (`vault.openSale` → `TokenSaleEscrow`) constitue
  potentiellement une offre au public d'un crypto-actif « autre que jeton
  se référant à un actif/EMT ». Vérifier au cas par cas si une **exemption**
  s'applique avant d'exiger un white paper complet :
  - Offre < 1 000 000 € sur 12 mois glissants (Art. 4 MiCA), **ou**
  - Offre adressée à moins de 150 personnes physiques/morales par État membre.
  Beaucoup de petites marques resteront sous ces seuils — documenter le calcul par
  marque avant ouverture de vente en mainnet, pas après.
- [ ] **Réévaluation CASP (Crypto-Asset Service Provider)** — le produit actuel
  n'a **aucun marché de transfert interne** : pas de fonctionnalité de revente/
  échange P2P de badges dans l'app (les transferts ERC-20 restent possibles
  techniquement puisque `BrandSupportToken` est un ERC-20 standard, mais aucune
  UI/marketplace n'expose un carnet d'ordres ou un prix de marché). **Si une
  fonctionnalité de marché secondaire est ajoutée** (revente, mise en relation
  acheteur/vendeur, cotation), réévaluer immédiatement le statut CASP — cela
  franchirait très probablement le seuil d'un service réglementé (exploitation
  d'une plateforme de négociation) et nécessiterait un agrément.
- [ ] **Exemption utility token pour les tickets** — `EventTickets` (ERC-1155)
  donne accès à un événement, pas un droit financier : documenter cette nature
  utilitaire explicitement (Art. 4-3 MiCA, exemption des jetons donnant accès à un
  bien/service limité à l'émetteur) pour justifier la non-application du régime
  offre au public aux tickets, séparément des badges de marque.
- [ ] **USDC réel = EMT (Electronic Money Token)** — en mainnet, remplacer
  MockUSDC par un vrai stablecoin implique de vérifier que l'émetteur choisi est
  conforme MiCA (agréé comme émetteur d'EMT dans l'UE, ou équivalent reconnu).
  Circle (USDC) a un agrément EMT en France (Circle Mint France) — vérifier la
  version/chaîne exacte utilisée reste conforme au moment du passage en prod.
- [ ] **Design non-custodial documenté** — vérifié dans le code : aucune clé privée
  utilisateur ne transite ni n'est stockée côté plateforme (`back/` ne détient
  aucun wallet applicatif, les transactions sont signées côté client via le wallet
  connecté par Dynamic Labs/wagmi, cf. `useTxFlow.ts`). Ce point est un argument
  factuel en faveur d'une exemption/allègement CASP (pas de garde d'actifs) — à
  faire valider formellement par un conseil juridique avant mainnet, ce document
  ne constitue pas un avis juridique.

## 3. Non couvert par ce document

- Conformité fiscale (TVA sur les frais de plateforme `feeBps`, traitement fiscal
  des badges pour les marques) — hors périmètre technique de ce repo.
- KYC/AML — aucun flux de vérification d'identité n'existe dans le produit actuel ;
  à évaluer si MiCA/la nature des flux en mainnet l'impose (probable si des
  montants significatifs transitent par une marque donnée).
- Conditions générales d'utilisation (CGU) — à rédiger séparément, hors périmètre
  de ce document technique.
