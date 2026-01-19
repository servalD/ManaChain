// Email Service for sending verification emails
// Uses SMTP via Nodemailer
// Templates are stored in database (email_template table)

import nodemailer from 'nodemailer';
import { renderEmailTemplate } from './email-template.service';

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
  
  const templateResult = await renderEmailTemplate('verification', {
    username,
    verificationUrl,
    frontendUrl: FRONTEND_URL,
  });

  if (!templateResult.success || !templateResult.data) {
    console.error('Failed to render verification email template:', templateResult.error);
    throw new Error('Failed to render email template');
  }

  await sendEmail({
    to: toEmail,
    subject: templateResult.data.subject,
    html: templateResult.data.html,
    text: templateResult.data.text,
  });
};

/**
 * Send welcome email to user
 */
export const sendWelcomeEmail = async (
  toEmail: string,
  username: string
): Promise<void> => {
  const templateResult = await renderEmailTemplate('welcome', {
    username,
    frontendUrl: FRONTEND_URL,
  });

  if (!templateResult.success || !templateResult.data) {
    console.error('Failed to render welcome email template:', templateResult.error);
    throw new Error('Failed to render email template');
  }

  await sendEmail({
    to: toEmail,
    subject: templateResult.data.subject,
    html: templateResult.data.html,
    text: templateResult.data.text,
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
  
  const templateResult = await renderEmailTemplate('password_reset', {
    username,
    resetUrl,
    frontendUrl: FRONTEND_URL,
  });

  if (!templateResult.success || !templateResult.data) {
    console.error('Failed to render password reset email template:', templateResult.error);
    throw new Error('Failed to render email template');
  }

  await sendEmail({
    to: toEmail,
    subject: templateResult.data.subject,
    html: templateResult.data.html,
    text: templateResult.data.text,
  });
};

/**
 * Send brand application notification to admin
 */
export const sendBrandApplicationNotificationEmail = async (
  adminEmail: string,
  applicationData: any
): Promise<void> => {
  const reviewUrl = `${FRONTEND_URL}/admin/applications/${applicationData.id}`;
  
  const templateResult = await renderEmailTemplate('brand_application_notification', {
    brand_name: applicationData.brand_name,
    industry_type: applicationData.industry_type,
    contact_first_name: applicationData.contact_first_name,
    contact_last_name: applicationData.contact_last_name,
    contact_email: applicationData.contact_email,
    country: applicationData.country,
    website_url: applicationData.website_url || 'N/A',
    website_url_display: applicationData.website_url ? 'block' : 'none',
    application_id: applicationData.id,
    review_url: reviewUrl,
    frontendUrl: FRONTEND_URL,
  });

  if (!templateResult.success || !templateResult.data) {
    console.error('Failed to render brand application notification email template:', templateResult.error);
    throw new Error('Failed to render email template');
  }

  await sendEmail({
    to: adminEmail,
    subject: templateResult.data.subject,
    html: templateResult.data.html,
    text: templateResult.data.text,
  });
};

/**
 * Send brand application approval email with credentials
 */
export const sendBrandApplicationApprovedEmail = async (
  brandEmail: string,
  credentials: { username: string; password: string },
  brandName: string
): Promise<void> => {
  const loginUrl = `${FRONTEND_URL}/login`;
  
  const templateResult = await renderEmailTemplate('brand_application_approved', {
    brand_name: brandName,
    username: credentials.username,
    password: credentials.password,
    loginUrl,
    frontendUrl: FRONTEND_URL,
  });

  if (!templateResult.success || !templateResult.data) {
    console.error('Failed to render brand application approved email template:', templateResult.error);
    throw new Error('Failed to render email template');
  }

  await sendEmail({
    to: brandEmail,
    subject: templateResult.data.subject,
    html: templateResult.data.html,
    text: templateResult.data.text,
  });
};

/**
 * Send brand application rejection email
 */
export const sendBrandApplicationRejectedEmail = async (
  brandEmail: string,
  rejectionReason: string,
  brandName: string
): Promise<void> => {
  const applicationUrl = `${FRONTEND_URL}/brand-application`;
  
  const templateResult = await renderEmailTemplate('brand_application_rejected', {
    brand_name: brandName,
    rejection_reason: rejectionReason,
    application_url: applicationUrl,
    frontendUrl: FRONTEND_URL,
  });

  if (!templateResult.success || !templateResult.data) {
    console.error('Failed to render brand application rejected email template:', templateResult.error);
    throw new Error('Failed to render email template');
  }

  await sendEmail({
    to: brandEmail,
    subject: templateResult.data.subject,
    html: templateResult.data.html,
    text: templateResult.data.text,
  });
};
