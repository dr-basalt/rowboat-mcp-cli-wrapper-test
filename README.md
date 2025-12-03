# Rowboat HTTP Wrapper

Serveur HTTP exposant rowboatx (agent AI conversationnel) via une API REST compatible avec Flowise et autres outils d'agentflow.

## 🎯 Objectif

Permettre à Flowise (ou tout autre client HTTP) de communiquer avec rowboatx via une interface web simple.

```
Flowise → HTTP API → Rowboat AI Agent
```

## 🚀 Déploiement rapide

### Via Coolify

1. Créer une nouvelle application dans Coolify
2. Sélectionner "Docker" comme type de build
3. Pointer vers ce repository GitHub
4. Ajouter les variables d'environnement :
   - `OPENAI_API_KEY` : Votre clé API OpenAI
   - `PORT` : 3000 (optionnel, par défaut)
5. Déployer !

### Variables d'environnement

| Variable | Description | Requis | Défaut |
|----------|-------------|--------|--------|
| `OPENAI_API_KEY` | Clé API OpenAI | ✅ Oui | - |
| `OPENAI_MODEL` | Modèle à utiliser | ❌ Non | gpt-4 |
| `OPENAI_BASE_URL` | URL de base OpenAI | ❌ Non | https://api.openai.com/v1 |
| `OPENAI_PROVIDER_NAME` | Nom du provider | ❌ Non | openai |
| `PORT` | Port du serveur | ❌ Non | 3000 |

## 📡 API Endpoints

### Health Check

```bash
GET /health
```

**Réponse :**
```json
{
  "status": "ok",
  "service": "rowboat-http-wrapper",
  "version": "1.0.0"
}
```

### Chat

```bash
POST /chat
Content-Type: application/json

{
  "message": "Hello! Can you help me create a workflow?"
}
```

**Réponse :**
```json
{
  "response": "Of course! I can help you create a workflow. What kind of workflow do you need?",
  "timestamp": "2025-12-03T21:00:00.000Z"
}
```

## 🔧 Utilisation avec Flowise

### Option 1 : HTTP Request Tool

1. Ajouter un node "HTTP Request" dans votre flow Flowise
2. Configurer :
   - **Method** : POST
   - **URL** : `https://votre-domaine.com/chat`
   - **Headers** : `Content-Type: application/json`
   - **Body** :
     ```json
     {
       "message": "{{input}}"
     }
     ```
3. Utiliser un node "JSON Parser" pour extraire le champ `response`

### Option 2 : Custom Tool

```javascript
// Dans un Custom Function Node de Flowise
async function callRowboat(input) {
  const response = await fetch('https://votre-domaine.com/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: input
    })
  });

  const data = await response.json();
  return data.response;
}

// Utiliser : callRowboat("votre message ici")
```

## 🧪 Test en local

### Avec Docker

```bash
# Build
docker build -t rowboat-http .

# Run
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your-key-here \
  rowboat-http
```

### Test avec curl

```bash
# Health check
curl http://localhost:3000/health

# Chat
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

## 🤖 Capacités de Rowboat

Rowboat peut vous aider avec :

- ✅ Création et édition de workflows
- ✅ Gestion d'agents AI
- ✅ Opérations sur fichiers
- ✅ Gestion de serveurs MCP
- ✅ Automatisation de tâches
- ✅ Et bien plus...

## 📝 Notes

- Chaque requête `/chat` crée une nouvelle instance de rowboat (stateless)
- Les conversations ne sont PAS persistées entre les requêtes
- Timeout de 30 secondes par requête
- CORS activé pour tous les domaines

## 🐛 Troubleshooting

### Le serveur ne démarre pas

Vérifiez que `OPENAI_API_KEY` est bien configurée :

```bash
docker logs <container-id>
```

### Rowboat ne répond pas

- Vérifiez la clé API OpenAI
- Vérifiez les quotas API
- Regardez les logs du conteneur

### Timeout sur les requêtes

- Augmenter le timeout dans `server.js` (ligne avec `setTimeout`)
- Utiliser un modèle plus rapide (ex: gpt-3.5-turbo)

## 📄 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! Créez une issue ou un PR.
