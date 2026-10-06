import nodemailer from 'nodemailer';

// Creates transporter if SMTP settings are present in process.env
const createTransporter = () => {
  const host = (process.env.SMTP_HOST || '').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || '').trim();
  const pass = rawPass.replace(/\s+/g, '');

  if (!user || !pass) return null;

  if (host.includes('gmail') || user.endsWith('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  if (host) {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return null;
};

// Sends 2FA / Verification / Reset OTP Code email to user
export async function sendOtpEmail(toEmail, otpCode, subjectType = '2FA') {
  const transporter = createTransporter();
  const subject = subjectType === '2FA' 
    ? '🔐 Code de vérification 2FA - LuxeRent'
    : subjectType === 'RESET'
    ? '🔑 Code de réinitialisation du mot de passe - LuxeRent'
    : '✉️ Vérification de votre adresse e-mail - LuxeRent';

  const actionText = subjectType === 'RESET'
    ? 'Voici votre code à 6 chiffres pour réinitialiser votre mot de passe :'
    : 'Voici votre code de sécurité à 6 chiffres :';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #4f46e5; text-align: center;">LuxeRent Security</h2>
      <p style="font-size: 14px; color: #475569;">Bonjour,</p>
      <p style="font-size: 14px; color: #475569;">${actionText}</p>
      <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 12px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e1b4b;">${otpCode}</span>
      </div>
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Ce code est valable pendant 15 minutes. Si vous n'avez pas demandé ce code, veuillez ignorer cet e-mail.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'LuxeRent Security'}" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[Email] OTP sent successfully to ${toEmail}`);
      return { success: true, sentViaSmtp: true };
    } catch (err) {
      console.error('[Email] Failed to send via SMTP:', err.message);
      console.log(`[DEV OTP CODE for ${toEmail}]: ${otpCode}`);
      return { success: true, sentViaSmtp: false, devOtp: otpCode, errorMsg: err.message };
    }
  } else {
    console.log(`\n==================================================`);
    console.log(`[DEV MODE] SMTP not configured in .env.`);
    console.log(`[2FA OTP CODE for ${toEmail}]: === ${otpCode} ===`);
    console.log(`==================================================\n`);
    return { success: true, sentViaSmtp: false, devOtp: otpCode };
  }
}
