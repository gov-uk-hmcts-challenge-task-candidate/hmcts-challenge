import type { NextFunction, Request, Response } from 'express';
import type { ITaskService } from '../services/i-task-service.js';
import {
    formatTaskForDisplay,
    getAndClearSessionMessages,
    validateDateFields,
    validateTitle,
} from './helpers.js';


/**
 * Returns an Express handler to list all tasks.
 * @param {ITaskService} taskService - Task service instance.
 * @returns {(req: Request, res: Response, next?: NextFunction) => Promise<void>} Express handler.
 */
export function listTasks(taskService: ITaskService): (req: Request, res: Response, next?: NextFunction) => Promise<void> {
    return async (req: Request, res: Response) => {
        const tasks = await taskService.getAllTasks();
        const formattedTasks = tasks.map(formatTaskForDisplay);
        const { successMessage, errorMessage } = getAndClearSessionMessages(req);
        res.render('index', { tasks: formattedTasks, successMessage, errorMessage });
    };
}

/**
 * Returns an Express handler to show the create task form.
 * @returns {(req: Request, res: Response, next?: NextFunction) => void} Express handler.
 */
export function showCreateTaskForm(): (req: Request, res: Response, next?: NextFunction) => void {
    return (req: Request, res: Response) => {
        res.render('new-task', {
            errorMessage: {},
            errorSummary: [],
            formValues: {},
        });
    };
}

/**
 * Returns an Express handler to create a new task.
 * @param {ITaskService} taskService - Task service instance.
 * @returns {(req: Request, res: Response, next?: NextFunction) => Promise<void>} Express handler.
 */
export function createTask(taskService: ITaskService): (req: Request, res: Response, next?: NextFunction) => Promise<void> {
    return async (req: Request, res: Response) => {
        const { title, description, 'due-day': d, 'due-month': m, 'due-year': y } = req.body;
        const formValues = { title, description, 'due-day': d, 'due-month': m, 'due-year': y };

        const titleValidation = validateTitle(title);
        const dateValidation = validateDateFields(d, m, y);

        const errorMessage = { ...titleValidation.errorMessage, ...dateValidation.errorMessage };
        const errorSummary = [...titleValidation.errorSummary, ...dateValidation.errorSummary];

        if (Object.keys(errorMessage).length > 0) {
            return res.status(400).render('new-task', {
                errorMessage,
                errorSummary,
                formValues,
            });
        }

        if (dateValidation.date === null) {
            return res.status(400).render('new-task', {
                errorMessage: { ...errorMessage, date: 'Invalid date' },
                errorSummary: [...errorSummary, { text: 'Invalid date', href: '#due-date' }],
                formValues,
            });
        }

        await taskService.createTask({
            title,
            description,
            dueDate: dateValidation.date,
        });
        req.session.successMessage = `Task "${title}" created successfully`;
        res.redirect('/tasks');
    };
}

/**
 * Returns an Express handler to show the edit task form.
 * @param {ITaskService} taskService - Task service instance.
 * @returns {(req: Request, res: Response, next?: NextFunction) => Promise<void>} Express handler.
 */
export function showEditTaskForm(taskService: ITaskService): (req: Request, res: Response, next?: NextFunction) => Promise<void> {
    return async (req: Request, res: Response) => {
        const id = typeof req.params.id === 'string' ? req.params.id : undefined;
        if (!id) {
            res.status(400).send('Invalid or missing task ID');
            return;
        }
        const task = await taskService.getTaskById(id);
        if (!task) {
            res.status(404).send('Task not found');
            return;
        }
        const dueDate = new Date(task.dueDate);
        res.render('edit', {
            task: {
                ...task,
                dueDay: dueDate.getDate(),
                dueMonth: dueDate.getMonth() + 1,
                dueYear: dueDate.getFullYear(),
            },
            errorMessage: {},
            errorSummary: [],
            formValues: {},
        });
    };
}

/**
 * Returns an Express handler to edit a task.
 * Handles optimistic concurrency and validation.
 * @param {ITaskService} taskService - Task service instance.
 * @returns {(req: Request, res: Response, next?: NextFunction) => Promise<void>} Express handler.
 */
