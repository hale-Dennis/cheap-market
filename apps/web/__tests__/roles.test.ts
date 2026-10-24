import { destinationAfterSignIn, homeForRole, roleForPath } from '../lib/roles';

describe('roles', () => {
  it('maps each role to its home page', () => {
    expect(homeForRole('ADMIN')).toBe('/admin');
    expect(homeForRole('BUYER')).toBe('/buyer/profile');
    expect(homeForRole('FARMER')).toBe('/');
  });

  it.each([
    ['/admin', 'ADMIN'],
    ['/admin/farmers', 'ADMIN'],
    ['/buyer/profile', 'BUYER'],
    ['/administrator', null],
    ['/buyers', null],
    ['/', null],
  ])('roleForPath(%p) is %p', (path, role) => {
    expect(roleForPath(path)).toBe(role);
  });

  it.each([
    ['ADMIN', '/admin/farmers?page=2', '/admin/farmers?page=2'],
    ['ADMIN', undefined, '/admin'],
    ['ADMIN', '/buyer/profile', '/admin'],
    ['BUYER', '/buyer/profile', '/buyer/profile'],
    ['BUYER', '/admin', '/buyer/profile'],
    ['BUYER', '//evil.example', '/buyer/profile'],
    ['BUYER', '/', '/'],
  ] as const)('destinationAfterSignIn(%p, %p) is %p', (role, next, expected) => {
    expect(destinationAfterSignIn(role, next)).toBe(expected);
  });
});
