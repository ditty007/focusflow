import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskModal from './TaskModal';
import type { Task, Space, Subtask } from '../types';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (input: string) => input.replace(/<[^>]*>/g, ''),
  },
}));

// Mock generateId
vi.mock('../utils/storage', () => ({
  generateId: () => 'mock-id',
}));

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Test Task',
  category: 'important',
  timeEstimate: 1,
  notes: 'important context',
  stakeholder: '',
  subtasks: [],
  completed: false,
  createdAt: '2024-01-01T00:00:00Z',
  order: 0,
  spaceId: 'default',
  scheduledDay: '2024-01-15',
  ...overrides,
});

describe('TaskModal – unit', () => {
  it('renders notes immediately on first render without waiting for effects', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialData={makeTask({ notes: 'important context' })}
        initialDay="2024-01-15"
      />
    );

    const textarea = screen.getByPlaceholderText('Additional details...');
    // Notes must be present on the very first render, not deferred to an effect
    expect(textarea).toHaveValue('important context');
  });

  it('shows empty notes for a brand-new task', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialDay="2024-01-15"
      />
    );

    const textarea = screen.getByPlaceholderText('Additional details...');
    expect(textarea).toHaveValue('');
  });

  it('saves notes unchanged when user does not touch the notes field', () => {
    const onSave = vi.fn();

    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        initialData={makeTask({ notes: 'important context' })}
        initialDay="2024-01-15"
      />
    );

    fireEvent.click(screen.getByText('Save Changes'));

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0][0].notes).toBe('important context');
  });

  it('saves undefined notes when user explicitly clears the notes field', () => {
    const onSave = vi.fn();

    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        initialData={makeTask({ notes: 'important context' })}
        initialDay="2024-01-15"
      />
    );

    const textarea = screen.getByPlaceholderText('Additional details...');
    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.click(screen.getByText('Save Changes'));

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0][0].notes).toBeUndefined();
  });

  it('preserves the scheduledDay from props when saving', () => {
    const onSave = vi.fn();

    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        initialData={makeTask({ scheduledDay: '2024-01-20', notes: 'note' })}
        initialDay="2024-01-20"
      />
    );

    fireEvent.click(screen.getByText('Save Changes'));

    expect(onSave.mock.calls[0][0].scheduledDay).toBe('2024-01-20');
  });

  it('reloads notes when switched to a different task (initialData changes)', () => {
    const taskA = makeTask({ id: 'a', notes: 'notes for A' });
    const taskB = makeTask({ id: 'b', title: 'Task B', notes: 'notes for B' });

    const { rerender } = render(
      <TaskModal
        key={taskA.id}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialData={taskA}
        initialDay="2024-01-15"
      />
    );

    expect(screen.getByPlaceholderText('Additional details...')).toHaveValue('notes for A');

    // Simulate App re-rendering the modal with a new key for task B
    rerender(
      <TaskModal
        key={taskB.id}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialData={taskB}
        initialDay="2024-01-15"
      />
    );

    expect(screen.getByPlaceholderText('Additional details...')).toHaveValue('notes for B');
  });

  it('does not call onSave when title is empty', () => {
    const onSave = vi.fn();

    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        initialData={makeTask({ title: '' })}
        initialDay="2024-01-15"
      />
    );

    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();

    render(
      <TaskModal
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
        initialData={makeTask()}
        initialDay="2024-01-15"
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onDelete when Delete Task is clicked', () => {
    const onDelete = vi.fn();

    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={onDelete}
        initialData={makeTask()}
        initialDay="2024-01-15"
      />
    );

    fireEvent.click(screen.getByText('Delete Task'));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('shows "New Task" heading when no initialData provided', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialDay="2024-01-15"
      />
    );

    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('shows "Edit Task" heading when initialData is provided', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialData={makeTask()}
        initialDay="2024-01-15"
      />
    );

    expect(screen.getByText('Edit Task')).toBeInTheDocument();
  });
});

