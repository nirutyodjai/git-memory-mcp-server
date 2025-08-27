# Contributing to Git Memory MCP Server

We love your input! We want to make contributing to Git Memory MCP Server as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/git-memory-mcp-server.git
   cd git-memory-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run in development mode**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## Code Style

We use ESLint and Prettier to maintain code quality and consistency:

- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
- **Type checking**: `npm run type-check`

### Code Style Guidelines

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Use meaningful variable and function names
- Keep functions small and focused
- Write tests for new functionality

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── git-manager.ts        # Git operations manager
├── memory-manager.ts     # Memory system manager
├── integrated-operations.ts # Combined operations
└── types/                # Type definitions

examples/
├── basic-usage.js        # Basic usage examples
├── advanced-usage.js     # Advanced usage examples
└── .env.example          # Configuration example

tests/
├── unit/                 # Unit tests
├── integration/          # Integration tests
└── fixtures/             # Test fixtures
```

## Testing

We use Jest for testing. Please ensure all tests pass before submitting a PR.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- git-manager.test.ts
```

### Writing Tests

- Write unit tests for individual functions
- Write integration tests for complete workflows
- Use descriptive test names
- Mock external dependencies
- Test both success and error cases

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples

```
feat(memory): add semantic search with TF-IDF
fix(git): handle empty repository gracefully
docs(readme): update installation instructions
test(integration): add smart commit workflow tests
```

## Issue Reporting

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/your-username/git-memory-mcp-server/issues).

### Bug Reports

Great Bug Reports tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### Feature Requests

We welcome feature requests! Please:

- Explain the problem you're trying to solve
- Describe the solution you'd like
- Describe alternatives you've considered
- Provide additional context if helpful

## Documentation

Documentation improvements are always welcome! This includes:

- README updates
- Code comments
- API documentation
- Usage examples
- Tutorials and guides

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a release PR
4. After merge, tag the release
5. Publish to npm

## Community Guidelines

### Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code.

### Be Respectful

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Help

If you need help:

1. Check the [documentation](README.md)
2. Search [existing issues](https://github.com/your-username/git-memory-mcp-server/issues)
3. Ask in [GitHub Discussions](https://github.com/your-username/git-memory-mcp-server/discussions)
4. Join our community chat (if available)

## Recognition

Contributors will be recognized in:

- The project README
- Release notes
- The project's contributors page

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask questions! We're here to help make your contribution experience as smooth as possible.

Thank you for contributing to Git Memory MCP Server! 🎉