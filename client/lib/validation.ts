export interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
}

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('At least one number');
  }
  
  const isValid = errors.length === 0;
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (isValid) {
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLong = password.length >= 12;
    
    if (hasSpecialChar && isLong) {
      strength = 'strong';
    } else if (hasSpecialChar || isLong) {
      strength = 'medium';
    } else {
      strength = 'medium';
    }
  }
  
  return { isValid, strength, errors };
}

export function validateUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return true;
  }
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateEmail(email: string): boolean {
  if (!email || email.trim() === '') {
    return true;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): PhoneValidationResult {
  if (!phone || phone.trim() === '') {
    return { isValid: true, formatted: '' };
  }
  
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.startsWith('27') && digitsOnly.length === 11) {
    const formatted = `+27 ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4, 7)} ${digitsOnly.slice(7)}`;
    return { isValid: true, formatted };
  }
  
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    const formatted = `0${digitsOnly.slice(1, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
    return { isValid: true, formatted };
  }
  
  if (phone.startsWith('+27') && digitsOnly.length === 11) {
    const formatted = `+27 ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4, 7)} ${digitsOnly.slice(7)}`;
    return { isValid: true, formatted };
  }
  
  const isPartialValid = (digitsOnly.length < 10 && digitsOnly.startsWith('0')) ||
                          (digitsOnly.length < 11 && digitsOnly.startsWith('27'));
  
  return { isValid: isPartialValid, formatted: phone };
}

export function formatPhoneAsTyping(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (phone.startsWith('+27') || digitsOnly.startsWith('27')) {
    const digits = digitsOnly.startsWith('27') ? digitsOnly : digitsOnly;
    if (digits.length <= 2) return '+27';
    if (digits.length <= 4) return `+27 ${digits.slice(2)}`;
    if (digits.length <= 7) return `+27 ${digits.slice(2, 4)} ${digits.slice(4)}`;
    return `+27 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  }
  
  if (digitsOnly.startsWith('0')) {
    if (digitsOnly.length <= 3) return digitsOnly;
    if (digitsOnly.length <= 6) return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3)}`;
    return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6, 10)}`;
  }
  
  return phone;
}

export const PASSWORD_STRENGTH_COLORS = {
  weak: '#EF4444',
  medium: '#F59E0B',
  strong: '#10B981',
} as const;

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export function validateDisplayName(displayName: string): ValidationResult {
  const trimmed = displayName.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Display name is required' };
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters' };
  }
  
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Display name must be 50 characters or less' };
  }
  
  if (/^\s|\s$/.test(displayName)) {
    return { isValid: false, error: 'Display name cannot start or end with spaces' };
  }
  
  return { isValid: true, error: null };
}

export function validateBio(bio: string): ValidationResult {
  if (bio.length > 160) {
    return { isValid: false, error: 'Bio must be 160 characters or less' };
  }
  
  return { isValid: true, error: null };
}

export function validateLocation(location: string): ValidationResult {
  if (location.length > 100) {
    return { isValid: false, error: 'Location must be 100 characters or less' };
  }
  
  return { isValid: true, error: null };
}

export function validatePronouns(pronouns: string): ValidationResult {
  if (pronouns.length > 30) {
    return { isValid: false, error: 'Pronouns must be 30 characters or less' };
  }
  
  return { isValid: true, error: null };
}

export function validateUsername(username: string): ValidationResult {
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 30) {
    return { isValid: false, error: 'Username must be 30 characters or less' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: 'Only letters, numbers, and underscores allowed' };
  }
  
  return { isValid: true, error: null };
}

export function validateAvatarUrl(url: string): ValidationResult {
  if (!url || url.trim() === '') {
    return { isValid: true, error: null };
  }
  
  if (!validateUrl(url)) {
    return { isValid: false, error: 'Please enter a valid URL starting with http:// or https://' };
  }
  
  return { isValid: true, error: null };
}
