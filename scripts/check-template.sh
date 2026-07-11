#!/usr/bin/env bash
# Valida template/src (typecheck + formatação) antes do commit, sem deixar
# node_modules para trás — esse diretório é só um template copiado pelo CLI
# para o projeto do usuário, então não deve ter dependências instaladas
# quando versionado.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$(cd "$SCRIPT_DIR/../template/src" && pwd)"

cleanup() {
  rm -rf "$TEMPLATE_DIR/node_modules"
}
trap cleanup EXIT

echo "→ Instalando dependências de template/src (temporário)..."
yarn --cwd "$TEMPLATE_DIR" install --silent
if [ $? -ne 0 ]; then
  echo "❌ Falha ao instalar dependências de template/src."
  exit 1
fi

echo "→ Checando tipos (tsc --noEmit)..."
(cd "$TEMPLATE_DIR" && node_modules/.bin/tsc --noEmit)
if [ $? -ne 0 ]; then
  echo "❌ Erros de tipo em template/src."
  exit 1
fi

echo "→ Rodando eslint..."
(cd "$TEMPLATE_DIR" && node_modules/.bin/eslint --ext .ts,.tsx src)
if [ $? -ne 0 ]; then
  echo "❌ Erros de lint em template/src."
  exit 1
fi

echo "→ Checando formatação (prettier --check)..."
(cd "$TEMPLATE_DIR" && node_modules/.bin/prettier --check "src/**/*.{ts,tsx,scss,css,json,md}")
if [ $? -ne 0 ]; then
  echo "❌ Arquivos de template/src fora do padrão do prettier (rode 'yarn --cwd template/src prettier --write ...')."
  exit 1
fi

echo "✅ template/src OK"
