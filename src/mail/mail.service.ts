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
}
