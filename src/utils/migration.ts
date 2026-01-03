import type { Task } from "../types";
import { isDateBeforeWeek, getCurrentWeekStart } from "./dates";
import { getDefaultSpaceId } from "./spaces";

export const migrateTasksToSpaces = (tasks: Task[]): Task[] => {
  const defaultSpaceId = getDefaultSpaceId();
  return tasks.map((task) => {
    // Add spaceId to tasks that don't have it (migrating old data)
    if (!task.spaceId) {
      return {
        ...task,
        spaceId: defaultSpaceId,
      };
    }
    return task;
  });
};

export const migrateCompletedTasks = (tasks: Task[]): Task[] => {
  return tasks.map((task) => {
    // Add completedAt to completed tasks that don't have it
    if (task.completed && !task.completedAt) {
      return {
        ...task,
        completedAt: task.createdAt, // Use creation date as fallback
      };
    }
    return task;
  });
};

export const migrateIncompleteTasks = (tasks: Task[]): Task[] => {
  const currentWeekStart = getCurrentWeekStart();

  return tasks.map((task) => {
    // Skip if already in backlog or if completed
    if (!task.scheduledDay || task.completed || task.backlogType) {
      return task;
    }

    // Check if task is from a previous week
    if (isDateBeforeWeek(task.scheduledDay, currentWeekStart)) {
      // Move to "From Last Week(s)" backlog
      return {
        ...task,
        scheduledDay: undefined,
        backlogType: "incomplete" as const,
      };
    }

    return task;
  });
};

export const shouldMigrateTasks = (tasks: Task[]): boolean => {
  const currentWeekStart = getCurrentWeekStart();

  return tasks.some((task) => {
    return (
      task.scheduledDay &&
      !task.completed &&
      !task.backlogType &&
      isDateBeforeWeek(task.scheduledDay, currentWeekStart)
    );
  });
};
