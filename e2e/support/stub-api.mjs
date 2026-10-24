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
const categories = [];
const products = [];

async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/** Accepts 1–5 parts named "files" and returns fake media URLs (content is not stored). */
async function uploadImages(req, res, url) {
  const farmerId = url.searchParams.get('farmerId');
  if (!farmers.some((f) => f.id === farmerId)) {
    return send(res, 404, { message: `Farmer not found with id: ${farmerId}` });
  }
  const body = (await readRaw(req)).toString('latin1');
  const count = (body.match(/name="files"; filename=/g) ?? []).length;
  if (count === 0) return send(res, 400, { message: 'Select at least one image.' });
  if (count > 5) return send(res, 400, { message: 'A listing can have at most 5 images.' });
  const urls = Array.from({ length: count }, () => `/api/v1/media/${randomUUID()}.jpg`);
  return send(res, 201, { message: 'Images uploaded successfully.', data: { urls } });
}

// Any media URL serves this 1×1 PNG, so listing photos render in the browser.
const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const REGIONS = ['AHAFO', 'ASHANTI', 'BONO', 'BONO_EAST', 'CENTRAL', 'EASTERN', 'GREATER_ACCRA', 'NORTH_EAST',
  'NORTHERN', 'OTI', 'SAVANNAH', 'UPPER_EAST', 'UPPER_WEST', 'VOLTA', 'WESTERN', 'WESTERN_NORTH'];

/** Public catalog: active listings whose farmer is in the region, newest first, 20 per page. */
function listCatalog(url, res) {
  const region = url.searchParams.get('region');
  if (!REGIONS.includes(region)) {
    return send(res, 400, { message: "Validation failed: region: Region must be one of Ghana's regions" });
  }
  const categoryId = url.searchParams.get('categoryId');
  const page = Number(url.searchParams.get('page') ?? 0);
  const size = Number(url.searchParams.get('size') ?? 20);
  const matching = products
    .filter((p) => p.listingStatus === 'ACTIVE')
    .filter((p) => farmers.find((f) => f.id === p.farmerId)?.region === region)
    .filter((p) => !categoryId || p.categoryId === categoryId)
    .reverse();
  const content = matching.slice(page * size, (page + 1) * size).map((p) => ({
    id: p.id,
    name: p.name,
    priceCents: p.priceCents,
    unit: p.unit,
    primaryImageUrl: p.imageUrls[0] ?? null,
    harvestDate: p.harvestDate,
    farmerName: farmers.find((f) => f.id === p.farmerId)?.fullName,
    categoryName: categories.find((c) => c.id === p.categoryId)?.name,
  }));
  return send(res, 200, {
    message: 'Products retrieved successfully.',
    data: { content, currentPage: page, totalPages: Math.ceil(matching.length / size), totalElements: matching.length, size },
  });
}

function productDetail(id) {
  const product = products.find((p) => p.id === id && p.listingStatus === 'ACTIVE');
  if (!product) return null;
  const farmer = farmers.find((f) => f.id === product.farmerId);
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    unit: product.unit,
    harvestDate: product.harvestDate,
    imageUrls: product.imageUrls,
    categoryName: categories.find((c) => c.id === product.categoryId)?.name,
    farmer: { fullName: farmer.fullName, region: farmer.region, averageRating: null, ratingCount: 0 },
  };
}

const pickupLocations = [];
const DELIVERY_FEE_CENTS = 1000;

const orders = [];
const notifications = [];

