import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 contact messages per IP per 15 minutes
  message: { error: 'Too many messages sent. Please wait 15 minutes before sending another message.' }
});

// ── POST /api/messages ────────────────────────────────────────────────────────
// Public route for clients to submit a contact form message.
router.post(
  '/',
  messageLimiter,
  [
    body('name').trim().notEmpty().isLength({ max: 100 }).escape(),
    body('email').trim().isEmail().normalizeEmail(),
    body('subject').trim().notEmpty().isLength({ max: 200 }).escape(),
    body('message').trim().notEmpty().isLength({ max: 2000 }).escape()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg || 'Invalid contact message data.' });
    }

    try {
      const { name, email, subject, message } = req.body;

      const newMessage = await Message.create({
        name,
        email,
        subject,
        message
      });

      res.status(201).json(newMessage);
    } catch (error) {
      console.error('[Messages] POST error:', error.message);
      res.status(500).json({ error: 'Message could not be sent.' });
    }
  }
);

// ── GET /api/messages ─────────────────────────────────────────────────────────
// Protected admin route to fetch all messages
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('[Messages] GET error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// ── PATCH /api/messages/:id/read ──────────────────────────────────────────────
// Protected admin route to mark a message as Read/Unread
router.patch('/:id/read', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Unread', 'Read'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid message ID format.' });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    res.json(updatedMessage);
  } catch (error) {
    console.error('[Messages] PATCH error:', error.message);
    res.status(500).json({ error: 'Failed to update message status.' });
  }
});

// ── DELETE /api/messages/:id ──────────────────────────────────────────────────
// Protected admin route to delete a message
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid message ID format.' });
    }

    const deletedMessage = await Message.findByIdAndDelete(req.params.id);
    if (!deletedMessage) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    res.json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    console.error('[Messages] DELETE error:', error.message);
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

export default router;
