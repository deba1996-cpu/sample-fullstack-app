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
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`, (error) => (error ? reject(error) : resolve()));
  });
  return db;
}

export function createApp({ dbPath = DEFAULT_DB_PATH, serveFrontend = true } = {}) {
  const app = express();
  app.locals.dbPromise = ensureDatabase(dbPath);
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/tasks', async (_req, res) => {
    try {
      const db = await app.locals.dbPromise;
      db.all('SELECT * FROM tasks ORDER BY created_at DESC, id DESC', (error, rows) => {
        if (error) return res.status(500).json({ message: 'Unable to fetch tasks.' });
        res.json(rows.map(normalizeTask));
      });
    } catch {
      res.status(500).json({ message: 'Database error while fetching tasks.' });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    try {
      const { title, description = '', status = 'todo' } = req.body || {};
      const safeTitle = typeof title === 'string' ? title.trim() : '';
      if (!safeTitle) return res.status(400).json({ message: 'Title is required.' });
      const safeDescription = typeof description === 'string' ? description.trim() : '';
      const safeStatus = VALID_STATUSES.includes(status) ? status : 'todo';
      const db = await app.locals.dbPromise;
      db.run('INSERT INTO tasks (title, description, status, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [safeTitle, safeDescription, safeStatus], function (error) {
          if (error) return res.status(500).json({ message: 'Unable to create task.' });
          db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (getError, row) => {
            if (getError || !row) return res.status(500).json({ message: 'Task created but could not be loaded.' });
            res.status(201).json(normalizeTask(row));
          });
        });
    } catch {
      res.status(500).json({ message: 'Unexpected error while creating task.' });
    }
  });

  app.put('/api/tasks/:id', async (req, res) => {
    try {
      const db = await app.locals.dbPromise;
      const { id } = req.params;
      db.get('SELECT * FROM tasks WHERE id = ?', [id], (selectError, existing) => {
        if (selectError || !existing) return res.status(404).json({ message: 'Task not found.' });
        const title = typeof req.body?.title === 'string' ? req.body.title.trim() : existing.title;
        const description = typeof req.body?.description === 'string' ? req.body.description.trim() : (existing.description || '');
        const status = VALID_STATUSES.includes(req.body?.status) ? req.body.status : existing.status;
        if (!title) return res.status(400).json({ message: 'Title is required.' });
        db.run('UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [title, description, status, id], (updateError) => {
            if (updateError) return res.status(500).json({ message: 'Unable to update task.' });
            db.get('SELECT * FROM tasks WHERE id = ?', [id], (error, row) => {
              if (error || !row) return res.status(500).json({ message: 'Task updated but could not be loaded.' });
              res.json(normalizeTask(row));
            });
          });
      });
    } catch {
      res.status(500).json({ message: 'Unexpected error while updating task.' });
    }
  });

  app.delete('/api/tasks/:id', async (req, res) => {
    try {
      const db = await app.locals.dbPromise;
      db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], function (error) {
        if (error) return res.status(500).json({ message: 'Unable to delete task.' });
        if (!this.changes) return res.status(404).json({ message: 'Task not found.' });
        res.status(204).end();
      });
    } catch {
      res.status(500).json({ message: 'Unexpected error while deleting task.' });
    }
  });

  if (serveFrontend) {
    const distPath = path.join(process.cwd(), 'client', 'dist');
    app.use(express.static(distPath));
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      try {
        await fs.access(path.join(distPath, 'index.html'));
        res.sendFile(path.join(distPath, 'index.html'));
      } catch {
        res.status(404).json({ message: 'Frontend build not found. Run npm run build.' });
      }
    });
  }
  return app;
}

export function startServer({ port = DEFAULT_PORT, dbPath = DEFAULT_DB_PATH, serveFrontend = true } = {}) {
  return createApp({ dbPath, serveFrontend }).listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
