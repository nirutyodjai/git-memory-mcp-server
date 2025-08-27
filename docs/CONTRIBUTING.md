# Contributing to Git Memory MCP Server

Thank you for your interest in contributing to the Git Memory MCP Server! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/git-memory-mcp-server.git
cd git-memory-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-new-tool`
- `fix/memory-storage-bug`
- `docs/update-readme`
- `refactor/improve-error-handling`

### Commit Messages

Follow conventional commit format:
```
type(scope): description

Optional body explaining the change in more detail.

Optional footer with breaking changes or issue references.
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(git): add git_merge tool
fix(memory): resolve search query escaping issue
docs(readme): update installation instructions
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/git-operations.test.ts
```

### Writing Tests

- Write tests for all new features
- Update existing tests when modifying functionality
- Ensure tests are isolated and don't depend on external state
- Use descriptive test names
- Mock external dependencies

### Test Structure

```typescript
describe('ToolName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should handle normal case', async () => {
    // Test implementation
  });

  it('should handle error case', async () => {
    // Error test implementation
  });
});
```

## Submitting Changes

### Pull Request Process

1. Ensure your code follows the coding standards
2. Update documentation if needed
3. Add or update tests
4. Ensure all tests pass
5. Update CHANGELOG.md if applicable
6. Submit a pull request with a clear description

### Pull Request Template

Use the provided PR template and fill out all relevant sections:
- Description of changes
- Type of change
- Testing performed
- Documentation updates
- Breaking changes (if any)

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Provide proper type annotations
- Avoid `any` type when possible

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use trailing commas in objects and arrays
- Keep lines under 100 characters when possible

### Error Handling

- Always handle errors appropriately
- Use specific error types when possible
- Provide meaningful error messages
- Log errors with appropriate context

### Documentation

- Document all public APIs
- Use JSDoc comments for functions and classes
- Keep README.md up to date
- Provide examples for new features

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── tools/
│   ├── git-tools.ts      # Git-related MCP tools
│   └── memory-tools.ts   # Memory management tools
├── utils/
│   ├── git-utils.ts      # Git utility functions
│   └── memory-utils.ts   # Memory utility functions
└── types/
    └── index.ts          # Type definitions

tests/
├── git-operations.test.ts
├── memory-operations.test.ts
└── simple.test.ts

.github/
├── workflows/            # GitHub Actions
├── ISSUE_TEMPLATE/       # Issue templates
└── pull_request_template.md
```

### Adding New Tools

1. Define the tool in appropriate file (`git-tools.ts` or `memory-tools.ts`)
2. Add proper TypeScript types
3. Implement error handling
4. Add comprehensive tests
5. Update documentation
6. Add usage examples

### Tool Implementation Pattern

```typescript
export const toolName: Tool = {
  name: 'tool_name',
  description: 'Tool description',
  inputSchema: {
    type: 'object',
    properties: {
      // Define parameters
    },
    required: ['required_param']
  }
};

export async function handleToolName(args: any): Promise<any> {
  try {
    // Validate input
    // Implement functionality
    // Return result
  } catch (error) {
    // Handle errors appropriately
    throw new Error(`Tool execution failed: ${error.message}`);
  }
}
```

## Questions?

If you have questions about contributing, please:

1. Check existing issues and discussions
2. Create a new issue with the "question" label
3. Reach out to the maintainers

Thank you for contributing to Git Memory MCP Server!