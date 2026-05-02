
import { format } from 'date-fns';

/**
 * Validates date fields for a task form.
 * Checks for missing values, numeric values, real dates, and past dates.
 * @param {string} d - Day value.
 * @param {string} m - Month value.
 * @param {string} y - Year value.
 * @param {string} [status] - Task status (optional).
 * @returns {{
 *   errorMessage: Record<string, string>,
 *   errorSummary: Array<{ text: string; href: string }>,
 *   dateError: boolean,
 *   date: Date | null
 * }}
 */
export function validateDateFields(d: string, m: string, y: string, status?: string): {
    errorMessage: Record<string, string>;
    errorSummary: Array<{ text: string; href: string; }>;
    dateError: boolean;
    date: Date | null;
} {
    const errorMessage: Record<string, string> = {};
    const errorSummary: Array<{ text: string; href: string }> = [];
    let dateError = false;

    if (!d || !m || !y) {
        if (!d) {
            errorMessage['due-day'] = 'Enter a day';
            errorSummary.push({ text: 'Enter a day', href: '#due-day' });
        }
        if (!m) {
            errorMessage['due-month'] = 'Enter a month';
            errorSummary.push({ text: 'Enter a month', href: '#due-month' });
        }
        if (!y) {
            errorMessage['due-year'] = 'Enter a year';
            errorSummary.push({ text: 'Enter a year', href: '#due-year' });
        }
        dateError = true;
        return { errorMessage, errorSummary, dateError, date: null };
    }

    const day = Number(d);
    const month = Number(m);
    const year = Number(y);

    if (
        isNaN(day) || isNaN(month) || isNaN(year) ||
        !Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)
    ) {
        if (isNaN(day) || !Number.isInteger(day)) {
            errorMessage['due-day'] = 'Day must be a number';
            errorSummary.push({ text: 'Day must be a number', href: '#due-day' });
        }
        if (isNaN(month) || !Number.isInteger(month)) {
            errorMessage['due-month'] = 'Month must be a number';
            errorSummary.push({ text: 'Month must be a number', href: '#due-month' });
        }
        if (isNaN(year) || !Number.isInteger(year)) {
            errorMessage['due-year'] = 'Year must be a number';
            errorSummary.push({ text: 'Year must be a number', href: '#due-year' });
        }
        dateError = true;
        return { errorMessage, errorSummary, dateError, date: null };
    }

    const date = new Date(`${year}-${month}-${day}`);
    if (
        date.getFullYear() !== year ||
        date.getMonth() + 1 !== month ||
        date.getDate() !== day
    ) {
        errorMessage['due-date'] = 'Enter a real date';
        errorSummary.push({ text: 'Enter a real date', href: '#due-day' });
        dateError = true;
        return { errorMessage, errorSummary, dateError, date: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today && status !== 'COMPLETED') {
        errorMessage['due-date'] = 'Due date must not be in the past';
        errorSummary.push({ text: 'Due date must not be in the past', href: '#due-day' });
        dateError = true;
        return { errorMessage, errorSummary, dateError, date: null };
    }

    return { errorMessage, errorSummary, dateError, date };
}

/**
 * Validates the task title.
 * @param {string} title - Task title.
 * @returns {{
 *   errorMessage: Record<string, string>,
 *   errorSummary: Array<{ text: string; href: string }>
 * }}
 */
export function validateTitle(title: string): {
    errorMessage: Record<string, string>;
    errorSummary: Array<{ text: string; href: string }>;
} {
  const errorMessage: Record<string, string> = {};
  const errorSummary: Array<{ text: string; href: string }> = [];
  if (!title || !title.trim()) {
    errorMessage.title = 'Enter a title';
    errorSummary.push({ text: 'Enter a title', href: '#title' });
  }
  return { errorMessage, errorSummary };
}

/**
 * Formats a task object for display, including formatted due date and overdue status.
 * @param {any} task - Task object.
 * @returns {any} Task object with formatted due date and overdue flag.
 */
export function formatTaskForDisplay(task: any): any {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isOverdue =
    (task.status === 'NOT_STARTED' || task.status === 'IN_PROGRESS') &&
    task.dueDate < now;
  return {
    ...task,
    dueDateFormatted: format(task.dueDate, 'dd MMM yyyy'),
    isOverdue
  };
}

/**
 * Retrieves and clears session messages (success and error) from the request.
 * @param {any} req - Express request object.
 * @returns {{ successMessage: string | undefined, errorMessage: string | undefined }} Session messages.
 */
export function getAndClearSessionMessages(req: any): { successMessage: string | undefined; errorMessage: string | undefined } {
  const successMessage = req.session.successMessage;
  delete req.session.successMessage;
  const errorMessage = req.session.errorMessage;
  delete req.session.errorMessage;
  return { successMessage, errorMessage };
}