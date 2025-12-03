# Guide de déploiement - Rowboat HTTP Wrapper

## 📦 Résumé du projet

Ce projet expose **rowboatx** (un agent AI conversationnel) via une API HTTP REST pour permettre à **Flowise** et autres outils d'agentflow de communiquer avec Rowboat via une interface web.

### Architecture

```
Flowise/Client HTTP → API REST (Express) → rowboatx (AI Agent) → OpenAI GPT-4
```

## ✅ Tests effectués

- ✅ Build Docker réussi
- ✅ Conteneur démarre correctement
- ✅ Endpoint `/health` fonctionne
- ✅ Endpoint `/chat` retourne des réponses de Rowboat
- ✅ Configuration OpenAI fonctionnelle
- ✅ Timeout et gestion d'erreurs OK

### Exemples de requêtes testées

```bash
# Health check
curl http://localhost:3000/health
→ {"status":"ok","service":"rowboat-http-wrapper","version":"1.0.0"}

# Chat simple
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What can you do?"}'
→ {"response":"Good day! How can I assist you with your workflows today?","timestamp":"..."}

# Chat complexe
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Can you help me create a workflow?"}'
→ {"response":"Sure, I'm here to assist you with managing your workflows...","timestamp":"..."}
```

## 🚀 Déploiement sur Coolify

### Étape 1 : Préparer le repository GitHub

