import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  format,
  parseISO,
  isMonday,
  isTuesday,
  isWednesday,
  isThursday,
  isFriday,
  isBefore,
  startOfDay,
  eachDayOfInterval,
  differenceInDays,
} from "date-fns";

export const getWeekDays = (date: Date): Date[] => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday

  const allDays = eachDayOfInterval({ start, end });

  // Return only Monday to Friday
  return allDays.filter((day) => {
    return isMonday(day) || isTuesday(day) || isWednesday(day) || isThursday(day) || isFriday(day);
  });
};

export const formatWeekLabel = (date: Date): string => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  return format(weekStart, "MMM d, yyyy");
};

export const isWorkday = (date: Date): boolean => {
  return (
    isMonday(date) ||
    isTuesday(date) ||
    isWednesday(date) ||
    isThursday(date) ||
    isFriday(date)
  );
};

export const getCurrentWeekStart = (): Date => {
  return startOfWeek(new Date(), { weekStartsOn: 1 });
};

export const getNextWeekStart = (): Date => {
  return addWeeks(getCurrentWeekStart(), 1);
};

export const getPreviousWeekStart = (currentWeekStart: Date): Date => {
  return addWeeks(currentWeekStart, -1);
};

export const getNextWeekStartFromDate = (currentWeekStart: Date): Date => {
  return addWeeks(currentWeekStart, 1);
};

export const isDateInPast = (dateString: string): boolean => {
  const date = parseISO(dateString);
  const today = startOfDay(new Date());
  return isBefore(date, today);
};

export const isDateBeforeWeek = (dateString: string, weekStart: Date): boolean => {
  const date = parseISO(dateString);
  const weekStartDay = startOfDay(weekStart);
  return isBefore(date, weekStartDay);
};

export const isDateBeforeCurrentWeek = (dateString: string): boolean => {
  const date = parseISO(dateString);
  const currentWeekStart = getCurrentWeekStart();
  return isBefore(date, startOfDay(currentWeekStart));
};

export const calculateDaysToComplete = (createdAt: string, completedAt: string): number => {
  const created = parseISO(createdAt);
  const completed = parseISO(completedAt);
  return differenceInDays(completed, created);
};

export const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), "MMM d, yyyy");
};
