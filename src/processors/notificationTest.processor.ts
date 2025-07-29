import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import admin from 'firebase-admin';

@Processor('task-test')
export class NotificationTestProcessor extends WorkerHost {
  // This processor will handle the job of sending notifications
  // when a task deadline is approaching.

  async process(job: Job) {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    const { taskTitle } = job.data;
    console.log(`Processing notification for task "${taskTitle}"`);
  }
}
