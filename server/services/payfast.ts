import crypto from "crypto";

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE;

const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";
const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";

const SANDBOX_MODE = process.env.NODE_ENV !== "production";

export interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  cell_number?: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description?: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_int1?: number;
  custom_int2?: number;
  signature?: string;
}

export interface PayFastITNData {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  item_description?: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_int1?: string;
  custom_int2?: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  merchant_id: string;
  signature: string;
}

export function isPayFastConfigured(): boolean {
  return !!(PAYFAST_MERCHANT_ID && PAYFAST_MERCHANT_KEY);
}

export function getPayFastUrl(): string {
  return SANDBOX_MODE ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL;
}

export function generateSignature(data: Record<string, string | number | undefined>, passphrase?: string): string {
  const orderedKeys = [
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "notify_url",
    "name_first",
    "name_last",
    "email_address",
    "cell_number",
    "m_payment_id",
    "amount",
    "item_name",
    "item_description",
    "custom_str1",
    "custom_str2",
    "custom_str3",
    "custom_str4",
    "custom_str5",
    "custom_int1",
    "custom_int2",
    "custom_int3",
    "custom_int4",
    "custom_int5",
    "email_confirmation",
    "confirmation_address",
  ];

  let pfOutput = "";
  for (const key of orderedKeys) {
    if (data[key] !== undefined && data[key] !== "") {
      pfOutput += `${key}=${encodeURIComponent(String(data[key]).trim()).replace(/%20/g, "+")}&`;
    }
  }
  
  pfOutput = pfOutput.slice(0, -1);
  
  if (passphrase) {
    pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
  }

  return crypto.createHash("md5").update(pfOutput).digest("hex");
}

export function validateITNSignature(data: PayFastITNData): boolean {
  const receivedSignature = data.signature;
  const dataForSignature: Record<string, string> = { ...data };
  delete dataForSignature.signature;

  let pfParamString = "";
  for (const [key, value] of Object.entries(dataForSignature)) {
    if (value !== undefined && value !== "") {
      pfParamString += `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, "+")}&`;
    }
  }
  pfParamString = pfParamString.slice(0, -1);

  if (PAYFAST_PASSPHRASE) {
    pfParamString += `&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE.trim()).replace(/%20/g, "+")}`;
  }

  const calculatedSignature = crypto.createHash("md5").update(pfParamString).digest("hex");
  return calculatedSignature === receivedSignature;
}

export function createPaymentData(options: {
  orderId: string;
  amount: number;
  itemName: string;
  itemDescription?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  userId?: string;
}): PayFastPaymentData {
  if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
    throw new Error("PayFast credentials not configured");
  }

  const data: PayFastPaymentData = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: options.returnUrl,
    cancel_url: options.cancelUrl,
    notify_url: options.notifyUrl,
    m_payment_id: options.orderId,
    amount: options.amount.toFixed(2),
    item_name: options.itemName.substring(0, 100),
    item_description: options.itemDescription?.substring(0, 255),
    email_address: options.email,
    name_first: options.firstName,
    name_last: options.lastName,
    custom_str1: options.userId,
  };

  data.signature = generateSignature(data as unknown as Record<string, string | number | undefined>, PAYFAST_PASSPHRASE);

  return data;
}

export function formatAmountCents(amountCents: number): number {
  return amountCents / 100;
}

export function parseAmountToRands(amountString: string): number {
  return parseFloat(amountString);
}
