import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { sendOtpEmail } from '../utils/email.js';

const router = express.Router();

// Helper to seed default admin credentials (admin / admin) if database is empty
export async function seedDefaultAdmin() {
  try {
    const defaultEmail = process.env.SMTP_USER || 'yahiakrr@gmail.com';
    const count = await User.countDocuments();
    if (count === 0) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash('admin', salt);
      await User.create({
        username: 'admin',
        passwordHash,
        role: 'Admin',
        email: defaultEmail,
        emailVerified: false,
        twoFactorEnabled: false
      });
      console.log('[Auth] Default Admin seeded: username "admin", password "admin", email "' + defaultEmail + '"');
    } else {
      // Migrate any existing admin with dummy placeholder email to configured SMTP email
      const updated = await User.updateMany(
        { $or: [{ email: 'admin@luxerent.com' }, { email: { $exists: false } }] },
        { $set: { email: defaultEmail } }
      );
      if (updated.modifiedCount > 0) {
        console.log(`[Auth] Migrated ${updated.modifiedCount} admin user email(s) to "${defaultEmail}"`);
      }
    }
  } catch (error) {
    console.error('[Auth] Error seeding default admin:', error.message);
  }
}

// ── Brute-Force Protection for Login ──────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Max 10 login attempts per IP per 15 minutes
  message: { error: 'Trop de tentatives de connexion. Veuillez patienter 15 minutes.' },
});

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod', { expiresIn: '7d' });
};

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Le nom d\'utilisateur et le mot de passe sont requis.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect.' });
    }

    // ── Check if 2FA is enabled ─────────────────────────────────────────────
    if (user.twoFactorEnabled) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otpCode;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      const tempToken = jwt.sign(
        { _id: user._id, type: '2fa_pending' },
        process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod',
        { expiresIn: '10m' }
      );

      const emailToUse = user.email || process.env.SMTP_USER || 'yahiakrr@gmail.com';
      const emailResult = await sendOtpEmail(emailToUse, otpCode, '2FA');
      const maskedEmail = emailToUse.replace(/(^.)[^@]*(@.*$)/, '$1***$2');

      return res.status(200).json({
        requires2FA: true,
        tempToken,
        emailMasked: maskedEmail,
        devOtpCode: emailResult.devOtp,
        message: 'Code de vérification 2FA envoyé à votre adresse e-mail.'
      });
    }

    // Direct Login (No 2FA)
    const token = createToken(user._id);

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
    res.status(500).json({ error: 'Échec du traitement de la connexion.' });
  }
});

// POST /api/auth/verify-2fa
// Verifies 6-digit OTP code to complete 2FA login
router.post('/verify-2fa', loginLimiter, async (req, res) => {
  const { tempToken, code } = req.body;

  if (!tempToken || !code) {
    return res.status(400).json({ error: 'Jeton temporaire et code à 6 chiffres requis.' });
  }

  try {
    const payload = jwt.verify(tempToken, process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod');
    if (payload.type !== '2fa_pending') {
      return res.status(401).json({ error: 'Jeton de vérification 2FA invalide.' });
    }

    const user = await User.findById(payload._id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    if (!user.otpCode || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ error: 'Code de vérification expiré ou invalide. Veuillez vous reconnecter.' });
    }

    if (user.otpCode.trim() !== code.trim()) {
      return res.status(400).json({ error: 'Code de vérification 2FA incorrect.' });
    }

    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    const token = createToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      username: user.username,
      role: user.role,
      message: 'Authentification 2FA réussie.'
    });
  } catch (error) {
    console.error('[Auth] Verify 2FA error:', error.message);
    res.status(401).json({ error: 'Session 2FA expirée ou invalide. Veuillez réessayer.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Déconnexion réussie' });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    const { _id } = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod');
    const user = await User.findById(_id).select('username role email emailVerified twoFactorEnabled');
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ 
      username: user.username, 
      role: user.role,
      email: user.email || process.env.SMTP_USER || 'yahiakrr@gmail.com',
      emailVerified: user.emailVerified || false,
      twoFactorEnabled: user.twoFactorEnabled || false
    });
  } catch (error) {
    res.status(401).json({ error: 'Jeton invalide' });
  }
});

