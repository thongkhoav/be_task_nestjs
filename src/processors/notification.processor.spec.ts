import admin from 'firebase-admin';
import { NotificationProcessor } from './notification.processor';

jest.mock('firebase-admin', () => ({
  __esModule: true,
  default: {
    messaging: jest.fn(),
  },
}));

describe('NotificationProcessor retry behavior', () => {
  const mailService = {
    sendTaskDeadlineReminder: jest.fn(),
  };
  const sendPush = jest.fn();

  let processor: NotificationProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    (admin.messaging as unknown as jest.Mock).mockReturnValue({
      send: sendPush,
    });
    processor = new NotificationProcessor(mailService as any);
  });

  it('rejects the job when push delivery fails so BullMQ can retry it', async () => {
    sendPush.mockRejectedValue(new Error('push unavailable'));
    mailService.sendTaskDeadlineReminder.mockResolvedValue(undefined);

    await expect(processor.process(job())).rejects.toThrow('push unavailable');
    expect(mailService.sendTaskDeadlineReminder).toHaveBeenCalled();
  });

  it('rejects the job when email delivery fails so BullMQ can retry it', async () => {
    sendPush.mockResolvedValue('message-id');
    mailService.sendTaskDeadlineReminder.mockRejectedValue(
      new Error('mail unavailable'),
    );

    await expect(processor.process(job())).rejects.toThrow('mail unavailable');
  });

  function job(): any {
    return {
      id: 'job-1',
      name: 'task-reminder',
      data: {
        taskId: 'task-1',
        userId: 'user-1',
        deviceToken: 'sensitive-device-token',
        taskTitle: 'Due task',
        taskRoom: 'Room',
        userEmail: 'user@example.com',
      },
    };
  }
});
