import { useDraggable } from "@dnd-kit/core";
import type { Task } from "../types";
import { calculateTaskTime } from "../utils/scheduling";
import { Check, Clock } from "lucide-react";
import clsx from "clsx";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onToggleComplete: (id: string) => void;
}

const getCategoryLabel = (category: Task["category"]): string => {
  switch (category) {
    case "urgent-important":
      return "U+I";
    case "important":
      return "I";
    case "urgent":
      return "U";
    default:
      return "";
  }
};

const getCategoryStyles = (category: Task["category"]): string => {
  switch (category) {
    case "urgent-important":
      return "bg-red-100 text-red-800 border-red-300";
    case "important":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "urgent":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const TaskCard = ({ task, onClick, onToggleComplete }: TaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const totalTime = calculateTaskTime(task);
  const categoryLabel = getCategoryLabel(task.category);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx(
        "bg-white border rounded-lg p-3 cursor-move shadow-sm hover:shadow-md transition-shadow",
        isDragging ? "opacity-50" : "",
        task.completed ? "opacity-60" : ""
      )}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task.id);
          }}
          className={clsx(
            "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition mt-0.5",
            task.completed
              ? "bg-green-500 border-green-500"
              : "border-gray-300 hover:border-green-500"
          )}
        >
          {task.completed && <Check className="w-3 h-3 text-white" />}
        </button>

        <div
          className="flex-1 min-w-0"
          onClick={() => onClick(task)}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className={clsx(
                "text-sm font-medium text-gray-900 break-words",
                task.category === "urgent-important" && "font-bold",
                task.completed && "line-through"
              )}
            >
              {task.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {categoryLabel && (
              <span
                className={clsx(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                  getCategoryStyles(task.category)
                )}
              >
                {categoryLabel}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              {totalTime < 0.5 ? "<30m" : `${totalTime}h`}
            </span>

            {task.stakeholder && (
              <span className="text-xs text-gray-500 truncate">
                {task.stakeholder}
              </span>
            )}
          </div>

          {task.subtasks.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length} subtasks
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
