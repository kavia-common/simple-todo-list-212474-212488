import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'retro_todos_v1';

function makeId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Read todos from LocalStorage safely.
 * @returns {Array<{id: string, text: string, completed: boolean, createdAt: number, updatedAt: number}>}
 */
function readTodosFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(t => t && typeof t.id === 'string' && typeof t.text === 'string')
      .map(t => ({
        id: t.id,
        text: String(t.text),
        completed: Boolean(t.completed),
        createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
        updatedAt: typeof t.updatedAt === 'number' ? t.updatedAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

/**
 * Write todos to LocalStorage safely.
 * @param {any[]} todos
 */
function writeTodosToStorage(todos) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Ignore quota/security errors; app still works in-memory.
  }
}

// PUBLIC_INTERFACE
function App() {
  /** Retro UI: we keep a simple theme toggle but customize visuals via CSS variables */
  const [theme, setTheme] = useState('light');

  const [todos, setTodos] = useState(() => readTodosFromStorage());
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const remainingCount = useMemo(
    () => todos.filter(t => !t.completed).length,
    [todos]
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    writeTodosToStorage(todos);
  }, [todos]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  function sanitizeInput(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  function addTodo(e) {
    e.preventDefault();
    const cleaned = sanitizeInput(newText);
    if (!cleaned) return;

    const now = Date.now();
    const todo = {
      id: makeId(),
      text: cleaned,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    setTodos(prev => [todo, ...prev]);
    setNewText('');
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditingText(todo.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText('');
  }

  function saveEdit(todoId) {
    const cleaned = sanitizeInput(editingText);
    if (!cleaned) return;

    const now = Date.now();
    setTodos(prev =>
      prev.map(t => (t.id === todoId ? { ...t, text: cleaned, updatedAt: now } : t))
    );
    cancelEdit();
  }

  function deleteTodo(todoId) {
    setTodos(prev => prev.filter(t => t.id !== todoId));
    if (editingId === todoId) cancelEdit();
  }

  function toggleCompleted(todoId) {
    const now = Date.now();
    setTodos(prev =>
      prev.map(t =>
        t.id === todoId ? { ...t, completed: !t.completed, updatedAt: now } : t
      )
    );
  }

  function clearCompleted() {
    setTodos(prev => prev.filter(t => !t.completed));
  }

  return (
    <div className="App">
      <header className="rt-navbar">
        <div className="rt-brand" aria-label="App title">
          <span className="rt-brandMark" aria-hidden="true">
            ▣
          </span>
          <span className="rt-brandText">Retro Todo Terminal</span>
        </div>

        <button
          className="rt-btn rt-btnSecondary"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </header>

      <main className="rt-shell">
        <section className="rt-card" aria-labelledby="todo-title">
          <div className="rt-cardHeader">
            <h1 id="todo-title" className="rt-title">
              Tasks
            </h1>
            <div className="rt-meta" aria-label="Task counts">
              <span className="rt-chip">{remainingCount} remaining</span>
              <span className="rt-chip rt-chipMuted">{todos.length} total</span>
            </div>
          </div>

          <form className="rt-form" onSubmit={addTodo} aria-label="Add a todo">
            <label className="rt-label" htmlFor="newTodo">
              New task
            </label>
            <div className="rt-inputRow">
              <input
                id="newTodo"
                className="rt-input"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="Type and press Add…"
                autoComplete="off"
              />
              <button className="rt-btn rt-btnPrimary" type="submit">
                Add
              </button>
            </div>
            <p className="rt-hint">Tip: keep it short. The terminal likes concise commands.</p>
          </form>

          <div className="rt-list" role="list" aria-label="Todo list">
            {todos.length === 0 ? (
              <div className="rt-empty" role="status">
                <div className="rt-emptyTitle">No tasks yet.</div>
                <div className="rt-emptyBody">Add your first mission above.</div>
              </div>
            ) : (
              todos.map(todo => {
                const isEditing = editingId === todo.id;
                return (
                  <div className="rt-item" role="listitem" key={todo.id}>
                    <div className="rt-itemLeft">
                      <input
                        id={`toggle-${todo.id}`}
                        type="checkbox"
                        className="rt-checkbox"
                        checked={todo.completed}
                        onChange={() => toggleCompleted(todo.id)}
                        aria-label={`Mark "${todo.text}" as ${
                          todo.completed ? 'not completed' : 'completed'
                        }`}
                      />

                      {isEditing ? (
                        <input
                          className="rt-input rt-inputInline"
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          aria-label="Edit todo text"
                          autoComplete="off"
                        />
                      ) : (
                        <label
                          className={`rt-itemText ${todo.completed ? 'isCompleted' : ''}`}
                          htmlFor={`toggle-${todo.id}`}
                        >
                          {todo.text}
                        </label>
                      )}
                    </div>

                    <div className="rt-itemActions" aria-label="Todo actions">
                      {isEditing ? (
                        <>
                          <button
                            className="rt-btn rt-btnPrimary"
                            type="button"
                            onClick={() => saveEdit(todo.id)}
                            aria-label="Save edit"
                          >
                            Save
                          </button>
                          <button
                            className="rt-btn rt-btnSecondary"
                            type="button"
                            onClick={cancelEdit}
                            aria-label="Cancel edit"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="rt-btn rt-btnSecondary"
                            type="button"
                            onClick={() => startEdit(todo)}
                            aria-label={`Edit "${todo.text}"`}
                          >
                            Edit
                          </button>
                          <button
                            className="rt-btn rt-btnDanger"
                            type="button"
                            onClick={() => deleteTodo(todo.id)}
                            aria-label={`Delete "${todo.text}"`}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="rt-footerBar">
            <button
              className="rt-btn rt-btnSecondary"
              type="button"
              onClick={clearCompleted}
              disabled={todos.every(t => !t.completed)}
            >
              Clear completed
            </button>
            <div className="rt-footerNote" aria-label="Persistence note">
              Saved locally in your browser
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
