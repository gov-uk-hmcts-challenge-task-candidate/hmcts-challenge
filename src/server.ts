import { app } from './app.js'

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`
    🚀 Task Manager running at: http://localhost:${port}/tasks
    📁 Database: SQLite (prisma/dev.db)
    🎨 Design System: GOV.UK Frontend
  `);
});