/** Templates EN CODE des emails de candidature de marque. */
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
  <div style="padding: 0 24px 24px;">${body}</div>
  <div style="text-align:center; color:#888; font-size:12px; padding:16px;">© Mana Chain</div>
</div>`;

const button = (url: string, label: string): string => `
  <p style="text-align:center; margin: 28px 0;">
    <a href="${url}" style="background:#111; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none;">${label}</a>
  </p>`;

export const applicationVerificationEmail = (
  firstName: string,
  brandName: string,
  verificationUrl: string,
  logoUrl: string,
): RenderedEmail => ({
  subject: `Verify your email for ${brandName} — Mana Chain`,
  html: layout(
    logoUrl,
    `<h2>Hi ${firstName},</h2>
     <p>Confirm your email to finalize the application for <strong>${brandName}</strong>.</p>
     ${button(verificationUrl, 'Verify my email')}
     <p style="color:#666; font-size:13px;">This link expires in 24 hours.</p>`,
  ),
  text: `Hi ${firstName}, verify your email for ${brandName}: ${verificationUrl} (expires in 24h)`,
});

export const adminNotificationEmail = (
  brandName: string,
  contactName: string,
  contactEmail: string,
  country: string,
  reviewUrl: string,
  logoUrl: string,
): RenderedEmail => ({
  subject: `New brand application: ${brandName}`,
  html: layout(
    logoUrl,
    `<h2>New brand application</h2>
     <ul>
       <li><strong>Brand:</strong> ${brandName}</li>
       <li><strong>Contact:</strong> ${contactName} (${contactEmail})</li>
       <li><strong>Country:</strong> ${country}</li>
     </ul>
     ${button(reviewUrl, 'Review the application')}`,
  ),
  text: `New brand application: ${brandName} — ${contactName} (${contactEmail}), ${country}. Review: ${reviewUrl}`,
});

export const applicationApprovedEmail = (
  brandName: string,
  username: string,
  temporaryPassword: string,
  loginUrl: string,
  logoUrl: string,
): RenderedEmail => ({
  subject: `Your brand ${brandName} has been approved 🎉`,
  html: layout(
    logoUrl,
    `<h2>Welcome aboard, ${brandName} 🎉</h2>
     <p>Your application is approved. Sign in with these temporary credentials and change your password on first login:</p>
     <ul>
       <li><strong>Username:</strong> ${username}</li>
       <li><strong>Temporary password:</strong> ${temporaryPassword}</li>
     </ul>
     ${button(loginUrl, 'Sign in')}`,
  ),
  text: `Brand ${brandName} approved. Username: ${username} — Temporary password: ${temporaryPassword}. Sign in: ${loginUrl}`,
});

export const applicationRejectedEmail = (
  brandName: string,
  rejectionReason: string,
  applicationUrl: string,
  logoUrl: string,
): RenderedEmail => ({
  subject: `Update on your brand application (${brandName})`,
  html: layout(
    logoUrl,
    `<h2>About your application for ${brandName}</h2>
     <p>After review, your application was not approved at this time.</p>
     <p><strong>Reason:</strong> ${rejectionReason}</p>
     ${button(applicationUrl, 'Submit a new application')}`,
  ),
  text: `Your application for ${brandName} was not approved. Reason: ${rejectionReason}. Re-apply: ${applicationUrl}`,
});
