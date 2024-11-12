import urlRegexSafe from 'url-regex-safe';
import type { CalendarEvent } from '../types';

export function sortDate(data: CalendarEvent[]) {
  return data.sort(function (a, b) {
    // Use getTime() for UTC comparison to ensure timezone-safe sorting
    return a.start.getTime() - b.start.getTime();
  });
}

type TemplateSubstitutions = {
  [key: string]: string;
};

export function templateFormatter(
  template: string,
  description: string = "No Description",
  date: string = "No Date",
  start: string = "No Start",
  end: string = "No End",
  title: string = "No Title",
  location: string = "No Location"
): string {
  const properDescription = description || "No Description";
  const properLocation = location || "No Location";
  const parsedLocation = parseLocation(properLocation);
  
  const substitutions: TemplateSubstitutions = {
    "{Description}": properDescription,
    "{Date}": date,
    "{Start}": start,
    "{End}": end,
    "{Title}": title,
    "{RawLocation}": properLocation,
    "{Location}": parsedLocation,
  };
  
  let result = template;

  // Create case-insensitive substitutions
  const allSubstitutions: TemplateSubstitutions = {
    ...substitutions,
    ...Object.fromEntries(
      Object.entries(substitutions).map(([key, value]) => [
        key.toLowerCase(),
        value
      ])
    ),
  };

  // Perform all substitutions
  Object.entries(allSubstitutions).forEach(([key, value]) => {
    result = result.replace(key, value);
  });

  return result;
}

export function parseLocation(rawLocation: string): string {
  const matches = rawLocation.match(urlRegexSafe()) || [];
  let parsed = rawLocation;
  
  for (const match of matches) {
    try {
      const url = new URL(match);
      const linkDesc = url.hostname + '/...';
      parsed = parsed.replace(match, '[' + linkDesc + '](' + match + ')');
    } catch (e) {
      // If URL parsing fails, use the whole match as description
      parsed = parsed.replace(match, '[' + match + '](' + match + ')');
    }
  }
  return parsed;
}

export async function formatTime(rawTimeStamp: Date | string, timezone?: string): Promise<string> {
  // Ensure we're working with a Date object
  const timestamp = typeof rawTimeStamp === 'string' ? new Date(rawTimeStamp) : rawTimeStamp;
  
  // Get user's locale time format preference
  const use24Hour = (global as any).logseq?.settings?.timeFormat === "24 hour time";
  
  // Use provided timezone or system default
  const timeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const options: Intl.DateTimeFormatOptions = {
    hour12: !use24Hour,
    hour: use24Hour ? '2-digit' : 'numeric',
    minute: '2-digit',
    timeZone
  };

  return timestamp.toLocaleTimeString('en-US', options);
}

export function formatDate(date: Date, timezone?: string): string {
  // Use provided timezone or system default
  const timeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return date.toLocaleDateString('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function createLocalDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  timezone?: string
): Date {
  // Use provided timezone or system default
  const timeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Create date string in ISO format
  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  
  // Create date object with timezone consideration
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return new Date(dateString);
}

// New utility function to parse dates with timezone support
export function parseDateWithTimezone(dateString: string, timezone?: string): Date {
  // If the date string already contains timezone info, use that
  if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-')) {
    return new Date(dateString);
  }

  // Otherwise, interpret the date in the specified timezone
  const timeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = new Date(dateString);
  
  // Create a formatter in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Parse the formatted date to ensure correct timezone
  const parts = formatter.formatToParts(date);
  const dateParts: { [key: string]: string } = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      dateParts[part.type] = part.value;
    }
  });

  // Reconstruct the date with the correct timezone
  return new Date(
    `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}`
  );
}
