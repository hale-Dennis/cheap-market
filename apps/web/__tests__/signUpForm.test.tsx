import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SignUpForm } from '../components/auth/SignUpForm';
import { AuthError, register } from '../services/authService';

jest.mock('../services/authService', () => {
  const actual = jest.requireActual('../services/authService');
  return { ...actual, register: jest.fn() };
});

const mockedRegister = register as jest.MockedFunction<typeof register>;

function renderForm() {
  const onSuccess = jest.fn();
  const user = userEvent.setup();
  render(<SignUpForm onSuccess={onSuccess} />);
  return { onSuccess, user };
}

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  {
    password = 'Password123',
    confirmPassword = password,
    email = 'jane@example.com',
  }: { password?: string; confirmPassword?: string; email?: string } = {},
) {
  await user.type(screen.getByLabelText('Full name'), 'Jane Doe');
  await user.type(screen.getByLabelText('Email'), email);
  await user.selectOptions(screen.getByLabelText('Home region'), 'ASHANTI');
  await user.type(screen.getByLabelText('Password'), password);
  await user.type(screen.getByLabelText('Confirm password'), confirmPassword);
}

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Create account' }));

describe('SignUpForm', () => {
  beforeEach(() => {
    mockedRegister.mockReset();
  });

  it('requires every field', async () => {
    const { user } = renderForm();

    await submit(user);

    expect(await screen.findByText('Full name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Select your region.')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(screen.getByText('Confirm your password.')).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it.each([
    ['password123', 'Password must contain at least one uppercase letter.'],
    ['PASSWORDABC', 'Password must contain at least one number.'],
    ['Pass1', 'Password must be at least 8 characters.'],
  ])('rejects the weak password %p', async (password, message) => {
    const { user } = renderForm();

    await fill(user, { password });
    await submit(user);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords', async () => {
    const { user } = renderForm();

    await fill(user, { password: 'Password123', confirmPassword: 'Password124' });
    await submit(user);

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('aria-invalid', 'true');
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    const { user } = renderForm();

    await fill(user, { email: 'jane@localhost' });
    await submit(user);

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('registers without sending the confirmation field and reports success', async () => {
    mockedRegister.mockResolvedValue({ role: 'BUYER' });
    const { user, onSuccess } = renderForm();

    await fill(user);
    await submit(user);

    expect(mockedRegister).toHaveBeenCalledWith({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Password123',
      region: 'ASHANTI',
    });
    expect(onSuccess).toHaveBeenCalledWith({ role: 'BUYER' });
  });

  it('shows the API message when the email is already registered', async () => {
    mockedRegister.mockRejectedValue(new AuthError('A user with this email already exists.'));
    const { user, onSuccess } = renderForm();

    await fill(user);
    await submit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A user with this email already exists.',
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
  });
});
