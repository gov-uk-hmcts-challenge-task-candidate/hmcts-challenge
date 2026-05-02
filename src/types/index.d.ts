import 'express-session';

export declare module 'express-session' {
  interface SessionData {
    successMessage?: string;
    errorMessage?: string;
  }
}