# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-05-26

### Changed
- Updated browser authentication to use API_TOKEN instead of previous authentication method
- BROWSER_ZONE is now an optional parameter, the deafult zone is `mcp_browser`
- Removed duplicate web_data_ tools

## [1.9.2] - 2025-05-23

### Fixed
- Fixed GitHub references and repository settings

## [1.9.1] - 2025-05-21

### Fixed
- Fixed spelling errors and improved coding conventions
- Converted files back to Unix line endings for consistency

## [1.9.0] - 2025-05-21

### Added
- Added 23 new web data tools for enhanced data collection capabilities
- Added progress reporting functionality for better user feedback
- Added default parameter handling for improved tool usability

### Changed
- Improved coding conventions and file formatting
- Enhanced web data API endpoints integration

## [1.8.3] - 2025-05-21

### Added
- Added Bright Data MCP with Claude demo video to README.md

### Changed
- Updated documentation with video demonstrations

## [1.8.2] - 2025-05-13

### Changed
- Bumped FastMCP version for improved performance
- Updated README.md with additional documentation

## [1.8.1] - 2025-05-05

### Added
- Added 12 new WSAPI endpoints for enhanced functionality
- Changed to polling mechanism for better reliability

### Changed
- Applied dos2unix formatting for consistency
- Updated Docker configuration
- Updated smithery.yaml configuration

## [1.8.0] - 2025-05-03

### Added
- Added domain-based browser sessions to avoid navigation limit issues
- Added automatic creation of required unlocker zone when not present

### Fixed
- Fixed browser context maintenance across tool calls with current domain tracking
- Minor lint fixes

## [1.0.0] - 2025-04-29

### Added
- Initial release of Bright Data MCP server
- Browser automation capabilities with Bright Data integration
- Core web scraping and data collection tools
- Smithery.yaml configuration for deployment in Smithery.ai
- MIT License
- Demo materials and documentation

### Documentation
- Created comprehensive README.md
- Added demo.md with usage examples
- Created examples/README.md for sample implementations
- Added Tools.md documentation for available tools

---

## Release Notes

### Version 1.9.x Series
The 1.9.x series focuses on expanding web data collection capabilities and improving authentication mechanisms. Key highlights include the addition of 23 new web data tools.

### Version 1.8.x Series  
The 1.8.x series introduced significant improvements to browser session management, WSAPI endpoints, and overall system reliability. Notable features include domain-based sessions and automatic zone creation.

### Version 1.0.0
Initial stable release providing core MCP server functionality for Bright Data integration with comprehensive browser automation and web scraping capabilities.

