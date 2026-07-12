# Images de démo

Placez ici les fichiers référencés par `logoImagePath` / `mediaImagePaths` / `events[].imagePath`
dans `contracts/config/demo-seed.json` (ex. `brand1-logo.png`, `brand1-1.jpg`, ...).

Si un fichier est absent, `demo/seed-api.ts` logue un `[skip]` et continue sans bloquer le reste
de la démo (logo/média/cover restent vides plutôt que de faire échouer tout le script).
