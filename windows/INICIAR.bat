@echo off
chcp 65001 >nul
title Prospeccao WhatsApp - Windows (Trial 1 hora)
cd /d "%~dp0.."

echo ============================================
echo   PROSPECCAO WHATSAPP - VERSAO WINDOWS
echo   Chave de acesso valida por 1 HORA
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo Instale em: https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo Falha no npm install.
    pause
    exit /b 1
  )
)

if not exist "data\prospeccao.db" (
  echo Preparando banco de dados de exemplo...
  call npm run db:seed
)

echo.
echo Abrindo sistema em http://localhost:3000
echo Use a chave do arquivo windows\CHAVE-1HORA.txt
echo.
echo Pressione Ctrl+C para encerrar.
echo.

start "" "http://localhost:3000"
call npm run dev
pause
