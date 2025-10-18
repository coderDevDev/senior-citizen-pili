/**
 * Convert 24-hour time format to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (HH:mm or HH:mm:ss)
 * @returns Time in 12-hour format with AM/PM (h:mm AM/PM)
 */
export function format24To12Hour(time24: string): string {
  if (!time24) return '';
  
  // Parse the time string
  const [hours, minutes] = time24.split(':').map(Number);
  
  // Determine AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  let hour12 = hours % 12;
  if (hour12 === 0) hour12 = 12; // Handle midnight (00:00) and noon (12:00)
  
  // Format minutes with leading zero
  const minutesStr = String(minutes).padStart(2, '0');
  
  // Special cases for midnight and noon
  if (hours === 0 && minutes === 0) {
    return '12:00 MN'; // Midnight
  } else if (hours === 12 && minutes === 0) {
    return '12:00 NN'; // Noon
  }
  
  return `${hour12}:${minutesStr} ${period}`;
}

/**
 * Convert 12-hour time format to 24-hour format
 * @param time12 - Time in 12-hour format (h:mm AM/PM)
 * @returns Time in 24-hour format (HH:mm)
 */
export function format12To24Hour(time12: string): string {
  if (!time12) return '';
  
  // Handle special cases
  if (time12.includes('MN')) {
    return '00:00';
  } else if (time12.includes('NN')) {
    return '12:00';
  }
  
  // Parse the time string
  const match = time12.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return time12; // Return original if invalid format
  
  let [, hourStr, minuteStr, period] = match;
  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);
  
  // Convert to 24-hour format
  if (period.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }
  
  // Format with leading zeros
  const hourStr24 = String(hour).padStart(2, '0');
  const minuteStr24 = String(minute).padStart(2, '0');
  
  return `${hourStr24}:${minuteStr24}`;
}

/**
 * Generate time options for 12-hour format dropdown
 * @param interval - Interval in minutes (default: 30)
 * @returns Array of time options in 12-hour format
 */
export function generateTimeOptions(interval: number = 30): string[] {
  const options: string[] = [];
  
  for (let hours = 0; hours < 24; hours++) {
    for (let minutes = 0; minutes < 60; minutes += interval) {
      const time24 = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      options.push(format24To12Hour(time24));
    }
  }
  
  return options;
}
