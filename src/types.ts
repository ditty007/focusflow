export type TaskCategory = "urgent-important" | "important" | "urgent" | "neither";

export type BacklogType = "next-week" | "next-month" | "incomplete" | "monitor";

export interface Space {
  id: string;
  name: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  timeEstimate: number; // in hours
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  timeEstimate: number; // in hours (0.25, 0.5, 1, 1.5, etc.)
  notes?: string;
  stakeholder?: string;
  subtasks: Subtask[];
  completed: boolean;
  completedAt?: string; // ISO date when task was completed
  scheduledDay?: string; // ISO date or undefined for backlog
  backlogType?: BacklogType;
  createdAt: string;
  order: number;
  spaceId: string; // ID of the space this task belongs to
}

export interface DailyLimits {
  totalHours: number;
  urgentImportantTasks: number;
  importantTasks: number;
}

export interface SchedulingRules {
  monday: DailyLimits;
  tuesday: DailyLimits;
  wednesday: DailyLimits;
  thursday: DailyLimits;
  friday: DailyLimits;
}

export interface ValidationError {
  type: "total-hours" | "urgent-important-limit" | "important-limit";
  message: string;
}
