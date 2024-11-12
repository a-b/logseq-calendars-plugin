import urlRegexSafe from 'url-regex-safe';
import type { CalendarEvent } from '../types';

export function sortDate(data: CalendarEvent[]) {
  return data.sort(function (a, b) {
    return (
      Math.round(new Date(a.start).getTime() / 1000) -
      Math.round(new Date(b.start).getTime() / 1000)
    );
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

export async function formatTime(rawTimeStamp: Date | string): Promise<string> {
  const formattedTimeStamp = new Date(rawTimeStamp);
  const initialHours = formattedTimeStamp.getHours();
  let hours: string | number;
  
  if (initialHours === 0) {
    hours = "00";
  } else {
    hours = initialHours;
    if (formattedTimeStamp.getHours() < 10) {
      hours = "0" + formattedTimeStamp.getHours();
    }
  }
  
  const minutes = formattedTimeStamp.getMinutes();
  const formattedTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  
  if (
    typeof (global as any).logseq?.settings?.timeFormat === "undefined" ||
    (global as any).logseq?.settings?.timeFormat === "12 hour time"
  ) {
    return new Date("1970-01-01T" + formattedTime + "Z").toLocaleTimeString(
      "en-US",
      { timeZone: "UTC", hour12: true, hour: "numeric", minute: "numeric" }
    );
  } else {
    return formattedTime;
  }
}
