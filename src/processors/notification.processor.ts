import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit, Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import admin from 'firebase-admin';
import { MailService } from 'src/mail/mail.service';

@Processor('task-deadline')
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  // This processor will handle the job of sending notifications
  // when a task deadline is approaching.

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job) {
    const { taskId, userId, deviceToken, taskTitle, taskRoom, userEmail } =
      job.data;
    // Send Firebase push notification
    try {
      console.log(`Processing job ${job.id} of type ${job.name}`);

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
    } catch (error) {
      this.logger.error(
        `❌ Failed to send FCM to user ${userId}: ${error.message}`,
      );
    }

    // Send Email reminder
    try {
      await this.mailService.sendTaskDeadlineReminder({
        to: userEmail,
        subject: `Task Deadline Approaching: ${taskTitle}`,
        taskTitle,
        taskRoom,
      });
      this.logger.log(`✅ Sent email reminder to ${userEmail}`);
    } catch (err) {
      this.logger.error(`❌ Failed to send email: ${err.message}`);
    }
  }
}
