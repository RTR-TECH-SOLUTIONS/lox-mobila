# Adminul LOX. Contextul de build e radacina repo-ului: adminul foloseste schema si tema din ../src.
FROM node:24-alpine AS build
WORKDIR /repo/admin
COPY admin/package.json admin/package-lock.json ./
RUN npm ci
COPY admin/ ./
COPY src/content/schema.ts /repo/src/content/schema.ts
COPY src/lib/theme.ts /repo/src/lib/theme.ts
# schema.ts cauta zod langa el; il gaseste prin node_modules-ul adminului.
RUN ln -s /repo/admin/node_modules /repo/node_modules && npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
COPY admin/package.json admin/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /repo/admin/dist ./dist
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:4321/health || exit 1
CMD ["node", "dist/server/entry.mjs"]
