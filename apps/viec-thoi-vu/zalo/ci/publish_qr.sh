#!/usr/bin/env bash
# Publishes every fresh Zalo login QR (written by deploy.py) to the throw-away branch `zalo-qr`,
# so a person can fetch the image and scan it. The branch is deleted when the run ends.
# Commit messages carry [skip ci] [vercel skip] so no preview deploy is triggered.
set -u
OUT="${OUT:-/tmp/zout}"
WORK="$(mktemp -d)"
cd "$WORK"
git init -q
git config user.name github-actions
git config user.email actions@users.noreply.github.com
git remote add origin "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
for _ in $(seq 1 1500); do
  [ -f "$OUT/done" ] && break
  for i in 1 2 3 4 5 6; do
    if [ -f "$OUT/qr$i.png" ] && [ ! -f "$WORK/.pub$i" ]; then
      cp "$OUT/qr$i.png" qr.png
      echo "$i $(date +%s)" > n.txt
      git add qr.png n.txt
      git commit -q -m "QR $i [skip ci] [vercel skip]"
      git push -q -f origin HEAD:refs/heads/zalo-qr && echo "published QR $i"
      touch "$WORK/.pub$i"
    fi
  done
  sleep 1
done
sleep 20   # let the person finish fetching the last image
git push -q origin --delete zalo-qr || true
