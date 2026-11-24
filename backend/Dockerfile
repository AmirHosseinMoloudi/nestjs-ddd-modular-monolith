FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN groupadd -r nestjs && useradd -r -g nestjs nestjs
RUN mkdir -p /app/data && chown -R nestjs:nestjs /app

COPY --chown=nestjs:nestjs package*.json ./
COPY --chown=nestjs:nestjs node_modules ./node_modules
COPY --chown=nestjs:nestjs dist ./dist

USER nestjs
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { if (r.statusCode !== 200) process.exit(1); })"

CMD ["node", "dist/main.js"]