// POST /api/auth/update-email
router.post('/update-email', requireAuth, async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    if (email && email.trim() !== '' && email.trim().toLowerCase() !== user.email) {
      user.email = email.trim().toLowerCase();
      user.emailVerified = false;
      await user.save();
      return res.status(200).json({ 
        message: 'E-mail mis à jour avec succès.', 
        email: user.email, 
        emailVerified: user.emailVerified 
      });
    }
    return res.status(200).json({ message: 'Aucun changement effectué.' });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la mise à jour de l\'e-mail.' });
  }
});

// POST /api/auth/toggle-2fa
// Enables or disables 2FA for logged-in user
router.post('/toggle-2fa', requireAuth, async (req, res) => {
  const { enabled, email } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    if (typeof enabled === 'boolean') {
      user.twoFactorEnabled = enabled;
    }

    if (email && email.trim() !== '' && email.trim().toLowerCase() !== user.email) {
      user.email = email.trim().toLowerCase();
      user.emailVerified = false;
    }

    await user.save();

    res.status(200).json({
      message: user.twoFactorEnabled ? 'Authentification 2FA activée.' : 'Authentification 2FA désactivée.',
      twoFactorEnabled: user.twoFactorEnabled,
      email: user.email,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error('[Auth] Toggle 2FA error:', error.message);
    res.status(500).json({ error: 'Échec du changement du statut 2FA.' });
  }
});

// POST /api/auth/send-verification-email
router.post('/send-verification-email', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otpCode;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const result = await sendOtpEmail(user.email || process.env.SMTP_USER || 'yahiakrr@gmail.com', otpCode, 'VERIFY_EMAIL');

    res.status(200).json({
      message: 'Code de vérification e-mail envoyé.',
      devOtpCode: result.devOtp
    });
  } catch (error) {
    console.error('[Auth] Send email verification error:', error.message);
    res.status(500).json({ error: 'Échec de l\'envoi du code de vérification.' });
  }
});

// POST /api/auth/verify-email-code
router.post('/verify-email-code', requireAuth, async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code de vérification requis.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    if (!user.otpCode || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ error: 'Code expiré ou invalide.' });
    }

    if (user.otpCode.trim() !== code.trim()) {
      return res.status(400).json({ error: 'Code de vérification incorrect.' });
    }

    user.emailVerified = true;
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({
      message: 'Adresse e-mail vérifiée avec succès !',
      emailVerified: true
    });
  } catch (error) {
    console.error('[Auth] Verify email error:', error.message);
    res.status(500).json({ error: 'Échec de la vérification de l\'e-mail.' });
  }
});

// POST /api/auth/change-credentials
router.post('/change-credentials', requireAuth, async (req, res) => {
  const { currentPassword, newUsername, newPassword, email } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ error: 'Le mot de passe actuel est requis pour valider les modifications.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    }

    if (newUsername && newUsername.trim() !== '' && newUsername.trim() !== user.username) {
      const trimmedUsername = newUsername.trim();
      const existingUser = await User.findOne({ username: trimmedUsername, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà utilisé par un autre compte.' });
      }
      user.username = trimmedUsername;
    }

    if (email && email.trim() !== '' && email.trim().toLowerCase() !== user.email) {
      user.email = email.trim().toLowerCase();
      user.emailVerified = false;
    }

    if (newPassword && newPassword.trim() !== '') {
      if (newPassword.length < 4) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 4 caractères.' });
      }
      const salt = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.status(200).json({
      message: 'Identifiants mis à jour avec succès.',
      username: user.username,
      role: user.role,
      email: user.email,
      emailVerified: user.emailVerified
    });
  } catch (error) {
    console.error('[Auth] Change credentials error:', error.message);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des identifiants.' });
  }
});

