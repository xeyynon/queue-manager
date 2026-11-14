#!/usr/bin/env bash
# Sets the GitHub Actions secrets the CI/Deploy pipeline needs (.github/workflows/ci.yml).
# Values are piped from their source straight into `gh secret set`; nothing is printed.
#
#   bash scripts/setup-github-secrets.sh
#
# Needs: gh (logged in), neonctl (logged in), a linked Vercel project (.vercel/project.json),
# and a Vercel access token you create at https://vercel.com/account/tokens
# (scope: your team, expiry of your choice). You paste it at the prompt; it is not echoed.
set -euo pipefail

NEON_PROJECT="curly-dust-57177870"

conn() {
  neonctl connection-string "$1" --project-id "$NEON_PROJECT" --pooled \
    --database-name neondb --role-name neondb_owner 2>/dev/null
}

put() { # name value
  if [ -z "$2" ]; then echo "$1: no value, skipped" >&2; return 1; fi
  printf '%s' "$2" | gh secret set "$1" >/dev/null
  echo "$1: set"
}

put TEST_DATABASE_URL "$(conn test)"
put PROD_DATABASE_URL "$(conn main)"
put VERCEL_ORG_ID "$(node -p 'require("./.vercel/project.json").orgId')"
put VERCEL_PROJECT_ID "$(node -p 'require("./.vercel/project.json").projectId')"

if gh secret list | grep -q '^VERCEL_TOKEN'; then
  echo "VERCEL_TOKEN: already set (left unchanged)"
else
  read -r -s -p "Paste a Vercel access token (input hidden): " token
  echo
  put VERCEL_TOKEN "$token"
fi

echo
gh secret list
