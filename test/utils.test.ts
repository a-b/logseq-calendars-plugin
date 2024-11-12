import { describe, expect, test, beforeEach } from '@jest/globals';
import { sortDate, templateFormatter, parseLocation, formatTime, formatDate, createLocalDate, parseDateWithTimezone } from '../src/utils';
import type { CalendarEvent } from '../types';

describe('sortDate', () => {
  test('sorts events by start date', () => {
    const events: CalendarEvent[] = [
      { 
        start: new Date('2023-01-02T12:00:00Z'),
        end: new Date('2023-01-02T13:00:00Z'),
        summary: 'Event 2',
        description: 'Description 2',
        location: 'Location 2'
      },
      { 
        start: new Date('2023-01-01T12:00:00Z'),
        end: new Date('2023-01-01T13:00:00Z'),
        summary: 'Event 1',
        description: 'Description 1',
        location: 'Location 1'
      },
      { 
        start: new Date('2023-01-03T12:00:00Z'),
        end: new Date('2023-01-03T13:00:00Z'),
        summary: 'Event 3',
        description: 'Description 3',
        location: 'Location 3'
      }
    ];
    
    const sorted = sortDate(events);
    
    expect(sorted[0].summary).toBe('Event 1');
    expect(sorted[1].summary).toBe('Event 2');
    expect(sorted[2].summary).toBe('Event 3');
  });

  test('handles empty array', () => {
    const emptyEvents: CalendarEvent[] = [];
    expect(sortDate(emptyEvents)).toEqual([]);
  });
});

describe('templateFormatter', () => {
  test('formats event details correctly', () => {
    const result = templateFormatter(
      "{Start} - {End}: {Title}",
      "Meeting description",
      "2023-01-01",
      "10:00 AM",
      "11:00 AM",
      "Team Meeting",
      "Conference Room"
    );
    
    expect(result).toBe("10:00 AM - 11:00 AM: Team Meeting");
  });

  test('handles missing values with defaults', () => {
    const result = templateFormatter(
      "{Title} at {Location}",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
    
    expect(result).toBe("No Title at No Location");
  });

  test('supports case-insensitive placeholders', () => {
    const result = templateFormatter(
      "{title} - {description}",
      "Test description",
      "2023-01-01",
      "10:00 AM",
      "11:00 AM",
      "Test Event"
    );
    
    expect(result).toBe("Test Event - Test description");
  });
});

describe('parseLocation', () => {
  test('converts URLs to markdown links', () => {
    const input = "Meeting at https://zoom.us/j/123456789";
    const expected = "Meeting at [zoom.us/...](https://zoom.us/j/123456789)";
    
    expect(parseLocation(input)).toBe(expected);
  });

  test('handles multiple URLs', () => {
    const input = "Links: https://example.com and https://test.com";
    const expected = "Links: [example.com/...](https://example.com) and [test.com/...](https://test.com)";
    
    expect(parseLocation(input)).toBe(expected);
  });

  test('returns original string if no URLs', () => {
    const input = "No URLs here";
    expect(parseLocation(input)).toBe(input);
  });

  test('handles invalid URLs gracefully', () => {
    const input = "Invalid URL: not@a.url";
    expect(parseLocation(input)).toBe(input);
  });
});

describe('formatTime', () => {
  beforeEach(() => {
    // Reset logseq settings before each test
    (global as any).logseq = {
      settings: {
        timeFormat: "12 hour time"
      }
    };
  });

  test('formats time in 12-hour format', async () => {
    const time = new Date('2023-01-01T14:30:00Z');
    const result = await formatTime(time, 'UTC');
    expect(result).toBe('2:30 PM');
  });

  test('formats time in 24-hour format', async () => {
    (global as any).logseq.settings.timeFormat = "24 hour time";
    const time = new Date('2023-01-01T14:30:00Z');
    const result = await formatTime(time, 'UTC');
    expect(result).toBe('14:30');
  });

  test('handles different timezones', async () => {
    const time = new Date('2023-01-01T14:30:00Z');
    const utcResult = await formatTime(time, 'UTC');
    const estResult = await formatTime(time, 'America/New_York');
    expect(utcResult).not.toBe(estResult);
  });

  test('handles timezone in string input', async () => {
    const result = await formatTime('2023-01-01T14:30:00Z', 'UTC');
    expect(result).toBe('2:30 PM');
  });
});

describe('formatDate', () => {
  test('formats date in specified timezone', () => {
    const date = new Date('2023-01-01T00:00:00Z');
    const utcResult = formatDate(date, 'UTC');
    const estResult = formatDate(date, 'America/New_York');
    expect(utcResult).not.toBe(estResult);
  });

  test('formats date consistently in same timezone', () => {
    const date = new Date('2023-01-01T12:00:00Z');
    expect(formatDate(date, 'UTC')).toMatch(/01\/01\/2023/);
  });
});

describe('createLocalDate', () => {
  test('creates date in specified timezone', () => {
    const utcDate = createLocalDate(2023, 1, 1, 14, 30, 'UTC');
    const estDate = createLocalDate(2023, 1, 1, 14, 30, 'America/New_York');
    expect(utcDate.getTime()).not.toBe(estDate.getTime());
  });

  test('handles date without time in timezone', () => {
    const date = createLocalDate(2023, 1, 1, undefined, undefined, 'UTC');
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
  });
});

describe('parseDateWithTimezone', () => {
  test('preserves timezone info when present', () => {
    const date = parseDateWithTimezone('2023-01-01T14:30:00Z');
    expect(date.toISOString()).toBe('2023-01-01T14:30:00.000Z');
  });

  test('interprets local time in specified timezone', () => {
    const utcDate = parseDateWithTimezone('2023-01-01T14:30:00', 'UTC');
    const estDate = parseDateWithTimezone('2023-01-01T14:30:00', 'America/New_York');
    expect(utcDate.getTime()).not.toBe(estDate.getTime());
  });

  test('handles different timezone offsets', () => {
    const date = parseDateWithTimezone('2023-01-01T14:30:00+05:30');
    expect(date.getUTCHours()).toBe(9); // 14:30 IST = 09:00 UTC
  });
});
