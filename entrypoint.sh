#!/bin/bash
set -e

echo "🔧 Configuring Rowboat..."

# Valeurs par défaut
OPENAI_PROVIDER_NAME=${OPENAI_PROVIDER_NAME:-openai}
OPENAI_BASE_URL=${OPENAI_BASE_URL:-https://api.openai.com/v1}
OPENAI_MODEL=${OPENAI_MODEL:-gpt-4o-mini}  # adapte si tu veux un autre modèle

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  WARNING: OPENAI_API_KEY is not set!"
    echo "   Rowboat pourra démarrer mais ne pourra pas appeler de LLM."
else
    echo "✅ OPENAI_API_KEY is set"
    echo "📝 Provider: $OPENAI_PROVIDER_NAME"
    echo "🌐 Base URL: $OPENAI_BASE_URL"
    echo "🤖 Model: $OPENAI_MODEL"

    # Répertoire de config rowboat
    mkdir -p /root/.rowboat/config

    # models.json : config des providers + defaults
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

    # mcp.json minimal
    cat > /root/.rowboat/config/mcp.json <<EOF
{
  "mcpServers": {}
}
EOF

    echo "✅ Rowboat configured successfully!"
fi

echo ""
echo "🚀 Starting CLI stream server on port ${PORT:-3000}..."
echo ""

exec node /app/server.mjs
