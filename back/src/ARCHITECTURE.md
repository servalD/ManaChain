# Architecture rules (back)

Ce back suit une **architecture clean / hexagonale**. Ces règles sont obligatoires —
tout nouveau code doit s'y conformer. Aligné sur le projet de référence `comutitre/back`,
avec **une règle plus stricte sur les exceptions** (voir plus bas).

## Couches & règle de dépendance

```
presentation  ─▶  application  ─▶  domain
                       ▲
infrastructure ────────┘   (implémente les ports définis dans domain)
```

Les dépendances pointent **vers l'intérieur uniquement** :

| Couche | Dossier | Responsabilité | Peut importer |
| --- | --- | --- | --- |
| **domain** | `modules/<m>/domain` | Modèles métier purs, **ports** (abstract class), erreurs métier. | rien de framework |
| **application** | `modules/<m>/application` | Use-cases (1 classe, 1 `execute()`), DTOs. Orchestre le domaine via les ports. | domain |
| **infrastructure** | `modules/<m>/infrastructure` | Adapters : entités/repos TypeORM, clients externes. | domain, application |
| **presentation** | `modules/<m>/presentation` | Controllers, presenters. HTTP in/out uniquement. | application, domain |

**Le domaine ne doit JAMAIS importer `@nestjs/*`, `typeorm`, ou tout autre framework.**

## Exceptions — règle stricte du projet

- Les couches **domain** et **application** ne lèvent QUE des sous-classes de
  `shared/domain/domain.exception.ts` (`NotFoundDomainException`, `ConflictDomainException`,
  `ValidationDomainException`, `UnauthorizedDomainException`, `ForbiddenDomainException`).
  Chaque module définit ses erreurs concrètes dans `domain/*.errors.ts`.
- La traduction vers HTTP se fait **uniquement en présentation**, via le filtre global
  `shared/filters/domain-exception.filter.ts` (mappe `kind` → statut HTTP).
- Les exceptions `@nestjs/*` (`NotFoundException`…) sont réservées aux éléments de
  framework de la couche présentation (guards, pipes) — jamais dans un use-case.

## Ports & adapters

- Un **port** est une `abstract class` du `domain` (ex. `UserRepository`), utilisée comme token DI.
- L'**adapter** vit dans `infrastructure` (ex. `TypeOrmUserRepository extends UserRepository`).
- Liaison dans le module : `providers: [{ provide: UserRepository, useClass: TypeOrmUserRepository }]`.
- Un fake `in-memory-*.repository.ts` permet de tester les use-cases sans DB.

## Modèle de domaine vs ORM entity

La forme persistée (`*.orm-entity.ts`, décorée TypeORM) est **séparée** du modèle de domaine
(`domain/<name>.ts`, classe simple). L'adapter mappe entre les deux (`toDomain`). Ne jamais
laisser fuiter une ORM entity hors de l'infrastructure.

## Use-cases

- Un use-case par fichier `*.use-case.ts`, classe `XxxUseCase`, un seul `execute(...)` public.
- Pas de type HTTP/DB dans la signature — uniquement des types de domaine / primitives.
- Les controllers appellent les use-cases ; ils ne contiennent **aucune** logique métier.

## DTOs & validation

- Les DTO de requête vivent dans `application/dto`, validés avec `class-validator`.
- `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` global (`main.ts`).

## Conventions de nommage

`*.use-case.ts` · `*.controller.ts` · `*.repository.ts` (port) · `typeorm-*.repository.ts` (adapter)
· `*.orm-entity.ts` · `*.errors.ts` · `*.presenter.ts` · `*.module.ts` · `*.spec.ts`.

## Ajouter un module

1. `domain/` — modèle(s) + port repository + erreurs.
2. `application/` — use-cases + DTOs.
3. `infrastructure/` — ORM entity + adapter (+ client externe éventuel). Enregistrer l'entity
   dans `infrastructure/database/{database.module.ts, typeorm.config.ts}`.
4. `presentation/` — controller + presenter.
5. `<name>.module.ts` — `TypeOrmModule.forFeature([...])`, lier les ports, déclarer les use-cases,
   exporter ce que d'autres modules consomment.
6. Migration TypeORM pour tout changement de schéma.
7. Tests unitaires (use-cases sur fakes) + e2e si la route est exposée.

## Code transverse

- Décorateurs/guards/enums/erreurs partagés : `src/shared`.
- Infra applicative (config, database) : `src/infrastructure`.

## Génération

Utiliser le Nest CLI pour les artefacts framework : `nest g module|controller|guard|filter|decorator …`,
puis adapter à la structure clean (déplacer la logique dans la bonne couche).
