import { useState, useEffect } from "react";
import type { Space } from "../types";
import {
  loadSpaces,
  saveSpaces,
  loadActiveSpaceId,
  saveActiveSpaceId,
  createSpace,
  getDefaultSpaceId,
} from "../utils/spaces";

export const useSpaces = () => {
  const [spaces, setSpaces] = useState<Space[]>(() => loadSpaces());
  const [activeSpaceId, setActiveSpaceIdState] = useState<string>(() => {
    const loadedId = loadActiveSpaceId();
    // Ensure the loaded active space exists in spaces
    const spaceExists = spaces.some((s) => s.id === loadedId);
    return spaceExists ? loadedId : getDefaultSpaceId();
  });

  useEffect(() => {
    saveSpaces(spaces);
  }, [spaces]);

  useEffect(() => {
    saveActiveSpaceId(activeSpaceId);
  }, [activeSpaceId]);

  const addSpace = (name: string): Space => {
    const newSpace = createSpace(name);
    setSpaces((prev) => [...prev, newSpace]);
    return newSpace;
  };

  const updateSpace = (id: string, updates: Partial<Space>): void => {
    setSpaces((prev) =>
      prev.map((space) => (space.id === id ? { ...space, ...updates } : space))
    );
  };

  const deleteSpace = (id: string): void => {
    // Don't allow deleting the last space
    if (spaces.length <= 1) {
      console.warn("Cannot delete the last space");
      return;
    }

    setSpaces((prev) => prev.filter((space) => space.id !== id));

    // If deleting active space, switch to first remaining space
    if (activeSpaceId === id) {
      const remainingSpaces = spaces.filter((s) => s.id !== id);
      if (remainingSpaces.length > 0) {
        setActiveSpaceIdState(remainingSpaces[0].id);
      }
    }
  };

  const setActiveSpaceId = (spaceId: string): void => {
    const spaceExists = spaces.some((s) => s.id === spaceId);
    if (spaceExists) {
      setActiveSpaceIdState(spaceId);
    }
  };

  const getActiveSpace = (): Space | undefined => {
    return spaces.find((s) => s.id === activeSpaceId);
  };

  return {
    spaces,
    activeSpaceId,
    activeSpace: getActiveSpace(),
    addSpace,
    updateSpace,
    deleteSpace,
    setActiveSpaceId,
  };
};
