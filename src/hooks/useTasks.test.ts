import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTasks } from './useTasks';
import type { TaskCategory, BacklogType } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (input: string) => input.replace(/<[^>]*>/g, ''),
  },
}));

describe('useTasks', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with empty tasks', () => {
    const { result } = renderHook(() => useTasks('default'));
    expect(result.current.tasks).toEqual([]);
    expect(result.current.allTasks).toEqual([]);
  });

  it('should add a new task', () => {
    const { result } = renderHook(() => useTasks('default'));

    act(() => {
      result.current.addTask('New Task', 'urgent-important', 2);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('New Task');
    expect(result.current.tasks[0].category).toBe('urgent-important');
    expect(result.current.tasks[0].timeEstimate).toBe(2);
    expect(result.current.tasks[0].spaceId).toBe('default');
  });

  it('should add task with scheduled day', () => {
    const { result } = renderHook(() => useTasks('default'));

    act(() => {
      result.current.addTask('Scheduled Task', 'important', 1, '2024-01-15');
    });

    expect(result.current.tasks[0].scheduledDay).toBe('2024-01-15');
    expect(result.current.tasks[0].backlogType).toBeUndefined();
  });

  it('should add task with backlog type', () => {
    const { result } = renderHook(() => useTasks('default'));

    act(() => {
      result.current.addTask('Backlog Task', 'urgent', 1, undefined, 'from-last-week');
    });

    expect(result.current.tasks[0].backlogType).toBe('from-last-week');
    expect(result.current.tasks[0].scheduledDay).toBeUndefined();
  });

  it('should update a task', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Original Title', 'neither', 1);
      taskId = task.id;
    });

    act(() => {
      result.current.updateTask(taskId, { title: 'Updated Title', category: 'important' });
    });

    expect(result.current.tasks[0].title).toBe('Updated Title');
    expect(result.current.tasks[0].category).toBe('important');
  });

  it('should delete a task', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Task to Delete', 'neither', 1);
      taskId = task.id;
    });

    expect(result.current.tasks).toHaveLength(1);

    act(() => {
      result.current.deleteTask(taskId);
    });

    expect(result.current.tasks).toHaveLength(0);
  });

  it('should move task to a scheduled day', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Task', 'urgent', 1, undefined, 'monitor');
      taskId = task.id;
    });

    act(() => {
      result.current.moveTask(taskId, '2024-01-20');
    });

    expect(result.current.tasks[0].scheduledDay).toBe('2024-01-20');
    expect(result.current.tasks[0].backlogType).toBeUndefined();
  });

  it('should move task to backlog', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Task', 'important', 1, '2024-01-15');
      taskId = task.id;
    });

    act(() => {
      result.current.moveTask(taskId, undefined, 'next-week');
    });

    expect(result.current.tasks[0].backlogType).toBe('next-week');
    expect(result.current.tasks[0].scheduledDay).toBeUndefined();
  });

  it('should toggle task completion', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Task', 'urgent-important', 1, '2024-01-15');
      taskId = task.id;
    });

    expect(result.current.tasks[0].completed).toBe(false);

    act(() => {
      result.current.toggleTaskComplete(taskId);
    });

    expect(result.current.tasks[0].completed).toBe(true);
    expect(result.current.tasks[0].completedAt).toBeDefined();

    act(() => {
      result.current.toggleTaskComplete(taskId);
    });

    expect(result.current.tasks[0].completed).toBe(false);
    expect(result.current.tasks[0].completedAt).toBeUndefined();
  });

  it('should move backlog task to today when completed', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Backlog Task', 'urgent', 1, undefined, 'monitor');
      taskId = task.id;
    });

    expect(result.current.tasks[0].scheduledDay).toBeUndefined();
    expect(result.current.tasks[0].backlogType).toBe('monitor');

    act(() => {
      result.current.toggleTaskComplete(taskId);
    });

    expect(result.current.tasks[0].completed).toBe(true);
    expect(result.current.tasks[0].scheduledDay).toBeDefined();
    expect(result.current.tasks[0].backlogType).toBeUndefined();
  });

  it('should toggle subtask completion', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Task with Subtasks', 'important', 2);
      taskId = task.id;
    });

    act(() => {
      result.current.updateTask(taskId, {
        subtasks: [
          { id: 'sub1', title: 'Subtask 1', completed: false, timeEstimate: 0.5 },
          { id: 'sub2', title: 'Subtask 2', completed: false, timeEstimate: 0.5 },
        ],
      });
    });

    act(() => {
      result.current.toggleSubtaskComplete(taskId, 'sub1');
    });

    expect(result.current.tasks[0].subtasks[0].completed).toBe(true);
    expect(result.current.tasks[0].subtasks[1].completed).toBe(false);
  });

  it('should get tasks by day', () => {
    const { result } = renderHook(() => useTasks('default'));

    act(() => {
      result.current.addTask('Monday Task', 'urgent-important', 1, '2024-01-15');
      result.current.addTask('Tuesday Task', 'important', 1, '2024-01-16');
      result.current.addTask('Monday Task 2', 'urgent', 1, '2024-01-15');
    });

    const mondayTasks = result.current.getTasksByDay('2024-01-15');
    expect(mondayTasks).toHaveLength(2);
    expect(mondayTasks.every(t => t.scheduledDay === '2024-01-15')).toBe(true);
  });

  it('should get tasks by backlog', () => {
    const { result } = renderHook(() => useTasks('default'));

    act(() => {
      result.current.addTask('Monitor Task 1', 'urgent', 1, undefined, 'monitor');
      result.current.addTask('Monitor Task 2', 'important', 1, undefined, 'monitor');
      result.current.addTask('Next Week Task', 'neither', 1, undefined, 'next-week');
    });

    const monitorTasks = result.current.getTasksByBacklog('monitor');
    expect(monitorTasks).toHaveLength(2);
    expect(monitorTasks.every(t => t.backlogType === 'monitor')).toBe(true);
  });

  it('should filter out completed tasks from backlog', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      result.current.addTask('Monitor Task 1', 'urgent', 1, undefined, 'monitor');
      const task = result.current.addTask('Monitor Task 2', 'important', 1, undefined, 'monitor');
      taskId = task.id;
    });

    act(() => {
      result.current.toggleTaskComplete(taskId);
    });

    const monitorTasks = result.current.getTasksByBacklog('monitor');
    expect(monitorTasks).toHaveLength(1);
    expect(monitorTasks[0].completed).toBe(false);
  });

  it('should filter tasks by active space', () => {
    const { result } = renderHook(() => useTasks('space1'));

    act(() => {
      result.current.addTask('Space 1 Task', 'urgent-important', 1);
    });

    // Change to different space
    const { result: result2 } = renderHook(() => useTasks('space2'));

    act(() => {
      result2.current.addTask('Space 2 Task', 'important', 1);
    });

    // Space 1 should only see space 1 tasks
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].spaceId).toBe('space1');
  });

  it('should move task to different space', () => {
    const { result } = renderHook(() => useTasks('space1'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Task', 'urgent', 1);
      taskId = task.id;
    });

    expect(result.current.tasks[0].spaceId).toBe('space1');

    act(() => {
      result.current.moveTaskToSpace(taskId, 'space2');
    });

    // Task should be moved from space1 to space2
    expect(result.current.tasks).toHaveLength(0);
    expect(result.current.allTasks[0].spaceId).toBe('space2');
  });

  it('should reorder tasks', () => {
    const { result } = renderHook(() => useTasks('default'));

    let task1Id: string, task2Id: string, task3Id: string;
    act(() => {
      const t1 = result.current.addTask('Task 1', 'urgent', 1);
      const t2 = result.current.addTask('Task 2', 'important', 1);
      const t3 = result.current.addTask('Task 3', 'neither', 1);
      task1Id = t1.id;
      task2Id = t2.id;
      task3Id = t3.id;
    });

    // Reverse the order
    act(() => {
      result.current.reorderTasks([task3Id, task2Id, task1Id]);
    });

    expect(result.current.allTasks[0].id).toBe(task3Id);
    expect(result.current.allTasks[1].id).toBe(task2Id);
    expect(result.current.allTasks[2].id).toBe(task1Id);
    expect(result.current.allTasks[0].order).toBe(0);
    expect(result.current.allTasks[1].order).toBe(1);
    expect(result.current.allTasks[2].order).toBe(2);
  });

  it('should persist tasks to localStorage', () => {
    const { result } = renderHook(() => useTasks('default'));

    act(() => {
      result.current.addTask('Persistent Task', 'urgent-important', 1);
    });

    const stored = localStorageMock.getItem('focusflow-tasks');
    expect(stored).toBeDefined();
    expect(stored).toContain('Persistent Task');
  });

  it('should load tasks from localStorage on init', () => {
    const existingTasks = [
      {
        id: '1',
        title: 'Existing Task',
        category: 'important' as TaskCategory,
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        spaceId: 'default',
        order: 0,
      },
    ];

    localStorageMock.setItem('focusflow-tasks', JSON.stringify(existingTasks));

    const { result } = renderHook(() => useTasks('default'));

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Existing Task');
  });

  // ── Notes persistence tests (regression for the move-task bug) ────────────

  it('should preserve notes when moving task to a new day', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Task with notes', 'important', 1, '2024-01-15');
      taskId = task.id;
    });

    act(() => {
      result.current.updateTask(taskId, { notes: 'keep me around' });
    });

    act(() => {
      result.current.moveTask(taskId, '2024-01-20');
    });

    const moved = result.current.tasks.find(t => t.id === taskId);
    expect(moved?.scheduledDay).toBe('2024-01-20');
    expect(moved?.notes).toBe('keep me around');
  });

  it('should preserve notes when moving task to backlog', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Task with notes', 'important', 1, '2024-01-15');
      taskId = task.id;
    });

    act(() => {
      result.current.updateTask(taskId, { notes: 'backlog notes' });
    });

    act(() => {
      result.current.moveTask(taskId, undefined, 'next-week');
    });

    const moved = result.current.tasks.find(t => t.id === taskId);
    expect(moved?.backlogType).toBe('next-week');
    expect(moved?.scheduledDay).toBeUndefined();
    expect(moved?.notes).toBe('backlog notes');
  });

  it('should preserve notes when moving task from backlog to a day', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Backlog task with notes', 'urgent', 1, undefined, 'monitor');
      taskId = task.id;
    });

    act(() => {
      result.current.updateTask(taskId, { notes: 'from the monitor pile' });
    });

    act(() => {
      result.current.moveTask(taskId, '2024-01-22');
    });

    const moved = result.current.tasks.find(t => t.id === taskId);
    expect(moved?.scheduledDay).toBe('2024-01-22');
    expect(moved?.backlogType).toBeUndefined();
    expect(moved?.notes).toBe('from the monitor pile');
  });

  it('should preserve notes across multiple moves', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Nomadic task', 'neither', 1, '2024-01-15');
      taskId = task.id;
    });

    act(() => {
      result.current.updateTask(taskId, { notes: 'persists through all moves' });
    });

    act(() => { result.current.moveTask(taskId, '2024-01-16'); });
    act(() => { result.current.moveTask(taskId, undefined, 'next-month'); });
    act(() => { result.current.moveTask(taskId, '2024-01-22'); });

    const final = result.current.tasks.find(t => t.id === taskId);
    expect(final?.notes).toBe('persists through all moves');
    expect(final?.scheduledDay).toBe('2024-01-22');
  });

  it('should preserve notes when moving task to a different space', () => {
    const { result } = renderHook(() => useTasks('space1'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Cross-space task', 'important', 1, '2024-01-15');
      taskId = task.id;
    });

    act(() => {
      result.current.updateTask(taskId, { notes: 'space move notes' });
    });

    act(() => {
      result.current.moveTaskToSpace(taskId, 'space2');
    });

    const moved = result.current.allTasks.find(t => t.id === taskId);
    expect(moved?.spaceId).toBe('space2');
    expect(moved?.notes).toBe('space move notes');
  });

  it('updateTask with notes:undefined explicitly clears notes (user intent)', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Task', 'important', 1, '2024-01-15');
      taskId = task.id;
    });

    act(() => {
      result.current.updateTask(taskId, { notes: 'original' });
    });

    act(() => {
      result.current.updateTask(taskId, { notes: undefined });
    });

    const updated = result.current.tasks.find(t => t.id === taskId);
    expect(updated?.notes).toBeUndefined();
  });

  it('updateTask with only non-notes fields does not touch notes', () => {
    const { result } = renderHook(() => useTasks('default'));

    let taskId: string;
    act(() => {
      const task = result.current.addTask('Task', 'important', 1, '2024-01-15');
      taskId = task.id;
    });

    act(() => {
      result.current.updateTask(taskId, { notes: 'preserved' });
    });

    act(() => {
      result.current.updateTask(taskId, { title: 'Renamed Task', category: 'urgent' });
    });

    const updated = result.current.tasks.find(t => t.id === taskId);
    expect(updated?.title).toBe('Renamed Task');
    expect(updated?.notes).toBe('preserved');
  });

  // ── End notes persistence tests ────────────────────────────────────────────

  it('should handle import errors', async () => {
    const { result } = renderHook(() => useTasks('default'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const invalidFile = new File(['invalid'], 'test.txt', { type: 'text/plain' });

    await expect(result.current.importTasks(invalidFile)).rejects.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to import tasks:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should call exportTasks function', () => {
    const { result } = renderHook(() => useTasks('default'));

    act(() => {
      result.current.addTask('Task to Export', 'important', 1);
    });

    // Mock DOM for export
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    } as any);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    act(() => {
      result.current.exportTasks();
    });

    expect(createElementSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });
});
