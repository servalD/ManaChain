# ManaChain

[![Back CI](https://github.com/servalD/ManaChain/actions/workflows/back.yml/badge.svg?branch=main)](https://github.com/servalD/ManaChain/actions/workflows/back.yml)
[![Client CI](https://github.com/servalD/ManaChain/actions/workflows/client.yml/badge.svg?branch=main)](https://github.com/servalD/ManaChain/actions/workflows/client.yml)
[![Security Scan](https://github.com/servalD/ManaChain/actions/workflows/security.yml/badge.svg?branch=main)](https://github.com/servalD/ManaChain/actions/workflows/security.yml)

## 🏆 Compétition Engrainages & Projet Annuel ESGI

Projet développé dans le cadre du **Projet Annuel ESGI** et de la compétition
d'entrepreneuriat **Engrainages** ([engrainages.com](https://engrainages.com/)),
organisée par le réseau GES/Eductive.

## 📖 Le projet

**ManaChain** est une plateforme communautaire qui connecte les marques
émergentes à leurs supporters. En détenant des *tokens de marque*, les membres
débloquent des privilèges exclusifs, des événements et des expériences uniques
avec les marques qu'ils soutiennent.

### Fonctionnalités principales

- **Découverte de marques** : interface de swipe (façon Tinder) pour découvrir
  et soutenir des marques émergentes
- **Engagement communautaire** : détenir des tokens d'une marque débloque
  privilèges et accès aux événements
- **Candidature marque** : parcours complet permettant à une nouvelle marque de
  rejoindre la plateforme et construire sa communauté
- **Couche on-chain** : tokenisation du soutien (NFT genèse → vault fractionnel
  → token de soutien → billetterie NFT événementielle)
- **Thème adaptatif** : interface claire/sombre

## 🗂️ Organisation du repo

| Dossier | Contenu | Documentation |
| --- | --- | --- |
| [`back/`](back/) | API NestJS 11 (hexagonale), TypeORM + PostgreSQL 16 | [README](back/README.md) · [Docker](back/docker/README.md) · [docs/](back/docs/) (dont [MONITORING](back/docs/MONITORING.md)) |
| [`client/`](client/) | Front Next.js 16, React 19, Tailwind 4, Dynamic/Wagmi/Viem, Pinata IPFS | [README](client/README.md) · [MONITORING](client/MONITORING.md) |
| [`contracts/`](contracts/) | Smart contracts Solidity (Foundry), UUPS upgradeables, ciblant Avalanche | [README](contracts/README.md) |
| [`deploy/`](deploy/) | Stack Docker Swarm de prod + test local des images buildées | en-têtes des fichiers |
| [`infra/`](infra/) | Terraform (Azure) + Ansible : provisionnement, déploiement, backups 3-2-1 | [README](infra/README.md) |
| `.github/workflows/` | CI back & client (lint, tests, build/push ACR) + déploiement | commentaires des workflows |

## 🚀 Démarrage rapide (dev local)

Prérequis : Node.js 22+, pnpm (`corepack enable`), Docker.

```bash
# API — voir back/README.md pour la config (.env)
cd back
pnpm install
docker compose -f docker/docker-compose.dev.yml up -d db
pnpm migration:run
pnpm start:dev            # http://localhost:3001/api — Swagger sur /api/docs

# Front — voir client/README.md pour la config (.env)
cd client
pnpm install
pnpm dev                  # http://localhost:3000
```

Chaque partie a aussi un mode 100 % Docker (composes `dev`) — voir les README
respectifs. Ajouter `--profile monitoring` à un `up` de compose dev lance
Prometheus + Grafana en local (opt-in, inchangé sans le flag) — voir
[back/docs/MONITORING.md](back/docs/MONITORING.md) ou
[client/MONITORING.md](client/MONITORING.md).

## ✅ Tests

```bash
pnpm --dir back test      # unitaires (Jest, fakes in-memory)
cd back && docker compose -f docker/docker-compose.test.yml up -d --wait \
  && pnpm test:e2e        # e2e contre un Postgres éphémère
cd contracts && forge test # smart contracts (Foundry)
```

## 🏭 Production

Cluster **Docker Swarm 3 nœuds sur Azure** (traefik + Let's Encrypt, back et
client répliqués ×2), PostgreSQL managé, registre ACR, backups 3-2-1,
provisionné par **Terraform + Ansible**. Procédure complète de reproduction :
[`infra/README.md`](infra/README.md).

## 📝 Licence

Voir le fichier [LICENSE](LICENSE).

---

**Made with ❤️ for the Engrainages Competition**
