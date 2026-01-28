import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio | null {
  if (!accountSid || !authToken) {
    console.warn("[SMS] Twilio credentials not configured");
    return null;
  }
  if (!client) {
    client = twilio(accountSid, authToken);
  }
  return client;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(to: string, body: string): Promise<SMSResult> {
  const twilioClient = getClient();
  if (!twilioClient || !twilioPhone) {
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from: twilioPhone,
      to,
    });

    console.log(`[SMS] Sent message ${message.sid} to ${to}`);
    return { success: true, messageId: message.sid };
  } catch (error: any) {
    console.error("[SMS] Failed to send message:", error.message);
    return { success: false, error: error.message };
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCode(phoneNumber: string, code: string): Promise<SMSResult> {
  const message = `Your RabitChat verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`;
  return sendSMS(phoneNumber, message);
}

export async function sendLoginAlert(phoneNumber: string, location?: string, device?: string): Promise<SMSResult> {
  let message = "New login detected on your RabitChat account.";
  if (location) message += ` Location: ${location}.`;
  if (device) message += ` Device: ${device}.`;
  message += " If this wasn't you, secure your account immediately.";
  return sendSMS(phoneNumber, message);
}

export async function sendNewFollowerNotification(phoneNumber: string, followerName: string): Promise<SMSResult> {
  const message = `${followerName} just started following you on RabitChat! Check out their profile.`;
  return sendSMS(phoneNumber, message);
}

export async function sendMessageNotification(phoneNumber: string, senderName: string): Promise<SMSResult> {
  const message = `You have a new message from ${senderName} on RabitChat.`;
  return sendSMS(phoneNumber, message);
}

export function isSMSConfigured(): boolean {
  const configured = !!(accountSid && authToken && twilioPhone);
  console.log(`[SMS] Configuration check: accountSid=${!!accountSid}, authToken=${!!authToken}, phone=${!!twilioPhone}, configured=${configured}`);
  return configured;
}
