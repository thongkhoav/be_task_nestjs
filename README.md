# Task Rooms API (NestJS)

Backend for a real-time team task board: users create rooms, invite members with a code, assign
tasks, chat, and get push notifications when something changes.

Frontend: [fe_task_nextjs](https://github.com/thongkhoav/fe_task_nextjs) (Next.js 14).

## Features

- **Auth**: email/password with JWT access + refresh tokens in HTTP-only cookies, Google OAuth
  endpoint, forgot/reset password by email.
- **Rooms and tasks**: owners invite members by invite code, create and assign tasks; members
  update only the tasks assigned to them.
- **Real time**: Socket.io pushes task status changes and room chat to everyone in the room.
- **Notifications**: Firebase Cloud Messaging when a member joins, a task is assigned, or a task is
  marked done.
- **Background jobs**: BullMQ + Redis queue sends deadline reminders.
- **API hygiene**: Swagger docs at `/api`, global validation pipe, rate limiting.

## Stack

NestJS 10 · TypeScript · PostgreSQL + TypeORM (migrations) · Redis · BullMQ · Socket.io ·
Firebase Admin · Nodemailer · Docker

## Architecture notes

- Task updates emit domain events (`@nestjs/event-emitter`); the socket gateway listens to them,
  which removes the circular dependency between `TaskService` and the gateway.
- Chat messages stay in the room after a member leaves.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`):

1. Build the Docker image and push it to Amazon ECR.
2. On a self-hosted runner on EC2: pull the image, run TypeORM migrations, restart the container.

## Run locally

```bash
cp .env.example .env          # fill in DB, JWT, Google, Firebase, Redis and mail settings
docker compose up -d db redis
npm install
npm run start:dev             # http://localhost:3333, Swagger at /api
```

Migrations:

```bash
npm run typeorm migration:generate ./src/migrations/<name>
npm run build
npm run typeorm migration:run
```

Or run everything in Docker: `docker compose up --build`.
