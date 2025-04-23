# Backend NestJS

# FE source code: https://github.com/thongkhoav/fe_task_nextjs

- To run:

  - Complete .env based on the sample file .env.example
  - start : nest start
  - start:dev : nest start --watch

- Notifications:

  - User join group by invite code -> Noti to room owner
  - Room owner assign task(change user of task) -> Noti to assigned member
  - Member mark DONE task -> Noti to owner

- Architect:
  - Github actions to build image and push to ECR
  - Run the image can use ECS, App Runner or EC2
  - Use Github Actions to SSH to EC2, then pull image from ECR and run it