export function editTask(taskService: ITaskService): (req: Request, res: Response, next?: NextFunction) => Promise<void> {
    return async (req: Request, res: Response) => {
        const id = typeof req.params.id === 'string' ? req.params.id : undefined;
        if (!id) {
            res.status(400).send('Invalid or missing task ID');
            return;
        }
        const task = await taskService.getTaskById(id);
        if (!task) {
            req.session.errorMessage = 'This task was deleted by another user or process before you could save your changes.';
            res.redirect('/tasks');
            return;
        }
        const { title, description, status, 'due-day': d, 'due-month': m, 'due-year': y, version } = req.body;
        const formValues = { title, description, status, 'due-day': d, 'due-month': m, 'due-year': y };

        const titleValidation = validateTitle(title);
        const dateValidation = validateDateFields(d, m, y, status);

        const errorMessage = { ...titleValidation.errorMessage, ...dateValidation.errorMessage };
        const errorSummary = [...titleValidation.errorSummary, ...dateValidation.errorSummary];

        if (Object.keys(errorMessage).length > 0) {
            const task = await taskService.getTaskById(id);
            return res.status(400).render('edit', {
                task,
                errorMessage,
                errorSummary,
                formValues,
            });
        }

        const updateData: any = {
            title,
            description,
            status,
        };
        if (dateValidation.date !== null) {
            updateData.dueDate = dateValidation.date;
        }
        const updateCount = await taskService.updateTaskWithVersion(
            id,
            Number(version),
            updateData
        );

        if (updateCount === 0) {
            const latestTask = await taskService.getTaskById(id);
            if (!latestTask) {
                req.session.errorMessage = 'This task was deleted by another user or process before you could resolve your changes.';
                return res.redirect('/tasks');
            }
            return res.status(409).render('merge-task', {
                attempted: { title, description, status, dueDay: d, dueMonth: m, dueYear: y },
                latest: {
                    ...latestTask,
                    dueDay: latestTask.dueDate.getDate(),
                    dueMonth: latestTask.dueDate.getMonth() + 1,
                    dueYear: latestTask.dueDate.getFullYear(),
                },
                errorSummary: [{
                    text: "This task was updated by another user while you were editing. Please review the changes below.",
                    href: "#merge-guidance"
                }]
            });
        }
        req.session.successMessage = `Task "${title}" updated successfully`;
        res.redirect('/tasks');
    };
}

/**
 * Returns an Express handler to show the delete task confirmation form.
 * @param {ITaskService} taskService - Task service instance.
 * @returns {(req: Request, res: Response, next?: NextFunction) => Promise<void>} Express handler.
 */
export function showDeleteTaskForm(taskService: ITaskService): (req: Request, res: Response, next?: NextFunction) => Promise<void> {
    return async (req: Request, res: Response) => {
        const id = typeof req.params.id === 'string' ? req.params.id : undefined;
        if (!id) {
            res.status(400).send('Invalid or missing task ID');
            return;
        }
        const task = await taskService.getTaskById(id);
        if (!task) {
            res.status(404).send('Task not found');
            return;
        }
        const formattedTask = formatTaskForDisplay(task);
        res.render('delete', { task: formattedTask });
    };
}

/**
 * Returns an Express handler to delete a task.
 * @param {ITaskService} taskService - Task service instance.
 * @returns {(req: Request, res: Response, next?: NextFunction) => Promise<void>} Express handler.
 */
export function deleteTask(taskService: ITaskService): (req: Request, res: Response, next?: NextFunction) => Promise<void> {
    return async (req: Request, res: Response) => {
        const id = typeof req.params.id === 'string' ? req.params.id : undefined;
        if (!id) {
            res.status(400).send('Invalid or missing task ID');
            return;
        }
        const task = await taskService.getTaskById(id);
        if (!task) {
            res.status(404).send('Task not found');
            return;
        }
        await taskService.deleteTask(id);
        req.session.successMessage = `Task "${task.title}" deleted successfully`;
        res.redirect('/tasks');
    };
}