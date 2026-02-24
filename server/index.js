import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, query, param, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const serverLog = IS_PRODUCTION ? () => {} : console.log.bind(console);
const serverDebug = IS_PRODUCTION ? () => {} : console.debug.bind(console);

const JWT_SECRET = process.env.JWT_SECRET || (IS_PRODUCTION ? (() => { throw new Error('JWT_SECRET must be set in production'); })() : crypto.randomBytes(64).toString('hex'));
const JWT_EXPIRY = '7d';

function generateToken(user) {
  return jwt.sign({
    userId: user.id,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin || false,
    isSuperAdmin: user.isSuperAdmin || false,
  }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    securityLog('ALERT', 'ADMIN_ACCESS_DENIED', { ip: req._clientIp, userId: req.user?.userId });
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.user || !req.user.isSuperAdmin) {
    securityLog('ALERT', 'SUPER_ADMIN_ACCESS_DENIED', { ip: req._clientIp, userId: req.user?.userId });
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }
  next();
}

const app = express();

app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.paystack.co"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://api.paystack.co", "wss:", "ws:"],
      frameSrc: ["'self'", "https://js.paystack.co"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      frameAncestors: ["'self'", "https://*.replit.dev", "https://*.replit.app", "https://*.repl.co", "https://replit.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: IS_PRODUCTION ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xContentTypeOptions: true,
  xDnsPrefetchControl: { allow: false },
  xDownloadOptions: true,
  xFrameOptions: false,
  xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
  xPoweredBy: false,
}));

app.use((req, res, next) => {
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
  res.set('X-Content-Type-Options', 'nosniff');
  if (IS_PRODUCTION) {
    res.set('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');
  }
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
});

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = [
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/.*\.repl\.co$/,
      /^https?:\/\/.*\.replit\.dev$/,
      /^https?:\/\/.*\.replit\.app$/,
      /^https?:\/\/.*\.repl\.dev$/,
      /^https?:\/\/.*\.wss\.replit\.dev$/,
      /^https?:\/\/(host\.)?xwolf\.space$/,
    ];
    if (allowed.some(re => re.test(origin))) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

const SECURITY_LOG_FILE = path.join(__dirname, 'security.log');

function securityLog(level, event, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details,
  };
  const line = JSON.stringify(entry) + '\n';
  try {
    fs.appendFileSync(SECURITY_LOG_FILE, line);
  } catch (e) {}
  if (!IS_PRODUCTION && (level === 'WARN' || level === 'ALERT')) {
    console.warn(`[SECURITY:${level}] ${event}`, JSON.stringify(details));
  }
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
}

app.use((req, res, next) => {
  req._clientIp = getClientIp(req);
  req._requestId = crypto.randomUUID();
  next();
});

app.use((req, res, next) => {
  const blocked = ['.env', '.git', '.htaccess', 'wp-admin', 'wp-login', 'phpinfo',
    'phpmyadmin', '.php', 'xmlrpc', 'wp-content', 'wp-includes', '.asp', '.aspx',
    'cgi-bin', '.bak', '.sql', '.log', 'debug', '.config', 'web.config',
    '.DS_Store', 'Thumbs.db', '.idea', '.vscode', 'node_modules', '.npmrc',
    'package.json', 'package-lock', '.gitignore', 'tsconfig', 'vite.config',
    'tailwind.config', 'postcss.config', 'server/', 'src/'];
  const lp = req.path.toLowerCase();
  if (blocked.some(p => lp.includes(p))) {
    securityLog('WARN', 'BLOCKED_PATH', { ip: req._clientIp, path: req.path });
    return res.status(404).json({ message: 'Not found' });
  }
  next();
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  keyGenerator: (req) => req._clientIp || getClientIp(req),
  handler: (req, res, next, options) => {
    securityLog('WARN', 'GLOBAL_RATE_LIMIT', { ip: req._clientIp, path: req.path });
    res.status(429).json(options.message);
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  keyGenerator: (req) => req._clientIp || getClientIp(req),
  handler: (req, res, next, options) => {
    securityLog('ALERT', 'AUTH_RATE_LIMIT', { ip: req._clientIp, path: req.path, body_email: req.body?.email });
    res.status(429).json(options.message);
  },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment requests. Please slow down.' },
  keyGenerator: (req) => req._clientIp || getClientIp(req),
  handler: (req, res, next, options) => {
    securityLog('ALERT', 'PAYMENT_RATE_LIMIT', { ip: req._clientIp, path: req.path });
    res.status(429).json(options.message);
  },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many admin requests.' },
  keyGenerator: (req) => req._clientIp || getClientIp(req),
  handler: (req, res, next, options) => {
    securityLog('ALERT', 'ADMIN_RATE_LIMIT', { ip: req._clientIp, path: req.path });
    res.status(429).json(options.message);
  },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many messages. Please wait a moment.' },
  keyGenerator: (req) => req._clientIp || getClientIp(req),
});

const serverCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many server creation requests. Please wait.' },
  keyGenerator: (req) => req._clientIp || getClientIp(req),
  handler: (req, res, next, options) => {
    securityLog('WARN', 'SERVER_CREATE_RATE_LIMIT', { ip: req._clientIp, userId: req.body?.userId });
    res.status(429).json(options.message);
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many registration attempts. Please try again later.' },
  keyGenerator: (req) => req._clientIp || getClientIp(req),
  handler: (req, res, next, options) => {
    securityLog('ALERT', 'REGISTRATION_RATE_LIMIT', { ip: req._clientIp, email: req.body?.email, username: req.body?.username });
    res.status(429).json(options.message);
  },
});

const registrationTracker = new Map();
const REGISTRATION_CLEANUP_INTERVAL = 60 * 60 * 1000;
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [ip, data] of registrationTracker.entries()) {
    if (data.lastAttempt < cutoff) registrationTracker.delete(ip);
  }
}, REGISTRATION_CLEANUP_INTERVAL);

function checkRegistrationAbuse(req, res, next) {
  const ip = req._clientIp || getClientIp(req);
  const now = Date.now();
  const tracker = registrationTracker.get(ip) || { count: 0, firstAttempt: now, lastAttempt: now };

  const windowMs = 24 * 60 * 60 * 1000;
  if (now - tracker.firstAttempt > windowMs) {
    tracker.count = 0;
    tracker.firstAttempt = now;
  }

  tracker.count++;
  tracker.lastAttempt = now;
  registrationTracker.set(ip, tracker);

  if (tracker.count > 5) {
    securityLog('ALERT', 'REGISTRATION_ABUSE_BLOCKED', { ip, count: tracker.count, email: req.body?.email });
    return res.status(429).json({ success: false, message: 'Too many accounts created from this network. Please contact support.' });
  }

  next();
}

app.use('/api/', globalLimiter);

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    securityLog('WARN', 'VALIDATION_FAILED', { ip: req._clientIp, path: req.path, errors: errors.array().map(e => e.msg) });
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
}

function sanitizeString(val) {
  if (typeof val !== 'string') return val;
  return val.replace(/[<>]/g, '').trim();
}

const TASKS_FILE = path.join(__dirname, 'tasks.json');
const FREE_SERVERS_FILE = path.join(__dirname, 'free_servers.json');
const WELCOME_CLAIMS_FILE = path.join(__dirname, 'welcome_claims.json');
const NOTIFICATIONS_FILE = path.join(__dirname, 'notifications.json');

function loadNotifications() {
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      return JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading notifications:', e);
  }
  return {};
}

function saveNotifications(data) {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving notifications:', e);
  }
}

function addNotification(userId, type, title, message) {
  const allNotifs = loadNotifications();
  const key = userId.toString();
  if (!allNotifs[key]) allNotifs[key] = [];
  allNotifs[key].unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  });
  if (allNotifs[key].length > 50) allNotifs[key] = allNotifs[key].slice(0, 50);
  saveNotifications(allNotifs);
}

