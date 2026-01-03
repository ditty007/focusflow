import { useState, useEffect } from "react";
import type { Task, TaskCategory, BacklogType } from "../types";
import { loadTasks, saveTasks, generateId, exportTasks, importTasks } from "../utils/storage";
import { migrateIncompleteTasks, migrateCompletedTasks, migrateTasksToSpaces } from "../utils/migration";

export const useTasks = (activeSpaceId: string) => {
  const [allTasks, setAllTasks] = useState<Task[]>(() => {
    const loaded = loadTasks();
    const withSpaces = migrateTasksToSpaces(loaded);
    const withCompletedDates = migrateCompletedTasks(withSpaces);
    return migrateIncompleteTasks(withCompletedDates);
  });

  // Filter tasks by active space
  const tasks = allTasks.filter((task) => task.spaceId === activeSpaceId);

  useEffect(() => {
    saveTasks(allTasks);
  }, [allTasks]);

  const addTask = (
    title: string,
    category: TaskCategory,
    timeEstimate: number,
    scheduledDay?: string,
    backlogType?: BacklogType
  ): Task => {
    const newTask: Task = {
      id: generateId(),
      title,
      category,
      timeEstimate,
      subtasks: [],
      completed: false,
      scheduledDay,
      backlogType,
      createdAt: new Date().toISOString(),
      order: allTasks.length,
      spaceId: activeSpaceId,
    };

    setAllTasks((prev) => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>): void => {
    setAllTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
  };

  const deleteTask = (id: string): void => {
    setAllTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const moveTask = (
    taskId: string,
    scheduledDay?: string,
    backlogType?: BacklogType
  ): void => {
    setAllTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            scheduledDay,
            backlogType: scheduledDay ? undefined : backlogType,
          };
        }
        return task;
      })
    );
  };

  const reorderTasks = (taskIds: string[]): void => {
    setAllTasks((prev) => {
      const taskMap = new Map(prev.map((task) => [task.id, task]));
      const reordered = taskIds
        .map((id) => taskMap.get(id))
        .filter((task): task is Task => task !== undefined);

      // Keep tasks that weren't in the reorder list
      const remaining = prev.filter((task) => !taskIds.includes(task.id));

      return [...reordered, ...remaining].map((task, index) => ({
        ...task,
        order: index,
      }));
    });
  };

  const toggleTaskComplete = (id: string): void => {
    setAllTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const isNowCompleted = !task.completed;
          const now = new Date().toISOString();
          const completionDate = now.split('T')[0]; // Get YYYY-MM-DD format

          // If completing a task that's in a backlog (no scheduledDay),
          // move it to today's date
          if (isNowCompleted && !task.scheduledDay) {
            return {
              ...task,
              completed: true,
              completedAt: now,
              scheduledDay: completionDate,
              backlogType: undefined, // Remove from backlog
            };
          }

          // If completing a task already scheduled, keep it on that day
          // If uncompleting, just toggle the completed status
          return {
            ...task,
            completed: isNowCompleted,
            completedAt: isNowCompleted ? now : undefined,
          };
        }
        return task;
      })
    );
  };

  const toggleSubtaskComplete = (taskId: string, subtaskId: string): void => {
    setAllTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === subtaskId
                ? { ...subtask, completed: !subtask.completed }
                : subtask
            ),
          };
        }
        return task;
      })
    );
  };

  const getTasksByDay = (date: string): Task[] => {
    return tasks
      .filter((task) => task.scheduledDay === date)
      .sort((a, b) => a.order - b.order);
  };

  const getTasksByBacklog = (backlogType: BacklogType): Task[] => {
    return tasks
      .filter((task) => task.backlogType === backlogType && !task.completed)
      .sort((a, b) => a.order - b.order);
  };

  const handleExportTasks = (): void => {
    exportTasks(tasks);
  };

  const handleImportTasks = async (file: File): Promise<void> => {
    try {
      const importedTasks = await importTasks(file);
      // Add imported tasks to current space
      const tasksWithSpaceId = importedTasks.map((task) => ({
        ...task,
        spaceId: activeSpaceId,
      }));
      setAllTasks((prev) => [...prev, ...tasksWithSpaceId]);
    } catch (error) {
      console.error("Failed to import tasks:", error);
      throw error;
    }
  };

  const moveTaskToSpace = (taskId: string, newSpaceId: string): void => {
    setAllTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, spaceId: newSpaceId } : task
      )
    );
  };

  return {
    tasks, // Filtered by active space
    allTasks, // All tasks across all spaces
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    moveTaskToSpace,
    reorderTasks,
    toggleTaskComplete,
    toggleSubtaskComplete,
    getTasksByDay,
    getTasksByBacklog,
    exportTasks: handleExportTasks,
    importTasks: handleImportTasks,
  };
};
