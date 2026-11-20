#!/usr/bin/env bash
# Takes the 48 screenshot baselines from a CI run: GitHub's ubuntu runner is the renderer they must match
# (a Docker run on another machine differs by about 1% of pixels in font edges).
# After a visual change: push, let CI's "Screenshots" step fail, review the diffs in the run's `reports`
# artifact (playwright-report/index.html), then: npm run test:visual:update -- <run-id>
set -euo pipefail
RUN=${1:?usage: npm run test:visual:update -- <run-id>}
cd "$(dirname "$0")/.."
DIR=$(mktemp -d)
gh run download "$RUN" -n reports -D "$DIR"
n=0
# First attempts only: retries render the same pixels and live in *-retry1 folders.
while IFS= read -r f; do
  name=$(basename "$f")
  cp "$f" "tests/e2e/__screenshots__/linux/${name%-actual.png}.png"
  n=$((n + 1))
done < <(find "$DIR/test-results" -path "*-visual/*-actual.png")
echo "$n baselines updated from run $RUN; review with git diff --stat, then commit"
