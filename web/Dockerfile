# بیلد از ریشه ریپو تا فونت‌های fonts/ در تصویر باشند:
#   docker build -f web/Dockerfile .
# Stage 1: build
FROM node:20-alpine AS build

WORKDIR /app

# بیلد از پوشه web به‌عنوان context (بدون فونت در image):
#   docker build -f web/Dockerfile web
# در آن حالت خطوط COPY زیر را با نسخه بدون پیشوند web/ و بدون COPY fonts جایگزین کن.
COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ ./
COPY fonts/ ./fonts/
RUN npm run build

# Stage 2: runtime
FROM node:20-alpine AS runtime

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

COPY web/package.json web/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/fonts ./fonts
COPY --from=build /app/next.config.js ./

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
