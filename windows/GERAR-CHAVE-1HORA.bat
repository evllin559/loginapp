@echo off
chcp 65001 >nul
title Gerar chave de 1 hora
cd /d "%~dp0.."

echo Gerando chave Windows valida por 1 hora...
echo.

call npm run key:generate
if errorlevel 1 (
  echo.
  echo Se falhou, rode antes: npm install
  pause
  exit /b 1
)

echo.
echo Arquivo gerado: windows\CHAVE-1HORA.txt
echo.
notepad "%~dp0CHAVE-1HORA.txt"
pause
