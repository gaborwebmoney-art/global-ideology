#!/usr/bin/env bash
# Run this ONCE on your own computer. It creates your Google Play upload key and prints what to put into GitHub.
# The key file stays on your computer (back it up: a lost upload key can be reset via Play support, but it takes days).
# usage: ./tools/make-upload-key.sh [output-folder]      (default: ~/global-ideology-keys)
set -euo pipefail
command -v keytool >/dev/null || { echo "keytool not found. Install a JDK first: sudo apt install default-jdk-headless"; exit 1; }
DIR="${1:-$HOME/global-ideology-keys}"; KS="$DIR/upload.jks"; ALIAS="upload"
mkdir -p "$DIR"; chmod 700 "$DIR"
[ ! -e "$KS" ] || { echo "$KS already exists. Not overwriting. Move it away first if you really want a new key."; exit 1; }
PW="$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)"
keytool -genkeypair -keystore "$KS" -storetype PKCS12 -storepass "$PW" -keypass "$PW" -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Global Ideology, O=Global Ideology, C=HU" >/dev/null
chmod 600 "$KS"
echo "$PW" > "$DIR/upload-password.txt"; chmod 600 "$DIR/upload-password.txt"
echo
echo "Done. Files in $DIR :"
echo "  upload.jks            the upload key (back it up somewhere safe, never commit it)"
echo "  upload-password.txt   its password"
echo
echo "Now add these 4 repository secrets: GitHub -> gaborwebmoney-art/global-ideology -> Settings -> Secrets and variables -> Actions -> New repository secret"
echo "  ANDROID_KEYSTORE_PASSWORD = $PW"
echo "  ANDROID_KEY_PASSWORD      = $PW"
echo "  ANDROID_KEY_ALIAS         = $ALIAS"
echo "  ANDROID_KEYSTORE_BASE64   = (the long text printed below, one line)"
echo
base64 -w0 "$KS"; echo
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  echo; read -r -p "gh is logged in. Set the 4 secrets automatically now? [y/N] " a
  if [ "${a:-n}" = "y" ]; then
    R=gaborwebmoney-art/global-ideology
    base64 -w0 "$KS" | gh secret set ANDROID_KEYSTORE_BASE64 -R $R
    printf '%s' "$PW" | gh secret set ANDROID_KEYSTORE_PASSWORD -R $R
    printf '%s' "$PW" | gh secret set ANDROID_KEY_PASSWORD -R $R
    printf '%s' "$ALIAS" | gh secret set ANDROID_KEY_ALIAS -R $R
    echo "Secrets set."
  fi
fi
