# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-08-25

### Added
- Initial release of Git Memory MCP Server
- Core Git operations support:
  - `git_status` - Get repository status
  - `git_commit` - Create commits with messages
  - `git_branch` - Branch management operations
  - `git_diff` - View file differences
  - `git_log` - View commit history
  - `git_add` - Stage files for commit
- Memory management capabilities:
  - `memory_store` - Store information with semantic indexing
  - `memory_search` - Search stored memories with similarity matching
  - `memory_list` - List all stored memories
  - `memory_delete` - Remove specific memories
- Integrated operations:
  - `smart_commit` - AI-powered commit message generation with memory storage
  - `pattern_analysis` - Analyze repository patterns and trends
  - `context_search` - Search across Git history and memory simultaneously
- Semantic search using TF-IDF vectorization
- Persistent memory storage with SQLite
- Configurable similarity thresholds
- Comprehensive error handling and validation
- TypeScript support with full type definitions

### Documentation
- Comprehensive README with installation and usage instructions
- API documentation with JSON schema examples
- Contributing guidelines
- MIT License
- Usage examples for basic and advanced scenarios
- Environment configuration examples

### Development
- TypeScript build system
- ESM module support
- Development and production scripts
- Example configurations and usage patterns

### Dependencies
- @modelcontextprotocol/sdk ^0.6.0
- simple-git ^3.25.0
- natural ^6.12.0
- fs-extra ^11.2.0

### Requirements
- Node.js 18.0.0 or higher
- Git installed and accessible in PATH
- Write permissions for memory database storage

---

## [Unreleased]

### Planned
- Unit and integration test suite
- Performance optimizations for large repositories
- Advanced Git operations (merge, rebase, cherry-pick)
- Memory export/import functionality
- Plugin system for custom operations
- Web interface for memory management
- Integration with popular Git hosting services
- Advanced analytics and reporting features

---

### Legend
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes