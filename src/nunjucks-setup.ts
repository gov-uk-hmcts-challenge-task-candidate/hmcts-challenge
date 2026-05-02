import nunjucks from 'nunjucks';
import path from 'path';
import express from 'express';

/**
 * Sets up Nunjucks templating for the Express app.
 * @param app Express application instance
 */
export function setupNunjucks(app: express.Express) {
  nunjucks.configure([
    path.join(process.cwd(), 'src/views'),
    path.join(process.cwd(), 'node_modules/govuk-frontend/dist')
  ], {
    autoescape: true,
    express: app,
  });

  app.set('view engine', 'njk');
}