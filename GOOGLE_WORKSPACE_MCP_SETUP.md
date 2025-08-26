# Google Workspace MCP Server Setup Guide

## Overview
Google Workspace MCP Server provides comprehensive integration with Google Workspace services including Gmail, Calendar, Drive, Docs, Sheets, Slides, Forms, Tasks, and Chat through AI assistants.

## Features
- **Gmail**: Complete email management (send, receive, delete, search)
- **Calendar**: Event management (create, update, delete, list)
- **Drive**: File operations (upload, download, list, delete)
- **Docs**: Document creation and editing
- **Sheets**: Spreadsheet operations and data management
- **Slides**: Presentation creation and updates
- **Forms**: Form creation and response management
- **Tasks**: Task and task list management
- **Chat**: Messaging capabilities (Workspace accounts)
- **Search**: Custom search engine integration

## Prerequisites
1. Python 3.10+
2. `uvx` or `uv` installed
3. Google Cloud Project with OAuth 2.0 credentials
4. Required Google APIs enabled

## Installation Steps

### 1. Google Cloud Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth Client ID**
5. Select **Desktop Application**
6. Download the credentials JSON file

### 2. Enable Required APIs
In Google Cloud Console, go to **APIs & Services** > **Library** and enable:
- Gmail API
- Google Calendar API
- Google Drive API
- Google Docs API
- Google Sheets API
- Google Slides API
- Google Forms API
- Google Tasks API
- Google Chat API (for Workspace accounts)
- Custom Search API (optional)

### 3. Configure Environment Variables
1. Copy your OAuth credentials from the downloaded JSON file
2. Edit `.env.google` file in the project root
3. Replace placeholder values with your actual credentials:

```bash
GOOGLE_OAUTH_CLIENT_ID="your-actual-client-id.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="your-actual-client-secret"
```

### 4. Load Environment Variables
```bash
# Load environment variables
source .env.google
# or on Windows
Get-Content .env.google | ForEach-Object { $name, $value = $_.split('='); Set-Item -Path "env:$name" -Value $value }
```

### 5. Test Installation
```bash
# Test the server
uvx workspace-mcp --tool-tier core
```

## Usage Examples

### Gmail Operations
- List recent emails
- Send new messages
- Search emails by criteria
- Delete unwanted messages

### Calendar Management
- Create meetings and events
- View upcoming appointments
- Update event details
- Delete cancelled events

### Drive File Operations
- Upload files to Drive
- Download files from Drive
- List files and folders
- Organize file structure

### Document Collaboration
- Create new Google Docs
- Edit document content
- Create spreadsheets with data
- Build presentations

## Tool Tiers
- **core**: Essential tools for basic operations
- **extended**: Core tools plus additional features
- **complete**: All available tools and capabilities

## Security Notes
- Keep your OAuth credentials secure
- Never commit `.env.google` to version control
- Use environment-specific configurations
- Enable only required API scopes

## Troubleshooting

### Common Issues
1. **Authentication Errors**: Verify OAuth credentials are correct
2. **API Not Enabled**: Ensure all required APIs are enabled in Google Cloud
3. **Permission Denied**: Check OAuth scopes and user permissions
4. **Rate Limiting**: Respect API rate limits (100 requests per 15 minutes)

### Support
- GitHub Repository: [taylorwilsdon/google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp)
- Documentation: [FastMCP Docs](https://gofastmcp.com)
- Issues: Report bugs and feature requests on GitHub

## Configuration in MCP
The server is already configured in `mcp.config.json` with:
- Endpoint: `/api/mcp/google-workspace`
- Rate limit: 100 requests per 15 minutes
- OAuth 2.0 authentication
- Comprehensive API scopes
- Caching enabled for better performance

## Next Steps
1. Configure your Google OAuth credentials
2. Test basic operations like listing Gmail messages
3. Explore advanced features like document creation
4. Integrate with your AI workflows