ARG BUILD_FROM

# Build stage - clone repo and build
FROM node:22-alpine AS builder

# HA passes BUILD_VERSION per version - using it busts Docker cache
# so git clone always fetches the latest code
ARG BUILD_VERSION=dev

WORKDIR /app

# Cache buster: fetch latest commit ref (changes on every push)
ADD https://api.github.com/repos/DiraSmart/dira-tablet-dashboard/git/refs/heads/main /tmp/version.json

RUN apk add --no-cache git && \
    git clone --depth 1 https://github.com/DiraSmart/dira-tablet-dashboard.git . && \
    echo "Build version: ${BUILD_VERSION}"

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
