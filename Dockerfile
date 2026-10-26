# Multi-stage Dockerfile for BookLeaf Publishing Portal

# Stage 1: Build Frontend React App
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5002

# Install backend dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy backend source
COPY server/ ./server/
COPY bookleaf_sample_data.json ./

# Copy built frontend from Stage 1 into server's client dist
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 5002

CMD ["node", "server/index.js"]
