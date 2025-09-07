# Backend NestJS

# FE source code: https://github.com/thongkhoav/fe_task_nextjs

- Outside of API:

  - Socket.io: Chat & Task status update
  - Background job: Task reminder
  - Email: Forgot password
  - Firebase messaging for notification

- To run:

  - Complete .env based on the sample file .env.example
  - You have to run a Redis for background reminder.
  - start : nest start
  - start:dev : nest start --watch

- Run database migration:

  - npm run build
  - npm run typeorm migration:generate ./src/migrations/{name_of_migration}
  - npm run typeorm migration:run

- Notifications:

  - User join group by invite code -> Noti to room owner
  - Room owner assign task(change user of task) -> Noti to assigned member
  - Member mark DONE task -> Noti to owner

- Architect:

  - Github actions to build image and push to ECR
  - Run the image can use ECS, App Runner or EC2
  - Use Github Actions to SSH to EC2, then pull image from ECR and run it
  - Use event-emitter to break down TaskService and Socket circular dependency.

- Chat rules:

  - Messages remain in the channel even after the user leaves.

- Docker run:

  - If redis is running in docker, make redis container and backend container use the same network
  - docker network create mynetwork
  - docker run -dp 6379:6379 --name be-redis redis

- AWS linux 2023 github-runner:
  - sudo yum install -y libicu