1. Créer un nouveau repository GitHub (ou utiliser l'existant)
2. Pousser tous les fichiers de ce dossier :
   - `Dockerfile`
   - `package.json`
   - `server.js`
   - `entrypoint.sh`
   - `README.md`
   - `.gitignore`
   - `.env.example`

```bash
cd /root/rowboat-deployment
git init
git add .
git commit -m "Initial commit - Rowboat HTTP Wrapper"
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
git push -u origin main
```

### Étape 2 : Configurer Coolify

1. Se connecter à votre instance Coolify
2. Créer une nouvelle application
3. Sélectionner **"Docker"** comme type de build
4. Configurer :
   - **Repository** : URL de votre repository GitHub
   - **Branch** : `main`
   - **Build Pack** : Dockerfile
   - **Dockerfile Path** : `./Dockerfile` (racine du repo)

### Étape 3 : Variables d'environnement

Dans Coolify, ajouter ces variables d'environnement :

| Variable | Valeur | Obligatoire |
|----------|--------|-------------|
| `OPENAI_API_KEY` | Votre clé API OpenAI (sk-proj-...) | ✅ OUI |
| `PORT` | 3000 | ❌ Non (défaut: 3000) |
| `OPENAI_MODEL` | gpt-4 | ❌ Non (défaut: gpt-4) |
| `OPENAI_BASE_URL` | https://api.openai.com/v1 | ❌ Non |

**Important** : La clé `OPENAI_API_KEY` DOIT être configurée pour que Rowboat fonctionne.

### Étape 4 : Configuration du domaine

1. Dans Coolify, configurer le domaine/sous-domaine
2. Activer HTTPS (Let's Encrypt)
3. Port exposé : **3000**

### Étape 5 : Déployer

1. Cliquer sur **"Deploy"**
2. Attendre la fin du build (2-3 minutes)
3. Vérifier les logs

### Étape 6 : Vérification

```bash
# Remplacer par votre domaine
DOMAIN="https://k84s4ogocgk8cow84wkcwcgo.jarvis.hosting.infra.ori3com.cloud"

# Test health
curl $DOMAIN/health

# Test chat
curl -X POST $DOMAIN/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!"}'
```

## 🔌 Intégration avec Flowise

### Méthode 1 : HTTP Request Node

1. Dans votre flow Flowise, ajouter un node **"HTTP Request"**
2. Configuration :
   - **Method** : POST
   - **URL** : `https://votre-domaine.com/chat`
   - **Headers** :
     ```json
     {
       "Content-Type": "application/json"
     }
     ```
   - **Body** :
     ```json
     {
       "message": "{{input}}"
     }
     ```

3. Ajouter un **"JSON Parser"** pour extraire le champ `response`
4. Connecter à votre agent flow

### Méthode 2 : Custom JavaScript Tool

```javascript
async function askRowboat(question) {
  const response = await fetch('https://votre-domaine.com/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: question
    })
  });

  const data = await response.json();
  return data.response;
}

// Utilisation
const answer = await askRowboat("Create a workflow for data processing");
```

## 🎯 Différence avec le déploiement SuperGateway précédent

### Avant (avec SuperGateway)

```
Flowise → SuperGateway (SSE/MCP protocol) → rowboatx
                ❌ Incompatible : rowboatx n'est pas un serveur MCP
```

**Problème** : rowboatx est un chatbot conversationnel, pas un serveur MCP JSON-RPC. SuperGateway attend des réponses MCP conformes au protocole.

### Maintenant (HTTP simple)

```
Flowise → API REST Express → rowboatx (via stdin/stdout)
                ✅ Compatible : communication en texte
```

**Solution** : Un wrapper HTTP simple qui :
- Accepte des messages en JSON via POST
- Lance rowboatx pour chaque requête
- Capture la réponse en texte
- Retourne un JSON propre

## 📊 Performance

- **Temps de réponse** : 3-5 secondes (dépend d'OpenAI)
- **Concurrence** : Une instance rowboat par requête (stateless)
- **Timeout** : 60 secondes par requête
- **Scalabilité** : Horizontal (ajouter plus d'instances si nécessaire)

## 🐛 Troubleshooting

### Le serveur ne démarre pas

**Vérifier les logs Coolify :**
```bash
# Sur le VPS
docker logs <container-name>
```

**Problèmes courants :**
- `OPENAI_API_KEY` non configurée → Ajouter dans Coolify
- Port déjà utilisé → Changer le PORT dans les variables

### Rowboat ne répond pas / Timeout

**Causes possibles :**
1. Clé API OpenAI invalide/expirée
2. Quota OpenAI dépassé
3. Problème réseau vers OpenAI

**Solution :**
- Vérifier la clé API
- Vérifier les quotas sur platform.openai.com
- Regarder les logs du conteneur

### Réponses vides ou erreurs d'extraction

Le code extrait automatiquement la réponse entre les marqueurs `Response` et `Finish` dans le output de rowboat.

Si ça échoue, vérifier les logs :
```bash
docker logs <container> | grep "Failed to extract"
```

## 🔒 Sécurité

### Recommandations

1. **API Key** : Ne jamais commiter la clé OpenAI dans Git
2. **HTTPS** : Toujours utiliser HTTPS (activé par Coolify)
3. **Rate Limiting** : Ajouter un rate limiter si usage public
4. **CORS** : Actuellement ouvert (`*`), restreindre si nécessaire

### Ajouter un rate limiter (optionnel)

```bash
# Dans package.json
"dependencies": {
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "express-rate-limit": "^6.10.0"
}
```

```javascript
// Dans server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // max 100 requêtes par IP
});

app.use('/chat', limiter);
```

## 📝 Logs et monitoring

### Voir les logs en temps réel

```bash
docker logs -f <container-name>
```

### Logs importants à surveiller

```
✅ OPENAI_API_KEY is set          → Configuration OK
🚀 Rowboat HTTP Server             → Serveur démarré
[Chat] Received message: ...       → Requête reçue
[Rowboat] Response extracted ...   → Réponse capturée
[Rowboat] Timeout ...              → ⚠️ Problème de performance
```

## 🔄 Mise à jour

Pour mettre à jour le code :

1. Modifier les fichiers localement
2. Push vers GitHub
3. Dans Coolify, cliquer sur "Redeploy"
4. Coolify rebuild et redéploie automatiquement

## 📞 Support

En cas de problème :

1. Vérifier les logs Docker
2. Tester les endpoints avec curl
3. Vérifier la configuration Coolify
4. Vérifier la clé OpenAI

## ✨ Améliorations futures possibles

- [ ] Ajouter une gestion de sessions persistantes
- [ ] Implémenter un système de cache pour les réponses fréquentes
- [ ] Ajouter des métriques (Prometheus/Grafana)
- [ ] Supporter d'autres modèles AI
- [ ] Ajouter une authentification API
- [ ] WebSocket pour streaming des réponses
