@echo off
if not exist "node_modules" (
  echo Firebase CLI nao encontrado localmente.
  echo Verifique se voce tem firebase-tools instalado globalmente.
)

firebase deploy --only hosting
pause
