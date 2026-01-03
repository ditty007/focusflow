import { useDroppable } from "@dnd-kit/core";
import type { Task, BacklogType } from "../types";
import TaskCard from "./TaskCard";
import clsx from "clsx";
import { Plus } from "lucide-react";

interface BacklogProps {
  getTasksByBacklog: (backlogType: BacklogType) => Task[];
  onBacklogClick: (backlogType: BacklogType) => void;
  onTaskClick: (task: Task) => void;
  toggleTaskComplete: (id: string) => void;
}

const BacklogSection = ({
  title,
  backlogType,
  tasks,
  onAddClick,
  onTaskClick,
  onToggleComplete,
}: {
  title: string;
  backlogType: BacklogType;
  tasks: Task[];
  onAddClick: () => void;
  onTaskClick: (task: Task) => void;
  onToggleComplete: (id: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `backlog-${backlogType}`,
  });

  return (
    <div className="flex-1 flex flex-col border-r border-gray-200 last:border-r-0">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{tasks.length} tasks</p>
      </div>

      <div
        ref={setNodeRef}
        className={clsx(
          "flex-1 p-3 space-y-2 overflow-y-auto",
          isOver && "bg-blue-50"
        )}
      >
        <div className="flex flex-wrap gap-2">
          {tasks.map((task) => (
            <div key={task.id} className="w-64">
              <TaskCard
                task={task}
                onClick={onTaskClick}
                onToggleComplete={onToggleComplete}
              />
            </div>
          ))}

          <button
            onClick={onAddClick}
            className="w-64 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-500 hover:text-blue-600"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add task</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Backlog = ({
  getTasksByBacklog,
  onBacklogClick,
  onTaskClick,
  toggleTaskComplete,
}: BacklogProps) => {
  const incompleteTasks = getTasksByBacklog("incomplete");
  const monitorTasks = getTasksByBacklog("monitor");

  return (
    <div className="h-48 bg-white border-t border-gray-200 flex">
      <BacklogSection
        title="From Last Week(s)"
        backlogType="incomplete"
        tasks={incompleteTasks}
        onAddClick={() => onBacklogClick("incomplete")}
        onTaskClick={onTaskClick}
        onToggleComplete={toggleTaskComplete}
      />

      <BacklogSection
        title="Monitor"
        backlogType="monitor"
        tasks={monitorTasks}
        onAddClick={() => onBacklogClick("monitor")}
        onTaskClick={onTaskClick}
        onToggleComplete={toggleTaskComplete}
      />
    </div>
  );
};

export default Backlog;
