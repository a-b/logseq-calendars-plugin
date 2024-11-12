declare module 'url-regex-safe' {
  function urlRegexSafe(): RegExp;
  export default urlRegexSafe;
}

declare module '@logseq/libs' {
  export const logseq: any;
}

declare module 'logseq-dateutils' {
  export function getDateForPage(date: Date, format: string): string;
  export function getDateForPageWithoutBrackets(date: Date, format: string): string;
}

declare module 'node-ical' {
  import { RRule } from 'rrule';

  export interface ICalEvent {
    type: string;
    start?: Date;
    end?: Date;
    summary?: string;
    description?: string;
    location?: string;
    rrule?: RRule;
  }

  export function parseICS(icsData: string): { [key: string]: ICalEvent };
}

export interface CalendarEvent {
  start: Date;
  end: Date;
  summary: string;
  description: string;
  location: string;
}
