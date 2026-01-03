import { ChevronLeft, ChevronRight, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import SpaceSwitcher from "./SpaceSwitcher";
import type { Space, Task } from "../types";

interface HeaderProps {
  weekLabel: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
  // Space switcher props
  spaces: Space[];
  activeSpaceId: string;
  onSpaceChange: (spaceId: string) => void;
  onAddSpace: (name: string) => void;
  onRenameSpace: (id: string, newName: string) => void;
  onDeleteSpace: (id: string) => void;
  onExportBeforeDelete: (spaceId: string) => void;
  allTasks: Task[];
}

const Header = ({
  weekLabel,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onExport,
  onImport,
  spaces,
  activeSpaceId,
  onSpaceChange,
  onAddSpace,
  onRenameSpace,
  onDeleteSpace,
  onExportBeforeDelete,
  allTasks,
}: HeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      await onImport(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setImportError("Failed to import tasks. Please check the file format.");
      console.error(error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">FocusFlow</h1>

          {/* Space Switcher */}
          <SpaceSwitcher
            spaces={spaces}
            activeSpaceId={activeSpaceId}
            onSpaceChange={onSpaceChange}
            onAddSpace={onAddSpace}
            onRenameSpace={onRenameSpace}
            onDeleteSpace={onDeleteSpace}
            onExportBeforeDelete={onExportBeforeDelete}
            tasks={allTasks}
          />

          <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
              title="Export tasks as JSON"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
              title="Import tasks from JSON"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded transition"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-lg font-medium text-gray-700 min-w-[180px] text-center">
            Week of {weekLabel}
          </span>

          <button
            onClick={onNextWeek}
            className="p-2 hover:bg-gray-100 rounded transition"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={onToday}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
          >
            Today
          </button>
        </div>
      </div>

      {importError && (
        <div className="mt-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {importError}
        </div>
      )}
    </header>
  );
};

export default Header;
