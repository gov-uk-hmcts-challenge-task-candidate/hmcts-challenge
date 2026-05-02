import {
    validateDateFields,
    validateTitle,
    formatTaskForDisplay,
    getAndClearSessionMessages,
} from '../src/routes/helpers';

describe('validateDateFields', () => {
    it('returns errors if any date part is missing', () => {
        const result = validateDateFields('', '12', '2024');
        expect(result.errorMessage['due-day']).toBe('Enter a day');
        expect(result.errorSummary.some(e => e.text === 'Enter a day')).toBe(true);
        expect(result.date).toBeNull();
    });

    it('returns error if month is missing', () => {
        const result = validateDateFields('12', '', '2024');
        expect(result.errorMessage['due-month']).toBe('Enter a month');
        expect(result.errorSummary.some(e => e.text === 'Enter a month')).toBe(true);
        expect(result.date).toBeNull();
    });

    it('returns error if year is missing', () => {
        const result = validateDateFields('12', '12', '');
        expect(result.errorMessage['due-year']).toBe('Enter a year');
        expect(result.errorSummary.some(e => e.text === 'Enter a year')).toBe(true);
        expect(result.date).toBeNull();
    });

    it('returns errors if date parts are not numbers', () => {
        const result = validateDateFields('a', 'b', 'c');
        expect(result.errorMessage['due-day']).toBe('Day must be a number');
        expect(result.errorMessage['due-month']).toBe('Month must be a number');
        expect(result.errorMessage['due-year']).toBe('Year must be a number');
        expect(result.date).toBeNull();
    });

    it('returns error if only day is not a number', () => {
        const result = validateDateFields('a', '12', '2024');
        expect(result.errorMessage['due-day']).toBe('Day must be a number');
        expect(result.errorMessage['due-month']).toBeUndefined();
        expect(result.errorMessage['due-year']).toBeUndefined();
    });

    it('returns error if only month is not a number', () => {
        const result = validateDateFields('12', 'b', '2024');
        expect(result.errorMessage['due-month']).toBe('Month must be a number');
        expect(result.errorMessage['due-day']).toBeUndefined();
        expect(result.errorMessage['due-year']).toBeUndefined();
    });

    it('returns error if only year is not a number', () => {
        const result = validateDateFields('12', '12', 'c');
        expect(result.errorMessage['due-year']).toBe('Year must be a number');
        expect(result.errorMessage['due-day']).toBeUndefined();
        expect(result.errorMessage['due-month']).toBeUndefined();
    });

    it('returns error for invalid date (e.g. 31 Feb)', () => {
        const result = validateDateFields('31', '2', '2024');
        expect(result.errorMessage['due-date']).toBe('Enter a real date');
        expect(result.date).toBeNull();
    });

    it('returns error for past date if not COMPLETED', () => {
        const past = new Date();
        past.setDate(past.getDate() - 1);
        const d = past.getDate().toString();
        const m = (past.getMonth() + 1).toString();
        const y = past.getFullYear().toString();
        const result = validateDateFields(d, m, y);
        expect(result.errorMessage['due-date']).toBe('Due date must not be in the past');
        expect(result.date).toBeNull();
    });

    it('allows past date if status is COMPLETED', () => {
        const past = new Date();
        past.setDate(past.getDate() - 1);
        const d = past.getDate().toString();
        const m = (past.getMonth() + 1).toString();
        const y = past.getFullYear().toString();
        const result = validateDateFields(d, m, y, 'COMPLETED');
        expect(result.errorMessage['due-date']).toBeUndefined();
        expect(result.date).toBeInstanceOf(Date);
    });

    it('returns valid date for correct input', () => {
        const future = new Date();
        future.setDate(future.getDate() + 1);
        const d = future.getDate().toString();
        const m = (future.getMonth() + 1).toString();
        const y = future.getFullYear().toString();
        const result = validateDateFields(d, m, y);
        expect(result.errorMessage['due-date']).toBeUndefined();
        expect(result.date).toBeInstanceOf(Date);
    });
});

describe('validateTitle', () => {
    it('returns error for empty title', () => {
        const result = validateTitle('');
        expect(result.errorMessage.title).toBe('Enter a title');
        expect(result.errorSummary.some(e => e.text === 'Enter a title')).toBe(true);
    });

    it('returns error for whitespace title', () => {
        const result = validateTitle('   ');
        expect(result.errorMessage.title).toBe('Enter a title');
    });

    it('returns no error for valid title', () => {
        const result = validateTitle('My Task');
        expect(result.errorMessage.title).toBeUndefined();
        expect(result.errorSummary.length).toBe(0);
    });
});

describe('formatTaskForDisplay', () => {
    it('formats dueDate and sets isOverdue correctly', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const task = {
            status: 'NOT_STARTED',
            dueDate: new Date(today.getTime() - 86400000), // yesterday
        };
        const formatted = formatTaskForDisplay(task);
        expect(formatted.dueDateFormatted).toMatch(/\d{2} \w{3} \d{4}/);
        expect(formatted.isOverdue).toBe(true);
    });

    it('isOverdue is false for COMPLETED', () => {
        const future = new Date();
        future.setDate(future.getDate() + 1);
        const task = {
            status: 'COMPLETED',
            dueDate: future,
        };
        const formatted = formatTaskForDisplay(task);
        expect(formatted.isOverdue).toBe(false);
    });
});

describe('getAndClearSessionMessages', () => {
    it('gets and clears session messages', () => {
        const req: any = { session: { successMessage: 'ok', errorMessage: 'fail' } };
        const result = getAndClearSessionMessages(req);
        expect(result.successMessage).toBe('ok');
        expect(result.errorMessage).toBe('fail');
        expect(req.session.successMessage).toBeUndefined();
        expect(req.session.errorMessage).toBeUndefined();
    });

    it('handles missing session gracefully', () => {
        const req: any = { session: {} };
        const result = getAndClearSessionMessages(req);
        expect(result.successMessage).toBeUndefined();
        expect(result.errorMessage).toBeUndefined();
    });
});