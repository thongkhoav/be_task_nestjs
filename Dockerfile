FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.env ./
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 3333

CMD [ "node","dist/main.js" ]