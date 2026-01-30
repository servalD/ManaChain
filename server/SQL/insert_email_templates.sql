-- Insert Email Templates
-- These templates are used by the email service to send styled emails
-- 
-- Usage: Run this script after creating the email_template table
-- The templates use placeholders like {{variable}} which are replaced at runtime
-- 
-- Template types:
-- - verification: Email verification link
-- - welcome: Welcome email after verification
-- - password_reset: Password reset link
-- - brand_application_notification: Admin notification for new brand application
-- - brand_application_approved: Brand approval with credentials
-- - brand_application_rejected: Brand rejection with reason

-- Template: verification (Email verification)
INSERT INTO email_template (template_type, subject, html_content, text_content, description) VALUES (
  'verification',
  'Verify your email address - Mana Chain',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;
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
      .logo img {
        max-width: 200px;
        height: auto;
        display: block;
        margin: 0 auto;
      }
      .button {
        display: inline-block;
        padding: 14px 32px;
        background: linear-gradient(to right, #7c3aed, #a855f7, #6366f1);
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        margin: 20px 0;
        box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.39);
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
      .link {
        word-break: break-all;
        color: #7c3aed;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo"><img src="{{logoUrl}}" alt="Mana Chain" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" /></div>
      <h2>Hello {{username}}! 👋</h2>
      <p>Thank you for signing up on Mana Chain, the platform where brands can build their community and raise funds through fractional tokens.</p>
      <p>To get started, please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="{{verificationUrl}}" class="button">Verify my email</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p class="link">{{verificationUrl}}</p>
      <div class="warning">
        <strong>⚠️ Important:</strong> This link will expire in 24 hours. If you didn''t create an account on Mana Chain, please ignore this email.
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
</html>',
  'Hello {{username}}!

Thank you for signing up on Mana Chain.

Please verify your email address by visiting this link:
{{verificationUrl}}

This link will expire in 24 hours.

If you didn''t create an account on Mana Chain, please ignore this email.

Best regards,
The Mana Chain Team',
  'Email sent to users when they register, containing the verification link'
) ON CONFLICT (template_type) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Template: welcome (Welcome email after verification)
INSERT INTO email_template (template_type, subject, html_content, text_content, description) VALUES (
  'welcome',
  'Welcome to Mana Chain! 🎉',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;
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
      .logo img {
        max-width: 200px;
        height: auto;
        display: block;
        margin: 0 auto;
      }
      .button {
        display: inline-block;
        padding: 14px 32px;
        background: linear-gradient(to right, #7c3aed, #a855f7, #6366f1);
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        margin: 20px 0;
        box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.39);
      }
      .feature-box {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(168, 85, 247, 0.1));
        border-left: 4px solid #7c3aed;
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
      <div class="logo"><img src="{{logoUrl}}" alt="Mana Chain" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" /></div>
      <h2>Welcome {{username}}! 🎉</h2>
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
        <a href="{{frontendUrl}}" class="button">Start exploring</a>
      </div>
      
      <div class="footer">
        <p>Need help? Check out our <a href="{{frontendUrl}}/help" style="color: #7c3aed;">help center</a> or contact us at support@mana-chain.com</p>
        <p style="margin-top: 30px;">Mana Chain - The future of brand engagement</p>
      </div>
    </div>
  </body>
</html>',
  'Welcome {{username}}!

Your email has been successfully verified! You now have full access to all Mana Chain features.

What can you do now?
- Discover brands
- Invest in tokens
- Attend exclusive events
- Create your brand

Visit the platform: {{frontendUrl}}

Need help? Contact us at support@mana-chain.com

Best regards,
The Mana Chain Team',
  'Email sent to users after they verify their email address'
) ON CONFLICT (template_type) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Template: password_reset (Password reset email)
INSERT INTO email_template (template_type, subject, html_content, text_content, description) VALUES (
  'password_reset',
  'Reset your password - Mana Chain',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;
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
      .logo img {
        max-width: 200px;
        height: auto;
        display: block;
        margin: 0 auto;
      }
      .button {
        display: inline-block;
        padding: 14px 32px;
        background: linear-gradient(to right, #7c3aed, #a855f7, #6366f1);
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        margin: 20px 0;
        box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.39);
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
      .link {
        word-break: break-all;
        color: #7c3aed;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo"><img src="{{logoUrl}}" alt="Mana Chain" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" /></div>
      <h2>Password reset request</h2>
      <p>Hello {{username}},</p>
      <p>We received a request to reset the password for your Mana Chain account.</p>
      <p>Click the button below to choose a new password:</p>
      <div style="text-align: center;">
        <a href="{{resetUrl}}" class="button">Reset my password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p class="link">{{resetUrl}}</p>
      <div class="warning">
        <strong>⚠️ Security:</strong> This link will expire in 1 hour. If you didn''t request a password reset, please ignore this email and ensure your account is secure.
      </div>
      <div class="footer">
        <p>Need help? Contact us at support@mana-chain.com</p>
        <p style="margin-top: 30px;">Mana Chain - The future of brand engagement</p>
      </div>
    </div>
  </body>
</html>',
  'Hello {{username}},

We received a request to reset the password for your Mana Chain account.

Visit this link to choose a new password:
{{resetUrl}}

This link will expire in 1 hour.

If you didn''t request a password reset, please ignore this email.

Best regards,
The Mana Chain Team',
  'Email sent to users when they request a password reset'
) ON CONFLICT (template_type) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Template: password_changed (Confirmation after password change or reset)
INSERT INTO email_template (template_type, subject, html_content, text_content, description) VALUES (
  'password_changed',
  'Your password was changed - Mana Chain',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
      .container { background-color: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
      .logo img { max-width: 200px; height: auto; display: block; margin: 0 auto; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo"><img src="{{logoUrl}}" alt="Mana Chain" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" /></div>
      <h2>Password updated</h2>
      <p>Hello {{username}},</p>
      <p>Your Mana Chain account password was successfully changed. If you did not make this change, please contact support immediately.</p>
      <div class="footer">
        <p>Mana Chain - The future of brand engagement</p>
      </div>
    </div>
  </body>
</html>',
  'Hello {{username}},

Your Mana Chain account password was successfully changed. If you did not make this change, please contact support immediately.

Best regards,
The Mana Chain Team',
  'Sent after user successfully changes or resets password.'
) ON CONFLICT (template_type) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Template: brand_application_notification (Admin notification for new brand application)
INSERT INTO email_template (template_type, subject, html_content, text_content, description) VALUES (
  'brand_application_notification',
  'New Brand Application: {{brand_name}}',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;
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
      .logo img {
        max-width: 200px;
        height: auto;
        display: block;
        margin: 0 auto;
      }
      .info-box {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(168, 85, 247, 0.1));
        border-left: 4px solid #7c3aed;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      .info-row {
        margin: 10px 0;
      }
      .label {
        font-weight: 600;
        color: #374151;
      }
      .button {
        display: inline-block;
        padding: 14px 32px;
        background: linear-gradient(to right, #7c3aed, #a855f7, #6366f1);
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        margin: 20px 0;
        box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.39);
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
      <div class="logo"><img src="{{logoUrl}}" alt="Mana Chain" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" /></div>
      <h2>New Brand Application Received</h2>
      <p>A new brand has applied to join the Mana Chain platform.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="label">Brand Name:</span> {{brand_name}}
        </div>
        <div class="info-row">
          <span class="label">Industry:</span> {{industry_type}}
        </div>
        <div class="info-row">
          <span class="label">Contact:</span> {{contact_first_name}} {{contact_last_name}}
        </div>
        <div class="info-row">
          <span class="label">Email:</span> {{contact_email}}
        </div>
        <div class="info-row">
          <span class="label">Country:</span> {{country}}
        </div>
        <div class="info-row" style="display: {{website_url_display}};">
          <span class="label">Website:</span> <a href="{{website_url}}" style="color: #7c3aed;">{{website_url}}</a>
        </div>
      </div>
      
      <p>Please review this application in the admin dashboard.</p>
      
      <div style="text-align: center;">
        <a href="{{review_url}}" class="button">Review Application</a>
      </div>
      
      <div class="footer">
        <p>Mana Chain - Admin Notification</p>
      </div>
    </div>
  </body>
</html>',
  'New Brand Application Received

Brand Name: {{brand_name}}
Industry: {{industry_type}}
Contact: {{contact_first_name}} {{contact_last_name}}
Email: {{contact_email}}
Country: {{country}}
Website: {{website_url}}

Please review this application in the admin dashboard:
{{review_url}}

Best regards,
The Mana Chain System',
  'Email sent to admins when a new brand application is submitted'
) ON CONFLICT (template_type) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Template: brand_application_approved (Brand application approval email with credentials)
INSERT INTO email_template (template_type, subject, html_content, text_content, description) VALUES (
  'brand_application_approved',
  'Welcome to Mana Chain! Your {{brand_name}} account has been approved',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;
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
      .logo img {
        max-width: 200px;
        height: auto;
        display: block;
        margin: 0 auto;
      }
      .credentials-box {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
        border-left: 4px solid #10b981;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      .credential-item {
        margin: 10px 0;
        font-family: ''Courier New'', monospace;
      }
      .label {
        font-weight: 600;
        color: #374151;
        font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;
      }
      .value {
        background-color: white;
        padding: 8px 12px;
        border-radius: 4px;
        display: inline-block;
        margin-top: 5px;
        font-weight: 600;
        color: #10b981;
      }
      .button {
        display: inline-block;
        padding: 14px 32px;
        background: linear-gradient(to right, #7c3aed, #a855f7, #6366f1);
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        margin: 20px 0;
        box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.39);
      }
      .info-box {
        background-color: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
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
      <div class="logo"><img src="{{logoUrl}}" alt="Mana Chain" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" /></div>
      <h2>Congratulations! Your application has been approved 🎉</h2>
      <p>We''re excited to welcome <strong>{{brand_name}}</strong> to the Mana Chain platform!</p>
      
      <p>Your brand account has been created. Here are your login credentials:</p>
      
      <div class="credentials-box">
        <div class="credential-item">
          <div class="label">Username:</div>
          <div class="value">{{username}}</div>
        </div>
        <div class="credential-item">
          <div class="label">Temporary Password:</div>
          <div class="value">{{password}}</div>
        </div>
      </div>
      
      <div class="info-box">
        <strong>⚠️ Important Security Notice:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Please change your password after your first login</li>
          <li>Keep these credentials secure and never share them</li>
          <li>This is the only time we''ll send your password via email</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="{{loginUrl}}" class="button">Login to Your Account</a>
      </div>
      
      <h3>Next Steps:</h3>
      <ol>
        <li>Login with your credentials</li>
        <li>Complete your brand profile</li>
        <li>Create your community token</li>
        <li>Start building your community!</li>
      </ol>
      
      <div class="footer">
        <p>Need help getting started? Contact us at support@mana-chain.com</p>
        <p style="margin-top: 30px;">Mana Chain - The future of brand engagement</p>
      </div>
    </div>
  </body>
</html>',
  'Congratulations! Your application has been approved

We''re excited to welcome {{brand_name}} to the Mana Chain platform!

Your Login Credentials:
Username: {{username}}
Temporary Password: {{password}}

IMPORTANT SECURITY NOTICE:
- Please change your password after your first login
- Keep these credentials secure and never share them
- This is the only time we''ll send your password via email

Login here: {{loginUrl}}

Next Steps:
1. Login with your credentials
2. Complete your brand profile
3. Create your community token
4. Start building your community!

Need help getting started? Contact us at support@mana-chain.com

Best regards,
The Mana Chain Team',
  'Email sent to brands when their application is approved, containing login credentials'
) ON CONFLICT (template_type) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Template: brand_application_rejected (Brand application rejection email)
INSERT INTO email_template (template_type, subject, html_content, text_content, description) VALUES (
  'brand_application_rejected',
  'Update on your {{brand_name}} application to Mana Chain',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;
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
      .logo img {
        max-width: 200px;
        height: auto;
        display: block;
        margin: 0 auto;
      }
      .reason-box {
        background-color: #fef2f2;
        border-left: 4px solid #ef4444;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      .info-box {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
        border-left: 4px solid #3b82f6;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .button {
        display: inline-block;
        padding: 14px 32px;
        background: linear-gradient(to right, #7c3aed, #a855f7, #6366f1);
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        margin: 20px 0;
        box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.39);
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
      <div class="logo"><img src="{{logoUrl}}" alt="Mana Chain" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" /></div>
      <h2>Update on your application</h2>
      <p>Thank you for your interest in joining Mana Chain with <strong>{{brand_name}}</strong>.</p>
      
      <p>After careful review, we regret to inform you that we are unable to approve your application at this time.</p>
      
      <div class="reason-box">
        <strong>Reason:</strong>
        <p style="margin-top: 10px;">{{rejection_reason}}</p>
      </div>
      
      <div class="info-box">
        <strong>What''s next?</strong>
        <p style="margin: 10px 0;">We encourage you to:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Review the feedback provided above</li>
          <li>Make the necessary improvements or adjustments</li>
          <li>Reapply once you''ve addressed our concerns</li>
        </ul>
      </div>
      
      <p>We''re committed to building a strong community of quality brands, and we believe your brand has potential. We''d love to hear from you again in the future.</p>
      
      <div style="text-align: center;">
        <a href="{{application_url}}" class="button">Submit a New Application</a>
      </div>
      
      <div class="footer">
        <p>Have questions about this decision? Contact us at support@mana-chain.com</p>
        <p style="margin-top: 30px;">Mana Chain - The future of brand engagement</p>
      </div>
    </div>
  </body>
</html>',
  'Update on your application

Thank you for your interest in joining Mana Chain with {{brand_name}}.

After careful review, we regret to inform you that we are unable to approve your application at this time.

Reason:
{{rejection_reason}}

What''s next?
We encourage you to:
- Review the feedback provided above
- Make the necessary improvements or adjustments
- Reapply once you''ve addressed our concerns

We''re committed to building a strong community of quality brands, and we believe your brand has potential. We''d love to hear from you again in the future.

Submit a new application: {{application_url}}

Have questions about this decision? Contact us at support@mana-chain.com

Best regards,
The Mana Chain Team',
  'Email sent to brands when their application is rejected, with rejection reason'
) ON CONFLICT (template_type) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  description = EXCLUDED.description,
  updated_at = NOW();
