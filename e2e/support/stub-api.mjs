// Minimal stand-in for the Spring Boot /api/v1/auth/login endpoint, so E2E runs need no Java or database.
// Tokens are signed the same way as JwtService: HMAC with the base64-decoded JWT_SECRET and a `role` claim.
import { createServer } from 'node:http';
import { SignJWT } from 'jose';

const port = Number(process.env.PORT);
const key = new Uint8Array(Buffer.from(process.env.JWT_SECRET, 'base64'));

const USERS = {
  'admin@test.com': { password: 'admin-password', role: 'ADMIN' },
  'buyer@test.com': { password: 'buyer-password', role: 'BUYER' },
};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ timestamp: new Date().toISOString(), status, ...body }));
}

createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { message: 'ok' });
  }
  if (req.method !== 'POST' || req.url !== '/api/v1/auth/login') {
    return send(res, 404, { message: 'Not found' });
  }

  let raw = '';
  for await (const chunk of req) raw += chunk;
  const { email, password } = JSON.parse(raw || '{}');
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
}).listen(port, () => console.log(`Stub API listening on ${port}`));
