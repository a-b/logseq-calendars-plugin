import "@logseq/libs";
import { BlockEntity, SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user";
import ical from "node-ical";
import axios from "axios";
import {
  getDateForPage,
  getDateForPageWithoutBrackets,
} from "logseq-dateutils";
import moment from "moment-timezone";
import { sortDate, templateFormatter, formatTime } from "./src/utils";
import { ICalEvent, ParsedICalData, CalendarEvent } from "./src/types";
import { RRule } from 'rrule';

let mainBlockUUID = "";

// Settings template remains unchanged...
const settingsTemplate: SettingSchemaDesc[] = [
  // ... your existing settings ...
];

logseq.useSettingsSchema(settingsTemplate);

function rawParser(rawData: string) {
  logseq.App.showMsg("Parsing Calendar Items");
  const eventsArray: CalendarEvent[] = [];
  const rawDataV2 = ical.parseICS(rawData) as ParsedICalData;
  
  for (const dataValue in rawDataV2) {
    const event = rawDataV2[dataValue];
    
    if (!event.rrule) {
      if (event.start && event.end) {
        eventsArray.push({
          start: event.start,
          end: event.end,
          summary: event.summary || '',
          description: event.description || '',
          location: event.location || ''
        });
      }
    } else if (event.rrule instanceof RRule) {
      const dates = event.rrule.between(
        new Date(2021, 0, 1, 0, 0, 0, 0),
        new Date(2023, 11, 31, 0, 0, 0, 0)
      );
      
      if (dates.length === 0) continue;

      console.log("Summary:", event.summary);
      console.log("Original start:", event.start);
      console.log(
        "RRule start:",
        `${event.rrule.options.dtstart} [${event.rrule.options.tzid}]`
      );

      dates.forEach((date: Date) => {
        let newDate: Date;
        if (event.rrule && event.rrule instanceof RRule && event.rrule.options.tzid) {
          const dateTimezone = moment.tz.zone("UTC");
          const localTimezone = moment.tz.guess();
          
          const tz =
            event.rrule.options.tzid === localTimezone
              ? event.rrule.options.tzid
              : localTimezone;
          const timezone = moment.tz.zone(tz);
          
          if (dateTimezone && timezone) {
            const offset = timezone.utcOffset(date.getTime()) - dateTimezone.utcOffset(date.getTime());
            newDate = date;
          } else {
            newDate = date;
          }
        } else if (event.start instanceof Date) {
          newDate = new Date(
            date.setHours(
              date.getHours() -
                (event.start.getTimezoneOffset() - date.getTimezoneOffset()) /
                  60
            )
          );
        } else {
          newDate = date;
        }
        
        const start = moment(newDate);
        if (event.start && event.end) {
          const duration = moment(event.end).diff(moment(event.start));
          const end = moment(start).add(duration, 'milliseconds');
          
          eventsArray.push({
            start: start.toDate(),
            end: end.toDate(),
            summary: event.summary || '',
            description: event.description || '',
            location: event.location || ''
          });
        }
      });
    }
  }
  
  return sortDate(eventsArray);
}

async function insertJournalBlocks(
  data: CalendarEvent[],
  preferredDateFormat: string,
  calendarName: string,
  emptyToday: string,
  useCommonBlock = false
) {
  console.log(`Current Date: ${emptyToday}`);
  let pageID = await logseq.Editor.createPage(emptyToday, {
    createFirstBlock: true,
  });
  
  let startBlock = (await logseq.Editor.insertBlock(pageID!.name, calendarName, {
    sibling: true,
    isPageBlock: true,
  })) as BlockEntity;
  
  for (const event of data) {
    try {
      let formattedStart = event.start;
      let startDate = getDateForPageWithoutBrackets(
        formattedStart,
        preferredDateFormat
      );
      let startTime = await formatTime(formattedStart);
      let endTime = await formatTime(event.end);
      
      let headerString = templateFormatter(
        logseq.settings?.template || "{Start} - {End}: {Title}",
        event.description,
        startDate,
        startTime,
        endTime,
        event.summary,
        event.location
      );
      
      if (startDate.toLowerCase() === emptyToday.toLowerCase()) {
        var currentBlock = await logseq.Editor.insertBlock(
          startBlock.uuid,
          headerString.replaceAll("\\n", "\n"),
          { sibling: false }
        );
        
        if (logseq.settings?.templateLine2) {
          let SecondTemplateLine = templateFormatter(
            logseq.settings.templateLine2,
            event.description,
            startDate,
            startTime,
            endTime,
            event.summary,
            event.location
          );
          await logseq.Editor.insertBlock(
            currentBlock!.uuid,
            SecondTemplateLine.replaceAll("\\n", "\n"),
            { sibling: false }
          );
        }
      }
    } catch (error) {
      console.log(event);
      console.log("error");
      console.log(error);
    }
  }
  
  let updatedBlock = await logseq.Editor.getBlock(startBlock.uuid, {
    includeChildren: true,
  });
  
  if (updatedBlock?.children?.length === 0) {
    logseq.Editor.removeBlock(startBlock.uuid);
    logseq.App.showMsg("No events for the day detected");
  }
}

// Rest of the code remains unchanged...
async function findDate(preferredDateFormat: string) {
  if ((await logseq.Editor.getCurrentPage()) != null) {
    const currentPage = await logseq.Editor.getCurrentPage();
    if (currentPage && !currentPage["journal?"]) {
      const date = getDateForPageWithoutBrackets(
        new Date(),
        preferredDateFormat
      );
      logseq.App.showMsg("Filtering Calendar Items for " + date);
      return date;
    } else {
      const date = currentPage!.name;
      logseq.App.showMsg(`Filtering Calendar Items for ${date}`);
      return date;
    }
  } else {
    return getDateForPageWithoutBrackets(new Date(), preferredDateFormat);
  }
}

async function openCalendar2(calendarName: string, url: string) {
  try {
    const userConfigs = await logseq.App.getUserConfigs();
    const preferredDateFormat = userConfigs.preferredDateFormat;
    logseq.App.showMsg("Fetching Calendar Items");
    let response2 = await axios.get(url);
    console.log(response2);
    var hello = await rawParser(response2.data);
    const date = await findDate(preferredDateFormat);
    insertJournalBlocks(
      hello,
      preferredDateFormat,
      calendarName,
      date
    );
  } catch (err) {
    if (`${err}` == `Error: Request failed with status code 404`) {
      logseq.App.showMsg("Calendar not found: Check your URL");
    }
    console.log(err);
  }
}

async function main() {
  let accounts2: Record<string, string> = {};
  if (logseq.settings?.useJSON) {
    accounts2 = logseq.settings.accountsDetails;
  } else {
    if (
      logseq.settings?.calendar2Name != "" &&
      logseq.settings?.calendar2URL != ""
    ) {
      accounts2[logseq.settings?.calendar2Name] = logseq.settings?.calendar2URL;
    }
    if (
      logseq.settings?.calendar3Name != "" &&
      logseq.settings?.calendar3URL != ""
    ) {
      accounts2[logseq.settings?.calendar3Name] = logseq.settings?.calendar3URL;
    }
    if (
      logseq.settings?.calendar1Name != "" &&
      logseq.settings?.calendar1URL != ""
    ) {
      accounts2[logseq.settings?.calendar1Name] = logseq.settings?.calendar1URL;
    }
    if (
      logseq.settings?.calendar4Name != "" &&
      logseq.settings?.calendar4URL != ""
    ) {
      accounts2[logseq.settings?.calendar4Name] = logseq.settings?.calendar4URL;
    }
    if (
      logseq.settings?.calendar5Name != "" &&
      logseq.settings?.calendar5URL != ""
    ) {
      accounts2[logseq.settings?.calendar5Name] = logseq.settings?.calendar5URL;
    }
    logseq.updateSettings({ accountsDetails: accounts2 });
  }
  
  logseq.provideModel({
    async openCalendar2() {
      for (const accountName in accounts2) {
        openCalendar2(accountName, accounts2[accountName]);
      }
    },
  });

  for (const accountName in accounts2) {
    let accountSetting = accounts2[accountName];
    logseq.App.registerCommandPalette(
      {
        key: `logseq-${encodeURIComponent(accountName)}-sync`,
        label: `Syncing with ${accountName}`,
      },
      () => {
        openCalendar2(accountName, accountSetting);
      }
    );
  }

  logseq.App.registerUIItem("toolbar", {
    key: "open-calendar2",
    template: `
      <a class="button" data-on-click="openCalendar2">
        <i class="ti ti-notebook"></i>
      </a>
    `,
  });
}

logseq.ready(main).catch(console.error);
