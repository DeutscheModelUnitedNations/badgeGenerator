# Stage 1: Build
FROM oven/bun:debian AS builder
WORKDIR /app

COPY package.json .
COPY bun.lockb .
RUN bun install
COPY . .
RUN bun run build

# Stage 2: Production
FROM oven/bun:slim
WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ARG VERSION
ENV PUBLIC_VERSION=$VERSION
ARG SHA
ENV PUBLIC_SHA=$SHA
EXPOSE 3000
CMD ["bun", "./build/index.js"]