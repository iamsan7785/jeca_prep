FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package-lock.json ./frontend/
COPY frontend ./frontend
COPY shared ./shared

RUN npm ci --omit=dev
RUN npm run build --workspace frontend

FROM nginx:stable-alpine AS runner
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
