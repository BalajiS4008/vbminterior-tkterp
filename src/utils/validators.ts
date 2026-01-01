/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  // Indian phone: 10 digits or 12 digits with 91 prefix
  return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'));
};

/**
 * Validate GST number (Indian format)
 */
export const isValidGST = (gst: string): boolean => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.toUpperCase());
};

/**
 * Check if string is not empty
 */
export const isNotEmpty = (value: string | undefined | null): boolean => {
  return value !== undefined && value !== null && value.trim().length > 0;
};

/**
 * Check minimum length
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * Check maximum length
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value: number): boolean => {
  return !isNaN(value) && value > 0;
};

/**
 * Validate non-negative number
 */
export const isNonNegativeNumber = (value: number): boolean => {
  return !isNaN(value) && value >= 0;
};

/**
 * Validate date is not in the past
 */
export const isNotPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

/**
 * Validate end date is after start date
 */
export const isEndDateAfterStart = (startDate: Date, endDate: Date): boolean => {
  return endDate > startDate;
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Form validation helper
 */
export interface ValidationRule {
  validate: (value: unknown) => boolean;
  message: string;
}

export const validateField = (value: unknown, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
};
