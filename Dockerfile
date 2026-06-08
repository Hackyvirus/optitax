FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 py3-pip

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Build
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/.next        ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.ts    ./server.ts
COPY --from=builder /app/tsconfig*.json ./
COPY --from=builder /app/python       ./python
COPY --from=builder /app/src          ./src

USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
