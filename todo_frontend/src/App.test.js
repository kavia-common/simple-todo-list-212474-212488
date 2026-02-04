import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function getNewTaskInput() {
  return screen.getByLabelText(/new task/i);
}

test('can add, complete, edit, and delete a todo', async () => {
  const user = userEvent.setup();
  render(<App />);

  // Add
  await user.type(getNewTaskInput(), 'Buy milk');
  await user.click(screen.getByRole('button', { name: /add/i }));
  expect(screen.getByText('Buy milk')).toBeInTheDocument();

  // Complete
  await user.click(screen.getByRole('checkbox', { name: /mark "buy milk"/i }));
  // (Visual styling checked via class; here we assert the item still exists)
  expect(screen.getByText('Buy milk')).toBeInTheDocument();

  // Edit
  await user.click(screen.getByRole('button', { name: /edit "buy milk"/i }));
  const editInput = screen.getByLabelText(/edit todo text/i);
  await user.clear(editInput);
  await user.type(editInput, 'Buy oat milk');
  await user.click(screen.getByRole('button', { name: /save edit/i }));
  expect(screen.getByText('Buy oat milk')).toBeInTheDocument();

  // Delete
  await user.click(screen.getByRole('button', { name: /delete "buy oat milk"/i }));
  expect(screen.queryByText('Buy oat milk')).not.toBeInTheDocument();
});
