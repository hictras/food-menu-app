#!/usr/bin/env bash
set -euo pipefail
: "${ADMIN_USERNAME:?set ADMIN_USERNAME}"
: "${ADMIN_PASSWORD:?set ADMIN_PASSWORD}"
URL="${1:-http://localhost:3000}"

COOKIE=$(curl -s -i -X POST "$URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | grep -i set-cookie | grep -o 'admin_session=[^;]*')

if [ -z "$COOKIE" ]; then
  echo "❌ Login failed — check ADMIN_USERNAME / ADMIN_PASSWORD"
  exit 1
fi

echo "— subscribers —"
curl -s "$URL/api/recipients" -H "Cookie: $COOKIE" | node -e '
  const fs = require("fs");
  let s = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (d) => (s += d));
  process.stdin.on("end", () => {
    const r = JSON.parse(s);
    console.log(r.length + " subscription(s)");
    r.forEach((x) => console.log("  " + x.id + " " + x.phoneNumber));
  });
'

echo "— send to all —"
curl -s -X POST "$URL/api/push/send" \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE" \
  -d '{"title":"All test","body":"broadcast","targetPhone":"all"}'
echo

PHONE="${PHONE:-}"
if [ -z "$PHONE" ]; then
  echo "PHONE not set — skipping targeted test."
else
  echo "— send to $PHONE —"
  curl -s -X POST "$URL/api/push/send" \
    -H "Content-Type: application/json" -H "Cookie: $COOKIE" \
    -d "{\"title\":\"Target test\",\"body\":\"only $PHONE\",\"targetPhone\":\"$PHONE\"}"
  echo
fi

echo "— inbox as admin —"
curl -s "$URL/api/notifications" -H "Cookie: $COOKIE" | node -e '
  const fs = require("fs");
  let s = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (d) => (s += d));
  process.stdin.on("end", () => {
    JSON.parse(s).forEach((n) =>
      console.log("#" + n.id + " [" + n.targetPhone + "] " + n.title)
    );
  });
'

echo "— inbox as guest —"
curl -s "$URL/api/notifications" | node -e '
  let s = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (d) => (s += d));
  process.stdin.on("end", () => {
    JSON.parse(s).forEach((n) =>
      console.log("#" + n.id + " [" + n.targetPhone + "] " + n.title)
    );
  });
'
