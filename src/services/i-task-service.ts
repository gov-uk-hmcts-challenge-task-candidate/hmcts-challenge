import type { Task } from '../types/task.js';

export interface ITaskService {
  getAllTasks(): Promise<Task[]>;
  createTask(data: Omit<Task, 'id' | 'createdAt' | 'version' | 'status'>): Promise<Task>;
  getTaskById(id: string): Promise<Task | null>;
  updateTask(id: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'version'>>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  updateTaskWithVersion(
    id: string,
    version: number,
    data: Partial<Omit<Task, 'id' | 'createdAt' | 'version'>>
  ): Promise<number>;
}