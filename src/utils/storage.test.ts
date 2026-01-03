import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTasks, saveTasks, generateId, exportTasks, importTasks } from './storage';
import type { Task } from '../types';

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

describe('loadTasks', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return empty array when no tasks are stored', () => {
    const tasks = loadTasks();
    expect(tasks).toEqual([]);
  });

  it('should load tasks from localStorage', () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Test Task',
        category: 'urgent-important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        spaceId: 'default',
      },
    ];

    localStorageMock.setItem('focusflow-tasks', JSON.stringify(mockTasks));
    const tasks = loadTasks();

    expect(tasks).toEqual(mockTasks);
  });

  it('should return empty array on invalid JSON', () => {
    localStorageMock.setItem('focusflow-tasks', 'invalid json');
    const tasks = loadTasks();
    expect(tasks).toEqual([]);
  });

  it('should handle corrupted localStorage gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.setItem('focusflow-tasks', '{invalid}');

    const tasks = loadTasks();
    expect(tasks).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

describe('saveTasks', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should save tasks to localStorage', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Test Task',
        category: 'important',
        completed: false,
        timeEstimate: 2,
        subtasks: [],
        createdAt: '2024-01-01',
        spaceId: 'default',
      },
    ];

    saveTasks(tasks);
    const stored = localStorageMock.getItem('focusflow-tasks');
    expect(stored).toBe(JSON.stringify(tasks));
  });

  it('should overwrite existing tasks', () => {
    const oldTasks: Task[] = [
      {
        id: '1',
        title: 'Old Task',
        category: 'neither',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        spaceId: 'default',
      },
    ];

    const newTasks: Task[] = [
      {
        id: '2',
        title: 'New Task',
        category: 'urgent',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-02',
        spaceId: 'default',
      },
    ];

    saveTasks(oldTasks);
    saveTasks(newTasks);

    const stored = localStorageMock.getItem('focusflow-tasks');
    expect(stored).toBe(JSON.stringify(newTasks));
  });

  it('should save empty array', () => {
    saveTasks([]);
    const stored = localStorageMock.getItem('focusflow-tasks');
    expect(stored).toBe('[]');
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Save original setItem
    const originalSetItem = localStorageMock.setItem;

    // Mock setItem to throw error
    localStorageMock.setItem = vi.fn(() => {
      throw new Error('localStorage full');
    });

    const tasks: Task[] = [
      {
        id: '1',
        title: 'Task',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        spaceId: 'default',
      },
    ];

    // Should not throw
    expect(() => saveTasks(tasks)).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error saving tasks to localStorage:',
      expect.any(Error)
    );

    // Restore
    localStorageMock.setItem = originalSetItem;
    consoleErrorSpy.mockRestore();
  });
});

describe('generateId', () => {
  it('should generate a unique ID', () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });

  it('should generate IDs with timestamp and random component', () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it('should generate unique IDs in quick succession', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('exportTasks', () => {
  it('should create and trigger download', () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Export Test',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        spaceId: 'default',
      },
    ];

    // Mock DOM elements and methods
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    exportTasks(mockTasks);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.click).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
    expect(mockLink.download).toMatch(/^focusflow-backup-\d{4}-\d{2}-\d{2}\.json$/);

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('should throw error on export failure', () => {
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(() => {
      throw new Error('Mock error');
    });

    expect(() => exportTasks([])).toThrow('Failed to export tasks');
    createElementSpy.mockRestore();
  });
});

describe('importTasks', () => {
  it('should import valid tasks from JSON file', async () => {
    const validTasks = [
      {
        id: '1',
        title: 'Imported Task',
        category: 'urgent-important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        spaceId: 'default',
      },
    ];

    const file = new File([JSON.stringify(validTasks)], 'tasks.json', {
      type: 'application/json',
    });

    const tasks = await importTasks(file);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Imported Task');
  });

  it('should reject non-JSON files', async () => {
    const file = new File(['content'], 'tasks.txt', { type: 'text/plain' });

    await expect(importTasks(file)).rejects.toThrow('Invalid file type');
  });

  it('should reject files over 10MB', async () => {
    const largeContent = 'a'.repeat(11 * 1024 * 1024); // 11MB
    const file = new File([largeContent], 'large.json', { type: 'application/json' });

    await expect(importTasks(file)).rejects.toThrow('File size too large');
  });

  it('should reject invalid JSON', async () => {
    const file = new File(['invalid json'], 'tasks.json', { type: 'application/json' });

    await expect(importTasks(file)).rejects.toThrow('Invalid JSON format');
  });

  it('should reject non-array data', async () => {
    const file = new File([JSON.stringify({ not: 'array' })], 'tasks.json', {
      type: 'application/json',
    });

    await expect(importTasks(file)).rejects.toThrow(
      'Invalid file format: must be an array of tasks'
    );
  });

  it('should sanitize imported task data', async () => {
    const maliciousTasks = [
      {
        id: '1',
        title: '<script>alert("XSS")</script>Malicious Task',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        spaceId: 'default',
        notes: '<img src=x onerror="alert()">',
      },
    ];

    const file = new File([JSON.stringify(maliciousTasks)], 'tasks.json', {
      type: 'application/json',
    });

    const tasks = await importTasks(file);
    expect(tasks[0].title).not.toContain('<script>');
    expect(tasks[0].notes).not.toContain('<img');
  });

  it('should reject files with content over 50MB', async () => {
    const validTasks = [{ id: '1', title: 'Task', category: 'neither' }];
    const largeContent = JSON.stringify(validTasks).padEnd(51 * 1024 * 1024, ' ');
    const file = new File([largeContent], 'tasks.json', { type: 'application/json' });

    // File size validation happens first (10MB limit), so it will reject for size not content
    await expect(importTasks(file)).rejects.toThrow('File size too large');
  });

  it('should sanitize subtask titles', async () => {
    const tasksWithSubtasks = [
      {
        id: '1',
        title: 'Task',
        category: 'important',
        completed: false,
        timeEstimate: 1,
        subtasks: [
          {
            id: 'sub1',
            title: '<b>Malicious</b> Subtask',
            completed: false,
            timeEstimate: 0.5,
          },
        ],
        createdAt: '2024-01-01',
        spaceId: 'default',
      },
    ];

    const file = new File([JSON.stringify(tasksWithSubtasks)], 'tasks.json', {
      type: 'application/json',
    });

    const tasks = await importTasks(file);
    expect(tasks[0].subtasks[0].title).not.toContain('<b>');
    expect(tasks[0].subtasks[0].title).toContain('Malicious');
  });

  it('should handle FileReader errors', async () => {
    const file = new File(['{}'], 'test.json', { type: 'application/json' });

    // Mock FileReader to trigger onerror
    const originalFileReader = global.FileReader;
    global.FileReader = class MockFileReader {
      onload: any;
      onerror: any;
      readAsText() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error('File read error'));
          }
        }, 0);
      }
    } as any;

    await expect(importTasks(file)).rejects.toThrow('Failed to read file');

    // Restore
    global.FileReader = originalFileReader;
  });

  it('should handle general parsing errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const file = new File(['{broken'], 'tasks.json', { type: 'application/json' });

    await expect(importTasks(file)).rejects.toThrow('Invalid JSON format');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
