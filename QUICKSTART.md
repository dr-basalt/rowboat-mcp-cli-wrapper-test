# 🚀 Quick Start - Rowboat HTTP Wrapper

## En 5 minutes chrono

### 1️⃣ Pousser sur GitHub

```bash
cd /root/rowboat-deployment
git init
git add .
git commit -m "Initial commit - Rowboat HTTP Wrapper"
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
git branch -M main
git push -u origin main
```

### 2️⃣ Configurer Coolify

1. Ouvrir Coolify
2. **New Application** → **Docker**
3. **Repository** : URL GitHub
4. **Branch** : main
5. **Dockerfile Path** : ./Dockerfile

### 3️⃣ Ajouter variables d'environnement

Dans Coolify, section Environment Variables :

```
OPENAI_API_KEY=sk-proj-VOTRE-CLE-ICI
```

### 4️⃣ Déployer

Cliquer sur **Deploy** ➡️ Attendre 2-3 minutes

### 5️⃣ Tester

```bash
# Remplacer VOTRE-DOMAINE par votre domaine Coolify
curl https://VOTRE-DOMAINE.com/health

curl -X POST https://VOTRE-DOMAINE.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!"}'
```

## ✅ C'est tout !

Votre API Rowboat est maintenant accessible via HTTPS.

## 📱 Utiliser avec Flowise

Dans votre flow Flowise :

1. Ajouter node **HTTP Request**
2. URL : `https://VOTRE-DOMAINE.com/chat`
3. Method : POST
4. Body : `{"message": "{{input}}"}`
5. Ajouter **JSON Parser** avec path `response`

---

Pour plus de détails, voir :
- `README.md` - Documentation complète
- `DEPLOY.md` - Guide de déploiement détaillé
