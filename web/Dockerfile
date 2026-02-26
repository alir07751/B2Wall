# Build context = پوشه web (مثل دارکوب: docker build -f web/Dockerfile web)
# فونت‌ها از CDN لود می‌شوند؛ برای self-host فونت‌ها را در web/public/fonts بگذار و بیلد بگیر.
# Stage 1: build
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:20-alpine AS runtime

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
