import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  validateTaskTitle,
  validateNotes,
  validateStakeholder,
  validateSpaceName,
  validateImportedTasks,
  validateFileSize,
  validateFileType,
} from './security';

describe('sanitizeInput', () => {
  it('should remove HTML tags and scripts', () => {
    const input = '<script>alert("XSS")</script>Hello';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello');
  });

  it('should remove event handlers', () => {
    const input = '<div onclick="alert()">Text</div>';
    const result = sanitizeInput(input);
    expect(result).toBe('Text');
  });

  it('should preserve safe text content', () => {
    const input = 'Normal task title with 123 numbers';
    const result = sanitizeInput(input);
    expect(result).toBe('Normal task title with 123 numbers');
  });

  it('should trim whitespace', () => {
    const input = '  Task title  ';
    const result = sanitizeInput(input);
    expect(result).toBe('Task title');
  });

  it('should handle empty strings', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput('   ')).toBe('');
  });

  it('should remove dangerous URL schemes', () => {
    const input = '<a href="javascript:alert()">Click</a>';
    const result = sanitizeInput(input);
    expect(result).toBe('Click');
  });
});

describe('validateTaskTitle', () => {
  it('should validate and sanitize a valid title', () => {
    const result = validateTaskTitle('My Task');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('My Task');
    expect(result.error).toBeUndefined();
  });

  it('should reject empty titles', () => {
    const result = validateTaskTitle('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Title is required');
  });

  it('should reject whitespace-only titles', () => {
    const result = validateTaskTitle('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Title is required');
  });

  it('should reject titles over 500 characters', () => {
    const longTitle = 'a'.repeat(501);
    const result = validateTaskTitle(longTitle);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Title must be less than 500 characters');
  });

  it('should sanitize XSS attempts in titles', () => {
    const result = validateTaskTitle('<script>alert("XSS")</script>Task');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Task');
  });
});

describe('validateNotes', () => {
  it('should validate and sanitize valid notes', () => {
    const result = validateNotes('Some notes about the task');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Some notes about the task');
  });

  it('should accept empty notes', () => {
    const result = validateNotes('');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('');
  });

  it('should reject notes over 5000 characters', () => {
    const longNotes = 'a'.repeat(5001);
    const result = validateNotes(longNotes);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Notes must be less than 5000 characters');
  });

  it('should sanitize HTML in notes', () => {
    const result = validateNotes('<b>Bold notes</b>');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Bold notes');
  });
});

describe('validateStakeholder', () => {
  it('should validate and sanitize valid stakeholder names', () => {
    const result = validateStakeholder('John Doe');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('John Doe');
  });

  it('should accept empty stakeholder', () => {
    const result = validateStakeholder('');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('');
  });

  it('should reject stakeholder names over 200 characters', () => {
    const longName = 'a'.repeat(201);
    const result = validateStakeholder(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Stakeholder name must be less than 200 characters');
  });

  it('should sanitize XSS attempts', () => {
    const result = validateStakeholder('<img src=x onerror="alert()">');
    expect(result.valid).toBe(true);
    expect(result.sanitized).not.toContain('<img');
  });
});

describe('validateSpaceName', () => {
  it('should validate and sanitize valid space names', () => {
    const result = validateSpaceName('Work Space');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Work Space');
  });

  it('should reject empty space names', () => {
    const result = validateSpaceName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Space name is required');
  });

  it('should reject whitespace-only space names', () => {
    const result = validateSpaceName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Space name is required');
  });

  it('should reject space names over 100 characters', () => {
    const longName = 'a'.repeat(101);
    const result = validateSpaceName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Space name must be less than 100 characters');
  });
});

describe('validateImportedTasks', () => {
  it('should validate a valid task array', () => {
    const validTasks = [
      {
        id: '1',
        title: 'Task 1',
        category: 'urgent-important',
        completed: false,
        timeEstimate: 1,
        subtasks: [],
        createdAt: '2024-01-01',
        spaceId: 'default',
      },
    ];
    const result = validateImportedTasks(validTasks);
    expect(result.valid).toBe(true);
  });

  it('should reject non-array data', () => {
    const result = validateImportedTasks({ not: 'an array' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid file format: must be an array of tasks');
  });

  it('should reject arrays with too many tasks', () => {
    const tooManyTasks = Array(10001).fill({
      id: '1',
      title: 'Task',
      category: 'neither',
    });
    const result = validateImportedTasks(tooManyTasks);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Too many tasks in file (maximum 10,000)');
  });

  it('should reject tasks with missing required fields', () => {
    const invalidTasks = [{ id: '1', title: 'Task' }]; // missing category
    const result = validateImportedTasks(invalidTasks);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid task structure: missing required fields');
  });

  it('should reject tasks with excessively long titles', () => {
    const tasks = [
      {
        id: '1',
        title: 'a'.repeat(10001),
        category: 'neither',
      },
    ];
    const result = validateImportedTasks(tasks);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Task title too long');
  });

  it('should reject tasks with excessively long notes', () => {
    const tasks = [
      {
        id: '1',
        title: 'Task',
        category: 'neither',
        notes: 'a'.repeat(50001),
      },
    ];
    const result = validateImportedTasks(tasks);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Task notes too long');
  });

  it('should reject invalid task objects', () => {
    const result = validateImportedTasks([null]);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid task format');
  });
});

describe('validateFileSize', () => {
  it('should accept files under 10MB', () => {
    const file = new File(['content'], 'test.json', { type: 'application/json' });
    const result = validateFileSize(file);
    expect(result.valid).toBe(true);
  });

  it('should reject files over 10MB', () => {
    const largeContent = 'a'.repeat(11 * 1024 * 1024); // 11MB
    const file = new File([largeContent], 'large.json', { type: 'application/json' });
    const result = validateFileSize(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('File size too large (maximum 10MB)');
  });
});

describe('validateFileType', () => {
  it('should accept JSON files with correct MIME type', () => {
    const file = new File(['{}'], 'test.json', { type: 'application/json' });
    const result = validateFileType(file);
    expect(result.valid).toBe(true);
  });

  it('should accept JSON files with .json extension', () => {
    const file = new File(['{}'], 'test.json', { type: 'text/plain' });
    const result = validateFileType(file);
    expect(result.valid).toBe(true);
  });

  it('should reject non-JSON files', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const result = validateFileType(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid file type. Only JSON files are allowed.');
  });

  it('should reject files without .json extension', () => {
    const file = new File(['{}'], 'test.xml', { type: 'application/xml' });
    const result = validateFileType(file);
    expect(result.valid).toBe(false);
  });

  it('should be case-insensitive for file extensions', () => {
    const file = new File(['{}'], 'test.JSON', { type: 'application/json' });
    const result = validateFileType(file);
    expect(result.valid).toBe(true);
  });
});
