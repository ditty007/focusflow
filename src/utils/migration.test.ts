import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  migrateTasksToSpaces,
  migrateCompletedTasks,
  migrateIncompleteTasks,
  shouldMigrateTasks,
} from './migration';
import type { Task } from '../types';
import { format, addDays, subDays } from 'date-fns';

// Mock the dates module
vi.mock('./dates', async () => {
  const actual = await vi.importActual('./dates');
  return {
    ...actual,
    getCurrentWeekStart: vi.fn(() => new Date('2024-01-15T00:00:00Z')), // Monday
    isDateBeforeWeek: vi.fn((dateString: string, weekStart: Date) => {
      const date = new Date(dateString);
      return date < weekStart;
    }),
  };
});

// Mock the spaces module
vi.mock('./spaces', () => ({
  getDefaultSpaceId: vi.fn(() => 'default-space-id'),
}));

describe('migrateTasksToSpaces', () => {
  it('should add default spaceId to tasks without spaceId', () => {
    const tasksWithoutSpaceId: Task[] = [
      {
        id: '1',
        title: 'Old Task',
        category: 'urgent-important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        // spaceId is missing
      } as Task,
    ];

    const migrated = migrateTasksToSpaces(tasksWithoutSpaceId);

    expect(migrated[0].spaceId).toBe('default-space-id');
  });

  it('should preserve existing spaceId', () => {
    const tasksWithSpaceId: Task[] = [
      {
        id: '1',
        title: 'Task',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        spaceId: 'existing-space',
      },
    ];

    const migrated = migrateTasksToSpaces(tasksWithSpaceId);

    expect(migrated[0].spaceId).toBe('existing-space');
  });

  it('should handle empty array', () => {
    const result = migrateTasksToSpaces([]);
    expect(result).toEqual([]);
  });

  it('should migrate multiple tasks', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        category: 'urgent',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
      } as Task,
      {
        id: '2',
        title: 'Task 2',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-02',
        spaceId: 'custom-space',
      },
    ];

    const migrated = migrateTasksToSpaces(tasks);

    expect(migrated[0].spaceId).toBe('default-space-id');
    expect(migrated[1].spaceId).toBe('custom-space');
  });
});

describe('migrateCompletedTasks', () => {
  it('should add completedAt to completed tasks without it', () => {
    const completedTasksWithoutDate: Task[] = [
      {
        id: '1',
        title: 'Completed Task',
        category: 'urgent-important',
        completed: true,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01T10:00:00Z',
        spaceId: 'default',
        // completedAt is missing
      },
    ];

    const migrated = migrateCompletedTasks(completedTasksWithoutDate);

    expect(migrated[0].completedAt).toBe('2024-01-01T10:00:00Z');
  });

  it('should preserve existing completedAt', () => {
    const tasksWithCompletedAt: Task[] = [
      {
        id: '1',
        title: 'Task',
        category: 'important',
        completed: true,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        completedAt: '2024-01-05',
        spaceId: 'default',
      },
    ];

    const migrated = migrateCompletedTasks(tasksWithCompletedAt);

    expect(migrated[0].completedAt).toBe('2024-01-05');
  });

  it('should not add completedAt to incomplete tasks', () => {
    const incompleteTasks: Task[] = [
      {
        id: '1',
        title: 'Incomplete Task',
        category: 'urgent',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        spaceId: 'default',
      },
    ];

    const migrated = migrateCompletedTasks(incompleteTasks);

    expect(migrated[0].completedAt).toBeUndefined();
  });

  it('should handle empty array', () => {
    const result = migrateCompletedTasks([]);
    expect(result).toEqual([]);
  });

  it('should handle mixed completed and incomplete tasks', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Completed',
        category: 'urgent',
        completed: true,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        spaceId: 'default',
      },
      {
        id: '2',
        title: 'Incomplete',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-02',
        spaceId: 'default',
      },
    ];

    const migrated = migrateCompletedTasks(tasks);

    expect(migrated[0].completedAt).toBe('2024-01-01');
    expect(migrated[1].completedAt).toBeUndefined();
  });
});

