import type { Task } from "../types";
import { validateImportedTasks, validateFileSize, validateFileType, sanitizeInput } from "./security";

const STORAGE_KEY = import.meta.env.VITE_STORAGE_KEY || "focusflow-tasks";

export const loadTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading tasks from localStorage:", error);
  }
  return [];
};

export const saveTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks to localStorage:", error);
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const exportTasks = (tasks: Task[]): void => {
  try {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `focusflow-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting tasks:", error);
    throw new Error("Failed to export tasks");
  }
};

export const importTasks = (file: File): Promise<Task[]> => {
  return new Promise((resolve, reject) => {
    // Validate file type
    const typeValidation = validateFileType(file);
    if (!typeValidation.valid) {
      reject(new Error(typeValidation.error));
      return;
    }

    // Validate file size
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      reject(new Error(sizeValidation.error));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        // Validate content length
        if (content.length > 50 * 1024 * 1024) { // 50MB of text
          reject(new Error("File content too large"));
          return;
        }

        const data = JSON.parse(content);

        // Validate data structure
        const validation = validateImportedTasks(data);
        if (!validation.valid) {
          reject(new Error(validation.error));
          return;
        }

        // Sanitize all string fields
        const sanitizedTasks = (data as Task[]).map((task) => ({
          ...task,
          title: sanitizeInput(task.title),
          notes: task.notes ? sanitizeInput(task.notes) : undefined,
          stakeholder: task.stakeholder ? sanitizeInput(task.stakeholder) : undefined,
          subtasks: task.subtasks?.map((st) => ({
            ...st,
            title: sanitizeInput(st.title),
          })) || [],
        }));

        resolve(sanitizedTasks);
      } catch (error) {
        console.error("Error parsing imported file:", error);
        if (error instanceof SyntaxError) {
          reject(new Error("Invalid JSON format"));
        } else {
          reject(new Error("Failed to parse file"));
        }
      }
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsText(file);
  });
};
