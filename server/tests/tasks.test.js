import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { pathToFileURL } from 'node:url';

const DEFAULT_PORT = Number(process.env.PORT) || 3001;
const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'tasks.db');
const VALID_STATUSES = ['todo', 'in-progress', 'done'];

function normalizeTask(row) {
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description || '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function ensureDatabase(dbPath = DEFAULT_DB_PATH) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });

  const db = new sqlite3.Database(dbPath);

  await new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      }
    );
  });

  return db;
}

export function createApp({ dbPath = DEFAULT_DB_PATH, serveFrontend = true } = {}) {
  const app = express();
  const dbPromise = ensureDatabase(dbPath);

  app.use(cors());
  app.use(express.json());

  app.locals.dbPromise = dbPromise;

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/tasks', async (_req, res) => {
    try {
      const db = await app.locals.dbPromise;
      db.all('SELECT * FROM tasks ORDER BY created_at DESC', (error, rows) => {
        if (error) {
          res.status(500).json({ message: 'Unable to fetch tasks.' });
          return;
        }

        res.json(rows.map(normalizeTask));
      });
    } catch (error) {
      res.status(500).json({ message: 'Database error while fetching tasks.' });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    try {
      const { title, description = '', status = 'todo' } = req.body || {};
      const safeTitle = typeof title === 'string' ? title.trim() : '';

      if (!safeTitle) {
        res.status(400).json({ message: 'Title is required.' });
        return;
      }

      const safeStatus = VALID_STATUSES.includes(status) ? status : 'todo';
      const db = await app.locals.dbPromise;

      db.run(
        'INSERT INTO tasks (title, description, status, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [safeTitle, description.toString().trim(), safeStatus],
        function onTaskInsert(error) {
          if (error) {
            res.status(500).json({ message: 'Unable to create task.' });
            return;
          }

          db.get(
            'SELECT * FROM tasks WHERE id = ?',
            [this.lastID],
            (getError, row) => {
              if (getError || !row) {
                res.status(500).json({ message: 'Task created but could not be loaded.' });
                return;
              }

              res.status(201).json(normalizeTask(row));
            }
          );
        }
      );
    } catch (error) {
      res.status(500).json({ message: 'Unexpected error while creating task.' });
    }
  });

  app.put('/api/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, status } = req.body || {};
      const db = await app.locals.dbPromise;

      db.get('SELECT * FROM tasks WHERE id = ?', [id], (selectError, existingTask) => {
        if (selectError || !existingTask) {
          res.status(404).json({ message: 'Task not found.' });
          return;
        }

        const nextTitle = typeof title === 'string' ? title.trim() : existingTask.title;
        const nextDescription = typeof description === 'string' ? description.trim() : existingTask.description || '';
        const nextStatus = VALID_STATUSES.includes(status) ? status : existingTask.status;

        if (!nextTitle) {
          res.status(400).json({ message: 'Title is required.' });
          return;
        }

        db.run(
          'UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [nextTitle, nextDescription, nextStatus, id],
          (updateError) => {
            if (updateError) {
              res.status(500).json({ message: 'Unable to update task.' });
              return;
            }

            db.get('SELECT * FROM tasks WHERE id = ?', [id], (finalError, row) => {
              if (finalError || !row) {
                res.status(500).json({ message: 'Task updated but could not be loaded.' });
                return;
              }

              res.json(normalizeTask(row));
            });
          }
        );
      });
    } catch (error) {
      res.status(500).json({ message: 'Unexpected error while updating task.' });
    }
  });

  app.delete('/api/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const db = await app.locals.dbPromise;

      db.run('DELETE FROM tasks WHERE id = ?', [id], function onDelete(error) {
        if (error) {
          res.status(500).json({ message: 'Unable to delete task.' });
          return;
        }

        if (this.changes === 0) {
          res.status(404).json({ message: 'Task not found.' });
          return;
        }

        res.status(204).end();
      });
    } catch (error) {
      res.status(500).json({ message: 'Unexpected error while deleting task.' });
    }
  });

  if (serveFrontend) {
    const distPath = path.join(process.cwd(), 'client', 'dist');

    app.use(express.static(distPath));

    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }

      try {
        await fs.access(distPath);
        res.sendFile(path.join(distPath, 'index.html'));
      } catch {
        res.status(404).json({ message: 'Frontend build not found. Run npm run build.' });
      }
    });
  }

  return app;
}

export async function startServer({
  port = DEFAULT_PORT,
  dbPath = DEFAULT_DB_PATH,
  serveFrontend = true
} = {}) {
  const app = createApp({ dbPath, serveFrontend });
  const server = app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });

  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer({ port: DEFAULT_PORT, serveFrontend: true }).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
