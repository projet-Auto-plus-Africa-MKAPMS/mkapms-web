FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production

# Outils de build (vite, esbuild, tailwind, typescript) sont en "dependencies",
# donc --omit=dev suffit et évite les conflits de version (tsx/esbuild dev).
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["node", "dist/server.js"]
