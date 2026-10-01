# Sample Full Stack App

A full-stack task management application built with React + Vite on the frontend and Express + SQLite on the backend.

## Stack

- Frontend: React, Vite
- Backend: Node.js, Express
- Database: SQLite
- Testing: Node.js built-in test runner + Vitest + Testing Library

## Quick start

1. Install dependencies:
   npm install
   cd client && npm install && cd ..
2. Start the app in development mode:
   npm run dev
3. Build the client for production:
   npm run build
4. Run tests:
   npm test

## API

- GET /api/health
- GET /api/tasks
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

## Notes

The backend stores task data in `data/tasks.db`.
