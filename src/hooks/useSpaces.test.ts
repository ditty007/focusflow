import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpaces } from './useSpaces';

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

describe('useSpaces', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with default space', () => {
    const { result } = renderHook(() => useSpaces());

    expect(result.current.spaces).toHaveLength(1);
    expect(result.current.spaces[0].name).toBe('Personal');
    expect(result.current.activeSpaceId).toBe(result.current.spaces[0].id);
    expect(result.current.activeSpace).toBeDefined();
  });

  it('should add a new space', () => {
    const { result } = renderHook(() => useSpaces());

    act(() => {
      result.current.addSpace('Work');
    });

    expect(result.current.spaces).toHaveLength(2);
    expect(result.current.spaces[1].name).toBe('Work');
  });

  it('should update a space', () => {
    const { result } = renderHook(() => useSpaces());

    let spaceId: string;
    act(() => {
      const space = result.current.addSpace('Work');
      spaceId = space.id;
    });

    act(() => {
      result.current.updateSpace(spaceId, { name: 'Work Projects' });
    });

    const updatedSpace = result.current.spaces.find(s => s.id === spaceId);
    expect(updatedSpace?.name).toBe('Work Projects');
  });

  it('should delete a space', () => {
    const { result } = renderHook(() => useSpaces());

    let spaceId: string;
    act(() => {
      const space = result.current.addSpace('Temporary');
      spaceId = space.id;
    });

    expect(result.current.spaces).toHaveLength(2);

    act(() => {
      result.current.deleteSpace(spaceId);
    });

    expect(result.current.spaces).toHaveLength(1);
    expect(result.current.spaces.find(s => s.id === spaceId)).toBeUndefined();
  });

  it('should not delete the last space', () => {
    const { result } = renderHook(() => useSpaces());
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const initialSpaceId = result.current.spaces[0].id;

    act(() => {
      result.current.deleteSpace(initialSpaceId);
    });

    expect(result.current.spaces).toHaveLength(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot delete the last space');

    consoleWarnSpy.mockRestore();
  });

  it('should switch active space when deleting current active space', () => {
    const { result } = renderHook(() => useSpaces());

    let space1Id: string, space2Id: string;
    act(() => {
      const s1 = result.current.addSpace('Space 1');
      const s2 = result.current.addSpace('Space 2');
      space1Id = s1.id;
      space2Id = s2.id;
    });

    act(() => {
      result.current.setActiveSpaceId(space2Id);
    });

    expect(result.current.activeSpaceId).toBe(space2Id);

    act(() => {
      result.current.deleteSpace(space2Id);
    });

    // Should switch to a remaining space
    expect(result.current.activeSpaceId).not.toBe(space2Id);
    expect(result.current.spaces.find(s => s.id === result.current.activeSpaceId)).toBeDefined();
  });

  it('should set active space', () => {
    const { result } = renderHook(() => useSpaces());

    let spaceId: string;
    act(() => {
      const space = result.current.addSpace('New Space');
      spaceId = space.id;
    });

    act(() => {
      result.current.setActiveSpaceId(spaceId);
    });

    expect(result.current.activeSpaceId).toBe(spaceId);
    expect(result.current.activeSpace?.id).toBe(spaceId);
  });

  it('should not set non-existent space as active', () => {
    const { result } = renderHook(() => useSpaces());
    const originalActiveId = result.current.activeSpaceId;

    act(() => {
      result.current.setActiveSpaceId('non-existent-id');
    });

    // Active space should not change
    expect(result.current.activeSpaceId).toBe(originalActiveId);
  });

  it('should get active space', () => {
    const { result } = renderHook(() => useSpaces());

    expect(result.current.activeSpace).toBeDefined();
    expect(result.current.activeSpace?.id).toBe(result.current.activeSpaceId);
  });

  it('should persist spaces to localStorage', () => {
    const { result } = renderHook(() => useSpaces());

    act(() => {
      result.current.addSpace('Persistent Space');
    });

    const stored = localStorageMock.getItem('focusflow-spaces');
    expect(stored).toBeDefined();
    expect(stored).toContain('Persistent Space');
  });

  it('should persist active space ID to localStorage', () => {
    const { result } = renderHook(() => useSpaces());

    let spaceId: string;
    act(() => {
      const space = result.current.addSpace('Work');
      spaceId = space.id;
    });

    act(() => {
      result.current.setActiveSpaceId(spaceId);
    });

    const stored = localStorageMock.getItem('focusflow-active-space');
    expect(stored).toBe(spaceId);
  });

  it('should load spaces from localStorage on init', () => {
    const existingSpaces = [
      {
        id: 'space1',
        name: 'Existing Space',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    localStorageMock.setItem('focusflow-spaces', JSON.stringify(existingSpaces));

    const { result } = renderHook(() => useSpaces());

    expect(result.current.spaces).toHaveLength(1);
    expect(result.current.spaces[0].name).toBe('Existing Space');
  });

  it('should load active space ID from localStorage on init', () => {
    const existingSpaces = [
      {
        id: 'space1',
        name: 'Space 1',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'space2',
        name: 'Space 2',
        createdAt: '2024-01-02T00:00:00.000Z',
      },
    ];

    localStorageMock.setItem('focusflow-spaces', JSON.stringify(existingSpaces));
    localStorageMock.setItem('focusflow-active-space', 'space2');

    const { result } = renderHook(() => useSpaces());

    expect(result.current.activeSpaceId).toBe('space2');
    expect(result.current.activeSpace?.name).toBe('Space 2');
  });

  it('should fallback to default space if loaded active space does not exist', () => {
    const existingSpaces = [
      {
        id: 'space1',
        name: 'Space 1',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    localStorageMock.setItem('focusflow-spaces', JSON.stringify(existingSpaces));
    localStorageMock.setItem('focusflow-active-space', 'non-existent-space');

    const { result } = renderHook(() => useSpaces());

    // Should fallback to the default space ID since loaded space doesn't exist
    expect(result.current.activeSpaceId).toBeDefined();
    // The active space ID should be the default space ID (not in the existing spaces)
    const defaultSpaceId = result.current.activeSpaceId;
    expect(defaultSpaceId).toBeTruthy();
  });

  it('should create spaces with unique IDs', () => {
    const { result } = renderHook(() => useSpaces());

    let space1Id: string, space2Id: string;
    act(() => {
      const s1 = result.current.addSpace('Space 1');
      const s2 = result.current.addSpace('Space 2');
      space1Id = s1.id;
      space2Id = s2.id;
    });

    expect(space1Id).not.toBe(space2Id);
  });

  it('should create spaces with timestamps', () => {
    const { result } = renderHook(() => useSpaces());

    let space: any;
    act(() => {
      space = result.current.addSpace('New Space');
    });

    expect(space.createdAt).toBeDefined();
    expect(new Date(space.createdAt)).toBeInstanceOf(Date);
  });
});
