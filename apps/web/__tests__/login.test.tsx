import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LoginForm } from '../components/LoginForm';
import { AuthError, login } from '../services/authService';

jest.mock('../services/authService', () => {
  const actual = jest.requireActual('../services/authService');
  return { ...actual, login: jest.fn() };
});

const mockedLogin = login as jest.MockedFunction<typeof login>;

function renderForm() {
  const onSuccess = jest.fn();
  const user = userEvent.setup();
  render(<LoginForm onSuccess={onSuccess} />);
  return { onSuccess, user };
}

describe('LoginForm', () => {
  beforeEach(() => {
    mockedLogin.mockReset();
  });

  it('renders email and password fields with a submit button', () => {
    renderForm();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows required-field errors and does not submit when empty', async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it('rejects a malformed email address', async () => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it('submits trimmed credentials and reports success', async () => {
    mockedLogin.mockResolvedValue({ role: 'ADMIN' });
    const { user, onSuccess } = renderForm();

    await user.type(screen.getByLabelText('Email'), '  admin@test.com ');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(mockedLogin).toHaveBeenCalledWith({
      email: 'admin@test.com',
      password: 'secret',
    });
    expect(onSuccess).toHaveBeenCalledWith({ role: 'ADMIN' });
  });

  it('shows the server message when authentication fails', async () => {
    mockedLogin.mockRejectedValue(new AuthError('Invalid email or password'));
    const { user, onSuccess } = renderForm();

    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });
});
