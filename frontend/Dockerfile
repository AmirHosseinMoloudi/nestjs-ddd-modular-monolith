FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN groupadd -r nuxt && useradd -r -g nuxt nuxt
USER nuxt

COPY --chown=nuxt:nuxt .output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
