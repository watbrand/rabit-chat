// Resend Email Service for RabitChat
// Uses Replit's Resend connector integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        Accept: 'application/json',
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}

// Email template styles
const emailStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0f; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .header { text-align: center; margin-bottom: 40px; }
  .logo { font-size: 32px; font-weight: 700; color: #8B5CF6; letter-spacing: -1px; }
  .card { background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 16px; padding: 32px; margin-bottom: 24px; }
  .title { color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; }
  .text { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
  .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 16px 0; }
  .button:hover { background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); }
  .code { background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 8px; padding: 16px 24px; font-size: 32px; font-weight: 700; color: #8B5CF6; letter-spacing: 4px; text-align: center; margin: 24px 0; }
  .footer { text-align: center; color: #71717a; font-size: 14px; margin-top: 40px; }
  .divider { height: 1px; background: rgba(139, 92, 246, 0.2); margin: 24px 0; }
  .highlight { color: #8B5CF6; font-weight: 600; }
  .stats { display: flex; justify-content: space-around; margin: 24px 0; }
  .stat { text-align: center; }
  .stat-value { color: #8B5CF6; font-size: 24px; font-weight: 700; }
  .stat-label { color: #71717a; font-size: 12px; text-transform: uppercase; }
`;

// Welcome email template
export function getWelcomeEmailHtml(username: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to RabitChat</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">RabitChat</div>
    </div>
    <div class="card">
      <h1 class="title">Welcome to the Elite, ${username}</h1>
      <p class="text">
        You've just joined the most exclusive social network for high-net-worth individuals and influencers. 
        RabitChat is where wealth meets influence, and connections become opportunities.
      </p>
      <div class="divider"></div>
      <p class="text">Here's what awaits you:</p>
      <p class="text">
        <span class="highlight">Premium Feed</span> - Connect with verified elite members<br>
        <span class="highlight">Luxury Mall</span> - Exclusive items to showcase your status<br>
        <span class="highlight">Private Messaging</span> - Secure conversations with the elite<br>
        <span class="highlight">Stories & Reels</span> - Share your lifestyle with the world
      </p>
      <a href="#" class="button">Start Exploring</a>
    </div>
    <div class="footer">
      <p>The RabitChat Team</p>
      <p>Where Wealth Meets Influence</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Password reset email template
export function getPasswordResetEmailHtml(username: string, resetCode: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - RabitChat</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">RabitChat</div>
    </div>
    <div class="card">
      <h1 class="title">Password Reset Request</h1>
      <p class="text">
        Hi ${username}, we received a request to reset your RabitChat password. 
        Use the code below to complete the reset:
      </p>
      <div class="code">${resetCode}</div>
      <p class="text">
        This code expires in <span class="highlight">15 minutes</span>. 
        If you didn't request this, please ignore this email or contact support if you're concerned.
      </p>
    </div>
    <div class="footer">
      <p>The RabitChat Team</p>
      <p>This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Notification digest email template
export function getNotificationDigestEmailHtml(
  username: string,
  notifications: {
    newFollowers: number;
    likes: number;
    comments: number;
    messages: number;
  }
): string {
  const total = notifications.newFollowers + notifications.likes + notifications.comments + notifications.messages;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your RabitChat Update</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">RabitChat</div>
    </div>
    <div class="card">
      <h1 class="title">You've got ${total} new updates, ${username}</h1>
      <p class="text">
        Here's what's been happening while you were away:
      </p>
      <table style="width: 100%; margin: 24px 0;">
        <tr>
          <td style="text-align: center; padding: 16px;">
            <div style="color: #8B5CF6; font-size: 32px; font-weight: 700;">${notifications.newFollowers}</div>
            <div style="color: #71717a; font-size: 12px; text-transform: uppercase;">New Followers</div>
          </td>
          <td style="text-align: center; padding: 16px;">
            <div style="color: #8B5CF6; font-size: 32px; font-weight: 700;">${notifications.likes}</div>
            <div style="color: #71717a; font-size: 12px; text-transform: uppercase;">Likes</div>
          </td>
        </tr>
        <tr>
          <td style="text-align: center; padding: 16px;">
            <div style="color: #8B5CF6; font-size: 32px; font-weight: 700;">${notifications.comments}</div>
            <div style="color: #71717a; font-size: 12px; text-transform: uppercase;">Comments</div>
          </td>
          <td style="text-align: center; padding: 16px;">
            <div style="color: #8B5CF6; font-size: 32px; font-weight: 700;">${notifications.messages}</div>
            <div style="color: #71717a; font-size: 12px; text-transform: uppercase;">Messages</div>
          </td>
        </tr>
      </table>
      <a href="#" class="button">View All Activity</a>
    </div>
    <div class="footer">
      <p>The RabitChat Team</p>
      <p>Manage your notification preferences in Settings</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Verification code email template
export function getVerificationCodeEmailHtml(username: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - RabitChat</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">RabitChat</div>
    </div>
    <div class="card">
      <h1 class="title">Verify Your Email</h1>
      <p class="text">
        Hi ${username}, please use the verification code below to confirm your email address:
      </p>
      <div class="code">${code}</div>
      <p class="text">
        This code expires in <span class="highlight">10 minutes</span>.
      </p>
    </div>
    <div class="footer">
      <p>The RabitChat Team</p>
      <p>This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// New follower notification email
export function getNewFollowerEmailHtml(
  username: string,
  followerUsername: string,
  followerNetWorth: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Follower - RabitChat</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">RabitChat</div>
    </div>
    <div class="card">
      <h1 class="title">You Have a New Follower</h1>
      <p class="text">
        <span class="highlight">@${followerUsername}</span> is now following you on RabitChat.
      </p>
      <p class="text">
        Net Worth: <span class="highlight">${followerNetWorth}</span>
      </p>
      <a href="#" class="button">View Profile</a>
    </div>
    <div class="footer">
      <p>The RabitChat Team</p>
      <p>Where Wealth Meets Influence</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Send email utility function
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[Email] Attempting to send email to:', to);
    
    const { client, fromEmail } = await getResendClient();
    
    // Use Resend's test domain for development since custom domains require verification
    // In production, use a verified domain from Resend connection settings
    // Note: onboarding@resend.dev can only send to the Resend account owner's email in testing
    const from = process.env.NODE_ENV === 'production' && fromEmail 
      ? fromEmail 
      : 'RabitChat <onboarding@resend.dev>';
    console.log('[Email] Using from address:', from);
    
    const result = await client.emails.send({
      from,
      to: [to],
      subject,
      html,
    });

    if (result.error) {
      console.error('[Email] Resend API error:', JSON.stringify(result.error));
      return { success: false, error: result.error.message };
    }

    console.log('[Email] Sent successfully to:', to, 'ID:', result.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Exception sending email:', error.message);
    console.error('[Email] Full error:', error);
    return { success: false, error: error.message };
  }
}

// Convenience functions for specific email types
export async function sendWelcomeEmail(to: string, username: string) {
  return sendEmail(to, 'Welcome to RabitChat - The Elite Social Network', getWelcomeEmailHtml(username));
}

export async function sendPasswordResetEmail(to: string, username: string, resetCode: string) {
  return sendEmail(to, 'Reset Your RabitChat Password', getPasswordResetEmailHtml(username, resetCode));
}

export async function sendVerificationEmail(to: string, username: string, code: string) {
  return sendEmail(to, 'Verify Your RabitChat Email', getVerificationCodeEmailHtml(username, code));
}

export async function sendNotificationDigest(
  to: string,
  username: string,
  notifications: { newFollowers: number; likes: number; comments: number; messages: number }
) {
  return sendEmail(to, `${username}, you have new activity on RabitChat`, getNotificationDigestEmailHtml(username, notifications));
}

export async function sendNewFollowerEmail(
  to: string,
  username: string,
  followerUsername: string,
  followerNetWorth: string
) {
  return sendEmail(to, `${followerUsername} is now following you on RabitChat`, getNewFollowerEmailHtml(username, followerUsername, followerNetWorth));
}

// ========== SUPPORT TICKET EMAIL TEMPLATES ==========

// Support ticket created confirmation
export function getTicketCreatedEmailHtml(
  username: string,
  ticketId: string,
  subject: string,
  category: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Ticket Created - RabitChat</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">RabitChat Support</div>
    </div>
    <div class="card">
      <h1 class="title">We've Received Your Request</h1>
      <p class="text">
        Hi ${username}, thank you for contacting RabitChat Support. We've received your support ticket and our team will respond as soon as possible.
      </p>
      <div class="divider"></div>
      <p class="text">
        <span class="highlight">Ticket ID:</span> #${ticketId.slice(-8).toUpperCase()}<br>
        <span class="highlight">Subject:</span> ${subject}<br>
        <span class="highlight">Category:</span> ${category}
      </p>
      <div class="divider"></div>
      <p class="text">
        Our typical response time is <span class="highlight">within 24 hours</span>. Premium members receive priority support.
      </p>
      <a href="#" class="button">View Your Ticket</a>
    </div>
    <div class="footer">
      <p>RabitChat Support Team</p>
      <p>We're here to help you succeed</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Support reply notification
export function getTicketReplyEmailHtml(
  username: string,
  ticketId: string,
  subject: string,
  agentName: string,
  replyPreview: string
): string {
  const truncatedPreview = replyPreview.length > 200 
    ? replyPreview.substring(0, 200) + '...' 
    : replyPreview;
    
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Reply to Your Ticket - RabitChat</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">RabitChat Support</div>
    </div>
    <div class="card">
      <h1 class="title">You Have a New Reply</h1>
      <p class="text">
        Hi ${username}, <span class="highlight">${agentName}</span> from our support team has responded to your ticket.
      </p>
      <div class="divider"></div>
      <p class="text">
        <span class="highlight">Ticket:</span> #${ticketId.slice(-8).toUpperCase()} - ${subject}
      </p>
      <div style="background: rgba(139, 92, 246, 0.1); border-left: 3px solid #8B5CF6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p class="text" style="margin: 0; font-style: italic;">"${truncatedPreview}"</p>
      </div>
      <a href="#" class="button">View Full Reply</a>
    </div>
    <div class="footer">
      <p>RabitChat Support Team</p>
      <p>Please reply directly in the app to continue the conversation</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Ticket status update notification
export function getTicketStatusUpdateEmailHtml(
  username: string,
  ticketId: string,
  subject: string,
  newStatus: string,
  statusMessage: string
): string {
  const statusColors: Record<string, string> = {
    RESOLVED: '#10B981',
    CLOSED: '#6366F1',
    IN_PROGRESS: '#F59E0B',
    PENDING: '#8B5CF6',
    ESCALATED: '#EF4444',
  };
  
  const statusColor = statusColors[newStatus] || '#8B5CF6';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Status Update - RabitChat</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">RabitChat Support</div>
    </div>
    <div class="card">
      <h1 class="title">Ticket Status Update</h1>
      <p class="text">
        Hi ${username}, the status of your support ticket has been updated.
      </p>
      <div class="divider"></div>
      <p class="text">
        <span class="highlight">Ticket:</span> #${ticketId.slice(-8).toUpperCase()} - ${subject}
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="background: ${statusColor}; color: white; padding: 8px 24px; border-radius: 20px; font-weight: 600; font-size: 14px;">
          ${newStatus.replace('_', ' ')}
        </span>
      </div>
      <p class="text">${statusMessage}</p>
      <a href="#" class="button">View Ticket</a>
    </div>
    <div class="footer">
      <p>RabitChat Support Team</p>
      <p>Thank you for your patience</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Ticket resolved satisfaction survey
export function getTicketSatisfactionEmailHtml(
  username: string,
  ticketId: string,
  subject: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How Did We Do? - RabitChat</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">RabitChat Support</div>
    </div>
    <div class="card">
      <h1 class="title">Your Ticket Has Been Resolved</h1>
      <p class="text">
        Hi ${username}, great news! Your support ticket <span class="highlight">#${ticketId.slice(-8).toUpperCase()}</span> regarding "${subject}" has been resolved.
      </p>
      <div class="divider"></div>
      <p class="text">
        We'd love to hear about your experience. How would you rate our support?
      </p>
      <table style="width: 100%; margin: 24px 0;">
        <tr>
          <td style="text-align: center; padding: 8px;">
            <a href="#" style="text-decoration: none; font-size: 32px;">1</a>
          </td>
          <td style="text-align: center; padding: 8px;">
            <a href="#" style="text-decoration: none; font-size: 32px;">2</a>
          </td>
          <td style="text-align: center; padding: 8px;">
            <a href="#" style="text-decoration: none; font-size: 32px;">3</a>
          </td>
          <td style="text-align: center; padding: 8px;">
            <a href="#" style="text-decoration: none; font-size: 32px;">4</a>
          </td>
          <td style="text-align: center; padding: 8px;">
            <a href="#" style="text-decoration: none; font-size: 32px;">5</a>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="text-align: left; color: #71717a; font-size: 12px;">Poor</td>
          <td></td>
          <td colspan="2" style="text-align: right; color: #71717a; font-size: 12px;">Excellent</td>
        </tr>
      </table>
      <p class="text" style="font-size: 14px;">
        If your issue is not fully resolved, you can reopen this ticket anytime within 7 days.
      </p>
    </div>
    <div class="footer">
      <p>RabitChat Support Team</p>
      <p>Your feedback helps us improve</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Support ticket convenience functions
export async function sendTicketCreatedEmail(
  to: string,
  username: string,
  ticketId: string,
  subject: string,
  category: string
) {
  return sendEmail(
    to,
    `Ticket #${ticketId.slice(-8).toUpperCase()} Created - RabitChat Support`,
    getTicketCreatedEmailHtml(username, ticketId, subject, category)
  );
}

export async function sendTicketReplyEmail(
  to: string,
  username: string,
  ticketId: string,
  subject: string,
  agentName: string,
  replyPreview: string
) {
  return sendEmail(
    to,
    `New Reply to Ticket #${ticketId.slice(-8).toUpperCase()} - RabitChat Support`,
    getTicketReplyEmailHtml(username, ticketId, subject, agentName, replyPreview)
  );
}

export async function sendTicketStatusUpdateEmail(
  to: string,
  username: string,
  ticketId: string,
  subject: string,
  newStatus: string,
  statusMessage: string
) {
  return sendEmail(
    to,
    `Ticket #${ticketId.slice(-8).toUpperCase()} ${newStatus} - RabitChat Support`,
    getTicketStatusUpdateEmailHtml(username, ticketId, subject, newStatus, statusMessage)
  );
}

export async function sendTicketSatisfactionEmail(
  to: string,
  username: string,
  ticketId: string,
  subject: string
) {
  return sendEmail(
    to,
    `How Was Your Support Experience? - RabitChat`,
    getTicketSatisfactionEmailHtml(username, ticketId, subject)
  );
}
