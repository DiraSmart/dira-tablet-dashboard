# Build stage
ARG BUILD_FROM
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# Production stage
FROM $BUILD_FROM

# Install Node.js
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .

# Copy run script
COPY addon/run.sh /run.sh
RUN chmod a+x /run.sh

ENV PORT=3000 \
    NODE_ENV=production \
    ADDON=true \
    DATA_DIR=/data

CMD [ "/run.sh" ]
