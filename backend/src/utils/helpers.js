const crypto = require('crypto');

/**
 * Hash phone number for privacy
 * @param {string} phone - Phone number to hash
 * @returns {Buffer} - Hashed phone number
 */
function hashPhoneNumber(phone) {
  return crypto.createHash('sha256').update(phone).digest();
}

/**
 * Format balance from octas to APT
 * @param {number} octas - Balance in octas
 * @returns {string} - Formatted balance
 */
function formatBalance(octas) {
  return (octas / 100000000).toFixed(8);
}

/**
 * Convert APT to octas
 * @param {number} apt - Amount in APT
 * @returns {number} - Amount in octas
 */
function aptToOctas(apt) {
  return Math.floor(apt * 100000000);
}

/**
 * Convert octas to APT
 * @param {number} octas - Amount in octas
 * @returns {number} - Amount in APT
 */
function octasToApt(octas) {
  return octas / 100000000;
}

/**
 * Validate phone number format (E.164)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
function isValidPhoneNumber(phone) {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate Aptos address format
 * @param {string} address - Address to validate
 * @returns {boolean} - True if valid
 */
function isValidAptosAddress(address) {
  const addressRegex = /^0x[a-fA-F0-9]{64}$/;
  return addressRegex.test(address);
}

/**
 * Shorten address for display
 * @param {string} address - Full address
 * @param {number} length - Characters to show on each side
 * @returns {string} - Shortened address
 */
function shortenAddress(address, length = 6) {
  if (!address || address.length < length * 2) return address;
  return `${address.substring(0, length)}...${address.slice(-length)}`;
}

/**
 * Validate amount
 * @param {string|number} amount - Amount to validate
 * @returns {boolean} - True if valid
 */
function isValidAmount(amount) {
  const amountFloat = parseFloat(amount);
  return !isNaN(amountFloat) && amountFloat > 0;
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format timestamp to readable date
 * @param {number} timestamp - Unix timestamp
 * @returns {string} - Formatted date
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * Generate random hex string
 * @param {number} length - Length of hex string
 * @returns {string} - Random hex string
 */
function generateRandomHex(length = 64) {
  return crypto.randomBytes(length / 2).toString('hex');
}

module.exports = {
  hashPhoneNumber,
  formatBalance,
  aptToOctas,
  octasToApt,
  isValidPhoneNumber,
  isValidAptosAddress,
  shortenAddress,
  isValidAmount,
  sleep,
  formatTimestamp,
  generateRandomHex,
};
