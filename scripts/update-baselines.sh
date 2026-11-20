#!/usr/bin/env bash
# Renders the 48 screenshot baselines on Linux, the way CI does, from any machine with Docker.
# The image matches the locked @playwright/test version; amd64 matches GitHub's ubuntu runners.
# Usage: npm run build && npm run test:visual:update
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(node -p 'require("./node_modules/@playwright/test/package.json").version')
PORT=${PW_PORT:-4393}
# Astro 7 keeps a preview server running in the background, so stop any old one first and on exit.
npx astro preview stop > /dev/null 2>&1 || true
npx astro preview --host 0.0.0.0 --allowed-hosts host.docker.internal --port "$PORT" > /tmp/feinwerk-preview.log 2>&1 &
trap 'npx astro preview stop > /dev/null 2>&1 || true' EXIT
for _ in $(seq 1 30); do curl -sf "http://localhost:$PORT/feinwerk-auto/" > /dev/null && break; sleep 1; done
docker run --rm --platform linux/amd64 --ipc=host \
  -v "$PWD:/work" -w /work \
  -e CI=1 -e PW_BASE_URL="http://host.docker.internal:$PORT/feinwerk-auto/" \
  "mcr.microsoft.com/playwright:v$VERSION-noble" \
  npx playwright test --project=visual --update-snapshots=all --reporter=line "$@"
