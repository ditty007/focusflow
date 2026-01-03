import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Edit2, Trash2, Download, X } from "lucide-react";
import type { Space, Task } from "../types";
import { validateSpaceName } from "../utils/security";

interface SpaceSwitcherProps {
  spaces: Space[];
  activeSpaceId: string;
  onSpaceChange: (spaceId: string) => void;
  onAddSpace: (name: string) => void;
  onRenameSpace: (id: string, newName: string) => void;
  onDeleteSpace: (id: string) => void;
  onExportBeforeDelete: (spaceId: string) => void;
  tasks: Task[]; // All tasks to show task count per space
}

const SpaceSwitcher = ({
  spaces,
  activeSpaceId,
  onSpaceChange,
  onAddSpace,
  onRenameSpace,
  onDeleteSpace,
  onExportBeforeDelete,
  tasks,
}: SpaceSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingSpaceId, setDeletingSpaceId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setEditingSpaceId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTaskCount = (spaceId: string) => {
    return tasks.filter((t) => t.spaceId === spaceId).length;
  };

  const handleCreateSpace = () => {
    if (!newSpaceName.trim()) return;

    // Validate and sanitize space name
    const validation = validateSpaceName(newSpaceName);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    onAddSpace(validation.sanitized);
    setNewSpaceName("");
    setIsCreating(false);
  };

  const handleRenameSpace = (spaceId: string) => {
    if (!editingName.trim()) return;

    // Validate and sanitize space name
    const validation = validateSpaceName(editingName);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    onRenameSpace(spaceId, validation.sanitized);
    setEditingSpaceId(null);
    setEditingName("");
  };

  const handleDeleteSpace = (spaceId: string) => {
    const taskCount = getTaskCount(spaceId);
    if (taskCount > 0) {
      setDeletingSpaceId(spaceId);
    } else {
      onDeleteSpace(spaceId);
    }
  };

  const confirmDelete = (spaceId: string, shouldExport: boolean) => {
    if (shouldExport) {
      onExportBeforeDelete(spaceId);
    }
    onDeleteSpace(spaceId);
    setDeletingSpaceId(null);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Space Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        <span className="font-medium text-gray-700">{activeSpace?.name || "Personal"}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2 max-h-96 overflow-y-auto">
            {/* Space List */}
            {spaces.map((space) => (
              <div key={space.id} className="group">
                {editingSpaceId === space.id ? (
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSpace(space.id);
                        if (e.key === "Escape") {
                          setEditingSpaceId(null);
                          setEditingName("");
                        }
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameSpace(space.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-100 ${
                      space.id === activeSpaceId ? "bg-blue-50" : ""
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSpaceChange(space.id);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left text-sm"
                    >
                      <div className="font-medium text-gray-900">{space.name}</div>
                      <div className="text-xs text-gray-500">{getTaskCount(space.id)} tasks</div>
                    </button>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => {
                          setEditingSpaceId(space.id);
                          setEditingName(space.name);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Rename space"
                      >
                        <Edit2 className="w-3 h-3 text-gray-600" />
                      </button>
                      {spaces.length > 1 && (
                        <button
                          onClick={() => handleDeleteSpace(space.id)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Delete space"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Create New Space */}
            {isCreating ? (
              <div className="flex items-center gap-1 px-2 py-1.5 mt-1 border-t border-gray-200 pt-2">
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateSpace();
                    if (e.key === "Escape") {
                      setIsCreating(false);
                      setNewSpaceName("");
                    }
                  }}
                  placeholder="Space name..."
                  className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleCreateSpace}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 mt-1 border-t border-gray-200 pt-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <Plus className="w-4 h-4" />
                New Space
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSpaceId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Space?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This space contains {getTaskCount(deletingSpaceId)} tasks. Do you want to export them before deleting?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => confirmDelete(deletingSpaceId, true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="w-4 h-4" />
                Export & Delete
              </button>
              <button
                onClick={() => confirmDelete(deletingSpaceId, false)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete Without Export
              </button>
              <button
                onClick={() => setDeletingSpaceId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceSwitcher;
