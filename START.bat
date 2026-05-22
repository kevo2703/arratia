@echo off
cd /d "%~dp0"
echo === Arratia Cotizador ===
echo.
if not exist node_modules (
  echo Instalando dependencias por primera vez...
  npm install
)
echo.
echo Arrancando servidor de desarrollo en http://localhost:3000
echo Detente con Ctrl+C
echo.
npm run dev
