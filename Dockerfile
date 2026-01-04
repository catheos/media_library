# Frontend build
FROM node:20-alpine AS frontend-builder

ARG VITE_API_HOST=http://localhost:3000
ENV VITE_API_HOST=${VITE_API_HOST}

ARG VITE_THETVDB_API_KEY
ENV VITE_THETVDB_API_KEY=${VITE_THETVDB_API_KEY}

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Backend build
FROM node:20-alpine AS backend-builder

WORKDIR /backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Production
FROM node:20-alpine

RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=backend-builder /backend/dist ./dist
COPY --from=frontend-builder /frontend/dist ./frontend/dist
COPY backend/knexfile.js ./
COPY backend/migrations ./migrations
COPY backend/seeds ./seeds

RUN mkdir -p uploads && chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npm run migrate && npm run seed && npm start"]