#!/bin/zsh
cd -- "$(dirname -- "$0")" || exit 1
ritme_node="$(command -v node)"
if [[ -z "$ritme_node" ]]; then
  ritme_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ ! -x "$ritme_node" ]]; then
  print 'Installeer Node.js 20 of nieuwer en open dit bestand opnieuw.'
  read '?Druk op Enter om te sluiten.'
  exit 1
fi
exec "$ritme_node" scripts/serve.mjs
