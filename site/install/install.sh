#!/bin/sh
# ZhaoUI installer: copies the library files into a folder of your project.
# Read it before you run it:   curl -fsSL @@ORIGIN@@/install.sh
#
# It needs curl or wget, writes only into the folder you name, never uses sudo,
# never overwrites a file unless you pass --force, and checks every file against
# @@ORIGIN@@/SHA256SUMS before anything is written.  With --version it takes the zip
# and the checksums from the GitHub release instead, so the files and the hashes no
# longer come from the same host as this script.
set -eu

BASE="${ZHAOUI_BASE:-@@ORIGIN@@}"
RELEASES="${ZHAOUI_RELEASES:-@@REPO@@/releases/download}"
VERSION=""
DIR="zhaoui"
WITH=""
FORCE=0
ALL=0

die() { printf 'zhaoui install: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'USAGE'
Usage: install.sh [options]

  --dir DIR      folder to put the files in (default: zhaoui)
  --with LIST    extra files, comma separated: icons, utilities, marketing, glass
  --all          download the zip with everything (modular files, source maps, changelog) instead
  --version V    install exactly version V: the zip and its checksums come from the GitHub release (implies --all)
  --force        overwrite files that already exist
  -h, --help     show this help

Examples:
  curl -fsSL @@ORIGIN@@/install.sh | sh
  curl -fsSL @@ORIGIN@@/install.sh | sh -s -- --dir public/vendor/zhaoui --with icons,marketing
  curl -fsSL @@ORIGIN@@/install.sh | sh -s -- --version @@VERSION@@
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dir)   [ $# -ge 2 ] || die "--dir needs a folder name"; DIR="$2"; shift 2 ;;
    --with)  [ $# -ge 2 ] || die "--with needs a list"; WITH="$2"; shift 2 ;;
    --all)   ALL=1; shift ;;
    --version) [ $# -ge 2 ] || die "--version needs a version number"; VERSION="$2"; shift 2 ;;
    --force) FORCE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1 (try --help)" ;;
  esac
done

if command -v curl >/dev/null 2>&1; then
  fetch() { curl -fsSL "$1" -o "$2"; }
elif command -v wget >/dev/null 2>&1; then
  fetch() { wget -q "$1" -O "$2"; }
else
  die "curl or wget is required"
fi

if command -v sha256sum >/dev/null 2>&1; then
  hash_of() { sha256sum "$1" | cut -d' ' -f1; }
elif command -v shasum >/dev/null 2>&1; then
  hash_of() { shasum -a 256 "$1" | cut -d' ' -f1; }
else
  hash_of() { :; }
  printf 'zhaoui install: no sha256sum or shasum found, the files will not be verified\n' >&2
fi

if [ -n "$VERSION" ]; then
  case "$VERSION" in
    ''|*[!0-9.]*|.*|*.) die "not a version number: $VERSION (use something like 0.1.0)" ;;
  esac
  ALL=1
fi

# where a file listed in SHA256SUMS is downloaded from, and where the checksums themselves come from
if [ -n "$VERSION" ]; then
  SUMS_URL="$RELEASES/v$VERSION/SHA256SUMS"
  url_of() { printf '%s/v%s/%s' "$RELEASES" "$VERSION" "$(basename "$1")"; }
else
  SUMS_URL="$BASE/SHA256SUMS"
  url_of() { printf '%s/%s' "$BASE" "$1"; }
fi

TMP=$(mktemp -d 2>/dev/null || mktemp -d -t zhaoui) || die "cannot create a temporary folder"
trap 'rm -rf "$TMP"' EXIT INT TERM

fetch "$SUMS_URL" "$TMP/SHA256SUMS" || die "cannot download $SUMS_URL"

if [ "$ALL" -eq 1 ]; then
  if [ -n "$VERSION" ]; then
    FILES="assets/zhaoui-$VERSION.zip"
    grep -q "  $FILES\$" "$TMP/SHA256SUMS" || die "version $VERSION is not listed in $SUMS_URL"
  else
    FILES=$(grep -o 'assets/zhaoui-[0-9][0-9.]*\.zip' "$TMP/SHA256SUMS" | head -n 1)
  fi
  [ -n "$FILES" ] || die "no zip is listed in SHA256SUMS"
else
  FILES="assets/zhaoui/zhaoui.min.css assets/zhaoui/zhaoui.min.js"
  for w in $(printf '%s' "$WITH" | tr ',' ' '); do
    case "$w" in
      icons)     FILES="$FILES assets/zhaoui/zhaoui-icons.min.js" ;;
      utilities) FILES="$FILES assets/zhaoui/zhaoui-utilities.min.css" ;;
      marketing) FILES="$FILES assets/zhaoui/zhaoui-marketing.min.css" ;;
      glass)     FILES="$FILES assets/zhaoui/zhaoui-style-glass.min.css" ;;
      *) die "unknown name in --with: $w (use icons, utilities, marketing, glass)" ;;
    esac
  done
fi

if [ "$FORCE" -eq 0 ]; then
  for f in $FILES; do
    [ ! -e "$DIR/$(basename "$f")" ] || die "$DIR/$(basename "$f") already exists, nothing was changed (use --force to overwrite)"
  done
fi

for f in $FILES; do
  name=$(basename "$f")
  fetch "$(url_of "$f")" "$TMP/$name" || die "cannot download $(url_of "$f")"
  expected=$(grep "  $f\$" "$TMP/SHA256SUMS" | cut -d' ' -f1 || true)
  [ -n "$expected" ] || die "$f is not listed in SHA256SUMS, nothing was installed"
  actual=$(hash_of "$TMP/$name")
  if [ -n "$actual" ] && [ "$actual" != "$expected" ]; then
    die "checksum mismatch for $name, nothing was installed"
  fi
done

mkdir -p "$DIR"
for f in $FILES; do
  name=$(basename "$f")
  mv -f "$TMP/$name" "$DIR/$name"
  printf 'installed %s/%s\n' "$DIR" "$name"
done

if [ "$ALL" -eq 1 ]; then
  printf '\nUnzip it where you want the files:  unzip %s/%s -d %s\n' "$DIR" "$(basename "$FILES")" "$DIR"
else
  printf '\nAdd to your page (script before the closing body tag):\n\n'
  for f in $FILES; do
    case "$f" in
      *.css) printf '  <link rel="stylesheet" href="%s/%s">\n' "$DIR" "$(basename "$f")" ;;
    esac
  done
  for f in $FILES; do
    case "$f" in
      *.js) printf '  <script src="%s/%s"></script>\n' "$DIR" "$(basename "$f")" ;;
    esac
  done
  printf '\nzhaoui-icons.min.js must come after zhaoui.min.js; zhaoui-marketing.min.css after zhaoui.min.css.\n'
fi
