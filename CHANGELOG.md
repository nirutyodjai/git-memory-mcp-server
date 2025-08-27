# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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