function loadWelcomeClaims() {
  try {
    if (fs.existsSync(WELCOME_CLAIMS_FILE)) {
      return JSON.parse(fs.readFileSync(WELCOME_CLAIMS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading welcome claims:', e);
  }
  return {};
}

function saveWelcomeClaims(data) {
  try {
    fs.writeFileSync(WELCOME_CLAIMS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving welcome claims:', e);
  }
}

function loadTasks() {
  try {
    if (fs.existsSync(TASKS_FILE)) {
      return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading tasks:', e);
  }
  return {};
}

function saveTasks(data) {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
}

function loadFreeServers() {
  try {
    if (fs.existsSync(FREE_SERVERS_FILE)) {
      return JSON.parse(fs.readFileSync(FREE_SERVERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading free servers:', e);
  }
  return [];
}

function saveFreeServers(data) {
  try {
    fs.writeFileSync(FREE_SERVERS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving free servers:', e);
  }
}

const SPENDING_FILE = path.join(__dirname, 'spending.json');

function loadSpending() {
  try {
    if (fs.existsSync(SPENDING_FILE)) {
      return JSON.parse(fs.readFileSync(SPENDING_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading spending data:', e);
  }
  return [];
}

function saveSpending(records) {
  try {
    fs.writeFileSync(SPENDING_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving spending data:', e);
  }
}

function recordSpending(email, amount, description, serverId) {
  const records = loadSpending();
  records.push({
    email: email.toLowerCase(),
    amount,
    description,
    serverId: serverId?.toString() || '',
    date: new Date().toISOString(),
  });
  saveSpending(records);
}

const REFERRALS_FILE = path.join(__dirname, 'referrals.json');

function loadReferrals() {
  try {
    if (fs.existsSync(REFERRALS_FILE)) {
      return JSON.parse(fs.readFileSync(REFERRALS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading referrals:', e);
  }
  return { codes: {}, referrals: [] };
}

function saveReferrals(data) {
  try {
    fs.writeFileSync(REFERRALS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving referrals:', e);
  }
}

function getReferralCode(userId, email) {
  const data = loadReferrals();
  const existing = Object.entries(data.codes).find(([code, info]) => info.userId === userId.toString());
  if (existing) return existing[0];
  const code = 'WOLF-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  data.codes[code] = { userId: userId.toString(), email: email.toLowerCase(), createdAt: new Date().toISOString() };
  saveReferrals(data);
  return code;
}

function recordReferral(referrerCode, referredUserId, referredEmail, referredUsername) {
  const data = loadReferrals();
  const codeInfo = data.codes[referrerCode];
  if (!codeInfo) return false;
  if (codeInfo.userId === referredUserId.toString()) return false;
  const already = data.referrals.find(r => r.referredUserId === referredUserId.toString());
  if (already) return false;
  data.referrals.push({
    referrerCode,
    referrerUserId: codeInfo.userId,
    referrerEmail: codeInfo.email,
    referredUserId: referredUserId.toString(),
    referredEmail: referredEmail.toLowerCase(),
    referredUsername,
    registeredAt: new Date().toISOString(),
    completed: false,
    completedAt: null,
  });
  saveReferrals(data);
  return true;
}

function completeReferral(referredEmail) {
  const data = loadReferrals();
  const ref = data.referrals.find(r => r.referredEmail === referredEmail.toLowerCase() && !r.completed);
  if (!ref) return null;
  ref.completed = true;
  ref.completedAt = new Date().toISOString();
  saveReferrals(data);
  return ref;
}

function getReferrerStats(userId) {
  const data = loadReferrals();
  const myReferrals = data.referrals.filter(r => r.referrerUserId === userId.toString());
  const completedCount = myReferrals.filter(r => r.completed).length;
  return { total: myReferrals.length, completed: completedCount, referrals: myReferrals };
}

function getTotalSpending(email) {
  const records = loadSpending();
  return records
    .filter(r => r.email === email.toLowerCase())
    .reduce((sum, r) => sum + r.amount, 0);
}

function refundSpending(serverId) {
  const records = loadSpending();
  const updated = records.filter(r => r.serverId !== serverId.toString());
  if (updated.length !== records.length) {
    saveSpending(updated);
    return true;
  }
  return false;
}

const USER_CREDENTIALS_FILE = path.join(__dirname, 'user_credentials.json');

function loadUserCredentials() {
  try {
    if (fs.existsSync(USER_CREDENTIALS_FILE)) {
      return JSON.parse(fs.readFileSync(USER_CREDENTIALS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading user credentials:', e);
  }
  return {};
}

function saveUserCredentials(data) {
  try {
    fs.writeFileSync(USER_CREDENTIALS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving user credentials:', e);
  }
}

function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, storedHash, storedSalt) {
  const { hash } = hashPassword(password, storedSalt);
  return hash === storedHash;
}

function storeUserPassword(email, password) {
  const creds = loadUserCredentials();
  const { hash, salt } = hashPassword(password);
  creds[email.toLowerCase()] = { hash, salt, updatedAt: new Date().toISOString() };
  saveUserCredentials(creds);
}

function checkUserPassword(email, password) {
  const creds = loadUserCredentials();
  const entry = creds[email.toLowerCase()];
  if (!entry) return null;
  return verifyPassword(password, entry.hash, entry.salt);
}

const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const PTERODACTYL_API_URL = process.env.PTERODACTYL_API_URL || 'https://panel.xwolf.space';
const PTERODACTYL_API_KEY = process.env.PTERODACTYL_API_KEY;
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || '';

if (!SUPER_ADMIN_USERNAME) {
  console.error('SUPER_ADMIN_USERNAME is not set');
}

if (!PAYSTACK_SECRET_KEY) {
  console.error('PAYSTACK_SECRET_KEY is not set');
}

if (!PTERODACTYL_API_KEY) {
  console.error('PTERODACTYL_API_KEY is not set');
}

async function paystackFetch(path, options = {}) {
  const response = await fetch(`${PAYSTACK_API_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

async function resolvePaystackCustomer(email) {
  try {
    const res = await paystackFetch(`/customer/${encodeURIComponent(email)}`);
    const data = await res.json();
    if (res.ok && data.status && data.data) {
      return data.data.customer_code || null;
    }
  } catch (e) {}
  return null;
}

async function fetchUserTransactions(email, perPage = 100, page = 1, status = null) {
  let customerCode = null;
  if (email) {
    customerCode = await resolvePaystackCustomer(email);
  }

  let basePath = `/transaction?perPage=${perPage}&page=${page}&currency=KES`;
  if (status) basePath += `&status=${status}`;

  if (customerCode) {
    const res = await paystackFetch(`${basePath}&customer=${encodeURIComponent(customerCode)}`);
    const data = await res.json();
    if (res.ok && data.status && (data.data || []).length > 0) {
      return { transactions: data.data, meta: data.meta || {} };
    }
  }

  const res = await paystackFetch(basePath);
  const data = await res.json();
  if (!res.ok || !data.status) return { transactions: [], meta: {} };

  if (email) {
    const filterEmail = email.toLowerCase();
    const filtered = (data.data || []).filter(txn => {
      const txnEmail = (txn.customer?.email || '').toLowerCase();
      const metaEmail = (txn.metadata?.user_email || '').toLowerCase();
      const metaPhone = txn.metadata?.phone_number || '';
      const authPhone = txn.authorization?.mobile_money_number || '';
      const phoneFromEmail = filterEmail.replace(/@.*$/, '');
      return txnEmail === filterEmail
        || metaEmail === filterEmail
        || (metaPhone && filterEmail.includes(metaPhone))
        || (authPhone && filterEmail.includes(authPhone))
        || (phoneFromEmail.match(/^\d{10,}$/) && (metaPhone.includes(phoneFromEmail) || authPhone.includes(phoneFromEmail)));
    });
    return { transactions: filtered, meta: data.meta || {} };
  }

  return { transactions: data.data || [], meta: data.meta || {} };
}

app.post('/api/mpesa/charge', paymentLimiter, authenticateToken, [
  body('phone').isString().trim().notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number format'),
  body('amount').isNumeric().withMessage('Amount must be a number')
    .custom(v => Number(v) >= 50).withMessage('Minimum deposit is 50 KSH'),
  body('userEmail').optional().isEmail().normalizeEmail(),
], handleValidationErrors, async (req, res) => {
  try {
    const { phone, amount, metadata, userEmail } = req.body;
    securityLog('INFO', 'MPESA_CHARGE_ATTEMPT', { ip: req._clientIp, phone: phone?.slice(-4), amount, email: userEmail });

    if (!phone || !amount) {
      return res.status(400).json({ success: false, message: 'Phone and amount are required' });
    }

    if (amount < 50) {
      return res.status(400).json({ success: false, message: 'Minimum deposit is 50 KSH' });
    }

    let formattedPhone = phone.toString().replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    if (formattedPhone.length !== 12 || !formattedPhone.startsWith('254')) {
      return res.status(400).json({ success: false, message: 'Invalid Kenyan phone number. Use format: 0713046497' });
    }

    const amountInCents = Math.round(amount * 100);
    const paystackPhone = '+' + formattedPhone;
    const chargeEmail = userEmail || `${formattedPhone}@mpesa.ke`;

    serverLog('Sending to Paystack:', { phone: paystackPhone, amount: amountInCents, email: chargeEmail });

    const response = await paystackFetch('/charge', {
      method: 'POST',
      body: JSON.stringify({
        email: chargeEmail,
        amount: amountInCents,
        currency: 'KES',
        mobile_money: {
          phone: paystackPhone,
          provider: 'mpesa',
        },
        metadata: {
          ...metadata,
          payment_type: 'mpesa_stk',
          phone_number: formattedPhone,
          user_email: chargeEmail,
          country: 'KE',
        },
      }),
    });

    const data = await response.json();
    serverLog('Paystack response:', JSON.stringify(data));

    if (!response.ok || !data.status) {
      const errorMessage = data.message || 'Failed to initiate M-Pesa payment';
      return res.status(response.status || 400).json({ success: false, message: errorMessage });
    }

    return res.json({
      success: true,
      data: data.data,
      message: 'M-Pesa STK Push initiated. Check your phone to enter PIN.',
      reference: data.data.reference,
    });
  } catch (error) {
    console.error('M-Pesa charge error:', error);
    return res.status(500).json({ success: false, message: 'Server error initiating payment' });
  }
});

app.get('/api/mpesa/verify/:reference', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference is required' });
    }

    const response = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Verification failed',
      });
    }

    const isSuccess = data.status === true && data.data?.status === 'success';
    if (isSuccess && req.user?.userId) {
      const amount = data.data?.amount ? (data.data.amount / 100) : 0;
      addNotification(req.user.userId, 'payment', 'M-Pesa Payment Received', `KES ${amount.toLocaleString()} has been added to your wallet via M-Pesa.`);
    }

    return res.json({
      success: data.status === true,
      data: data.data,
      message: data.message,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error verifying payment' });
  }
});

app.post('/api/card/initialize', paymentLimiter, authenticateToken, [
  body('amount').isNumeric().withMessage('Amount must be a number')
    .custom(v => Number(v) >= 50).withMessage('Minimum deposit is 50 KSH'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
], handleValidationErrors, async (req, res) => {
  try {
    const { email, amount, metadata, callbackUrl } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ success: false, message: 'Email and amount are required' });
    }

    if (amount < 50) {
      return res.status(400).json({ success: false, message: 'Minimum deposit is 50 KSH' });
    }

    const amountInCents = Math.round(amount * 100);

    serverLog('Initializing card payment:', { email, amount: amountInCents, callbackUrl });

    const response = await paystackFetch('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount: amountInCents,
        currency: 'KES',
        callback_url: callbackUrl || undefined,
        channels: ['card'],
        metadata: {
          ...metadata,
          payment_type: 'card',
          country: 'KE',
        },
      }),
    });

    const data = await response.json();
    serverLog('Paystack card init response:', JSON.stringify(data));

    if (!response.ok || !data.status) {
      const errorMessage = data.message || 'Failed to initialize card payment';
      return res.status(response.status || 400).json({ success: false, message: errorMessage });
    }

    return res.json({
      success: true,
      data: data.data,
      message: 'Card payment initialized. Redirecting to checkout...',
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
      accessCode: data.data.access_code,
    });
  } catch (error) {
    console.error('Card initialize error:', error);
    return res.status(500).json({ success: false, message: 'Server error initializing card payment' });
  }
});

app.get('/api/card/verify/:reference', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference is required' });
    }

    const response = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Verification failed',
      });
    }

    const cardSuccess = data.status === true && data.data?.status === 'success';
    if (cardSuccess && req.user?.userId) {
      const amount = data.data?.amount ? (data.data.amount / 100) : 0;
      addNotification(req.user.userId, 'payment', 'Card Payment Received', `KES ${amount.toLocaleString()} has been added to your wallet via card.`);
    }

    return res.json({
      success: cardSuccess,
      data: data.data,
      message: data.message,
    });
  } catch (error) {
    console.error('Card verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error verifying card payment' });
  }
});

app.post('/api/mpesa/submit-otp', paymentLimiter, authenticateToken, async (req, res) => {
  try {
    const { otp, reference } = req.body;

    if (!otp || !reference) {
      return res.status(400).json({ success: false, message: 'OTP and reference are required' });
    }

    const response = await paystackFetch('/charge/submit_otp', {
      method: 'POST',
      body: JSON.stringify({ otp, reference }),
    });

    const data = await response.json();

    return res.json({
      success: data.status === true,
      data: data.data,
      message: data.message,
    });
  } catch (error) {
    console.error('Submit OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting OTP' });
  }
});

app.post('/api/mobile-money/charge', paymentLimiter, authenticateToken, [
  body('phone').isString().trim().notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number format'),
  body('amount').isNumeric().withMessage('Amount must be a number')
    .custom(v => Number(v) >= 50).withMessage('Minimum deposit is 50 KSH'),
  body('provider').isString().trim().notEmpty().withMessage('Provider is required'),
  body('userEmail').optional().isEmail().normalizeEmail(),
], handleValidationErrors, async (req, res) => {
  try {
    const { phone, amount, countryCode, provider, metadata, userEmail } = req.body;

    if (!phone || !amount || !countryCode || !provider) {
      return res.status(400).json({ success: false, message: 'Phone, amount, country, and provider are required' });
    }

    if (amount < 50) {
      return res.status(400).json({ success: false, message: 'Minimum deposit is 50 KSH' });
    }

    const PHONE_CONFIGS = {
      GH: { prefix: '233', length: 12, currency: 'GHS' },
      CI: { prefix: '225', length: 12, currency: 'XOF' },
    };

    const phoneConfig = PHONE_CONFIGS[countryCode];
    if (!phoneConfig) {
      return res.status(400).json({ success: false, message: `Mobile money is not supported for country: ${countryCode}` });
    }

    let formattedPhone = phone.toString().replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = phoneConfig.prefix + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+' + phoneConfig.prefix)) {
      formattedPhone = formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith(phoneConfig.prefix)) {
      formattedPhone = phoneConfig.prefix + formattedPhone;
    }

    const amountInCents = Math.round(amount * 100);
    const paystackPhone = '+' + formattedPhone;
    const chargeEmail = userEmail || `${formattedPhone}@mobilemoney.${countryCode.toLowerCase()}`;

    const chargeCurrency = phoneConfig.currency;
    serverLog('Sending Mobile Money to Paystack:', { phone: paystackPhone, amount: amountInCents, provider, countryCode, currency: chargeCurrency, email: chargeEmail });

    const response = await paystackFetch('/charge', {
      method: 'POST',
      body: JSON.stringify({
        email: chargeEmail,
        amount: amountInCents,
        currency: chargeCurrency,
        mobile_money: {
          phone: paystackPhone,
          provider: provider,
        },
        metadata: {
          ...metadata,
          payment_type: 'mobile_money',
          phone_number: formattedPhone,
          user_email: chargeEmail,
          country: countryCode,
          provider: provider,
        },
      }),
    });

    const data = await response.json();
    serverLog('Paystack mobile money response:', JSON.stringify(data));

    if (!response.ok || !data.status) {
      const errorMessage = data.message || 'Failed to initiate mobile money payment';
      return res.status(response.status || 400).json({ success: false, message: errorMessage });
    }

    return res.json({
      success: true,
      data: data.data,
      message: data.message || 'Mobile money payment initiated. Check your phone to authorize.',
      reference: data.data.reference,
    });
  } catch (error) {
    console.error('Mobile money charge error:', error);
    return res.status(500).json({ success: false, message: 'Server error initiating mobile money payment' });
  }
});

app.get('/api/mobile-money/verify/:reference', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference is required' });
    }

    const response = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Verification failed',
      });
    }

    const isSuccess = data.status === true && data.data?.status === 'success';
    if (isSuccess && req.user?.userId) {
      const amount = data.data?.amount ? (data.data.amount / 100) : 0;
      const provider = data.data?.metadata?.provider || 'Mobile Money';
      addNotification(req.user.userId, 'payment', 'Mobile Money Payment Received', `KES ${amount.toLocaleString()} has been added to your wallet via ${provider}.`);
    }

    return res.json({
      success: data.status === true,
      data: data.data,
      message: data.message,
    });
  } catch (error) {
    console.error('Mobile money verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error verifying payment' });
  }
});

app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const { perPage = 50, page = 1, status } = req.query;

    const { transactions: allTransactions, meta } = await fetchUserTransactions(
      email || null,
      parseInt(perPage),
      parseInt(page),
      status || null
    );

    const deposits = allTransactions.map((txn) => ({
      id: txn.id,
      reference: txn.reference,
      amount: txn.amount / 100,
      currency: txn.currency,
      status: txn.status,
      channel: txn.channel,
      paidAt: txn.paid_at || txn.transaction_date,
      createdAt: txn.created_at,
      phone: txn.metadata?.phone_number || txn.authorization?.mobile_money_number || '',
      type: txn.metadata?.type || 'wallet_topup',
      description: txn.channel === 'mobile_money'
        ? (txn.metadata?.provider === 'mpesa' ? 'M-Pesa deposit' : 
           txn.metadata?.provider === 'mtn' ? 'MTN Mobile Money deposit' :
           txn.metadata?.provider === 'vod' ? 'Vodafone Cash deposit' :
           txn.metadata?.provider === 'tgo' ? 'AirtelTigo Money deposit' :
           txn.metadata?.provider === 'wave' ? 'Wave deposit' :
           'Mobile Money deposit')
        : txn.channel === 'card'
        ? 'Card payment'
        : txn.channel || 'Payment',
      method: txn.channel === 'mobile_money' 
        ? (txn.metadata?.country === 'KE' ? 'M-Pesa' : 
           txn.metadata?.provider === 'mtn' ? 'MTN MoMo' :
           txn.metadata?.provider === 'vod' ? 'Vodafone Cash' :
           txn.metadata?.provider === 'tgo' ? 'AirtelTigo' :
           txn.metadata?.provider === 'wave' ? 'Wave' :
           'Mobile Money')
        : txn.channel === 'card' ? 'Card' : txn.channel || 'Unknown',
      cardType: txn.authorization?.card_type || '',
      last4: txn.authorization?.last4 || '',
      email: txn.customer?.email || '',
      direction: 'credit',
    }));

    let spendingRecords = [];
    if (email) {
      const allSpending = loadSpending().filter(r => r.email === email.toLowerCase());
      spendingRecords = allSpending.map((r, i) => ({
        id: `spend-${i}-${Date.now()}`,
        reference: `SERVER-${r.serverId}`,
        amount: r.amount,
        currency: 'KES',
        status: 'success',
        channel: 'server_purchase',
        paidAt: r.date,
        createdAt: r.date,
        phone: '',
        type: 'server_purchase',
        description: r.description,
        method: 'Wallet',
        cardType: '',
        last4: '',
        email: r.email,
        direction: 'debit',
      }));
    }

    const transactions = [...deposits, ...spendingRecords].sort((a, b) =>
      new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt)
    );

    return res.json({
      success: true,
      transactions,
      meta: {
        total: meta.total || transactions.length,
        page: meta.page || parseInt(page),
        pageCount: meta.pageCount || 1,
        perPage: meta.perPage || parseInt(perPage),
      },
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching transactions' });
  }
});

app.get('/api/transactions/totals', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;

    const { transactions } = await fetchUserTransactions(email, 100, 1, 'success');

    const totalDeposits = transactions.reduce((sum, txn) => sum + (txn.amount / 100), 0);

    const spending = getTotalSpending(email);
    const balance = Math.max(0, totalDeposits - spending);

    return res.json({
      success: true,
      totalDeposits,
      totalSpending: spending,
      totalCount: transactions.length,
      balance,
    });
  } catch (error) {
    console.error('Totals fetch error:', error);
    return res.json({
      success: true,
      totalDeposits: 0,
      totalSpending: 0,
      totalCount: 0,
      balance: 0,
    });
  }
});

app.get('/api/admin/payments', adminLimiter, authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { perPage = 50, page = 1 } = req.query;

    const { transactions: allTxns } = await fetchUserTransactions(null, parseInt(perPage), parseInt(page), 'success');

    const payments = allTxns.map(txn => ({
      id: txn.id,
      reference: txn.reference,
      amount: txn.amount / 100,
      currency: txn.currency,
      status: txn.status,
      channel: txn.channel,
      paidAt: txn.paid_at || txn.transaction_date,
      createdAt: txn.created_at,
      email: txn.customer?.email || '',
      phone: txn.metadata?.phone_number || txn.authorization?.mobile_money_number || '',
      method: txn.channel === 'mobile_money' ? 'M-Pesa' : txn.channel === 'card' ? 'Card' : txn.channel || 'Unknown',
      customerName: txn.customer?.first_name ? `${txn.customer.first_name} ${txn.customer.last_name || ''}`.trim() : '',
    }));

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    return res.json({
      success: true,
      payments,
      totalAmount,
      totalCount: payments.length,
    });
  } catch (error) {
    console.error('Admin payments fetch error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching payments' });
  }
});

app.post('/api/auth/login', authLimiter, [
  body('email').isString().trim().notEmpty().withMessage('Email or username is required')
    .isLength({ max: 255 }).withMessage('Input too long'),
  body('password').isString().notEmpty().withMessage('Password is required')
    .isLength({ min: 1, max: 128 }).withMessage('Password too long'),
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email/username and password are required' });
    }

    const isEmail = email.includes('@');
    const filterParam = isEmail ? `filter[email]=${encodeURIComponent(email)}` : `filter[username]=${encodeURIComponent(email)}`;

    serverLog('Looking up Pterodactyl user:', { email, isEmail });

    const pteroResponse = await fetch(`${PTERODACTYL_API_URL}/api/application/users?${filterParam}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const pteroData = await pteroResponse.json();

    if (!pteroResponse.ok) {
      console.error('Pterodactyl lookup error:', JSON.stringify(pteroData));
      return res.status(500).json({ success: false, message: 'Failed to verify account' });
    }

    const users = pteroData.data || [];
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'No account found with those credentials. Please sign up first.' });
    }

    const panelUser = users[0].attributes;
    const loginEmail = panelUser.email;

    const passwordCheck = checkUserPassword(loginEmail, password);

    if (passwordCheck === null) {
      serverLog('No stored password for user, attempting panel password sync:', loginEmail);

      let panelSyncSuccess = false;
      try {
        const syncRes = await fetch(`${PTERODACTYL_API_URL}/api/application/users/${panelUser.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            email: panelUser.email,
            username: panelUser.username,
            first_name: panelUser.first_name,
            last_name: panelUser.last_name,
            password: password,
          }),
        });
        if (syncRes.ok) {
          panelSyncSuccess = true;
          storeUserPassword(loginEmail, password);
          serverLog('Password synced and stored for:', loginEmail);
        } else {
          const syncData = await syncRes.json();
          console.error('Panel password sync failed:', JSON.stringify(syncData));
          if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters for panel accounts.' });
          }
          return res.status(500).json({ success: false, message: 'Failed to sync account. Please try again or contact support.' });
        }
      } catch (syncErr) {
        console.error('Panel sync error:', syncErr.message);
        return res.status(500).json({ success: false, message: 'Failed to verify account with panel. Please try again.' });
      }

      if (!panelSyncSuccess) {
        return res.status(500).json({ success: false, message: 'Account sync failed. Please try again.' });
      }
    } else if (passwordCheck === false) {
      securityLog('WARN', 'LOGIN_FAILED', { ip: req._clientIp, email: loginEmail, reason: 'wrong_password' });
      serverLog('Password verification failed for:', loginEmail);
      return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
    }

    serverLog('Password verified successfully for:', loginEmail);
    securityLog('INFO', 'LOGIN_SUCCESS', { ip: req._clientIp, email: loginEmail, userId: panelUser.id });

    const userPayload = {
      id: panelUser.id,
      email: panelUser.email,
      username: panelUser.username,
      firstName: panelUser.first_name,
      lastName: panelUser.last_name,
      panelId: panelUser.id,
      isAdmin: panelUser.root_admin || false,
      isSuperAdmin: isSuperAdminByUsername(panelUser.username),
    };

    const token = generateToken(userPayload);

    return res.json({
      success: true,
      message: 'Login successful',
      user: userPayload,
      token,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

app.post('/api/auth/register', registerLimiter, checkRegistrationAbuse, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
    .isLength({ max: 255 }).withMessage('Email too long'),
  body('username').isString().trim().notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 32 }).withMessage('Username must be 3-32 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Username can only contain letters, numbers, underscores, dots, and hyphens'),
  body('password').isString().notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters'),
  body('referralCode').optional().isString().trim().isLength({ max: 32 }),
], handleValidationErrors, async (req, res) => {
  try {
    const { email, username, password, referralCode } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: 'Email, username, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const nameParts = username.split(' ');
    const firstName = nameParts[0] || username;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : username;

    serverLog('Creating Pterodactyl user:', { email, username, firstName, lastName });

    const pteroResponse = await fetch(`${PTERODACTYL_API_URL}/api/application/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: firstName,
        last_name: lastName,
        password: password,
      }),
    });

    const pteroData = await pteroResponse.json();
    serverLog('Pterodactyl response status:', pteroResponse.status);

    if (!pteroResponse.ok) {
      console.error('Pterodactyl error:', JSON.stringify(pteroData));

      let errorMessage = 'Failed to create panel account';
      if (pteroData.errors && pteroData.errors.length > 0) {
        const details = pteroData.errors.map(e => e.detail).join(', ');
        if (details.toLowerCase().includes('email')) {
          errorMessage = 'An account with this email already exists on the panel';
        } else if (details.toLowerCase().includes('username')) {
          errorMessage = 'This username is already taken on the panel';
        } else {
          errorMessage = details;
        }
      }

      return res.status(pteroResponse.status === 422 ? 409 : pteroResponse.status).json({
        success: false,
        message: errorMessage,
      });
    }

    const panelUser = pteroData.attributes;

    storeUserPassword(panelUser.email, password);
    serverLog('Stored password hash for new user:', panelUser.email);

    if (referralCode) {
      const recorded = recordReferral(referralCode, panelUser.id, panelUser.email, panelUser.username);
      serverLog(`Referral tracking: code=${referralCode}, newUser=${panelUser.id}, recorded=${recorded}`);
    }

    const userId = panelUser.id.toString();
    const userEmail = panelUser.email;

    const allTasks = loadTasks();
    if (!allTasks[userId]) allTasks[userId] = {};
    for (const task of TASK_DEFINITIONS) {
      if (!allTasks[userId][task.id]) {
        allTasks[userId][task.id] = new Date().toISOString();
      }
    }
    saveTasks(allTasks);
    serverLog(`Auto-completed all tasks for new user ${userId}`);

    addNotification(panelUser.id, 'welcome', 'Welcome to WolfHost!', 'Your account has been created. Log in to claim your free 3-day trial server!');

    const userPayload = {
      id: panelUser.id,
      email: panelUser.email,
      username: panelUser.username,
      firstName: panelUser.first_name,
      lastName: panelUser.last_name,
      panelId: panelUser.id,
      isAdmin: panelUser.root_admin || false,
      isSuperAdmin: isSuperAdminByUsername(panelUser.username),
    };

    const token = generateToken(userPayload);

    return res.json({
      success: true,
      message: 'Account created successfully',
      user: userPayload,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating account' });
  }
});

app.get('/api/referrals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const email = req.user.email;

    const code = getReferralCode(userId, email);
    const stats = getReferrerStats(userId);

    return res.json({
      success: true,
      code,
      totalReferrals: stats.completed,
      pendingReferrals: stats.total - stats.completed,
      referrals: stats.referrals.map(r => ({
        id: r.referredUserId,
        username: r.referredUsername,
        email: r.referredEmail,
        registeredAt: r.registeredAt,
        completed: r.completed,
        completedAt: r.completedAt,
        status: r.completed ? 'completed' : 'pending',
      })),
    });
  } catch (error) {
    console.error('Referrals fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch referrals' });
  }
});

app.get('/api/referrals/check-admin-reward', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = getReferrerStats(userId);
    if (stats.completed >= 10) {
      const isAlreadyAdmin = await verifyAdmin(userId);
      if (!isAlreadyAdmin) {
        const userRes = await pteroFetch(`/users/${userId}`);
        const userData = await userRes.json();
        if (userRes.ok) {
          const attrs = userData.attributes;
          const updateRes = await pteroFetch(`/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              email: attrs.email,
              username: attrs.username,
              first_name: attrs.first_name,
              last_name: attrs.last_name,
              root_admin: true,
            }),
          });
          if (updateRes.ok) {
            serverLog(`Auto-awarded admin to user ${userId} for reaching 10 referrals`);
            return res.json({ success: true, awarded: true, message: 'Congratulations! You reached 10 referrals and have been awarded Admin Panel access!' });
          }
        }
      }
      return res.json({ success: true, awarded: false, alreadyAdmin: isAlreadyAdmin, eligible: true });
    }
    return res.json({ success: true, awarded: false, eligible: false, completedReferrals: stats.completed });
  } catch (error) {
    console.error('Admin reward check error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check admin reward' });
  }
});

async function verifyAdmin(userId) {
  try {
    const response = await pteroFetch(`/users/${userId}`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.attributes?.root_admin === true;
  } catch (e) {
    return false;
  }
}

function isSuperAdminById(userId) {
  return userId?.toString() === _superAdminIdCache?.toString();
}

let _superAdminIdCache = null;

async function resolveSuperAdminId() {
  if (!SUPER_ADMIN_USERNAME) return null;
  if (_superAdminIdCache) return _superAdminIdCache;
  try {
    const res = await pteroFetch(`/users?filter[username]=${SUPER_ADMIN_USERNAME}`);
    if (res.ok) {
      const data = await res.json();
      const found = (data.data || []).find(u => u.attributes.username === SUPER_ADMIN_USERNAME);
      if (found) {
        _superAdminIdCache = found.attributes.id;
        return _superAdminIdCache;
      }
    }
  } catch (e) {
    console.error('Failed to resolve super admin ID:', e);
  }
  return null;
}

function isSuperAdminByUsername(username) {
  if (!SUPER_ADMIN_USERNAME || !username) return false;
  return username.toLowerCase() === SUPER_ADMIN_USERNAME.toLowerCase();
}

app.get('/api/admin/overview', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersRes = await pteroFetch('/users?per_page=1');
    const usersData = await usersRes.json();
    const serversRes = await pteroFetch('/servers?per_page=1');
    const serversData = await serversRes.json();
    const nodesRes = await pteroFetch('/nodes?per_page=100');
    const nodesData = await nodesRes.json();

    return res.json({
      success: true,
      stats: {
        totalUsers: usersData.meta?.pagination?.total || 0,
        totalServers: serversData.meta?.pagination?.total || 0,
        totalNodes: nodesData.meta?.pagination?.total || 0,
      },
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch overview' });
  }
});

app.get('/api/admin/users', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    let allUsers = [];
    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages) {
      const response = await pteroFetch(`/users?per_page=100&page=${currentPage}&include=servers`);
      const data = await response.json();

      if (!response.ok) {
        return res.status(500).json({ success: false, message: 'Failed to fetch users' });
      }

      const pageUsers = (data.data || []).map(u => ({
        id: u.attributes.id,
        email: u.attributes.email,
        username: u.attributes.username,
        firstName: u.attributes.first_name,
        lastName: u.attributes.last_name,
        isAdmin: u.attributes.root_admin,
        createdAt: u.attributes.created_at,
        serverCount: u.attributes.relationships?.servers?.data?.length || 0,
      }));

      allUsers = allUsers.concat(pageUsers);
      totalPages = data.meta?.pagination?.total_pages || 1;
      currentPage++;
    }

    return res.json({ success: true, users: allUsers, total: allUsers.length });
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

app.patch('/api/admin/users/:id/admin', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const targetId = req.params.id;
    const { isAdmin } = req.body;
    securityLog('INFO', 'ADMIN_TOGGLE', { ip: req._clientIp, adminUserId: req.user.userId, targetId, isAdmin });

    const userRes = await pteroFetch(`/users/${targetId}`);
    const userData = await userRes.json();
    if (!userRes.ok) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const attrs = userData.attributes;
    const updateRes = await pteroFetch(`/users/${targetId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        email: attrs.email,
        username: attrs.username,
        first_name: attrs.first_name,
        last_name: attrs.last_name,
        root_admin: isAdmin,
      }),
    });

    if (!updateRes.ok) {
      const errData = await updateRes.json();
      return res.status(500).json({ success: false, message: errData.errors?.[0]?.detail || 'Failed to update user' });
    }

    return res.json({ success: true, message: `User ${isAdmin ? 'promoted to' : 'removed from'} admin` });
  } catch (error) {
    console.error('Admin toggle error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.userId;
    securityLog('WARN', 'ADMIN_DELETE_USER', { ip: req._clientIp, adminUserId: userId, targetId: req.params.id });

    const targetId = req.params.id;

    if (targetId.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    const deleteRes = await pteroFetch(`/users/${targetId}`, { method: 'DELETE' });

    if (!deleteRes.ok && deleteRes.status !== 204) {
      return res.status(500).json({ success: false, message: 'Failed to delete user' });
    }

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

app.get('/api/admin/servers', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await pteroFetch('/servers?per_page=100&include=user');
    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ success: false, message: 'Failed to fetch servers' });
    }

    const freeServers = loadFreeServers();

    const servers = (data.data || []).map(s => {
      const attrs = s.attributes;
      const owner = attrs.relationships?.user?.attributes;
      let status = 'online';
      if (attrs.suspended) status = 'suspended';
      else if (attrs.status === 'installing') status = 'installing';
      else if (attrs.status === 'install_failed') status = 'error';

      const freeRecord = freeServers.find(fs => Number(fs.serverId) === Number(attrs.id));

      const serverName = (attrs.name || '').toLowerCase();
      const isNamedFreeTrial = serverName.includes('free-trial') || serverName.includes('welcome-trial');
      const isFree = !!freeRecord || isNamedFreeTrial;

      let expiresAt = null;
      let freeServerType = null;
      let deployedAt = null;
      if (freeRecord || isNamedFreeTrial) {
        const created = new Date(attrs.created_at);
        if (attrs.created_at && !isNaN(created.getTime())) {
          deployedAt = created.toISOString();
          expiresAt = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
        }
        if (freeRecord) {
          freeServerType = freeRecord.type || 'task';
        } else {
          freeServerType = serverName.includes('welcome') ? 'welcome' : 'task';
        }
      }

      return {
        id: attrs.id,
        identifier: attrs.identifier,
        uuid: attrs.uuid,
        name: attrs.name,
        status,
        node: attrs.node,
        suspended: attrs.suspended,
        ownerId: attrs.user,
        ownerUsername: owner?.username || 'Unknown',
        ownerEmail: owner?.email || '',
        limits: attrs.limits,
        createdAt: attrs.created_at,
        deployedAt,
        expiresAt,
        isFreeServer: isFree,
        freeServerType,
      };
    });

    return res.json({ success: true, servers, total: data.meta?.pagination?.total || servers.length });
  } catch (error) {
    console.error('Admin servers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch servers' });
  }
});

app.patch('/api/admin/servers/:id/suspend', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const serverId = req.params.id;
    const suspendRes = await pteroFetch(`/servers/${serverId}/suspend`, { method: 'POST' });

    if (!suspendRes.ok && suspendRes.status !== 204) {
      return res.status(500).json({ success: false, message: 'Failed to suspend server' });
    }

    return res.json({ success: true, message: 'Server suspended' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to suspend server' });
  }
});

app.patch('/api/admin/servers/:id/unsuspend', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const serverId = req.params.id;
    const unsuspendRes = await pteroFetch(`/servers/${serverId}/unsuspend`, { method: 'POST' });

    if (!unsuspendRes.ok && unsuspendRes.status !== 204) {
      return res.status(500).json({ success: false, message: 'Failed to unsuspend server' });
    }

    return res.json({ success: true, message: 'Server unsuspended' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to unsuspend server' });
  }
});

app.delete('/api/admin/servers/:id', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const serverId = req.params.id;
    const deleteRes = await pteroFetch(`/servers/${serverId}`, { method: 'DELETE' });

    if (!deleteRes.ok && deleteRes.status !== 204) {
      return res.status(500).json({ success: false, message: 'Failed to delete server' });
    }

    return res.json({ success: true, message: 'Server deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete server' });
  }
});

app.post('/api/admin/cleanup-expired', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const freeServers = loadFreeServers();
    const now = new Date();
    const expired = freeServers.filter(s => new Date(s.expiresAt) <= now);

    if (expired.length === 0) {
      return res.json({ success: true, message: 'No expired servers found', deleted: 0, total: freeServers.length });
    }

    serverLog(`[Admin Cleanup] Admin ${userId} triggered cleanup of ${expired.length} expired servers`);
    let deletedCount = 0;
    const failures = [];

    for (const server of expired) {
      try {
        await pteroFetch(`/servers/${server.serverId}/suspend`, { method: 'POST' });

        const deleteRes = await pteroFetch(`/servers/${server.serverId}`, { method: 'DELETE' });
        if (deleteRes.status === 204 || deleteRes.ok || deleteRes.status === 404) {
          deletedCount++;
          serverLog(`[Admin Cleanup] Deleted expired server ${server.serverId} (user ${server.userId})`);
          addNotification(
            server.userId,
            'server',
            'Free Trial Expired',
            'Your free trial server has expired and been removed. Upgrade to a paid plan to keep your server running!'
          );
        } else {
          failures.push({ serverId: server.serverId, reason: `Delete failed with status ${deleteRes.status}` });
        }
      } catch (e) {
        failures.push({ serverId: server.serverId, reason: e.message });
      }
    }

    const remaining = freeServers.filter(s => new Date(s.expiresAt) > now);
    const alsoRemoveDeleted = remaining;
    const failedIds = failures.map(f => f.serverId);
    const finalList = freeServers.filter(s => {
      if (new Date(s.expiresAt) > now) return true;
      if (failedIds.includes(s.serverId)) return true;
      return false;
    });
    saveFreeServers(finalList);

    serverLog(`[Admin Cleanup] Complete. Deleted ${deletedCount}/${expired.length}, ${finalList.length} remaining`);

    return res.json({
      success: true,
      message: `Deleted ${deletedCount} expired server${deletedCount !== 1 ? 's' : ''}`,
      deleted: deletedCount,
      failed: failures.length,
      remaining: finalList.length,
      failures: failures.length > 0 ? failures : undefined
    });
  } catch (error) {
    console.error('[Admin Cleanup] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cleanup expired servers' });
  }
});

const TIER_LIMITS = {
  Limited: {
    memory: 5120,
    swap: 0,
    disk: 10240,
    io: 500,
    cpu: 100,
    databases: 1,
    allocations: 1,
    backups: 1,
  },
  Unlimited: {
    memory: 0,
    swap: 0,
    disk: 40960,
    io: 500,
    cpu: 200,
    databases: 2,
    allocations: 2,
    backups: 3,
  },
  Admin: {
    memory: 0,
    swap: 0,
    disk: 81920,
    io: 500,
    cpu: 400,
    databases: 5,
    allocations: 5,
    backups: 5,
  },
};

async function pteroFetch(path, options = {}) {
  const response = await fetch(`${PTERODACTYL_API_URL}/api/application${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

const SERVER_EGG_ID = 15;
const SERVER_DOCKER_IMAGE = 'ghcr.io/parkervcp/yolks:nodejs_24';
const SERVER_STARTUP = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; if [[ ! -z ${CUSTOM_ENVIRONMENT_VARIABLES} ]]; then vars=$(echo ${CUSTOM_ENVIRONMENT_VARIABLES} | tr ";" "\\n"); for line in $vars; do export $line; done fi; /usr/local/bin/${CMD_RUN};';

const DEFAULT_ENV_VALUES = {
  'USER_UPLOAD': '1',
  'MAIN_FILE': 'index.js',
  'JS_FILE': 'index.js',
  'FILE': 'index.js',
  'GIT_ADDRESS': '',
  'BRANCH': '',
  'USERNAME': '',
  'ACCESS_TOKEN': '',
  'CMD_RUN': 'npm start',
  'AUTO_UPDATE': '0',
  'NODE_PACKAGES': '',
  'UNNODE_PACKAGES': '',
  'CUSTOM_ENVIRONMENT_VARIABLES': '',
};

let cachedEggVars = null;
let eggVarsCacheTime = 0;
const EGG_CACHE_TTL = 5 * 60 * 1000;

async function getEggEnvironment(nestId) {
  const now = Date.now();
  if (cachedEggVars && (now - eggVarsCacheTime) < EGG_CACHE_TTL) {
    return { ...cachedEggVars };
  }

  try {
    const nests = nestId ? [nestId] : [1, 2, 3, 4, 5];
    for (const nid of nests) {
      const res = await pteroFetch(`/nests/${nid}/eggs/${SERVER_EGG_ID}?include=variables`);
      if (res.ok) {
        const data = await res.json();
        const variables = data.attributes?.relationships?.variables?.data || [];
        const env = {};
        for (const v of variables) {
          const attr = v.attributes;
          const envVar = attr.env_variable;
          env[envVar] = DEFAULT_ENV_VALUES[envVar] || attr.default_value || '';
        }
        cachedEggVars = env;
        eggVarsCacheTime = now;
        serverLog('Fetched egg variables:', Object.keys(env));
        return { ...env };
      }
    }
  } catch (e) {
    console.error('Error fetching egg variables:', e.message);
  }

  serverLog('Using fallback environment variables');
  return { ...DEFAULT_ENV_VALUES };
}

async function findFreeAllocation(nodeId = null) {
  try {
    const nodeIds = [];
    if (nodeId) {
      nodeIds.push(nodeId);
    } else {
      const nodesRes = await pteroFetch('/nodes?per_page=100');
      const nodesData = await nodesRes.json();
      if (nodesRes.ok && nodesData.data) {
        nodesData.data.forEach(n => nodeIds.push(n.attributes.id));
      }
      if (nodeIds.length === 0) nodeIds.push(1);
    }

    for (const nid of nodeIds) {
      let page = 1;
      let lastPage = 1;
      while (page <= lastPage) {
        const response = await pteroFetch(`/nodes/${nid}/allocations?per_page=100&page=${page}`);
        const data = await response.json();
        if (!response.ok || !data.data) break;

        const free = data.data.find(a => !a.attributes.assigned);
        if (free) {
          serverLog(`Found free allocation ${free.attributes.id} on node ${nid} (port ${free.attributes.port})`);
          return free.attributes.id;
        }

        if (data.meta && data.meta.pagination) {
          lastPage = data.meta.pagination.total_pages || 1;
        }
        page++;
      }
      serverLog(`No free allocations found on node ${nid}`);
    }

    console.error('No free allocations found on any node');
    return null;
  } catch (err) {
    console.error('Error finding free allocation:', err.message);
    return null;
  }
}

const TIER_PRICES = { Limited: 50, Unlimited: 100, Admin: 250 };

app.post('/api/admin/upload-server', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { targetUserId, plan } = req.body;

    if (!targetUserId || !plan) {
      return res.status(400).json({ success: false, message: 'Target user ID and plan are required' });
    }

    const tierConfig = TIER_LIMITS[plan];
    if (!tierConfig) {
      return res.status(400).json({ success: false, message: 'Invalid server plan' });
    }

    const pteroUser = await verifyPteroUser(targetUserId);
    if (!pteroUser) {
      return res.status(404).json({ success: false, message: 'Target user not found on the panel' });
    }

    const allocationId = await findFreeAllocation();
    if (!allocationId) {
      return res.status(503).json({ success: false, message: 'No available ports. Please try again later.' });
    }

    const serverName = `${pteroUser.username}-${plan.toLowerCase()}-${Date.now().toString(36)}`;

    const eggEnv = await getEggEnvironment();

    const serverPayload = {
      name: serverName,
      user: parseInt(targetUserId),
      egg: SERVER_EGG_ID,
      docker_image: SERVER_DOCKER_IMAGE,
      startup: SERVER_STARTUP,
      environment: eggEnv,
      limits: {
        memory: tierConfig.memory,
        swap: tierConfig.swap,
        disk: tierConfig.disk,
        io: tierConfig.io,
        cpu: tierConfig.cpu,
      },
      feature_limits: {
        databases: tierConfig.databases,
        allocations: tierConfig.allocations,
        backups: tierConfig.backups,
      },
      allocation: {
        default: allocationId,
      },
      description: `WolfHost ${plan} Plan - Uploaded by Admin`,
      start_on_completion: false,
      external_id: `wolfhost-admin-${targetUserId}-${Date.now()}`,
    };

    const pteroResponse = await pteroFetch('/servers', {
      method: 'POST',
      body: JSON.stringify(serverPayload),
    });

    const pteroData = await pteroResponse.json();

    if (!pteroResponse.ok) {
      console.error('Admin upload server error:', JSON.stringify(pteroData));
      let errorMessage = 'Failed to create server on the panel';
      if (pteroData.errors && pteroData.errors.length > 0) {
        errorMessage = pteroData.errors.map(e => e.detail).join(', ');
      }
      return res.status(pteroResponse.status || 500).json({ success: false, message: errorMessage });
    }

    const serverAttrs = pteroData.attributes;
    serverLog('Admin uploaded server:', serverAttrs.id, 'for user:', pteroUser.username);

    return res.json({
      success: true,
      message: `Server uploaded to ${pteroUser.username} successfully`,
      server: {
        id: serverAttrs.id,
        name: serverAttrs.name,
        identifier: serverAttrs.identifier,
      },
    });
  } catch (error) {
    console.error('Admin upload server error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload server' });
  }
});

async function verifyUserBalance(email, requiredAmount) {
  try {
    const { transactions } = await fetchUserTransactions(email, 100, 1, 'success');
    const totalDeposits = transactions.reduce((sum, txn) => sum + (txn.amount / 100), 0);
    const spending = getTotalSpending(email);
    return Math.max(0, totalDeposits - spending);
  } catch (e) {
    console.error('Balance verification error:', e);
    return 0;
  }
}

async function verifyPteroUser(userId) {
  try {
    const response = await pteroFetch(`/users/${userId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.attributes || null;
  } catch (e) {
    return null;
  }
}

app.post('/api/servers/create', serverCreateLimiter, authenticateToken, [
  body('name').isString().trim().notEmpty().withMessage('Server name is required')
    .isLength({ max: 100 }).withMessage('Server name too long')
    .matches(/^[a-zA-Z0-9_\-. ]+$/).withMessage('Server name contains invalid characters'),
  body('plan').isString().trim().isIn(['Limited', 'Unlimited', 'Admin']).withMessage('Invalid server plan'),
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = req.user.email;
    const { name, plan } = req.body;
    securityLog('INFO', 'SERVER_CREATE_ATTEMPT', { ip: req._clientIp, userId, plan, email: userEmail });

    if (!name || !plan || !userId || !userEmail) {
      return res.status(400).json({ success: false, message: 'Server name, plan, user ID, and email are required' });
    }

    const tierConfig = TIER_LIMITS[plan];
    if (!tierConfig) {
      return res.status(400).json({ success: false, message: 'Invalid server plan' });
    }

    const pteroUser = await verifyPteroUser(userId);
    if (!pteroUser) {
      return res.status(403).json({ success: false, message: 'User not found on the panel' });
    }

    if (pteroUser.email.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'User verification failed' });
    }

    const requiredAmount = TIER_PRICES[plan] || 50;
    const balance = await verifyUserBalance(userEmail, requiredAmount);
    if (balance < requiredAmount) {
      return res.status(402).json({
        success: false,
        message: `Insufficient balance. You need KES ${requiredAmount} but have KES ${balance.toFixed(2)}. Please top up your wallet first.`,
      });
    }

    const allocationId = await findFreeAllocation();
    if (!allocationId) {
      return res.status(503).json({ success: false, message: 'No available ports. Please try again later or contact support.' });
    }

    serverLog('Creating Pterodactyl server:', { name, plan, userId, allocationId, verifiedBalance: balance });

    const eggEnv = await getEggEnvironment();

    const serverPayload = {
      name: name,
      user: parseInt(userId),
      egg: SERVER_EGG_ID,
      docker_image: SERVER_DOCKER_IMAGE,
      startup: SERVER_STARTUP,
      environment: eggEnv,
      limits: {
        memory: tierConfig.memory,
        swap: tierConfig.swap,
        disk: tierConfig.disk,
        io: tierConfig.io,
        cpu: tierConfig.cpu,
      },
      feature_limits: {
        databases: tierConfig.databases,
        allocations: tierConfig.allocations,
        backups: tierConfig.backups,
      },
      allocation: {
        default: allocationId,
      },
      description: `WolfHost ${plan} Plan - Created via WolfHost Panel`,
      start_on_completion: false,
      external_id: `wolfhost-${userId}-${Date.now()}`,
    };

    const pteroResponse = await pteroFetch('/servers', {
      method: 'POST',
      body: JSON.stringify(serverPayload),
    });

    const pteroData = await pteroResponse.json();

    if (!pteroResponse.ok) {
      console.error('Pterodactyl server create error:', JSON.stringify(pteroData));
      let errorMessage = 'Failed to create server on the panel';
      if (pteroData.errors && pteroData.errors.length > 0) {
        errorMessage = pteroData.errors.map(e => e.detail).join(', ');
      }
      return res.status(pteroResponse.status || 500).json({ success: false, message: errorMessage });
    }

    const serverAttrs = pteroData.attributes;
    serverLog('Server created successfully:', serverAttrs.id, serverAttrs.identifier);

    recordSpending(userEmail, requiredAmount, `Server "${name}" (${plan} plan)`, serverAttrs.id);
    serverLog(`Recorded spending: KES ${requiredAmount} for user ${userEmail}, server ${serverAttrs.id}`);

    addNotification(userId, 'server', 'Server Created', `Your "${name}" server (${plan} plan) has been deployed successfully!`);

    const completedRef = completeReferral(userEmail);
    if (completedRef) {
      serverLog(`Referral completed: ${userEmail} purchased a server, crediting referrer ${completedRef.referrerEmail}`);
      addNotification(completedRef.referrerUserId, 'referral', 'Referral Completed!', `Your referral ${userEmail} just purchased a server. Keep referring to earn admin access!`);
      const referrerStats = getReferrerStats(completedRef.referrerUserId);
      if (referrerStats.completed >= 10) {
        const isAlreadyAdmin = await verifyAdmin(completedRef.referrerUserId);
        if (!isAlreadyAdmin) {
          try {
            const userRes = await pteroFetch(`/users/${completedRef.referrerUserId}`);
            const userData = await userRes.json();
            if (userRes.ok) {
              const attrs = userData.attributes;
              await pteroFetch(`/users/${completedRef.referrerUserId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  email: attrs.email,
                  username: attrs.username,
                  first_name: attrs.first_name,
                  last_name: attrs.last_name,
                  root_admin: true,
                }),
              });
              serverLog(`Auto-awarded admin to referrer ${completedRef.referrerUserId} for reaching 10 referrals`);
            }
          } catch (e) {
            console.error('Error auto-awarding admin:', e);
          }
        }
      }
    }

    return res.json({
      success: true,
      message: 'Server created successfully',
      server: {
        id: serverAttrs.id,
        identifier: serverAttrs.identifier,
        uuid: serverAttrs.uuid,
        name: serverAttrs.name,
        description: serverAttrs.description,
        plan: plan,
        status: serverAttrs.suspended ? 'suspended' : 'installing',
        node: serverAttrs.node,
        allocation: serverAttrs.allocation,
        limits: serverAttrs.limits,
        feature_limits: serverAttrs.feature_limits,
      },
    });
  } catch (error) {
    console.error('Server creation error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating server' });
  }
});

app.get('/api/servers', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    if (req.query.userId && parseInt(req.query.userId) !== userId) {
      securityLog('ALERT', 'IDOR_ATTEMPT', { ip: req._clientIp, authenticatedUserId: userId, requestedUserId: req.query.userId });
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const pteroResponse = await pteroFetch(`/users/${userId}?include=servers`);
    const pteroData = await pteroResponse.json();

    if (!pteroResponse.ok) {
      console.error('Pterodactyl servers fetch error:', JSON.stringify(pteroData));
      return res.json({ success: true, servers: [] });
    }

    const userServers = pteroData.attributes?.relationships?.servers?.data || [];
    const userEmail = pteroData.attributes?.email || '';


    const allocCache = {};

    const servers = await Promise.all(userServers.map(async (s) => {
      const attrs = s.attributes;
      let ip = '';
      let port = '';

      if (attrs.allocation && !allocCache[attrs.allocation]) {
        try {
          const allocRes = await pteroFetch(`/nodes/${attrs.node}/allocations?per_page=100`);
          const allocData = await allocRes.json();
          if (allocRes.ok && allocData.data) {
            allocData.data.forEach(a => {
              allocCache[a.attributes.id] = a.attributes;
            });
          }
        } catch (e) {}
      }

      if (allocCache[attrs.allocation]) {
        const alloc = allocCache[attrs.allocation];
        ip = alloc.alias || alloc.ip;
        port = alloc.port;
      }

      let plan = 'Limited';
      const mem = attrs.limits.memory;
      const cpu = attrs.limits.cpu;
      if ((mem === 0 || mem > 100000) && cpu >= 400) {
        plan = 'Admin';
      } else if (mem === 0 || mem > 100000) {
        plan = 'Unlimited';
      }

      const formatMem = (m) => {
        if (m === 0 || m > 100000) return 'Unlimited';
        if (m >= 1024) return `${Math.round(m / 1024)}GB`;
        return `${m}MB`;
      };

      const formatDisk = (d) => {
        if (d === 0 || d > 1000000) return 'Unlimited';
        if (d >= 1024) return `${Math.round(d / 1024)}GB`;
        return `${d}MB`;
      };

      let status = 'online';
      if (attrs.suspended) {
        status = 'suspended';
      } else if (attrs.status === 'installing') {
        status = 'installing';
      } else if (attrs.status === 'install_failed') {
        status = 'error';
      } else if (attrs.status === 'suspended') {
        status = 'suspended';
      }

      return {
        id: attrs.id.toString(),
        identifier: attrs.identifier,
        name: attrs.name,
        status,
        plan: plan,
        ip: ip ? `${ip}:${port}` : '',
        cpu: `${cpu}%`,
        ram: formatMem(mem),
        storage: formatDisk(attrs.limits.disk),
        uptime: '-',
      };
    }));

    return res.json({
      success: true,
      servers,
      total: servers.length,
    });
  } catch (error) {
    console.error('Servers fetch error:', error);
    return res.json({ success: true, servers: [] });
  }
});

app.delete('/api/servers/:serverId', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.userId;
    const userEmail = req.user.email;

    if (!serverId) {
      return res.status(400).json({ success: false, message: 'Server ID is required' });
    }

    const serverRes = await pteroFetch(`/servers/${serverId}`);
    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData.attributes && serverData.attributes.user !== parseInt(userId)) {
        return res.status(403).json({ success: false, message: 'You do not own this server' });
      }
    }

    serverLog('Deleting Pterodactyl server:', serverId);

    const pteroResponse = await pteroFetch(`/servers/${serverId}`, {
      method: 'DELETE',
    });

    if (pteroResponse.status === 204 || pteroResponse.ok) {
      serverLog('Server deleted successfully:', serverId);
      return res.json({ success: true, message: 'Server deleted successfully' });
    }

    const pteroData = await pteroResponse.json().catch(() => ({}));
    console.error('Pterodactyl delete error:', JSON.stringify(pteroData));
    return res.status(pteroResponse.status || 500).json({
      success: false,
      message: pteroData.errors?.[0]?.detail || 'Failed to delete server',
    });
  } catch (error) {
    console.error('Server deletion error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting server' });
  }
});

const TASK_DEFINITIONS = [
  { id: 'whatsapp_channel', name: 'Follow WhatsApp Channel', link: 'https://whatsapp.com/channel/0029Vb6dn9nEQIaqEMNclK3Y' },
  { id: 'whatsapp_group', name: 'Join WhatsApp Group', link: 'https://chat.whatsapp.com/HjFc3pud3IA0R0WGr1V2Xu' },
  { id: 'telegram_group', name: 'Join Telegram Group', link: 'https://t.me/+qoyEyvEgHC5mODVk' },
  { id: 'youtube_channel', name: 'Subscribe to YouTube Channel', link: 'https://www.youtube.com/@silentwolf906' },
];

const FREE_SERVER_LIFETIME_MS = 3 * 24 * 60 * 60 * 1000;

const FREE_SERVER_LIMITS = {
  memory: 1024,
  swap: 0,
  disk: 5120,
  io: 500,
  cpu: 100,
  databases: 1,
  allocations: 1,
  backups: 0,
};

app.get('/api/tasks', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    const allTasks = loadTasks();
    const userTasks = allTasks[userId] || {};

    const tasks = TASK_DEFINITIONS.map(t => ({
      ...t,
      completed: !!userTasks[t.id],
      completedAt: userTasks[t.id] || null,
    }));

    const completedCount = tasks.filter(t => t.completed).length;

    const freeServers = loadFreeServers();
    const userFreeServer = freeServers.find(s => s.userId === userId.toString());

    return res.json({
      success: true,
      tasks,
      completedCount,
      totalTasks: TASK_DEFINITIONS.length,
      allCompleted: completedCount === TASK_DEFINITIONS.length,
      freeServerClaimed: !!userFreeServer,
      freeServer: userFreeServer || null,
    });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks/complete', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ success: false, message: 'taskId is required' });

    const validTask = TASK_DEFINITIONS.find(t => t.id === taskId);
    if (!validTask) return res.status(400).json({ success: false, message: 'Invalid task ID' });

    const allTasks = loadTasks();
    if (!allTasks[userId]) allTasks[userId] = {};

    if (allTasks[userId][taskId]) {
      return res.json({ success: true, message: 'Task already completed', alreadyCompleted: true });
    }

    allTasks[userId][taskId] = new Date().toISOString();
    saveTasks(allTasks);

    const completedCount = Object.keys(allTasks[userId]).length;

    return res.json({
      success: true,
      message: 'Task completed',
      completedCount,
      totalTasks: TASK_DEFINITIONS.length,
      allCompleted: completedCount === TASK_DEFINITIONS.length,
    });
  } catch (error) {
    console.error('Task complete error:', error);
    return res.status(500).json({ success: false, message: 'Failed to complete task' });
  }
});

app.post('/api/tasks/claim-server', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = req.user.email;

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'unknown';

    const allTasks = loadTasks();
    const userTasks = allTasks[userId] || {};
    const completedCount = TASK_DEFINITIONS.filter(t => userTasks[t.id]).length;
    if (completedCount < TASK_DEFINITIONS.length) {
      return res.status(400).json({ success: false, message: 'Complete all tasks first' });
    }

    const freeServers = loadFreeServers();

    const existingUser = freeServers.find(s => s.userId === userId.toString());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'You have already claimed your free server' });
    }

    if (clientIp && clientIp !== 'unknown') {
      const existingIp = freeServers.find(s => s.ip === clientIp);
      if (existingIp) {
        serverLog(`Suspicious: IP ${clientIp} already claimed a free server (user ${existingIp.userId}), now user ${userId} trying`);
        return res.status(400).json({ success: false, message: 'A free server has already been claimed from this network' });
      }
    }

    const pteroUser = await verifyPteroUser(userId);
    if (!pteroUser) {
      return res.status(403).json({ success: false, message: 'User not found on the panel' });
    }

    const allocationId = await findFreeAllocation();
    if (!allocationId) {
      return res.status(503).json({ success: false, message: 'No available ports. Please try again later.' });
    }

    const serverName = `${pteroUser.username}-free-trial`;
    const expiresAt = new Date(Date.now() + FREE_SERVER_LIFETIME_MS).toISOString();

    serverLog('Creating free trial server:', { serverName, userId, allocationId, expiresAt });

    const eggEnv = await getEggEnvironment();

    const serverPayload = {
      name: serverName,
      user: parseInt(userId),
      egg: SERVER_EGG_ID,
      docker_image: SERVER_DOCKER_IMAGE,
      startup: SERVER_STARTUP,
      environment: eggEnv,
      limits: {
        memory: FREE_SERVER_LIMITS.memory,
        swap: FREE_SERVER_LIMITS.swap,
        disk: FREE_SERVER_LIMITS.disk,
        io: FREE_SERVER_LIMITS.io,
        cpu: FREE_SERVER_LIMITS.cpu,
      },
      feature_limits: {
        databases: FREE_SERVER_LIMITS.databases,
        allocations: FREE_SERVER_LIMITS.allocations,
        backups: FREE_SERVER_LIMITS.backups,
      },
      allocation: { default: allocationId },
      description: `WolfHost Free Trial - Expires ${new Date(Date.now() + FREE_SERVER_LIFETIME_MS).toLocaleDateString()}`,
      start_on_completion: false,
      external_id: `wolfhost-free-${userId}-${Date.now()}`,
    };

    const pteroResponse = await pteroFetch('/servers', {
      method: 'POST',
      body: JSON.stringify(serverPayload),
    });

    const pteroData = await pteroResponse.json();

    if (!pteroResponse.ok) {
      console.error('Free server create error:', JSON.stringify(pteroData));
      let errorMessage = 'Failed to create free server';
      if (pteroData.errors && pteroData.errors.length > 0) {
        errorMessage = pteroData.errors.map(e => e.detail).join(', ');
      }
      return res.status(500).json({ success: false, message: errorMessage });
    }

    const serverAttrs = pteroData.attributes;

    const freeServerRecord = {
      userId: userId.toString(),
      userEmail: userEmail.toLowerCase(),
      ip: clientIp,
      serverId: serverAttrs.id,
      identifier: serverAttrs.identifier,
      serverName: serverAttrs.name,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    freeServers.push(freeServerRecord);
    saveFreeServers(freeServers);

    serverLog(`Free trial server created: ${serverAttrs.id} for user ${userId}, expires ${expiresAt}`);

    return res.json({
      success: true,
      message: 'Free trial server created! It will be available for 3 days.',
      server: {
        id: serverAttrs.id,
        identifier: serverAttrs.identifier,
        name: serverAttrs.name,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Free server claim error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating free server' });
  }
});

app.post('/api/free-server/claim-welcome', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = req.user.email;

    const welcomeClaims = loadWelcomeClaims();
    if (welcomeClaims[userId.toString()]) {
      return res.status(400).json({ success: false, message: 'You have already claimed your free server', alreadyClaimed: true });
    }

    const pteroUser = await verifyPteroUser(userId);
    if (!pteroUser) {
      return res.status(403).json({ success: false, message: 'User not found on the panel' });
    }

    if (pteroUser.email.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'User verification failed' });
    }

    const allocationId = await findFreeAllocation();
    if (!allocationId) {
      return res.status(503).json({ success: false, message: 'No available ports. Please try again later.' });
    }

    const serverName = `${pteroUser.username}-welcome-trial`;
    const expiresAt = new Date(Date.now() + FREE_SERVER_LIFETIME_MS).toISOString();

    serverLog('Creating welcome free trial server:', { serverName, userId, allocationId, expiresAt });

    const eggEnv = await getEggEnvironment();

    const serverPayload = {
      name: serverName,
      user: parseInt(userId),
      egg: SERVER_EGG_ID,
      docker_image: SERVER_DOCKER_IMAGE,
      startup: SERVER_STARTUP,
      environment: eggEnv,
      limits: {
        memory: FREE_SERVER_LIMITS.memory,
        swap: FREE_SERVER_LIMITS.swap,
        disk: FREE_SERVER_LIMITS.disk,
        io: FREE_SERVER_LIMITS.io,
        cpu: FREE_SERVER_LIMITS.cpu,
      },
      feature_limits: {
        databases: FREE_SERVER_LIMITS.databases,
        allocations: FREE_SERVER_LIMITS.allocations,
        backups: FREE_SERVER_LIMITS.backups,
      },
      allocation: { default: allocationId },
      description: `WolfHost Welcome Trial - Expires ${new Date(Date.now() + FREE_SERVER_LIFETIME_MS).toLocaleDateString()}`,
      start_on_completion: false,
      external_id: `wolfhost-welcome-${userId}-${Date.now()}`,
    };

    const pteroResponse = await pteroFetch('/servers', {
      method: 'POST',
      body: JSON.stringify(serverPayload),
    });

    const pteroData = await pteroResponse.json();

    if (!pteroResponse.ok) {
      console.error('Welcome free server create error:', JSON.stringify(pteroData));
      let errorMessage = 'Failed to create free server';
      if (pteroData.errors && pteroData.errors.length > 0) {
        errorMessage = pteroData.errors.map(e => e.detail).join(', ');
      }
      return res.status(500).json({ success: false, message: errorMessage });
    }

    const serverAttrs = pteroData.attributes;

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'unknown';

    const freeServerRecord = {
      userId: userId.toString(),
      userEmail: userEmail.toLowerCase(),
      ip: clientIp,
      serverId: serverAttrs.id,
      identifier: serverAttrs.identifier,
      serverName: serverAttrs.name,
      createdAt: new Date().toISOString(),
      expiresAt,
      type: 'welcome',
    };

    const freeServers = loadFreeServers();
    freeServers.push(freeServerRecord);
    saveFreeServers(freeServers);

    const updatedClaims = loadWelcomeClaims();
    updatedClaims[userId.toString()] = {
      claimedAt: new Date().toISOString(),
      serverId: serverAttrs.id,
      expiresAt,
    };
    saveWelcomeClaims(updatedClaims);

    addNotification(userId, 'server', 'Free Trial Server Ready!', `Your free 3-day trial server "${serverAttrs.name}" is live! It expires on ${new Date(expiresAt).toLocaleDateString()}.`);

    serverLog(`Welcome trial server created: ${serverAttrs.id} for user ${userId}, expires ${expiresAt}`);

    return res.json({
      success: true,
      message: 'Your free 3-day trial server has been created!',
      server: {
        id: serverAttrs.id,
        identifier: serverAttrs.identifier,
        name: serverAttrs.name,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Welcome free server claim error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating free server' });
  }
});

app.get('/api/free-server/status', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    const welcomeClaims = loadWelcomeClaims();
    const hasClaimed = !!welcomeClaims[userId.toString()];

    const freeServers = loadFreeServers();
    const userFreeServer = freeServers.find(s => s.userId === userId.toString());

    return res.json({
      success: true,
      hasFreeServer: hasClaimed || !!userFreeServer,
      freeServer: userFreeServer || null,
      claimed: hasClaimed,
    });
  } catch (error) {
    console.error('Free server status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check free server status' });
  }
});

async function cleanupExpiredFreeServers() {
  try {
    const freeServers = loadFreeServers();
    const now = new Date();
    const expired = freeServers.filter(s => new Date(s.expiresAt) <= now);

    if (expired.length === 0) return;

    serverLog(`[Cleanup] Found ${expired.length} expired free servers to remove...`);
    const successfullyRemoved = [];

    for (const server of expired) {
      try {
        const suspendRes = await pteroFetch(`/servers/${server.serverId}/suspend`, { method: 'POST' });
        if (suspendRes.status === 204 || suspendRes.ok) {
          serverLog(`[Cleanup] Suspended expired server ${server.serverId}`);
        } else {
          serverLog(`[Cleanup] Suspend returned status ${suspendRes.status} for server ${server.serverId} (may already be suspended)`);
        }

        const deleteRes = await pteroFetch(`/servers/${server.serverId}`, { method: 'DELETE' });
        if (deleteRes.status === 204 || deleteRes.ok) {
          serverLog(`[Cleanup] Deleted expired free server ${server.serverId} (user ${server.userId})`);
          successfullyRemoved.push(server.serverId);
          addNotification(
            server.userId,
            'server',
            'Free Trial Expired',
            `Your free trial server has expired and been removed. Upgrade to a paid plan to keep your server running!`
          );
        } else if (deleteRes.status === 404) {
          serverLog(`[Cleanup] Server ${server.serverId} already deleted from panel, removing from tracking`);
          successfullyRemoved.push(server.serverId);
        } else {
          console.error(`[Cleanup] Failed to delete expired server ${server.serverId}: status ${deleteRes.status}`);
        }
      } catch (e) {
        console.error(`[Cleanup] Error processing expired server ${server.serverId}:`, e.message);
      }
    }

    const remaining = freeServers.filter(s => {
      if (successfullyRemoved.includes(s.serverId)) return false;
      if (new Date(s.expiresAt) > now) return true;
      return true;
    });
    saveFreeServers(remaining);
    serverLog(`[Cleanup] Complete. Removed ${successfullyRemoved.length}, ${remaining.length} servers remaining.`);
  } catch (e) {
    console.error('[Cleanup] Free server cleanup error:', e);
  }
}

setInterval(cleanupExpiredFreeServers, 5 * 60 * 1000);
setTimeout(cleanupExpiredFreeServers, 15000);

app.post('/api/wolf/chat', chatLimiter, authenticateToken, [
  body('message').isString().trim().notEmpty().withMessage('Message is required')
    .isLength({ max: 2000 }).withMessage('Message too long'),
], handleValidationErrors, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const systemContext = `You are W.O.L.F (Wise Operational Learning Function), the AI assistant for WolfHost - a game server hosting platform. You help users navigate the platform and answer questions about:
- Creating and managing game servers (Minecraft, etc.)
- Wallet top-ups via M-Pesa or Card payments (minimum 50 KSH)
- Server tiers: Limited (50 KSH), Unlimited (100 KSH), Admin (250 KSH)
- Billing and transaction history
- Referral program (refer 10 friends who buy servers to earn Admin Panel access)
- Account settings
Keep responses concise, friendly, and helpful. If asked about something unrelated to WolfHost, politely redirect to hosting topics.`;

    const fullQuery = `${systemContext}\n\nUser: ${message.trim()}`;
    const apiUrl = `https://apiskeith.vercel.app/ai/grok?q=${encodeURIComponent(fullQuery)}`;

    const response = await fetch(apiUrl, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    const answer = data?.answer || data?.response || data?.result || data?.message || JSON.stringify(data);

    res.json({ success: true, response: answer });
  } catch (error) {
    console.error('W.O.L.F chat error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'W.O.L.F is temporarily unavailable. Please try again.' 
    });
  }
});

app.get('/api/notifications', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    const allNotifs = loadNotifications();
    const userNotifs = allNotifs[userId.toString()] || [];
    const unreadCount = userNotifs.filter(n => !n.read).length;

    return res.json({
      success: true,
      notifications: userNotifs,
      unreadCount,
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications/read', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.body;

    const allNotifs = loadNotifications();
    const key = userId.toString();
    if (!allNotifs[key]) return res.json({ success: true });

    if (notificationId) {
      const notif = allNotifs[key].find(n => n.id === notificationId);
      if (notif) notif.read = true;
    } else {
      allNotifs[key].forEach(n => { n.read = true; });
    }

    saveNotifications(allNotifs);
    return res.json({ success: true });
  } catch (error) {
    console.error('Notification read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
});

const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('X-Content-Type-Options', 'nosniff');
      if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      if (filePath.endsWith('.map')) {
        res.status(404).end();
        return;
      }
    },
    dotfiles: 'deny',
    index: false,
  }));

  app.use((req, res, next) => {
    if (req.path.endsWith('.map')) {
      return res.status(404).json({ message: 'Not found' });
    }
    next();
  });

  app.use((req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('X-Content-Type-Options', 'nosniff');
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
} else {
  app.get('/', (req, res) => {
    res.json({ status: 'ok' });
  });
}

app.use((err, req, res, next) => {
  const requestId = req._requestId || 'unknown';
  const ip = req._clientIp || getClientIp(req);

  if (err.type === 'entity.parse.failed') {
    securityLog('WARN', 'MALFORMED_JSON', { ip, path: req.path });
    return res.status(400).json({ success: false, message: 'Invalid request body' });
  }

  if (err.type === 'entity.too.large') {
    securityLog('WARN', 'REQUEST_TOO_LARGE', { ip, path: req.path });
    return res.status(413).json({ success: false, message: 'Request too large' });
  }

  if (!IS_PRODUCTION) {
    console.error(`[ERROR:${requestId}] ${req.method} ${req.path}:`, err.message);
  }
  securityLog('ALERT', 'UNHANDLED_ERROR', { ip, path: req.path, method: req.method, requestId, error: err.message });

  res.status(err.status || 500).json({
    success: false,
    message: 'An internal error occurred',
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED_REJECTION]', reason?.message || reason);
  securityLog('ALERT', 'UNHANDLED_REJECTION', { error: reason?.message || String(reason) });
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION]', err.message);
  securityLog('ALERT', 'UNCAUGHT_EXCEPTION', { error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`WolfHost server running on port ${PORT}`);
  console.log(`Security: helmet=ON, cors=RESTRICTED, rate-limiting=ON, input-validation=ON`);
  console.log(`Mode: ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}`);
});
