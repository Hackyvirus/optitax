FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 py3-pip

# Install ALL dependencies (including dev for build)
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
# Compile server.ts to JS
RUN npx tsc --project tsconfig.server.json --outDir dist_server || \
    npx ts-node --project tsconfig.server.json --transpileOnly -e "console.log('ok')" && \
    npx tsc -p tsconfig.server.json --outDir dist_server 2>/dev/null || true

# Production deps only
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Final image
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/.next        ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.ts    ./server.ts
COPY --from=builder /app/tsconfig*.json ./
COPY --from=builder /app/src          ./src
COPY --from=builder /app/python       ./python

USER nextjs
EXPOSE 3000

# Use ts-node with transpileOnly — skips type checking, starts fast
CMD ["node_modules/.bin/ts-node", "--project", "tsconfig.server.json", "--transpile-only", "server.ts"]