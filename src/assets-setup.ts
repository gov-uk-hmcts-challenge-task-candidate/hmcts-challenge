import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Sets up static asset serving for GOV.UK Frontend.
 * @param app Express application instance
 */
export function setupAssets(app: express.Express) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(
    '/assets',
    express.static(path.join(__dirname, '../node_modules/govuk-frontend/dist/govuk'))
  );
}