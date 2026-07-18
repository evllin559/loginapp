#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist/ProspeccaoWhatsApp-Windows"
CACHE="$ROOT/.cache/windows-build"
NODE_VERSION="20.18.1"
NODE_ZIP="node-v${NODE_VERSION}-win-x64.zip"
NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_ZIP}"

echo "==> Limpando pasta de distribuição"
rm -rf "$DIST"
mkdir -p "$DIST/app" "$DIST/runtime" "$CACHE"

echo "==> Compilando launcher Windows (.exe)"
cd "$ROOT/launcher"
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o "$DIST/ProspeccaoWhatsApp.exe" .

echo "==> Build Next.js (standalone)"
cd "$ROOT"
npm run build

echo "==> Copiando app standalone"
cp -a "$ROOT/.next/standalone/." "$DIST/app/"
mkdir -p "$DIST/app/.next"
cp -a "$ROOT/.next/static" "$DIST/app/.next/static"
if [ -d "$ROOT/public" ]; then
  mkdir -p "$DIST/app/public"
  cp -a "$ROOT/public/." "$DIST/app/public/"
fi

echo "==> Baixando Node.js Windows x64"
if [ ! -f "$CACHE/$NODE_ZIP" ]; then
  curl -fsSL "$NODE_URL" -o "$CACHE/$NODE_ZIP"
fi

echo "==> Extraindo node.exe"
TMP_NODE="$CACHE/node-extract"
rm -rf "$TMP_NODE"
mkdir -p "$TMP_NODE"
unzip -q "$CACHE/$NODE_ZIP" -d "$TMP_NODE"
cp "$TMP_NODE/node-v${NODE_VERSION}-win-x64/node.exe" "$DIST/runtime/node.exe"

echo "==> Gerando chave de 1 hora"
cd "$ROOT"
npm run key:generate
cp "$ROOT/windows/CHAVE-1HORA.txt" "$DIST/CHAVE-1HORA.txt"
cp "$ROOT/windows/license.key" "$DIST/license.key"

# Banco seed (JSON)
mkdir -p "$DIST/app/data"
if [ -f "$ROOT/data/prospeccao.json" ]; then
  cp "$ROOT/data/prospeccao.json" "$DIST/app/data/prospeccao.json"
else
  cd "$ROOT"
  npm run db:seed
  cp "$ROOT/data/prospeccao.json" "$DIST/app/data/prospeccao.json"
fi

cat > "$DIST/COMO-USAR.txt" << 'EOF'
PROSPECCAO WHATSAPP — EXECUTAVEL WINDOWS
========================================

1. Extraia a pasta inteira (nao separe o .exe dos arquivos)
2. Clique duas vezes em: ProspeccaoWhatsApp.exe
3. O navegador abre em http://localhost:3000
4. Cole a chave do arquivo CHAVE-1HORA.txt
5. A chave vale por 1 HORA

Nao precisa instalar Node.js.
Windows 10/11 64-bit.
EOF

echo "==> Criando ZIP"
mkdir -p "$ROOT/dist"
cd "$ROOT/dist"
rm -f ProspeccaoWhatsApp-Windows.zip
zip -r -q ProspeccaoWhatsApp-Windows.zip ProspeccaoWhatsApp-Windows

echo ""
echo "✓ Executavel pronto:"
echo "  $DIST/ProspeccaoWhatsApp.exe"
echo "  $ROOT/dist/ProspeccaoWhatsApp-Windows.zip"
ls -lh "$DIST/ProspeccaoWhatsApp.exe" "$ROOT/dist/ProspeccaoWhatsApp-Windows.zip"
