#!/bin/sh
if ! command -v firebase >/dev/null 2>&1; then
  echo "Firebase CLI nao encontrado. Instale com npm install -g firebase-tools"
  exit 1
fi

firebase deploy --only hosting
