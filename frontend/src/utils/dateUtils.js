/**
 * Date utilities for IST conversion and formatting
 * Since database stores UTC dates correctly, these functions convert to IST for display
 */

/**
 * Convert UTC date to IST and format as time string
 * @param {string|Date} dateString - UTC date string or Date object
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted IST time string
 */
export const formatTimeIST = (dateString, options = {}) => {
  if (!dateString) return '--';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  };
  
  return date.toLocaleTimeString('en-US', { ...defaultOptions, ...options });
};

/**
 * Convert UTC date to IST and format as date string
 * @param {string|Date} dateString - UTC date string or Date object
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted IST date string
 */
export const formatDateIST = (dateString, options = {}) => {
  if (!dateString) return '--';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  };
  
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Convert UTC date to IST and format as full datetime string
 * @param {string|Date} dateString - UTC date string or Date object
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted IST datetime string
 */
export const formatDateTimeIST = (dateString, options = {}) => {
  if (!dateString) return '--';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  };
  
  return date.toLocaleString('en-US', { ...defaultOptions, ...options });
};

/**
 * Calculate duration between two UTC dates and format as readable string
 * @param {string|Date} startDate - Start UTC date
 * @param {string|Date} endDate - End UTC date
 * @returns {string} - Formatted duration string (e.g., "2h 30m")
 */
export const formatDurationIST = (startDate, endDate) => {
  if (!startDate || !endDate) return '--';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '--';
  
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return '--';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

/**
 * Get current IST date for comparisons
 * @returns {Date} - Current date in IST
 */
export const getCurrentIST = () => {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
};

/**
 * Check if a UTC date is today in IST
 * @param {string|Date} dateString - UTC date to check
 * @returns {boolean} - True if the date is today in IST
 */
export const isToday = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  
  const today = getCurrentIST();
  const checkDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  
  return (
    today.getFullYear() === checkDate.getFullYear() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getDate() === checkDate.getDate()
  );
};

/**
 * Convert UTC date to IST Date object (for further processing)
 * @param {string|Date} dateString - UTC date string or Date object
 * @returns {Date} - Date object representing the same moment in IST
 */
export const toIST = (dateString) => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  return new Date(date.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
};

/**
 * Get current IST time in datetime-local format for form inputs
 * @returns {string} - Current IST time in YYYY-MM-DDTHH:MM format
 */
export const getCurrentISTForInput = () => {
  const now = new Date();
  // Convert to IST (UTC + 5:30)
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.toISOString().slice(0, 16);
};

/**
 * Convert datetime-local input value (in IST) to ISO string for API
 * @param {string} datetimeLocalValue - Value from datetime-local input
 * @returns {string} - ISO string representing the IST time
 */
export const convertInputToISO = (datetimeLocalValue) => {
  if (!datetimeLocalValue) return '';
  // The input value is already in IST format, we just need to add the Z
  return datetimeLocalValue + ':00.000Z';
};

// Export all functions as default object for easier importing
export default {
  formatTimeIST,
  formatDateIST,
  formatDateTimeIST,
  formatDurationIST,
  getCurrentIST,
  isToday,
  toIST,
  getCurrentISTForInput,
  convertInputToISO
};
