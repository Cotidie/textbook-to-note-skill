#!/usr/bin/env bash
# Copy textbook-notes into ~/.claude/skills and install the renderer's deps.
#
#   ./install.sh
#
# Set CLAUDE_SKILLS_DIR to install somewhere other than ~/.claude/skills.
# Prefer the plugin route in README.md if you do not want a clone around.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$REPO_DIR/skills/textbook-notes"
DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}/textbook-notes"

mkdir -p "$(dirname "$DEST")"

if [ -e "$DEST" ] || [ -L "$DEST" ]; then
  # Back up outside the skills dir so Claude Code does not scan the copy.
  BACKUP="$HOME/.claude/skill-backups/textbook-notes.$(date +%Y%m%d%H%M%S)"
  mkdir -p "$(dirname "$BACKUP")"
  echo "==> existing install found, moving to $BACKUP"
  mv "$DEST" "$BACKUP"
fi

cp -a "$SRC" "$DEST"
echo "==> copied to $DEST"

if command -v npm >/dev/null 2>&1; then
  echo "==> npm install (renderer dependencies)"
  ( cd "$DEST/scripts" && npm install --no-audit --no-fund )
else
  echo "npm not found. Install Node.js 18+ to render notes offline." >&2
  echo "Without it the skill falls back to CDN-loaded KaTeX (needs network)." >&2
fi

echo
echo "Done. Restart Claude Code, then ask for a chapter note, e.g.:"
echo "  \"summarize ch4 of ~/books/deep-learning.pdf\""
