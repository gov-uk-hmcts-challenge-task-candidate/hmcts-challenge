import { PrismaTaskService } from '../src/services/prisma-task-service';

// Mock the Prisma client
jest.mock('../src/db', () => ({
    prisma: {
        task: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            delete: jest.fn(),
        }
    }
}));

// Import the mocked prisma
import { prisma } from '../src/db';

describe('PrismaTaskService', () => {
    let service: PrismaTaskService;

    beforeEach(() => {
        service = new PrismaTaskService();
        jest.clearAllMocks();
    });

    it('getAllTasks returns mapped tasks', async () => {
        (prisma.task.findMany as jest.Mock).mockResolvedValue([
            { id: '1', title: 'Test', status: 'NOT_STARTED', dueDate: new Date(), createdAt: new Date(), version: 1 }
        ]);
        const tasks = await service.getAllTasks();
        expect(tasks).toHaveLength(1);
        expect(tasks[0].title).toBe('Test');
    });

    it('getTaskById returns a task if found', async () => {
        (prisma.task.findUnique as jest.Mock).mockResolvedValue({
            id: '1', title: 'Test', status: 'NOT_STARTED', dueDate: new Date(), createdAt: new Date(), version: 1
        });
        const task = await service.getTaskById('1');
        expect(task).toBeDefined();
        expect(task?.id).toBe('1');
    });

    it('getTaskById returns null if not found', async () => {
        (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);
        const task = await service.getTaskById('notfound');
        expect(task).toBeNull();
    });

    it('createTask creates and returns a task', async () => {
        const newTask = { id: '2', title: 'New', status: 'NOT_STARTED', dueDate: new Date(), createdAt: new Date(), version: 1 };
        (prisma.task.create as jest.Mock).mockResolvedValue(newTask);
        const result = await service.createTask({ title: 'New', description: '', dueDate: new Date() });
        expect(result).toBeDefined();
        expect(prisma.task.create).toHaveBeenCalled();
    });

    it('updateTask updates and returns the updated task', async () => {
        const updatedTask = {
            id: '1',
            title: 'Updated',
            status: 'NOT_STARTED',
            dueDate: new Date(),
            createdAt: new Date(),
            version: 2
        };
        (prisma.task.update as jest.Mock).mockResolvedValue(updatedTask);
        const result = await service.updateTask('1', { title: 'Updated' });
        expect(result).toBeDefined();
        expect(result.title).toBe('Updated');
        expect(prisma.task.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { title: 'Updated' } });
    });

    it('updateTaskWithVersion updates and returns 1 if successful', async () => {
        (prisma.task.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
        const result = await service.updateTaskWithVersion('1', 1, { title: 'Updated' });
        expect(result).toBe(1);
        expect(prisma.task.updateMany).toHaveBeenCalled();
    });

    it('updateTaskWithVersion returns 0 if update fails', async () => {
        (prisma.task.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
        const result = await service.updateTaskWithVersion('1', 1, { title: 'Updated' });
        expect(result).toBe(0);
    });

    it('deleteTask deletes a task', async () => {
        (prisma.task.delete as jest.Mock).mockResolvedValue({ id: '1' });
        await service.deleteTask('1');
        expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
});