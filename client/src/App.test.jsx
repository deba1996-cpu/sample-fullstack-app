import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { vi } from 'vitest';

const mockTasks = [
  {
    id: 1,
    title: 'Design landing page',
    description: 'Create the home page hero for the app',
    status: 'todo'
  },
  {
    id: 2,
    title: 'Write API docs',
    description: 'Document the task routes',
    status: 'done'
  }
];

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url, options = {}) => {
        const method = options.method || 'GET';

        if (url.endsWith('/tasks') && method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: async () => mockTasks
          });
        }

        if (url.endsWith('/tasks') && method === 'POST') {
          const body = JSON.parse(options.body || '{}');
          const task = {
            id: Date.now(),
            title: body.title,
            description: body.description,
            status: body.status || 'todo'
          };

          mockTasks.unshift(task);
          return Promise.resolve({
            ok: true,
            json: async () => task
          });
        }

        return Promise.resolve({ ok: true, json: async () => ({}) });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the task manager and loads tasks', async () => {
    render(<App />);

    expect(screen.getByText(/task manager/i)).toBeInTheDocument();
    expect(await screen.findByText('Design landing page')).toBeInTheDocument();
  });

  it('adds a new task through the form', async () => {
    render(<App />);

    fireEvent.change(screen.getByPlaceholderText(/create a new task/i), {
      target: { value: 'Fix login form' }
    });

    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Fix login form')).toBeInTheDocument();
    });
  });
});
