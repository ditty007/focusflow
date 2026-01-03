# Contributing to FocusFlow

First off, thank you for considering contributing to FocusFlow! It's people like you that make FocusFlow such a great tool.

## 🔒 Privacy-First Principle

**Important**: All contributions must maintain FocusFlow's core principle of privacy-first design:
- No data collection or tracking
- No analytics or telemetry
- All data stored locally only
- No server-side dependencies for core functionality

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/focusflow.git
   cd focusflow
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Run tests:
   ```bash
   npm test
   ```

## 🧪 Development Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
3. Write or update tests as needed
4. Ensure all tests pass:
   ```bash
   npm test
   npm run build  # Make sure it builds
   ```

5. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Open a Pull Request on GitHub

## ✅ Pull Request Guidelines

### Before Submitting
- [ ] All tests pass (`npm test`)
- [ ] Code builds successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] Test coverage remains high (aim for >95%)
- [ ] Code follows existing style conventions
- [ ] Privacy-first principles maintained

### PR Description Should Include
- What problem does this solve?
- What changes were made?
- How to test the changes
- Screenshots (if UI changes)

### Code Review Process
1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, it will be merged!

## 🧪 Testing Requirements

All contributions must include appropriate tests:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:ui
```

### Test Coverage Standards
- Aim for >95% coverage on new code
- All security-related code must have 100% coverage
- Include edge cases and error scenarios

## 🛡️ Security

### Reporting Security Issues
If you discover a security vulnerability, please:
1. **Do NOT** open a public issue
2. Email the maintainers directly
3. Include detailed steps to reproduce
4. Allow time for a fix before public disclosure

### Security Requirements
- All user input must be sanitized
- No XSS vulnerabilities
- No code injection possibilities
- File uploads must be validated

## 📝 Code Style

We use:
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** (future) for formatting

Run linting:
```bash
npm run lint
```

## 🎨 UI/UX Guidelines

When making UI changes:
- Keep it simple and clean
- Mobile-first responsive design
- Accessibility is important (keyboard navigation, screen readers)
- Test on multiple browsers
- Maintain consistent design language

## 📚 Documentation

Please update documentation when:
- Adding new features
- Changing existing behavior
- Updating dependencies
- Modifying configuration

## 🐛 Bug Reports

Good bug reports include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable
- Minimal test case (if possible)

## 💡 Feature Requests

We love feature ideas! When proposing:
- Explain the use case
- Describe the desired behavior
- Consider how it fits with privacy-first design
- Be open to discussion and alternatives

## 📄 Commit Message Guidelines

Format: `type: description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting changes
- `refactor`: Code restructuring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat: add keyboard shortcuts for task navigation
fix: resolve drag-and-drop issue on mobile
docs: update installation instructions
test: add tests for import validation
```

## 🎯 Areas Looking for Help

- [ ] Keyboard shortcuts for power users
- [ ] Accessibility improvements
- [ ] Mobile UI optimizations
- [ ] Additional export formats (CSV, Markdown)
- [ ] Dark mode
- [ ] Internationalization (i18n)
- [ ] Performance optimizations
- [ ] Browser extension

## ❓ Questions?

Feel free to:
- Open a GitHub Discussion
- Ask in pull request comments
- Check existing issues for similar questions

## 🙏 Thank You!

Your contributions help make FocusFlow better for everyone while maintaining our commitment to privacy and user control.

---

**Remember**: Privacy first, user control always, no compromises.
