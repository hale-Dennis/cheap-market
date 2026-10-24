// Minimal stand-in for the Spring Boot API, so E2E runs need no Java or database.
// Tokens are signed the same way as JwtService: HMAC with the base64-decoded JWT_SECRET and a `role` claim.
// Farmers live in memory for the lifetime of the process.
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { SignJWT, jwtVerify } from 'jose';

const port = Number(process.env.PORT);
const key = new Uint8Array(Buffer.from(process.env.JWT_SECRET, 'base64'));

// Keyed by lower-cased email. Buyers registered through /auth/register are added here.
const USERS = {
  'admin@test.com': { password: 'admin-password', role: 'ADMIN' },
  'buyer@test.com': {
    password: 'buyer-password',
    role: 'BUYER',
    fullName: 'Test Buyer',
    region: 'ASHANTI',
    deliveryAddress: null,
  },
};

const farmers = [];

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ timestamp: new Date().toISOString(), status, ...body }));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || '{}');
}

async function sessionFromRequest(req) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), key);
    return { email: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

function normalizePhone(raw) {
  const digits = String(raw ?? '').trim().replace(/[\s\-()]/g, '');
  const match = /^\+?233(\d{9})$/.exec(digits) ?? /^0(\d{9})$/.exec(digits);
  return match ? `+233${match[1]}` : null;
}

async function tokensFor(email, role) {
  const accessToken = await new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
  return { accessToken, refreshToken: 'stub-refresh-token' };
}

async function login(req, res) {
  const body = await readJson(req);
  const email = String(body.email ?? '').trim().toLowerCase();
  const user = USERS[email];
  if (!user || user.password !== body.password) {
    return send(res, 401, { message: 'Invalid email or password' });
  }
  return send(res, 200, { message: 'Login successful', data: await tokensFor(email, user.role) });
}

async function registerBuyer(req, res) {
  const body = await readJson(req);
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!body.fullName || !email || !body.region || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return send(res, 400, { message: 'Validation failed' });
  }
  if (USERS[email]) {
    return send(res, 409, { message: 'A user with this email already exists.' });
  }
  USERS[email] = {
    password,
    role: 'BUYER',
    fullName: String(body.fullName).trim(),
    region: body.region,
    deliveryAddress: null,
  };
  return send(res, 201, { message: 'Buyer registered successfully.', data: await tokensFor(email, 'BUYER') });
}

function buyerProfile(email) {
  const { fullName, region, deliveryAddress } = USERS[email];
  return { fullName, email, region, deliveryAddress };
}

async function updateBuyerProfile(req, res, email) {
  const body = await readJson(req);
  const address = body.deliveryAddress;
  if (!body.fullName || !body.region || (address && (!address.street || !address.town))) {
    return send(res, 400, { message: 'Validation failed' });
  }
  Object.assign(USERS[email], {
    fullName: String(body.fullName).trim(),
    region: body.region,
    deliveryAddress: address
      ? { street: address.street, town: address.town, gpsAddress: address.gpsAddress || null }
      : null,
  });
  return send(res, 200, { message: 'Profile updated successfully.', data: buyerProfile(email) });
}

async function createFarmer(req, res) {
  const body = await readJson(req);
  const email = String(body.email ?? '').trim().toLowerCase() || null;
  const phoneNumber = normalizePhone(body.phoneNumber);
  if (!body.fullName || !phoneNumber || !body.region) {
    return send(res, 400, { message: 'Validation failed' });
  }
  if (email && farmers.some((farmer) => farmer.email === email)) {
    return send(res, 409, { message: 'A user with this email already exists.' });
  }
  if (farmers.some((farmer) => farmer.phoneNumber === phoneNumber)) {
    return send(res, 409, { message: 'A user with this phone number already exists.' });
  }
  const farmer = {
    id: randomUUID(),
    fullName: String(body.fullName).trim(),
    email,
    phoneNumber,
    region: body.region,
    accountStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };
  farmers.unshift(farmer);
  return send(res, 201, { message: 'Farmer account created successfully.', data: farmer });
}

function listFarmers(url, res) {
  const page = Number(url.searchParams.get('page') ?? 0);
  const size = Number(url.searchParams.get('size') ?? 20);
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1 || size > 100) {
    return send(res, 400, { message: 'Validation failed: invalid page or size' });
  }
  const content = farmers.slice(page * size, (page + 1) * size);
  return send(res, 200, {
    message: 'Successfully retrieved farmer list.',
    data: {
      content,
      currentPage: page,
      totalPages: Math.ceil(farmers.length / size),
      totalElements: farmers.length,
      size,
    },
  });
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return send(res, 200, { message: 'ok' });
  }
  if (req.method === 'POST' && url.pathname === '/api/v1/auth/login') {
    return login(req, res);
  }
  if (req.method === 'POST' && url.pathname === '/api/v1/auth/register') {
    return registerBuyer(req, res);
  }
  if (url.pathname === '/api/v1/buyer/profile') {
    const session = await sessionFromRequest(req);
    if (!session) return send(res, 401, { message: 'Authentication is required to access this resource.' });
    if (session.role !== 'BUYER') return send(res, 403, { message: 'You do not have permission to access this resource.' });
    if (req.method === 'GET') return send(res, 200, { message: 'Profile retrieved successfully.', data: buyerProfile(session.email) });
    if (req.method === 'PUT') return updateBuyerProfile(req, res, session.email);
  }
  if (url.pathname === '/api/v1/admin/farmers') {
    const role = (await sessionFromRequest(req))?.role;
    if (!role) return send(res, 401, { message: 'Authentication is required to access this resource.' });
    if (role !== 'ADMIN') return send(res, 403, { message: 'You do not have permission to access this resource.' });
    if (req.method === 'POST') return createFarmer(req, res);
    if (req.method === 'GET') return listFarmers(url, res);
  }
  return send(res, 404, { message: 'Not found' });
}).listen(port, () => console.log(`Stub API listening on ${port}`));
