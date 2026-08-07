import { NotificationQueue } from './notification.queue';

describe('NotificationQueue sensitive data handling', () => {
  it('does not expose the FCM token in job IDs or logs', async () => {
    const queue = {
      getJob: jest.fn().mockResolvedValue(null),
      add: jest.fn().mockResolvedValue(undefined),
    };
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    const notificationQueue = new NotificationQueue(queue as any);
    const deviceToken = 'sensitive-device-token';

    await notificationQueue.scheduleReminder(
      'task-1',
      'user-1',
      deviceToken,
      'Task title',
      'Room name',
      'user@example.com',
      60_000,
    );

    const jobOptions = queue.add.mock.calls[0][2];
    expect(jobOptions.jobId).not.toContain(deviceToken);
    expect(JSON.stringify(consoleLog.mock.calls)).not.toContain(deviceToken);

    consoleLog.mockRestore();
  });
});
