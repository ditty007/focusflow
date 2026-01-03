import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * React already escapes text content by default, but this provides additional protection
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';

  // DOMPurify removes malicious code while preserving safe text
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed - plain text only
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
};

/**
 * Validate and sanitize task title
 */
export const validateTaskTitle = (title: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeInput(title);

  if (!sanitized || sanitized.length === 0) {
    return { valid: false, sanitized: '', error: 'Title is required' };
  }

  if (sanitized.length > 500) {
    return { valid: false, sanitized: sanitized.slice(0, 500), error: 'Title must be less than 500 characters' };
  }

  return { valid: true, sanitized };
};

/**
 * Validate and sanitize notes
 */
export const validateNotes = (notes: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeInput(notes);

  if (sanitized.length > 5000) {
    return { valid: false, sanitized: sanitized.slice(0, 5000), error: 'Notes must be less than 5000 characters' };
  }

  return { valid: true, sanitized };
};

/**
 * Validate and sanitize stakeholder name
 */
export const validateStakeholder = (stakeholder: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeInput(stakeholder);

  if (sanitized.length > 200) {
    return { valid: false, sanitized: sanitized.slice(0, 200), error: 'Stakeholder name must be less than 200 characters' };
  }

  return { valid: true, sanitized };
};

/**
 * Validate and sanitize space name
 */
export const validateSpaceName = (name: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeInput(name);

  if (!sanitized || sanitized.length === 0) {
    return { valid: false, sanitized: '', error: 'Space name is required' };
  }

  if (sanitized.length > 100) {
    return { valid: false, sanitized: sanitized.slice(0, 100), error: 'Space name must be less than 100 characters' };
  }

  return { valid: true, sanitized };
};

/**
 * Validate imported JSON data structure
 */
export const validateImportedTasks = (data: unknown): { valid: boolean; error?: string } => {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Invalid file format: must be an array of tasks' };
  }

  if (data.length > 10000) {
    return { valid: false, error: 'Too many tasks in file (maximum 10,000)' };
  }

  // Validate each task has required fields
  for (const task of data) {
    if (typeof task !== 'object' || task === null) {
      return { valid: false, error: 'Invalid task format' };
    }

    const t = task as Record<string, unknown>;

    if (typeof t.id !== 'string' || typeof t.title !== 'string' || typeof t.category !== 'string') {
      return { valid: false, error: 'Invalid task structure: missing required fields' };
    }

    // Validate field lengths to prevent DoS
    if (t.title && typeof t.title === 'string' && t.title.length > 10000) {
      return { valid: false, error: 'Task title too long' };
    }

    if (t.notes && typeof t.notes === 'string' && t.notes.length > 50000) {
      return { valid: false, error: 'Task notes too long' };
    }
  }

  return { valid: true };
};

/**
 * Validate file size before import
 */
export const validateFileSize = (file: File): { valid: boolean; error?: string } => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size too large (maximum 10MB)' };
  }

  return { valid: true };
};

/**
 * Validate file type
 */
export const validateFileType = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['application/json', 'text/json'];
  const allowedExtensions = ['.json'];

  const hasValidType = allowedTypes.includes(file.type);
  const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

  if (!hasValidType && !hasValidExtension) {
    return { valid: false, error: 'Invalid file type. Only JSON files are allowed.' };
  }

  return { valid: true };
};
