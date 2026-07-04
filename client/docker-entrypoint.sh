#!/bin/sh
# Mappe les secrets Docker Swarm vers les variables d'environnement attendues
# par l'application : pour toute variable XXX_FILE pointant vers un fichier
# (typiquement /run/secrets/xxx), exporte XXX avec le contenu du fichier.
# Même convention que l'image officielle postgres.
set -eu

for pair in $(env | grep -E '^[A-Z0-9_]+_FILE=' || true); do
  var="${pair%%=*}"
  file="${pair#*=}"
  target="${var%_FILE}"
  if [ -r "$file" ]; then
    export "$target"="$(cat "$file")"
    unset "$var"
  fi
done

exec "$@"
