import { UnauthorizedException } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskStatus } from './entities/task.entity';

describe('TaskService authorization and null safety', () => {
  const taskRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    save: jest.fn(),
  };
  const userRepository = {
    findOne: jest.fn(),
  };
  const roomRepository = {
    findOne: jest.fn(),
  };
  const userRoomRepository = {
    findOne: jest.fn(),
  };
  const loginSessionRepository = {
    find: jest.fn(),
  };
  const notificationService = {
    sendNotificationAndSave: jest.fn(),
  };
  const eventEmitter = {
    emit: jest.fn(),
  };
  const notificationQueue = {
    scheduleReminder: jest.fn(),
    removeScheduleJobs: jest.fn(),
  };
  const config = {
    get: jest.fn(),
  };

  let service: TaskService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TaskService(
      taskRepository as any,
      userRepository as any,
      roomRepository as any,
      userRoomRepository as any,
      loginSessionRepository as any,
      notificationService as any,
      eventEmitter as any,
      notificationQueue as any,
      config as any,
    );
  });

  it('loads the task room and returns a controlled error when the requester is not its owner', async () => {
    taskRepository.findOne.mockResolvedValue({
      id: 'task-1',
      room: { id: 'room-1' },
    });
    userRoomRepository.findOne.mockResolvedValue(null);

    await expect(
      service.assignTaskValidator('requester-1', 'task-1', 'assignee-2'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(taskRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      relations: ['room'],
    });
  });

  it('rejects a non-member status update without dereferencing an unassigned task user', async () => {
    taskRepository.findOne.mockResolvedValue({
      id: 'task-1',
      room: { id: 'room-1' },
      user: null,
    });
    userRoomRepository.findOne.mockResolvedValue(null);

    await expect(
      service.updateStatusTaskValidator('requester-1', {
        taskId: 'task-1',
        status: TaskStatus.DONE,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects room task listing for a requester who is not a member', async () => {
    userRoomRepository.findOne.mockResolvedValue(null);

    await expect(
      (service.getTasksOfRoom as any)(
        'requester-1',
        'room-1',
        undefined,
        undefined,
        undefined,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(taskRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('returns a controlled error when an assigned task has no room relation', async () => {
    taskRepository.findOne.mockResolvedValue({ id: 'task-1', room: null });

    await expect(
      service.assignTaskValidator('requester-1', 'task-1', 'assignee-2'),
    ).rejects.toThrow('Task room not found');
  });

  it('does not persist a status update when the room owner relation is missing', async () => {
    taskRepository.findOne.mockResolvedValue({
      id: 'task-1',
      status: TaskStatus.TODO,
      room: { id: 'room-1' },
      user: { id: 'requester-1' },
    });
    userRoomRepository.findOne.mockResolvedValue(null);

    await expect(
      service.updateStatusTask('requester-1', {
        taskId: 'task-1',
        status: TaskStatus.DONE,
      }),
    ).rejects.toThrow('Room owner not found');
    expect(taskRepository.save).not.toHaveBeenCalled();
  });
});
