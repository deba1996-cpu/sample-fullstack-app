import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const emptyForm = {
  title: '',
  description: '',
  status: 'todo'
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTasks() {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/tasks`);
      if (!response.ok) throw new Error('Unable to load tasks');
      const data = await response.json();
      setTasks(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          status: form.status
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Could not create task');
      }

      setTasks((current) => [payload, ...current]);
      setForm(emptyForm);
      setError('');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
  }

  async function handleStatusChange(taskId, status) {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to update task');
      }

      setTasks((current) =>
        current.map((task) => (task.id === taskId ? payload : task))
      );
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update task');
    }
  }

  async function handleDelete(taskId) {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Failed to delete task');
      }

      setTasks((current) => current.filter((task) => task.id !== taskId));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete task');
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Productivity</p>
          <h1>Task Manager</h1>
        </div>
      </header>

      <main className="layout">
        <section className="card form-card">
          <h2>Add a task</h2>

          <form onSubmit={handleSubmit} className="task-form">
            <label>
              Title
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Create a new task"
              />
            </label>

            <label>
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Add a more detailed description"
              />
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </label>

            <button type="submit" className="primary-btn">
              Add Task
            </button>
          </form>

          {error ? <p className="error-message">{error}</p> : null}
        </section>

        <section className="card list-card">
          <div className="list-header">
            <h2>Tasks</h2>
            <div className="filter-group" aria-label="Task filters">
              {['all', 'todo', 'in-progress', 'done'].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={filter === option ? 'filter active' : 'filter'}
                  onClick={() => setFilter(option)}
                >
                  {option === 'all' ? 'All' : option.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="empty-state">Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <p className="empty-state">No tasks match this filter.</p>
          ) : (
            <ul className="task-list">
              {filteredTasks.map((task) => (
                <li key={task.id} className="task-item">
                  <div className="task-copy">
                    <h3>{task.title}</h3>
                    {task.description ? <p>{task.description}</p> : null}
                  </div>

                  <div className="task-controls">
                    <select
                      aria-label={`Status for ${task.title}`}
                      value={task.status}
                      onChange={(event) =>
                        handleStatusChange(task.id, event.target.value)
                      }
                    >
                      <option value="todo">To do</option>
                      <option value="in-progress">In progress</option>
                      <option value="done">Done</option>
                    </select>

                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => handleDelete(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
