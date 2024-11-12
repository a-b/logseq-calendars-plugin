import { describe, expect, test, beforeEach } from '@jest/globals';
import { sortDate, templateFormatter, parseLocation, formatTime } from '../src/utils';
import type { CalendarEvent } from '../types';

describe('sortDate', () => {
  test('sorts events by start date', () => {
    const events: CalendarEvent[] = [
      { 
        start: new Date('2023-01-02'),
        end: new Date('2023-01-02'),
        summary: 'Event 2',
        description: 'Description 2',
        location: 'Location 2'
      },
      { 
        start: new Date('2023-01-01'),
        end: new Date('2023-01-01'),
        summary: 'Event 1',
        description: 'Description 1',
        location: 'Location 1'
      },
      { 
        start: new Date('2023-01-03'),
        end: new Date('2023-01-03'),
        summary: 'Event 3',
        description: 'Description 3',
        location: 'Location 3'
      }
    ];
    
    const sorted = sortDate(events);
    
    expect(sorted[0].start).toEqual(new Date('2023-01-01'));
    expect(sorted[1].start).toEqual(new Date('2023-01-02'));
    expect(sorted[2].start).toEqual(new Date('2023-01-03'));
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
    const time = new Date('2023-01-01T14:30:00');
    const result = await formatTime(time);
    expect(result).toBe('2:30 PM');
  });

  test('formats time in 24-hour format', async () => {
    (global as any).logseq.settings.timeFormat = "24 hour time";
    const time = new Date('2023-01-01T14:30:00');
    const result = await formatTime(time);
    expect(result).toBe('14:30');
  });

  test('handles midnight correctly', async () => {
    const time = new Date('2023-01-01T00:00:00');
    const result = await formatTime(time);
    expect(result).toBe('12:00 AM');
  });

  test('handles noon correctly', async () => {
    const time = new Date('2023-01-01T12:00:00');
    const result = await formatTime(time);
    expect(result).toBe('12:00 PM');
  });

  test('pads single digit minutes', async () => {
    const time = new Date('2023-01-01T14:05:00');
    const result = await formatTime(time);
    expect(result).toBe('2:05 PM');
  });

  test('handles string input', async () => {
    const result = await formatTime('2023-01-01T14:30:00');
    expect(result).toBe('2:30 PM');
  });
});
