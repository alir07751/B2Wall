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
 * Parse input string to number (removes separators and non-numeric characters)
 * @param {string} value - Input string (may contain commas, spaces, etc.)
 * @returns {number} Parsed number
 */
export function parseNumber(value) {
  if (!value || typeof value !== 'string') {
    return 0;
  }
  
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format input value as user types (adds thousand separators)
 * @param {string} value - Input value
 * @returns {string} Formatted value with separators
 */
export function formatInputValue(value) {
  if (!value) return '';
  
  // Remove all non-numeric characters
  const numericValue = value.replace(/[^\d]/g, '');
  
  if (!numericValue) return '';
  
  // Add thousand separators
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

