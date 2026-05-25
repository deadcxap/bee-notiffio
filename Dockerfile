FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DATA_FILE=/app/data/bot-data.json

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=40s CMD node src/healthcheck.js

CMD ["npm", "start"]
