import { describe, it, expect } from 'vitest';
import {
  getWeekDays,
  formatWeekLabel,
  isWorkday,
  getCurrentWeekStart,
  getNextWeekStart,
  getPreviousWeekStart,
  getNextWeekStartFromDate,
  isDateInPast,
  isDateBeforeWeek,
  isDateBeforeCurrentWeek,
  calculateDaysToComplete,
  formatDate,
} from './dates';
import { startOfWeek, addDays, format, parseISO } from 'date-fns';

describe('getWeekDays', () => {
  it('should return Monday to Friday for a given week', () => {
    const date = new Date('2024-01-15'); // A Monday
    const weekDays = getWeekDays(date);

    expect(weekDays).toHaveLength(5);
    expect(format(weekDays[0], 'EEEE')).toBe('Monday');
    expect(format(weekDays[4], 'EEEE')).toBe('Friday');
  });

  it('should exclude weekends', () => {
    const date = new Date('2024-01-20'); // A Saturday
    const weekDays = getWeekDays(date);

    expect(weekDays).toHaveLength(5);
    const dayNames = weekDays.map(d => format(d, 'EEEE'));
    expect(dayNames).not.toContain('Saturday');
    expect(dayNames).not.toContain('Sunday');
  });

  it('should start week on Monday', () => {
    const date = new Date('2024-01-17'); // A Wednesday
    const weekDays = getWeekDays(date);

    expect(format(weekDays[0], 'EEEE')).toBe('Monday');
  });
});

describe('formatWeekLabel', () => {
  it('should format week label starting from Monday', () => {
    const date = new Date('2024-01-15'); // Monday, Jan 15, 2024
    const label = formatWeekLabel(date);

    expect(label).toBe('Jan 15, 2024');
  });

  it('should format week label for mid-week date', () => {
    const date = new Date('2024-01-17'); // Wednesday
    const label = formatWeekLabel(date);

    // Should still show the Monday of that week
    expect(label).toBe('Jan 15, 2024');
  });
});

describe('isWorkday', () => {
  it('should return true for Monday', () => {
    const monday = new Date('2024-01-15');
    expect(isWorkday(monday)).toBe(true);
  });

  it('should return true for Friday', () => {
    const friday = new Date('2024-01-19');
    expect(isWorkday(friday)).toBe(true);
  });

  it('should return false for Saturday', () => {
    const saturday = new Date('2024-01-20');
    expect(isWorkday(saturday)).toBe(false);
  });

  it('should return false for Sunday', () => {
    const sunday = new Date('2024-01-21');
    expect(isWorkday(sunday)).toBe(false);
  });

  it('should return true for all weekdays', () => {
    const monday = new Date('2024-01-15');
    const weekDays = getWeekDays(monday);

    weekDays.forEach(day => {
      expect(isWorkday(day)).toBe(true);
    });
  });
});

describe('getCurrentWeekStart', () => {
  it('should return a Monday', () => {
    const weekStart = getCurrentWeekStart();
    expect(format(weekStart, 'EEEE')).toBe('Monday');
  });

  it('should return start of day', () => {
    const weekStart = getCurrentWeekStart();
    expect(weekStart.getHours()).toBe(0);
    expect(weekStart.getMinutes()).toBe(0);
    expect(weekStart.getSeconds()).toBe(0);
  });
});

describe('getNextWeekStart', () => {
  it('should return next week Monday', () => {
    const nextWeek = getNextWeekStart();
    const currentWeek = getCurrentWeekStart();

    const daysDiff = Math.floor((nextWeek.getTime() - currentWeek.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(7);
    expect(format(nextWeek, 'EEEE')).toBe('Monday');
  });
});

describe('getPreviousWeekStart', () => {
  it('should return previous week Monday', () => {
    const currentWeek = new Date('2024-01-15'); // Monday
    const previousWeek = getPreviousWeekStart(currentWeek);

    const daysDiff = Math.floor((currentWeek.getTime() - previousWeek.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(7);
    expect(format(previousWeek, 'EEEE')).toBe('Monday');
  });
});

describe('getNextWeekStartFromDate', () => {
  it('should return next week Monday from given date', () => {
    const currentWeek = new Date('2024-01-15'); // Monday
    const nextWeek = getNextWeekStartFromDate(currentWeek);

    const daysDiff = Math.floor((nextWeek.getTime() - currentWeek.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(7);
    expect(format(nextWeek, 'EEEE')).toBe('Monday');
  });
});

describe('isDateInPast', () => {
  it('should return true for past dates', () => {
    const pastDate = '2020-01-01';
    expect(isDateInPast(pastDate)).toBe(true);
  });

  it('should return false for today', () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    expect(isDateInPast(today)).toBe(false);
  });

  it('should return false for future dates', () => {
    const futureDate = '2030-01-01';
    expect(isDateInPast(futureDate)).toBe(false);
  });
});

describe('isDateBeforeWeek', () => {
  it('should return true for dates before the week', () => {
    const weekStart = new Date('2024-01-15'); // Monday
    const beforeWeek = '2024-01-14'; // Sunday before

    expect(isDateBeforeWeek(beforeWeek, weekStart)).toBe(true);
  });

  it('should return false for dates in the week', () => {
    const weekStart = new Date('2024-01-15'); // Monday
    const inWeek = '2024-01-17'; // Wednesday

    expect(isDateBeforeWeek(inWeek, weekStart)).toBe(false);
  });

  it('should return false for dates after the week', () => {
    const weekStart = new Date('2024-01-15'); // Monday
    const afterWeek = '2024-01-25';

    expect(isDateBeforeWeek(afterWeek, weekStart)).toBe(false);
  });
});

describe('isDateBeforeCurrentWeek', () => {
  it('should return true for dates in past weeks', () => {
    const pastDate = '2020-01-01';
    expect(isDateBeforeCurrentWeek(pastDate)).toBe(true);
  });

  it('should return false for dates in current or future weeks', () => {
    const futureDate = '2030-01-01';
    expect(isDateBeforeCurrentWeek(futureDate)).toBe(false);
  });
});

describe('calculateDaysToComplete', () => {
  it('should calculate days between two dates', () => {
    const createdAt = '2024-01-15';
    const completedAt = '2024-01-20';

    const days = calculateDaysToComplete(createdAt, completedAt);
    expect(days).toBe(5);
  });

  it('should return 0 for same day completion', () => {
    const date = '2024-01-15';
    const days = calculateDaysToComplete(date, date);
    expect(days).toBe(0);
  });

  it('should handle negative days for completion before creation', () => {
    const createdAt = '2024-01-20';
    const completedAt = '2024-01-15';

    const days = calculateDaysToComplete(createdAt, completedAt);
    expect(days).toBe(-5);
  });

  it('should calculate days across months', () => {
    const createdAt = '2024-01-25';
    const completedAt = '2024-02-05';

    const days = calculateDaysToComplete(createdAt, completedAt);
    expect(days).toBe(11);
  });
});

describe('formatDate', () => {
  it('should format date string correctly', () => {
    const dateString = '2024-01-15';
    const formatted = formatDate(dateString);
    expect(formatted).toBe('Jan 15, 2024');
  });

  it('should handle different months', () => {
    const dateString = '2024-12-25';
    const formatted = formatDate(dateString);
    expect(formatted).toBe('Dec 25, 2024');
  });

  it('should handle ISO date strings with time', () => {
    const dateString = '2024-01-15T10:30:00Z';
    const formatted = formatDate(dateString);
    expect(formatted).toBe('Jan 15, 2024');
  });
});
