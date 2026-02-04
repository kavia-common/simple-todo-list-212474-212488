import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const STORAGE_KEY = 'retro_todos_v1';

function seedStorage(todos) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function getNewTaskInput() {
  return screen.getByLabelText(/new task/i);
}

function getTodoList() {
  return screen.getByRole('list', { name: /todo list/i });
}

function getTodoRowByText(text) {
  const list = getTodoList();
  // Each todo row is a listitem containing a label with the todo text.
  const label = within(list).getByText(text);
  return label.closest('[role="listitem"]');
}

describe('App todo flows', () => {
  beforeEach(() => {
    // Ensure tests are isolated and do not leak persisted state.
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  test('loads todos from localStorage on first render (persistence load)', () => {
    seedStorage([
      {
        id: 't1',
        text: 'From storage',
        completed: true,
        createdAt: 1,
        updatedAt: 2,
      },
    ]);

    render(<App />);

    expect(screen.getByText('From storage')).toBeInTheDocument();
    // Checkbox accessible name is derived from aria-label in App.js
    const checkbox = screen.getByRole('checkbox', {
      name: /mark "from storage" as not completed/i,
    });
    expect(checkbox).toBeChecked();
  });

  test('can add a todo and persists to localStorage', async () => {
    const setItemSpy = jest.spyOn(window.localStorage.__proto__, 'setItem');

    render(<App />);

    await userEvent.type(getNewTaskInput(), 'Buy milk');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(screen.getByText('Buy milk')).toBeInTheDocument();

    // Persistence: state writes to localStorage via effect.
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalled();
      const last = setItemSpy.mock.calls[setItemSpy.mock.calls.length - 1];
      expect(last[0]).toBe(STORAGE_KEY);
      expect(last[1]).toContain('Buy milk');
    });
  });

  test('can toggle completion via checkbox and reflects checked state', async () => {
    render(<App />);

    await userEvent.type(getNewTaskInput(), 'Toggle me');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    const checkbox = screen.getByRole('checkbox', {
      name: /mark "toggle me" as completed/i,
    });
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);

    // After toggle, aria-label changes and checkbox is checked.
    const checkedBox = screen.getByRole('checkbox', {
      name: /mark "toggle me" as not completed/i,
    });
    expect(checkedBox).toBeChecked();
  });

  test('can edit a todo (start edit -> update text -> save)', async () => {
    render(<App />);

    await userEvent.type(getNewTaskInput(), 'Buy milk');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    const row = getTodoRowByText('Buy milk');
    expect(row).toBeTruthy();

    await userEvent.click(
      within(row).getByRole('button', { name: /edit "buy milk"/i })
    );

    const editInput = screen.getByLabelText(/edit todo text/i);
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Buy oat milk');

    await userEvent.click(screen.getByRole('button', { name: /save edit/i }));

    expect(screen.getByText('Buy oat milk')).toBeInTheDocument();
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
  });

  test('can delete a todo', async () => {
    render(<App />);

    await userEvent.type(getNewTaskInput(), 'Trash me');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(screen.getByText('Trash me')).toBeInTheDocument();

    const row = getTodoRowByText('Trash me');
    await userEvent.click(
      within(row).getByRole('button', { name: /delete "trash me"/i })
    );

    expect(screen.queryByText('Trash me')).not.toBeInTheDocument();
  });

  test('delete while editing cancels edit mode', async () => {
    render(<App />);

    await userEvent.type(getNewTaskInput(), 'Edit then delete');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    const row = getTodoRowByText('Edit then delete');
    await userEvent.click(
      within(row).getByRole('button', { name: /edit "edit then delete"/i })
    );

    expect(screen.getByLabelText(/edit todo text/i)).toBeInTheDocument();

    await userEvent.click(
      within(row).getByRole('button', { name: /delete "edit then delete"/i })
    );

    expect(screen.queryByLabelText(/edit todo text/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Edit then delete')).not.toBeInTheDocument();
  });
});
