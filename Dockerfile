# ── Stage 1 : Build Angular ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances en premier (cache Docker layer)
COPY package*.json ./

# --legacy-peer-deps : @angular/google-maps (v19) n'est pas aligné sur Angular 18
RUN npm ci --legacy-peer-deps

# Copier le reste du projet
COPY . .

# Build production (SPA statique, sans SSR ni prerender)
RUN npm run build -- --configuration=production

# ── Stage 2 : Servir avec Nginx ──────────────────────────────────────────────
FROM nginx:alpine

# Supprimer la page par défaut de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Angular 17+ génère les fichiers dans dist/<outputPath>/browser
COPY --from=builder /app/dist/projet-cbre1/browser /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
