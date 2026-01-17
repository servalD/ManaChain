// Email Service for sending verification emails
// Uses SMTP via Nodemailer

import nodemailer from 'nodemailer';

const EMAIL_FROM = process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@mana-chain.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// SMTP configuration
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// Check if SMTP is configured
const isSmtpConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Create SMTP transporter
 */
const createTransporter = () => {
  if (!isSmtpConfigured) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Set to true in production with valid certificates
    },
  });
};

/**
 * Send an email via SMTP or simulation mode
 */
const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!isSmtpConfigured) {
    // Simulation mode when SMTP is not configured
    console.warn('⚠️ SMTP not configured. Running in simulation mode.');
    console.log('📧 Email sent (simulation mode):');
    console.log('To:', options.to);
    console.log('From:', EMAIL_FROM);
    console.log('Subject:', options.subject);
    console.log('Content:', options.html);
    return;
  }

  try {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Failed to create SMTP transporter');
    }

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`✅ Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Send verification email to a user
 */
export const sendVerificationEmail = async (
  toEmail: string,
  verificationToken: string,
  username: string
): Promise<void> => {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const subject = 'Verify your email address - Mana Chain';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #7c3aed;
            font-size: 32px;
            margin: 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #7c3aed;
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            color: #666;
            font-size: 14px;
          }
          .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>⚡ Mana Chain</h1>
          </div>
          <h2>Hello ${username}! 👋</h2>
          <p>Thank you for signing up on Mana Chain, the platform where brands can build their community and raise funds through fractional tokens.</p>
          <p>To get started, please verify your email address by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify my email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #7c3aed;">${verificationUrl}</p>
          <div class="warning">
            <strong>⚠️ Important:</strong> This link will expire in 24 hours. If you didn't create an account on Mana Chain, please ignore this email.
          </div>
          <div class="footer">
            <p><strong>Why verify your email?</strong></p>
            <ul>
              <li>Access all platform features</li>
              <li>Participate in brand token issuances</li>
              <li>Receive important notifications</li>
              <li>Secure your account</li>
            </ul>
            <p>Need help? Contact us at support@mana-chain.com</p>
            <p style="margin-top: 30px;">Mana Chain - The future of brand engagement</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  const text = `
Hello ${username}!

Thank you for signing up on Mana Chain.

Please verify your email address by visiting this link:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account on Mana Chain, please ignore this email.

Best regards,
The Mana Chain Team
  `;
  
  await sendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });
};

/**
 * Send welcome email to user
 */
export const sendWelcomeEmail = async (
  toEmail: string,
  username: string
): Promise<void> => {
  const subject = 'Welcome to Mana Chain! 🎉';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #7c3aed;
            font-size: 32px;
            margin: 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #7c3aed;
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .feature-box {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>⚡ Mana Chain</h1>
          </div>
          <h2>Welcome ${username}! 🎉</h2>
          <p>Your email has been successfully verified! You now have full access to all Mana Chain features.</p>
          
          <h3>What can you do now?</h3>
          
          <div class="feature-box">
            <h4>🔍 Discover brands</h4>
            <p>Explore emerging brands and established companies looking to build their community.</p>
          </div>
          
          <div class="feature-box">
            <h4>💎 Invest in tokens</h4>
            <p>Purchase fractional tokens from brands you support and participate in their growth.</p>
          </div>
          
          <div class="feature-box">
            <h4>🎟️ Attend exclusive events</h4>
            <p>Token holders have access to special events organized by brands.</p>
          </div>
          
          <div class="feature-box">
            <h4>🏢 Create your brand</h4>
            <p>Are you a company? Issue your own token and build your community of supporters!</p>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${FRONTEND_URL}" class="button">Start exploring</a>
          </div>
          
          <div class="footer">
            <p>Need help? Check out our <a href="${FRONTEND_URL}/help">help center</a> or contact us at support@mana-chain.com</p>
            <p style="margin-top: 30px;">Mana Chain - The future of brand engagement</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  const text = `
Welcome ${username}!

Your email has been successfully verified! You now have full access to all Mana Chain features.

What can you do now?
- Discover brands
- Invest in tokens
- Attend exclusive events
- Create your brand

Visit the platform: ${FRONTEND_URL}

Need help? Contact us at support@mana-chain.com

Best regards,
The Mana Chain Team
  `;
  
  await sendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  toEmail: string,
  resetToken: string,
  username: string
): Promise<void> => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const subject = 'Reset your password - Mana Chain';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #7c3aed;
            font-size: 32px;
            margin: 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #7c3aed;
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            color: #666;
            font-size: 14px;
          }
          .warning {
            background-color: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>⚡ Mana Chain</h1>
          </div>
          <h2>Password reset request</h2>
          <p>Hello ${username},</p>
          <p>We received a request to reset the password for your Mana Chain account.</p>
          <p>Click the button below to choose a new password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset my password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #7c3aed;">${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ Security:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and ensure your account is secure.
          </div>
          <div class="footer">
            <p>Need help? Contact us at support@mana-chain.com</p>
            <p style="margin-top: 30px;">Mana Chain - The future of brand engagement</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  const text = `
Hello ${username},

We received a request to reset the password for your Mana Chain account.

Visit this link to choose a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

Best regards,
The Mana Chain Team
  `;
  
  await sendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });
};