describe('migrateIncompleteTasks', () => {
  it('should move incomplete tasks from previous weeks to backlog', () => {
    const oldIncompleteTasks: Task[] = [
      {
        id: '1',
        title: 'Old Task',
        category: 'urgent-important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        scheduledDay: '2024-01-08', // Before current week (Jan 15)
        spaceId: 'default',
      },
    ];

    const migrated = migrateIncompleteTasks(oldIncompleteTasks);

    expect(migrated[0].scheduledDay).toBeUndefined();
    expect(migrated[0].backlogType).toBe('incomplete');
  });

  it('should not migrate tasks without scheduledDay', () => {
    const tasksWithoutScheduledDay: Task[] = [
      {
        id: '1',
        title: 'Task',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        backlogType: 'monitor',
        spaceId: 'default',
      },
    ];

    const migrated = migrateIncompleteTasks(tasksWithoutScheduledDay);

    expect(migrated[0]).toEqual(tasksWithoutScheduledDay[0]);
  });

  it('should not migrate completed tasks', () => {
    const completedTasks: Task[] = [
      {
        id: '1',
        title: 'Completed Old Task',
        category: 'urgent',
        completed: true,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        scheduledDay: '2024-01-08', // Before current week
        completedAt: '2024-01-08',
        spaceId: 'default',
      },
    ];

    const migrated = migrateIncompleteTasks(completedTasks);

    expect(migrated[0].scheduledDay).toBe('2024-01-08');
    expect(migrated[0].backlogType).toBeUndefined();
  });

  it('should not migrate tasks already in backlog', () => {
    const backlogTasks: Task[] = [
      {
        id: '1',
        title: 'Backlog Task',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        scheduledDay: '2024-01-08',
        backlogType: 'next-week',
        spaceId: 'default',
      },
    ];

    const migrated = migrateIncompleteTasks(backlogTasks);

    expect(migrated[0]).toEqual(backlogTasks[0]);
  });

  it('should not migrate tasks from current or future weeks', () => {
    const currentWeekTasks: Task[] = [
      {
        id: '1',
        title: 'Current Week Task',
        category: 'urgent',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-15',
        scheduledDay: '2024-01-16', // During or after current week (Jan 15)
        spaceId: 'default',
      },
    ];

    const migrated = migrateIncompleteTasks(currentWeekTasks);

    expect(migrated[0].scheduledDay).toBe('2024-01-16');
    expect(migrated[0].backlogType).toBeUndefined();
  });

  it('should handle empty array', () => {
    const result = migrateIncompleteTasks([]);
    expect(result).toEqual([]);
  });

  it('should handle mixed tasks', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Old Incomplete',
        category: 'urgent',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        scheduledDay: '2024-01-08', // Before current week
        spaceId: 'default',
      },
      {
        id: '2',
        title: 'Current Week',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-15',
        scheduledDay: '2024-01-17', // Current week
        spaceId: 'default',
      },
      {
        id: '3',
        title: 'Completed Old',
        category: 'urgent',
        completed: true,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        scheduledDay: '2024-01-08',
        completedAt: '2024-01-08',
        spaceId: 'default',
      },
    ];

    const migrated = migrateIncompleteTasks(tasks);

    expect(migrated[0].backlogType).toBe('incomplete');
    expect(migrated[1].scheduledDay).toBe('2024-01-17');
    expect(migrated[2].scheduledDay).toBe('2024-01-08');
  });
});

describe('shouldMigrateTasks', () => {
  it('should return true if there are incomplete tasks from previous weeks', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Old Task',
        category: 'urgent-important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        scheduledDay: '2024-01-08', // Before current week
        spaceId: 'default',
      },
    ];

    const result = shouldMigrateTasks(tasks);
    expect(result).toBe(true);
  });

  it('should return false if no incomplete tasks from previous weeks', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Current Week Task',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-15',
        scheduledDay: '2024-01-16', // Current or future week
        spaceId: 'default',
      },
    ];

    const result = shouldMigrateTasks(tasks);
    expect(result).toBe(false);
  });

  it('should return false if tasks are completed', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Completed Old Task',
        category: 'urgent',
        completed: true,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        scheduledDay: '2024-01-08',
        completedAt: '2024-01-08',
        spaceId: 'default',
      },
    ];

    const result = shouldMigrateTasks(tasks);
    expect(result).toBe(false);
  });

  it('should return false if tasks are already in backlog', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Backlog Task',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        scheduledDay: '2024-01-08',
        backlogType: 'monitor',
        spaceId: 'default',
      },
    ];

    const result = shouldMigrateTasks(tasks);
    expect(result).toBe(false);
  });

  it('should return false for empty array', () => {
    const result = shouldMigrateTasks([]);
    expect(result).toBe(false);
  });

  it('should return false if tasks have no scheduledDay', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Task',
        category: 'neither',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        backlogType: 'monitor',
        spaceId: 'default',
      },
    ];

    const result = shouldMigrateTasks(tasks);
    expect(result).toBe(false);
  });

  it('should return true if at least one task needs migration', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Current Task',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-15',
        scheduledDay: '2024-01-16',
        spaceId: 'default',
      },
      {
        id: '2',
        title: 'Old Task',
        category: 'urgent',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        scheduledDay: '2024-01-08', // Before current week
        spaceId: 'default',
      },
    ];

    const result = shouldMigrateTasks(tasks);
    expect(result).toBe(true);
  });
});
