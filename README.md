# Task Manager

A simple task management app built with Node.js, Express, TypeScript, Prisma (SQLite), and Nunjucks, styled with GOV.UK Frontend.

---

## Features

- **Task CRUD:** Create, view, edit, and delete tasks.
- **Validation:** All user input is validated on the server.
- **Error Handling:** User-friendly error messages for validation and server errors.
- **Concurrency Control:**  
  - **Optimistic locking** is used when editing tasks.  
  - If two users edit the same task at the same time, the app detects version conflicts and prompts the user to resolve them (see the "merge-task" view).
- **Session-based Flash Messages:** Success and error messages are shown after actions.
- **Accessible UI:** Uses GOV.UK Design System for accessibility and usability.

---

## Setup

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Set up the database:**
   ```sh
   npx prisma migrate dev --name init
   ```

3. **Run the app:**
   ```sh
   npm run dev
   ```
   The app will be available at [http://localhost:3000/tasks](http://localhost:3000/tasks).

---

## Testing

- **Unit tests:**  
  Run all unit tests with:
  ```sh
  npm test
  ```
  All business logic (helpers, handlers, services) is covered.

---

## API Endpoints

### GET /tasks
- **Description:** List all tasks.
- **Response:** 200, renders the task list.

### GET /tasks/new
- **Description:** Show the form to create a new task.
- **Response:** 200, renders the new task form.

### POST /tasks/new
- **Description:** Create a new task.
- **Body:**  
  - `title` (required)  
  - `description` (optional)  
  - `due-day`, `due-month`, `due-year` (required)
- **Response:**  
  - 302 redirect to `/tasks` on success  
  - 400 with validation errors on failure

### GET /tasks/:id/edit
- **Description:** Show the edit form for a task.
- **Response:** 200, renders the edit form; 404 if not found.

### POST /tasks/:id/edit
- **Description:** Update a task.
- **Body:**  
  - `title`, `description`, `status`, `due-day`, `due-month`, `due-year`, `version`
- **Response:**  
  - 302 redirect to `/tasks` on success  
  - 400 with validation errors  
  - 409 with merge prompt if version conflict

### GET /tasks/:id/delete
- **Description:** Show the delete confirmation.
- **Response:** 200, renders confirmation; 404 if not found.

### POST /tasks/:id/delete
- **Description:** Delete a task.
- **Response:** 302 redirect to `/tasks` on success; 404 if not found.

---

## Interesting Implementation Details

### Concurrency Handling

- The app uses **optimistic concurrency control** for editing tasks.
- Each task has a `version` field.
- When editing, the current version is submitted with the form.
- If the version in the database does not match the submitted version, the update is rejected and the user is prompted to resolve the conflict (see the "merge-task" view).

### Service Abstraction & Swappable Data Layer
- The app’s business logic (route handlers) interacts with tasks through an interface-based service layer (ITaskService).
- The current implementation uses a PrismaTaskService (backed by Prisma and SQLite), but any other service (e.g., REST API, in-memory, or another database) can be swapped in by implementing the same interface.
- This design makes the codebase modular, testable, and future-proof—the data layer can be replaced without changing the route handlers or validation logic.

### Validation

- All form fields are validated server-side.
- Date fields are checked for validity and for being in the future.

### Error Handling

- All errors are caught and user-friendly messages are shown.
- 404 and 400 errors are handled gracefully.

---

## Project Structure

```
src/
  app.ts              # Express app setup
  server.ts           # App entry point
  db.ts               # Prisma client
  routes/
    task-routes.ts    # Route registration
    task-handlers.ts  # Route handlers (business logic)
  services/
    prisma-task-service.ts # Database service
  views/              # Nunjucks templates
  helpers.ts          # Validation and utility functions
tests/                # Unit tests
```

---

## Containerisation & Kubernetes Readiness

This project includes a `Dockerfile` for easy containerisation. The Docker image contains all dependencies, builds the TypeScript source, and runs the app on port 3000. This makes it ready for deployment to container orchestration platforms like Kubernetes.

**To build and run locally with Docker:**
    ```sh
    docker build -t gov-task .
    docker run -p 3000:3000 gov-task
    ```
    
---

## License

MIT
```
