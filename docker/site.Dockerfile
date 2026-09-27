# Site-ul static LOX Mobila: se construieste cu Astro si se serveste cu nginx.
# Contextul de build e radacina repo-ului.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Adresele intra in HTML la build: canonical, sitemap si originea din care adminul
# are voie sa previzualizeze tema. SOURCE_COMMIT vine de la Coolify si ajunge in version.json.
ARG PUBLIC_SITE_URL=https://loxmobila.ro
ARG PUBLIC_ADMIN_ORIGIN=https://admin.loxmobila.ro
ARG SOURCE_COMMIT=""
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL PUBLIC_ADMIN_ORIGIN=$PUBLIC_ADMIN_ORIGIN SOURCE_COMMIT=$SOURCE_COMMIT
RUN npm run build

FROM nginx:1.29-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1/health || exit 1
