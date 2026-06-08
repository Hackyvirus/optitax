export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8)           return { valid: false, error: "Password must be at least 8 characters" };
  if (!/[A-Z]/.test(password))       return { valid: false, error: "Password must include at least one uppercase letter" };
  if (!/[0-9]/.test(password))       return { valid: false, error: "Password must include at least one number" };
  return { valid: true };
}

export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

export function validatePAN(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase());
}

export function validateGSTIN(gstin: string): boolean {
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/.test(gstin.trim().toUpperCase());
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, ""); // basic XSS prevention
}