// POST /api/auth/forgot-password - Step 1: Request verification code to email
router.post('/forgot-password', loginLimiter, async (req, res) => {
  const { identifier } = req.body;

  if (!identifier || identifier.trim() === '') {
    return res.status(400).json({ error: "Veuillez saisir votre nom d'utilisateur ou votre adresse e-mail." });
  }

  try {
    const cleanId = identifier.trim();
    const user = await User.findOne({
      $or: [
        { username: cleanId },
        { email: cleanId.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: "Aucun compte d'utilisateur associé à cet identifiant." });
    }

    // Generate 6-digit OTP code valid for 15 minutes
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otpCode;
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const recipientEmail = user.email || process.env.SMTP_USER || 'admin@luxerent.com';
    const emailResult = await sendOtpEmail(recipientEmail, otpCode, 'RESET');

    const maskedEmail = recipientEmail.replace(/(^.{2})(.*)(?=@)/, (match, p1, p2) => p1 + '*'.repeat(p2.length));

    res.status(200).json({
      message: `Un code de vérification à 6 chiffres a été envoyé à ${maskedEmail}.`,
      emailMasked: maskedEmail,
      username: user.username,
      devOtp: emailResult.devOtp || null,
      sentViaSmtp: emailResult.sentViaSmtp
    });
  } catch (error) {
    console.error('[Auth] Forgot password error:', error.message);
    res.status(500).json({ error: 'Échec de la demande de réinitialisation de mot de passe.' });
  }
});

// POST /api/auth/reset-password - Step 2: Verify code & reset password
router.post('/reset-password', loginLimiter, async (req, res) => {
  const { username, identifier, otpCode, recoveryKey, newPassword } = req.body;

  const targetId = (username || identifier || '').trim();
  const code = (otpCode || recoveryKey || '').trim();

  if (!targetId || !code || !newPassword) {
    return res.status(400).json({ error: "L'identifiant, le code de vérification et le nouveau mot de passe sont requis." });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 4 caractères.' });
  }

  try {
    const user = await User.findOne({
      $or: [
        { username: targetId },
        { email: targetId.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: "Nom d'utilisateur introuvable." });
    }

    const masterKey = process.env.ADMIN_RECOVERY_KEY || 'admin-reset-2026';
    const isMasterKey = code === masterKey;

    if (!isMasterKey) {
      if (!user.otpCode || user.otpCode !== code) {
        return res.status(400).json({ error: 'Code de vérification incorrect.' });
      }
      if (user.otpExpires && new Date(user.otpExpires) < new Date()) {
        return res.status(400).json({ error: 'Le code de vérification a expiré (valable 15 minutes). Veuillez effectuer une nouvelle demande.' });
      }
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès ! Redirection...' });
  } catch (error) {
    console.error('[Auth] Password reset error:', error.message);
    res.status(500).json({ error: 'Échec de la réinitialisation du mot de passe.' });
  }
});

// GET /api/auth/setup-status
router.get('/setup-status', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.status(200).json({ setupRequired: count === 0 });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la vérification du statut d\'installation.' });
  }
});

// POST /api/auth/setup
router.post('/setup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis.' });
  }

  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return res.status(403).json({ error: 'L\'installation est déjà terminée. Des utilisateurs existent déjà.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      passwordHash,
      role: 'Admin',
      email: process.env.SMTP_USER || 'yahiakrr@gmail.com',
    });

    const token = createToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ 
      username: user.username, 
      role: user.role,
      message: 'Installation administrateur initiale terminée.'
    });
  } catch (error) {
    console.error('[Auth] Setup error:', error.message);
    res.status(500).json({ error: 'Échec de la création de l\'administrateur initial.' });
  }
});

export default router;
