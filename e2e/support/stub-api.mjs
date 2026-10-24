// Minimal stand-in for the Spring Boot API, so E2E runs need no Java or database.
// Tokens are signed the same way as JwtService: HMAC with the base64-decoded JWT_SECRET and a `role` claim.
// Farmers live in memory for the lifetime of the process.
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { SignJWT, jwtVerify } from 'jose';

const port = Number(process.env.PORT);
const key = new Uint8Array(Buffer.from(process.env.JWT_SECRET, 'base64'));

const USERS = {
  'admin@test.com': { password: 'admin-password', role: 'ADMIN' },
  'buyer@test.com': { password: 'buyer-password', role: 'BUYER' },
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

async function roleFromRequest(req) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), key);
    return payload.role;
  } catch {
    return null;
  }
}

function normalizePhone(raw) {
  const digits = String(raw ?? '').trim().replace(/[\s\-()]/g, '');
  const match = /^\+?233(\d{9})$/.exec(digits) ?? /^0(\d{9})$/.exec(digits);
  return match ? `+233${match[1]}` : null;
}

async function login(req, res) {
  const { email, password } = await readJson(req);
  const user = USERS[email];
  if (!user || user.password !== password) {
    return send(res, 401, { message: 'Invalid email or password' });
  }
  const accessToken = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
  return send(res, 200, {
    message: 'Login successful',
    data: { accessToken, refreshToken: 'stub-refresh-token' },
  });
}

async function createFarmer(req, res) {
  const body = await readJson(req);
  const email = String(body.email ?? '').trim().toLowerCase();
  const phoneNumber = normalizePhone(body.phoneNumber);
  if (!body.fullName || !email || !phoneNumber || !body.region) {
    return send(res, 400, { message: 'Validation failed' });
  }
  if (farmers.some((farmer) => farmer.email === email)) {
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
  if (url.pathname === '/api/v1/admin/farmers') {
    const role = await roleFromRequest(req);
    if (!role) return send(res, 401, { message: 'Authentication is required to access this resource.' });
    if (role !== 'ADMIN') return send(res, 403, { message: 'You do not have permission to access this resource.' });
    if (req.method === 'POST') return createFarmer(req, res);
    if (req.method === 'GET') return listFarmers(url, res);
  }
  return send(res, 404, { message: 'Not found' });
}).listen(port, () => console.log(`Stub API listening on ${port}`));
