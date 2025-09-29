import { ImportError, createImportError, logImportError } from './imports/errors';

export interface DateParseError {
  code: 'BAD_DATE';
  value: string;
  rowIndex: number;
  reason: string;
}

export class BrokerDateParseError extends Error {
  constructor(
    public value: string,
    public rowIndex: number,
    public reason: string
  ) {
    super(`Date parse error at row ${rowIndex}: ${reason} (value: "${value}")`);
    this.name = 'BrokerDateParseError';
  }
}

/**
 * Parses broker timestamps to UTC with robust format detection
 * @param timestamp - Raw timestamp string from broker
 * @param brokerTz - Broker timezone (e.g., 'America/New_York')
 * @param rowIndex - Row index for error reporting
 * @returns ISO UTC string
 */
export function parseBrokerLocalToUtc(
  timestamp: string, 
  brokerTz: string = 'America/New_York',
  rowIndex: number = 0
): string {
  if (!timestamp || timestamp.trim() === '') {
    const error = createImportError(rowIndex, 'BAD_DATE', '', { 
      field: 'timestamp', 
      value: timestamp,
      reason: 'Empty timestamp' 
    });
    logImportError(error, 'parseBrokerLocalToUtc');
    throw new BrokerDateParseError(timestamp, rowIndex, 'Empty timestamp');
  }

  const trimmed = timestamp.trim();
  
  // Try multiple date formats in order of likelihood
  const formats = [
    // MM/DD/YYYY HH:mm:ss EDT
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(EDT|EST)$/,
    // MM/DD/YYYY HH:mm EDT
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+(EDT|EST)$/,
    // MM/DD/YYYY HH:mm:ss
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/,
    // MM/DD/YYYY HH:mm
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/,
    // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD HH:mm:ss
    /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})$/,
    // YYYY-MM-DD HH:mm
    /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // Unix timestamp (seconds)
    /^(\d{10})$/,
    // Unix timestamp (milliseconds)
    /^(\d{13})$/
  ];

  for (const format of formats) {
    const match = trimmed.match(format);
    if (match) {
      try {
        let date: Date;
        
        if (format === formats[0] || format === formats[1]) {
          // MM/DD/YYYY with timezone
          const [, month, day, year, hour, minute, second, tz] = match;
          const parsedSecond = second || '0';
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(parsedSecond));
        } else if (format === formats[2] || format === formats[3]) {
          // MM/DD/YYYY without timezone
          const [, month, day, year, hour, minute, second] = match;
          const parsedSecond = second || '0';
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(parsedSecond));
        } else if (format === formats[4]) {
          // MM/DD/YYYY date only
          const [, month, day, year] = match;
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (format === formats[5] || format === formats[6]) {
          // YYYY-MM-DD with time
          const [, year, month, day, hour, minute, second] = match;
          const parsedSecond = second || '0';
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(parsedSecond));
        } else if (format === formats[7]) {
          // YYYY-MM-DD date only
          const [, year, month, day] = match;
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (format === formats[8]) {
          // Unix timestamp (seconds)
          const [, timestamp] = match;
          date = new Date(parseInt(timestamp) * 1000);
        } else if (format === formats[9]) {
          // Unix timestamp (milliseconds)
          const [, timestamp] = match;
          date = new Date(parseInt(timestamp));
        }
        
        // Validate the parsed date
        if (!date || isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        
        // Check for reasonable date range (1900-2100)
        const year = date.getFullYear();
        if (year < 1900 || year > 2100) {
          throw new Error(`Date out of range: ${year}`);
        }
        
        // Validate date components
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const second = date.getSeconds();
        
        if (month < 1 || month > 12) {
          throw new Error(`Invalid month: ${month}`);
        }
        if (day < 1 || day > 31) {
          throw new Error(`Invalid day: ${day}`);
        }
        if (hour < 0 || hour > 23) {
          throw new Error(`Invalid hour: ${hour}`);
        }
        if (minute < 0 || minute > 59) {
          throw new Error(`Invalid minute: ${minute}`);
        }
        if (second < 0 || second > 59) {
          throw new Error(`Invalid second: ${second}`);
        }
        
        // For broker timezone conversion, we need to handle the timezone offset
        // Since JavaScript Date objects are always in local time, we need to adjust
        // for the broker timezone. For now, we'll assume the input is already in the
        // broker timezone and convert to UTC by adjusting for the timezone offset.
        
        // Get the timezone offset for the broker timezone
        const brokerOffset = getTimezoneOffset(brokerTz, date);
        const utcDate = new Date(date.getTime() - (brokerOffset * 60 * 1000));
        
        return utcDate.toISOString();
        
      } catch (error) {
        // Continue to next format
        continue;
      }
    }
  }
  
  // If no format matched, throw error
  const error = createImportError(rowIndex, 'BAD_DATE', '', { 
    field: 'timestamp', 
    value: timestamp,
    reason: 'No matching date format found' 
  });
  logImportError(error, 'parseBrokerLocalToUtc');
  throw new BrokerDateParseError(timestamp, rowIndex, 'No matching date format found');
}

/**
 * Gets timezone offset in minutes for a given timezone and date
 * @param timezone - Timezone string (e.g., 'America/New_York')
 * @param date - Date to get offset for
 * @returns Offset in minutes
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  // This is a simplified implementation
  // In a real application, you'd use a library like date-fns-tz or moment-timezone
  
  // For America/New_York, we need to handle DST
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Simple DST calculation for Eastern Time
  // DST starts on second Sunday of March, ends on first Sunday of November
  if (timezone === 'America/New_York') {
    const dstStart = getSecondSundayOfMarch(year);
    const dstEnd = getFirstSundayOfNovember(year);
    const currentDate = new Date(year, month, day);
    
    if (currentDate >= dstStart && currentDate < dstEnd) {
      return -240; // EDT: UTC-4 (4 hours * 60 minutes)
    } else {
      return -300; // EST: UTC-5 (5 hours * 60 minutes)
    }
  }
  
  // Default to EST for other timezones
  return -300;
}

/**
 * Gets the second Sunday of March for a given year
 */
function getSecondSundayOfMarch(year: number): Date {
  const march1 = new Date(year, 2, 1); // March 1st
  const firstSunday = new Date(march1);
  firstSunday.setDate(1 + (7 - march1.getDay()) % 7);
  const secondSunday = new Date(firstSunday);
  secondSunday.setDate(firstSunday.getDate() + 7);
  return secondSunday;
}

/**
 * Gets the first Sunday of November for a given year
 */
function getFirstSundayOfNovember(year: number): Date {
  const november1 = new Date(year, 10, 1); // November 1st
  const firstSunday = new Date(november1);
  firstSunday.setDate(1 + (7 - november1.getDay()) % 7);
  return firstSunday;
}

/**
 * Validates if a date string is in a reasonable format
 * @param dateStr - Date string to validate
 * @returns true if the date string looks valid
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr || dateStr.trim() === '') {
    return false;
  }
  
  try {
    parseBrokerLocalToUtc(dateStr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a date for display
 * @param date - Date object or ISO string
 * @param format - Display format
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string, 
  format: 'iso' | 'local' | 'display' = 'display'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  switch (format) {
    case 'iso':
      return dateObj.toISOString();
    case 'local':
      return dateObj.toLocaleString();
    case 'display':
    default:
      return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
  }
}