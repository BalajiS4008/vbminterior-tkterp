import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  subQuarters,
  subYears,
} from 'date-fns';

export type DateRangeOption =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'last7Days'
  | 'last30Days'
  | 'last90Days'
  | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export const getDateRangeFromOption = (option: DateRangeOption): DateRange => {
  const now = new Date();

  switch (option) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case 'thisWeek':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'lastWeek': {
      const lastWeekDate = subDays(now, 7);
      return {
        start: startOfWeek(lastWeekDate, { weekStartsOn: 1 }),
        end: endOfWeek(lastWeekDate, { weekStartsOn: 1 }),
      };
    }
    case 'thisMonth':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'lastMonth': {
      const lastMonthDate = subMonths(now, 1);
      return { start: startOfMonth(lastMonthDate), end: endOfMonth(lastMonthDate) };
    }
    case 'thisQuarter':
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case 'lastQuarter': {
      const lastQuarterDate = subQuarters(now, 1);
      return { start: startOfQuarter(lastQuarterDate), end: endOfQuarter(lastQuarterDate) };
    }
    case 'thisYear':
      return { start: startOfYear(now), end: endOfYear(now) };
    case 'lastYear': {
      const lastYearDate = subYears(now, 1);
      return { start: startOfYear(lastYearDate), end: endOfYear(lastYearDate) };
    }
    case 'last7Days':
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case 'last30Days':
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case 'last90Days':
      return { start: startOfDay(subDays(now, 89)), end: endOfDay(now) };
    case 'custom':
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
};

export const DATE_RANGE_OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'lastQuarter', label: 'Last Quarter' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'lastYear', label: 'Last Year' },
  { value: 'last7Days', label: 'Last 7 Days' },
  { value: 'last30Days', label: 'Last 30 Days' },
  { value: 'last90Days', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
];
