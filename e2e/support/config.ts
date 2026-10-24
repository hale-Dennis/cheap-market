// Shared by playwright.config.ts and the specs. The stub API (stub-api.mjs) reads the same values from env.
export const WEB_PORT = 3100;
export const STUB_API_PORT = 3101;
export const BASE_URL = `http://localhost:${WEB_PORT}`;

// Base64 test key, used by both the web app and the stub API, as JWT_SECRET is in production.
export const E2E_JWT_SECRET =
  'ZTJlLXRlc3Qtc2VjcmV0LWtleS1mb3ItcGxheXdyaWdodC1ydW5zLTEyMzQ1Ng==';

export const ADMIN = { email: 'admin@test.com', password: 'admin-password' };
export const BUYER = { email: 'buyer@test.com', password: 'buyer-password' };
