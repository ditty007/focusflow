import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { Analytics } from "@vercel/analytics/react";
import { useTasks } from "./hooks/useTasks";
import { useSpaces } from "./hooks/useSpaces";
import { getCurrentWeekStart, getNextWeekStartFromDate, getPreviousWeekStart, formatWeekLabel, getWeekDays } from "./utils/dates";
import { canScheduleTask } from "./utils/scheduling";
import { exportTasks as exportTasksUtil } from "./utils/storage";
import Header from "./components/Header";
import WeekView from "./components/WeekView";
import Sidebar from "./components/Sidebar";
import Backlog from "./components/Backlog";
import TaskModal from "./components/TaskModal";
import SettingsModal from "./components/SettingsModal";
import CompletedTasksHistory from "./components/CompletedTasksHistory";
import type { Task, BacklogType } from "./types";

function App() {
  const [currentWeek, setCurrentWeek] = useState<Date>(getCurrentWeekStart());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalInitialDay, setModalInitialDay] = useState<string | undefined>();
  const [modalInitialBacklog, setModalInitialBacklog] = useState<BacklogType | undefined>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  const {
    spaces,
    activeSpaceId,
    addSpace,
    updateSpace,
    deleteSpace,
    setActiveSpaceId,
  } = useSpaces();

  const {
    tasks,
    allTasks,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    toggleTaskComplete,
    getTasksByDay,
    getTasksByBacklog,
    exportTasks,
    importTasks,
  } = useTasks(activeSpaceId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px threshold per PRD
      },
    })
  );

  const weekDays = getWeekDays(currentWeek);

  const handlePreviousWeek = () => {
    setCurrentWeek(getPreviousWeekStart(currentWeek));
  };

  const handleNextWeek = () => {
    setCurrentWeek(getNextWeekStartFromDate(currentWeek));
  };

  const handleToday = () => {
    setCurrentWeek(getCurrentWeekStart());
  };

  const handleDayClick = (date: string) => {
    setModalInitialDay(date);
    setModalInitialBacklog(undefined);
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleBacklogClick = (backlogType: BacklogType) => {
    setModalInitialDay(undefined);
    setModalInitialBacklog(backlogType);
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setModalInitialDay(task.scheduledDay);
    setModalInitialBacklog(task.backlogType);
    setIsModalOpen(true);
  };

  const handleExportSpaceTasks = (spaceId: string) => {
    // Get all tasks for the space being deleted
    const spaceTasks = allTasks.filter((t) => t.spaceId === spaceId);
    exportTasksUtil(spaceTasks);
  };

  const handleDragStart = (_event: DragStartEvent) => {
    setValidationError(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const overId = over.id as string;

    // Handle dropping on a day
    if (overId.startsWith("day-")) {
      const date = overId.replace("day-", "");

      // Validate scheduling
      const validation = canScheduleTask(tasks, task, date);
      if (!validation.valid) {
        setValidationError(validation.errors[0].message);
        setTimeout(() => setValidationError(null), 5000);
        return;
      }

      moveTask(taskId, date, undefined);
    }

    // Handle dropping on backlog
    if (overId.startsWith("backlog-")) {
      const backlogType = overId.replace("backlog-", "") as BacklogType;
      moveTask(taskId, undefined, backlogType);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-50">
        <Header
          weekLabel={formatWeekLabel(currentWeek)}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
          onExport={exportTasks}
          onImport={importTasks}
          onOpenSettings={() => setIsSettingsOpen(true)}
          spaces={spaces}
          activeSpaceId={activeSpaceId}
          onSpaceChange={setActiveSpaceId}
          onAddSpace={addSpace}
          onRenameSpace={(id, name) => updateSpace(id, { name })}
          onDeleteSpace={deleteSpace}
          onExportBeforeDelete={handleExportSpaceTasks}
          allTasks={allTasks}
        />

        {validationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-2 rounded">
            {validationError}
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {!showCompletedTasks ? (
              <>
                <WeekView
                  weekDays={weekDays}
                  getTasksByDay={getTasksByDay}
                  onDayClick={handleDayClick}
                  onTaskClick={handleTaskClick}
                  toggleTaskComplete={toggleTaskComplete}
                />

                <Backlog
                  getTasksByBacklog={getTasksByBacklog}
                  onBacklogClick={handleBacklogClick}
                  onTaskClick={handleTaskClick}
                  toggleTaskComplete={toggleTaskComplete}
                />
              </>
            ) : (
              <div className="flex-1 overflow-auto p-6">
                <CompletedTasksHistory tasks={tasks} />
              </div>
            )}

            <div className="bg-white border-t border-gray-200 px-6 py-3 flex justify-center">
              <button
                onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition"
              >
                {showCompletedTasks ? "← Back to Tasks" : "View Completed Tasks →"}
              </button>
            </div>
          </div>

          <Sidebar
            getTasksByBacklog={getTasksByBacklog}
            onBacklogClick={handleBacklogClick}
            onTaskClick={handleTaskClick}
            toggleTaskComplete={toggleTaskComplete}
          />
        </div>

        {isModalOpen && (
          <TaskModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={(taskData) => {
              if (editingTask) {
                updateTask(editingTask.id, taskData);
              } else {
                addTask(
                  taskData.title!,
                  taskData.category!,
                  taskData.timeEstimate!,
                  taskData.scheduledDay,
                  taskData.backlogType
                );
              }
              setIsModalOpen(false);
            }}
            onDelete={
              editingTask
                ? () => {
                    deleteTask(editingTask.id);
                    setIsModalOpen(false);
                  }
                : undefined
            }
            initialData={editingTask}
            initialDay={modalInitialDay}
            initialBacklog={modalInitialBacklog}
            spaces={spaces}
            currentSpaceId={activeSpaceId}
            onMoveToSpace={
              editingTask
                ? (newSpaceId: string) => {
                    updateTask(editingTask.id, { spaceId: newSpaceId });
                  }
                : undefined
            }
          />
        )}

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={() => {
            // Settings are automatically saved by the modal
            // We might want to trigger a re-render or show a success message
          }}
        />
      </div>
      <Analytics />
    </DndContext>
  );
}

export default App;
