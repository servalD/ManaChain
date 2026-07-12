/**
 * Templates d'emails transactionnels EN CODE (remplacent la table `email_template`
 * de l'Express). Chaque fonction renvoie `{ subject, html, text }`. Mise en page
 * commune via {@link layout}. Le logo est passé en URL (servie par l'API).
 */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const layout = (logoUrl: string, body: string): string => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
  <div style="text-align:center; padding: 24px 0;">
    <img src="${logoUrl}" alt="Mana Chain" style="max-width: 200px; height: auto;" />
  </div>
  <div style="padding: 0 24px 24px;">
    ${body}
  </div>
  <div style="text-align:center; color:#888; font-size:12px; padding:16px;">
    © Mana Chain
  </div>
</div>`;

const button = (url: string, label: string): string => `
  <p style="text-align:center; margin: 28px 0;">
    <a href="${url}" style="background:#111; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; display:inline-block;">${label}</a>
  </p>`;

export const verificationEmail = (
  username: string,
  verificationUrl: string,
  logoUrl: string,
): RenderedEmail => ({
  subject: 'Verify your email — Mana Chain',
  html: layout(
    logoUrl,
    `<h2>Welcome, ${username} 👋</h2>
     <p>Confirm your email address to activate your Mana Chain account.</p>
     ${button(verificationUrl, 'Verify my email')}
     <p style="color:#666; font-size:13px;">This link expires in 24 hours. If the button doesn't work, copy this URL:<br>${verificationUrl}</p>`,
  ),
  text: `Welcome ${username}! Verify your email: ${verificationUrl} (expires in 24h)`,
});

export const welcomeEmail = (
  username: string,
  logoUrl: string,
): RenderedEmail => ({
  subject: 'Welcome to Mana Chain 🎉',
  html: layout(
    logoUrl,
    `<h2>You're all set, ${username} 🎉</h2>
     <p>Your email is verified and your account is active. Welcome aboard!</p>`,
  ),
  text: `You're all set, ${username}! Your Mana Chain account is active.`,
});

export const passwordResetEmail = (
  username: string,
  resetUrl: string,
  logoUrl: string,
): RenderedEmail => ({
  subject: 'Reset your password — Mana Chain',
  html: layout(
    logoUrl,
    `<h2>Password reset</h2>
     <p>Hi ${username}, we received a request to reset your password.</p>
     ${button(resetUrl, 'Reset my password')}
     <p style="color:#666; font-size:13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
  ),
  text: `Reset your password: ${resetUrl} (expires in 1h). Ignore if you didn't request it.`,
});

export const passwordChangedEmail = (
  username: string,
  logoUrl: string,
): RenderedEmail => ({
  subject: 'Your password was changed — Mana Chain',
  html: layout(
    logoUrl,
    `<h2>Password changed</h2>
     <p>Hi ${username}, your Mana Chain password was just changed. If this wasn't you, contact support immediately.</p>`,
  ),
  text: `Hi ${username}, your Mana Chain password was changed. If this wasn't you, contact support.`,
});

export const passwordExpiryReminderEmail = (
  username: string,
  changePasswordUrl: string,
  logoUrl: string,
): RenderedEmail => ({
  subject: 'Time to update your password — Mana Chain',
  html: layout(
    logoUrl,
    `<h2>Password rotation reminder</h2>
     <p>Hi ${username}, it's been a while since you last changed your Mana Chain password. As a security best practice, we recommend updating it regularly.</p>
     ${button(changePasswordUrl, 'Change my password')}
     <p style="color:#666; font-size:13px;">This is just a reminder — your account isn't blocked and you can ignore this email if you'd rather keep your current password.</p>`,
  ),
  text: `Hi ${username}, it's been a while since you last changed your Mana Chain password. Update it here: ${changePasswordUrl} (this is just a reminder, your account isn't blocked).`,
});

export const twoFactorEnabledEmail = (
  username: string,
  logoUrl: string,
): RenderedEmail => ({
  subject: 'Two-factor authentication enabled — Mana Chain',
  html: layout(
    logoUrl,
    `<h2>Two-factor authentication enabled</h2>
     <p>Hi ${username}, two-factor authentication was just enabled on your Mana Chain account. If this wasn't you, contact support immediately.</p>`,
  ),
  text: `Hi ${username}, two-factor authentication was enabled on your Mana Chain account. If this wasn't you, contact support.`,
});

export const twoFactorDisabledEmail = (
  username: string,
  logoUrl: string,
): RenderedEmail => ({
  subject: 'Two-factor authentication disabled — Mana Chain',
  html: layout(
    logoUrl,
    `<h2>Two-factor authentication disabled</h2>
     <p>Hi ${username}, two-factor authentication was just disabled on your Mana Chain account. If this wasn't you, contact support immediately.</p>`,
  ),
  text: `Hi ${username}, two-factor authentication was disabled on your Mana Chain account. If this wasn't you, contact support.`,
});
