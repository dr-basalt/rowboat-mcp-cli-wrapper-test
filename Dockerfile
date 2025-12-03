FROM node:20-slim

# Installer rowboatx et les dépendances
RUN npm install -g @rowboatlabs/rowboatx

# Créer le répertoire de travail
WORKDIR /app

# Copier package.json et installer les dépendances
COPY package.json ./
RUN npm install

# Copier les fichiers de l'application
COPY server.js ./
COPY entrypoint.sh ./

RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
