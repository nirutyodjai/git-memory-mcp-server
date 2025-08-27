# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2024-01-17

### Added
- **Enhanced Git Operations**
  - `git_add` - Stage files for commit
  - `git_commit` - Create commits with messages
  - `git_push` - Push changes to remote repository
  - `git_pull` - Pull changes from remote repository
  - `git_branch` - Create and manage Git branches
  - `git_merge` - Merge branches

- **Advanced Memory Management**
  - `memory_search` - Search through stored memories with query strings
  - `memory_filter` - Filter memories by criteria (type, tags, date range)
  - Enhanced `memory_store` with tags support

- **Testing Infrastructure**
  - Comprehensive test suite covering all MCP tools
  - Jest configuration with TypeScript support
  - Test coverage for Git operations, memory operations, and error handling
  - Windows-compatible file system cleanup in tests

- **CI/CD Pipeline**
  - GitHub Actions workflows for automated testing
  - Code quality checks and security scanning
  - Multi-version Node.js testing (18.x, 20.x, 22.x)
  - Automated NPM publishing on releases
  - Dependabot configuration for dependency updates

- **Developer Experience**
  - Issue templates for bug reports and feature requests
  - Pull request template with comprehensive checklist
  - Contributing guidelines with development setup
  - Enhanced documentation with testing section

### Enhanced
- **Error Handling**
  - Improved error messages with better context
  - Proper error propagation in all tools
  - Validation for required parameters

- **Performance**
  - Optimized JSON storage operations
  - Better memory management for large repositories
  - Efficient search algorithms for memory operations

- **Documentation**
  - Updated README with all new features
  - Comprehensive API reference for all tools
  - Usage examples for Git and memory operations
  - Testing section with coverage information

### Fixed
- File system compatibility issues on Windows
- TypeScript strict mode compliance
- Memory leak prevention in test cleanup
- Proper handling of Git repository states

## [1.0.2] - 2024-01-16

### Added
- Enhanced README with comprehensive examples and troubleshooting guide
- CHANGELOG.md for version tracking
- Contributing guidelines
- Support section with community links

### Improved
- Better documentation structure
- More detailed installation instructions
- Quick start guide for Claude Desktop integration

## [1.0.1] - 2024-01-16

### Added
- Git Memory MCP Server implementation
- Git operations support (status, log, diff)
- Memory management functionality (store, retrieve, list, delete)
- TypeScript support with full type definitions
- NPM package configuration
- Basic documentation

### Features
- **Git Tools**:
  - `git_status`: Get current repository status
  - `git_log`: Retrieve commit history with configurable limits
  - `git_diff`: View staged or unstaged changes

- **Memory Tools**:
  - `memory_store`: Store information with metadata
  - `memory_retrieve`: Retrieve stored information by key
  - `memory_list`: List all stored memory entries
  - `memory_delete`: Delete specific memory entries

### Technical
- Built with TypeScript
- Uses @modelcontextprotocol/sdk
- Persistent storage in `.git-memory.json`
- Node.js >= 18.0.0 support

## [1.0.0] - 2024-01-15

### Added
- Initial release
- Basic MCP server structure
- Core functionality implementation

---

## Release Notes

### Version 1.0.1
This version includes a complete rewrite and cleanup of the codebase, focusing on:
- Clean, maintainable code structure
- Comprehensive documentation
- Better error handling
- TypeScript support
- Ready for NPM publication

### Future Plans
- [ ] Add more Git operations (branch, merge, etc.)
- [ ] Enhanced memory search capabilities
- [ ] Web interface for memory management
- [ ] Plugin system for extensibility
- [ ] Performance optimizations
- [ ] Unit tests and CI/CD pipeline