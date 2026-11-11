FROM node:20-alpine AS base

# Install OpenSSL and libc dependencies for Prisma on Alpine
RUN apk add --no-cache libc6-compat openssl

# Dependencies step
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder step
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Argumentos e variáveis de ambiente para o build do Next.js
# Garante que rewrites externos que dependem de CENTRAL_API_URL sejam resolvidos corretamente durante a compilação
ARG CENTRAL_API_URL=http://homolog-sistema-contrato:3001/api
ARG NEXT_PUBLIC_CENTRAL_API_URL=http://127.0.0.1:3101/api
ENV CENTRAL_API_URL=${CENTRAL_API_URL}
ENV NEXT_PUBLIC_CENTRAL_API_URL=${NEXT_PUBLIC_CENTRAL_API_URL}

# Generate Prisma Client and build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build

# Runner step (Final production image)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy needed artifacts from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Create volume mount point for database persistence
RUN mkdir -p /app/data

EXPOSE 3000

# Push database schema & seed on container launch, then start Next.js
CMD ["sh", "-c", "npx prisma db push && npm start"]
