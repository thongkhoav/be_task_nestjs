FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN echo "Logging .env content in builder:" && cat .env
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.env ./
RUN echo "Logging .env content in builder:" && cat .env
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

RUN npm install --production

EXPOSE 3333

CMD [ "node","dist/main.js" ]