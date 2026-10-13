# syntax=docker/dockerfile:1
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
ENV ASTRO_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.28-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY .docker/config/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1

# Target uji. Versi image HARUS sama dengan versi @playwright/test di package-lock.json
# (dipasang di sub-issue tes; saat ini `npm test` masih placeholder).
FROM mcr.microsoft.com/playwright:v1.64.0-noble AS test
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["npm", "test"]
