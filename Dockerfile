FROM node:20-slim

WORKDIR /app

# Rowboat
RUN npm install -g @rowboatlabs/rowboatx@latest

# Déps Node
RUN npm install express cors

COPY entrypoint.sh /app/entrypoint.sh
COPY server.mjs /app/server.mjs

RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
