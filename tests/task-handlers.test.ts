import {
    listTasks,
    showCreateTaskForm,
    createTask,
    showEditTaskForm,
    editTask,
    showDeleteTaskForm,
    deleteTask,
} from '../src/routes/task-handlers';
import * as helpers from '../src/routes/helpers';


describe('Task Handlers (with injected service)', () => {
    let req: any;
    let res: any;
    let mockService: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { session: {}, params: {}, body: {} };
        res = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        mockService = {
            getAllTasks: jest.fn().mockResolvedValue([
                { id: '1', title: 'Test', status: 'NOT_STARTED', dueDate: new Date(), createdAt: new Date(), version: 1 }
            ]),
            createTask: jest.fn().mockResolvedValue({}),
            getTaskById: jest.fn().mockImplementation((id: string) =>
                id === 'notfound' ? null : {
                    id,
                    title: 'Test',
                    status: 'NOT_STARTED',
                    dueDate: new Date(),
                    createdAt: new Date(),
                    version: 1
                }
            ),
            updateTaskWithVersion: jest.fn().mockResolvedValue(1),
            deleteTask: jest.fn().mockResolvedValue(undefined),
        };
    });

    describe('listTasks', () => {
        it('renders the index view with tasks', async () => {
            await listTasks(mockService)(req, res);
            expect(res.render).toHaveBeenCalledWith(
                'index',
                expect.objectContaining({ tasks: expect.any(Array) })
            );
        });
    });

    describe('showCreateTaskForm', () => {
        it('renders the new-task view', () => {
            showCreateTaskForm()(req, res);
            expect(res.render).toHaveBeenCalledWith('new-task', expect.any(Object));
        });
    });

    describe('createTask', () => {
        it('renders new-task with errors if validation fails', async () => {
            req.body = { title: '', 'due-day': '', 'due-month': '', 'due-year': '' };
            await createTask(mockService)(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.render).toHaveBeenCalledWith('new-task', expect.any(Object));
        });

        it('renders new-task with invalid date error if dateValidation.date is null', async () => {
            req.body = { title: 'Test', 'due-day': '31', 'due-month': '2', 'due-year': '2024' };
            await createTask(mockService)(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.render).toHaveBeenCalledWith('new-task', expect.objectContaining({
                errorMessage: expect.objectContaining({ 'due-date': 'Enter a real date' })
            }));
        });

        it('renders new-task with generic invalid date error if dateValidation.date is null and no other errors', async () => {
            jest.spyOn(helpers, 'validateDateFields').mockReturnValue({
                errorMessage: {},
                errorSummary: [],
                dateError: true,
                date: null,
            });
            req.body = { title: 'Test', 'due-day': '1', 'due-month': '1', 'due-year': '2024' };
            await createTask(mockService)(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.render).toHaveBeenCalledWith('new-task', expect.objectContaining({
                errorMessage: expect.objectContaining({ date: 'Invalid date' })
            }));
            (helpers.validateDateFields as jest.Mock).mockRestore();
        });
        it('redirects to /tasks on success', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            req.body = {
                title: 'Test',
                description: 'desc',
                'due-day': tomorrow.getDate().toString(),
                'due-month': (tomorrow.getMonth() + 1).toString(),
                'due-year': tomorrow.getFullYear().toString()
            };
            await createTask(mockService)(req, res);
            expect(res.redirect).toHaveBeenCalledWith('/tasks');
        });
    });

    describe('showEditTaskForm', () => {
        it('renders edit view for valid id', async () => {
            req.params.id = '1';
            await showEditTaskForm(mockService)(req, res);
            expect(res.render).toHaveBeenCalledWith('edit', expect.any(Object));
        });

        it('returns 404 if task not found', async () => {
            req.params.id = 'notfound';
            await showEditTaskForm(mockService)(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith('Task not found');
        });

        it('returns 400 if id is missing', async () => {
            req.params.id = undefined;
            await showEditTaskForm(mockService)(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith('Invalid or missing task ID');
        });
    });

    describe('editTask', () => {
        it('returns 400 if id is missing', async () => {
            req.params.id = undefined;
            await editTask(mockService)(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith('Invalid or missing task ID');
        });

        it('redirects with error if task not found', async () => {
            req.params.id = 'notfound';
            req.session = {};
            await editTask(mockService)(req, res);
            expect(res.redirect).toHaveBeenCalledWith('/tasks');
            expect(req.session.errorMessage).toBeDefined();
        });

        it('renders edit with errors if validation fails', async () => {
            req.params.id = '1';
            req.body = { title: '', 'due-day': '', 'due-month': '', 'due-year': '' };
            await editTask(mockService)(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.render).toHaveBeenCalledWith('edit', expect.any(Object));
        });

        it('does not add dueDate to updateData if dateValidation.date is null and no other errors', async () => {
            jest.spyOn(helpers, 'validateDateFields').mockReturnValue({
                errorMessage: {},
                errorSummary: [],
                dateError: true,
                date: null,
            });
            mockService.getTaskById.mockResolvedValueOnce({
                id: '1',
                title: 'Test',
                status: 'NOT_STARTED',
                dueDate: new Date(),
                createdAt: new Date(),
                version: 1
            });
            mockService.updateTaskWithVersion.mockResolvedValueOnce(1);

            req.params.id = '1';
            req.body = {
                title: 'Test',
                description: 'desc',
                status: 'NOT_STARTED',
                'due-day': '1',
                'due-month': '1',
                'due-year': '2024',
                version: 1
            };
            req.session = {};
            await editTask(mockService)(req, res);

            // Check that updateTaskWithVersion was called without dueDate in updateData
            const updateDataArg = mockService.updateTaskWithVersion.mock.calls[0][2];
            expect(updateDataArg).not.toHaveProperty('dueDate');
            expect(res.redirect).toHaveBeenCalledWith('/tasks');
            (helpers.validateDateFields as jest.Mock).mockRestore();
        });

        it('redirects to /tasks on successful update', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            req.params.id = '1';
            req.body = {
                title: 'Test',
                description: 'desc',
                status: 'NOT_STARTED',
                'due-day': tomorrow.getDate().toString(),
                'due-month': (tomorrow.getMonth() + 1).toString(),
                'due-year': tomorrow.getFullYear().toString(),
                version: 1
            };
            await editTask(mockService)(req, res);
            expect(res.redirect).toHaveBeenCalledWith('/tasks');
        });

        it('renders merge-task if updateCount is 0 and latestTask exists', async () => {
            mockService.updateTaskWithVersion.mockResolvedValueOnce(0);
            // First call: for the original task, second call: for latestTask after conflict
            mockService.getTaskById
                .mockResolvedValueOnce({
                    id: '1',
                    title: 'Test',
                    status: 'NOT_STARTED',
                    dueDate: new Date(),
                    createdAt: new Date(),
                    version: 1
                })
                .mockResolvedValueOnce({
                    id: '1',
                    title: 'Test (latest)',
                    status: 'NOT_STARTED',
                    dueDate: new Date(),
                    createdAt: new Date(),
                    version: 2
                });
            req.params.id = '1';
            req.body = {
                title: 'Test',
                description: 'desc',
                status: 'NOT_STARTED',
                'due-day': '1',
                'due-month': '1',
                'due-year': '2099',
                version: 1
            };
            await editTask(mockService)(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.render).toHaveBeenCalledWith('merge-task', expect.any(Object));
        });

        it('redirects if updateCount is 0 and latestTask is missing', async () => {
            mockService.updateTaskWithVersion.mockResolvedValueOnce(0);
            // First call: returns the original task, second call: returns null (task deleted)
            mockService.getTaskById
                .mockResolvedValueOnce({
                    id: '1',
                    title: 'Test',
                    status: 'NOT_STARTED',
                    dueDate: new Date(),
                    createdAt: new Date(),
                    version: 1
                })
                .mockResolvedValueOnce(null);

            req.params.id = '1';
            req.body = {
                title: 'Test',
                description: 'desc',
                status: 'NOT_STARTED',
                'due-day': '1',
                'due-month': '1',
                'due-year': '2099',
                version: 1
            };
            req.session = {};
            await editTask(mockService)(req, res);
            expect(req.session.errorMessage).toBe('This task was deleted by another user or process before you could resolve your changes.');
            expect(res.redirect).toHaveBeenCalledWith('/tasks');
        });
    });

    describe('showDeleteTaskForm', () => {
        it('renders delete view for valid id', async () => {
            req.params.id = '1';
            await showDeleteTaskForm(mockService)(req, res);
            expect(res.render).toHaveBeenCalledWith('delete', expect.any(Object));
        });

        it('returns 404 if task not found', async () => {
            req.params.id = 'notfound';
            await showDeleteTaskForm(mockService)(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith('Task not found');
        });

        it('returns 400 if id is missing', async () => {
            req.params.id = undefined;
            await showDeleteTaskForm(mockService)(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith('Invalid or missing task ID');
        });
    });

    describe('deleteTask', () => {
        it('returns 400 if id is missing', async () => {
            req.params.id = undefined;
            await deleteTask(mockService)(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith('Invalid or missing task ID');
        });

        it('returns 404 if task not found', async () => {
            req.params.id = 'notfound';
            await deleteTask(mockService)(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith('Task not found');
        });

        it('redirects to /tasks on successful delete', async () => {
            req.params.id = '1';
            req.session = {};
            await deleteTask(mockService)(req, res);
            expect(res.redirect).toHaveBeenCalledWith('/tasks');
            expect(req.session.successMessage).toBeDefined();
        });
    });
});