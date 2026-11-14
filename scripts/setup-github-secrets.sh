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

# Vercel token. Re-run with --replace-token to swap a bad or expired one.
if gh secret list | grep -q '^VERCEL_TOKEN' && [ "${1:-}" != "--replace-token" ]; then
  echo "VERCEL_TOKEN: already set (left unchanged; run with --replace-token to change it)"
else
  read -r -s -p "Paste a Vercel access token (input hidden): " token
  echo
  # Windows terminals can paste a trailing carriage return; strip all whitespace.
  token="$(printf '%s' "$token" | tr -d '[:space:]')"
  org="$(node -p 'require("./.vercel/project.json").orgId')"
  project="$(node -p 'require("./.vercel/project.json").projectId')"
  # The Vercel CLI reads BOTH the team and the project before it deploys, and stops
  # with "Could not retrieve Project Settings" if either is forbidden. Check both
  # before saving (prints only HTTP status codes).
  check() { curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $token" "$1"; }
  s_team="$(check "https://api.vercel.com/v2/teams/$org")"
  s_project="$(check "https://api.vercel.com/v9/projects/$project?teamId=$org")"
  echo "Vercel check: team HTTP $s_team, project HTTP $s_project"
  if [ "$s_team" != "200" ] || [ "$s_project" != "200" ]; then
    echo "VERCEL_TOKEN: NOT saved." >&2
    echo "  The token must reach the whole team, not only one project. Create a new token at" >&2
    echo "  https://vercel.com/account/tokens with scope \"Surya Pratik's projects\" (the team itself," >&2
    echo "  no project restriction), then re-run with --replace-token." >&2
    exit 1
  fi
  echo "VERCEL_TOKEN: verified for team and project queue-manager"
  put VERCEL_TOKEN "$token"
fi

echo
gh secret list
