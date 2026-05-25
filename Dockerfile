# ── Build ──────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
RUN VITE_API_URL=${VITE_API_URL} npm run build

# ── Serve ──────────────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Template: nginx processa ${PORT} automaticamente no startup
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
