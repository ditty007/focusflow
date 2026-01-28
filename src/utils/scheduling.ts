import type { Task, SchedulingRules, ValidationError, DailyLimits } from "../types";
import { getDay, parseISO } from "date-fns";
import { loadSchedulingRules } from "./settings";

export const getDayName = (date: Date): keyof SchedulingRules => {
  const dayIndex = getDay(date);
  const days: (keyof SchedulingRules)[] = [
    "monday", // We'll treat Sunday as Monday for simplicity
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "monday", // Saturday treated as Monday
  ];
  return days[dayIndex];
};

export const getDailyLimits = (date: string): DailyLimits => {
  const parsedDate = parseISO(date);
  const dayName = getDayName(parsedDate);
  const rules = loadSchedulingRules();
  return rules[dayName];
};

export const calculateTaskTime = (task: Task): number => {
  if (task.subtasks.length > 0) {
    return task.subtasks.reduce((sum, subtask) => sum + subtask.timeEstimate, 0);
  }
  return task.timeEstimate;
};

export const validateDaySchedule = (
  tasks: Task[],
  date: string,
  excludeTaskId?: string
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const limits = getDailyLimits(date);

  // Filter tasks for this day (excluding the task being moved)
  const dayTasks = tasks.filter(
    (task) => task.scheduledDay === date && task.id !== excludeTaskId
  );

  // Calculate totals
  const totalHours = dayTasks.reduce((sum, task) => sum + calculateTaskTime(task), 0);
  const urgentImportantCount = dayTasks.filter(
    (task) => task.category === "urgent-important"
  ).length;
  const importantCount = dayTasks.filter(
    (task) => task.category === "important"
  ).length;

  // Validate total hours
  if (totalHours > limits.totalHours) {
    errors.push({
      type: "total-hours",
      message: `Cannot exceed ${limits.totalHours} hours per day (currently at ${totalHours} hours)`,
    });
  }

  // Validate urgent & important task limit
  if (urgentImportantCount > limits.urgentImportantTasks) {
    errors.push({
      type: "urgent-important-limit",
      message: `Cannot exceed ${limits.urgentImportantTasks} Urgent & Important tasks (currently at ${urgentImportantCount})`,
    });
  }

  // Validate important task limit
  if (importantCount > limits.importantTasks) {
    errors.push({
      type: "important-limit",
      message: `Cannot exceed ${limits.importantTasks} Important tasks (currently at ${importantCount})`,
    });
  }

  return errors;
};

export const canScheduleTask = (
  tasks: Task[],
  task: Task,
  targetDate: string
): { valid: boolean; errors: ValidationError[] } => {
  // Get current tasks for the target day
  const dayTasks = tasks.filter(
    (t) => t.scheduledDay === targetDate && t.id !== task.id
  );

  // Add the task being scheduled
  const updatedTasks = [...dayTasks, { ...task, scheduledDay: targetDate }];

  // Validate
  const errors = validateDaySchedule(updatedTasks, targetDate);

  return {
    valid: errors.length === 0,
    errors,
  };
};
