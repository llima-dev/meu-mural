#!/bin/bash

# Pega a última tag (ex: v1.4.2)
TAG=$(git describe --tags --abbrev=0)

# Garante que vai sobrescrever o arquivo, não acumular
cat <<EOF > js/version.js
function obterVersaoSistema() {
  return "# $TAG";
}
EOF

echo "✅ version.js atualizado para $TAG"
