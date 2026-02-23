ARG BUILD_FROM

# Build stage - clone repo and build
FROM node:22-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app
RUN git clone --depth 1 https://github.com/DiraSmart/dira-tablet-dashboard.git .

RUN npm ci
RUN npm run build && npm prune --omit=dev

# Production stage
FROM $BUILD_FROM

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .

# Copy run script from build context (dira_dashboard/ folder)
COPY run.sh /run.sh
RUN chmod a+x /run.sh

ENV PORT=3000 \
    NODE_ENV=production \
    ADDON=true \
    DATA_DIR=/data

CMD [ "/run.sh" ]
