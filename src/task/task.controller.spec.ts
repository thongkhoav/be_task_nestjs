import { TaskController } from './task.controller';

describe('TaskController resource authorization', () => {
  const taskService = {
    createTaskValidator: jest.fn(),
    createTask: jest.fn(),
    updateTaskValidator: jest.fn(),
    updateTask: jest.fn(),
    getTasksOfRoom: jest.fn(),
    assignTaskValidator: jest.fn(),
    assignTask: jest.fn(),
  };
  const requester = { user: { id: 'requester-1' } };

  let controller: TaskController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TaskController(taskService as any);
  });

  it('passes the authenticated requester into task creation authorization', async () => {
    const dto = {
      title: 'Task',
      description: 'Description',
      dueDate: new Date(Date.now() + 60_000),
      roomId: 'room-1',
    } as any;

    await (controller.create as any)(dto, requester);

    expect(taskService.createTaskValidator).toHaveBeenCalledWith(
      'requester-1',
      dto,
    );
  });

  it('passes the authenticated requester into task update authorization', async () => {
    const dto = { title: 'Updated' } as any;

    await (controller.updateTaskInfo as any)('task-1', dto, requester);

    expect(taskService.updateTaskValidator).toHaveBeenCalledWith(
      'requester-1',
      'task-1',
      dto,
    );
  });

  it('passes the authenticated requester into room task listing authorization', async () => {
    await (controller.getRoomUserTasks as any)(
      'room-1',
      'filter-user',
      undefined,
      undefined,
      requester,
    );

    expect(taskService.getTasksOfRoom).toHaveBeenCalledWith(
      'requester-1',
      'room-1',
      'filter-user',
      undefined,
      undefined,
    );
  });

  it('assigns the validated target user instead of the requester', async () => {
    const dto = { taskId: 'task-1', userId: 'assignee-2' };

    await controller.assignTask(dto, requester);

    expect(taskService.assignTask).toHaveBeenCalledWith('task-1', 'assignee-2');
  });
});
