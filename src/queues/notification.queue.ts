import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationQueue {
  // private queue: Queue;

  constructor(@InjectQueue('task-deadline') private queue: Queue) {
    // this.queue = new Queue('task-deadline', {
    //   connection: {
    //     host: this.config.get('REDIS_HOST'),
    //     port: this.config.get('REDIS_PORT'),
    //   },
    // });
  }

  async scheduleReminder(
    taskId: string,
    userId: string,
    deviceToken: string,
    taskTitle: string,
    taskRoom: string,
    userEmail: string,
    delayMs: number,
  ) {
    const jobId = `task-reminder--${taskId}--${deviceToken}`;
    // Check if a job with the same ID already exists
    const existingJob = await this.queue.getJob(jobId);
    if (existingJob) {
      console.log(`Job with ID ${jobId} already exists. Skipping scheduling.`);
      await existingJob.remove();
      return;
    }
    console.log(
      `Scheduling reminder with ID: ${jobId} for task: ${taskTitle} in room: ${taskRoom}`,
    );

    await this.queue.add(
      'send-reminder',
      {
        taskId,
        userId,
        deviceToken,
        taskTitle,
        taskRoom,
        userEmail,
      },
      {
        delay: delayMs, // Delay in milliseconds
        attempts: 3, // Number of retry attempts
        jobId,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async removeScheduleJobs(taskId: string) {
    const jobs = await this.queue.getJobs(['delayed', 'waiting', 'active']);
    const jobsToRemove = jobs.filter((job) =>
      job.id.startsWith(`task-reminder--${taskId}--`),
    );
    if (jobsToRemove.length > 0) {
      console.log(
        `Removing ${jobsToRemove.length} scheduled jobs for task: ${taskId}`,
      );
      for (const job of jobsToRemove) {
        await job.remove();
      }
    } else {
      console.log(`No scheduled jobs found for task: ${taskId}`);
    }
  }

  // async scheduleTestReminder(taskTitle: string) {
  //   const jobId = `test-reminder--${new Date().getTime().toString()}`;
  //   console.log(
  //     `Scheduling test reminder with ID: ${jobId}  for task: ${taskTitle}`,
  //   );
  //   // delay 30s
  //   const delayMs = 20 * 1000; // 30 seconds in milliseconds

  //   await this.queueTest.add(
  //     'send-test-reminder',
  //     {
  //       taskTitle,
  //       message: `This is a test reminder for task: ${taskTitle}`,
  //     },
  //     {
  //       delay: delayMs, // Delay in milliseconds
  //       attempts: 3, // Number of retry attempts
  //       jobId,
  //       removeOnComplete: true,
  //       removeOnFail: true,
  //     },
  //   );
  // }
}
