import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSpaces, saveSpaces, loadActiveSpaceId, saveActiveSpaceId, createSpace } from './spaces';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('spaces utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('loadSpaces', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should load spaces from localStorage', () => {
      const mockSpaces = [
        { id: 'space1', name: 'Work', createdAt: '2024-01-01T00:00:00.000Z' },
      ];
      localStorageMock.setItem('focusflow-spaces', JSON.stringify(mockSpaces));

      const spaces = loadSpaces();
      expect(spaces).toEqual(mockSpaces);
    });

    it('should return default space when localStorage is empty', () => {
      const spaces = loadSpaces();
      expect(spaces).toHaveLength(1);
      expect(spaces[0].name).toBe('Personal');
    });

    it('should handle localStorage errors and return default space', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalGetItem = localStorageMock.getItem;

      localStorageMock.getItem = vi.fn(() => {
        throw new Error('localStorage error');
      });

      const spaces = loadSpaces();
      expect(spaces).toHaveLength(1);
      expect(spaces[0].name).toBe('Personal');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading spaces from localStorage:',
        expect.any(Error)
      );

      localStorageMock.getItem = originalGetItem;
      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON parse errors and return default space', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem('focusflow-spaces', 'invalid json');

      const spaces = loadSpaces();
      expect(spaces).toHaveLength(1);
      expect(spaces[0].name).toBe('Personal');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveSpaces', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should save spaces to localStorage', () => {
      const spaces = [
        { id: 'space1', name: 'Work', createdAt: '2024-01-01T00:00:00.000Z' },
      ];

      saveSpaces(spaces);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'focusflow-spaces',
        JSON.stringify(spaces)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalSetItem = localStorageMock.setItem;

      localStorageMock.setItem = vi.fn(() => {
        throw new Error('localStorage full');
      });

      const spaces = [{ id: 'space1', name: 'Work', createdAt: '2024-01-01' }];

      // Should not throw
      expect(() => saveSpaces(spaces)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving spaces to localStorage:',
        expect.any(Error)
      );

      localStorageMock.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadActiveSpaceId', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should load active space ID from localStorage', () => {
      localStorageMock.setItem('focusflow-active-space', 'space1');

      const spaceId = loadActiveSpaceId();
      expect(spaceId).toBe('space1');
    });

    it('should return default space ID when localStorage is empty', () => {
      const spaceId = loadActiveSpaceId();
      expect(spaceId).toBeDefined();
      expect(typeof spaceId).toBe('string');
    });

    it('should handle localStorage errors and return default', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalGetItem = localStorageMock.getItem;

      localStorageMock.getItem = vi.fn(() => {
        throw new Error('localStorage error');
      });

      const spaceId = loadActiveSpaceId();
      expect(spaceId).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading active space from localStorage:',
        expect.any(Error)
      );

      localStorageMock.getItem = originalGetItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveActiveSpaceId', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should save active space ID to localStorage', () => {
      saveActiveSpaceId('space1');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('focusflow-active-space', 'space1');
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalSetItem = localStorageMock.setItem;

      localStorageMock.setItem = vi.fn(() => {
        throw new Error('localStorage full');
      });

      // Should not throw
      expect(() => saveActiveSpaceId('space1')).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving active space to localStorage:',
        expect.any(Error)
      );

      localStorageMock.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createSpace', () => {
    it('should create a new space with unique ID', () => {
      const space1 = createSpace('Work');
      const space2 = createSpace('Personal');

      expect(space1.id).not.toBe(space2.id);
      expect(space1.name).toBe('Work');
      expect(space2.name).toBe('Personal');
    });

    it('should create space with timestamp', () => {
      const space = createSpace('Test');
      expect(space.createdAt).toBeDefined();
      expect(new Date(space.createdAt)).toBeInstanceOf(Date);
    });
  });
});
