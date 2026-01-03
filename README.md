# FocusFlow

A privacy-first task management application built with the Eisenhower Matrix framework. **Your data never leaves your device** - everything is stored locally in your browser.

## 🔒 Privacy-First Design

**FocusFlow is designed with privacy as the core principle:**

- **No Cloud Storage**: All your tasks are stored locally in your browser using localStorage
- **No Account Required**: Start using immediately without signing up or logging in
- **No Data Collection**: Zero tracking, zero analytics, zero telemetry
- **Offline-First**: Works completely offline after the initial load
- **You Control Your Data**: Use Export/Import to backup and transfer your data as JSON files

This means:
- Your tasks, notes, and plans never touch any server
- No one can access your data except you
- If you clear your browser data, everything is gone - and that's by design
- Export regularly to keep backups on your device

## ✨ Features

### Task Organization
- **Eisenhower Matrix**: Categorize tasks by urgency and importance
- **Week View**: Plan your week with a drag-and-drop interface (Monday-Friday)
- **Backlog System**:
  - Monitor: Tasks to keep an eye on
  - From Last Week(s): Incomplete tasks from previous weeks
  - Next Week: Future planning
  - Next Month: Long-term planning

### Workspaces
- **Spaces**: Arc browser-style workspaces to separate different projects
- **Space Management**: Create, rename, and delete spaces
- **Move Tasks**: Easily move tasks between spaces

### Task Details
- **Time Estimates**: Track how long tasks will take
- **Subtasks**: Break down complex tasks
- **Stakeholders**: Note who's involved
- **Notes**: Add detailed context

### Productivity Tracking
- **Completed Tasks History**: View all completed tasks with statistics
- **Completion Time Analysis**: See average completion time by category
- **Sortable History**: Sort by date, category, or completion time

### Data Management
- **Export**: Download your tasks as JSON to backup or transfer
- **Import**: Load tasks from JSON files
- **Space-Aware Export**: Export specific spaces or all data

## 🛡️ Security

- **XSS Protection**: All user input sanitized with DOMPurify
- **Input Validation**: Comprehensive validation on all fields
- **File Upload Security**: Strict validation on imported files (type, size, structure)
- **97.3% Test Coverage**: 163 tests ensure reliability and security

## 🚀 Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

### Production Build

The production build is optimized and minified:
- Main bundle: ~271KB (84KB gzipped)
- Code splitting for optimal performance
- All assets optimized

## 📦 Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS 4** - Styling
- **@dnd-kit** - Drag and drop
- **DOMPurify** - XSS protection
- **Vitest** - Testing framework
- **date-fns** - Date utilities

## 🧪 Testing

Comprehensive test suite with 163 tests:
- Unit tests for all utilities
- Hook tests with React Testing Library
- Security validation tests
- 97.3% code coverage

```bash
npm test              # Run all tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Generate coverage report
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- All tests pass
- Code coverage remains high
- Security best practices are followed
- Privacy-first principles are maintained

---

Built with privacy in mind. Your data is yours alone.
