#!/bin/bash
set -e

echo "🔧 Configuring Rowboat..."

# Valeurs par défaut
OPENAI_PROVIDER_NAME=${OPENAI_PROVIDER_NAME:-openai}
OPENAI_BASE_URL=${OPENAI_BASE_URL:-https://api.openai.com/v1}
OPENAI_MODEL=${OPENAI_MODEL:-gpt-4}

# Vérifier la clé API
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  WARNING: OPENAI_API_KEY is not set!"
    echo "   Rowboat will not be able to function without an API key"
fi

if [ -n "$OPENAI_API_KEY" ]; then
    echo "✅ OPENAI_API_KEY is set"
    echo "📝 Provider: $OPENAI_PROVIDER_NAME"
    echo "🌐 Base URL: $OPENAI_BASE_URL"
    echo "🤖 Model: $OPENAI_MODEL"

    # Créer le répertoire de config
    mkdir -p /root/.rowboat/config

    # Créer la configuration models.json
    cat > /root/.rowboat/config/models.json <<EOF
{
  "providers": {
    "$OPENAI_PROVIDER_NAME": {
      "flavor": "openai",
      "apiKey": "$OPENAI_API_KEY",
      "baseURL": "$OPENAI_BASE_URL",
      "headers": {}
    }
  },
  "defaults": {
    "provider": "$OPENAI_PROVIDER_NAME",
    "model": "$OPENAI_MODEL"
  }
}
EOF

    # Créer mcp.json
    cat > /root/.rowboat/config/mcp.json <<EOF
{
  "mcpServers": {}
}
EOF

    echo "✅ Rowboat configured successfully!"
fi

# Démarrer le serveur HTTP
echo ""
echo "🚀 Starting Rowboat HTTP Server on port ${PORT:-3000}..."
echo ""

exec node /app/server.mjs
