import express from 'express';
import { setupAssets } from './assets-setup.js';
import { setupMiddleware } from './middleware.js';
import { setupNunjucks } from './nunjucks-setup.js';
import { registerTaskRoutes } from './routes/task-routes.js';

const app = express();

setupNunjucks(app);
setupMiddleware(app);
setupAssets(app);
registerTaskRoutes(app);

export { app };