describe('TaskModal – notes persistence integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves notes after modal is opened for a task that was moved (simulating post-drag scenario)', () => {
    // This test simulates the bug: after a drag, the modal opens and notes
    // must be visible immediately on the first render (not lost during mount)
    const onSave = vi.fn();
    const movedTask = makeTask({
      notes: 'critical notes that must survive',
      scheduledDay: '2024-01-18', // new day after drag
    });

    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        initialData={movedTask}
        initialDay="2024-01-18"
      />
    );

    // Notes must be shown immediately (not blank on first render)
    const textarea = screen.getByPlaceholderText('Additional details...');
    expect(textarea).toHaveValue('critical notes that must survive');

    // Saving without touching notes must keep them
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].notes).toBe('critical notes that must survive');
    expect(onSave.mock.calls[0][0].scheduledDay).toBe('2024-01-18');
  });

  it('preserves notes when modal is opened for a task moved to backlog', () => {
    const onSave = vi.fn();
    const backloggedTask = makeTask({
      notes: 'carry these notes to backlog',
      scheduledDay: undefined,
      backlogType: 'next-week',
    });

    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        initialData={backloggedTask}
        initialBacklog="next-week"
      />
    );

    const textarea = screen.getByPlaceholderText('Additional details...');
    expect(textarea).toHaveValue('carry these notes to backlog');

    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].notes).toBe('carry these notes to backlog');
    expect(onSave.mock.calls[0][0].backlogType).toBe('next-week');
  });

  it('editing notes works correctly — updated value is saved', () => {
    const onSave = vi.fn();

    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        initialData={makeTask({ notes: 'original note' })}
        initialDay="2024-01-15"
      />
    );

    const textarea = screen.getByPlaceholderText('Additional details...');
    fireEvent.change(textarea, { target: { value: 'updated note' } });
    fireEvent.click(screen.getByText('Save Changes'));

    expect(onSave.mock.calls[0][0].notes).toBe('updated note');
  });

  it('task with no notes shows empty textarea and saves with undefined', () => {
    const onSave = vi.fn();

    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        initialData={makeTask({ notes: undefined })}
        initialDay="2024-01-15"
      />
    );

    const textarea = screen.getByPlaceholderText('Additional details...');
    expect(textarea).toHaveValue('');

    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].notes).toBeUndefined();
  });
});

// ─── helper ──────────────────────────────────────────────────────────────────
const makeSubtask = (overrides: Partial<Subtask> = {}): Subtask => ({
  id: 'sub-1',
  title: 'Subtask one',
  completed: false,
  timeEstimate: 0.5,
  ...overrides,
});

const makeSpace = (id: string, name: string): Space => ({
  id,
  name,
  createdAt: '2024-01-01T00:00:00Z',
});

describe('TaskModal – category selection', () => {
  it('saves with "urgent-important" when that button is clicked', () => {
    const onSave = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialData={makeTask({ category: 'neither' })} initialDay="2024-01-15" />
    );
    fireEvent.click(screen.getByText('Urgent & Important'));
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].category).toBe('urgent-important');
  });

  it('saves with "urgent" when that button is clicked', () => {
    const onSave = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialData={makeTask({ category: 'neither' })} initialDay="2024-01-15" />
    );
    fireEvent.click(screen.getByText('Urgent'));
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].category).toBe('urgent');
  });

  it('saves with "important" when that button is clicked', () => {
    const onSave = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialData={makeTask({ category: 'urgent-important' })} initialDay="2024-01-15" />
    );
    fireEvent.click(screen.getByText('Important'));
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].category).toBe('important');
  });

  it('saves with "neither" when that button is clicked', () => {
    const onSave = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialData={makeTask({ category: 'urgent-important' })} initialDay="2024-01-15" />
    );
    fireEvent.click(screen.getByText('Neither'));
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].category).toBe('neither');
  });
});

describe('TaskModal – time estimate', () => {
  it('saves updated time estimate when select changes', () => {
    const onSave = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialData={makeTask({ timeEstimate: 1 })} initialDay="2024-01-15" />
    );
    // The task estimate select is the first select in the form
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '2' } });
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].timeEstimate).toBe(2);
  });
});

