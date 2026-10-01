body {
  margin: 0;
  font-family: Inter, "Segoe UI", sans-serif;
  background: linear-gradient(135deg, #f5f7ff 0%, #eef3ff 100%);
  color: #1f2937;
}

* {
  box-sizing: border-box;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 20px 48px;
}

.topbar {
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0;
  color: #6366f1;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.topbar h1 {
  margin: 6px 0 0;
  font-size: clamp(2rem, 3vw, 3rem);
}

.layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 24px;
}

.card {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.05);
  padding: 20px;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-form label,
.task-controls select {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 600;
  color: #374151;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid #dbe3f0;
  border-radius: 12px;
  padding: 10px 12px;
  background: white;
  color: #111827;
}

textarea {
  min-height: 96px;
  resize: vertical;
}

.primary-btn,
.filter,
.danger-btn {
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 700;
  transition: opacity 0.2s ease;
}

.primary-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
}

.filter {
  color: #374151;
  background: #eef2ff;
}

.filter.active {
  background: #c7d2fe;
  color: #312e81;
}

.danger-btn {
  background: #fee2e2;
  color: #991b1b;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.task-item {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.task-copy h3 {
  margin: 0 0 8px;
}

.task-copy p {
  margin: 0;
  color: #4b5563;
}

.task-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 190px;
}

.error-message {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  border-radius: 12px;
}

.empty-state {
  color: #6b7280;
  margin: 0;
}

@media (max-width: 800px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .task-item {
    flex-direction: column;
    align-items: stretch;
  }

  .task-controls {
    min-width: auto;
  }
}
