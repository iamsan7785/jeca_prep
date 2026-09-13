FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies and build backend inside the image
COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/
COPY backend ./backend
COPY shared ./shared
COPY prisma ./prisma

RUN npm ci --omit=dev
RUN npm run build --workspace backend
RUN npx prisma generate --schema ./prisma/schema.prisma

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/server.js"]
