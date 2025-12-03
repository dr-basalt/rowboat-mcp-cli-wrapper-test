FROM node:20-slim

WORKDIR /app

# Installer rowboatx globalement
RUN npm install -g @rowboatlabs/rowboatx@latest

# Installer express pour server.mjs
RUN npm install express

# Copier les fichiers applicatifs
COPY server.mjs /app/server.mjs
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
