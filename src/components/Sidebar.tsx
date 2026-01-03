import { useDroppable } from "@dnd-kit/core";
import type { Task, BacklogType } from "../types";
import TaskCard from "./TaskCard";
import clsx from "clsx";
import { Plus } from "lucide-react";

interface SidebarProps {
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
    <div className="flex flex-col h-1/2 border-b border-gray-200 last:border-b-0">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
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
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={onTaskClick}
            onToggleComplete={onToggleComplete}
          />
        ))}

        <button
          onClick={onAddClick}
          className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-500 hover:text-blue-600"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs">Add task</span>
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({
  getTasksByBacklog,
  onBacklogClick,
  onTaskClick,
  toggleTaskComplete,
}: SidebarProps) => {
  const nextWeekTasks = getTasksByBacklog("next-week");
  const nextMonthTasks = getTasksByBacklog("next-month");

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <BacklogSection
        title="Next Week"
        backlogType="next-week"
        tasks={nextWeekTasks}
        onAddClick={() => onBacklogClick("next-week")}
        onTaskClick={onTaskClick}
        onToggleComplete={toggleTaskComplete}
      />

      <BacklogSection
        title="Next Month"
        backlogType="next-month"
        tasks={nextMonthTasks}
        onAddClick={() => onBacklogClick("next-month")}
        onTaskClick={onTaskClick}
        onToggleComplete={toggleTaskComplete}
      />
    </div>
  );
};

export default Sidebar;
