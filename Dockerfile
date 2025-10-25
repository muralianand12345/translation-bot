# ---- Build Stage ----
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# ---- Runtime Stage ----
FROM node:24-alpine
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001 && \
    chown -R botuser:nodejs /app

USER botuser
CMD ["yarn", "start"]