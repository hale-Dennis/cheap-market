import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { REGIONS, type Farmer } from '@cheap-market/shared-types';

import { CreateFarmerForm } from '../components/farmers/CreateFarmerForm';
import { ApiError } from '../services/apiClient';
import { createFarmer } from '../services/farmerService';

jest.mock('../services/farmerService', () => ({ createFarmer: jest.fn() }));

const mockedCreateFarmer = createFarmer as jest.MockedFunction<typeof createFarmer>;

const FARMER: Farmer = {
  id: 'f-1',
  fullName: 'Ama Mensah',
  email: 'ama@test.com',
  phoneNumber: '+233241234567',
  region: 'ASHANTI',
  accountStatus: 'ACTIVE',
  createdAt: '2026-10-24T12:00:00Z',
};

function renderForm() {
  const onCreated = jest.fn();
  const user = userEvent.setup();
  render(<CreateFarmerForm onCreated={onCreated} />);
  return { onCreated, user };
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Full name'), 'Ama Mensah');
  await user.selectOptions(screen.getByLabelText('Home region'), 'ASHANTI');
  await user.type(screen.getByLabelText('Phone number'), '024 123 4567');
  await user.type(screen.getByLabelText('Email'), 'ama@test.com');
}

describe('CreateFarmerForm', () => {
  beforeEach(() => {
    mockedCreateFarmer.mockReset();
  });

  it('offers every Ghanaian region in the region select', () => {
    renderForm();

    const options = screen.getAllByRole('option').filter((option) => !option.hasAttribute('disabled'));
    expect(options.map((option) => option.getAttribute('value'))).toEqual(
      REGIONS.map((region) => region.code),
    );
  });

  it('shows required-field errors and does not submit an empty form', async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Create farmer' }));

    expect(await screen.findByText('Full name is required.')).toBeInTheDocument();
    expect(screen.getByText('Select a region.')).toBeInTheDocument();
    expect(screen.getByText('Phone number is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveAttribute('aria-invalid', 'true');
    expect(mockedCreateFarmer).not.toHaveBeenCalled();
  });

  it('rejects an invalid phone number and email', async () => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText('Full name'), 'Ama Mensah');
    await user.selectOptions(screen.getByLabelText('Home region'), 'ASHANTI');
    await user.type(screen.getByLabelText('Phone number'), '12345');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Create farmer' }));

    expect(
      await screen.findByText('Enter a valid Ghanaian phone number, e.g. 024 123 4567.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(mockedCreateFarmer).not.toHaveBeenCalled();
  });

  it('submits valid details and reports the created farmer', async () => {
    mockedCreateFarmer.mockResolvedValue(FARMER);
    const { user, onCreated } = renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create farmer' }));

    expect(mockedCreateFarmer).toHaveBeenCalledWith({
      fullName: 'Ama Mensah',
      region: 'ASHANTI',
      phoneNumber: '024 123 4567',
      email: 'ama@test.com',
    });
    expect(onCreated).toHaveBeenCalledWith(FARMER);
  });

  it('shows the server message when the farmer already exists', async () => {
    mockedCreateFarmer.mockRejectedValue(
      new ApiError('A user with this phone number already exists.', 409),
    );
    const { user, onCreated } = renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create farmer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A user with this phone number already exists.',
    );
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Create farmer' })).toBeEnabled();
  });
});
