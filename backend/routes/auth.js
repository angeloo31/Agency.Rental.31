import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';

const router = express.Router();

// ── Brute-Force Protection for Login ──────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Max 10 login attempts per IP per 15 minutes
  message: { error: 'Too many login attempts. Please wait 15 minutes before trying again.' },
});

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod', { expiresIn: '7d' });
};

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    // Create a token
    const token = createToken(user._id);

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({ 
      username: user.username, 
      role: user.role
    });
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    res.status(500).json({ error: 'Failed to process login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
// Verifies the HTTP-only cookie and returns user data
router.get('/me', async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { _id } = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod');
    const user = await User.findById(_id).select('username role');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.status(200).json({ username: user.username, role: user.role });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// GET /api/auth/setup-status
// Checks if ANY users exist to determine if initial setup is needed
router.get('/setup-status', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.status(200).json({ setupRequired: count === 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check setup status.' });
  }
});

// POST /api/auth/setup
// Creates the VERY FIRST Admin user. Disabled if users already exist.
router.post('/setup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return res.status(403).json({ error: 'Setup already completed. Users exist.' });
    }

    // Strong password hashing
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      passwordHash,
      role: 'Admin', // Force Admin for the first user
    });

    const token = createToken(user._id);

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({ 
      username: user.username, 
      role: user.role,
      message: 'Initial Admin setup complete.'
    });
  } catch (error) {
    console.error('[Auth] Setup error:', error.message);
    res.status(500).json({ error: 'Failed to create initial admin.' });
  }
});

export default router;
