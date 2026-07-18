#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${ROOT}/dist"
mkdir -p "${OUT_DIR}"

echo "Compilando LoginApp para Windows (amd64)..."
cd "${ROOT}"
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "${OUT_DIR}/LoginApp.exe" ./cmd/loginapp

echo "Pronto: ${OUT_DIR}/LoginApp.exe"
ls -lh "${OUT_DIR}/LoginApp.exe"