describe('TaskModal – stakeholder', () => {
  it('loads stakeholder from initialData', () => {
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()}
        initialData={makeTask({ stakeholder: 'Alice' })} initialDay="2024-01-15" />
    );
    expect(screen.getByPlaceholderText("Who's involved?")).toHaveValue('Alice');
  });

  it('saves updated stakeholder', () => {
    const onSave = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialData={makeTask({ stakeholder: '' })} initialDay="2024-01-15" />
    );
    fireEvent.change(screen.getByPlaceholderText("Who's involved?"), {
      target: { value: 'Bob' },
    });
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].stakeholder).toBe('Bob');
  });

  it('saves undefined for an empty stakeholder field', () => {
    const onSave = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialData={makeTask({ stakeholder: '' })} initialDay="2024-01-15" />
    );
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].stakeholder).toBeUndefined();
  });
});

describe('TaskModal – subtasks', () => {
  it('renders existing subtasks on open', () => {
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()}
        initialData={makeTask({ subtasks: [makeSubtask()] })}
        initialDay="2024-01-15" />
    );
    expect(screen.getByText('Subtask one')).toBeInTheDocument();
  });

  it('adds a subtask via the Add button', () => {
    const onSave = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialData={makeTask({ subtasks: [] })} initialDay="2024-01-15" />
    );
    const subtaskInput = screen.getByPlaceholderText('Add subtask...');
    fireEvent.change(subtaskInput, { target: { value: 'New sub' } });
    // Plus button is the immediate sibling of the subtask input
    fireEvent.click(subtaskInput.nextElementSibling as HTMLElement);
    expect(screen.getByText('New sub')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].subtasks).toHaveLength(1);
    expect(onSave.mock.calls[0][0].subtasks[0].title).toBe('New sub');
  });

  it('adds a subtask via the Enter key', () => {
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()}
        initialData={makeTask({ subtasks: [] })} initialDay="2024-01-15" />
    );
    const input = screen.getByPlaceholderText('Add subtask...');
    fireEvent.change(input, { target: { value: 'Enter subtask' } });
    fireEvent.keyPress(input, { key: 'Enter', charCode: 13 });
    expect(screen.getByText('Enter subtask')).toBeInTheDocument();
  });

  it('does not add a subtask when input is empty', () => {
    const onSave = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialData={makeTask({ subtasks: [] })} initialDay="2024-01-15" />
    );
    const subtaskInput = screen.getByPlaceholderText('Add subtask...');
    // Click add without typing anything
    fireEvent.click(subtaskInput.nextElementSibling as HTMLElement);
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].subtasks).toHaveLength(0);
  });

  it('removes a subtask when the trash button is clicked', () => {
    const onSave = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialData={makeTask({ subtasks: [makeSubtask()] })}
        initialDay="2024-01-15" />
    );
    expect(screen.getByText('Subtask one')).toBeInTheDocument();
    // The trash button has no accessible label – find it by its test context
    const trashButtons = screen.getAllByRole('button').filter(
      (b) => b.className.includes('text-red-600')
    );
    fireEvent.click(trashButtons[0]);
    expect(screen.queryByText('Subtask one')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].subtasks).toHaveLength(0);
  });

  it('toggles subtask completion', () => {
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()}
        initialData={makeTask({ subtasks: [makeSubtask({ completed: false })] })}
        initialDay="2024-01-15" />
    );
    // The toggle checkbox button is the first button inside the subtask row
    const checkboxButtons = screen.getAllByRole('button').filter(
      (b) => b.className.includes('rounded border-2')
    );
    fireEvent.click(checkboxButtons[0]);
    // After toggle, the span should have line-through styling
    const subtaskTitle = screen.getByText('Subtask one');
    expect(subtaskTitle.className).toContain('line-through');
  });

  it('updates subtask time estimate', () => {
    const onSave = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialData={makeTask({ subtasks: [makeSubtask({ timeEstimate: 0.5 })] })}
        initialDay="2024-01-15" />
    );
    // The subtask time select is the second combobox (after the main time estimate)
    const selects = screen.getAllByRole('combobox');
    const subtaskSelect = selects[1];
    fireEvent.change(subtaskSelect, { target: { value: '1' } });
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].subtasks[0].timeEstimate).toBe(1);
  });

  it('saves subtasks included in existing initialData without modification', () => {
    const onSave = vi.fn();
    const sub = makeSubtask({ id: 'sub-x', title: 'Existing sub', completed: true });
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialData={makeTask({ subtasks: [sub] })} initialDay="2024-01-15" />
    );
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave.mock.calls[0][0].subtasks[0].id).toBe('sub-x');
    expect(onSave.mock.calls[0][0].subtasks[0].completed).toBe(true);
  });
});

