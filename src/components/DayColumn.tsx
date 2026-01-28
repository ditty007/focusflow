import { useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";
import type { Task } from "../types";
import TaskCard from "./TaskCard";
import clsx from "clsx";
import { calculateTaskTime, getDailyLimits } from "../utils/scheduling";
import { Plus } from "lucide-react";

interface DayColumnProps {
  date: Date;
  tasks: Task[];
  onDayClick: (date: string) => void;
  onTaskClick: (task: Task) => void;
  onToggleComplete: (id: string) => void;
}

const DayColumn = ({ date, tasks, onDayClick, onTaskClick, onToggleComplete }: DayColumnProps) => {
  const dateString = format(date, "yyyy-MM-dd");
  const dayName = format(date, "EEE");
  const dayNumber = format(date, "d");
  const isToday = format(new Date(), "yyyy-MM-dd") === dateString;

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateString}`,
  });

  const totalHours = tasks.reduce((sum, task) => sum + calculateTaskTime(task), 0);
  const dailyLimits = getDailyLimits(dateString);

  return (
    <div className="flex-1 flex flex-col border-r border-gray-200 last:border-r-0 min-w-0">
      <div
        className={clsx(
          "px-3 py-2 border-b border-gray-200 bg-white",
          isToday && "bg-blue-50"
        )}
      >
        <div className="text-sm font-semibold text-gray-900">{dayName}</div>
        <div
          className={clsx(
            "text-xs text-gray-600",
            isToday && "text-blue-700 font-medium"
          )}
        >
          {dayNumber}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {totalHours}h / {dailyLimits.totalHours}h
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={clsx(
          "flex-1 p-2 space-y-2 overflow-y-auto",
          isOver && "bg-blue-50"
        )}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={onTaskClick}
            onToggleComplete={onToggleComplete}
          />
        ))}

        <button
          onClick={() => onDayClick(dateString)}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-500 hover:text-blue-600"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add task</span>
        </button>
      </div>
    </div>
  );
};

export default DayColumn;
