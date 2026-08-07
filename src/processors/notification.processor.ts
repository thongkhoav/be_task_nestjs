import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import admin from 'firebase-admin';
import { MailService } from 'src/mail/mail.service';

@Processor('task-deadline')
@Injectable()
export class NotificationProcessor extends WorkerHost {
  // This processor will handle the job of sending notifications
  // when a task deadline is approaching.

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job) {
    const { deviceToken, taskTitle, taskRoom, userEmail } = job.data;
    await Promise.all([
      admin.messaging().send({
        token: deviceToken,
        notification: {
          title: `Task Deadline Approaching: ${taskTitle}`,
          body: `Your task "${taskTitle}" in room "${taskRoom}" is approaching its deadline.`,
        },
      }),
      this.mailService.sendTaskDeadlineReminder({
        to: userEmail,
        subject: `Task Deadline Approaching: ${taskTitle}`,
        taskTitle,
        taskRoom,
      }),
    ]);
  }
}
