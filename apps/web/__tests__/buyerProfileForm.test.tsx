import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BuyerProfile } from '@cheap-market/shared-types';

import { BuyerProfileForm } from '../components/buyer/BuyerProfileForm';
import { ApiError } from '../services/apiClient';
import { updateBuyerProfile } from '../services/buyerService';

jest.mock('../services/buyerService', () => ({ updateBuyerProfile: jest.fn() }));

const mockedUpdate = updateBuyerProfile as jest.MockedFunction<typeof updateBuyerProfile>;

const NEW_BUYER: BuyerProfile = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  region: 'ASHANTI',
  deliveryAddress: null,
};

function renderForm(profile: BuyerProfile = NEW_BUYER) {
  const onSaved = jest.fn();
  const user = userEvent.setup();
  render(<BuyerProfileForm profile={profile} onSaved={onSaved} />);
  return { onSaved, user };
}

const save = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Save changes' }));

describe('BuyerProfileForm', () => {
  beforeEach(() => {
    mockedUpdate.mockReset();
  });

  it('shows the current details with the email read-only', () => {
    renderForm({
      ...NEW_BUYER,
      deliveryAddress: { street: '123 Market Rd', town: 'Kumasi', gpsAddress: 'AK-123-4567' },
    });

    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Email' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveValue('Jane Doe');
    expect(screen.getByLabelText('Home region')).toHaveValue('ASHANTI');
    expect(screen.getByLabelText('Street address')).toHaveValue('123 Market Rd');
    expect(screen.getByLabelText('Town / city')).toHaveValue('Kumasi');
    expect(screen.getByLabelText('GPS address (optional)')).toHaveValue('AK-123-4567');
  });

  it('disables saving until something changes', async () => {
    const { user } = renderForm();

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    await user.type(screen.getByLabelText('Town / city'), 'Kumasi');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  it('saves a new delivery address, normalising the GPS address', async () => {
    const saved: BuyerProfile = {
      ...NEW_BUYER,
      deliveryAddress: { street: '123 Market Rd', town: 'Kumasi', gpsAddress: 'AK-123-4567' },
    };
    mockedUpdate.mockResolvedValue(saved);
    const { user, onSaved } = renderForm();

    await user.type(screen.getByLabelText('Street address'), '123 Market Rd');
    await user.type(screen.getByLabelText('Town / city'), 'Kumasi');
    await user.type(screen.getByLabelText('GPS address (optional)'), 'ak-123-4567');
    await save(user);

    expect(mockedUpdate).toHaveBeenCalledWith({
      fullName: 'Jane Doe',
      region: 'ASHANTI',
      deliveryAddress: { street: '123 Market Rd', town: 'Kumasi', gpsAddress: 'AK-123-4567' },
    });
    expect(onSaved).toHaveBeenCalledWith(saved);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('requires street and town once any address field is filled', async () => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText('GPS address (optional)'), 'AK-123-4567');
    await save(user);

    expect(await screen.findByText('Street is required for a delivery address.')).toBeInTheDocument();
    expect(screen.getByText('Town is required for a delivery address.')).toBeInTheDocument();
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('rejects a malformed GPS address', async () => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText('Street address'), '1 Main St');
    await user.type(screen.getByLabelText('Town / city'), 'Ho');
    await user.type(screen.getByLabelText('GPS address (optional)'), '12345');
    await save(user);

    expect(await screen.findByText('Use the format AK-484-9321.')).toBeInTheDocument();
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('removes the address when every address field is cleared', async () => {
    mockedUpdate.mockResolvedValue(NEW_BUYER);
    const { user } = renderForm({
      ...NEW_BUYER,
      deliveryAddress: { street: '1 Main St', town: 'Ho', gpsAddress: null },
    });

    await user.clear(screen.getByLabelText('Street address'));
    await user.clear(screen.getByLabelText('Town / city'));
    await save(user);

    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ deliveryAddress: null }),
    );
  });

  it('shows the API message when saving fails', async () => {
    mockedUpdate.mockRejectedValue(new ApiError('Validation failed: region: invalid', 400));
    const { user } = renderForm();

    await user.selectOptions(screen.getByLabelText('Home region'), 'VOLTA');
    await save(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Validation failed: region: invalid');
  });
});