function orderNumber() {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  return 'CM-' + Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

/** Mirrors OrderService.placeOrder: idempotent per buyer+key, validates cart and fulfillment. */
async function placeOrder(req, res, email) {
  const key = req.headers['idempotency-key'] ?? null;
  const existing = key && orders.find((o) => o.buyerEmail === email && o.idempotencyKey === key);
  if (existing) {
    return send(res, 200, { message: 'This order was already placed.', data: { orderId: existing.id, orderNumber: existing.orderNumber, duplicate: true } });
  }
  const body = await readJson(req);
  const cart = cartFor(email);
  if (cart.items.length === 0) return send(res, 400, { code: 'EMPTY_CART', message: 'Your cart is empty.' });
  const unavailable = cart.items.filter((i) => !i.available).map((i) => i.name);
  if (unavailable.length) {
    return send(res, 422, { code: 'UNAVAILABLE_ITEMS', message: `Some items are no longer available: ${unavailable.join(', ')}. Remove them from your cart.` });
  }
  const buyer = USERS[email];
  let pickupLocation = null;
  let deliveryAddress = null;
  if (body.fulfillmentType === 'PICKUP') {
    pickupLocation = pickupLocations.find((l) => l.id === body.pickupLocationId);
    if (!pickupLocation) return send(res, 400, { code: 'PICKUP_LOCATION_REQUIRED', message: 'Choose a pickup point.' });
    if (pickupLocation.region !== buyer.region) {
      return send(res, 422, { code: 'PICKUP_LOCATION_OUT_OF_REGION', message: 'Choose a pickup point in your region.' });
    }
  } else {
    if (!buyer.deliveryAddress) return send(res, 422, { code: 'DELIVERY_ADDRESS_REQUIRED', message: 'Add a delivery address to your profile first.' });
    deliveryAddress = { ...buyer.deliveryAddress };
  }
  const deliveryFeeCents = body.fulfillmentType === 'DELIVERY' ? DELIVERY_FEE_CENTS : 0;
  const order = {
    id: randomUUID(),
    orderNumber: orderNumber(),
    buyerEmail: email,
    idempotencyKey: key,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    items: cart.items.map((i) => ({
      productId: i.productId, name: i.name, unit: i.unit, quantity: i.quantity,
      priceAtPurchaseCents: i.priceCents, lineTotalCents: i.lineTotalCents,
    })),
    itemsSubtotalCents: cart.subtotalCents,
    deliveryFeeCents,
    finalTotalCents: cart.subtotalCents + deliveryFeeCents,
    fulfillmentType: body.fulfillmentType,
    deliveryAddress,
    pickupLocation,
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  carts.set(email, new Map());
  notifications.unshift({
    id: randomUUID(), type: 'NEW_ORDER', orderId: order.id, createdAt: order.createdAt, read: false,
    message: `New order ${order.orderNumber} from ${buyer.fullName}: ${cart.totalItems} items, GH₵ ${(order.finalTotalCents / 100).toFixed(2)}.`,
  });
  return send(res, 201, { message: 'Order placed successfully.', data: { orderId: order.id, orderNumber: order.orderNumber, duplicate: false } });
}

// Carts keyed by buyer email: productId -> quantity.
const carts = new Map();

function cartFor(email) {
  const items = [...(carts.get(email) ?? new Map())].map(([productId, quantity]) => {
    const product = products.find((p) => p.id === productId);
    return {
      productId,
      name: product.name,
      unit: product.unit,
      farmerName: farmers.find((f) => f.id === product.farmerId)?.fullName,
      priceCents: product.priceCents,
      quantity,
      lineTotalCents: product.priceCents * quantity,
      primaryImageUrl: product.imageUrls[0] ?? null,
      available: product.listingStatus === 'ACTIVE',
    };
  });
  return {
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: items.filter((i) => i.available).reduce((sum, item) => sum + item.lineTotalCents, 0),
  };
}

async function handleCart(req, res, email) {
  if (req.method === 'POST') {
    const { productId, quantity } = await readJson(req);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return send(res, 400, { message: 'Validation failed: quantity: Quantity must be between 1 and 99' });
    }
    if (!products.some((p) => p.id === productId)) return send(res, 404, { message: `Product not found with id: ${productId}` });
    if (!productDetail(productId)) {
      return send(res, 422, { code: 'INACTIVE_PRODUCT', message: 'This product is no longer available and cannot be added to the cart.' });
    }
    if (!carts.has(email)) carts.set(email, new Map());
    carts.get(email).set(productId, quantity);
    return send(res, 200, { message: 'Cart updated successfully.', data: cartFor(email) });
  }
  if (req.method === 'DELETE') {
    carts.set(email, new Map());
    return send(res, 200, { message: 'Cart cleared successfully.', data: cartFor(email) });
  }
  return send(res, 200, { message: 'Cart retrieved successfully.', data: cartFor(email) });
}

async function handleProducts(req, res) {
  if (req.method === 'GET') {
    return send(res, 200, { message: 'Admin products retrieved successfully.', data: { content: products } });
  }
  const body = await readJson(req);
  if (!farmers.some((f) => f.id === body.farmerId)) {
    return send(res, 404, { message: `Farmer not found with id: ${body.farmerId}` });
  }
  if (!categories.some((c) => c.id === body.categoryId)) {
    return send(res, 404, { message: `Category not found with id: ${body.categoryId}` });
  }
  const images = body.imageUrls ?? [];
  if (!body.name || !(body.priceCents > 0) || !body.unit || !body.harvestDate || images.length < 1 || images.length > 5) {
    return send(res, 400, { message: 'Validation failed' });
  }
  if (images.some((u) => !String(u).startsWith('/api/v1/media/'))) {
    return send(res, 400, { message: 'Images must be uploaded through the image upload endpoint.' });
  }
  const product = {
    id: randomUUID(),
    ...body,
    description: body.description ?? null,
    stockQuantity: 0,
    listingStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };
  products.push(product);
  return send(res, 201, { message: 'Product listing created successfully.', data: product });
}

function normalizeCategoryName(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ');
}

function categoryNameError(name) {
  if (!name) return 'Validation failed: name: Category name cannot be blank';
  if (name.length > 50) return 'Validation failed: name: Category name must not exceed 50 characters';
  return null;
}

function categoryNameTaken(name, exceptId) {
  return categories.some((c) => c.id !== exceptId && c.name.toLowerCase() === name.toLowerCase());
}

async function handleCategories(req, res, id) {
  if (!id && req.method === 'GET') {
    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return send(res, 200, { message: 'Categories retrieved successfully.', data: sorted });
  }
  if (!id && req.method === 'POST') {
    const name = normalizeCategoryName((await readJson(req)).name);
    const error = categoryNameError(name);
    if (error) return send(res, 400, { message: error });
    if (categoryNameTaken(name)) return send(res, 409, { message: 'A category with this name already exists.' });
    const category = { id: randomUUID(), name };
    categories.push(category);
    return send(res, 201, { message: 'Category created successfully.', data: category });
  }
  const category = categories.find((c) => c.id === id);
  if (!category) return send(res, 404, { message: `Category not found with id: ${id}` });
  if (req.method === 'PUT') {
    const name = normalizeCategoryName((await readJson(req)).name);
    const error = categoryNameError(name);
    if (error) return send(res, 400, { message: error });
    if (categoryNameTaken(name, id)) return send(res, 409, { message: 'A category with this name already exists.' });
    category.name = name;
    return send(res, 200, { message: 'Category updated successfully.', data: category });
  }
  if (req.method === 'DELETE') {
    categories.splice(categories.indexOf(category), 1);
    res.writeHead(204);
    return res.end();
  }
  return send(res, 405, { message: 'Method not allowed' });
}

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
  if (req.method === 'GET' && url.pathname.startsWith('/api/v1/media/')) {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    return res.end(PIXEL_PNG);
  }
  if (req.method === 'GET' && url.pathname === '/api/v1/products') {
    return listCatalog(url, res);
  }
  const detailMatch = /^\/api\/v1\/products\/([^/]+)$/.exec(url.pathname);
  if (req.method === 'GET' && detailMatch) {
    const detail = productDetail(detailMatch[1]);
    return detail
      ? send(res, 200, { message: 'Product details retrieved successfully.', data: detail })
      : send(res, 404, { message: `Product not found with id: ${detailMatch[1]}` });
  }
  if (url.pathname === '/api/v1/orders' && req.method === 'POST') {
    const session = await sessionFromRequest(req);
    if (!session) return send(res, 401, { message: 'Authentication is required to access this resource.' });
    if (session.role !== 'BUYER') return send(res, 403, { message: 'You do not have permission to access this resource.' });
    return placeOrder(req, res, session.email);
  }
  const orderMatch = /^\/api\/v1\/orders\/([^/]+)$/.exec(url.pathname);
  if (orderMatch && req.method === 'GET') {
    const session = await sessionFromRequest(req);
    if (!session) return send(res, 401, { message: 'Authentication is required to access this resource.' });
    const order = orders.find((o) => o.id === orderMatch[1] && o.buyerEmail === session.email);
    if (!order) return send(res, 404, { message: 'Order not found' });
    const { buyerEmail, idempotencyKey, ...detail } = order;
    return send(res, 200, { message: 'Order details retrieved successfully.', data: detail });
  }
  if (url.pathname.startsWith('/api/v1/admin/notifications')) {
    if ((await sessionFromRequest(req))?.role !== 'ADMIN') return send(res, 403, { message: 'Forbidden' });
    if (req.method === 'GET') {
      return send(res, 200, { message: 'Notifications retrieved successfully.', data: {
        unreadCount: notifications.filter((n) => !n.read).length, notifications: notifications.slice(0, 20) } });
    }
    const readMatch = /\/notifications\/([^/]+)\/read$/.exec(url.pathname);
    if (url.pathname.endsWith('/read-all')) notifications.forEach((n) => { n.read = true; });
    else if (readMatch) { const n = notifications.find((x) => x.id === readMatch[1]); if (n) n.read = true; }
    res.writeHead(204);
    return res.end();
  }
  const cartItemMatch = /^\/api\/v1\/cart\/items\/([^/]+)$/.exec(url.pathname);
  if (cartItemMatch && req.method === 'DELETE') {
    const session = await sessionFromRequest(req);
    if (!session) return send(res, 401, { message: 'Authentication is required to access this resource.' });
    carts.get(session.email)?.delete(cartItemMatch[1]);
    return send(res, 200, { message: 'Item removed from cart successfully.', data: cartFor(session.email) });
  }
  if (url.pathname === '/api/v1/cart') {
    const session = await sessionFromRequest(req);
    if (!session) return send(res, 401, { message: 'Authentication is required to access this resource.' });
    if (session.role !== 'BUYER') return send(res, 403, { message: 'You do not have permission to access this resource.' });
    return handleCart(req, res, session.email);
  }
  if (req.method === 'GET' && url.pathname === '/api/v1/delivery-fees') {
    const region = url.searchParams.get('region');
    if (!REGIONS.includes(region)) return send(res, 400, { message: 'Validation failed: region' });
    return send(res, 200, { message: 'Delivery fee retrieved successfully.', data: { region, feeCents: DELIVERY_FEE_CENTS } });
  }
  if (url.pathname === '/api/v1/pickup-locations') {
    const session = await sessionFromRequest(req);
    if (!session) return send(res, 401, { message: 'Authentication is required to access this resource.' });
    const region = url.searchParams.get('region');
    const data = pickupLocations.filter((l) => l.region === region).sort((a, b) => a.name.localeCompare(b.name));
    return send(res, 200, { message: 'Pickup locations retrieved successfully.', data });
  }
  if (req.method === 'POST' && url.pathname === '/api/v1/admin/pickup-locations') {
    if ((await sessionFromRequest(req))?.role !== 'ADMIN') return send(res, 403, { message: 'Forbidden' });
    const location = { id: randomUUID(), operatingHours: null, ...(await readJson(req)) };
    pickupLocations.push(location);
    return send(res, 201, { message: 'Pickup location created successfully.', data: location });
  }
  if (req.method === 'GET' && url.pathname === '/api/v1/categories') {
    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return send(res, 200, { message: 'Categories retrieved successfully.', data: sorted });
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
  if (url.pathname === '/api/v1/admin/uploads/images' || url.pathname === '/api/v1/admin/products') {
    const role = (await sessionFromRequest(req))?.role;
    if (!role) return send(res, 401, { message: 'Authentication is required to access this resource.' });
    if (role !== 'ADMIN') return send(res, 403, { message: 'You do not have permission to access this resource.' });
    return url.pathname.endsWith('/images') ? uploadImages(req, res, url) : handleProducts(req, res);
  }
  const categoryMatch = /^\/api\/v1\/admin\/categories(?:\/([^/]+))?$/.exec(url.pathname);
  if (categoryMatch) {
    const role = (await sessionFromRequest(req))?.role;
    if (!role) return send(res, 401, { message: 'Authentication is required to access this resource.' });
    if (role !== 'ADMIN') return send(res, 403, { message: 'You do not have permission to access this resource.' });
    return handleCategories(req, res, categoryMatch[1]);
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
