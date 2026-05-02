import { prisma } from '../db.js';
import type { Task as PrismaTask, Prisma } from '@prisma/client';
import type { Task } from '../types/task.js';
import type { ITaskService } from './i-task-service.js';

/**
 * Maps a PrismaTask object to the domain Task type.
 * @param {PrismaTask} prismaTask - Task object from Prisma.
 * @returns {Task} Domain Task object.
 */
function mapPrismaTaskToTask(prismaTask: PrismaTask): Task {
  return { ...prismaTask };
}

/**
 * Task service implementation using Prisma ORM.
 * Provides CRUD operations and concurrency control for tasks.
 */
export class PrismaTaskService implements ITaskService {
  /**
   * Retrieves all tasks, ordered by due date.
   * @returns {Promise<Task[]>} Promise resolving to an array of tasks.
   */
  async getAllTasks(): Promise<Task[]> {
    const tasks = await prisma.task.findMany({ orderBy: { dueDate: 'asc' } });
    return tasks.map(mapPrismaTaskToTask);
  }

  /**
   * Creates a new task.
   * @param {{ title: string; description?: string | null; dueDate: Date }} data - Task data.
   * @returns {Promise<Task>} Promise resolving to the created task.
   */
  async createTask(data: { title: string; description?: string | null; dueDate: Date }): Promise<Task> {
    const prismaTask = await prisma.task.create({ data });
    return mapPrismaTaskToTask(prismaTask);
  }

  /**
   * Retrieves a task by its ID.
   * @param {string} id - Task ID.
   * @returns {Promise<Task | null>} Promise resolving to the task or null if not found.
   */
  async getTaskById(id: string): Promise<Task | null> {
    const prismaTask = await prisma.task.findUnique({ where: { id } });
    return prismaTask ? mapPrismaTaskToTask(prismaTask) : null;
  }

  /**
   * Updates a task by its ID.
   * @param {string} id - Task ID.
   * @param {Prisma.TaskUpdateInput} data - Task update data.
   * @returns {Promise<Task>} Promise resolving to the updated task.
   */
  async updateTask(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    const prismaTask = await prisma.task.update({ where: { id }, data });
    return mapPrismaTaskToTask(prismaTask);
  }

  /**
   * Deletes a task by its ID.
   * @param {string} id - Task ID.
   * @returns {Promise<void>} Promise resolving when the task is deleted.
   */
  async deleteTask(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } });
  }

  /**
   * Updates a task using optimistic concurrency control.
   * Only updates if the version matches; increments version on success.
   * @param {string} id - Task ID.
   * @param {number} version - Expected task version.
   * @param {Prisma.TaskUpdateInput} data - Task update data.
   * @returns {Promise<number>} Promise resolving to the number of updated records (0 if version mismatch).
   */
  async updateTaskWithVersion(
    id: string,
    version: number,
    data: Prisma.TaskUpdateInput
  ): Promise<number> {
    const result = await prisma.task.updateMany({
      where: { id, version },
      data: {
        ...data,
        version: { increment: 1 }
      }
    });
    return result.count;
  }
}