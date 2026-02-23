ARG BUILD_FROM
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files from repo root
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY src/ ./src/
COPY server/ ./server/
COPY public/ ./public/
COPY index.html vite.config.ts tailwind.config.ts postcss.config.js tsconfig.json tsconfig.server.json vite-env.d.ts ./

RUN npm run build && npm prune --omit=dev

# Production stage
FROM $BUILD_FROM

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .

COPY dira_dashboard/run.sh /run.sh
RUN chmod a+x /run.sh

ENV PORT=3000 \
    NODE_ENV=production \
    ADDON=true \
    DATA_DIR=/data

CMD [ "/run.sh" ]
