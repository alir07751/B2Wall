/**
 * Currency formatting utilities for Persian/Farsi display
 * Formats numbers as Toman with proper separators
 */

/**
 * Format number as Toman with thousand separators
 * Example: 330000000 -> "330,000,000 تومان"
 * @param {number} amount - The amount to format
 * @returns {string} Formatted string with Toman unit
 */
export function formatToman(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 تومان';
  }
  
  // Round to nearest integer for display
  const rounded = Math.round(amount);
  
  // Format with thousand separators (using English locale for comma separators)
  const formatted = rounded.toLocaleString('en-US');
  
  return `${formatted} تومان`;
}

/**
 * Format number with thousand separators (without Toman unit)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted number string
 */
export function formatNumber(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0';
  }
  
  const rounded = Math.round(amount);
  return rounded.toLocaleString('en-US');
}

/**
 * Convert Persian/Farsi digits to English digits
 * @param {string} value - Input string with Persian digits
 * @returns {string} String with English digits
 */
export function convertPersianToEnglish(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }
  
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let converted = value;
  
  // Convert Persian digits
  persianDigits.forEach((persian, index) => {
    converted = converted.replace(new RegExp(persian, 'g'), index.toString());
  });
  
  // Convert Arabic digits
  arabicDigits.forEach((arabic, index) => {
    converted = converted.replace(new RegExp(arabic, 'g'), index.toString());
  });
  
  return converted;
}

/**
 * Convert English digits to Persian/Farsi digits for display
 * @param {string} value - Input string with English digits
 * @returns {string} String with Persian digits
 */
export function convertEnglishToPersian(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }
  
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  return value.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

/**
 * Parse input string to number (removes separators and non-numeric characters)
 * Converts Persian digits to English first
 * @param {string} value - Input string (may contain commas, spaces, Persian digits, etc.)
 * @returns {number} Parsed number
 */
export function parseNumber(value) {
  if (!value || typeof value !== 'string') {
    return 0;
  }
  
  // First convert Persian/Arabic digits to English
  const englishValue = convertPersianToEnglish(value);
  
  // Remove all non-numeric characters except decimal point
  const cleaned = englishValue.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format input value as user types (adds thousand separators)
 * Converts Persian digits to English first, then formats
 * @param {string} value - Input value (may contain Persian digits)
 * @returns {string} Formatted value with separators (English digits)
 */
export function formatInputValue(value) {
  if (!value) return '';
  
  // Convert Persian/Arabic digits to English first
  const englishValue = convertPersianToEnglish(value);
  
  // Remove all non-numeric characters
  const numericValue = englishValue.replace(/[^\d]/g, '');
  
  if (!numericValue) return '';
  
  // Add thousand separators
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format number for display with Persian digits
 * @param {number} amount - The amount to format
 * @returns {string} Formatted string with Persian digits and separators
 */
export function formatNumberPersian(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '۰';
  }
  
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('en-US');
  return convertEnglishToPersian(formatted);
}

