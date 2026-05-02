import express from 'express';
import session from 'express-session';
import helmet from 'helmet';

/**
 * Sets up middleware for the Express app.
 * @param app Express application instance
 */
export function setupMiddleware(app: express.Express) {
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: 'your-secret-key', // use a secure secret in production!
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));
}