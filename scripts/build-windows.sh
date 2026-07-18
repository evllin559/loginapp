#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${ROOT}/dist"
mkdir -p "${OUT_DIR}"

echo "Compilando LoginApp para Windows (amd64)..."
cd "${ROOT}"
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "${OUT_DIR}/LoginApp.exe" ./cmd/loginapp

echo "Gerando chave de 50 minutos..."
go run ./cmd/genkey | tee "${OUT_DIR}/CHAVE-50MIN.txt"
# extrai só a linha da chave LOGIN-...
grep -E '^LOGIN-' "${OUT_DIR}/CHAVE-50MIN.txt" > "${OUT_DIR}/license.key" || true

cat > "${OUT_DIR}/COMO-USAR.txt" << 'EOF'
LOGINAPP — EXECUTAVEL WINDOWS
=============================

1. Clique duas vezes em LoginApp.exe
2. O navegador abre a tela de ativacao
3. Cole a chave do arquivo CHAVE-50MIN.txt
4. A chave vale por 50 MINUTOS

Nao precisa instalar nada.
EOF

echo "Criando ZIP..."
cd "${OUT_DIR}"
rm -f LoginApp-Windows.zip
zip -q LoginApp-Windows.zip LoginApp.exe CHAVE-50MIN.txt license.key COMO-USAR.txt

echo "Pronto:"
ls -lh "${OUT_DIR}/LoginApp.exe" "${OUT_DIR}/LoginApp-Windows.zip" "${OUT_DIR}/CHAVE-50MIN.txt"
