// mail.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(to: string, subject: string, templateOrText: string) {
    await this.mailerService.sendMail({
      to,
      subject,
      html: templateOrText,
    });
  }

  async sendTaskDeadlineReminder({
    to,
    subject,
    taskTitle,
    taskRoom,
  }: {
    to: string;
    subject: string;
    taskTitle: string;
    taskRoom: string;
  }) {
    await this.mailerService.sendMail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h3>📅 Task Deadline Reminder</h3>
          <p>Your task <strong>${taskTitle}</strong> in room <strong>${taskRoom}</strong> is approaching its deadline.</p>
          <p>Please make sure to complete it on time.</p>
        </div>
      `,
    });
  }
}
