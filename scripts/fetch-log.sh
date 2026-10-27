#!/usr/bin/env bash
set -euo pipefail

# Copy one match's stored files from the droplet into game-logs/<env>/<matchID>/.
#   ./scripts/fetch-log.sh <matchID> [prod|staging]
#   ./scripts/fetch-log.sh --list [prod|staging]    list matches to find an ID

usage() { echo "usage: fetch-log.sh <matchID>|--list [prod|staging]" >&2; exit 1; }

MATCH="${1:-}"
ENV="${2:-prod}"
[ -n "$MATCH" ] || usage
case "$ENV" in
  prod)    REMOTE_DIR="/opt/game-server/prod" ;;
  staging) REMOTE_DIR="/opt/game-server/staging" ;;
  *) echo "unknown env: $ENV" >&2; usage ;;
esac
DB_DIR="$REMOTE_DIR/server/db"

: "${DROPLET_HOST:?set DROPLET_HOST=deploy@your.droplet.ip in your shell or .envrc}"

# Share one SSH connection between all the commands below, so the key's
# passphrase is only asked for once per run.
SSH_DIR="$(mktemp -d)"
trap 'ssh -o ControlPath="$SSH_DIR/socket" -O exit "$DROPLET_HOST" 2>/dev/null; rm -rf "$SSH_DIR"' EXIT
remote() {
  ssh -o ControlMaster=auto -o ControlPath="$SSH_DIR/socket" -o ControlPersist=60 "$DROPLET_HOST" "$@"
}

# Print a remote file, falling back to sudo if the deploy user can't read it.
remote_cat() {
  remote "cat '$1' 2>/dev/null || sudo -n cat '$1'"
}

if [ "$MATCH" = "--list" ]; then
  # One line per match: created time, match ID, player names
  remote "cd '$DB_DIR' && node -e '
    const fs = require(\"fs\");
    for (const f of fs.readdirSync(\".\")) {
      let entry;
      try { entry = JSON.parse(fs.readFileSync(f, \"utf8\")); } catch { continue; }
      if (!entry.key || !entry.key.endsWith(\":metadata\")) continue;
      const players = Object.values(entry.value.players || {}).map(p => p.name).filter(Boolean).join(\", \");
      console.log(new Date(entry.value.createdAt).toISOString().slice(0, 16), entry.key.split(\":\")[0], players);
    }' | sort"
  exit 0
fi

# boardgame.io's FlatFile store (node-persist) names each file by the SHA-256
# of its key: "<matchID>" for the state, "<matchID>:log" for the log, etc.
hash() { printf '%s' "$1" | sha256sum | cut -c1-64; }

OUT_DIR="game-logs/$ENV/$MATCH"
mkdir -p "$OUT_DIR"

found=0
for part in state log metadata initial; do
  key="$MATCH"
  [ "$part" = "state" ] || key="$MATCH:$part"
  file="$DB_DIR/$(hash "$key")"
  if remote_cat "$file" > "$OUT_DIR/$part.json" 2>/dev/null; then
    # Pretty-print for reading; the content is unchanged
    node -e 'const f = process.argv[1]; const fs = require("fs"); fs.writeFileSync(f, JSON.stringify(JSON.parse(fs.readFileSync(f, "utf8")), null, 2));' "$OUT_DIR/$part.json"
    echo "saved $OUT_DIR/$part.json"
    found=$((found + 1))
  else
    rm -f "$OUT_DIR/$part.json"
    echo "no $part file for $MATCH on $ENV" >&2
  fi
done

if [ "$found" -eq 0 ]; then
  rmdir "$OUT_DIR" 2>/dev/null || true
  echo "nothing found: check the match ID, or run with --list" >&2
  exit 1
fi
