import express from 'express'; // Server entrypoint updated
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import vehicleRoutes from './routes/vehicles.js';
import bookingRoutes from './routes/bookings.js';
import seedRoutes from './routes/seed.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';
import authRoutes, { seedDefaultAdmin } from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import messageRoutes from './routes/messages.js';
import settingsRoutes from './routes/settings.js';
import extraOptionsRoutes from './routes/extraOptions.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
app.use(compression());
app.use(cookieParser());
const PORT = process.env.PORT || 5000;

// ── 1. Security Headers via Helmet ──────────────────────────────────────────
// Sets X-Frame-Options (clickjacking), X-Content-Type-Options (MIME sniffing),
// Strict-Transport-Security, and a tight Content-Security-Policy.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", 'data:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'"],
        fontSrc:    ["'self'"],
        objectSrc:  ["'none'"],
        frameSrc:   ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Cloudinary images require this relaxed
  })
);

// ── 2. Strict CORS Whitelist ─────────────────────────────────────────────────
// Only the Next.js frontend origin is permitted to access the API.
// All other origins (including Postman with a browser Origin header) are rejected.
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl without -H Origin)
      // but block all browser cross-origin requests from unlisted origins.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin '${origin}' is not permitted.`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── 3. Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── 4. NoSQL Injection Sanitization ─────────────────────────────────────────
// express-mongo-sanitize is incompatible with Express 5 (req.query is a
// read-only getter on the prototype). We implement the same logic manually:
// recursively replace any key starting with '$' or containing '.' with '_'.
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      sanitizeObject(obj[key]);
    }
  }
}

app.use((req, _res, next) => {
  // Sanitize body (writable — safe to mutate in-place)
  if (req.body && typeof req.body === 'object') sanitizeObject(req.body);
  // Sanitize query params: req.query is read-only in Express 5, but its
  // *contents* (own enumerable properties) are still mutable.
  if (req.query && typeof req.query === 'object') sanitizeObject(req.query);
  // Sanitize route params (plain writable object)
  if (req.params && typeof req.params === 'object') sanitizeObject(req.params);
  next();
});

// ── 5. Rate Limiting ─────────────────────────────────────────────────────────
// Booking endpoint: 30 requests per 15 minutes per IP.
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many booking requests from this IP. Please wait 15 minutes before retrying.',
  },
});

// Upload endpoint: 20 requests per 15 minutes per IP (prevents mass upload spam).
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many upload requests from this IP. Please wait 15 minutes before retrying.',
  },
});

// Serve uploaded files locally when Cloudinary is bypassed or fallback is triggered
app.use('/uploads', express.static('public/uploads'));

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingLimiter, bookingRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/extra-options', extraOptionsRoutes);
app.use('/api/chat', chatRoutes);

// ── 7. Global Error Handler ──────────────────────────────────────────────────
// Catches CORS errors and any unhandled route/middleware errors.
// Never leaks stack traces or internal details to the client.
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const isCorsError = err.message && err.message.startsWith('CORS policy');
  if (isCorsError) {
    return res.status(403).json({ error: err.message });
  }
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${status}:`, err);
  res.status(status).json({ error: err.message || 'Internal server error.' });
});

// ── 8. MongoDB Connection with Retry ────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not defined in environment variables.');
  process.exit(1);
}

// Start the HTTP server immediately — independently of DB state.
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

const MONGOOSE_OPTS = {
  serverSelectionTimeoutMS: 30000, // wait up to 30 s to pick a server
  heartbeatFrequencyMS:     10000, // check server health every 10 s
  socketTimeoutMS:          45000, // close sockets after 45 s of inactivity
  bufferCommands:           false, // immediately error instead of buffering when disconnected
};

async function connectWithRetry(attempt = 1, maxAttempts = 20) {
  try {
    await mongoose.connect(MONGODB_URI, MONGOOSE_OPTS);
    console.log('Connected to MongoDB');
    await seedDefaultAdmin();
  } catch (error) {
    const delay = Math.min(1000 * 2 ** attempt, 30000);
    console.error(
      `[MongoDB] Attempt ${attempt}/${maxAttempts} failed: ${error.message}. Retrying in ${delay / 1000}s…`
    );
    if (attempt >= maxAttempts) {
      console.error('[MongoDB] Max attempts reached. Check Atlas Network Access whitelist.');
      return;
    }
    setTimeout(() => connectWithRetry(attempt + 1, maxAttempts), delay);
  }
}

// Auto-reconnect if the connection drops after initial connect
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected — attempting reconnect…');
  setTimeout(() => connectWithRetry(1, 20), 3000);
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err.message);
});

connectWithRetry();
