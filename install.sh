#!/usr/bin/env bash
# Install textbook-notes as a personal Claude Code skill.
#
#   ./install.sh            symlink this repo into ~/.claude/skills (default)
#   ./install.sh --copy     copy instead of symlink
#   ./install.sh --deps     only install the renderer's npm dependencies
#
# Prefer the plugin route in README.md if you do not want a clone to babysit.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$REPO_DIR/skills/textbook-notes"
DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}/textbook-notes"
MODE=link

for arg in "$@"; do
  case "$arg" in
    --copy) MODE=copy ;;
    --link) MODE=link ;;
    --deps) MODE=deps ;;
    -h|--help) sed -n '2,8p' "${BASH_SOURCE[0]}" | sed 's/^# \?//'; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

# install_deps <skill-dir>
install_deps() {
  if ! command -v npm >/dev/null 2>&1; then
    echo "npm not found. Install Node.js 18+ to render notes offline." >&2
    echo "Without it the skill falls back to CDN-loaded KaTeX (needs network)." >&2
    return 0
  fi
  echo "==> npm install (renderer dependencies)"
  ( cd "$1/scripts" && npm install --no-audit --no-fund )
}

if [ "$MODE" = deps ]; then
  install_deps "$SRC"
  exit 0
fi

mkdir -p "$(dirname "$DEST")"

if [ -e "$DEST" ] || [ -L "$DEST" ]; then
  if [ -L "$DEST" ] && [ "$(readlink -f "$DEST")" = "$(readlink -f "$SRC")" ]; then
    echo "==> already linked: $DEST"
  else
    # Back up outside the skills dir so Claude Code does not scan the copy.
    BACKUP_DIR="$HOME/.claude/skill-backups"
    BACKUP="$BACKUP_DIR/textbook-notes.$(date +%Y%m%d%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    echo "==> existing install found, moving to $BACKUP"
    mv "$DEST" "$BACKUP"
  fi
fi

if [ ! -e "$DEST" ]; then
  case "$MODE" in
    link) ln -s "$SRC" "$DEST"; echo "==> linked $DEST -> $SRC" ;;
    copy) cp -a "$SRC" "$DEST"; echo "==> copied to $DEST" ;;
  esac
fi

install_deps "$DEST"

echo
echo "Done. Restart Claude Code, then ask for a chapter note, e.g.:"
echo "  \"summarize ch4 of ~/books/deep-learning.pdf\""
