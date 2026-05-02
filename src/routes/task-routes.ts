import { Router, type Express } from 'express';
import { PrismaTaskService } from '../services/prisma-task-service.js';
import {
  listTasks,
  showCreateTaskForm,
  createTask,
  showEditTaskForm,
  editTask,
  showDeleteTaskForm,
  deleteTask,
} from './task-handlers.js';

const taskService = new PrismaTaskService();

/**
 * Registers all task-related routes on the provided Express app.
 * Uses dependency injection for the task service.
 * @param {Express} app - The Express application instance.
 */
export function registerTaskRoutes(app: Express) {
  const router = Router();

  router.get('/tasks', listTasks(taskService));
  router.get('/tasks/new', showCreateTaskForm());
  router.post('/tasks/new', createTask(taskService));
  router.get('/tasks/:id/edit', showEditTaskForm(taskService));
  router.post('/tasks/:id/edit', editTask(taskService));
  router.get('/tasks/:id/delete', showDeleteTaskForm(taskService));
  router.post('/tasks/:id/delete', deleteTask(taskService));

  app.use(router);
}