import { defineConfig } from "orval";

// Génère les hooks TanStack Query à partir du spec OpenAPI exposé par le
// backend NestJS en dev (back/src/main.ts). Lancer `pnpm start:dev` dans
// back/ avant `pnpm generate:api` ici. Toute modification de l'API backend
// nécessite de relancer cette commande et de committer le diff généré.
export default defineConfig({
  manachain: {
    input: {
      target: process.env.ORVAL_API_URL ?? "http://localhost:3001/api/docs-json",
    },
    output: {
      mode: "tags-split",
      target: "src/api/generated/endpoints",
      schemas: "src/api/generated/models",
      client: "react-query",
      httpClient: "axios",
      override: {
        mutator: {
          path: "src/lib/api/mutator.ts",
          name: "customInstance",
        },
        // Pas d'override query/mutation : on garde le comportement par défaut
        // d'Orval (GET -> useQuery, POST/PUT/PATCH/DELETE -> useMutation).
        // useInfinite volontairement absent : pas d'endpoint paginé câblé pour l'instant.
        // Pour l'activer plus tard sur une opération précise :
        // operations: { listBrands: { query: { useInfinite: true, useInfiniteQueryParam: 'page' } } }
      },
    },
  },
});
