#!/usr/bin/env bash
set -e
# Determina se a branch 'main' existe; senão usa a branch atual
if git show-ref --verify --quiet refs/heads/main; then
  BRANCH=main
else
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

# Obter a data do último commit na branch escolhida (ISO 8601)
DATE=$(git log -1 --format=%cI "$BRANCH")
COMMIT=$(git rev-parse --short "$BRANCH")

OUTDIR="js"
mkdir -p "$OUTDIR"
cat > "$OUTDIR/last_commit.json" <<EOF
{"date":"${DATE}","commit":"${COMMIT}","branch":"${BRANCH}"}
EOF

echo "Wrote $OUTDIR/last_commit.json (branch=$BRANCH, commit=$COMMIT, date=$DATE)"
