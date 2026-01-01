import { format, formatDistance, isValid, parseISO } from 'date-fns';
import { DATE_FORMAT, DATE_TIME_FORMAT, DEFAULT_CURRENCY_SYMBOL } from '../config/constants';

/**
 * Format a date to display format
 */
export const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '-';
  return format(dateObj, DATE_FORMAT);
};

/**
 * Format a date with time
 */
export const formatDateTime = (date: Date | string | undefined | null): string => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '-';
  return format(dateObj, DATE_TIME_FORMAT);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string | undefined | null): string => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '-';
  return formatDistance(dateObj, new Date(), { addSuffix: true });
};

/**
 * Format currency amount
 */
export const formatCurrency = (
  amount: number,
  symbol: string = DEFAULT_CURRENCY_SYMBOL,
  locale: string = 'en-IN'
): string => {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formatted}`;
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number, locale: string = 'en-IN'): string => {
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format phone number (Indian format)
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Convert snake_case or kebab-case to Title Case
 */
export const toTitleCase = (text: string): string => {
  return text
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
};
