#!/usr/bin/env bash
# Publishes every fresh Zalo login QR (written by deploy.py) to the throw-away branch `zalo-qr`,
# so a person can fetch the image and scan it. The branch is deleted when the run ends.
# Vercel ignores commit-message tags, so the branch carries a vercel.json under the project's root
# directory that turns deployments off (otherwise every QR triggers a failed preview build + email).
set -u
OUT="${OUT:-/tmp/zout}"
WORK="$(mktemp -d)"
cd "$WORK"
git init -q
mkdir -p apps/viec-thoi-vu
echo '{ "git": { "deploymentEnabled": false } }' > apps/viec-thoi-vu/vercel.json
git config user.name github-actions
git config user.email actions@users.noreply.github.com
git remote add origin "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
for _ in $(seq 1 1500); do
  [ -f "$OUT/done" ] && break
  for i in 1 2 3 4 5 6; do
    if [ -f "$OUT/qr$i.png" ] && [ ! -f "$WORK/.pub$i" ]; then
      cp "$OUT/qr$i.png" qr.png
      echo "$i $(date +%s)" > n.txt
      git add qr.png n.txt apps/viec-thoi-vu/vercel.json
      git commit -q -m "QR $i [skip ci] [vercel skip]"
      git push -q -f origin HEAD:refs/heads/zalo-qr && echo "published QR $i"
      touch "$WORK/.pub$i"
    fi
  done
  sleep 1
done
sleep 20   # let the person finish fetching the last image
git push -q origin --delete zalo-qr || true
