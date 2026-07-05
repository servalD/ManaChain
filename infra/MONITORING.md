# Monitoring — Prometheus + Grafana + Sentry

Backlog observabilité (#8) : métriques + dashboards + alerting Telegram via
Grafana (pas d'Alertmanager séparé) + Sentry SaaS (crash reporting back/front).
Uptime Kuma et Umami restent au backlog.

## Architecture

```
Prometheus (manager) ──scrape (edge, dockerswarm_sd)──> node-exporter ×3 (global)
                                                     └─> cadvisor ×3 (global)
                                                     └─> traefik (:8082, overlay only)
                                                     └─> back ×2 (/metrics)
       │
       └─ datasource ──> Grafana (manager) ──> traefik ──> https://grafana.<domaine>
                              │
                              └─ alerting (unified) ──> Telegram
```

Prometheus et Grafana sont épinglés sur le manager (comme traefik) : volumes
locaux, pas de driver partagé nécessaire. node-exporter et cadvisor tournent
en mode `global` (une tâche par nœud, y compris le manager).

## Répartition anti-redondance

| Source | Périmètre exclusif |
| --- | --- |
| node-exporter (global ×3) | CPU/RAM/disque par nœud |
| cAdvisor (global ×3, allégé) | CPU/RAM/réseau/redémarrages par conteneur (disk désactivé → node-exporter) |
| traefik `--metrics.prometheus` | HTTP edge : req/s, latences, codes par router |
| back `/metrics` (prom-client) | runtime Node.js : event loop, heap, GC — pas d'histogramme HTTP custom (traefik le fait déjà) |
| client | rien côté Prometheus (cAdvisor + traefik + Sentry suffisent) |
| Sentry SaaS | exceptions/crashs back + front |

Détail back : [back/docs/MONITORING.md](../back/docs/MONITORING.md). Détail
client : [client/MONITORING.md](../client/MONITORING.md).

## Accès Grafana

`https://grafana.<domaine>`, **login admin natif uniquement** (pas de
basicAuth traefik superposée — à revisiter plus tard si un seul mot de passe
s'avère insuffisant). Mot de passe = secret Swarm `grafana_admin_password`,
créé depuis `vault_grafana_admin_password`. Comme les autres secrets
applicatifs, il est **immuable** : pour le changer, `docker stack rm
manachain` sur le manager puis rejouer `deploy.yml` (cf. section secrets du
[README infra](README.md)).

## Modèle d'isolation traefik

Seule Grafana est exposée publiquement parmi les services de monitoring :

- `--providers.swarm.exposedByDefault=false` sur traefik : un service Swarm
  n'est routé que s'il porte explicitement `traefik.enable=true`. Prometheus,
  node-exporter, cadvisor et l'entrypoint metrics de traefik (`:8082`) n'ont
  aucun label traefik.
- Aucun port de monitoring n'est publié sur l'hôte : seul traefik publie
  80/443 (`mode: host`) ; tous les autres services ne sont joignables que via
  l'overlay `edge`. Le NSG Azure (`infra/terraform/nsg.tf`) et l'ufw
  (`roles/firewall`) n'ouvrent déjà que 22 (IP admin)/80/443 en public —
  aucun changement Terraform nécessaire, cette couche est déjà correcte.
- `back` : `/health` et `/metrics` vivent hors du préfixe `/api` (seul chemin
  routé par traefik vers back) → jamais atteignables publiquement.
- `client` : le router exclut explicitement `/health`
  (`&& !PathPrefix(\`/health\`)`) — sans quoi le router client (qui matche
  tout `Host(...)` sans restriction de chemin) l'exposerait.

## Alerting Telegram

1. Créer un bot via [@BotFather](https://t.me/BotFather) → `/newbot` → noter
   le token (`vault_telegram_bot_token`, dans le vault Ansible).
2. Envoyer un message au bot, puis
   `https://api.telegram.org/bot<token>/getUpdates` → `chat.id` du champ
   `message` → `telegram_chat_id` dans `group_vars/all.yml` (pas un secret).
3. Redéployer : le contact point + les 6 règles (`deploy/monitoring/grafana/
   provisioning/alerting/alerting.yml.j2`) sont provisionnés automatiquement.

Règles provisionnées : nœud down (2 min), disque < 20 %, RAM dispo < 10 %,
taux de 5xx traefik > 5 % (5 min), back sans replica sain, event loop lag p99
back > 0.5s (5 min).

## Rétentions

| | Prod | Dev (profil `monitoring`) |
| --- | --- | --- |
| Scrape interval | 30s | 30s |
| Rétention Prometheus | 10 jours / 2 Go | 2 jours |
| Refresh dashboards Grafana | ≥ 30s | ≥ 30s |

Cluster de démo non-h24 : rétentions volontairement courtes.

## Rotation des logs Docker

`log-driver: json-file`, `max-size: 10m`, `max-file: 3` — au niveau du daemon
(`/etc/docker/daemon.json`, rôle Ansible `docker`) et sur chaque service des
composes de dev/test/images (ancre `x-logging`).

⚠️ **Sur un cluster déjà vivant**, les `log-opts` du daemon ne s'appliquent
qu'aux conteneurs *recréés* après le redémarrage de Docker. Procédure :

```bash
cd infra/ansible
ansible-playbook provision.yml --limit manager   # redémarre Docker sur ce nœud
ansible-playbook provision.yml --limit worker-1  # puis nœud par nœud…
ansible-playbook provision.yml --limit worker-2
# forcer la recréation des conteneurs de la stack pour appliquer les nouveaux log-opts :
ssh azureuser@<ip-manager> docker service update --force manachain_back
ssh azureuser@<ip-manager> docker service update --force manachain_client
# … pour chaque service de la stack
```

Vérifier : `docker info --format '{{.LoggingDriver}}'` puis
`docker inspect <conteneur> --format '{{.HostConfig.LogConfig}}'` sur un
conteneur recréé.

## Vérifications

```bash
ssh azureuser@<ip-manager> docker service ls              # tous healthy
# Prometheus (accessible uniquement depuis l'overlay, pas exposé) :
ssh azureuser@<ip-manager> docker exec $(docker ps -q -f name=manachain_prometheus) \
  wget -qO- localhost:9090/api/v1/targets              # toutes up (3 nodes + 3 cadvisor + traefik + 2 back + self)
curl -I https://grafana.<domaine>                        # page de login Grafana (pas de 401 basicAuth)
```

Puis, depuis Grafana : tester le contact point Telegram (Alerting → Contact
points → Test), vérifier les 4 dashboards alimentés, déclencher une exception
de test (back + front) et la retrouver dans Sentry.

Voir aussi la section DNS (enregistrement `grafana.<domaine>`) et le tableau
Fichiers du [README infra](README.md).
