import type { SchedulingRules } from "../types";

const SETTINGS_STORAGE_KEY = "focusflow-settings";

export const DEFAULT_SCHEDULING_RULES: SchedulingRules = {
  monday: { totalHours: 5, urgentImportantTasks: 3, importantTasks: 2 },
  tuesday: { totalHours: 5, urgentImportantTasks: 3, importantTasks: 2 },
  wednesday: { totalHours: 5, urgentImportantTasks: 3, importantTasks: 2 },
  thursday: { totalHours: 5, urgentImportantTasks: 3, importantTasks: 2 },
  friday: { totalHours: 5, urgentImportantTasks: 1, importantTasks: 4 },
};

export const loadSchedulingRules = (): SchedulingRules => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return DEFAULT_SCHEDULING_RULES;

    const parsed = JSON.parse(stored);
    return parsed;
  } catch (error) {
    console.error("Failed to load scheduling rules:", error);
    return DEFAULT_SCHEDULING_RULES;
  }
};

export const saveSchedulingRules = (rules: SchedulingRules): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(rules));
  } catch (error) {
    console.error("Failed to save scheduling rules:", error);
  }
};

export const resetSchedulingRules = (): void => {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to reset scheduling rules:", error);
  }
};