describe('TaskModal – Move to Space', () => {
  const spaces: Space[] = [makeSpace('s1', 'Work'), makeSpace('s2', 'Personal')];

  it('shows the Move to Space dropdown when multiple spaces and initialData exist', () => {
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()}
        initialData={makeTask()} initialDay="2024-01-15"
        spaces={spaces} currentSpaceId="s1" onMoveToSpace={vi.fn()} />
    );
    expect(screen.getByText('Move to:')).toBeInTheDocument();
  });

  it('does not show Move to Space when only one space exists', () => {
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()}
        initialData={makeTask()} initialDay="2024-01-15"
        spaces={[makeSpace('s1', 'Work')]} currentSpaceId="s1" onMoveToSpace={vi.fn()} />
    );
    expect(screen.queryByText('Move to:')).not.toBeInTheDocument();
  });

  it('calls onMoveToSpace and onClose when a different space is selected', () => {
    const onMoveToSpace = vi.fn();
    const onClose = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={onClose} onSave={vi.fn()}
        initialData={makeTask()} initialDay="2024-01-15"
        spaces={spaces} currentSpaceId="s1" onMoveToSpace={onMoveToSpace} />
    );
    const spaceSelects = screen.getAllByRole('combobox').filter(
      (s) => s.className.includes('text-sm')
    );
    fireEvent.change(spaceSelects[0], { target: { value: 's2' } });
    expect(onMoveToSpace).toHaveBeenCalledWith('s2');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onMoveToSpace when the same space is re-selected', () => {
    const onMoveToSpace = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()}
        initialData={makeTask()} initialDay="2024-01-15"
        spaces={spaces} currentSpaceId="s1" onMoveToSpace={onMoveToSpace} />
    );
    const spaceSelects = screen.getAllByRole('combobox').filter(
      (s) => s.className.includes('text-sm')
    );
    fireEvent.change(spaceSelects[0], { target: { value: 's1' } });
    expect(onMoveToSpace).not.toHaveBeenCalled();
  });
});

describe('TaskModal – create task flow', () => {
  it('shows "Create Task" button when no initialData', () => {
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()}
        initialDay="2024-01-15" />
    );
    expect(screen.getByText('Create Task')).toBeInTheDocument();
  });

  it('calls onSave with correct data when creating a new task', () => {
    const onSave = vi.fn();
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave}
        initialDay="2024-01-22" />
    );
    fireEvent.change(screen.getByPlaceholderText('Task title'), {
      target: { value: 'Brand new task' },
    });
    fireEvent.click(screen.getByText('Important'));
    fireEvent.click(screen.getByText('Create Task'));

    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0][0];
    expect(saved.title).toBe('Brand new task');
    expect(saved.category).toBe('important');
    expect(saved.scheduledDay).toBe('2024-01-22');
    expect(saved.notes).toBeUndefined();
  });

  it('does not show Delete Task button when no onDelete provided', () => {
    render(
      <TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()}
        initialDay="2024-01-15" />
    );
    expect(screen.queryByText('Delete Task')).not.toBeInTheDocument();
  });
});
