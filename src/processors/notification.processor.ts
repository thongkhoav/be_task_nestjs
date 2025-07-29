import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import admin from 'firebase-admin';

@Processor('task-deadline')
export class NotificationProcessor extends WorkerHost {
  // This processor will handle the job of sending notifications
  // when a task deadline is approaching.

  async process(job: Job) {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    const { taskId, userId, deviceToken, taskTitle, taskRoom } = job.data;
    console.log(
      `Processing notification for task ${taskId} assigned to user ${userId} with title "${taskTitle}"`,
    );
    await admin.messaging().send({
      token: deviceToken,
      notification: {
        title: `Task Deadline Approaching: ${taskTitle}`,
        body: `Your task "${taskTitle}" in room "${taskRoom}" is approaching its deadline.`,
      },
    });
  }
}
