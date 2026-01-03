import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Task, TaskCategory } from "../types";
import { calculateDaysToComplete, formatDate } from "../utils/dates";

type SortField = "title" | "completedAt" | "daysToComplete" | "category";
type SortDirection = "asc" | "desc";

const categoryLabels: Record<TaskCategory, string> = {
  "urgent-important": "Urgent & Important",
  "important": "Important",
  "urgent": "Urgent",
  "neither": "Neither",
};

const categoryColors: Record<TaskCategory, string> = {
  "urgent-important": "bg-red-100 text-red-800",
  "important": "bg-blue-100 text-blue-800",
  "urgent": "bg-yellow-100 text-yellow-800",
  "neither": "bg-gray-100 text-gray-800",
};

interface CompletedTasksHistoryProps {
  tasks: Task[];
}

const CompletedTasksHistory = ({ tasks }: CompletedTasksHistoryProps) => {
  const [sortField, setSortField] = useState<SortField>("completedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const completedTasks = useMemo(() => {
    return tasks.filter((task) => task.completed && task.completedAt);
  }, [tasks]);

  const stats = useMemo(() => {
    const urgentImportantTasks = completedTasks.filter((t) => t.category === "urgent-important");
    const importantTasks = completedTasks.filter((t) => t.category === "important");
    const urgentTasks = completedTasks.filter((t) => t.category === "urgent");

    const calculateAverage = (taskList: Task[]) => {
      if (taskList.length === 0) return 0;
      const totalDays = taskList.reduce((sum, task) => {
        return sum + calculateDaysToComplete(task.createdAt, task.completedAt!);
      }, 0);
      return totalDays / taskList.length;
    };

    return {
      urgentImportant: {
        count: urgentImportantTasks.length,
        avgDays: calculateAverage(urgentImportantTasks),
      },
      important: {
        count: importantTasks.length,
        avgDays: calculateAverage(importantTasks),
      },
      urgent: {
        count: urgentTasks.length,
        avgDays: calculateAverage(urgentTasks),
      },
    };
  }, [completedTasks]);

  const sortedTasks = useMemo(() => {
    const sorted = [...completedTasks].sort((a, b) => {
      let comparison = 0;

      if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === "completedAt") {
        const dateA = new Date(a.completedAt!).getTime();
        const dateB = new Date(b.completedAt!).getTime();
        comparison = dateA - dateB;
      } else if (sortField === "daysToComplete") {
        const daysA = calculateDaysToComplete(a.createdAt, a.completedAt!);
        const daysB = calculateDaysToComplete(b.createdAt, b.completedAt!);
        comparison = daysA - daysB;
      } else if (sortField === "category") {
        comparison = a.category.localeCompare(b.category);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [completedTasks, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (completedTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Tasks</h2>
        <p className="text-gray-500 text-center py-8">
          No completed tasks yet. Check off tasks to see them here!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Completed Tasks ({completedTasks.length})
        </h2>

        {/* Statistics Section */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm font-medium text-red-900 mb-1">Urgent & Important</div>
            <div className="text-2xl font-bold text-red-700">
              {stats.urgentImportant.avgDays.toFixed(1)}
              <span className="text-sm font-normal text-red-600 ml-1">days avg</span>
            </div>
            <div className="text-xs text-red-600 mt-1">{stats.urgentImportant.count} tasks</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-900 mb-1">Important</div>
            <div className="text-2xl font-bold text-blue-700">
              {stats.important.avgDays.toFixed(1)}
              <span className="text-sm font-normal text-blue-600 ml-1">days avg</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">{stats.important.count} tasks</div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm font-medium text-yellow-900 mb-1">Urgent</div>
            <div className="text-2xl font-bold text-yellow-700">
              {stats.urgent.avgDays.toFixed(1)}
              <span className="text-sm font-normal text-yellow-600 ml-1">days avg</span>
            </div>
            <div className="text-xs text-yellow-600 mt-1">{stats.urgent.count} tasks</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-2">
                  Task
                  <SortIcon field="title" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center gap-2">
                  Category
                  <SortIcon field="category" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("completedAt")}
              >
                <div className="flex items-center gap-2">
                  Completed Date
                  <SortIcon field="completedAt" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("daysToComplete")}
              >
                <div className="flex items-center gap-2">
                  Days to Complete
                  <SortIcon field="daysToComplete" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTasks.map((task) => {
              const daysToComplete = calculateDaysToComplete(
                task.createdAt,
                task.completedAt!
              );

              return (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {task.title}
                    </div>
                    {task.notes && (
                      <div className="text-sm text-gray-500 mt-1 max-w-md truncate">
                        {task.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[task.category]}`}>
                      {categoryLabels[task.category]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(task.completedAt!)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {daysToComplete} {daysToComplete === 1 ? "day" : "days"}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompletedTasksHistory;
