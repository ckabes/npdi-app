/**
 * Currency Utilities
 * Centralized currency handling for consistent display across the application
 */

/**
 * Currency symbol mapping
 */
export const CURRENCY_SYMBOLS = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CNY': '¥',
  'CHF': 'CHF',
  'INR': '₹',
  'AUD': 'A$',
  'CAD': 'C$',
  'KRW': '₩',
  'SGD': 'S$',
  'HKD': 'HK$',
  'MXN': 'MX$',
  'BRL': 'R$'
};

/**
 * Currency options for select dropdowns
 */
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar ($)' },
  { value: 'EUR', label: 'EUR - Euro (€)' },
  { value: 'GBP', label: 'GBP - British Pound (£)' },
  { value: 'JPY', label: 'JPY - Japanese Yen (¥)' },
  { value: 'CNY', label: 'CNY - Chinese Yuan (¥)' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'INR', label: 'INR - Indian Rupee (₹)' },
  { value: 'AUD', label: 'AUD - Australian Dollar (A$)' },
  { value: 'CAD', label: 'CAD - Canadian Dollar (C$)' },
  { value: 'KRW', label: 'KRW - South Korean Won (₩)' },
  { value: 'SGD', label: 'SGD - Singapore Dollar (S$)' },
  { value: 'HKD', label: 'HKD - Hong Kong Dollar (HK$)' },
  { value: 'MXN', label: 'MXN - Mexican Peso (MX$)' },
  { value: 'BRL', label: 'BRL - Brazilian Real (R$)' }
];

/**
 * Get currency symbol from currency code
 * @param {string} currencyCode - ISO currency code (e.g., 'USD', 'EUR')
 * @returns {string} Currency symbol (e.g., '$', '€')
 */
export const getCurrencySymbol = (currencyCode) => {
  if (!currencyCode) return '$'; // Default to USD
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
};

/**
 * Format a price with currency symbol
 * @param {number} amount - Price amount
 * @param {string} currencyCode - ISO currency code
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted price string (e.g., '$10.50', '€20.00')
 */
export const formatPrice = (amount, currencyCode = 'USD', decimals = 2) => {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = parseFloat(amount || 0).toFixed(decimals);
  return `${symbol}${formattedAmount}`;
};

/**
 * Format currency with amount per unit
 * @param {number} amount - Price amount
 * @param {string} currencyCode - ISO currency code
 * @param {string} unit - Unit of measurement (e.g., 'g', 'kg', 'unit')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted string (e.g., '$10.50/g', '€20.00/kg')
 */
export const formatPricePerUnit = (amount, currencyCode = 'USD', unit = 'unit', decimals = 2) => {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = parseFloat(amount || 0).toFixed(decimals);
  return `${symbol}${formattedAmount}/${unit}`;
};
