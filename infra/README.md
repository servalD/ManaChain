# Infrastructure ManaChain — Azure · Terraform · Ansible · Docker Swarm

Reproduction complète de l'infrastructure de production, de zéro.

## Architecture

```
Internet ──> <domaine>  (A record → IP publique statique du manager)
              │
┌─ Azure (Terraform) ──────────────────────────────────────────┐
│ rg-manachain                                                 │
│ ├─ vm-manachain-manager   B2s, IP publique   ── traefik (SSL)│
│ ├─ vm-manachain-worker-1  B2s, IP privée     ┐ back ×2       │
│ ├─ vm-manachain-worker-2  B2s, IP privée     ┘ client ×2     │
│ ├─ pg-manachain           PostgreSQL 16 managé (accès privé) │
│ ├─ acrmanachain           registre Docker (ACR Basic)        │
│ └─ stmanachainbkp         Blob storage (backups, 30 j)       │
└──────────────────────────────────────────────────────────────┘
```

- **Swarm 3 nœuds** : traefik épinglé sur le manager (IP publique + certificats
  Let's Encrypt) ; back et client en 2 replicas répartis sur les workers.
- **Pare-feu double couche** : NSG Azure (22 restreint à ton IP, 80, 443) + ufw
  sur chaque hôte (Ansible). Les workers n'ont pas d'IP publique (SSH via le
  manager).
- **Backups 3-2-1** : pg_dump quotidien → disque du manager (1) → Azure Blob
  (2) → S3/R2 hors Azure (3, externe). Rétention 30 jours partout.
- **Le cluster ne tourne pas h24** : `ansible-playbook cluster-stop.yml`
  (backup puis deallocate pour limiter facturation compute car je n'ai qu'un plan AZURE student) /
  `ansible-playbook cluster-start.yml`. Extinction automatique quotidienne à
  20h en filet de sécurité (`auto_shutdown_time`).

## Prérequis

- `az` (Azure CLI) connecté : `az login`
- `terraform` ≥ 1.7, `ansible-core` ≥ 2.17 (`pip install --user --upgrade ansible`)
- Une clé SSH (`ssh-keygen -t ed25519`)
- Un domaine public (0.99 € chez OVH)
- Un bucket S3/R2 cloudflaire pour la 3ᵉ copie de backup

## 1. Provisionner Azure (Terraform)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # ton IP publique + ta clé SSH
terraform init
terraform apply
```

L'apply génère aussi l'inventaire Ansible (`infra/ansible/inventory/hosts.ini`

+ `tf_outputs.yml` avec les identifiants ACR/Postgres/storage) : rien à
  recopier à la main, et il se met à jour tout seul au prochain apply.

Coût ≈ 110 €/mois si allumé h24 ; ~15-20 €/mois de fixe (PG, IP, storage) +
les heures d'allumage en usage « tests seulement ».

## 2. DNS

Créer un enregistrement `A` du domaine vers `terraform output manager_public_ip`
(IP statique : elle survit aux cycles stop/start). Renseigner `domain_name`
dans `infra/ansible/group_vars/all.yml`. Traefik obtient et renouvelle le
certificat Let's Encrypt tout seul au premier déploiement.

Créer aussi un enregistrement `A` pour `grafana.<domaine>` → la même IP,
**avant** le déploiement (sinon le challenge ACME de Grafana échoue — traefik
réessaie tout seul, mais autant l'avoir en place dès le départ).

## 3. Provisionner les nœuds (Ansible)

```bash
cd infra/ansible
ansible-galaxy collection install -r requirements.yml
ansible-playbook provision.yml     # Docker, ufw, fail2ban, swarm init/join
```

(L'inventaire a été généré par `terraform apply`.)

## 4. Secrets applicatifs

```bash
cd infra/ansible
cp vault.yml.example vault.yml     # JWT, Resend, Google OAuth, Pinata, rclone offsite
ansible-vault encrypt vault.yml
```

> 💡 **Où obtenir chaque valeur :** les secrets applicatifs (`vault_app_jwt_secret`,
> `vault_resend_api_key`, `vault_google_client_secret`) sont les mêmes qu'en dev
> (voir le tableau de la section « Configuration des variables d'environnement »
> du [README du back](../../back/README.md).) Deux spécificités prod : la
> **redirect URI Google** devient `https://<domaine>/api/auth/google/callback`,
> et le client ID va dans `group_vars/all.yml` (`google_client_id`), pas dans le
> vault. Ne restent propres à l'infra :
>
> | Secret                           | Source                                                                                                                                                                                                                                                                                 |
> | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | `vault_pinata_jwt`             | [dashboard Pinata](https://app.pinata.cloud/developers/api-keys) → API Keys → New Key. Même valeur que le `PINATA_JWT` du dev local (cf. `back/.env.example`)                                                                                                                  |
> | `vault_rclone_offsite_conf`    | Cloudflare R2 : dashboard → R2 →[Manage R2 API Tokens](https://dash.cloudflare.com/?to=/:account/r2/api-tokens) (access key + secret + endpoint du compte), puis créer le bucket `manachain-backups`. Format des remotes : [doc rclone S3/R2](https://rclone.org/s3/#cloudflare-r2) |
> | `vault_grafana_admin_password` | Choisie librement — login admin Grafana natif (pas de double auth, cf.[infra/MONITORING.md](MONITORING.md))                                                                                                                                                                            |
> | `vault_telegram_bot_token`     | Bot Telegram de l'alerting Grafana — création et détails dans[infra/MONITORING.md](MONITORING.md)                                                                                                                                                                                    |
>
> `telegram_chat_id` (non secret) et `sentry_dsn_back` (un DSN n'est pas un
> secret) vont dans `group_vars/all.yml`, pas dans le vault.

⚠️ Les secrets Swarm sont immuables : pour en changer un après coup →
`docker stack rm manachain` sur le manager, puis rejouer `deploy.yml`.

## 5. Images

Automatique : chaque push sur `main` build et pousse `manachain-back` et
`manachain-client` sur l'ACR (workflows `back.yml` / `client.yml`).
Secrets GitHub à créer : `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`
(→ `terraform output acr_admin_password`) ; variables : `NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`, `NEXT_PUBLIC_PINATA_GATEWAY`,
`NEXT_PUBLIC_SENTRY_DSN` (optionnelle — vide/absente = Sentry front désactivé).

Premier push manuel si besoin :

```bash
az acr login --name acrmanachain

# back
BACK_IMAGE=acrmanachain.azurecr.io/manachain-back:latest \
  docker compose -f back/docker/docker-compose.build.yml build

# client — valeurs de PROD : elles sont inlinées dans le bundle au build
CLIENT_IMAGE=acrmanachain.azurecr.io/manachain-client:latest \
NEXT_PUBLIC_API_URL=https://<domaine>/api \
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=<id> \
NEXT_PUBLIC_PINATA_GATEWAY=<gateway> \
NEXT_PUBLIC_SENTRY_DSN=<dsn ou vide> \
  docker compose -f client/docker/docker-compose.build.yml build

docker push acrmanachain.azurecr.io/manachain-back:latest
docker push acrmanachain.azurecr.io/manachain-client:latest
```

## 6. Déployer la stack

```bash
cd infra/ansible
ansible-playbook deploy.yml --ask-vault-pass
```

Le playbook : login ACR → secrets Swarm → migrations TypeORM (one-shot) →
`docker stack deploy` → backup post-déploiement.

Ordre de démarrage applicatif détaillé (migrations avant back, chain-sync
avant trafic, etc.) et variables d'env par app : voir
[`deploy/RUNBOOK.md`](../../deploy/RUNBOOK.md).

Les déploiements suivants passent par le workflow GitHub **Deploy**
(workflow_dispatch, tag d'image en entrée — secrets additionnels :
`MANAGER_HOST`, `MANAGER_SSH_PRIVATE_KEY`, `DB_HOST`, `DB_NAME`, `DB_USER`,
`DB_PASSWORD`).

## Vérifier

```bash
ssh azureuser@<ip-manager> docker node ls        # 3 nœuds Ready
ssh azureuser@<ip-manager> docker service ls     # back 2/2, client 2/2
curl -I https://<domaine>                        # 200, certificat valide
curl https://<domaine>/api/docs                  # Swagger
nmap <ip-manager>                                # seuls 22/80/443 ouverts
```

Monitoring (Prometheus/Grafana/alerting/rotation des logs) : voir
[infra/MONITORING.md](MONITORING.md).

Test de recouvrement (à faire au moins une fois, garder une capture) :

```bash
ssh azureuser@<ip-manager> 'docker exec $(docker ps -q -f name=manachain_backup) /backup.sh'
ssh azureuser@<ip-manager> ls /var/backups/manachain          # médium 1
az storage blob list --account-name stmanachainbkp -c backups -o table  # médium 2
# restauration locale :
gunzip -c manachain-<date>.sql.gz | psql -h localhost -U postgres -d manachain_restore
```

## Cycle de vie quotidien

```bash
cd infra/ansible
ansible-playbook cluster-start.yml   # allume les 3 VMs, la stack repart seule
ansible-playbook cluster-stop.yml    # backup puis deallocate (0 € compute)
```

## Fichiers

| Chemin                           | Rôle                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `infra/terraform/`             | VMs, réseau, NSG, PG managé, ACR, Blob                                                                    |
| `infra/ansible/provision.yml`  | Docker, ufw, fail2ban, formation du Swarm                                                                   |
| `infra/ansible/deploy.yml`     | secrets, migrations,`docker stack deploy`                                                                 |
| `infra/terraform/inventory.tf` | génère l'inventaire Ansible (hosts.ini + tf_outputs.yml)                                                  |
| `infra/ansible/cluster-*.yml`  | allumage / extinction (deallocate) des VMs                                                                  |
| `deploy/stack.yml.j2`          | définition de la stack Swarm (traefik, back, client, prometheus, grafana, node-exporter, cadvisor, backup) |
| `deploy/backup.sh.j2`          | script de sauvegarde 3-2-1                                                                                  |
| `deploy/RUNBOOK.md`            | ordre de démarrage applicatif, variables d'env par app, procédure de redéploiement des contrats             |
| `deploy/monitoring/`           | configs Prometheus/Grafana (prod + profil dev) — détail dans[infra/MONITORING.md](MONITORING.md)           |
| `.github/workflows/`           | CI back/client + déploiement                                                                               |
