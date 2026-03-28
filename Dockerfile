# Build Vite app; serve static assets with nginx (SPA fallback for react-router).
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines these at build time — pass via docker compose `build.args` or `docker build --build-arg ...`
ARG VITE_API_BASE_URL=
ARG VITE_USE_LIVE_API=true
ARG VITE_USE_MOCK_API=
ARG VITE_ASSISTANT_MODEL_AUTODOWNLOAD=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_USE_LIVE_API=$VITE_USE_LIVE_API \
    VITE_USE_MOCK_API=$VITE_USE_MOCK_API \
    VITE_ASSISTANT_MODEL_AUTODOWNLOAD=$VITE_ASSISTANT_MODEL_AUTODOWNLOAD

RUN npm run build

FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
