#!/usr/bin/env sh
# Builds dist/mdify-<version>.zip for the Chrome Web Store / Edge Add-ons.
# Usage: sh scripts/package.sh
set -eu
cd "$(dirname "$0")/.."
version=$(node -p "require('./manifest.json').version")
mkdir -p dist
rm -f "dist/mdify-$version.zip"
grep -v '^#' scripts/package-files.txt | grep -v '^$' | xargs zip -qr "dist/mdify-$version.zip"
echo "Created dist/mdify-$version.zip"
