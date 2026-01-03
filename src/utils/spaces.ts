import type { Space } from "../types";
import { generateId } from "./storage";

const SPACES_STORAGE_KEY = "focusflow-spaces";
const ACTIVE_SPACE_KEY = "focusflow-active-space";
const DEFAULT_SPACE_ID = "default";

export const loadSpaces = (): Space[] => {
  try {
    const stored = localStorage.getItem(SPACES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading spaces from localStorage:", error);
  }

  // Return default space if none exist
  return [createDefaultSpace()];
};

export const saveSpaces = (spaces: Space[]): void => {
  try {
    localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(spaces));
  } catch (error) {
    console.error("Error saving spaces to localStorage:", error);
  }
};

export const loadActiveSpaceId = (): string => {
  try {
    const stored = localStorage.getItem(ACTIVE_SPACE_KEY);
    if (stored) {
      return stored;
    }
  } catch (error) {
    console.error("Error loading active space from localStorage:", error);
  }
  return DEFAULT_SPACE_ID;
};

export const saveActiveSpaceId = (spaceId: string): void => {
  try {
    localStorage.setItem(ACTIVE_SPACE_KEY, spaceId);
  } catch (error) {
    console.error("Error saving active space to localStorage:", error);
  }
};

export const createDefaultSpace = (): Space => {
  return {
    id: DEFAULT_SPACE_ID,
    name: "Personal",
    createdAt: new Date().toISOString(),
  };
};

export const createSpace = (name: string): Space => {
  return {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
  };
};

export const getDefaultSpaceId = (): string => {
  return DEFAULT_SPACE_ID;
};
