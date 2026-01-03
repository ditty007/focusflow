import { format } from "date-fns";
import type { Task } from "../types";
import DayColumn from "./DayColumn";

interface WeekViewProps {
  weekDays: Date[];
  getTasksByDay: (date: string) => Task[];
  onDayClick: (date: string) => void;
  onTaskClick: (task: Task) => void;
  toggleTaskComplete: (id: string) => void;
}

const WeekView = ({
  weekDays,
  getTasksByDay,
  onDayClick,
  onTaskClick,
  toggleTaskComplete,
}: WeekViewProps) => {
  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50">
      {weekDays.map((day) => {
        const dateString = format(day, "yyyy-MM-dd");
        const tasks = getTasksByDay(dateString);

        return (
          <DayColumn
            key={dateString}
            date={day}
            tasks={tasks}
            onDayClick={onDayClick}
            onTaskClick={onTaskClick}
            onToggleComplete={toggleTaskComplete}
          />
        );
      })}
    </div>
  );
};

export default WeekView;
