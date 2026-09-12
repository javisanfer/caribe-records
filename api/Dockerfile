FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=nodeapp:nodeapp package.json ./
COPY --chown=nodeapp:nodeapp src ./src
USER nodeapp
EXPOSE 3000
CMD ["node", "src/app.js"]
