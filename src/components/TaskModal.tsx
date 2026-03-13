import { useState, useEffect } from "react";
import type { Task, TaskCategory, BacklogType, Subtask, Space } from "../types";
import { X, Plus, Trash2, Check } from "lucide-react";
import { generateId } from "../utils/storage";
import { validateTaskTitle, validateNotes, validateStakeholder } from "../utils/security";
import clsx from "clsx";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  onDelete?: () => void;
  initialData?: Task;
  initialDay?: string;
  initialBacklog?: BacklogType;
  spaces?: Space[];
  currentSpaceId?: string;
  onMoveToSpace?: (spaceId: string) => void;
}

const TIME_OPTIONS = [
  { value: 0.25, label: "<30m" },
  { value: 0.5, label: "30m" },
  { value: 1, label: "1h" },
  { value: 1.5, label: "1.5h" },
  { value: 2, label: "2h" },
  { value: 2.5, label: "2.5h" },
  { value: 3, label: "3h" },
  { value: 3.5, label: "3.5h" },
  { value: 4, label: "4h" },
  { value: 4.5, label: "4.5h" },
  { value: 5, label: "5h" },
];

const TaskModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  initialDay,
  initialBacklog,
  spaces,
  currentSpaceId,
  onMoveToSpace,
}: TaskModalProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [category, setCategory] = useState<TaskCategory>(initialData?.category || "neither");
  const [timeEstimate, setTimeEstimate] = useState(initialData?.timeEstimate || 1);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [stakeholder, setStakeholder] = useState(initialData?.stakeholder || "");
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialData?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setTimeEstimate(initialData.timeEstimate);
      setNotes(initialData.notes || "");
      setStakeholder(initialData.stakeholder || "");
      setSubtasks(initialData.subtasks);
    } else {
      setTitle("");
      setCategory("neither");
      setTimeEstimate(1);
      setNotes("");
      setStakeholder("");
      setSubtasks([]);
    }
  }, [initialData]);

  const handleSave = () => {
    if (!title.trim()) return;

    // Validate and sanitize inputs
    const titleValidation = validateTaskTitle(title);
    if (!titleValidation.valid) {
      alert(titleValidation.error);
      return;
    }

    const notesValidation = notes ? validateNotes(notes) : { valid: true, sanitized: "" };
    if (!notesValidation.valid) {
      alert(notesValidation.error);
      return;
    }

    const stakeholderValidation = stakeholder ? validateStakeholder(stakeholder) : { valid: true, sanitized: "" };
    if (!stakeholderValidation.valid) {
      alert(stakeholderValidation.error);
      return;
    }

    const taskData: Partial<Task> = {
      title: titleValidation.sanitized,
      category,
      timeEstimate,
      notes: notesValidation.sanitized || undefined,
      stakeholder: stakeholderValidation.sanitized || undefined,
      subtasks,
      scheduledDay: initialDay,
      backlogType: initialBacklog,
    };

    onSave(taskData);
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    // Validate and sanitize subtask title
    const validation = validateTaskTitle(newSubtaskTitle);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const newSubtask: Subtask = {
      id: generateId(),
      title: validation.sanitized,
      completed: false,
      timeEstimate: 0.5,
    };

    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle("");
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const updateSubtaskTime = (id: string, time: number) => {
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, timeEstimate: time } : st))
    );
  };

  const toggleSubtaskComplete = (id: string) => {
    setSubtasks(
      subtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? "Edit Task" : "New Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Task title"
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category (Eisenhower Matrix)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCategory("urgent-important")}
                className={clsx(
                  "p-3 border-2 rounded-lg text-left transition",
                  category === "urgent-important"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 hover:border-red-300"
                )}
              >
                <div className="font-bold text-sm">Urgent & Important</div>
                <div className="text-xs text-gray-600">Do first</div>
              </button>

              <button
                onClick={() => setCategory("important")}
                className={clsx(
                  "p-3 border-2 rounded-lg text-left transition",
                  category === "important"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-300"
                )}
              >
                <div className="font-medium text-sm">Important</div>
                <div className="text-xs text-gray-600">Schedule</div>
              </button>

              <button
                onClick={() => setCategory("urgent")}
                className={clsx(
                  "p-3 border-2 rounded-lg text-left transition",
                  category === "urgent"
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-gray-300 hover:border-yellow-300"
                )}
              >
                <div className="font-medium text-sm">Urgent</div>
                <div className="text-xs text-gray-600">Delegate</div>
              </button>

              <button
                onClick={() => setCategory("neither")}
                className={clsx(
                  "p-3 border-2 rounded-lg text-left transition",
                  category === "neither"
                    ? "border-gray-500 bg-gray-50"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <div className="font-medium text-sm">Neither</div>
                <div className="text-xs text-gray-600">Eliminate</div>
              </button>
            </div>
          </div>

          {/* Time Estimate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Estimate
            </label>
            <select
              value={timeEstimate}
              onChange={(e) => setTimeEstimate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stakeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stakeholder
            </label>
            <input
              type="text"
              value={stakeholder}
              onChange={(e) => setStakeholder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Who's involved?"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Additional details..."
            />
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtasks
            </label>

            <div className="space-y-2 mb-3">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg"
                >
                  <button
                    onClick={() => toggleSubtaskComplete(subtask.id)}
                    className={clsx(
                      "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition",
                      subtask.completed
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300"
                    )}
                  >
                    {subtask.completed && <Check className="w-3 h-3 text-white" />}
                  </button>

                  <span
                    className={clsx(
                      "flex-1 text-sm",
                      subtask.completed && "line-through text-gray-500"
                    )}
                  >
                    {subtask.title}
                  </span>

                  <select
                    value={subtask.timeEstimate}
                    onChange={(e) =>
                      updateSubtaskTime(subtask.id, Number(e.target.value))
                    }
                    className="text-xs px-2 py-1 border border-gray-300 rounded"
                  >
                    {TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => removeSubtask(subtask.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSubtask()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Add subtask..."
              />
              <button
                onClick={addSubtask}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Delete Task
              </button>
            )}

            {/* Move to Space dropdown */}
            {spaces && spaces.length > 1 && initialData && onMoveToSpace && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Move to:</span>
                <select
                  value={currentSpaceId}
                  onChange={(e) => {
                    if (e.target.value !== currentSpaceId) {
                      onMoveToSpace(e.target.value);
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initialData ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
