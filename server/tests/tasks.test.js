import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createApp } from '../index.js';

async function withServer(run) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tasks-'));
  const server = createApp({ dbPath: path.join(directory, 'tasks.db'), serveFrontend: false }).listen(0);
  try {
    const address = server.address();
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(directory, { recursive: true, force: true });
  }
}

test('health endpoint reports ok', () => withServer(async (baseUrl) => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
}));

test('tasks can be created, updated, listed, and deleted', () => withServer(async (baseUrl) => {
  const invalid = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({})
  });
  assert.equal(invalid.status, 400);

  const created = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Ship feature', description: 'Write tests', status: 'todo' })
  });
  assert.equal(created.status, 201);
  const task = await created.json();
  assert.equal(task.title, 'Ship feature');

  const updated = await fetch(`${baseUrl}/api/tasks/${task.id}`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'done' })
  });
  assert.equal((await updated.json()).status, 'done');

  const listed = await fetch(`${baseUrl}/api/tasks`);
  assert.equal((await listed.json()).length, 1);

  const deleted = await fetch(`${baseUrl}/api/tasks/${task.id}`, { method: 'DELETE' });
  assert.equal(deleted.status, 204);
}));
