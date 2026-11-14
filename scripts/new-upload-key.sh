#!/usr/bin/env bash
# Make a new Android upload key for KOR (docs/RELEASE.md §5a).
#
# Use this when the old upload key is lost: Google resets the upload key of an
# app enrolled in Play App Signing when you send them the certificate this
# script exports. Run it on your own computer (it needs a JDK for `keytool`),
# never in CI, and keep everything it writes out of this repository.
#
#   bash scripts/new-upload-key.sh ~/kor-signing
#
# It asks for a password (twice) and writes into the folder you give:
#   kor-upload.keystore         the new upload key (back it up: password manager + offline copy)
#   upload_certificate.pem      the public certificate to upload to Play Console
#   keystore.base64.txt         the keystore as one line, for the ANDROID_KEYSTORE_BASE64 secret
# The password is never printed or written to a file.
set -euo pipefail

OUT="${1:-}"
if [ -z "$OUT" ]; then echo "usage: bash scripts/new-upload-key.sh <folder outside the repository>" >&2; exit 2; fi
command -v keytool >/dev/null || { echo "keytool not found: install a JDK (e.g. Temurin 21) first" >&2; exit 2; }
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$(realpath -m "$OUT")"
case "$OUT" in "$REPO"|"$REPO"/*) echo "refusing to write the key inside the repository: pick a folder outside $REPO" >&2; exit 2;; esac
mkdir -p "$OUT"
KS="$OUT/kor-upload.keystore"
[ -e "$KS" ] && { echo "$KS already exists; not overwriting it" >&2; exit 2; }

read -r -s -p "New keystore password (at least 8 characters): " P1; echo
read -r -s -p "Again: " P2; echo
[ "$P1" = "$P2" ] || { echo "the passwords differ" >&2; exit 1; }
[ "${#P1}" -ge 8 ] || { echo "the password is shorter than 8 characters" >&2; exit 1; }
export KOR_KS_PASS="$P1"; unset P1 P2

# The alias stays "cinderfall": the release workflow signs with that alias.
keytool -genkeypair -keystore "$KS" -storetype PKCS12 -alias cinderfall \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass:env KOR_KS_PASS -keypass:env KOR_KS_PASS \
  -dname "CN=KOR upload key"
keytool -export -rfc -keystore "$KS" -alias cinderfall -storepass:env KOR_KS_PASS -file "$OUT/upload_certificate.pem"
base64 < "$KS" | tr -d '\n' > "$OUT/keystore.base64.txt"
chmod 600 "$KS" "$OUT/keystore.base64.txt"

echo
echo "Upload certificate fingerprint (compare with Play Console after the reset):"
keytool -list -v -keystore "$KS" -alias cinderfall -storepass:env KOR_KS_PASS | grep -E 'SHA256:|SHA1:' | sed 's/^\s*/  /'
unset KOR_KS_PASS
cat <<EOF

Done. Next (docs/RELEASE.md §5a):
  1. Play Console > KOR > Test and release > App integrity > App signing:
     "Request upload key reset", reason "I lost my upload key", upload
       $OUT/upload_certificate.pem
  2. GitHub > Settings > Secrets and variables > Actions, three secrets:
       ANDROID_KEYSTORE_BASE64  the contents of $OUT/keystore.base64.txt
       ANDROID_KEYSTORE_PASS    the password you just typed
       ANDROID_KEY_PASS         the same password
  3. When Google confirms the reset, run "Build Android release AAB".
Back up $KS and the password before anything else.
EOF
