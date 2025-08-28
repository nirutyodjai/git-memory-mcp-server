#!/usr/bin/env node

// Community MCP Servers Deployment Script
// Auto-generated script to deploy 346 MCP servers

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const servers = [
  {
    "name": "mcp-server-aggregator",
    "port": 9000,
    "category": "aggregator",
    "repo": "punkpeye/mcp-server-aggregator",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-aggregator/index.js"
      ],
      "env": {
        "PORT": "9000",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-aggregator",
        "MCP_SERVER_CATEGORY": "aggregator"
      }
    },
    "tools": [
      {
        "name": "aggregator_list",
        "description": "List aggregator resources"
      },
      {
        "name": "aggregator_get",
        "description": "Get specific aggregator resource"
      },
      {
        "name": "aggregator_create",
        "description": "Create new aggregator resource"
      },
      {
        "name": "aggregator_update",
        "description": "Update aggregator resource"
      },
      {
        "name": "aggregator_delete",
        "description": "Delete aggregator resource"
      }
    ]
  },
  {
    "name": "mcp-servers-kagi",
    "port": 9001,
    "category": "search",
    "repo": "punkpeye/mcp-servers-kagi",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-servers-kagi/index.js"
      ],
      "env": {
        "PORT": "9001",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-servers-kagi",
        "MCP_SERVER_CATEGORY": "search"
      }
    },
    "tools": [
      {
        "name": "search_list",
        "description": "List search resources"
      },
      {
        "name": "search_get",
        "description": "Get specific search resource"
      },
      {
        "name": "search_create",
        "description": "Create new search resource"
      },
      {
        "name": "search_update",
        "description": "Update search resource"
      },
      {
        "name": "search_delete",
        "description": "Delete search resource"
      }
    ]
  },
  {
    "name": "mcp-server-raycast",
    "port": 9002,
    "category": "productivity",
    "repo": "punkpeye/mcp-server-raycast",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-raycast/index.js"
      ],
      "env": {
        "PORT": "9002",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-raycast",
        "MCP_SERVER_CATEGORY": "productivity"
      }
    },
    "tools": [
      {
        "name": "productivity_list",
        "description": "List productivity resources"
      },
      {
        "name": "productivity_get",
        "description": "Get specific productivity resource"
      },
      {
        "name": "productivity_create",
        "description": "Create new productivity resource"
      },
      {
        "name": "productivity_update",
        "description": "Update productivity resource"
      },
      {
        "name": "productivity_delete",
        "description": "Delete productivity resource"
      }
    ]
  },
  {
    "name": "mcp-server-obsidian",
    "port": 9003,
    "category": "notes",
    "repo": "punkpeye/mcp-server-obsidian",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-obsidian/index.js"
      ],
      "env": {
        "PORT": "9003",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-obsidian",
        "MCP_SERVER_CATEGORY": "notes"
      }
    },
    "tools": [
      {
        "name": "notes_list",
        "description": "List notes resources"
      },
      {
        "name": "notes_get",
        "description": "Get specific notes resource"
      },
      {
        "name": "notes_create",
        "description": "Create new notes resource"
      },
      {
        "name": "notes_update",
        "description": "Update notes resource"
      },
      {
        "name": "notes_delete",
        "description": "Delete notes resource"
      }
    ]
  },
  {
    "name": "mcp-server-notion",
    "port": 9004,
    "category": "productivity",
    "repo": "punkpeye/mcp-server-notion",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-notion/index.js"
      ],
      "env": {
        "PORT": "9004",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-notion",
        "MCP_SERVER_CATEGORY": "productivity"
      }
    },
    "tools": [
      {
        "name": "productivity_list",
        "description": "List productivity resources"
      },
      {
        "name": "productivity_get",
        "description": "Get specific productivity resource"
      },
      {
        "name": "productivity_create",
        "description": "Create new productivity resource"
      },
      {
        "name": "productivity_update",
        "description": "Update productivity resource"
      },
      {
        "name": "productivity_delete",
        "description": "Delete productivity resource"
      }
    ]
  },
  {
    "name": "mcp-server-todoist",
    "port": 9005,
    "category": "productivity",
    "repo": "punkpeye/mcp-server-todoist",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-todoist/index.js"
      ],
      "env": {
        "PORT": "9005",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-todoist",
        "MCP_SERVER_CATEGORY": "productivity"
      }
    },
    "tools": [
      {
        "name": "productivity_list",
        "description": "List productivity resources"
      },
      {
        "name": "productivity_get",
        "description": "Get specific productivity resource"
      },
      {
        "name": "productivity_create",
        "description": "Create new productivity resource"
      },
      {
        "name": "productivity_update",
        "description": "Update productivity resource"
      },
      {
        "name": "productivity_delete",
        "description": "Delete productivity resource"
      }
    ]
  },
  {
    "name": "mcp-server-linear",
    "port": 9006,
    "category": "project-management",
    "repo": "punkpeye/mcp-server-linear",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-linear/index.js"
      ],
      "env": {
        "PORT": "9006",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-linear",
        "MCP_SERVER_CATEGORY": "project-management"
      }
    },
    "tools": [
      {
        "name": "project-management_list",
        "description": "List project-management resources"
      },
      {
        "name": "project-management_get",
        "description": "Get specific project-management resource"
      },
      {
        "name": "project-management_create",
        "description": "Create new project-management resource"
      },
      {
        "name": "project-management_update",
        "description": "Update project-management resource"
      },
      {
        "name": "project-management_delete",
        "description": "Delete project-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-jira",
    "port": 9007,
    "category": "project-management",
    "repo": "punkpeye/mcp-server-jira",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-jira/index.js"
      ],
      "env": {
        "PORT": "9007",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-jira",
        "MCP_SERVER_CATEGORY": "project-management"
      }
    },
    "tools": [
      {
        "name": "project-management_list",
        "description": "List project-management resources"
      },
      {
        "name": "project-management_get",
        "description": "Get specific project-management resource"
      },
      {
        "name": "project-management_create",
        "description": "Create new project-management resource"
      },
      {
        "name": "project-management_update",
        "description": "Update project-management resource"
      },
      {
        "name": "project-management_delete",
        "description": "Delete project-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-trello",
    "port": 9008,
    "category": "project-management",
    "repo": "punkpeye/mcp-server-trello",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-trello/index.js"
      ],
      "env": {
        "PORT": "9008",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-trello",
        "MCP_SERVER_CATEGORY": "project-management"
      }
    },
    "tools": [
      {
        "name": "project-management_list",
        "description": "List project-management resources"
      },
      {
        "name": "project-management_get",
        "description": "Get specific project-management resource"
      },
      {
        "name": "project-management_create",
        "description": "Create new project-management resource"
      },
      {
        "name": "project-management_update",
        "description": "Update project-management resource"
      },
      {
        "name": "project-management_delete",
        "description": "Delete project-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-asana",
    "port": 9009,
    "category": "project-management",
    "repo": "punkpeye/mcp-server-asana",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-asana/index.js"
      ],
      "env": {
        "PORT": "9009",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-asana",
        "MCP_SERVER_CATEGORY": "project-management"
      }
    },
    "tools": [
      {
        "name": "project-management_list",
        "description": "List project-management resources"
      },
      {
        "name": "project-management_get",
        "description": "Get specific project-management resource"
      },
      {
        "name": "project-management_create",
        "description": "Create new project-management resource"
      },
      {
        "name": "project-management_update",
        "description": "Update project-management resource"
      },
      {
        "name": "project-management_delete",
        "description": "Delete project-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-slack",
    "port": 9010,
    "category": "communication",
    "repo": "punkpeye/mcp-server-slack",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-slack/index.js"
      ],
      "env": {
        "PORT": "9010",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-slack",
        "MCP_SERVER_CATEGORY": "communication"
      }
    },
    "tools": [
      {
        "name": "communication_list",
        "description": "List communication resources"
      },
      {
        "name": "communication_get",
        "description": "Get specific communication resource"
      },
      {
        "name": "communication_create",
        "description": "Create new communication resource"
      },
      {
        "name": "communication_update",
        "description": "Update communication resource"
      },
      {
        "name": "communication_delete",
        "description": "Delete communication resource"
      }
    ]
  },
  {
    "name": "mcp-server-discord",
    "port": 9011,
    "category": "communication",
    "repo": "punkpeye/mcp-server-discord",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-discord/index.js"
      ],
      "env": {
        "PORT": "9011",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-discord",
        "MCP_SERVER_CATEGORY": "communication"
      }
    },
    "tools": [
      {
        "name": "communication_list",
        "description": "List communication resources"
      },
      {
        "name": "communication_get",
        "description": "Get specific communication resource"
      },
      {
        "name": "communication_create",
        "description": "Create new communication resource"
      },
      {
        "name": "communication_update",
        "description": "Update communication resource"
      },
      {
        "name": "communication_delete",
        "description": "Delete communication resource"
      }
    ]
  },
  {
    "name": "mcp-server-telegram",
    "port": 9012,
    "category": "communication",
    "repo": "punkpeye/mcp-server-telegram",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-telegram/index.js"
      ],
      "env": {
        "PORT": "9012",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-telegram",
        "MCP_SERVER_CATEGORY": "communication"
      }
    },
    "tools": [
      {
        "name": "communication_list",
        "description": "List communication resources"
      },
      {
        "name": "communication_get",
        "description": "Get specific communication resource"
      },
      {
        "name": "communication_create",
        "description": "Create new communication resource"
      },
      {
        "name": "communication_update",
        "description": "Update communication resource"
      },
      {
        "name": "communication_delete",
        "description": "Delete communication resource"
      }
    ]
  },
  {
    "name": "mcp-server-whatsapp",
    "port": 9013,
    "category": "communication",
    "repo": "punkpeye/mcp-server-whatsapp",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-whatsapp/index.js"
      ],
      "env": {
        "PORT": "9013",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-whatsapp",
        "MCP_SERVER_CATEGORY": "communication"
      }
    },
    "tools": [
      {
        "name": "communication_list",
        "description": "List communication resources"
      },
      {
        "name": "communication_get",
        "description": "Get specific communication resource"
      },
      {
        "name": "communication_create",
        "description": "Create new communication resource"
      },
      {
        "name": "communication_update",
        "description": "Update communication resource"
      },
      {
        "name": "communication_delete",
        "description": "Delete communication resource"
      }
    ]
  },
  {
    "name": "mcp-server-sqlite",
    "port": 9014,
    "category": "database",
    "repo": "modelcontextprotocol/servers/src/sqlite",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-sqlite/index.js"
      ],
      "env": {
        "PORT": "9014",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-sqlite",
        "MCP_SERVER_CATEGORY": "database"
      }
    },
    "tools": [
      {
        "name": "database_list",
        "description": "List database resources"
      },
      {
        "name": "database_get",
        "description": "Get specific database resource"
      },
      {
        "name": "database_create",
        "description": "Create new database resource"
      },
      {
        "name": "database_update",
        "description": "Update database resource"
      },
      {
        "name": "database_delete",
        "description": "Delete database resource"
      }
    ]
  },
  {
    "name": "mcp-server-postgres",
    "port": 9015,
    "category": "database",
    "repo": "punkpeye/mcp-server-postgres",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-postgres/index.js"
      ],
      "env": {
        "PORT": "9015",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-postgres",
        "MCP_SERVER_CATEGORY": "database"
      }
    },
    "tools": [
      {
        "name": "database_list",
        "description": "List database resources"
      },
      {
        "name": "database_get",
        "description": "Get specific database resource"
      },
      {
        "name": "database_create",
        "description": "Create new database resource"
      },
      {
        "name": "database_update",
        "description": "Update database resource"
      },
      {
        "name": "database_delete",
        "description": "Delete database resource"
      }
    ]
  },
  {
    "name": "mcp-server-mysql",
    "port": 9016,
    "category": "database",
    "repo": "punkpeye/mcp-server-mysql",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-mysql/index.js"
      ],
      "env": {
        "PORT": "9016",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-mysql",
        "MCP_SERVER_CATEGORY": "database"
      }
    },
    "tools": [
      {
        "name": "database_list",
        "description": "List database resources"
      },
      {
        "name": "database_get",
        "description": "Get specific database resource"
      },
      {
        "name": "database_create",
        "description": "Create new database resource"
      },
      {
        "name": "database_update",
        "description": "Update database resource"
      },
      {
        "name": "database_delete",
        "description": "Delete database resource"
      }
    ]
  },
  {
    "name": "mcp-server-mongodb",
    "port": 9017,
    "category": "database",
    "repo": "punkpeye/mcp-server-mongodb",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-mongodb/index.js"
      ],
      "env": {
        "PORT": "9017",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-mongodb",
        "MCP_SERVER_CATEGORY": "database"
      }
    },
    "tools": [
      {
        "name": "database_list",
        "description": "List database resources"
      },
      {
        "name": "database_get",
        "description": "Get specific database resource"
      },
      {
        "name": "database_create",
        "description": "Create new database resource"
      },
      {
        "name": "database_update",
        "description": "Update database resource"
      },
      {
        "name": "database_delete",
        "description": "Delete database resource"
      }
    ]
  },
  {
    "name": "mcp-server-redis",
    "port": 9018,
    "category": "database",
    "repo": "punkpeye/mcp-server-redis",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-redis/index.js"
      ],
      "env": {
        "PORT": "9018",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-redis",
        "MCP_SERVER_CATEGORY": "database"
      }
    },
    "tools": [
      {
        "name": "database_list",
        "description": "List database resources"
      },
      {
        "name": "database_get",
        "description": "Get specific database resource"
      },
      {
        "name": "database_create",
        "description": "Create new database resource"
      },
      {
        "name": "database_update",
        "description": "Update database resource"
      },
      {
        "name": "database_delete",
        "description": "Delete database resource"
      }
    ]
  },
  {
    "name": "mcp-server-elasticsearch",
    "port": 9019,
    "category": "database",
    "repo": "punkpeye/mcp-server-elasticsearch",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-elasticsearch/index.js"
      ],
      "env": {
        "PORT": "9019",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-elasticsearch",
        "MCP_SERVER_CATEGORY": "database"
      }
    },
    "tools": [
      {
        "name": "database_list",
        "description": "List database resources"
      },
      {
        "name": "database_get",
        "description": "Get specific database resource"
      },
      {
        "name": "database_create",
        "description": "Create new database resource"
      },
      {
        "name": "database_update",
        "description": "Update database resource"
      },
      {
        "name": "database_delete",
        "description": "Delete database resource"
      }
    ]
  },
  {
    "name": "mcp-server-github",
    "port": 9020,
    "category": "development",
    "repo": "modelcontextprotocol/servers/src/github",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-github/index.js"
      ],
      "env": {
        "PORT": "9020",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-github",
        "MCP_SERVER_CATEGORY": "development"
      }
    },
    "tools": [
      {
        "name": "development_list",
        "description": "List development resources"
      },
      {
        "name": "development_get",
        "description": "Get specific development resource"
      },
      {
        "name": "development_create",
        "description": "Create new development resource"
      },
      {
        "name": "development_update",
        "description": "Update development resource"
      },
      {
        "name": "development_delete",
        "description": "Delete development resource"
      }
    ]
  },
  {
    "name": "mcp-server-gitlab",
    "port": 9021,
    "category": "development",
    "repo": "punkpeye/mcp-server-gitlab",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-gitlab/index.js"
      ],
      "env": {
        "PORT": "9021",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-gitlab",
        "MCP_SERVER_CATEGORY": "development"
      }
    },
    "tools": [
      {
        "name": "development_list",
        "description": "List development resources"
      },
      {
        "name": "development_get",
        "description": "Get specific development resource"
      },
      {
        "name": "development_create",
        "description": "Create new development resource"
      },
      {
        "name": "development_update",
        "description": "Update development resource"
      },
      {
        "name": "development_delete",
        "description": "Delete development resource"
      }
    ]
  },
  {
    "name": "mcp-server-bitbucket",
    "port": 9022,
    "category": "development",
    "repo": "punkpeye/mcp-server-bitbucket",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-bitbucket/index.js"
      ],
      "env": {
        "PORT": "9022",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-bitbucket",
        "MCP_SERVER_CATEGORY": "development"
      }
    },
    "tools": [
      {
        "name": "development_list",
        "description": "List development resources"
      },
      {
        "name": "development_get",
        "description": "Get specific development resource"
      },
      {
        "name": "development_create",
        "description": "Create new development resource"
      },
      {
        "name": "development_update",
        "description": "Update development resource"
      },
      {
        "name": "development_delete",
        "description": "Delete development resource"
      }
    ]
  },
  {
    "name": "mcp-server-docker",
    "port": 9023,
    "category": "development",
    "repo": "punkpeye/mcp-server-docker",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-docker/index.js"
      ],
      "env": {
        "PORT": "9023",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-docker",
        "MCP_SERVER_CATEGORY": "development"
      }
    },
    "tools": [
      {
        "name": "development_list",
        "description": "List development resources"
      },
      {
        "name": "development_get",
        "description": "Get specific development resource"
      },
      {
        "name": "development_create",
        "description": "Create new development resource"
      },
      {
        "name": "development_update",
        "description": "Update development resource"
      },
      {
        "name": "development_delete",
        "description": "Delete development resource"
      }
    ]
  },
  {
    "name": "mcp-server-kubernetes",
    "port": 9024,
    "category": "development",
    "repo": "punkpeye/mcp-server-kubernetes",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-kubernetes/index.js"
      ],
      "env": {
        "PORT": "9024",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-kubernetes",
        "MCP_SERVER_CATEGORY": "development"
      }
    },
    "tools": [
      {
        "name": "development_list",
        "description": "List development resources"
      },
      {
        "name": "development_get",
        "description": "Get specific development resource"
      },
      {
        "name": "development_create",
        "description": "Create new development resource"
      },
      {
        "name": "development_update",
        "description": "Update development resource"
      },
      {
        "name": "development_delete",
        "description": "Delete development resource"
      }
    ]
  },
  {
    "name": "mcp-server-jenkins",
    "port": 9025,
    "category": "development",
    "repo": "punkpeye/mcp-server-jenkins",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-jenkins/index.js"
      ],
      "env": {
        "PORT": "9025",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-jenkins",
        "MCP_SERVER_CATEGORY": "development"
      }
    },
    "tools": [
      {
        "name": "development_list",
        "description": "List development resources"
      },
      {
        "name": "development_get",
        "description": "Get specific development resource"
      },
      {
        "name": "development_create",
        "description": "Create new development resource"
      },
      {
        "name": "development_update",
        "description": "Update development resource"
      },
      {
        "name": "development_delete",
        "description": "Delete development resource"
      }
    ]
  },
  {
    "name": "mcp-server-circleci",
    "port": 9026,
    "category": "development",
    "repo": "punkpeye/mcp-server-circleci",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-circleci/index.js"
      ],
      "env": {
        "PORT": "9026",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-circleci",
        "MCP_SERVER_CATEGORY": "development"
      }
    },
    "tools": [
      {
        "name": "development_list",
        "description": "List development resources"
      },
      {
        "name": "development_get",
        "description": "Get specific development resource"
      },
      {
        "name": "development_create",
        "description": "Create new development resource"
      },
      {
        "name": "development_update",
        "description": "Update development resource"
      },
      {
        "name": "development_delete",
        "description": "Delete development resource"
      }
    ]
  },
  {
    "name": "mcp-server-travis",
    "port": 9027,
    "category": "development",
    "repo": "punkpeye/mcp-server-travis",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-travis/index.js"
      ],
      "env": {
        "PORT": "9027",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-travis",
        "MCP_SERVER_CATEGORY": "development"
      }
    },
    "tools": [
      {
        "name": "development_list",
        "description": "List development resources"
      },
      {
        "name": "development_get",
        "description": "Get specific development resource"
      },
      {
        "name": "development_create",
        "description": "Create new development resource"
      },
      {
        "name": "development_update",
        "description": "Update development resource"
      },
      {
        "name": "development_delete",
        "description": "Delete development resource"
      }
    ]
  },
  {
    "name": "mcp-server-aws",
    "port": 9028,
    "category": "cloud",
    "repo": "punkpeye/mcp-server-aws",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-aws/index.js"
      ],
      "env": {
        "PORT": "9028",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-aws",
        "MCP_SERVER_CATEGORY": "cloud"
      }
    },
    "tools": [
      {
        "name": "cloud_list",
        "description": "List cloud resources"
      },
      {
        "name": "cloud_get",
        "description": "Get specific cloud resource"
      },
      {
        "name": "cloud_create",
        "description": "Create new cloud resource"
      },
      {
        "name": "cloud_update",
        "description": "Update cloud resource"
      },
      {
        "name": "cloud_delete",
        "description": "Delete cloud resource"
      }
    ]
  },
  {
    "name": "mcp-server-gcp",
    "port": 9029,
    "category": "cloud",
    "repo": "punkpeye/mcp-server-gcp",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-gcp/index.js"
      ],
      "env": {
        "PORT": "9029",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-gcp",
        "MCP_SERVER_CATEGORY": "cloud"
      }
    },
    "tools": [
      {
        "name": "cloud_list",
        "description": "List cloud resources"
      },
      {
        "name": "cloud_get",
        "description": "Get specific cloud resource"
      },
      {
        "name": "cloud_create",
        "description": "Create new cloud resource"
      },
      {
        "name": "cloud_update",
        "description": "Update cloud resource"
      },
      {
        "name": "cloud_delete",
        "description": "Delete cloud resource"
      }
    ]
  },
  {
    "name": "mcp-server-azure",
    "port": 9030,
    "category": "cloud",
    "repo": "punkpeye/mcp-server-azure",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-azure/index.js"
      ],
      "env": {
        "PORT": "9030",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-azure",
        "MCP_SERVER_CATEGORY": "cloud"
      }
    },
    "tools": [
      {
        "name": "cloud_list",
        "description": "List cloud resources"
      },
      {
        "name": "cloud_get",
        "description": "Get specific cloud resource"
      },
      {
        "name": "cloud_create",
        "description": "Create new cloud resource"
      },
      {
        "name": "cloud_update",
        "description": "Update cloud resource"
      },
      {
        "name": "cloud_delete",
        "description": "Delete cloud resource"
      }
    ]
  },
  {
    "name": "mcp-server-digitalocean",
    "port": 9031,
    "category": "cloud",
    "repo": "punkpeye/mcp-server-digitalocean",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-digitalocean/index.js"
      ],
      "env": {
        "PORT": "9031",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-digitalocean",
        "MCP_SERVER_CATEGORY": "cloud"
      }
    },
    "tools": [
      {
        "name": "cloud_list",
        "description": "List cloud resources"
      },
      {
        "name": "cloud_get",
        "description": "Get specific cloud resource"
      },
      {
        "name": "cloud_create",
        "description": "Create new cloud resource"
      },
      {
        "name": "cloud_update",
        "description": "Update cloud resource"
      },
      {
        "name": "cloud_delete",
        "description": "Delete cloud resource"
      }
    ]
  },
  {
    "name": "mcp-server-heroku",
    "port": 9032,
    "category": "cloud",
    "repo": "punkpeye/mcp-server-heroku",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-heroku/index.js"
      ],
      "env": {
        "PORT": "9032",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-heroku",
        "MCP_SERVER_CATEGORY": "cloud"
      }
    },
    "tools": [
      {
        "name": "cloud_list",
        "description": "List cloud resources"
      },
      {
        "name": "cloud_get",
        "description": "Get specific cloud resource"
      },
      {
        "name": "cloud_create",
        "description": "Create new cloud resource"
      },
      {
        "name": "cloud_update",
        "description": "Update cloud resource"
      },
      {
        "name": "cloud_delete",
        "description": "Delete cloud resource"
      }
    ]
  },
  {
    "name": "mcp-server-vercel",
    "port": 9033,
    "category": "cloud",
    "repo": "punkpeye/mcp-server-vercel",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-vercel/index.js"
      ],
      "env": {
        "PORT": "9033",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-vercel",
        "MCP_SERVER_CATEGORY": "cloud"
      }
    },
    "tools": [
      {
        "name": "cloud_list",
        "description": "List cloud resources"
      },
      {
        "name": "cloud_get",
        "description": "Get specific cloud resource"
      },
      {
        "name": "cloud_create",
        "description": "Create new cloud resource"
      },
      {
        "name": "cloud_update",
        "description": "Update cloud resource"
      },
      {
        "name": "cloud_delete",
        "description": "Delete cloud resource"
      }
    ]
  },
  {
    "name": "mcp-server-netlify",
    "port": 9034,
    "category": "cloud",
    "repo": "punkpeye/mcp-server-netlify",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-netlify/index.js"
      ],
      "env": {
        "PORT": "9034",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-netlify",
        "MCP_SERVER_CATEGORY": "cloud"
      }
    },
    "tools": [
      {
        "name": "cloud_list",
        "description": "List cloud resources"
      },
      {
        "name": "cloud_get",
        "description": "Get specific cloud resource"
      },
      {
        "name": "cloud_create",
        "description": "Create new cloud resource"
      },
      {
        "name": "cloud_update",
        "description": "Update cloud resource"
      },
      {
        "name": "cloud_delete",
        "description": "Delete cloud resource"
      }
    ]
  },
  {
    "name": "mcp-server-filesystem",
    "port": 9035,
    "category": "filesystem",
    "repo": "modelcontextprotocol/servers/src/filesystem",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-filesystem/index.js"
      ],
      "env": {
        "PORT": "9035",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-filesystem",
        "MCP_SERVER_CATEGORY": "filesystem"
      }
    },
    "tools": [
      {
        "name": "filesystem_list",
        "description": "List filesystem resources"
      },
      {
        "name": "filesystem_get",
        "description": "Get specific filesystem resource"
      },
      {
        "name": "filesystem_create",
        "description": "Create new filesystem resource"
      },
      {
        "name": "filesystem_update",
        "description": "Update filesystem resource"
      },
      {
        "name": "filesystem_delete",
        "description": "Delete filesystem resource"
      }
    ]
  },
  {
    "name": "mcp-server-gdrive",
    "port": 9036,
    "category": "filesystem",
    "repo": "modelcontextprotocol/servers/src/gdrive",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-gdrive/index.js"
      ],
      "env": {
        "PORT": "9036",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-gdrive",
        "MCP_SERVER_CATEGORY": "filesystem"
      }
    },
    "tools": [
      {
        "name": "filesystem_list",
        "description": "List filesystem resources"
      },
      {
        "name": "filesystem_get",
        "description": "Get specific filesystem resource"
      },
      {
        "name": "filesystem_create",
        "description": "Create new filesystem resource"
      },
      {
        "name": "filesystem_update",
        "description": "Update filesystem resource"
      },
      {
        "name": "filesystem_delete",
        "description": "Delete filesystem resource"
      }
    ]
  },
  {
    "name": "mcp-server-dropbox",
    "port": 9037,
    "category": "filesystem",
    "repo": "punkpeye/mcp-server-dropbox",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-dropbox/index.js"
      ],
      "env": {
        "PORT": "9037",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-dropbox",
        "MCP_SERVER_CATEGORY": "filesystem"
      }
    },
    "tools": [
      {
        "name": "filesystem_list",
        "description": "List filesystem resources"
      },
      {
        "name": "filesystem_get",
        "description": "Get specific filesystem resource"
      },
      {
        "name": "filesystem_create",
        "description": "Create new filesystem resource"
      },
      {
        "name": "filesystem_update",
        "description": "Update filesystem resource"
      },
      {
        "name": "filesystem_delete",
        "description": "Delete filesystem resource"
      }
    ]
  },
  {
    "name": "mcp-server-onedrive",
    "port": 9038,
    "category": "filesystem",
    "repo": "punkpeye/mcp-server-onedrive",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-onedrive/index.js"
      ],
      "env": {
        "PORT": "9038",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-onedrive",
        "MCP_SERVER_CATEGORY": "filesystem"
      }
    },
    "tools": [
      {
        "name": "filesystem_list",
        "description": "List filesystem resources"
      },
      {
        "name": "filesystem_get",
        "description": "Get specific filesystem resource"
      },
      {
        "name": "filesystem_create",
        "description": "Create new filesystem resource"
      },
      {
        "name": "filesystem_update",
        "description": "Update filesystem resource"
      },
      {
        "name": "filesystem_delete",
        "description": "Delete filesystem resource"
      }
    ]
  },
  {
    "name": "mcp-server-box",
    "port": 9039,
    "category": "filesystem",
    "repo": "punkpeye/mcp-server-box",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-box/index.js"
      ],
      "env": {
        "PORT": "9039",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-box",
        "MCP_SERVER_CATEGORY": "filesystem"
      }
    },
    "tools": [
      {
        "name": "filesystem_list",
        "description": "List filesystem resources"
      },
      {
        "name": "filesystem_get",
        "description": "Get specific filesystem resource"
      },
      {
        "name": "filesystem_create",
        "description": "Create new filesystem resource"
      },
      {
        "name": "filesystem_update",
        "description": "Update filesystem resource"
      },
      {
        "name": "filesystem_delete",
        "description": "Delete filesystem resource"
      }
    ]
  },
  {
    "name": "mcp-server-fetch",
    "port": 9040,
    "category": "web",
    "repo": "modelcontextprotocol/servers/src/fetch",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-fetch/index.js"
      ],
      "env": {
        "PORT": "9040",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-fetch",
        "MCP_SERVER_CATEGORY": "web"
      }
    },
    "tools": [
      {
        "name": "web_list",
        "description": "List web resources"
      },
      {
        "name": "web_get",
        "description": "Get specific web resource"
      },
      {
        "name": "web_create",
        "description": "Create new web resource"
      },
      {
        "name": "web_update",
        "description": "Update web resource"
      },
      {
        "name": "web_delete",
        "description": "Delete web resource"
      }
    ]
  },
  {
    "name": "mcp-server-puppeteer",
    "port": 9041,
    "category": "web",
    "repo": "modelcontextprotocol/servers/src/puppeteer",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-puppeteer/index.js"
      ],
      "env": {
        "PORT": "9041",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-puppeteer",
        "MCP_SERVER_CATEGORY": "web"
      }
    },
    "tools": [
      {
        "name": "web_list",
        "description": "List web resources"
      },
      {
        "name": "web_get",
        "description": "Get specific web resource"
      },
      {
        "name": "web_create",
        "description": "Create new web resource"
      },
      {
        "name": "web_update",
        "description": "Update web resource"
      },
      {
        "name": "web_delete",
        "description": "Delete web resource"
      }
    ]
  },
  {
    "name": "mcp-server-playwright",
    "port": 9042,
    "category": "web",
    "repo": "punkpeye/mcp-server-playwright",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-playwright/index.js"
      ],
      "env": {
        "PORT": "9042",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-playwright",
        "MCP_SERVER_CATEGORY": "web"
      }
    },
    "tools": [
      {
        "name": "web_list",
        "description": "List web resources"
      },
      {
        "name": "web_get",
        "description": "Get specific web resource"
      },
      {
        "name": "web_create",
        "description": "Create new web resource"
      },
      {
        "name": "web_update",
        "description": "Update web resource"
      },
      {
        "name": "web_delete",
        "description": "Delete web resource"
      }
    ]
  },
  {
    "name": "mcp-server-selenium",
    "port": 9043,
    "category": "web",
    "repo": "punkpeye/mcp-server-selenium",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-selenium/index.js"
      ],
      "env": {
        "PORT": "9043",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-selenium",
        "MCP_SERVER_CATEGORY": "web"
      }
    },
    "tools": [
      {
        "name": "web_list",
        "description": "List web resources"
      },
      {
        "name": "web_get",
        "description": "Get specific web resource"
      },
      {
        "name": "web_create",
        "description": "Create new web resource"
      },
      {
        "name": "web_update",
        "description": "Update web resource"
      },
      {
        "name": "web_delete",
        "description": "Delete web resource"
      }
    ]
  },
  {
    "name": "mcp-server-curl",
    "port": 9044,
    "category": "web",
    "repo": "punkpeye/mcp-server-curl",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-curl/index.js"
      ],
      "env": {
        "PORT": "9044",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-curl",
        "MCP_SERVER_CATEGORY": "web"
      }
    },
    "tools": [
      {
        "name": "web_list",
        "description": "List web resources"
      },
      {
        "name": "web_get",
        "description": "Get specific web resource"
      },
      {
        "name": "web_create",
        "description": "Create new web resource"
      },
      {
        "name": "web_update",
        "description": "Update web resource"
      },
      {
        "name": "web_delete",
        "description": "Delete web resource"
      }
    ]
  },
  {
    "name": "mcp-server-postman",
    "port": 9045,
    "category": "web",
    "repo": "punkpeye/mcp-server-postman",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-postman/index.js"
      ],
      "env": {
        "PORT": "9045",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-postman",
        "MCP_SERVER_CATEGORY": "web"
      }
    },
    "tools": [
      {
        "name": "web_list",
        "description": "List web resources"
      },
      {
        "name": "web_get",
        "description": "Get specific web resource"
      },
      {
        "name": "web_create",
        "description": "Create new web resource"
      },
      {
        "name": "web_update",
        "description": "Update web resource"
      },
      {
        "name": "web_delete",
        "description": "Delete web resource"
      }
    ]
  },
  {
    "name": "mcp-server-google-analytics",
    "port": 9046,
    "category": "analytics",
    "repo": "punkpeye/mcp-server-google-analytics",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-google-analytics/index.js"
      ],
      "env": {
        "PORT": "9046",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-google-analytics",
        "MCP_SERVER_CATEGORY": "analytics"
      }
    },
    "tools": [
      {
        "name": "analytics_list",
        "description": "List analytics resources"
      },
      {
        "name": "analytics_get",
        "description": "Get specific analytics resource"
      },
      {
        "name": "analytics_create",
        "description": "Create new analytics resource"
      },
      {
        "name": "analytics_update",
        "description": "Update analytics resource"
      },
      {
        "name": "analytics_delete",
        "description": "Delete analytics resource"
      }
    ]
  },
  {
    "name": "mcp-server-mixpanel",
    "port": 9047,
    "category": "analytics",
    "repo": "punkpeye/mcp-server-mixpanel",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-mixpanel/index.js"
      ],
      "env": {
        "PORT": "9047",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-mixpanel",
        "MCP_SERVER_CATEGORY": "analytics"
      }
    },
    "tools": [
      {
        "name": "analytics_list",
        "description": "List analytics resources"
      },
      {
        "name": "analytics_get",
        "description": "Get specific analytics resource"
      },
      {
        "name": "analytics_create",
        "description": "Create new analytics resource"
      },
      {
        "name": "analytics_update",
        "description": "Update analytics resource"
      },
      {
        "name": "analytics_delete",
        "description": "Delete analytics resource"
      }
    ]
  },
  {
    "name": "mcp-server-amplitude",
    "port": 9048,
    "category": "analytics",
    "repo": "punkpeye/mcp-server-amplitude",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-amplitude/index.js"
      ],
      "env": {
        "PORT": "9048",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-amplitude",
        "MCP_SERVER_CATEGORY": "analytics"
      }
    },
    "tools": [
      {
        "name": "analytics_list",
        "description": "List analytics resources"
      },
      {
        "name": "analytics_get",
        "description": "Get specific analytics resource"
      },
      {
        "name": "analytics_create",
        "description": "Create new analytics resource"
      },
      {
        "name": "analytics_update",
        "description": "Update analytics resource"
      },
      {
        "name": "analytics_delete",
        "description": "Delete analytics resource"
      }
    ]
  },
  {
    "name": "mcp-server-datadog",
    "port": 9049,
    "category": "monitoring",
    "repo": "punkpeye/mcp-server-datadog",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-datadog/index.js"
      ],
      "env": {
        "PORT": "9049",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-datadog",
        "MCP_SERVER_CATEGORY": "monitoring"
      }
    },
    "tools": [
      {
        "name": "monitoring_list",
        "description": "List monitoring resources"
      },
      {
        "name": "monitoring_get",
        "description": "Get specific monitoring resource"
      },
      {
        "name": "monitoring_create",
        "description": "Create new monitoring resource"
      },
      {
        "name": "monitoring_update",
        "description": "Update monitoring resource"
      },
      {
        "name": "monitoring_delete",
        "description": "Delete monitoring resource"
      }
    ]
  },
  {
    "name": "mcp-server-newrelic",
    "port": 9050,
    "category": "monitoring",
    "repo": "punkpeye/mcp-server-newrelic",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-newrelic/index.js"
      ],
      "env": {
        "PORT": "9050",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-newrelic",
        "MCP_SERVER_CATEGORY": "monitoring"
      }
    },
    "tools": [
      {
        "name": "monitoring_list",
        "description": "List monitoring resources"
      },
      {
        "name": "monitoring_get",
        "description": "Get specific monitoring resource"
      },
      {
        "name": "monitoring_create",
        "description": "Create new monitoring resource"
      },
      {
        "name": "monitoring_update",
        "description": "Update monitoring resource"
      },
      {
        "name": "monitoring_delete",
        "description": "Delete monitoring resource"
      }
    ]
  },
  {
    "name": "mcp-server-grafana",
    "port": 9051,
    "category": "monitoring",
    "repo": "punkpeye/mcp-server-grafana",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-grafana/index.js"
      ],
      "env": {
        "PORT": "9051",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-grafana",
        "MCP_SERVER_CATEGORY": "monitoring"
      }
    },
    "tools": [
      {
        "name": "monitoring_list",
        "description": "List monitoring resources"
      },
      {
        "name": "monitoring_get",
        "description": "Get specific monitoring resource"
      },
      {
        "name": "monitoring_create",
        "description": "Create new monitoring resource"
      },
      {
        "name": "monitoring_update",
        "description": "Update monitoring resource"
      },
      {
        "name": "monitoring_delete",
        "description": "Delete monitoring resource"
      }
    ]
  },
  {
    "name": "mcp-server-shopify",
    "port": 9052,
    "category": "ecommerce",
    "repo": "punkpeye/mcp-server-shopify",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-shopify/index.js"
      ],
      "env": {
        "PORT": "9052",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-shopify",
        "MCP_SERVER_CATEGORY": "ecommerce"
      }
    },
    "tools": [
      {
        "name": "ecommerce_list",
        "description": "List ecommerce resources"
      },
      {
        "name": "ecommerce_get",
        "description": "Get specific ecommerce resource"
      },
      {
        "name": "ecommerce_create",
        "description": "Create new ecommerce resource"
      },
      {
        "name": "ecommerce_update",
        "description": "Update ecommerce resource"
      },
      {
        "name": "ecommerce_delete",
        "description": "Delete ecommerce resource"
      }
    ]
  },
  {
    "name": "mcp-server-woocommerce",
    "port": 9053,
    "category": "ecommerce",
    "repo": "punkpeye/mcp-server-woocommerce",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-woocommerce/index.js"
      ],
      "env": {
        "PORT": "9053",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-woocommerce",
        "MCP_SERVER_CATEGORY": "ecommerce"
      }
    },
    "tools": [
      {
        "name": "ecommerce_list",
        "description": "List ecommerce resources"
      },
      {
        "name": "ecommerce_get",
        "description": "Get specific ecommerce resource"
      },
      {
        "name": "ecommerce_create",
        "description": "Create new ecommerce resource"
      },
      {
        "name": "ecommerce_update",
        "description": "Update ecommerce resource"
      },
      {
        "name": "ecommerce_delete",
        "description": "Delete ecommerce resource"
      }
    ]
  },
  {
    "name": "mcp-server-magento",
    "port": 9054,
    "category": "ecommerce",
    "repo": "punkpeye/mcp-server-magento",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-magento/index.js"
      ],
      "env": {
        "PORT": "9054",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-magento",
        "MCP_SERVER_CATEGORY": "ecommerce"
      }
    },
    "tools": [
      {
        "name": "ecommerce_list",
        "description": "List ecommerce resources"
      },
      {
        "name": "ecommerce_get",
        "description": "Get specific ecommerce resource"
      },
      {
        "name": "ecommerce_create",
        "description": "Create new ecommerce resource"
      },
      {
        "name": "ecommerce_update",
        "description": "Update ecommerce resource"
      },
      {
        "name": "ecommerce_delete",
        "description": "Delete ecommerce resource"
      }
    ]
  },
  {
    "name": "mcp-server-stripe",
    "port": 9055,
    "category": "payment",
    "repo": "punkpeye/mcp-server-stripe",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-stripe/index.js"
      ],
      "env": {
        "PORT": "9055",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-stripe",
        "MCP_SERVER_CATEGORY": "payment"
      }
    },
    "tools": [
      {
        "name": "payment_list",
        "description": "List payment resources"
      },
      {
        "name": "payment_get",
        "description": "Get specific payment resource"
      },
      {
        "name": "payment_create",
        "description": "Create new payment resource"
      },
      {
        "name": "payment_update",
        "description": "Update payment resource"
      },
      {
        "name": "payment_delete",
        "description": "Delete payment resource"
      }
    ]
  },
  {
    "name": "mcp-server-paypal",
    "port": 9056,
    "category": "payment",
    "repo": "punkpeye/mcp-server-paypal",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-paypal/index.js"
      ],
      "env": {
        "PORT": "9056",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-paypal",
        "MCP_SERVER_CATEGORY": "payment"
      }
    },
    "tools": [
      {
        "name": "payment_list",
        "description": "List payment resources"
      },
      {
        "name": "payment_get",
        "description": "Get specific payment resource"
      },
      {
        "name": "payment_create",
        "description": "Create new payment resource"
      },
      {
        "name": "payment_update",
        "description": "Update payment resource"
      },
      {
        "name": "payment_delete",
        "description": "Delete payment resource"
      }
    ]
  },
  {
    "name": "mcp-server-twitter",
    "port": 9057,
    "category": "social",
    "repo": "punkpeye/mcp-server-twitter",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-twitter/index.js"
      ],
      "env": {
        "PORT": "9057",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-twitter",
        "MCP_SERVER_CATEGORY": "social"
      }
    },
    "tools": [
      {
        "name": "social_list",
        "description": "List social resources"
      },
      {
        "name": "social_get",
        "description": "Get specific social resource"
      },
      {
        "name": "social_create",
        "description": "Create new social resource"
      },
      {
        "name": "social_update",
        "description": "Update social resource"
      },
      {
        "name": "social_delete",
        "description": "Delete social resource"
      }
    ]
  },
  {
    "name": "mcp-server-facebook",
    "port": 9058,
    "category": "social",
    "repo": "punkpeye/mcp-server-facebook",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-facebook/index.js"
      ],
      "env": {
        "PORT": "9058",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-facebook",
        "MCP_SERVER_CATEGORY": "social"
      }
    },
    "tools": [
      {
        "name": "social_list",
        "description": "List social resources"
      },
      {
        "name": "social_get",
        "description": "Get specific social resource"
      },
      {
        "name": "social_create",
        "description": "Create new social resource"
      },
      {
        "name": "social_update",
        "description": "Update social resource"
      },
      {
        "name": "social_delete",
        "description": "Delete social resource"
      }
    ]
  },
  {
    "name": "mcp-server-instagram",
    "port": 9059,
    "category": "social",
    "repo": "punkpeye/mcp-server-instagram",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-instagram/index.js"
      ],
      "env": {
        "PORT": "9059",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-instagram",
        "MCP_SERVER_CATEGORY": "social"
      }
    },
    "tools": [
      {
        "name": "social_list",
        "description": "List social resources"
      },
      {
        "name": "social_get",
        "description": "Get specific social resource"
      },
      {
        "name": "social_create",
        "description": "Create new social resource"
      },
      {
        "name": "social_update",
        "description": "Update social resource"
      },
      {
        "name": "social_delete",
        "description": "Delete social resource"
      }
    ]
  },
  {
    "name": "mcp-server-linkedin",
    "port": 9060,
    "category": "social",
    "repo": "punkpeye/mcp-server-linkedin",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-linkedin/index.js"
      ],
      "env": {
        "PORT": "9060",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-linkedin",
        "MCP_SERVER_CATEGORY": "social"
      }
    },
    "tools": [
      {
        "name": "social_list",
        "description": "List social resources"
      },
      {
        "name": "social_get",
        "description": "Get specific social resource"
      },
      {
        "name": "social_create",
        "description": "Create new social resource"
      },
      {
        "name": "social_update",
        "description": "Update social resource"
      },
      {
        "name": "social_delete",
        "description": "Delete social resource"
      }
    ]
  },
  {
    "name": "mcp-server-youtube",
    "port": 9061,
    "category": "social",
    "repo": "punkpeye/mcp-server-youtube",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-youtube/index.js"
      ],
      "env": {
        "PORT": "9061",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-youtube",
        "MCP_SERVER_CATEGORY": "social"
      }
    },
    "tools": [
      {
        "name": "social_list",
        "description": "List social resources"
      },
      {
        "name": "social_get",
        "description": "Get specific social resource"
      },
      {
        "name": "social_create",
        "description": "Create new social resource"
      },
      {
        "name": "social_update",
        "description": "Update social resource"
      },
      {
        "name": "social_delete",
        "description": "Delete social resource"
      }
    ]
  },
  {
    "name": "mcp-server-openai",
    "port": 9062,
    "category": "ai",
    "repo": "punkpeye/mcp-server-openai",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-openai/index.js"
      ],
      "env": {
        "PORT": "9062",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-openai",
        "MCP_SERVER_CATEGORY": "ai"
      }
    },
    "tools": [
      {
        "name": "ai_list",
        "description": "List ai resources"
      },
      {
        "name": "ai_get",
        "description": "Get specific ai resource"
      },
      {
        "name": "ai_create",
        "description": "Create new ai resource"
      },
      {
        "name": "ai_update",
        "description": "Update ai resource"
      },
      {
        "name": "ai_delete",
        "description": "Delete ai resource"
      }
    ]
  },
  {
    "name": "mcp-server-anthropic",
    "port": 9063,
    "category": "ai",
    "repo": "punkpeye/mcp-server-anthropic",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-anthropic/index.js"
      ],
      "env": {
        "PORT": "9063",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-anthropic",
        "MCP_SERVER_CATEGORY": "ai"
      }
    },
    "tools": [
      {
        "name": "ai_list",
        "description": "List ai resources"
      },
      {
        "name": "ai_get",
        "description": "Get specific ai resource"
      },
      {
        "name": "ai_create",
        "description": "Create new ai resource"
      },
      {
        "name": "ai_update",
        "description": "Update ai resource"
      },
      {
        "name": "ai_delete",
        "description": "Delete ai resource"
      }
    ]
  },
  {
    "name": "mcp-server-huggingface",
    "port": 9064,
    "category": "ai",
    "repo": "punkpeye/mcp-server-huggingface",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-huggingface/index.js"
      ],
      "env": {
        "PORT": "9064",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-huggingface",
        "MCP_SERVER_CATEGORY": "ai"
      }
    },
    "tools": [
      {
        "name": "ai_list",
        "description": "List ai resources"
      },
      {
        "name": "ai_get",
        "description": "Get specific ai resource"
      },
      {
        "name": "ai_create",
        "description": "Create new ai resource"
      },
      {
        "name": "ai_update",
        "description": "Update ai resource"
      },
      {
        "name": "ai_delete",
        "description": "Delete ai resource"
      }
    ]
  },
  {
    "name": "mcp-server-tensorflow",
    "port": 9065,
    "category": "ai",
    "repo": "punkpeye/mcp-server-tensorflow",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-tensorflow/index.js"
      ],
      "env": {
        "PORT": "9065",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-tensorflow",
        "MCP_SERVER_CATEGORY": "ai"
      }
    },
    "tools": [
      {
        "name": "ai_list",
        "description": "List ai resources"
      },
      {
        "name": "ai_get",
        "description": "Get specific ai resource"
      },
      {
        "name": "ai_create",
        "description": "Create new ai resource"
      },
      {
        "name": "ai_update",
        "description": "Update ai resource"
      },
      {
        "name": "ai_delete",
        "description": "Delete ai resource"
      }
    ]
  },
  {
    "name": "mcp-server-pytorch",
    "port": 9066,
    "category": "ai",
    "repo": "punkpeye/mcp-server-pytorch",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-pytorch/index.js"
      ],
      "env": {
        "PORT": "9066",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-pytorch",
        "MCP_SERVER_CATEGORY": "ai"
      }
    },
    "tools": [
      {
        "name": "ai_list",
        "description": "List ai resources"
      },
      {
        "name": "ai_get",
        "description": "Get specific ai resource"
      },
      {
        "name": "ai_create",
        "description": "Create new ai resource"
      },
      {
        "name": "ai_update",
        "description": "Update ai resource"
      },
      {
        "name": "ai_delete",
        "description": "Delete ai resource"
      }
    ]
  },
  {
    "name": "mcp-server-gmail",
    "port": 9067,
    "category": "email",
    "repo": "punkpeye/mcp-server-gmail",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-gmail/index.js"
      ],
      "env": {
        "PORT": "9067",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-gmail",
        "MCP_SERVER_CATEGORY": "email"
      }
    },
    "tools": [
      {
        "name": "email_list",
        "description": "List email resources"
      },
      {
        "name": "email_get",
        "description": "Get specific email resource"
      },
      {
        "name": "email_create",
        "description": "Create new email resource"
      },
      {
        "name": "email_update",
        "description": "Update email resource"
      },
      {
        "name": "email_delete",
        "description": "Delete email resource"
      }
    ]
  },
  {
    "name": "mcp-server-outlook",
    "port": 9068,
    "category": "email",
    "repo": "punkpeye/mcp-server-outlook",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-outlook/index.js"
      ],
      "env": {
        "PORT": "9068",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-outlook",
        "MCP_SERVER_CATEGORY": "email"
      }
    },
    "tools": [
      {
        "name": "email_list",
        "description": "List email resources"
      },
      {
        "name": "email_get",
        "description": "Get specific email resource"
      },
      {
        "name": "email_create",
        "description": "Create new email resource"
      },
      {
        "name": "email_update",
        "description": "Update email resource"
      },
      {
        "name": "email_delete",
        "description": "Delete email resource"
      }
    ]
  },
  {
    "name": "mcp-server-sendgrid",
    "port": 9069,
    "category": "email",
    "repo": "punkpeye/mcp-server-sendgrid",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-sendgrid/index.js"
      ],
      "env": {
        "PORT": "9069",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-sendgrid",
        "MCP_SERVER_CATEGORY": "email"
      }
    },
    "tools": [
      {
        "name": "email_list",
        "description": "List email resources"
      },
      {
        "name": "email_get",
        "description": "Get specific email resource"
      },
      {
        "name": "email_create",
        "description": "Create new email resource"
      },
      {
        "name": "email_update",
        "description": "Update email resource"
      },
      {
        "name": "email_delete",
        "description": "Delete email resource"
      }
    ]
  },
  {
    "name": "mcp-server-mailchimp",
    "port": 9070,
    "category": "email",
    "repo": "punkpeye/mcp-server-mailchimp",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-mailchimp/index.js"
      ],
      "env": {
        "PORT": "9070",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-mailchimp",
        "MCP_SERVER_CATEGORY": "email"
      }
    },
    "tools": [
      {
        "name": "email_list",
        "description": "List email resources"
      },
      {
        "name": "email_get",
        "description": "Get specific email resource"
      },
      {
        "name": "email_create",
        "description": "Create new email resource"
      },
      {
        "name": "email_update",
        "description": "Update email resource"
      },
      {
        "name": "email_delete",
        "description": "Delete email resource"
      }
    ]
  },
  {
    "name": "mcp-server-salesforce",
    "port": 9071,
    "category": "crm",
    "repo": "punkpeye/mcp-server-salesforce",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-salesforce/index.js"
      ],
      "env": {
        "PORT": "9071",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-salesforce",
        "MCP_SERVER_CATEGORY": "crm"
      }
    },
    "tools": [
      {
        "name": "crm_list",
        "description": "List crm resources"
      },
      {
        "name": "crm_get",
        "description": "Get specific crm resource"
      },
      {
        "name": "crm_create",
        "description": "Create new crm resource"
      },
      {
        "name": "crm_update",
        "description": "Update crm resource"
      },
      {
        "name": "crm_delete",
        "description": "Delete crm resource"
      }
    ]
  },
  {
    "name": "mcp-server-hubspot",
    "port": 9072,
    "category": "crm",
    "repo": "punkpeye/mcp-server-hubspot",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-hubspot/index.js"
      ],
      "env": {
        "PORT": "9072",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-hubspot",
        "MCP_SERVER_CATEGORY": "crm"
      }
    },
    "tools": [
      {
        "name": "crm_list",
        "description": "List crm resources"
      },
      {
        "name": "crm_get",
        "description": "Get specific crm resource"
      },
      {
        "name": "crm_create",
        "description": "Create new crm resource"
      },
      {
        "name": "crm_update",
        "description": "Update crm resource"
      },
      {
        "name": "crm_delete",
        "description": "Delete crm resource"
      }
    ]
  },
  {
    "name": "mcp-server-pipedrive",
    "port": 9073,
    "category": "crm",
    "repo": "punkpeye/mcp-server-pipedrive",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-pipedrive/index.js"
      ],
      "env": {
        "PORT": "9073",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-pipedrive",
        "MCP_SERVER_CATEGORY": "crm"
      }
    },
    "tools": [
      {
        "name": "crm_list",
        "description": "List crm resources"
      },
      {
        "name": "crm_get",
        "description": "Get specific crm resource"
      },
      {
        "name": "crm_create",
        "description": "Create new crm resource"
      },
      {
        "name": "crm_update",
        "description": "Update crm resource"
      },
      {
        "name": "crm_delete",
        "description": "Delete crm resource"
      }
    ]
  },
  {
    "name": "mcp-server-zoho",
    "port": 9074,
    "category": "crm",
    "repo": "punkpeye/mcp-server-zoho",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-zoho/index.js"
      ],
      "env": {
        "PORT": "9074",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-zoho",
        "MCP_SERVER_CATEGORY": "crm"
      }
    },
    "tools": [
      {
        "name": "crm_list",
        "description": "List crm resources"
      },
      {
        "name": "crm_get",
        "description": "Get specific crm resource"
      },
      {
        "name": "crm_create",
        "description": "Create new crm resource"
      },
      {
        "name": "crm_update",
        "description": "Update crm resource"
      },
      {
        "name": "crm_delete",
        "description": "Delete crm resource"
      }
    ]
  },
  {
    "name": "mcp-server-wordpress",
    "port": 9075,
    "category": "cms",
    "repo": "punkpeye/mcp-server-wordpress",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-wordpress/index.js"
      ],
      "env": {
        "PORT": "9075",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-wordpress",
        "MCP_SERVER_CATEGORY": "cms"
      }
    },
    "tools": [
      {
        "name": "cms_list",
        "description": "List cms resources"
      },
      {
        "name": "cms_get",
        "description": "Get specific cms resource"
      },
      {
        "name": "cms_create",
        "description": "Create new cms resource"
      },
      {
        "name": "cms_update",
        "description": "Update cms resource"
      },
      {
        "name": "cms_delete",
        "description": "Delete cms resource"
      }
    ]
  },
  {
    "name": "mcp-server-drupal",
    "port": 9076,
    "category": "cms",
    "repo": "punkpeye/mcp-server-drupal",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-drupal/index.js"
      ],
      "env": {
        "PORT": "9076",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-drupal",
        "MCP_SERVER_CATEGORY": "cms"
      }
    },
    "tools": [
      {
        "name": "cms_list",
        "description": "List cms resources"
      },
      {
        "name": "cms_get",
        "description": "Get specific cms resource"
      },
      {
        "name": "cms_create",
        "description": "Create new cms resource"
      },
      {
        "name": "cms_update",
        "description": "Update cms resource"
      },
      {
        "name": "cms_delete",
        "description": "Delete cms resource"
      }
    ]
  },
  {
    "name": "mcp-server-contentful",
    "port": 9077,
    "category": "cms",
    "repo": "punkpeye/mcp-server-contentful",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-contentful/index.js"
      ],
      "env": {
        "PORT": "9077",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-contentful",
        "MCP_SERVER_CATEGORY": "cms"
      }
    },
    "tools": [
      {
        "name": "cms_list",
        "description": "List cms resources"
      },
      {
        "name": "cms_get",
        "description": "Get specific cms resource"
      },
      {
        "name": "cms_create",
        "description": "Create new cms resource"
      },
      {
        "name": "cms_update",
        "description": "Update cms resource"
      },
      {
        "name": "cms_delete",
        "description": "Delete cms resource"
      }
    ]
  },
  {
    "name": "mcp-server-strapi",
    "port": 9078,
    "category": "cms",
    "repo": "punkpeye/mcp-server-strapi",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-strapi/index.js"
      ],
      "env": {
        "PORT": "9078",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-strapi",
        "MCP_SERVER_CATEGORY": "cms"
      }
    },
    "tools": [
      {
        "name": "cms_list",
        "description": "List cms resources"
      },
      {
        "name": "cms_get",
        "description": "Get specific cms resource"
      },
      {
        "name": "cms_create",
        "description": "Create new cms resource"
      },
      {
        "name": "cms_update",
        "description": "Update cms resource"
      },
      {
        "name": "cms_delete",
        "description": "Delete cms resource"
      }
    ]
  },
  {
    "name": "mcp-server-1password",
    "port": 9079,
    "category": "security",
    "repo": "punkpeye/mcp-server-1password",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-1password/index.js"
      ],
      "env": {
        "PORT": "9079",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-1password",
        "MCP_SERVER_CATEGORY": "security"
      }
    },
    "tools": [
      {
        "name": "security_list",
        "description": "List security resources"
      },
      {
        "name": "security_get",
        "description": "Get specific security resource"
      },
      {
        "name": "security_create",
        "description": "Create new security resource"
      },
      {
        "name": "security_update",
        "description": "Update security resource"
      },
      {
        "name": "security_delete",
        "description": "Delete security resource"
      }
    ]
  },
  {
    "name": "mcp-server-bitwarden",
    "port": 9080,
    "category": "security",
    "repo": "punkpeye/mcp-server-bitwarden",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-bitwarden/index.js"
      ],
      "env": {
        "PORT": "9080",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-bitwarden",
        "MCP_SERVER_CATEGORY": "security"
      }
    },
    "tools": [
      {
        "name": "security_list",
        "description": "List security resources"
      },
      {
        "name": "security_get",
        "description": "Get specific security resource"
      },
      {
        "name": "security_create",
        "description": "Create new security resource"
      },
      {
        "name": "security_update",
        "description": "Update security resource"
      },
      {
        "name": "security_delete",
        "description": "Delete security resource"
      }
    ]
  },
  {
    "name": "mcp-server-lastpass",
    "port": 9081,
    "category": "security",
    "repo": "punkpeye/mcp-server-lastpass",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-lastpass/index.js"
      ],
      "env": {
        "PORT": "9081",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-lastpass",
        "MCP_SERVER_CATEGORY": "security"
      }
    },
    "tools": [
      {
        "name": "security_list",
        "description": "List security resources"
      },
      {
        "name": "security_get",
        "description": "Get specific security resource"
      },
      {
        "name": "security_create",
        "description": "Create new security resource"
      },
      {
        "name": "security_update",
        "description": "Update security resource"
      },
      {
        "name": "security_delete",
        "description": "Delete security resource"
      }
    ]
  },
  {
    "name": "mcp-server-vault",
    "port": 9082,
    "category": "security",
    "repo": "punkpeye/mcp-server-vault",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-vault/index.js"
      ],
      "env": {
        "PORT": "9082",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-vault",
        "MCP_SERVER_CATEGORY": "security"
      }
    },
    "tools": [
      {
        "name": "security_list",
        "description": "List security resources"
      },
      {
        "name": "security_get",
        "description": "Get specific security resource"
      },
      {
        "name": "security_create",
        "description": "Create new security resource"
      },
      {
        "name": "security_update",
        "description": "Update security resource"
      },
      {
        "name": "security_delete",
        "description": "Delete security resource"
      }
    ]
  },
  {
    "name": "mcp-server-quickbooks",
    "port": 9083,
    "category": "finance",
    "repo": "punkpeye/mcp-server-quickbooks",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-quickbooks/index.js"
      ],
      "env": {
        "PORT": "9083",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-quickbooks",
        "MCP_SERVER_CATEGORY": "finance"
      }
    },
    "tools": [
      {
        "name": "finance_list",
        "description": "List finance resources"
      },
      {
        "name": "finance_get",
        "description": "Get specific finance resource"
      },
      {
        "name": "finance_create",
        "description": "Create new finance resource"
      },
      {
        "name": "finance_update",
        "description": "Update finance resource"
      },
      {
        "name": "finance_delete",
        "description": "Delete finance resource"
      }
    ]
  },
  {
    "name": "mcp-server-xero",
    "port": 9084,
    "category": "finance",
    "repo": "punkpeye/mcp-server-xero",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-xero/index.js"
      ],
      "env": {
        "PORT": "9084",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-xero",
        "MCP_SERVER_CATEGORY": "finance"
      }
    },
    "tools": [
      {
        "name": "finance_list",
        "description": "List finance resources"
      },
      {
        "name": "finance_get",
        "description": "Get specific finance resource"
      },
      {
        "name": "finance_create",
        "description": "Create new finance resource"
      },
      {
        "name": "finance_update",
        "description": "Update finance resource"
      },
      {
        "name": "finance_delete",
        "description": "Delete finance resource"
      }
    ]
  },
  {
    "name": "mcp-server-freshbooks",
    "port": 9085,
    "category": "finance",
    "repo": "punkpeye/mcp-server-freshbooks",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-freshbooks/index.js"
      ],
      "env": {
        "PORT": "9085",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-freshbooks",
        "MCP_SERVER_CATEGORY": "finance"
      }
    },
    "tools": [
      {
        "name": "finance_list",
        "description": "List finance resources"
      },
      {
        "name": "finance_get",
        "description": "Get specific finance resource"
      },
      {
        "name": "finance_create",
        "description": "Create new finance resource"
      },
      {
        "name": "finance_update",
        "description": "Update finance resource"
      },
      {
        "name": "finance_delete",
        "description": "Delete finance resource"
      }
    ]
  },
  {
    "name": "mcp-server-wave",
    "port": 9086,
    "category": "finance",
    "repo": "punkpeye/mcp-server-wave",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-wave/index.js"
      ],
      "env": {
        "PORT": "9086",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-wave",
        "MCP_SERVER_CATEGORY": "finance"
      }
    },
    "tools": [
      {
        "name": "finance_list",
        "description": "List finance resources"
      },
      {
        "name": "finance_get",
        "description": "Get specific finance resource"
      },
      {
        "name": "finance_create",
        "description": "Create new finance resource"
      },
      {
        "name": "finance_update",
        "description": "Update finance resource"
      },
      {
        "name": "finance_delete",
        "description": "Delete finance resource"
      }
    ]
  },
  {
    "name": "mcp-server-figma",
    "port": 9087,
    "category": "design",
    "repo": "punkpeye/mcp-server-figma",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-figma/index.js"
      ],
      "env": {
        "PORT": "9087",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-figma",
        "MCP_SERVER_CATEGORY": "design"
      }
    },
    "tools": [
      {
        "name": "design_list",
        "description": "List design resources"
      },
      {
        "name": "design_get",
        "description": "Get specific design resource"
      },
      {
        "name": "design_create",
        "description": "Create new design resource"
      },
      {
        "name": "design_update",
        "description": "Update design resource"
      },
      {
        "name": "design_delete",
        "description": "Delete design resource"
      }
    ]
  },
  {
    "name": "mcp-server-sketch",
    "port": 9088,
    "category": "design",
    "repo": "punkpeye/mcp-server-sketch",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-sketch/index.js"
      ],
      "env": {
        "PORT": "9088",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-sketch",
        "MCP_SERVER_CATEGORY": "design"
      }
    },
    "tools": [
      {
        "name": "design_list",
        "description": "List design resources"
      },
      {
        "name": "design_get",
        "description": "Get specific design resource"
      },
      {
        "name": "design_create",
        "description": "Create new design resource"
      },
      {
        "name": "design_update",
        "description": "Update design resource"
      },
      {
        "name": "design_delete",
        "description": "Delete design resource"
      }
    ]
  },
  {
    "name": "mcp-server-adobe",
    "port": 9089,
    "category": "design",
    "repo": "punkpeye/mcp-server-adobe",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-adobe/index.js"
      ],
      "env": {
        "PORT": "9089",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-adobe",
        "MCP_SERVER_CATEGORY": "design"
      }
    },
    "tools": [
      {
        "name": "design_list",
        "description": "List design resources"
      },
      {
        "name": "design_get",
        "description": "Get specific design resource"
      },
      {
        "name": "design_create",
        "description": "Create new design resource"
      },
      {
        "name": "design_update",
        "description": "Update design resource"
      },
      {
        "name": "design_delete",
        "description": "Delete design resource"
      }
    ]
  },
  {
    "name": "mcp-server-canva",
    "port": 9090,
    "category": "design",
    "repo": "punkpeye/mcp-server-canva",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-canva/index.js"
      ],
      "env": {
        "PORT": "9090",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-canva",
        "MCP_SERVER_CATEGORY": "design"
      }
    },
    "tools": [
      {
        "name": "design_list",
        "description": "List design resources"
      },
      {
        "name": "design_get",
        "description": "Get specific design resource"
      },
      {
        "name": "design_create",
        "description": "Create new design resource"
      },
      {
        "name": "design_update",
        "description": "Update design resource"
      },
      {
        "name": "design_delete",
        "description": "Delete design resource"
      }
    ]
  },
  {
    "name": "mcp-server-toggl",
    "port": 9091,
    "category": "time-tracking",
    "repo": "punkpeye/mcp-server-toggl",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-toggl/index.js"
      ],
      "env": {
        "PORT": "9091",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-toggl",
        "MCP_SERVER_CATEGORY": "time-tracking"
      }
    },
    "tools": [
      {
        "name": "time-tracking_list",
        "description": "List time-tracking resources"
      },
      {
        "name": "time-tracking_get",
        "description": "Get specific time-tracking resource"
      },
      {
        "name": "time-tracking_create",
        "description": "Create new time-tracking resource"
      },
      {
        "name": "time-tracking_update",
        "description": "Update time-tracking resource"
      },
      {
        "name": "time-tracking_delete",
        "description": "Delete time-tracking resource"
      }
    ]
  },
  {
    "name": "mcp-server-harvest",
    "port": 9092,
    "category": "time-tracking",
    "repo": "punkpeye/mcp-server-harvest",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-harvest/index.js"
      ],
      "env": {
        "PORT": "9092",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-harvest",
        "MCP_SERVER_CATEGORY": "time-tracking"
      }
    },
    "tools": [
      {
        "name": "time-tracking_list",
        "description": "List time-tracking resources"
      },
      {
        "name": "time-tracking_get",
        "description": "Get specific time-tracking resource"
      },
      {
        "name": "time-tracking_create",
        "description": "Create new time-tracking resource"
      },
      {
        "name": "time-tracking_update",
        "description": "Update time-tracking resource"
      },
      {
        "name": "time-tracking_delete",
        "description": "Delete time-tracking resource"
      }
    ]
  },
  {
    "name": "mcp-server-clockify",
    "port": 9093,
    "category": "time-tracking",
    "repo": "punkpeye/mcp-server-clockify",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-clockify/index.js"
      ],
      "env": {
        "PORT": "9093",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-clockify",
        "MCP_SERVER_CATEGORY": "time-tracking"
      }
    },
    "tools": [
      {
        "name": "time-tracking_list",
        "description": "List time-tracking resources"
      },
      {
        "name": "time-tracking_get",
        "description": "Get specific time-tracking resource"
      },
      {
        "name": "time-tracking_create",
        "description": "Create new time-tracking resource"
      },
      {
        "name": "time-tracking_update",
        "description": "Update time-tracking resource"
      },
      {
        "name": "time-tracking_delete",
        "description": "Delete time-tracking resource"
      }
    ]
  },
  {
    "name": "mcp-server-rescuetime",
    "port": 9094,
    "category": "time-tracking",
    "repo": "punkpeye/mcp-server-rescuetime",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-rescuetime/index.js"
      ],
      "env": {
        "PORT": "9094",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-rescuetime",
        "MCP_SERVER_CATEGORY": "time-tracking"
      }
    },
    "tools": [
      {
        "name": "time-tracking_list",
        "description": "List time-tracking resources"
      },
      {
        "name": "time-tracking_get",
        "description": "Get specific time-tracking resource"
      },
      {
        "name": "time-tracking_create",
        "description": "Create new time-tracking resource"
      },
      {
        "name": "time-tracking_update",
        "description": "Update time-tracking resource"
      },
      {
        "name": "time-tracking_delete",
        "description": "Delete time-tracking resource"
      }
    ]
  },
  {
    "name": "mcp-server-google-calendar",
    "port": 9095,
    "category": "calendar",
    "repo": "punkpeye/mcp-server-google-calendar",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-google-calendar/index.js"
      ],
      "env": {
        "PORT": "9095",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-google-calendar",
        "MCP_SERVER_CATEGORY": "calendar"
      }
    },
    "tools": [
      {
        "name": "calendar_list",
        "description": "List calendar resources"
      },
      {
        "name": "calendar_get",
        "description": "Get specific calendar resource"
      },
      {
        "name": "calendar_create",
        "description": "Create new calendar resource"
      },
      {
        "name": "calendar_update",
        "description": "Update calendar resource"
      },
      {
        "name": "calendar_delete",
        "description": "Delete calendar resource"
      }
    ]
  },
  {
    "name": "mcp-server-outlook-calendar",
    "port": 9096,
    "category": "calendar",
    "repo": "punkpeye/mcp-server-outlook-calendar",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-outlook-calendar/index.js"
      ],
      "env": {
        "PORT": "9096",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-outlook-calendar",
        "MCP_SERVER_CATEGORY": "calendar"
      }
    },
    "tools": [
      {
        "name": "calendar_list",
        "description": "List calendar resources"
      },
      {
        "name": "calendar_get",
        "description": "Get specific calendar resource"
      },
      {
        "name": "calendar_create",
        "description": "Create new calendar resource"
      },
      {
        "name": "calendar_update",
        "description": "Update calendar resource"
      },
      {
        "name": "calendar_delete",
        "description": "Delete calendar resource"
      }
    ]
  },
  {
    "name": "mcp-server-calendly",
    "port": 9097,
    "category": "calendar",
    "repo": "punkpeye/mcp-server-calendly",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-calendly/index.js"
      ],
      "env": {
        "PORT": "9097",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-calendly",
        "MCP_SERVER_CATEGORY": "calendar"
      }
    },
    "tools": [
      {
        "name": "calendar_list",
        "description": "List calendar resources"
      },
      {
        "name": "calendar_get",
        "description": "Get specific calendar resource"
      },
      {
        "name": "calendar_create",
        "description": "Create new calendar resource"
      },
      {
        "name": "calendar_update",
        "description": "Update calendar resource"
      },
      {
        "name": "calendar_delete",
        "description": "Delete calendar resource"
      }
    ]
  },
  {
    "name": "mcp-server-acuity",
    "port": 9098,
    "category": "calendar",
    "repo": "punkpeye/mcp-server-acuity",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-acuity/index.js"
      ],
      "env": {
        "PORT": "9098",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-acuity",
        "MCP_SERVER_CATEGORY": "calendar"
      }
    },
    "tools": [
      {
        "name": "calendar_list",
        "description": "List calendar resources"
      },
      {
        "name": "calendar_get",
        "description": "Get specific calendar resource"
      },
      {
        "name": "calendar_create",
        "description": "Create new calendar resource"
      },
      {
        "name": "calendar_update",
        "description": "Update calendar resource"
      },
      {
        "name": "calendar_delete",
        "description": "Delete calendar resource"
      }
    ]
  },
  {
    "name": "mcp-server-weather",
    "port": 9099,
    "category": "weather",
    "repo": "modelcontextprotocol/servers/src/weather",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-weather/index.js"
      ],
      "env": {
        "PORT": "9099",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-weather",
        "MCP_SERVER_CATEGORY": "weather"
      }
    },
    "tools": [
      {
        "name": "weather_list",
        "description": "List weather resources"
      },
      {
        "name": "weather_get",
        "description": "Get specific weather resource"
      },
      {
        "name": "weather_create",
        "description": "Create new weather resource"
      },
      {
        "name": "weather_update",
        "description": "Update weather resource"
      },
      {
        "name": "weather_delete",
        "description": "Delete weather resource"
      }
    ]
  },
  {
    "name": "mcp-server-maps",
    "port": 9100,
    "category": "location",
    "repo": "punkpeye/mcp-server-maps",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-maps/index.js"
      ],
      "env": {
        "PORT": "9100",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-maps",
        "MCP_SERVER_CATEGORY": "location"
      }
    },
    "tools": [
      {
        "name": "location_list",
        "description": "List location resources"
      },
      {
        "name": "location_get",
        "description": "Get specific location resource"
      },
      {
        "name": "location_create",
        "description": "Create new location resource"
      },
      {
        "name": "location_update",
        "description": "Update location resource"
      },
      {
        "name": "location_delete",
        "description": "Delete location resource"
      }
    ]
  },
  {
    "name": "mcp-server-geocoding",
    "port": 9101,
    "category": "location",
    "repo": "punkpeye/mcp-server-geocoding",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-geocoding/index.js"
      ],
      "env": {
        "PORT": "9101",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-geocoding",
        "MCP_SERVER_CATEGORY": "location"
      }
    },
    "tools": [
      {
        "name": "location_list",
        "description": "List location resources"
      },
      {
        "name": "location_get",
        "description": "Get specific location resource"
      },
      {
        "name": "location_create",
        "description": "Create new location resource"
      },
      {
        "name": "location_update",
        "description": "Update location resource"
      },
      {
        "name": "location_delete",
        "description": "Delete location resource"
      }
    ]
  },
  {
    "name": "mcp-server-news",
    "port": 9102,
    "category": "media",
    "repo": "punkpeye/mcp-server-news",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-news/index.js"
      ],
      "env": {
        "PORT": "9102",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-news",
        "MCP_SERVER_CATEGORY": "media"
      }
    },
    "tools": [
      {
        "name": "media_list",
        "description": "List media resources"
      },
      {
        "name": "media_get",
        "description": "Get specific media resource"
      },
      {
        "name": "media_create",
        "description": "Create new media resource"
      },
      {
        "name": "media_update",
        "description": "Update media resource"
      },
      {
        "name": "media_delete",
        "description": "Delete media resource"
      }
    ]
  },
  {
    "name": "mcp-server-rss",
    "port": 9103,
    "category": "media",
    "repo": "punkpeye/mcp-server-rss",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-rss/index.js"
      ],
      "env": {
        "PORT": "9103",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-rss",
        "MCP_SERVER_CATEGORY": "media"
      }
    },
    "tools": [
      {
        "name": "media_list",
        "description": "List media resources"
      },
      {
        "name": "media_get",
        "description": "Get specific media resource"
      },
      {
        "name": "media_create",
        "description": "Create new media resource"
      },
      {
        "name": "media_update",
        "description": "Update media resource"
      },
      {
        "name": "media_delete",
        "description": "Delete media resource"
      }
    ]
  },
  {
    "name": "mcp-server-podcast",
    "port": 9104,
    "category": "media",
    "repo": "punkpeye/mcp-server-podcast",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-podcast/index.js"
      ],
      "env": {
        "PORT": "9104",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-podcast",
        "MCP_SERVER_CATEGORY": "media"
      }
    },
    "tools": [
      {
        "name": "media_list",
        "description": "List media resources"
      },
      {
        "name": "media_get",
        "description": "Get specific media resource"
      },
      {
        "name": "media_create",
        "description": "Create new media resource"
      },
      {
        "name": "media_update",
        "description": "Update media resource"
      },
      {
        "name": "media_delete",
        "description": "Delete media resource"
      }
    ]
  },
  {
    "name": "mcp-server-google-translate",
    "port": 9105,
    "category": "translation",
    "repo": "punkpeye/mcp-server-google-translate",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-google-translate/index.js"
      ],
      "env": {
        "PORT": "9105",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-google-translate",
        "MCP_SERVER_CATEGORY": "translation"
      }
    },
    "tools": [
      {
        "name": "translation_list",
        "description": "List translation resources"
      },
      {
        "name": "translation_get",
        "description": "Get specific translation resource"
      },
      {
        "name": "translation_create",
        "description": "Create new translation resource"
      },
      {
        "name": "translation_update",
        "description": "Update translation resource"
      },
      {
        "name": "translation_delete",
        "description": "Delete translation resource"
      }
    ]
  },
  {
    "name": "mcp-server-deepl",
    "port": 9106,
    "category": "translation",
    "repo": "punkpeye/mcp-server-deepl",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-deepl/index.js"
      ],
      "env": {
        "PORT": "9106",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-deepl",
        "MCP_SERVER_CATEGORY": "translation"
      }
    },
    "tools": [
      {
        "name": "translation_list",
        "description": "List translation resources"
      },
      {
        "name": "translation_get",
        "description": "Get specific translation resource"
      },
      {
        "name": "translation_create",
        "description": "Create new translation resource"
      },
      {
        "name": "translation_update",
        "description": "Update translation resource"
      },
      {
        "name": "translation_delete",
        "description": "Delete translation resource"
      }
    ]
  },
  {
    "name": "mcp-server-azure-translator",
    "port": 9107,
    "category": "translation",
    "repo": "punkpeye/mcp-server-azure-translator",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-azure-translator/index.js"
      ],
      "env": {
        "PORT": "9107",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-azure-translator",
        "MCP_SERVER_CATEGORY": "translation"
      }
    },
    "tools": [
      {
        "name": "translation_list",
        "description": "List translation resources"
      },
      {
        "name": "translation_get",
        "description": "Get specific translation resource"
      },
      {
        "name": "translation_create",
        "description": "Create new translation resource"
      },
      {
        "name": "translation_update",
        "description": "Update translation resource"
      },
      {
        "name": "translation_delete",
        "description": "Delete translation resource"
      }
    ]
  },
  {
    "name": "mcp-server-qr-code",
    "port": 9108,
    "category": "utility",
    "repo": "punkpeye/mcp-server-qr-code",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-qr-code/index.js"
      ],
      "env": {
        "PORT": "9108",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-qr-code",
        "MCP_SERVER_CATEGORY": "utility"
      }
    },
    "tools": [
      {
        "name": "utility_list",
        "description": "List utility resources"
      },
      {
        "name": "utility_get",
        "description": "Get specific utility resource"
      },
      {
        "name": "utility_create",
        "description": "Create new utility resource"
      },
      {
        "name": "utility_update",
        "description": "Update utility resource"
      },
      {
        "name": "utility_delete",
        "description": "Delete utility resource"
      }
    ]
  },
  {
    "name": "mcp-server-url-shortener",
    "port": 9109,
    "category": "utility",
    "repo": "punkpeye/mcp-server-url-shortener",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-url-shortener/index.js"
      ],
      "env": {
        "PORT": "9109",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-url-shortener",
        "MCP_SERVER_CATEGORY": "utility"
      }
    },
    "tools": [
      {
        "name": "utility_list",
        "description": "List utility resources"
      },
      {
        "name": "utility_get",
        "description": "Get specific utility resource"
      },
      {
        "name": "utility_create",
        "description": "Create new utility resource"
      },
      {
        "name": "utility_update",
        "description": "Update utility resource"
      },
      {
        "name": "utility_delete",
        "description": "Delete utility resource"
      }
    ]
  },
  {
    "name": "mcp-server-password-generator",
    "port": 9110,
    "category": "utility",
    "repo": "punkpeye/mcp-server-password-generator",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-password-generator/index.js"
      ],
      "env": {
        "PORT": "9110",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-password-generator",
        "MCP_SERVER_CATEGORY": "utility"
      }
    },
    "tools": [
      {
        "name": "utility_list",
        "description": "List utility resources"
      },
      {
        "name": "utility_get",
        "description": "Get specific utility resource"
      },
      {
        "name": "utility_create",
        "description": "Create new utility resource"
      },
      {
        "name": "utility_update",
        "description": "Update utility resource"
      },
      {
        "name": "utility_delete",
        "description": "Delete utility resource"
      }
    ]
  },
  {
    "name": "mcp-server-uuid",
    "port": 9111,
    "category": "utility",
    "repo": "punkpeye/mcp-server-uuid",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-uuid/index.js"
      ],
      "env": {
        "PORT": "9111",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-uuid",
        "MCP_SERVER_CATEGORY": "utility"
      }
    },
    "tools": [
      {
        "name": "utility_list",
        "description": "List utility resources"
      },
      {
        "name": "utility_get",
        "description": "Get specific utility resource"
      },
      {
        "name": "utility_create",
        "description": "Create new utility resource"
      },
      {
        "name": "utility_update",
        "description": "Update utility resource"
      },
      {
        "name": "utility_delete",
        "description": "Delete utility resource"
      }
    ]
  },
  {
    "name": "mcp-server-ethereum",
    "port": 9112,
    "category": "blockchain",
    "repo": "punkpeye/mcp-server-ethereum",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-ethereum/index.js"
      ],
      "env": {
        "PORT": "9112",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-ethereum",
        "MCP_SERVER_CATEGORY": "blockchain"
      }
    },
    "tools": [
      {
        "name": "blockchain_list",
        "description": "List blockchain resources"
      },
      {
        "name": "blockchain_get",
        "description": "Get specific blockchain resource"
      },
      {
        "name": "blockchain_create",
        "description": "Create new blockchain resource"
      },
      {
        "name": "blockchain_update",
        "description": "Update blockchain resource"
      },
      {
        "name": "blockchain_delete",
        "description": "Delete blockchain resource"
      }
    ]
  },
  {
    "name": "mcp-server-bitcoin",
    "port": 9113,
    "category": "blockchain",
    "repo": "punkpeye/mcp-server-bitcoin",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-bitcoin/index.js"
      ],
      "env": {
        "PORT": "9113",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-bitcoin",
        "MCP_SERVER_CATEGORY": "blockchain"
      }
    },
    "tools": [
      {
        "name": "blockchain_list",
        "description": "List blockchain resources"
      },
      {
        "name": "blockchain_get",
        "description": "Get specific blockchain resource"
      },
      {
        "name": "blockchain_create",
        "description": "Create new blockchain resource"
      },
      {
        "name": "blockchain_update",
        "description": "Update blockchain resource"
      },
      {
        "name": "blockchain_delete",
        "description": "Delete blockchain resource"
      }
    ]
  },
  {
    "name": "mcp-server-coinbase",
    "port": 9114,
    "category": "blockchain",
    "repo": "punkpeye/mcp-server-coinbase",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-coinbase/index.js"
      ],
      "env": {
        "PORT": "9114",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-coinbase",
        "MCP_SERVER_CATEGORY": "blockchain"
      }
    },
    "tools": [
      {
        "name": "blockchain_list",
        "description": "List blockchain resources"
      },
      {
        "name": "blockchain_get",
        "description": "Get specific blockchain resource"
      },
      {
        "name": "blockchain_create",
        "description": "Create new blockchain resource"
      },
      {
        "name": "blockchain_update",
        "description": "Update blockchain resource"
      },
      {
        "name": "blockchain_delete",
        "description": "Delete blockchain resource"
      }
    ]
  },
  {
    "name": "mcp-server-binance",
    "port": 9115,
    "category": "blockchain",
    "repo": "punkpeye/mcp-server-binance",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-binance/index.js"
      ],
      "env": {
        "PORT": "9115",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-binance",
        "MCP_SERVER_CATEGORY": "blockchain"
      }
    },
    "tools": [
      {
        "name": "blockchain_list",
        "description": "List blockchain resources"
      },
      {
        "name": "blockchain_get",
        "description": "Get specific blockchain resource"
      },
      {
        "name": "blockchain_create",
        "description": "Create new blockchain resource"
      },
      {
        "name": "blockchain_update",
        "description": "Update blockchain resource"
      },
      {
        "name": "blockchain_delete",
        "description": "Delete blockchain resource"
      }
    ]
  },
  {
    "name": "mcp-server-arduino",
    "port": 9116,
    "category": "iot",
    "repo": "punkpeye/mcp-server-arduino",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-arduino/index.js"
      ],
      "env": {
        "PORT": "9116",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-arduino",
        "MCP_SERVER_CATEGORY": "iot"
      }
    },
    "tools": [
      {
        "name": "iot_list",
        "description": "List iot resources"
      },
      {
        "name": "iot_get",
        "description": "Get specific iot resource"
      },
      {
        "name": "iot_create",
        "description": "Create new iot resource"
      },
      {
        "name": "iot_update",
        "description": "Update iot resource"
      },
      {
        "name": "iot_delete",
        "description": "Delete iot resource"
      }
    ]
  },
  {
    "name": "mcp-server-raspberry-pi",
    "port": 9117,
    "category": "iot",
    "repo": "punkpeye/mcp-server-raspberry-pi",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-raspberry-pi/index.js"
      ],
      "env": {
        "PORT": "9117",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-raspberry-pi",
        "MCP_SERVER_CATEGORY": "iot"
      }
    },
    "tools": [
      {
        "name": "iot_list",
        "description": "List iot resources"
      },
      {
        "name": "iot_get",
        "description": "Get specific iot resource"
      },
      {
        "name": "iot_create",
        "description": "Create new iot resource"
      },
      {
        "name": "iot_update",
        "description": "Update iot resource"
      },
      {
        "name": "iot_delete",
        "description": "Delete iot resource"
      }
    ]
  },
  {
    "name": "mcp-server-mqtt",
    "port": 9118,
    "category": "iot",
    "repo": "punkpeye/mcp-server-mqtt",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-mqtt/index.js"
      ],
      "env": {
        "PORT": "9118",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-mqtt",
        "MCP_SERVER_CATEGORY": "iot"
      }
    },
    "tools": [
      {
        "name": "iot_list",
        "description": "List iot resources"
      },
      {
        "name": "iot_get",
        "description": "Get specific iot resource"
      },
      {
        "name": "iot_create",
        "description": "Create new iot resource"
      },
      {
        "name": "iot_update",
        "description": "Update iot resource"
      },
      {
        "name": "iot_delete",
        "description": "Delete iot resource"
      }
    ]
  },
  {
    "name": "mcp-server-zigbee",
    "port": 9119,
    "category": "iot",
    "repo": "punkpeye/mcp-server-zigbee",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-zigbee/index.js"
      ],
      "env": {
        "PORT": "9119",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-zigbee",
        "MCP_SERVER_CATEGORY": "iot"
      }
    },
    "tools": [
      {
        "name": "iot_list",
        "description": "List iot resources"
      },
      {
        "name": "iot_get",
        "description": "Get specific iot resource"
      },
      {
        "name": "iot_create",
        "description": "Create new iot resource"
      },
      {
        "name": "iot_update",
        "description": "Update iot resource"
      },
      {
        "name": "iot_delete",
        "description": "Delete iot resource"
      }
    ]
  },
  {
    "name": "mcp-server-steam",
    "port": 9120,
    "category": "gaming",
    "repo": "punkpeye/mcp-server-steam",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-steam/index.js"
      ],
      "env": {
        "PORT": "9120",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-steam",
        "MCP_SERVER_CATEGORY": "gaming"
      }
    },
    "tools": [
      {
        "name": "gaming_list",
        "description": "List gaming resources"
      },
      {
        "name": "gaming_get",
        "description": "Get specific gaming resource"
      },
      {
        "name": "gaming_create",
        "description": "Create new gaming resource"
      },
      {
        "name": "gaming_update",
        "description": "Update gaming resource"
      },
      {
        "name": "gaming_delete",
        "description": "Delete gaming resource"
      }
    ]
  },
  {
    "name": "mcp-server-twitch",
    "port": 9121,
    "category": "gaming",
    "repo": "punkpeye/mcp-server-twitch",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-twitch/index.js"
      ],
      "env": {
        "PORT": "9121",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-twitch",
        "MCP_SERVER_CATEGORY": "gaming"
      }
    },
    "tools": [
      {
        "name": "gaming_list",
        "description": "List gaming resources"
      },
      {
        "name": "gaming_get",
        "description": "Get specific gaming resource"
      },
      {
        "name": "gaming_create",
        "description": "Create new gaming resource"
      },
      {
        "name": "gaming_update",
        "description": "Update gaming resource"
      },
      {
        "name": "gaming_delete",
        "description": "Delete gaming resource"
      }
    ]
  },
  {
    "name": "mcp-server-discord-bot",
    "port": 9122,
    "category": "gaming",
    "repo": "punkpeye/mcp-server-discord-bot",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-discord-bot/index.js"
      ],
      "env": {
        "PORT": "9122",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-discord-bot",
        "MCP_SERVER_CATEGORY": "gaming"
      }
    },
    "tools": [
      {
        "name": "gaming_list",
        "description": "List gaming resources"
      },
      {
        "name": "gaming_get",
        "description": "Get specific gaming resource"
      },
      {
        "name": "gaming_create",
        "description": "Create new gaming resource"
      },
      {
        "name": "gaming_update",
        "description": "Update gaming resource"
      },
      {
        "name": "gaming_delete",
        "description": "Delete gaming resource"
      }
    ]
  },
  {
    "name": "mcp-server-fitbit",
    "port": 9123,
    "category": "health",
    "repo": "punkpeye/mcp-server-fitbit",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-fitbit/index.js"
      ],
      "env": {
        "PORT": "9123",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-fitbit",
        "MCP_SERVER_CATEGORY": "health"
      }
    },
    "tools": [
      {
        "name": "health_list",
        "description": "List health resources"
      },
      {
        "name": "health_get",
        "description": "Get specific health resource"
      },
      {
        "name": "health_create",
        "description": "Create new health resource"
      },
      {
        "name": "health_update",
        "description": "Update health resource"
      },
      {
        "name": "health_delete",
        "description": "Delete health resource"
      }
    ]
  },
  {
    "name": "mcp-server-apple-health",
    "port": 9124,
    "category": "health",
    "repo": "punkpeye/mcp-server-apple-health",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-apple-health/index.js"
      ],
      "env": {
        "PORT": "9124",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-apple-health",
        "MCP_SERVER_CATEGORY": "health"
      }
    },
    "tools": [
      {
        "name": "health_list",
        "description": "List health resources"
      },
      {
        "name": "health_get",
        "description": "Get specific health resource"
      },
      {
        "name": "health_create",
        "description": "Create new health resource"
      },
      {
        "name": "health_update",
        "description": "Update health resource"
      },
      {
        "name": "health_delete",
        "description": "Delete health resource"
      }
    ]
  },
  {
    "name": "mcp-server-google-fit",
    "port": 9125,
    "category": "health",
    "repo": "punkpeye/mcp-server-google-fit",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-google-fit/index.js"
      ],
      "env": {
        "PORT": "9125",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-google-fit",
        "MCP_SERVER_CATEGORY": "health"
      }
    },
    "tools": [
      {
        "name": "health_list",
        "description": "List health resources"
      },
      {
        "name": "health_get",
        "description": "Get specific health resource"
      },
      {
        "name": "health_create",
        "description": "Create new health resource"
      },
      {
        "name": "health_update",
        "description": "Update health resource"
      },
      {
        "name": "health_delete",
        "description": "Delete health resource"
      }
    ]
  },
  {
    "name": "mcp-server-coursera",
    "port": 9126,
    "category": "education",
    "repo": "punkpeye/mcp-server-coursera",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-coursera/index.js"
      ],
      "env": {
        "PORT": "9126",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-coursera",
        "MCP_SERVER_CATEGORY": "education"
      }
    },
    "tools": [
      {
        "name": "education_list",
        "description": "List education resources"
      },
      {
        "name": "education_get",
        "description": "Get specific education resource"
      },
      {
        "name": "education_create",
        "description": "Create new education resource"
      },
      {
        "name": "education_update",
        "description": "Update education resource"
      },
      {
        "name": "education_delete",
        "description": "Delete education resource"
      }
    ]
  },
  {
    "name": "mcp-server-udemy",
    "port": 9127,
    "category": "education",
    "repo": "punkpeye/mcp-server-udemy",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-udemy/index.js"
      ],
      "env": {
        "PORT": "9127",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-udemy",
        "MCP_SERVER_CATEGORY": "education"
      }
    },
    "tools": [
      {
        "name": "education_list",
        "description": "List education resources"
      },
      {
        "name": "education_get",
        "description": "Get specific education resource"
      },
      {
        "name": "education_create",
        "description": "Create new education resource"
      },
      {
        "name": "education_update",
        "description": "Update education resource"
      },
      {
        "name": "education_delete",
        "description": "Delete education resource"
      }
    ]
  },
  {
    "name": "mcp-server-khan-academy",
    "port": 9128,
    "category": "education",
    "repo": "punkpeye/mcp-server-khan-academy",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-khan-academy/index.js"
      ],
      "env": {
        "PORT": "9128",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-khan-academy",
        "MCP_SERVER_CATEGORY": "education"
      }
    },
    "tools": [
      {
        "name": "education_list",
        "description": "List education resources"
      },
      {
        "name": "education_get",
        "description": "Get specific education resource"
      },
      {
        "name": "education_create",
        "description": "Create new education resource"
      },
      {
        "name": "education_update",
        "description": "Update education resource"
      },
      {
        "name": "education_delete",
        "description": "Delete education resource"
      }
    ]
  },
  {
    "name": "mcp-server-booking",
    "port": 9129,
    "category": "travel",
    "repo": "punkpeye/mcp-server-booking",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-booking/index.js"
      ],
      "env": {
        "PORT": "9129",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-booking",
        "MCP_SERVER_CATEGORY": "travel"
      }
    },
    "tools": [
      {
        "name": "travel_list",
        "description": "List travel resources"
      },
      {
        "name": "travel_get",
        "description": "Get specific travel resource"
      },
      {
        "name": "travel_create",
        "description": "Create new travel resource"
      },
      {
        "name": "travel_update",
        "description": "Update travel resource"
      },
      {
        "name": "travel_delete",
        "description": "Delete travel resource"
      }
    ]
  },
  {
    "name": "mcp-server-airbnb",
    "port": 9130,
    "category": "travel",
    "repo": "punkpeye/mcp-server-airbnb",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-airbnb/index.js"
      ],
      "env": {
        "PORT": "9130",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-airbnb",
        "MCP_SERVER_CATEGORY": "travel"
      }
    },
    "tools": [
      {
        "name": "travel_list",
        "description": "List travel resources"
      },
      {
        "name": "travel_get",
        "description": "Get specific travel resource"
      },
      {
        "name": "travel_create",
        "description": "Create new travel resource"
      },
      {
        "name": "travel_update",
        "description": "Update travel resource"
      },
      {
        "name": "travel_delete",
        "description": "Delete travel resource"
      }
    ]
  },
  {
    "name": "mcp-server-expedia",
    "port": 9131,
    "category": "travel",
    "repo": "punkpeye/mcp-server-expedia",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-expedia/index.js"
      ],
      "env": {
        "PORT": "9131",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-expedia",
        "MCP_SERVER_CATEGORY": "travel"
      }
    },
    "tools": [
      {
        "name": "travel_list",
        "description": "List travel resources"
      },
      {
        "name": "travel_get",
        "description": "Get specific travel resource"
      },
      {
        "name": "travel_create",
        "description": "Create new travel resource"
      },
      {
        "name": "travel_update",
        "description": "Update travel resource"
      },
      {
        "name": "travel_delete",
        "description": "Delete travel resource"
      }
    ]
  },
  {
    "name": "mcp-server-uber-eats",
    "port": 9132,
    "category": "food",
    "repo": "punkpeye/mcp-server-uber-eats",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-uber-eats/index.js"
      ],
      "env": {
        "PORT": "9132",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-uber-eats",
        "MCP_SERVER_CATEGORY": "food"
      }
    },
    "tools": [
      {
        "name": "food_list",
        "description": "List food resources"
      },
      {
        "name": "food_get",
        "description": "Get specific food resource"
      },
      {
        "name": "food_create",
        "description": "Create new food resource"
      },
      {
        "name": "food_update",
        "description": "Update food resource"
      },
      {
        "name": "food_delete",
        "description": "Delete food resource"
      }
    ]
  },
  {
    "name": "mcp-server-doordash",
    "port": 9133,
    "category": "food",
    "repo": "punkpeye/mcp-server-doordash",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-doordash/index.js"
      ],
      "env": {
        "PORT": "9133",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-doordash",
        "MCP_SERVER_CATEGORY": "food"
      }
    },
    "tools": [
      {
        "name": "food_list",
        "description": "List food resources"
      },
      {
        "name": "food_get",
        "description": "Get specific food resource"
      },
      {
        "name": "food_create",
        "description": "Create new food resource"
      },
      {
        "name": "food_update",
        "description": "Update food resource"
      },
      {
        "name": "food_delete",
        "description": "Delete food resource"
      }
    ]
  },
  {
    "name": "mcp-server-grubhub",
    "port": 9134,
    "category": "food",
    "repo": "punkpeye/mcp-server-grubhub",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-grubhub/index.js"
      ],
      "env": {
        "PORT": "9134",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-grubhub",
        "MCP_SERVER_CATEGORY": "food"
      }
    },
    "tools": [
      {
        "name": "food_list",
        "description": "List food resources"
      },
      {
        "name": "food_get",
        "description": "Get specific food resource"
      },
      {
        "name": "food_create",
        "description": "Create new food resource"
      },
      {
        "name": "food_update",
        "description": "Update food resource"
      },
      {
        "name": "food_delete",
        "description": "Delete food resource"
      }
    ]
  },
  {
    "name": "mcp-server-spotify",
    "port": 9135,
    "category": "music",
    "repo": "punkpeye/mcp-server-spotify",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-spotify/index.js"
      ],
      "env": {
        "PORT": "9135",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-spotify",
        "MCP_SERVER_CATEGORY": "music"
      }
    },
    "tools": [
      {
        "name": "music_list",
        "description": "List music resources"
      },
      {
        "name": "music_get",
        "description": "Get specific music resource"
      },
      {
        "name": "music_create",
        "description": "Create new music resource"
      },
      {
        "name": "music_update",
        "description": "Update music resource"
      },
      {
        "name": "music_delete",
        "description": "Delete music resource"
      }
    ]
  },
  {
    "name": "mcp-server-apple-music",
    "port": 9136,
    "category": "music",
    "repo": "punkpeye/mcp-server-apple-music",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-apple-music/index.js"
      ],
      "env": {
        "PORT": "9136",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-apple-music",
        "MCP_SERVER_CATEGORY": "music"
      }
    },
    "tools": [
      {
        "name": "music_list",
        "description": "List music resources"
      },
      {
        "name": "music_get",
        "description": "Get specific music resource"
      },
      {
        "name": "music_create",
        "description": "Create new music resource"
      },
      {
        "name": "music_update",
        "description": "Update music resource"
      },
      {
        "name": "music_delete",
        "description": "Delete music resource"
      }
    ]
  },
  {
    "name": "mcp-server-netflix",
    "port": 9137,
    "category": "entertainment",
    "repo": "punkpeye/mcp-server-netflix",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-netflix/index.js"
      ],
      "env": {
        "PORT": "9137",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-netflix",
        "MCP_SERVER_CATEGORY": "entertainment"
      }
    },
    "tools": [
      {
        "name": "entertainment_list",
        "description": "List entertainment resources"
      },
      {
        "name": "entertainment_get",
        "description": "Get specific entertainment resource"
      },
      {
        "name": "entertainment_create",
        "description": "Create new entertainment resource"
      },
      {
        "name": "entertainment_update",
        "description": "Update entertainment resource"
      },
      {
        "name": "entertainment_delete",
        "description": "Delete entertainment resource"
      }
    ]
  },
  {
    "name": "mcp-server-zillow",
    "port": 9138,
    "category": "real-estate",
    "repo": "punkpeye/mcp-server-zillow",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-zillow/index.js"
      ],
      "env": {
        "PORT": "9138",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-zillow",
        "MCP_SERVER_CATEGORY": "real-estate"
      }
    },
    "tools": [
      {
        "name": "real-estate_list",
        "description": "List real-estate resources"
      },
      {
        "name": "real-estate_get",
        "description": "Get specific real-estate resource"
      },
      {
        "name": "real-estate_create",
        "description": "Create new real-estate resource"
      },
      {
        "name": "real-estate_update",
        "description": "Update real-estate resource"
      },
      {
        "name": "real-estate_delete",
        "description": "Delete real-estate resource"
      }
    ]
  },
  {
    "name": "mcp-server-realtor",
    "port": 9139,
    "category": "real-estate",
    "repo": "punkpeye/mcp-server-realtor",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-realtor/index.js"
      ],
      "env": {
        "PORT": "9139",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-realtor",
        "MCP_SERVER_CATEGORY": "real-estate"
      }
    },
    "tools": [
      {
        "name": "real-estate_list",
        "description": "List real-estate resources"
      },
      {
        "name": "real-estate_get",
        "description": "Get specific real-estate resource"
      },
      {
        "name": "real-estate_create",
        "description": "Create new real-estate resource"
      },
      {
        "name": "real-estate_update",
        "description": "Update real-estate resource"
      },
      {
        "name": "real-estate_delete",
        "description": "Delete real-estate resource"
      }
    ]
  },
  {
    "name": "mcp-server-legalzoom",
    "port": 9140,
    "category": "legal",
    "repo": "punkpeye/mcp-server-legalzoom",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-legalzoom/index.js"
      ],
      "env": {
        "PORT": "9140",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-legalzoom",
        "MCP_SERVER_CATEGORY": "legal"
      }
    },
    "tools": [
      {
        "name": "legal_list",
        "description": "List legal resources"
      },
      {
        "name": "legal_get",
        "description": "Get specific legal resource"
      },
      {
        "name": "legal_create",
        "description": "Create new legal resource"
      },
      {
        "name": "legal_update",
        "description": "Update legal resource"
      },
      {
        "name": "legal_delete",
        "description": "Delete legal resource"
      }
    ]
  },
  {
    "name": "mcp-server-docusign",
    "port": 9141,
    "category": "legal",
    "repo": "punkpeye/mcp-server-docusign",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-docusign/index.js"
      ],
      "env": {
        "PORT": "9141",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-docusign",
        "MCP_SERVER_CATEGORY": "legal"
      }
    },
    "tools": [
      {
        "name": "legal_list",
        "description": "List legal resources"
      },
      {
        "name": "legal_get",
        "description": "Get specific legal resource"
      },
      {
        "name": "legal_create",
        "description": "Create new legal resource"
      },
      {
        "name": "legal_update",
        "description": "Update legal resource"
      },
      {
        "name": "legal_delete",
        "description": "Delete legal resource"
      }
    ]
  },
  {
    "name": "mcp-server-linkedin-recruiter",
    "port": 9142,
    "category": "hr",
    "repo": "punkpeye/mcp-server-linkedin-recruiter",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-linkedin-recruiter/index.js"
      ],
      "env": {
        "PORT": "9142",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-linkedin-recruiter",
        "MCP_SERVER_CATEGORY": "hr"
      }
    },
    "tools": [
      {
        "name": "hr_list",
        "description": "List hr resources"
      },
      {
        "name": "hr_get",
        "description": "Get specific hr resource"
      },
      {
        "name": "hr_create",
        "description": "Create new hr resource"
      },
      {
        "name": "hr_update",
        "description": "Update hr resource"
      },
      {
        "name": "hr_delete",
        "description": "Delete hr resource"
      }
    ]
  },
  {
    "name": "mcp-server-indeed",
    "port": 9143,
    "category": "hr",
    "repo": "punkpeye/mcp-server-indeed",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-indeed/index.js"
      ],
      "env": {
        "PORT": "9143",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-indeed",
        "MCP_SERVER_CATEGORY": "hr"
      }
    },
    "tools": [
      {
        "name": "hr_list",
        "description": "List hr resources"
      },
      {
        "name": "hr_get",
        "description": "Get specific hr resource"
      },
      {
        "name": "hr_create",
        "description": "Create new hr resource"
      },
      {
        "name": "hr_update",
        "description": "Update hr resource"
      },
      {
        "name": "hr_delete",
        "description": "Delete hr resource"
      }
    ]
  },
  {
    "name": "mcp-server-glassdoor",
    "port": 9144,
    "category": "hr",
    "repo": "punkpeye/mcp-server-glassdoor",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-glassdoor/index.js"
      ],
      "env": {
        "PORT": "9144",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-glassdoor",
        "MCP_SERVER_CATEGORY": "hr"
      }
    },
    "tools": [
      {
        "name": "hr_list",
        "description": "List hr resources"
      },
      {
        "name": "hr_get",
        "description": "Get specific hr resource"
      },
      {
        "name": "hr_create",
        "description": "Create new hr resource"
      },
      {
        "name": "hr_update",
        "description": "Update hr resource"
      },
      {
        "name": "hr_delete",
        "description": "Delete hr resource"
      }
    ]
  },
  {
    "name": "mcp-server-fedex",
    "port": 9145,
    "category": "logistics",
    "repo": "punkpeye/mcp-server-fedex",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-fedex/index.js"
      ],
      "env": {
        "PORT": "9145",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-fedex",
        "MCP_SERVER_CATEGORY": "logistics"
      }
    },
    "tools": [
      {
        "name": "logistics_list",
        "description": "List logistics resources"
      },
      {
        "name": "logistics_get",
        "description": "Get specific logistics resource"
      },
      {
        "name": "logistics_create",
        "description": "Create new logistics resource"
      },
      {
        "name": "logistics_update",
        "description": "Update logistics resource"
      },
      {
        "name": "logistics_delete",
        "description": "Delete logistics resource"
      }
    ]
  },
  {
    "name": "mcp-server-ups",
    "port": 9146,
    "category": "logistics",
    "repo": "punkpeye/mcp-server-ups",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-ups/index.js"
      ],
      "env": {
        "PORT": "9146",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-ups",
        "MCP_SERVER_CATEGORY": "logistics"
      }
    },
    "tools": [
      {
        "name": "logistics_list",
        "description": "List logistics resources"
      },
      {
        "name": "logistics_get",
        "description": "Get specific logistics resource"
      },
      {
        "name": "logistics_create",
        "description": "Create new logistics resource"
      },
      {
        "name": "logistics_update",
        "description": "Update logistics resource"
      },
      {
        "name": "logistics_delete",
        "description": "Delete logistics resource"
      }
    ]
  },
  {
    "name": "mcp-server-dhl",
    "port": 9147,
    "category": "logistics",
    "repo": "punkpeye/mcp-server-dhl",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-dhl/index.js"
      ],
      "env": {
        "PORT": "9147",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-dhl",
        "MCP_SERVER_CATEGORY": "logistics"
      }
    },
    "tools": [
      {
        "name": "logistics_list",
        "description": "List logistics resources"
      },
      {
        "name": "logistics_get",
        "description": "Get specific logistics resource"
      },
      {
        "name": "logistics_create",
        "description": "Create new logistics resource"
      },
      {
        "name": "logistics_update",
        "description": "Update logistics resource"
      },
      {
        "name": "logistics_delete",
        "description": "Delete logistics resource"
      }
    ]
  },
  {
    "name": "mcp-server-farm-management",
    "port": 9148,
    "category": "agriculture",
    "repo": "punkpeye/mcp-server-farm-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-farm-management/index.js"
      ],
      "env": {
        "PORT": "9148",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-farm-management",
        "MCP_SERVER_CATEGORY": "agriculture"
      }
    },
    "tools": [
      {
        "name": "agriculture_list",
        "description": "List agriculture resources"
      },
      {
        "name": "agriculture_get",
        "description": "Get specific agriculture resource"
      },
      {
        "name": "agriculture_create",
        "description": "Create new agriculture resource"
      },
      {
        "name": "agriculture_update",
        "description": "Update agriculture resource"
      },
      {
        "name": "agriculture_delete",
        "description": "Delete agriculture resource"
      }
    ]
  },
  {
    "name": "mcp-server-weather-farming",
    "port": 9149,
    "category": "agriculture",
    "repo": "punkpeye/mcp-server-weather-farming",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-weather-farming/index.js"
      ],
      "env": {
        "PORT": "9149",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-weather-farming",
        "MCP_SERVER_CATEGORY": "agriculture"
      }
    },
    "tools": [
      {
        "name": "agriculture_list",
        "description": "List agriculture resources"
      },
      {
        "name": "agriculture_get",
        "description": "Get specific agriculture resource"
      },
      {
        "name": "agriculture_create",
        "description": "Create new agriculture resource"
      },
      {
        "name": "agriculture_update",
        "description": "Update agriculture resource"
      },
      {
        "name": "agriculture_delete",
        "description": "Delete agriculture resource"
      }
    ]
  },
  {
    "name": "mcp-server-solar-monitoring",
    "port": 9150,
    "category": "energy",
    "repo": "punkpeye/mcp-server-solar-monitoring",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-solar-monitoring/index.js"
      ],
      "env": {
        "PORT": "9150",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-solar-monitoring",
        "MCP_SERVER_CATEGORY": "energy"
      }
    },
    "tools": [
      {
        "name": "energy_list",
        "description": "List energy resources"
      },
      {
        "name": "energy_get",
        "description": "Get specific energy resource"
      },
      {
        "name": "energy_create",
        "description": "Create new energy resource"
      },
      {
        "name": "energy_update",
        "description": "Update energy resource"
      },
      {
        "name": "energy_delete",
        "description": "Delete energy resource"
      }
    ]
  },
  {
    "name": "mcp-server-smart-grid",
    "port": 9151,
    "category": "energy",
    "repo": "punkpeye/mcp-server-smart-grid",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-smart-grid/index.js"
      ],
      "env": {
        "PORT": "9151",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-smart-grid",
        "MCP_SERVER_CATEGORY": "energy"
      }
    },
    "tools": [
      {
        "name": "energy_list",
        "description": "List energy resources"
      },
      {
        "name": "energy_get",
        "description": "Get specific energy resource"
      },
      {
        "name": "energy_create",
        "description": "Create new energy resource"
      },
      {
        "name": "energy_update",
        "description": "Update energy resource"
      },
      {
        "name": "energy_delete",
        "description": "Delete energy resource"
      }
    ]
  },
  {
    "name": "mcp-server-erp",
    "port": 9152,
    "category": "manufacturing",
    "repo": "punkpeye/mcp-server-erp",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-erp/index.js"
      ],
      "env": {
        "PORT": "9152",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-erp",
        "MCP_SERVER_CATEGORY": "manufacturing"
      }
    },
    "tools": [
      {
        "name": "manufacturing_list",
        "description": "List manufacturing resources"
      },
      {
        "name": "manufacturing_get",
        "description": "Get specific manufacturing resource"
      },
      {
        "name": "manufacturing_create",
        "description": "Create new manufacturing resource"
      },
      {
        "name": "manufacturing_update",
        "description": "Update manufacturing resource"
      },
      {
        "name": "manufacturing_delete",
        "description": "Delete manufacturing resource"
      }
    ]
  },
  {
    "name": "mcp-server-inventory",
    "port": 9153,
    "category": "manufacturing",
    "repo": "punkpeye/mcp-server-inventory",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-inventory/index.js"
      ],
      "env": {
        "PORT": "9153",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-inventory",
        "MCP_SERVER_CATEGORY": "manufacturing"
      }
    },
    "tools": [
      {
        "name": "manufacturing_list",
        "description": "List manufacturing resources"
      },
      {
        "name": "manufacturing_get",
        "description": "Get specific manufacturing resource"
      },
      {
        "name": "manufacturing_create",
        "description": "Create new manufacturing resource"
      },
      {
        "name": "manufacturing_update",
        "description": "Update manufacturing resource"
      },
      {
        "name": "manufacturing_delete",
        "description": "Delete manufacturing resource"
      }
    ]
  },
  {
    "name": "mcp-server-tesla",
    "port": 9154,
    "category": "automotive",
    "repo": "punkpeye/mcp-server-tesla",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-tesla/index.js"
      ],
      "env": {
        "PORT": "9154",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-tesla",
        "MCP_SERVER_CATEGORY": "automotive"
      }
    },
    "tools": [
      {
        "name": "automotive_list",
        "description": "List automotive resources"
      },
      {
        "name": "automotive_get",
        "description": "Get specific automotive resource"
      },
      {
        "name": "automotive_create",
        "description": "Create new automotive resource"
      },
      {
        "name": "automotive_update",
        "description": "Update automotive resource"
      },
      {
        "name": "automotive_delete",
        "description": "Delete automotive resource"
      }
    ]
  },
  {
    "name": "mcp-server-car-diagnostics",
    "port": 9155,
    "category": "automotive",
    "repo": "punkpeye/mcp-server-car-diagnostics",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-car-diagnostics/index.js"
      ],
      "env": {
        "PORT": "9155",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-car-diagnostics",
        "MCP_SERVER_CATEGORY": "automotive"
      }
    },
    "tools": [
      {
        "name": "automotive_list",
        "description": "List automotive resources"
      },
      {
        "name": "automotive_get",
        "description": "Get specific automotive resource"
      },
      {
        "name": "automotive_create",
        "description": "Create new automotive resource"
      },
      {
        "name": "automotive_update",
        "description": "Update automotive resource"
      },
      {
        "name": "automotive_delete",
        "description": "Delete automotive resource"
      }
    ]
  },
  {
    "name": "mcp-server-insurance-api",
    "port": 9156,
    "category": "insurance",
    "repo": "punkpeye/mcp-server-insurance-api",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-insurance-api/index.js"
      ],
      "env": {
        "PORT": "9156",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-insurance-api",
        "MCP_SERVER_CATEGORY": "insurance"
      }
    },
    "tools": [
      {
        "name": "insurance_list",
        "description": "List insurance resources"
      },
      {
        "name": "insurance_get",
        "description": "Get specific insurance resource"
      },
      {
        "name": "insurance_create",
        "description": "Create new insurance resource"
      },
      {
        "name": "insurance_update",
        "description": "Update insurance resource"
      },
      {
        "name": "insurance_delete",
        "description": "Delete insurance resource"
      }
    ]
  },
  {
    "name": "mcp-server-claims-processing",
    "port": 9157,
    "category": "insurance",
    "repo": "punkpeye/mcp-server-claims-processing",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-claims-processing/index.js"
      ],
      "env": {
        "PORT": "9157",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-claims-processing",
        "MCP_SERVER_CATEGORY": "insurance"
      }
    },
    "tools": [
      {
        "name": "insurance_list",
        "description": "List insurance resources"
      },
      {
        "name": "insurance_get",
        "description": "Get specific insurance resource"
      },
      {
        "name": "insurance_create",
        "description": "Create new insurance resource"
      },
      {
        "name": "insurance_update",
        "description": "Update insurance resource"
      },
      {
        "name": "insurance_delete",
        "description": "Delete insurance resource"
      }
    ]
  },
  {
    "name": "mcp-server-gov-data",
    "port": 9158,
    "category": "government",
    "repo": "punkpeye/mcp-server-gov-data",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-gov-data/index.js"
      ],
      "env": {
        "PORT": "9158",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-gov-data",
        "MCP_SERVER_CATEGORY": "government"
      }
    },
    "tools": [
      {
        "name": "government_list",
        "description": "List government resources"
      },
      {
        "name": "government_get",
        "description": "Get specific government resource"
      },
      {
        "name": "government_create",
        "description": "Create new government resource"
      },
      {
        "name": "government_update",
        "description": "Update government resource"
      },
      {
        "name": "government_delete",
        "description": "Delete government resource"
      }
    ]
  },
  {
    "name": "mcp-server-census",
    "port": 9159,
    "category": "government",
    "repo": "punkpeye/mcp-server-census",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-census/index.js"
      ],
      "env": {
        "PORT": "9159",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-census",
        "MCP_SERVER_CATEGORY": "government"
      }
    },
    "tools": [
      {
        "name": "government_list",
        "description": "List government resources"
      },
      {
        "name": "government_get",
        "description": "Get specific government resource"
      },
      {
        "name": "government_create",
        "description": "Create new government resource"
      },
      {
        "name": "government_update",
        "description": "Update government resource"
      },
      {
        "name": "government_delete",
        "description": "Delete government resource"
      }
    ]
  },
  {
    "name": "mcp-server-charity-navigator",
    "port": 9160,
    "category": "nonprofit",
    "repo": "punkpeye/mcp-server-charity-navigator",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-charity-navigator/index.js"
      ],
      "env": {
        "PORT": "9160",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-charity-navigator",
        "MCP_SERVER_CATEGORY": "nonprofit"
      }
    },
    "tools": [
      {
        "name": "nonprofit_list",
        "description": "List nonprofit resources"
      },
      {
        "name": "nonprofit_get",
        "description": "Get specific nonprofit resource"
      },
      {
        "name": "nonprofit_create",
        "description": "Create new nonprofit resource"
      },
      {
        "name": "nonprofit_update",
        "description": "Update nonprofit resource"
      },
      {
        "name": "nonprofit_delete",
        "description": "Delete nonprofit resource"
      }
    ]
  },
  {
    "name": "mcp-server-donation-tracker",
    "port": 9161,
    "category": "nonprofit",
    "repo": "punkpeye/mcp-server-donation-tracker",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-donation-tracker/index.js"
      ],
      "env": {
        "PORT": "9161",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-donation-tracker",
        "MCP_SERVER_CATEGORY": "nonprofit"
      }
    },
    "tools": [
      {
        "name": "nonprofit_list",
        "description": "List nonprofit resources"
      },
      {
        "name": "nonprofit_get",
        "description": "Get specific nonprofit resource"
      },
      {
        "name": "nonprofit_create",
        "description": "Create new nonprofit resource"
      },
      {
        "name": "nonprofit_update",
        "description": "Update nonprofit resource"
      },
      {
        "name": "nonprofit_delete",
        "description": "Delete nonprofit resource"
      }
    ]
  },
  {
    "name": "mcp-server-espn",
    "port": 9162,
    "category": "sports",
    "repo": "punkpeye/mcp-server-espn",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-espn/index.js"
      ],
      "env": {
        "PORT": "9162",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-espn",
        "MCP_SERVER_CATEGORY": "sports"
      }
    },
    "tools": [
      {
        "name": "sports_list",
        "description": "List sports resources"
      },
      {
        "name": "sports_get",
        "description": "Get specific sports resource"
      },
      {
        "name": "sports_create",
        "description": "Create new sports resource"
      },
      {
        "name": "sports_update",
        "description": "Update sports resource"
      },
      {
        "name": "sports_delete",
        "description": "Delete sports resource"
      }
    ]
  },
  {
    "name": "mcp-server-nfl",
    "port": 9163,
    "category": "sports",
    "repo": "punkpeye/mcp-server-nfl",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-nfl/index.js"
      ],
      "env": {
        "PORT": "9163",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-nfl",
        "MCP_SERVER_CATEGORY": "sports"
      }
    },
    "tools": [
      {
        "name": "sports_list",
        "description": "List sports resources"
      },
      {
        "name": "sports_get",
        "description": "Get specific sports resource"
      },
      {
        "name": "sports_create",
        "description": "Create new sports resource"
      },
      {
        "name": "sports_update",
        "description": "Update sports resource"
      },
      {
        "name": "sports_delete",
        "description": "Delete sports resource"
      }
    ]
  },
  {
    "name": "mcp-server-nba",
    "port": 9164,
    "category": "sports",
    "repo": "punkpeye/mcp-server-nba",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-nba/index.js"
      ],
      "env": {
        "PORT": "9164",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-nba",
        "MCP_SERVER_CATEGORY": "sports"
      }
    },
    "tools": [
      {
        "name": "sports_list",
        "description": "List sports resources"
      },
      {
        "name": "sports_get",
        "description": "Get specific sports resource"
      },
      {
        "name": "sports_create",
        "description": "Create new sports resource"
      },
      {
        "name": "sports_update",
        "description": "Update sports resource"
      },
      {
        "name": "sports_delete",
        "description": "Delete sports resource"
      }
    ]
  },
  {
    "name": "mcp-server-pubmed",
    "port": 9165,
    "category": "research",
    "repo": "punkpeye/mcp-server-pubmed",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-pubmed/index.js"
      ],
      "env": {
        "PORT": "9165",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-pubmed",
        "MCP_SERVER_CATEGORY": "research"
      }
    },
    "tools": [
      {
        "name": "research_list",
        "description": "List research resources"
      },
      {
        "name": "research_get",
        "description": "Get specific research resource"
      },
      {
        "name": "research_create",
        "description": "Create new research resource"
      },
      {
        "name": "research_update",
        "description": "Update research resource"
      },
      {
        "name": "research_delete",
        "description": "Delete research resource"
      }
    ]
  },
  {
    "name": "mcp-server-arxiv",
    "port": 9166,
    "category": "research",
    "repo": "punkpeye/mcp-server-arxiv",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-arxiv/index.js"
      ],
      "env": {
        "PORT": "9166",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-arxiv",
        "MCP_SERVER_CATEGORY": "research"
      }
    },
    "tools": [
      {
        "name": "research_list",
        "description": "List research resources"
      },
      {
        "name": "research_get",
        "description": "Get specific research resource"
      },
      {
        "name": "research_create",
        "description": "Create new research resource"
      },
      {
        "name": "research_update",
        "description": "Update research resource"
      },
      {
        "name": "research_delete",
        "description": "Delete research resource"
      }
    ]
  },
  {
    "name": "mcp-server-nasa",
    "port": 9167,
    "category": "research",
    "repo": "punkpeye/mcp-server-nasa",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-nasa/index.js"
      ],
      "env": {
        "PORT": "9167",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-nasa",
        "MCP_SERVER_CATEGORY": "research"
      }
    },
    "tools": [
      {
        "name": "research_list",
        "description": "List research resources"
      },
      {
        "name": "research_get",
        "description": "Get specific research resource"
      },
      {
        "name": "research_create",
        "description": "Create new research resource"
      },
      {
        "name": "research_update",
        "description": "Update research resource"
      },
      {
        "name": "research_delete",
        "description": "Delete research resource"
      }
    ]
  },
  {
    "name": "mcp-server-amazon",
    "port": 9168,
    "category": "retail",
    "repo": "punkpeye/mcp-server-amazon",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-amazon/index.js"
      ],
      "env": {
        "PORT": "9168",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-amazon",
        "MCP_SERVER_CATEGORY": "retail"
      }
    },
    "tools": [
      {
        "name": "retail_list",
        "description": "List retail resources"
      },
      {
        "name": "retail_get",
        "description": "Get specific retail resource"
      },
      {
        "name": "retail_create",
        "description": "Create new retail resource"
      },
      {
        "name": "retail_update",
        "description": "Update retail resource"
      },
      {
        "name": "retail_delete",
        "description": "Delete retail resource"
      }
    ]
  },
  {
    "name": "mcp-server-ebay",
    "port": 9169,
    "category": "retail",
    "repo": "punkpeye/mcp-server-ebay",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-ebay/index.js"
      ],
      "env": {
        "PORT": "9169",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-ebay",
        "MCP_SERVER_CATEGORY": "retail"
      }
    },
    "tools": [
      {
        "name": "retail_list",
        "description": "List retail resources"
      },
      {
        "name": "retail_get",
        "description": "Get specific retail resource"
      },
      {
        "name": "retail_create",
        "description": "Create new retail resource"
      },
      {
        "name": "retail_update",
        "description": "Update retail resource"
      },
      {
        "name": "retail_delete",
        "description": "Delete retail resource"
      }
    ]
  },
  {
    "name": "mcp-server-etsy",
    "port": 9170,
    "category": "retail",
    "repo": "punkpeye/mcp-server-etsy",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-etsy/index.js"
      ],
      "env": {
        "PORT": "9170",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-etsy",
        "MCP_SERVER_CATEGORY": "retail"
      }
    },
    "tools": [
      {
        "name": "retail_list",
        "description": "List retail resources"
      },
      {
        "name": "retail_get",
        "description": "Get specific retail resource"
      },
      {
        "name": "retail_create",
        "description": "Create new retail resource"
      },
      {
        "name": "retail_update",
        "description": "Update retail resource"
      },
      {
        "name": "retail_delete",
        "description": "Delete retail resource"
      }
    ]
  },
  {
    "name": "mcp-server-unsplash",
    "port": 9171,
    "category": "photography",
    "repo": "punkpeye/mcp-server-unsplash",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-unsplash/index.js"
      ],
      "env": {
        "PORT": "9171",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-unsplash",
        "MCP_SERVER_CATEGORY": "photography"
      }
    },
    "tools": [
      {
        "name": "photography_list",
        "description": "List photography resources"
      },
      {
        "name": "photography_get",
        "description": "Get specific photography resource"
      },
      {
        "name": "photography_create",
        "description": "Create new photography resource"
      },
      {
        "name": "photography_update",
        "description": "Update photography resource"
      },
      {
        "name": "photography_delete",
        "description": "Delete photography resource"
      }
    ]
  },
  {
    "name": "mcp-server-pexels",
    "port": 9172,
    "category": "photography",
    "repo": "punkpeye/mcp-server-pexels",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-pexels/index.js"
      ],
      "env": {
        "PORT": "9172",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-pexels",
        "MCP_SERVER_CATEGORY": "photography"
      }
    },
    "tools": [
      {
        "name": "photography_list",
        "description": "List photography resources"
      },
      {
        "name": "photography_get",
        "description": "Get specific photography resource"
      },
      {
        "name": "photography_create",
        "description": "Create new photography resource"
      },
      {
        "name": "photography_update",
        "description": "Update photography resource"
      },
      {
        "name": "photography_delete",
        "description": "Delete photography resource"
      }
    ]
  },
  {
    "name": "mcp-server-shutterstock",
    "port": 9173,
    "category": "photography",
    "repo": "punkpeye/mcp-server-shutterstock",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-shutterstock/index.js"
      ],
      "env": {
        "PORT": "9173",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-shutterstock",
        "MCP_SERVER_CATEGORY": "photography"
      }
    },
    "tools": [
      {
        "name": "photography_list",
        "description": "List photography resources"
      },
      {
        "name": "photography_get",
        "description": "Get specific photography resource"
      },
      {
        "name": "photography_create",
        "description": "Create new photography resource"
      },
      {
        "name": "photography_update",
        "description": "Update photography resource"
      },
      {
        "name": "photography_delete",
        "description": "Delete photography resource"
      }
    ]
  },
  {
    "name": "mcp-server-backblaze",
    "port": 9174,
    "category": "backup",
    "repo": "punkpeye/mcp-server-backblaze",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-backblaze/index.js"
      ],
      "env": {
        "PORT": "9174",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-backblaze",
        "MCP_SERVER_CATEGORY": "backup"
      }
    },
    "tools": [
      {
        "name": "backup_list",
        "description": "List backup resources"
      },
      {
        "name": "backup_get",
        "description": "Get specific backup resource"
      },
      {
        "name": "backup_create",
        "description": "Create new backup resource"
      },
      {
        "name": "backup_update",
        "description": "Update backup resource"
      },
      {
        "name": "backup_delete",
        "description": "Delete backup resource"
      }
    ]
  },
  {
    "name": "mcp-server-carbonite",
    "port": 9175,
    "category": "backup",
    "repo": "punkpeye/mcp-server-carbonite",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-carbonite/index.js"
      ],
      "env": {
        "PORT": "9175",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-carbonite",
        "MCP_SERVER_CATEGORY": "backup"
      }
    },
    "tools": [
      {
        "name": "backup_list",
        "description": "List backup resources"
      },
      {
        "name": "backup_get",
        "description": "Get specific backup resource"
      },
      {
        "name": "backup_create",
        "description": "Create new backup resource"
      },
      {
        "name": "backup_update",
        "description": "Update backup resource"
      },
      {
        "name": "backup_delete",
        "description": "Delete backup resource"
      }
    ]
  },
  {
    "name": "mcp-server-cloudflare",
    "port": 9176,
    "category": "networking",
    "repo": "punkpeye/mcp-server-cloudflare",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-cloudflare/index.js"
      ],
      "env": {
        "PORT": "9176",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-cloudflare",
        "MCP_SERVER_CATEGORY": "networking"
      }
    },
    "tools": [
      {
        "name": "networking_list",
        "description": "List networking resources"
      },
      {
        "name": "networking_get",
        "description": "Get specific networking resource"
      },
      {
        "name": "networking_create",
        "description": "Create new networking resource"
      },
      {
        "name": "networking_update",
        "description": "Update networking resource"
      },
      {
        "name": "networking_delete",
        "description": "Delete networking resource"
      }
    ]
  },
  {
    "name": "mcp-server-dns",
    "port": 9177,
    "category": "networking",
    "repo": "punkpeye/mcp-server-dns",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-dns/index.js"
      ],
      "env": {
        "PORT": "9177",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-dns",
        "MCP_SERVER_CATEGORY": "networking"
      }
    },
    "tools": [
      {
        "name": "networking_list",
        "description": "List networking resources"
      },
      {
        "name": "networking_get",
        "description": "Get specific networking resource"
      },
      {
        "name": "networking_create",
        "description": "Create new networking resource"
      },
      {
        "name": "networking_update",
        "description": "Update networking resource"
      },
      {
        "name": "networking_delete",
        "description": "Delete networking resource"
      }
    ]
  },
  {
    "name": "mcp-server-browserstack",
    "port": 9178,
    "category": "testing",
    "repo": "punkpeye/mcp-server-browserstack",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-browserstack/index.js"
      ],
      "env": {
        "PORT": "9178",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-browserstack",
        "MCP_SERVER_CATEGORY": "testing"
      }
    },
    "tools": [
      {
        "name": "testing_list",
        "description": "List testing resources"
      },
      {
        "name": "testing_get",
        "description": "Get specific testing resource"
      },
      {
        "name": "testing_create",
        "description": "Create new testing resource"
      },
      {
        "name": "testing_update",
        "description": "Update testing resource"
      },
      {
        "name": "testing_delete",
        "description": "Delete testing resource"
      }
    ]
  },
  {
    "name": "mcp-server-sauce-labs",
    "port": 9179,
    "category": "testing",
    "repo": "punkpeye/mcp-server-sauce-labs",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-sauce-labs/index.js"
      ],
      "env": {
        "PORT": "9179",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-sauce-labs",
        "MCP_SERVER_CATEGORY": "testing"
      }
    },
    "tools": [
      {
        "name": "testing_list",
        "description": "List testing resources"
      },
      {
        "name": "testing_get",
        "description": "Get specific testing resource"
      },
      {
        "name": "testing_create",
        "description": "Create new testing resource"
      },
      {
        "name": "testing_update",
        "description": "Update testing resource"
      },
      {
        "name": "testing_delete",
        "description": "Delete testing resource"
      }
    ]
  },
  {
    "name": "mcp-server-gitbook",
    "port": 9180,
    "category": "documentation",
    "repo": "punkpeye/mcp-server-gitbook",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-gitbook/index.js"
      ],
      "env": {
        "PORT": "9180",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-gitbook",
        "MCP_SERVER_CATEGORY": "documentation"
      }
    },
    "tools": [
      {
        "name": "documentation_list",
        "description": "List documentation resources"
      },
      {
        "name": "documentation_get",
        "description": "Get specific documentation resource"
      },
      {
        "name": "documentation_create",
        "description": "Create new documentation resource"
      },
      {
        "name": "documentation_update",
        "description": "Update documentation resource"
      },
      {
        "name": "documentation_delete",
        "description": "Delete documentation resource"
      }
    ]
  },
  {
    "name": "mcp-server-confluence",
    "port": 9181,
    "category": "documentation",
    "repo": "punkpeye/mcp-server-confluence",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-confluence/index.js"
      ],
      "env": {
        "PORT": "9181",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-confluence",
        "MCP_SERVER_CATEGORY": "documentation"
      }
    },
    "tools": [
      {
        "name": "documentation_list",
        "description": "List documentation resources"
      },
      {
        "name": "documentation_get",
        "description": "Get specific documentation resource"
      },
      {
        "name": "documentation_create",
        "description": "Create new documentation resource"
      },
      {
        "name": "documentation_update",
        "description": "Update documentation resource"
      },
      {
        "name": "documentation_delete",
        "description": "Delete documentation resource"
      }
    ]
  },
  {
    "name": "mcp-server-zoom",
    "port": 9182,
    "category": "video-conferencing",
    "repo": "punkpeye/mcp-server-zoom",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-zoom/index.js"
      ],
      "env": {
        "PORT": "9182",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-zoom",
        "MCP_SERVER_CATEGORY": "video-conferencing"
      }
    },
    "tools": [
      {
        "name": "video-conferencing_list",
        "description": "List video-conferencing resources"
      },
      {
        "name": "video-conferencing_get",
        "description": "Get specific video-conferencing resource"
      },
      {
        "name": "video-conferencing_create",
        "description": "Create new video-conferencing resource"
      },
      {
        "name": "video-conferencing_update",
        "description": "Update video-conferencing resource"
      },
      {
        "name": "video-conferencing_delete",
        "description": "Delete video-conferencing resource"
      }
    ]
  },
  {
    "name": "mcp-server-teams",
    "port": 9183,
    "category": "video-conferencing",
    "repo": "punkpeye/mcp-server-teams",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-teams/index.js"
      ],
      "env": {
        "PORT": "9183",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-teams",
        "MCP_SERVER_CATEGORY": "video-conferencing"
      }
    },
    "tools": [
      {
        "name": "video-conferencing_list",
        "description": "List video-conferencing resources"
      },
      {
        "name": "video-conferencing_get",
        "description": "Get specific video-conferencing resource"
      },
      {
        "name": "video-conferencing_create",
        "description": "Create new video-conferencing resource"
      },
      {
        "name": "video-conferencing_update",
        "description": "Update video-conferencing resource"
      },
      {
        "name": "video-conferencing_delete",
        "description": "Delete video-conferencing resource"
      }
    ]
  },
  {
    "name": "mcp-server-webex",
    "port": 9184,
    "category": "video-conferencing",
    "repo": "punkpeye/mcp-server-webex",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-webex/index.js"
      ],
      "env": {
        "PORT": "9184",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-webex",
        "MCP_SERVER_CATEGORY": "video-conferencing"
      }
    },
    "tools": [
      {
        "name": "video-conferencing_list",
        "description": "List video-conferencing resources"
      },
      {
        "name": "video-conferencing_get",
        "description": "Get specific video-conferencing resource"
      },
      {
        "name": "video-conferencing_create",
        "description": "Create new video-conferencing resource"
      },
      {
        "name": "video-conferencing_update",
        "description": "Update video-conferencing resource"
      },
      {
        "name": "video-conferencing_delete",
        "description": "Delete video-conferencing resource"
      }
    ]
  },
  {
    "name": "mcp-server-typeform",
    "port": 9185,
    "category": "forms",
    "repo": "punkpeye/mcp-server-typeform",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-typeform/index.js"
      ],
      "env": {
        "PORT": "9185",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-typeform",
        "MCP_SERVER_CATEGORY": "forms"
      }
    },
    "tools": [
      {
        "name": "forms_list",
        "description": "List forms resources"
      },
      {
        "name": "forms_get",
        "description": "Get specific forms resource"
      },
      {
        "name": "forms_create",
        "description": "Create new forms resource"
      },
      {
        "name": "forms_update",
        "description": "Update forms resource"
      },
      {
        "name": "forms_delete",
        "description": "Delete forms resource"
      }
    ]
  },
  {
    "name": "mcp-server-surveymonkey",
    "port": 9186,
    "category": "forms",
    "repo": "punkpeye/mcp-server-surveymonkey",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-surveymonkey/index.js"
      ],
      "env": {
        "PORT": "9186",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-surveymonkey",
        "MCP_SERVER_CATEGORY": "forms"
      }
    },
    "tools": [
      {
        "name": "forms_list",
        "description": "List forms resources"
      },
      {
        "name": "forms_get",
        "description": "Get specific forms resource"
      },
      {
        "name": "forms_create",
        "description": "Create new forms resource"
      },
      {
        "name": "forms_update",
        "description": "Update forms resource"
      },
      {
        "name": "forms_delete",
        "description": "Delete forms resource"
      }
    ]
  },
  {
    "name": "mcp-server-google-forms",
    "port": 9187,
    "category": "forms",
    "repo": "punkpeye/mcp-server-google-forms",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-google-forms/index.js"
      ],
      "env": {
        "PORT": "9187",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-google-forms",
        "MCP_SERVER_CATEGORY": "forms"
      }
    },
    "tools": [
      {
        "name": "forms_list",
        "description": "List forms resources"
      },
      {
        "name": "forms_get",
        "description": "Get specific forms resource"
      },
      {
        "name": "forms_create",
        "description": "Create new forms resource"
      },
      {
        "name": "forms_update",
        "description": "Update forms resource"
      },
      {
        "name": "forms_delete",
        "description": "Delete forms resource"
      }
    ]
  },
  {
    "name": "mcp-server-zapier",
    "port": 9188,
    "category": "automation",
    "repo": "punkpeye/mcp-server-zapier",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-zapier/index.js"
      ],
      "env": {
        "PORT": "9188",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-zapier",
        "MCP_SERVER_CATEGORY": "automation"
      }
    },
    "tools": [
      {
        "name": "automation_list",
        "description": "List automation resources"
      },
      {
        "name": "automation_get",
        "description": "Get specific automation resource"
      },
      {
        "name": "automation_create",
        "description": "Create new automation resource"
      },
      {
        "name": "automation_update",
        "description": "Update automation resource"
      },
      {
        "name": "automation_delete",
        "description": "Delete automation resource"
      }
    ]
  },
  {
    "name": "mcp-server-ifttt",
    "port": 9189,
    "category": "automation",
    "repo": "punkpeye/mcp-server-ifttt",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-ifttt/index.js"
      ],
      "env": {
        "PORT": "9189",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-ifttt",
        "MCP_SERVER_CATEGORY": "automation"
      }
    },
    "tools": [
      {
        "name": "automation_list",
        "description": "List automation resources"
      },
      {
        "name": "automation_get",
        "description": "Get specific automation resource"
      },
      {
        "name": "automation_create",
        "description": "Create new automation resource"
      },
      {
        "name": "automation_update",
        "description": "Update automation resource"
      },
      {
        "name": "automation_delete",
        "description": "Delete automation resource"
      }
    ]
  },
  {
    "name": "mcp-server-microsoft-flow",
    "port": 9190,
    "category": "automation",
    "repo": "punkpeye/mcp-server-microsoft-flow",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-microsoft-flow/index.js"
      ],
      "env": {
        "PORT": "9190",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-microsoft-flow",
        "MCP_SERVER_CATEGORY": "automation"
      }
    },
    "tools": [
      {
        "name": "automation_list",
        "description": "List automation resources"
      },
      {
        "name": "automation_get",
        "description": "Get specific automation resource"
      },
      {
        "name": "automation_create",
        "description": "Create new automation resource"
      },
      {
        "name": "automation_update",
        "description": "Update automation resource"
      },
      {
        "name": "automation_delete",
        "description": "Delete automation resource"
      }
    ]
  },
  {
    "name": "mcp-server-git",
    "port": 9191,
    "category": "version-control",
    "repo": "modelcontextprotocol/servers/src/git",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-git/index.js"
      ],
      "env": {
        "PORT": "9191",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-git",
        "MCP_SERVER_CATEGORY": "version-control"
      }
    },
    "tools": [
      {
        "name": "version-control_list",
        "description": "List version-control resources"
      },
      {
        "name": "version-control_get",
        "description": "Get specific version-control resource"
      },
      {
        "name": "version-control_create",
        "description": "Create new version-control resource"
      },
      {
        "name": "version-control_update",
        "description": "Update version-control resource"
      },
      {
        "name": "version-control_delete",
        "description": "Delete version-control resource"
      }
    ]
  },
  {
    "name": "mcp-server-svn",
    "port": 9192,
    "category": "version-control",
    "repo": "punkpeye/mcp-server-svn",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-svn/index.js"
      ],
      "env": {
        "PORT": "9192",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-svn",
        "MCP_SERVER_CATEGORY": "version-control"
      }
    },
    "tools": [
      {
        "name": "version-control_list",
        "description": "List version-control resources"
      },
      {
        "name": "version-control_get",
        "description": "Get specific version-control resource"
      },
      {
        "name": "version-control_create",
        "description": "Create new version-control resource"
      },
      {
        "name": "version-control_update",
        "description": "Update version-control resource"
      },
      {
        "name": "version-control_delete",
        "description": "Delete version-control resource"
      }
    ]
  },
  {
    "name": "mcp-server-mercurial",
    "port": 9193,
    "category": "version-control",
    "repo": "punkpeye/mcp-server-mercurial",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-mercurial/index.js"
      ],
      "env": {
        "PORT": "9193",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-mercurial",
        "MCP_SERVER_CATEGORY": "version-control"
      }
    },
    "tools": [
      {
        "name": "version-control_list",
        "description": "List version-control resources"
      },
      {
        "name": "version-control_get",
        "description": "Get specific version-control resource"
      },
      {
        "name": "version-control_create",
        "description": "Create new version-control resource"
      },
      {
        "name": "version-control_update",
        "description": "Update version-control resource"
      },
      {
        "name": "version-control_delete",
        "description": "Delete version-control resource"
      }
    ]
  },
  {
    "name": "mcp-server-npm",
    "port": 9194,
    "category": "package-manager",
    "repo": "punkpeye/mcp-server-npm",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-npm/index.js"
      ],
      "env": {
        "PORT": "9194",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-npm",
        "MCP_SERVER_CATEGORY": "package-manager"
      }
    },
    "tools": [
      {
        "name": "package-manager_list",
        "description": "List package-manager resources"
      },
      {
        "name": "package-manager_get",
        "description": "Get specific package-manager resource"
      },
      {
        "name": "package-manager_create",
        "description": "Create new package-manager resource"
      },
      {
        "name": "package-manager_update",
        "description": "Update package-manager resource"
      },
      {
        "name": "package-manager_delete",
        "description": "Delete package-manager resource"
      }
    ]
  },
  {
    "name": "mcp-server-pip",
    "port": 9195,
    "category": "package-manager",
    "repo": "punkpeye/mcp-server-pip",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-pip/index.js"
      ],
      "env": {
        "PORT": "9195",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-pip",
        "MCP_SERVER_CATEGORY": "package-manager"
      }
    },
    "tools": [
      {
        "name": "package-manager_list",
        "description": "List package-manager resources"
      },
      {
        "name": "package-manager_get",
        "description": "Get specific package-manager resource"
      },
      {
        "name": "package-manager_create",
        "description": "Create new package-manager resource"
      },
      {
        "name": "package-manager_update",
        "description": "Update package-manager resource"
      },
      {
        "name": "package-manager_delete",
        "description": "Delete package-manager resource"
      }
    ]
  },
  {
    "name": "mcp-server-composer",
    "port": 9196,
    "category": "package-manager",
    "repo": "punkpeye/mcp-server-composer",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-composer/index.js"
      ],
      "env": {
        "PORT": "9196",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-composer",
        "MCP_SERVER_CATEGORY": "package-manager"
      }
    },
    "tools": [
      {
        "name": "package-manager_list",
        "description": "List package-manager resources"
      },
      {
        "name": "package-manager_get",
        "description": "Get specific package-manager resource"
      },
      {
        "name": "package-manager_create",
        "description": "Create new package-manager resource"
      },
      {
        "name": "package-manager_update",
        "description": "Update package-manager resource"
      },
      {
        "name": "package-manager_delete",
        "description": "Delete package-manager resource"
      }
    ]
  },
  {
    "name": "mcp-server-sonarqube",
    "port": 9197,
    "category": "code-quality",
    "repo": "punkpeye/mcp-server-sonarqube",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-sonarqube/index.js"
      ],
      "env": {
        "PORT": "9197",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-sonarqube",
        "MCP_SERVER_CATEGORY": "code-quality"
      }
    },
    "tools": [
      {
        "name": "code-quality_list",
        "description": "List code-quality resources"
      },
      {
        "name": "code-quality_get",
        "description": "Get specific code-quality resource"
      },
      {
        "name": "code-quality_create",
        "description": "Create new code-quality resource"
      },
      {
        "name": "code-quality_update",
        "description": "Update code-quality resource"
      },
      {
        "name": "code-quality_delete",
        "description": "Delete code-quality resource"
      }
    ]
  },
  {
    "name": "mcp-server-codeclimate",
    "port": 9198,
    "category": "code-quality",
    "repo": "punkpeye/mcp-server-codeclimate",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-codeclimate/index.js"
      ],
      "env": {
        "PORT": "9198",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-codeclimate",
        "MCP_SERVER_CATEGORY": "code-quality"
      }
    },
    "tools": [
      {
        "name": "code-quality_list",
        "description": "List code-quality resources"
      },
      {
        "name": "code-quality_get",
        "description": "Get specific code-quality resource"
      },
      {
        "name": "code-quality_create",
        "description": "Create new code-quality resource"
      },
      {
        "name": "code-quality_update",
        "description": "Update code-quality resource"
      },
      {
        "name": "code-quality_delete",
        "description": "Delete code-quality resource"
      }
    ]
  },
  {
    "name": "mcp-server-eslint",
    "port": 9199,
    "category": "code-quality",
    "repo": "punkpeye/mcp-server-eslint",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-eslint/index.js"
      ],
      "env": {
        "PORT": "9199",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-eslint",
        "MCP_SERVER_CATEGORY": "code-quality"
      }
    },
    "tools": [
      {
        "name": "code-quality_list",
        "description": "List code-quality resources"
      },
      {
        "name": "code-quality_get",
        "description": "Get specific code-quality resource"
      },
      {
        "name": "code-quality_create",
        "description": "Create new code-quality resource"
      },
      {
        "name": "code-quality_update",
        "description": "Update code-quality resource"
      },
      {
        "name": "code-quality_delete",
        "description": "Delete code-quality resource"
      }
    ]
  },
  {
    "name": "mcp-server-logstash",
    "port": 9200,
    "category": "logging",
    "repo": "punkpeye/mcp-server-logstash",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-logstash/index.js"
      ],
      "env": {
        "PORT": "9200",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-logstash",
        "MCP_SERVER_CATEGORY": "logging"
      }
    },
    "tools": [
      {
        "name": "logging_list",
        "description": "List logging resources"
      },
      {
        "name": "logging_get",
        "description": "Get specific logging resource"
      },
      {
        "name": "logging_create",
        "description": "Create new logging resource"
      },
      {
        "name": "logging_update",
        "description": "Update logging resource"
      },
      {
        "name": "logging_delete",
        "description": "Delete logging resource"
      }
    ]
  },
  {
    "name": "mcp-server-splunk",
    "port": 9201,
    "category": "logging",
    "repo": "punkpeye/mcp-server-splunk",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-splunk/index.js"
      ],
      "env": {
        "PORT": "9201",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-splunk",
        "MCP_SERVER_CATEGORY": "logging"
      }
    },
    "tools": [
      {
        "name": "logging_list",
        "description": "List logging resources"
      },
      {
        "name": "logging_get",
        "description": "Get specific logging resource"
      },
      {
        "name": "logging_create",
        "description": "Create new logging resource"
      },
      {
        "name": "logging_update",
        "description": "Update logging resource"
      },
      {
        "name": "logging_delete",
        "description": "Delete logging resource"
      }
    ]
  },
  {
    "name": "mcp-server-fluentd",
    "port": 9202,
    "category": "logging",
    "repo": "punkpeye/mcp-server-fluentd",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-fluentd/index.js"
      ],
      "env": {
        "PORT": "9202",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-fluentd",
        "MCP_SERVER_CATEGORY": "logging"
      }
    },
    "tools": [
      {
        "name": "logging_list",
        "description": "List logging resources"
      },
      {
        "name": "logging_get",
        "description": "Get specific logging resource"
      },
      {
        "name": "logging_create",
        "description": "Create new logging resource"
      },
      {
        "name": "logging_update",
        "description": "Update logging resource"
      },
      {
        "name": "logging_delete",
        "description": "Delete logging resource"
      }
    ]
  },
  {
    "name": "mcp-server-rabbitmq",
    "port": 9203,
    "category": "message-queue",
    "repo": "punkpeye/mcp-server-rabbitmq",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-rabbitmq/index.js"
      ],
      "env": {
        "PORT": "9203",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-rabbitmq",
        "MCP_SERVER_CATEGORY": "message-queue"
      }
    },
    "tools": [
      {
        "name": "message-queue_list",
        "description": "List message-queue resources"
      },
      {
        "name": "message-queue_get",
        "description": "Get specific message-queue resource"
      },
      {
        "name": "message-queue_create",
        "description": "Create new message-queue resource"
      },
      {
        "name": "message-queue_update",
        "description": "Update message-queue resource"
      },
      {
        "name": "message-queue_delete",
        "description": "Delete message-queue resource"
      }
    ]
  },
  {
    "name": "mcp-server-kafka",
    "port": 9204,
    "category": "message-queue",
    "repo": "punkpeye/mcp-server-kafka",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-kafka/index.js"
      ],
      "env": {
        "PORT": "9204",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-kafka",
        "MCP_SERVER_CATEGORY": "message-queue"
      }
    },
    "tools": [
      {
        "name": "message-queue_list",
        "description": "List message-queue resources"
      },
      {
        "name": "message-queue_get",
        "description": "Get specific message-queue resource"
      },
      {
        "name": "message-queue_create",
        "description": "Create new message-queue resource"
      },
      {
        "name": "message-queue_update",
        "description": "Update message-queue resource"
      },
      {
        "name": "message-queue_delete",
        "description": "Delete message-queue resource"
      }
    ]
  },
  {
    "name": "mcp-server-activemq",
    "port": 9205,
    "category": "message-queue",
    "repo": "punkpeye/mcp-server-activemq",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-activemq/index.js"
      ],
      "env": {
        "PORT": "9205",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-activemq",
        "MCP_SERVER_CATEGORY": "message-queue"
      }
    },
    "tools": [
      {
        "name": "message-queue_list",
        "description": "List message-queue resources"
      },
      {
        "name": "message-queue_get",
        "description": "Get specific message-queue resource"
      },
      {
        "name": "message-queue_create",
        "description": "Create new message-queue resource"
      },
      {
        "name": "message-queue_update",
        "description": "Update message-queue resource"
      },
      {
        "name": "message-queue_delete",
        "description": "Delete message-queue resource"
      }
    ]
  },
  {
    "name": "mcp-server-solr",
    "port": 9206,
    "category": "search-engine",
    "repo": "punkpeye/mcp-server-solr",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-solr/index.js"
      ],
      "env": {
        "PORT": "9206",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-solr",
        "MCP_SERVER_CATEGORY": "search-engine"
      }
    },
    "tools": [
      {
        "name": "search-engine_list",
        "description": "List search-engine resources"
      },
      {
        "name": "search-engine_get",
        "description": "Get specific search-engine resource"
      },
      {
        "name": "search-engine_create",
        "description": "Create new search-engine resource"
      },
      {
        "name": "search-engine_update",
        "description": "Update search-engine resource"
      },
      {
        "name": "search-engine_delete",
        "description": "Delete search-engine resource"
      }
    ]
  },
  {
    "name": "mcp-server-algolia",
    "port": 9207,
    "category": "search-engine",
    "repo": "punkpeye/mcp-server-algolia",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-algolia/index.js"
      ],
      "env": {
        "PORT": "9207",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-algolia",
        "MCP_SERVER_CATEGORY": "search-engine"
      }
    },
    "tools": [
      {
        "name": "search-engine_list",
        "description": "List search-engine resources"
      },
      {
        "name": "search-engine_get",
        "description": "Get specific search-engine resource"
      },
      {
        "name": "search-engine_create",
        "description": "Create new search-engine resource"
      },
      {
        "name": "search-engine_update",
        "description": "Update search-engine resource"
      },
      {
        "name": "search-engine_delete",
        "description": "Delete search-engine resource"
      }
    ]
  },
  {
    "name": "mcp-server-memcached",
    "port": 9208,
    "category": "cache",
    "repo": "punkpeye/mcp-server-memcached",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-memcached/index.js"
      ],
      "env": {
        "PORT": "9208",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-memcached",
        "MCP_SERVER_CATEGORY": "cache"
      }
    },
    "tools": [
      {
        "name": "cache_list",
        "description": "List cache resources"
      },
      {
        "name": "cache_get",
        "description": "Get specific cache resource"
      },
      {
        "name": "cache_create",
        "description": "Create new cache resource"
      },
      {
        "name": "cache_update",
        "description": "Update cache resource"
      },
      {
        "name": "cache_delete",
        "description": "Delete cache resource"
      }
    ]
  },
  {
    "name": "mcp-server-varnish",
    "port": 9209,
    "category": "cache",
    "repo": "punkpeye/mcp-server-varnish",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-varnish/index.js"
      ],
      "env": {
        "PORT": "9209",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-varnish",
        "MCP_SERVER_CATEGORY": "cache"
      }
    },
    "tools": [
      {
        "name": "cache_list",
        "description": "List cache resources"
      },
      {
        "name": "cache_get",
        "description": "Get specific cache resource"
      },
      {
        "name": "cache_create",
        "description": "Create new cache resource"
      },
      {
        "name": "cache_update",
        "description": "Update cache resource"
      },
      {
        "name": "cache_delete",
        "description": "Delete cache resource"
      }
    ]
  },
  {
    "name": "mcp-server-nginx",
    "port": 9210,
    "category": "load-balancer",
    "repo": "punkpeye/mcp-server-nginx",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-nginx/index.js"
      ],
      "env": {
        "PORT": "9210",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-nginx",
        "MCP_SERVER_CATEGORY": "load-balancer"
      }
    },
    "tools": [
      {
        "name": "load-balancer_list",
        "description": "List load-balancer resources"
      },
      {
        "name": "load-balancer_get",
        "description": "Get specific load-balancer resource"
      },
      {
        "name": "load-balancer_create",
        "description": "Create new load-balancer resource"
      },
      {
        "name": "load-balancer_update",
        "description": "Update load-balancer resource"
      },
      {
        "name": "load-balancer_delete",
        "description": "Delete load-balancer resource"
      }
    ]
  },
  {
    "name": "mcp-server-haproxy",
    "port": 9211,
    "category": "load-balancer",
    "repo": "punkpeye/mcp-server-haproxy",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-haproxy/index.js"
      ],
      "env": {
        "PORT": "9211",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-haproxy",
        "MCP_SERVER_CATEGORY": "load-balancer"
      }
    },
    "tools": [
      {
        "name": "load-balancer_list",
        "description": "List load-balancer resources"
      },
      {
        "name": "load-balancer_get",
        "description": "Get specific load-balancer resource"
      },
      {
        "name": "load-balancer_create",
        "description": "Create new load-balancer resource"
      },
      {
        "name": "load-balancer_update",
        "description": "Update load-balancer resource"
      },
      {
        "name": "load-balancer_delete",
        "description": "Delete load-balancer resource"
      }
    ]
  },
  {
    "name": "mcp-server-podman",
    "port": 9212,
    "category": "container",
    "repo": "punkpeye/mcp-server-podman",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-podman/index.js"
      ],
      "env": {
        "PORT": "9212",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-podman",
        "MCP_SERVER_CATEGORY": "container"
      }
    },
    "tools": [
      {
        "name": "container_list",
        "description": "List container resources"
      },
      {
        "name": "container_get",
        "description": "Get specific container resource"
      },
      {
        "name": "container_create",
        "description": "Create new container resource"
      },
      {
        "name": "container_update",
        "description": "Update container resource"
      },
      {
        "name": "container_delete",
        "description": "Delete container resource"
      }
    ]
  },
  {
    "name": "mcp-server-containerd",
    "port": 9213,
    "category": "container",
    "repo": "punkpeye/mcp-server-containerd",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-containerd/index.js"
      ],
      "env": {
        "PORT": "9213",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-containerd",
        "MCP_SERVER_CATEGORY": "container"
      }
    },
    "tools": [
      {
        "name": "container_list",
        "description": "List container resources"
      },
      {
        "name": "container_get",
        "description": "Get specific container resource"
      },
      {
        "name": "container_create",
        "description": "Create new container resource"
      },
      {
        "name": "container_update",
        "description": "Update container resource"
      },
      {
        "name": "container_delete",
        "description": "Delete container resource"
      }
    ]
  },
  {
    "name": "mcp-server-nomad",
    "port": 9214,
    "category": "orchestration",
    "repo": "punkpeye/mcp-server-nomad",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-nomad/index.js"
      ],
      "env": {
        "PORT": "9214",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-nomad",
        "MCP_SERVER_CATEGORY": "orchestration"
      }
    },
    "tools": [
      {
        "name": "orchestration_list",
        "description": "List orchestration resources"
      },
      {
        "name": "orchestration_get",
        "description": "Get specific orchestration resource"
      },
      {
        "name": "orchestration_create",
        "description": "Create new orchestration resource"
      },
      {
        "name": "orchestration_update",
        "description": "Update orchestration resource"
      },
      {
        "name": "orchestration_delete",
        "description": "Delete orchestration resource"
      }
    ]
  },
  {
    "name": "mcp-server-swarm",
    "port": 9215,
    "category": "orchestration",
    "repo": "punkpeye/mcp-server-swarm",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-swarm/index.js"
      ],
      "env": {
        "PORT": "9215",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-swarm",
        "MCP_SERVER_CATEGORY": "orchestration"
      }
    },
    "tools": [
      {
        "name": "orchestration_list",
        "description": "List orchestration resources"
      },
      {
        "name": "orchestration_get",
        "description": "Get specific orchestration resource"
      },
      {
        "name": "orchestration_create",
        "description": "Create new orchestration resource"
      },
      {
        "name": "orchestration_update",
        "description": "Update orchestration resource"
      },
      {
        "name": "orchestration_delete",
        "description": "Delete orchestration resource"
      }
    ]
  },
  {
    "name": "mcp-server-istio",
    "port": 9216,
    "category": "service-mesh",
    "repo": "punkpeye/mcp-server-istio",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-istio/index.js"
      ],
      "env": {
        "PORT": "9216",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-istio",
        "MCP_SERVER_CATEGORY": "service-mesh"
      }
    },
    "tools": [
      {
        "name": "service-mesh_list",
        "description": "List service-mesh resources"
      },
      {
        "name": "service-mesh_get",
        "description": "Get specific service-mesh resource"
      },
      {
        "name": "service-mesh_create",
        "description": "Create new service-mesh resource"
      },
      {
        "name": "service-mesh_update",
        "description": "Update service-mesh resource"
      },
      {
        "name": "service-mesh_delete",
        "description": "Delete service-mesh resource"
      }
    ]
  },
  {
    "name": "mcp-server-linkerd",
    "port": 9217,
    "category": "service-mesh",
    "repo": "punkpeye/mcp-server-linkerd",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-linkerd/index.js"
      ],
      "env": {
        "PORT": "9217",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-linkerd",
        "MCP_SERVER_CATEGORY": "service-mesh"
      }
    },
    "tools": [
      {
        "name": "service-mesh_list",
        "description": "List service-mesh resources"
      },
      {
        "name": "service-mesh_get",
        "description": "Get specific service-mesh resource"
      },
      {
        "name": "service-mesh_create",
        "description": "Create new service-mesh resource"
      },
      {
        "name": "service-mesh_update",
        "description": "Update service-mesh resource"
      },
      {
        "name": "service-mesh_delete",
        "description": "Delete service-mesh resource"
      }
    ]
  },
  {
    "name": "mcp-server-kong",
    "port": 9218,
    "category": "api-gateway",
    "repo": "punkpeye/mcp-server-kong",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-kong/index.js"
      ],
      "env": {
        "PORT": "9218",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-kong",
        "MCP_SERVER_CATEGORY": "api-gateway"
      }
    },
    "tools": [
      {
        "name": "api-gateway_list",
        "description": "List api-gateway resources"
      },
      {
        "name": "api-gateway_get",
        "description": "Get specific api-gateway resource"
      },
      {
        "name": "api-gateway_create",
        "description": "Create new api-gateway resource"
      },
      {
        "name": "api-gateway_update",
        "description": "Update api-gateway resource"
      },
      {
        "name": "api-gateway_delete",
        "description": "Delete api-gateway resource"
      }
    ]
  },
  {
    "name": "mcp-server-ambassador",
    "port": 9219,
    "category": "api-gateway",
    "repo": "punkpeye/mcp-server-ambassador",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-ambassador/index.js"
      ],
      "env": {
        "PORT": "9219",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-ambassador",
        "MCP_SERVER_CATEGORY": "api-gateway"
      }
    },
    "tools": [
      {
        "name": "api-gateway_list",
        "description": "List api-gateway resources"
      },
      {
        "name": "api-gateway_get",
        "description": "Get specific api-gateway resource"
      },
      {
        "name": "api-gateway_create",
        "description": "Create new api-gateway resource"
      },
      {
        "name": "api-gateway_update",
        "description": "Update api-gateway resource"
      },
      {
        "name": "api-gateway_delete",
        "description": "Delete api-gateway resource"
      }
    ]
  },
  {
    "name": "mcp-server-consul",
    "port": 9220,
    "category": "secrets",
    "repo": "punkpeye/mcp-server-consul",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-consul/index.js"
      ],
      "env": {
        "PORT": "9220",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-consul",
        "MCP_SERVER_CATEGORY": "secrets"
      }
    },
    "tools": [
      {
        "name": "secrets_list",
        "description": "List secrets resources"
      },
      {
        "name": "secrets_get",
        "description": "Get specific secrets resource"
      },
      {
        "name": "secrets_create",
        "description": "Create new secrets resource"
      },
      {
        "name": "secrets_update",
        "description": "Update secrets resource"
      },
      {
        "name": "secrets_delete",
        "description": "Delete secrets resource"
      }
    ]
  },
  {
    "name": "mcp-server-etcd",
    "port": 9221,
    "category": "secrets",
    "repo": "punkpeye/mcp-server-etcd",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-etcd/index.js"
      ],
      "env": {
        "PORT": "9221",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-etcd",
        "MCP_SERVER_CATEGORY": "secrets"
      }
    },
    "tools": [
      {
        "name": "secrets_list",
        "description": "List secrets resources"
      },
      {
        "name": "secrets_get",
        "description": "Get specific secrets resource"
      },
      {
        "name": "secrets_create",
        "description": "Create new secrets resource"
      },
      {
        "name": "secrets_update",
        "description": "Update secrets resource"
      },
      {
        "name": "secrets_delete",
        "description": "Delete secrets resource"
      }
    ]
  },
  {
    "name": "mcp-server-velero",
    "port": 9222,
    "category": "backup-solution",
    "repo": "punkpeye/mcp-server-velero",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-velero/index.js"
      ],
      "env": {
        "PORT": "9222",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-velero",
        "MCP_SERVER_CATEGORY": "backup-solution"
      }
    },
    "tools": [
      {
        "name": "backup-solution_list",
        "description": "List backup-solution resources"
      },
      {
        "name": "backup-solution_get",
        "description": "Get specific backup-solution resource"
      },
      {
        "name": "backup-solution_create",
        "description": "Create new backup-solution resource"
      },
      {
        "name": "backup-solution_update",
        "description": "Update backup-solution resource"
      },
      {
        "name": "backup-solution_delete",
        "description": "Delete backup-solution resource"
      }
    ]
  },
  {
    "name": "mcp-server-restic",
    "port": 9223,
    "category": "backup-solution",
    "repo": "punkpeye/mcp-server-restic",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-restic/index.js"
      ],
      "env": {
        "PORT": "9223",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-restic",
        "MCP_SERVER_CATEGORY": "backup-solution"
      }
    },
    "tools": [
      {
        "name": "backup-solution_list",
        "description": "List backup-solution resources"
      },
      {
        "name": "backup-solution_get",
        "description": "Get specific backup-solution resource"
      },
      {
        "name": "backup-solution_create",
        "description": "Create new backup-solution resource"
      },
      {
        "name": "backup-solution_update",
        "description": "Update backup-solution resource"
      },
      {
        "name": "backup-solution_delete",
        "description": "Delete backup-solution resource"
      }
    ]
  },
  {
    "name": "mcp-server-disaster-recovery",
    "port": 9224,
    "category": "disaster-recovery",
    "repo": "punkpeye/mcp-server-disaster-recovery",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-disaster-recovery/index.js"
      ],
      "env": {
        "PORT": "9224",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-disaster-recovery",
        "MCP_SERVER_CATEGORY": "disaster-recovery"
      }
    },
    "tools": [
      {
        "name": "disaster-recovery_list",
        "description": "List disaster-recovery resources"
      },
      {
        "name": "disaster-recovery_get",
        "description": "Get specific disaster-recovery resource"
      },
      {
        "name": "disaster-recovery_create",
        "description": "Create new disaster-recovery resource"
      },
      {
        "name": "disaster-recovery_update",
        "description": "Update disaster-recovery resource"
      },
      {
        "name": "disaster-recovery_delete",
        "description": "Delete disaster-recovery resource"
      }
    ]
  },
  {
    "name": "mcp-server-jmeter",
    "port": 9225,
    "category": "performance-testing",
    "repo": "punkpeye/mcp-server-jmeter",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-jmeter/index.js"
      ],
      "env": {
        "PORT": "9225",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-jmeter",
        "MCP_SERVER_CATEGORY": "performance-testing"
      }
    },
    "tools": [
      {
        "name": "performance-testing_list",
        "description": "List performance-testing resources"
      },
      {
        "name": "performance-testing_get",
        "description": "Get specific performance-testing resource"
      },
      {
        "name": "performance-testing_create",
        "description": "Create new performance-testing resource"
      },
      {
        "name": "performance-testing_update",
        "description": "Update performance-testing resource"
      },
      {
        "name": "performance-testing_delete",
        "description": "Delete performance-testing resource"
      }
    ]
  },
  {
    "name": "mcp-server-gatling",
    "port": 9226,
    "category": "performance-testing",
    "repo": "punkpeye/mcp-server-gatling",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-gatling/index.js"
      ],
      "env": {
        "PORT": "9226",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-gatling",
        "MCP_SERVER_CATEGORY": "performance-testing"
      }
    },
    "tools": [
      {
        "name": "performance-testing_list",
        "description": "List performance-testing resources"
      },
      {
        "name": "performance-testing_get",
        "description": "Get specific performance-testing resource"
      },
      {
        "name": "performance-testing_create",
        "description": "Create new performance-testing resource"
      },
      {
        "name": "performance-testing_update",
        "description": "Update performance-testing resource"
      },
      {
        "name": "performance-testing_delete",
        "description": "Delete performance-testing resource"
      }
    ]
  },
  {
    "name": "mcp-server-nessus",
    "port": 9227,
    "category": "security-scanning",
    "repo": "punkpeye/mcp-server-nessus",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-nessus/index.js"
      ],
      "env": {
        "PORT": "9227",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-nessus",
        "MCP_SERVER_CATEGORY": "security-scanning"
      }
    },
    "tools": [
      {
        "name": "security-scanning_list",
        "description": "List security-scanning resources"
      },
      {
        "name": "security-scanning_get",
        "description": "Get specific security-scanning resource"
      },
      {
        "name": "security-scanning_create",
        "description": "Create new security-scanning resource"
      },
      {
        "name": "security-scanning_update",
        "description": "Update security-scanning resource"
      },
      {
        "name": "security-scanning_delete",
        "description": "Delete security-scanning resource"
      }
    ]
  },
  {
    "name": "mcp-server-openvas",
    "port": 9228,
    "category": "security-scanning",
    "repo": "punkpeye/mcp-server-openvas",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-openvas/index.js"
      ],
      "env": {
        "PORT": "9228",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-openvas",
        "MCP_SERVER_CATEGORY": "security-scanning"
      }
    },
    "tools": [
      {
        "name": "security-scanning_list",
        "description": "List security-scanning resources"
      },
      {
        "name": "security-scanning_get",
        "description": "Get specific security-scanning resource"
      },
      {
        "name": "security-scanning_create",
        "description": "Create new security-scanning resource"
      },
      {
        "name": "security-scanning_update",
        "description": "Update security-scanning resource"
      },
      {
        "name": "security-scanning_delete",
        "description": "Delete security-scanning resource"
      }
    ]
  },
  {
    "name": "mcp-server-compliance-checker",
    "port": 9229,
    "category": "compliance",
    "repo": "punkpeye/mcp-server-compliance-checker",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-compliance-checker/index.js"
      ],
      "env": {
        "PORT": "9229",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-compliance-checker",
        "MCP_SERVER_CATEGORY": "compliance"
      }
    },
    "tools": [
      {
        "name": "compliance_list",
        "description": "List compliance resources"
      },
      {
        "name": "compliance_get",
        "description": "Get specific compliance resource"
      },
      {
        "name": "compliance_create",
        "description": "Create new compliance resource"
      },
      {
        "name": "compliance_update",
        "description": "Update compliance resource"
      },
      {
        "name": "compliance_delete",
        "description": "Delete compliance resource"
      }
    ]
  },
  {
    "name": "mcp-server-pagerduty",
    "port": 9230,
    "category": "incident-management",
    "repo": "punkpeye/mcp-server-pagerduty",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-pagerduty/index.js"
      ],
      "env": {
        "PORT": "9230",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-pagerduty",
        "MCP_SERVER_CATEGORY": "incident-management"
      }
    },
    "tools": [
      {
        "name": "incident-management_list",
        "description": "List incident-management resources"
      },
      {
        "name": "incident-management_get",
        "description": "Get specific incident-management resource"
      },
      {
        "name": "incident-management_create",
        "description": "Create new incident-management resource"
      },
      {
        "name": "incident-management_update",
        "description": "Update incident-management resource"
      },
      {
        "name": "incident-management_delete",
        "description": "Delete incident-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-opsgenie",
    "port": 9231,
    "category": "incident-management",
    "repo": "punkpeye/mcp-server-opsgenie",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-opsgenie/index.js"
      ],
      "env": {
        "PORT": "9231",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-opsgenie",
        "MCP_SERVER_CATEGORY": "incident-management"
      }
    },
    "tools": [
      {
        "name": "incident-management_list",
        "description": "List incident-management resources"
      },
      {
        "name": "incident-management_get",
        "description": "Get specific incident-management resource"
      },
      {
        "name": "incident-management_create",
        "description": "Create new incident-management resource"
      },
      {
        "name": "incident-management_update",
        "description": "Update incident-management resource"
      },
      {
        "name": "incident-management_delete",
        "description": "Delete incident-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-asset-tracker",
    "port": 9232,
    "category": "asset-management",
    "repo": "punkpeye/mcp-server-asset-tracker",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-asset-tracker/index.js"
      ],
      "env": {
        "PORT": "9232",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-asset-tracker",
        "MCP_SERVER_CATEGORY": "asset-management"
      }
    },
    "tools": [
      {
        "name": "asset-management_list",
        "description": "List asset-management resources"
      },
      {
        "name": "asset-management_get",
        "description": "Get specific asset-management resource"
      },
      {
        "name": "asset-management_create",
        "description": "Create new asset-management resource"
      },
      {
        "name": "asset-management_update",
        "description": "Update asset-management resource"
      },
      {
        "name": "asset-management_delete",
        "description": "Delete asset-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-change-tracker",
    "port": 9233,
    "category": "change-management",
    "repo": "punkpeye/mcp-server-change-tracker",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-change-tracker/index.js"
      ],
      "env": {
        "PORT": "9233",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-change-tracker",
        "MCP_SERVER_CATEGORY": "change-management"
      }
    },
    "tools": [
      {
        "name": "change-management_list",
        "description": "List change-management resources"
      },
      {
        "name": "change-management_get",
        "description": "Get specific change-management resource"
      },
      {
        "name": "change-management_create",
        "description": "Create new change-management resource"
      },
      {
        "name": "change-management_update",
        "description": "Update change-management resource"
      },
      {
        "name": "change-management_delete",
        "description": "Delete change-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-knowledge-base",
    "port": 9234,
    "category": "knowledge-management",
    "repo": "punkpeye/mcp-server-knowledge-base",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-knowledge-base/index.js"
      ],
      "env": {
        "PORT": "9234",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-knowledge-base",
        "MCP_SERVER_CATEGORY": "knowledge-management"
      }
    },
    "tools": [
      {
        "name": "knowledge-management_list",
        "description": "List knowledge-management resources"
      },
      {
        "name": "knowledge-management_get",
        "description": "Get specific knowledge-management resource"
      },
      {
        "name": "knowledge-management_create",
        "description": "Create new knowledge-management resource"
      },
      {
        "name": "knowledge-management_update",
        "description": "Update knowledge-management resource"
      },
      {
        "name": "knowledge-management_delete",
        "description": "Delete knowledge-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-workflow-engine",
    "port": 9235,
    "category": "workflow",
    "repo": "punkpeye/mcp-server-workflow-engine",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-workflow-engine/index.js"
      ],
      "env": {
        "PORT": "9235",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-workflow-engine",
        "MCP_SERVER_CATEGORY": "workflow"
      }
    },
    "tools": [
      {
        "name": "workflow_list",
        "description": "List workflow resources"
      },
      {
        "name": "workflow_get",
        "description": "Get specific workflow resource"
      },
      {
        "name": "workflow_create",
        "description": "Create new workflow resource"
      },
      {
        "name": "workflow_update",
        "description": "Update workflow resource"
      },
      {
        "name": "workflow_delete",
        "description": "Delete workflow resource"
      }
    ]
  },
  {
    "name": "mcp-server-tableau",
    "port": 9236,
    "category": "business-intelligence",
    "repo": "punkpeye/mcp-server-tableau",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-tableau/index.js"
      ],
      "env": {
        "PORT": "9236",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-tableau",
        "MCP_SERVER_CATEGORY": "business-intelligence"
      }
    },
    "tools": [
      {
        "name": "business-intelligence_list",
        "description": "List business-intelligence resources"
      },
      {
        "name": "business-intelligence_get",
        "description": "Get specific business-intelligence resource"
      },
      {
        "name": "business-intelligence_create",
        "description": "Create new business-intelligence resource"
      },
      {
        "name": "business-intelligence_update",
        "description": "Update business-intelligence resource"
      },
      {
        "name": "business-intelligence_delete",
        "description": "Delete business-intelligence resource"
      }
    ]
  },
  {
    "name": "mcp-server-power-bi",
    "port": 9237,
    "category": "business-intelligence",
    "repo": "punkpeye/mcp-server-power-bi",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-power-bi/index.js"
      ],
      "env": {
        "PORT": "9237",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-power-bi",
        "MCP_SERVER_CATEGORY": "business-intelligence"
      }
    },
    "tools": [
      {
        "name": "business-intelligence_list",
        "description": "List business-intelligence resources"
      },
      {
        "name": "business-intelligence_get",
        "description": "Get specific business-intelligence resource"
      },
      {
        "name": "business-intelligence_create",
        "description": "Create new business-intelligence resource"
      },
      {
        "name": "business-intelligence_update",
        "description": "Update business-intelligence resource"
      },
      {
        "name": "business-intelligence_delete",
        "description": "Delete business-intelligence resource"
      }
    ]
  },
  {
    "name": "mcp-server-snowflake",
    "port": 9238,
    "category": "data-warehouse",
    "repo": "punkpeye/mcp-server-snowflake",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-snowflake/index.js"
      ],
      "env": {
        "PORT": "9238",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-snowflake",
        "MCP_SERVER_CATEGORY": "data-warehouse"
      }
    },
    "tools": [
      {
        "name": "data-warehouse_list",
        "description": "List data-warehouse resources"
      },
      {
        "name": "data-warehouse_get",
        "description": "Get specific data-warehouse resource"
      },
      {
        "name": "data-warehouse_create",
        "description": "Create new data-warehouse resource"
      },
      {
        "name": "data-warehouse_update",
        "description": "Update data-warehouse resource"
      },
      {
        "name": "data-warehouse_delete",
        "description": "Delete data-warehouse resource"
      }
    ]
  },
  {
    "name": "mcp-server-redshift",
    "port": 9239,
    "category": "data-warehouse",
    "repo": "punkpeye/mcp-server-redshift",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-redshift/index.js"
      ],
      "env": {
        "PORT": "9239",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-redshift",
        "MCP_SERVER_CATEGORY": "data-warehouse"
      }
    },
    "tools": [
      {
        "name": "data-warehouse_list",
        "description": "List data-warehouse resources"
      },
      {
        "name": "data-warehouse_get",
        "description": "Get specific data-warehouse resource"
      },
      {
        "name": "data-warehouse_create",
        "description": "Create new data-warehouse resource"
      },
      {
        "name": "data-warehouse_update",
        "description": "Update data-warehouse resource"
      },
      {
        "name": "data-warehouse_delete",
        "description": "Delete data-warehouse resource"
      }
    ]
  },
  {
    "name": "mcp-server-airflow",
    "port": 9240,
    "category": "etl",
    "repo": "punkpeye/mcp-server-airflow",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-airflow/index.js"
      ],
      "env": {
        "PORT": "9240",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-airflow",
        "MCP_SERVER_CATEGORY": "etl"
      }
    },
    "tools": [
      {
        "name": "etl_list",
        "description": "List etl resources"
      },
      {
        "name": "etl_get",
        "description": "Get specific etl resource"
      },
      {
        "name": "etl_create",
        "description": "Create new etl resource"
      },
      {
        "name": "etl_update",
        "description": "Update etl resource"
      },
      {
        "name": "etl_delete",
        "description": "Delete etl resource"
      }
    ]
  },
  {
    "name": "mcp-server-luigi",
    "port": 9241,
    "category": "etl",
    "repo": "punkpeye/mcp-server-luigi",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-luigi/index.js"
      ],
      "env": {
        "PORT": "9241",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-luigi",
        "MCP_SERVER_CATEGORY": "etl"
      }
    },
    "tools": [
      {
        "name": "etl_list",
        "description": "List etl resources"
      },
      {
        "name": "etl_get",
        "description": "Get specific etl resource"
      },
      {
        "name": "etl_create",
        "description": "Create new etl resource"
      },
      {
        "name": "etl_update",
        "description": "Update etl resource"
      },
      {
        "name": "etl_delete",
        "description": "Delete etl resource"
      }
    ]
  },
  {
    "name": "mcp-server-delta-lake",
    "port": 9242,
    "category": "data-lake",
    "repo": "punkpeye/mcp-server-delta-lake",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-delta-lake/index.js"
      ],
      "env": {
        "PORT": "9242",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-delta-lake",
        "MCP_SERVER_CATEGORY": "data-lake"
      }
    },
    "tools": [
      {
        "name": "data-lake_list",
        "description": "List data-lake resources"
      },
      {
        "name": "data-lake_get",
        "description": "Get specific data-lake resource"
      },
      {
        "name": "data-lake_create",
        "description": "Create new data-lake resource"
      },
      {
        "name": "data-lake_update",
        "description": "Update data-lake resource"
      },
      {
        "name": "data-lake_delete",
        "description": "Delete data-lake resource"
      }
    ]
  },
  {
    "name": "mcp-server-iceberg",
    "port": 9243,
    "category": "data-lake",
    "repo": "punkpeye/mcp-server-iceberg",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-iceberg/index.js"
      ],
      "env": {
        "PORT": "9243",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-iceberg",
        "MCP_SERVER_CATEGORY": "data-lake"
      }
    },
    "tools": [
      {
        "name": "data-lake_list",
        "description": "List data-lake resources"
      },
      {
        "name": "data-lake_get",
        "description": "Get specific data-lake resource"
      },
      {
        "name": "data-lake_create",
        "description": "Create new data-lake resource"
      },
      {
        "name": "data-lake_update",
        "description": "Update data-lake resource"
      },
      {
        "name": "data-lake_delete",
        "description": "Delete data-lake resource"
      }
    ]
  },
  {
    "name": "mcp-server-spark-streaming",
    "port": 9244,
    "category": "stream-processing",
    "repo": "punkpeye/mcp-server-spark-streaming",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-spark-streaming/index.js"
      ],
      "env": {
        "PORT": "9244",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-spark-streaming",
        "MCP_SERVER_CATEGORY": "stream-processing"
      }
    },
    "tools": [
      {
        "name": "stream-processing_list",
        "description": "List stream-processing resources"
      },
      {
        "name": "stream-processing_get",
        "description": "Get specific stream-processing resource"
      },
      {
        "name": "stream-processing_create",
        "description": "Create new stream-processing resource"
      },
      {
        "name": "stream-processing_update",
        "description": "Update stream-processing resource"
      },
      {
        "name": "stream-processing_delete",
        "description": "Delete stream-processing resource"
      }
    ]
  },
  {
    "name": "mcp-server-flink",
    "port": 9245,
    "category": "stream-processing",
    "repo": "punkpeye/mcp-server-flink",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-flink/index.js"
      ],
      "env": {
        "PORT": "9245",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-flink",
        "MCP_SERVER_CATEGORY": "stream-processing"
      }
    },
    "tools": [
      {
        "name": "stream-processing_list",
        "description": "List stream-processing resources"
      },
      {
        "name": "stream-processing_get",
        "description": "Get specific stream-processing resource"
      },
      {
        "name": "stream-processing_create",
        "description": "Create new stream-processing resource"
      },
      {
        "name": "stream-processing_update",
        "description": "Update stream-processing resource"
      },
      {
        "name": "stream-processing_delete",
        "description": "Delete stream-processing resource"
      }
    ]
  },
  {
    "name": "mcp-server-mlflow",
    "port": 9246,
    "category": "ml-platform",
    "repo": "punkpeye/mcp-server-mlflow",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-mlflow/index.js"
      ],
      "env": {
        "PORT": "9246",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-mlflow",
        "MCP_SERVER_CATEGORY": "ml-platform"
      }
    },
    "tools": [
      {
        "name": "ml-platform_list",
        "description": "List ml-platform resources"
      },
      {
        "name": "ml-platform_get",
        "description": "Get specific ml-platform resource"
      },
      {
        "name": "ml-platform_create",
        "description": "Create new ml-platform resource"
      },
      {
        "name": "ml-platform_update",
        "description": "Update ml-platform resource"
      },
      {
        "name": "ml-platform_delete",
        "description": "Delete ml-platform resource"
      }
    ]
  },
  {
    "name": "mcp-server-kubeflow",
    "port": 9247,
    "category": "ml-platform",
    "repo": "punkpeye/mcp-server-kubeflow",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-kubeflow/index.js"
      ],
      "env": {
        "PORT": "9247",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-kubeflow",
        "MCP_SERVER_CATEGORY": "ml-platform"
      }
    },
    "tools": [
      {
        "name": "ml-platform_list",
        "description": "List ml-platform resources"
      },
      {
        "name": "ml-platform_get",
        "description": "Get specific ml-platform resource"
      },
      {
        "name": "ml-platform_create",
        "description": "Create new ml-platform resource"
      },
      {
        "name": "ml-platform_update",
        "description": "Update ml-platform resource"
      },
      {
        "name": "ml-platform_delete",
        "description": "Delete ml-platform resource"
      }
    ]
  },
  {
    "name": "mcp-server-feast",
    "port": 9248,
    "category": "feature-store",
    "repo": "punkpeye/mcp-server-feast",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-feast/index.js"
      ],
      "env": {
        "PORT": "9248",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-feast",
        "MCP_SERVER_CATEGORY": "feature-store"
      }
    },
    "tools": [
      {
        "name": "feature-store_list",
        "description": "List feature-store resources"
      },
      {
        "name": "feature-store_get",
        "description": "Get specific feature-store resource"
      },
      {
        "name": "feature-store_create",
        "description": "Create new feature-store resource"
      },
      {
        "name": "feature-store_update",
        "description": "Update feature-store resource"
      },
      {
        "name": "feature-store_delete",
        "description": "Delete feature-store resource"
      }
    ]
  },
  {
    "name": "mcp-server-seldon",
    "port": 9249,
    "category": "model-serving",
    "repo": "punkpeye/mcp-server-seldon",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-seldon/index.js"
      ],
      "env": {
        "PORT": "9249",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-seldon",
        "MCP_SERVER_CATEGORY": "model-serving"
      }
    },
    "tools": [
      {
        "name": "model-serving_list",
        "description": "List model-serving resources"
      },
      {
        "name": "model-serving_get",
        "description": "Get specific model-serving resource"
      },
      {
        "name": "model-serving_create",
        "description": "Create new model-serving resource"
      },
      {
        "name": "model-serving_update",
        "description": "Update model-serving resource"
      },
      {
        "name": "model-serving_delete",
        "description": "Delete model-serving resource"
      }
    ]
  },
  {
    "name": "mcp-server-kserve",
    "port": 9250,
    "category": "model-serving",
    "repo": "punkpeye/mcp-server-kserve",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-kserve/index.js"
      ],
      "env": {
        "PORT": "9250",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-kserve",
        "MCP_SERVER_CATEGORY": "model-serving"
      }
    },
    "tools": [
      {
        "name": "model-serving_list",
        "description": "List model-serving resources"
      },
      {
        "name": "model-serving_get",
        "description": "Get specific model-serving resource"
      },
      {
        "name": "model-serving_create",
        "description": "Create new model-serving resource"
      },
      {
        "name": "model-serving_update",
        "description": "Update model-serving resource"
      },
      {
        "name": "model-serving_delete",
        "description": "Delete model-serving resource"
      }
    ]
  },
  {
    "name": "mcp-server-d3js",
    "port": 9251,
    "category": "data-visualization",
    "repo": "punkpeye/mcp-server-d3js",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-d3js/index.js"
      ],
      "env": {
        "PORT": "9251",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-d3js",
        "MCP_SERVER_CATEGORY": "data-visualization"
      }
    },
    "tools": [
      {
        "name": "data-visualization_list",
        "description": "List data-visualization resources"
      },
      {
        "name": "data-visualization_get",
        "description": "Get specific data-visualization resource"
      },
      {
        "name": "data-visualization_create",
        "description": "Create new data-visualization resource"
      },
      {
        "name": "data-visualization_update",
        "description": "Update data-visualization resource"
      },
      {
        "name": "data-visualization_delete",
        "description": "Delete data-visualization resource"
      }
    ]
  },
  {
    "name": "mcp-server-plotly",
    "port": 9252,
    "category": "data-visualization",
    "repo": "punkpeye/mcp-server-plotly",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-plotly/index.js"
      ],
      "env": {
        "PORT": "9252",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-plotly",
        "MCP_SERVER_CATEGORY": "data-visualization"
      }
    },
    "tools": [
      {
        "name": "data-visualization_list",
        "description": "List data-visualization resources"
      },
      {
        "name": "data-visualization_get",
        "description": "Get specific data-visualization resource"
      },
      {
        "name": "data-visualization_create",
        "description": "Create new data-visualization resource"
      },
      {
        "name": "data-visualization_update",
        "description": "Update data-visualization resource"
      },
      {
        "name": "data-visualization_delete",
        "description": "Delete data-visualization resource"
      }
    ]
  },
  {
    "name": "mcp-server-qgis",
    "port": 9253,
    "category": "gis",
    "repo": "punkpeye/mcp-server-qgis",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-qgis/index.js"
      ],
      "env": {
        "PORT": "9253",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-qgis",
        "MCP_SERVER_CATEGORY": "gis"
      }
    },
    "tools": [
      {
        "name": "gis_list",
        "description": "List gis resources"
      },
      {
        "name": "gis_get",
        "description": "Get specific gis resource"
      },
      {
        "name": "gis_create",
        "description": "Create new gis resource"
      },
      {
        "name": "gis_update",
        "description": "Update gis resource"
      },
      {
        "name": "gis_delete",
        "description": "Delete gis resource"
      }
    ]
  },
  {
    "name": "mcp-server-arcgis",
    "port": 9254,
    "category": "gis",
    "repo": "punkpeye/mcp-server-arcgis",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-arcgis/index.js"
      ],
      "env": {
        "PORT": "9254",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-arcgis",
        "MCP_SERVER_CATEGORY": "gis"
      }
    },
    "tools": [
      {
        "name": "gis_list",
        "description": "List gis resources"
      },
      {
        "name": "gis_get",
        "description": "Get specific gis resource"
      },
      {
        "name": "gis_create",
        "description": "Create new gis resource"
      },
      {
        "name": "gis_update",
        "description": "Update gis resource"
      },
      {
        "name": "gis_delete",
        "description": "Delete gis resource"
      }
    ]
  },
  {
    "name": "mcp-server-satellite-imagery",
    "port": 9255,
    "category": "remote-sensing",
    "repo": "punkpeye/mcp-server-satellite-imagery",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-satellite-imagery/index.js"
      ],
      "env": {
        "PORT": "9255",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-satellite-imagery",
        "MCP_SERVER_CATEGORY": "remote-sensing"
      }
    },
    "tools": [
      {
        "name": "remote-sensing_list",
        "description": "List remote-sensing resources"
      },
      {
        "name": "remote-sensing_get",
        "description": "Get specific remote-sensing resource"
      },
      {
        "name": "remote-sensing_create",
        "description": "Create new remote-sensing resource"
      },
      {
        "name": "remote-sensing_update",
        "description": "Update remote-sensing resource"
      },
      {
        "name": "remote-sensing_delete",
        "description": "Delete remote-sensing resource"
      }
    ]
  },
  {
    "name": "mcp-server-air-quality",
    "port": 9256,
    "category": "environmental",
    "repo": "punkpeye/mcp-server-air-quality",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-air-quality/index.js"
      ],
      "env": {
        "PORT": "9256",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-air-quality",
        "MCP_SERVER_CATEGORY": "environmental"
      }
    },
    "tools": [
      {
        "name": "environmental_list",
        "description": "List environmental resources"
      },
      {
        "name": "environmental_get",
        "description": "Get specific environmental resource"
      },
      {
        "name": "environmental_create",
        "description": "Create new environmental resource"
      },
      {
        "name": "environmental_update",
        "description": "Update environmental resource"
      },
      {
        "name": "environmental_delete",
        "description": "Delete environmental resource"
      }
    ]
  },
  {
    "name": "mcp-server-water-quality",
    "port": 9257,
    "category": "environmental",
    "repo": "punkpeye/mcp-server-water-quality",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-water-quality/index.js"
      ],
      "env": {
        "PORT": "9257",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-water-quality",
        "MCP_SERVER_CATEGORY": "environmental"
      }
    },
    "tools": [
      {
        "name": "environmental_list",
        "description": "List environmental resources"
      },
      {
        "name": "environmental_get",
        "description": "Get specific environmental resource"
      },
      {
        "name": "environmental_create",
        "description": "Create new environmental resource"
      },
      {
        "name": "environmental_update",
        "description": "Update environmental resource"
      },
      {
        "name": "environmental_delete",
        "description": "Delete environmental resource"
      }
    ]
  },
  {
    "name": "mcp-server-traffic-management",
    "port": 9258,
    "category": "smart-city",
    "repo": "punkpeye/mcp-server-traffic-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-traffic-management/index.js"
      ],
      "env": {
        "PORT": "9258",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-traffic-management",
        "MCP_SERVER_CATEGORY": "smart-city"
      }
    },
    "tools": [
      {
        "name": "smart-city_list",
        "description": "List smart-city resources"
      },
      {
        "name": "smart-city_get",
        "description": "Get specific smart-city resource"
      },
      {
        "name": "smart-city_create",
        "description": "Create new smart-city resource"
      },
      {
        "name": "smart-city_update",
        "description": "Update smart-city resource"
      },
      {
        "name": "smart-city_delete",
        "description": "Delete smart-city resource"
      }
    ]
  },
  {
    "name": "mcp-server-waste-management",
    "port": 9259,
    "category": "smart-city",
    "repo": "punkpeye/mcp-server-waste-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-waste-management/index.js"
      ],
      "env": {
        "PORT": "9259",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-waste-management",
        "MCP_SERVER_CATEGORY": "smart-city"
      }
    },
    "tools": [
      {
        "name": "smart-city_list",
        "description": "List smart-city resources"
      },
      {
        "name": "smart-city_get",
        "description": "Get specific smart-city resource"
      },
      {
        "name": "smart-city_create",
        "description": "Create new smart-city resource"
      },
      {
        "name": "smart-city_update",
        "description": "Update smart-city resource"
      },
      {
        "name": "smart-city_delete",
        "description": "Delete smart-city resource"
      }
    ]
  },
  {
    "name": "mcp-server-5g-network",
    "port": 9260,
    "category": "telecom",
    "repo": "punkpeye/mcp-server-5g-network",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-5g-network/index.js"
      ],
      "env": {
        "PORT": "9260",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-5g-network",
        "MCP_SERVER_CATEGORY": "telecom"
      }
    },
    "tools": [
      {
        "name": "telecom_list",
        "description": "List telecom resources"
      },
      {
        "name": "telecom_get",
        "description": "Get specific telecom resource"
      },
      {
        "name": "telecom_create",
        "description": "Create new telecom resource"
      },
      {
        "name": "telecom_update",
        "description": "Update telecom resource"
      },
      {
        "name": "telecom_delete",
        "description": "Delete telecom resource"
      }
    ]
  },
  {
    "name": "mcp-server-network-monitoring",
    "port": 9261,
    "category": "telecom",
    "repo": "punkpeye/mcp-server-network-monitoring",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-network-monitoring/index.js"
      ],
      "env": {
        "PORT": "9261",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-network-monitoring",
        "MCP_SERVER_CATEGORY": "telecom"
      }
    },
    "tools": [
      {
        "name": "telecom_list",
        "description": "List telecom resources"
      },
      {
        "name": "telecom_get",
        "description": "Get specific telecom resource"
      },
      {
        "name": "telecom_create",
        "description": "Create new telecom resource"
      },
      {
        "name": "telecom_update",
        "description": "Update telecom resource"
      },
      {
        "name": "telecom_delete",
        "description": "Delete telecom resource"
      }
    ]
  },
  {
    "name": "mcp-server-ros",
    "port": 9262,
    "category": "robotics",
    "repo": "punkpeye/mcp-server-ros",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-ros/index.js"
      ],
      "env": {
        "PORT": "9262",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-ros",
        "MCP_SERVER_CATEGORY": "robotics"
      }
    },
    "tools": [
      {
        "name": "robotics_list",
        "description": "List robotics resources"
      },
      {
        "name": "robotics_get",
        "description": "Get specific robotics resource"
      },
      {
        "name": "robotics_create",
        "description": "Create new robotics resource"
      },
      {
        "name": "robotics_update",
        "description": "Update robotics resource"
      },
      {
        "name": "robotics_delete",
        "description": "Delete robotics resource"
      }
    ]
  },
  {
    "name": "mcp-server-robot-control",
    "port": 9263,
    "category": "robotics",
    "repo": "punkpeye/mcp-server-robot-control",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-robot-control/index.js"
      ],
      "env": {
        "PORT": "9263",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-robot-control",
        "MCP_SERVER_CATEGORY": "robotics"
      }
    },
    "tools": [
      {
        "name": "robotics_list",
        "description": "List robotics resources"
      },
      {
        "name": "robotics_get",
        "description": "Get specific robotics resource"
      },
      {
        "name": "robotics_create",
        "description": "Create new robotics resource"
      },
      {
        "name": "robotics_update",
        "description": "Update robotics resource"
      },
      {
        "name": "robotics_delete",
        "description": "Delete robotics resource"
      }
    ]
  },
  {
    "name": "mcp-server-ar-toolkit",
    "port": 9264,
    "category": "ar",
    "repo": "punkpeye/mcp-server-ar-toolkit",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-ar-toolkit/index.js"
      ],
      "env": {
        "PORT": "9264",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-ar-toolkit",
        "MCP_SERVER_CATEGORY": "ar"
      }
    },
    "tools": [
      {
        "name": "ar_list",
        "description": "List ar resources"
      },
      {
        "name": "ar_get",
        "description": "Get specific ar resource"
      },
      {
        "name": "ar_create",
        "description": "Create new ar resource"
      },
      {
        "name": "ar_update",
        "description": "Update ar resource"
      },
      {
        "name": "ar_delete",
        "description": "Delete ar resource"
      }
    ]
  },
  {
    "name": "mcp-server-vr-engine",
    "port": 9265,
    "category": "vr",
    "repo": "punkpeye/mcp-server-vr-engine",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-vr-engine/index.js"
      ],
      "env": {
        "PORT": "9265",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-vr-engine",
        "MCP_SERVER_CATEGORY": "vr"
      }
    },
    "tools": [
      {
        "name": "vr_list",
        "description": "List vr resources"
      },
      {
        "name": "vr_get",
        "description": "Get specific vr resource"
      },
      {
        "name": "vr_create",
        "description": "Create new vr resource"
      },
      {
        "name": "vr_update",
        "description": "Update vr resource"
      },
      {
        "name": "vr_delete",
        "description": "Delete vr resource"
      }
    ]
  },
  {
    "name": "mcp-server-blender",
    "port": 9266,
    "category": "3d-modeling",
    "repo": "punkpeye/mcp-server-blender",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-blender/index.js"
      ],
      "env": {
        "PORT": "9266",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-blender",
        "MCP_SERVER_CATEGORY": "3d-modeling"
      }
    },
    "tools": [
      {
        "name": "3d-modeling_list",
        "description": "List 3d-modeling resources"
      },
      {
        "name": "3d-modeling_get",
        "description": "Get specific 3d-modeling resource"
      },
      {
        "name": "3d-modeling_create",
        "description": "Create new 3d-modeling resource"
      },
      {
        "name": "3d-modeling_update",
        "description": "Update 3d-modeling resource"
      },
      {
        "name": "3d-modeling_delete",
        "description": "Delete 3d-modeling resource"
      }
    ]
  },
  {
    "name": "mcp-server-maya",
    "port": 9267,
    "category": "3d-modeling",
    "repo": "punkpeye/mcp-server-maya",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-maya/index.js"
      ],
      "env": {
        "PORT": "9267",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-maya",
        "MCP_SERVER_CATEGORY": "3d-modeling"
      }
    },
    "tools": [
      {
        "name": "3d-modeling_list",
        "description": "List 3d-modeling resources"
      },
      {
        "name": "3d-modeling_get",
        "description": "Get specific 3d-modeling resource"
      },
      {
        "name": "3d-modeling_create",
        "description": "Create new 3d-modeling resource"
      },
      {
        "name": "3d-modeling_update",
        "description": "Update 3d-modeling resource"
      },
      {
        "name": "3d-modeling_delete",
        "description": "Delete 3d-modeling resource"
      }
    ]
  },
  {
    "name": "mcp-server-autocad",
    "port": 9268,
    "category": "cad",
    "repo": "punkpeye/mcp-server-autocad",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-autocad/index.js"
      ],
      "env": {
        "PORT": "9268",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-autocad",
        "MCP_SERVER_CATEGORY": "cad"
      }
    },
    "tools": [
      {
        "name": "cad_list",
        "description": "List cad resources"
      },
      {
        "name": "cad_get",
        "description": "Get specific cad resource"
      },
      {
        "name": "cad_create",
        "description": "Create new cad resource"
      },
      {
        "name": "cad_update",
        "description": "Update cad resource"
      },
      {
        "name": "cad_delete",
        "description": "Delete cad resource"
      }
    ]
  },
  {
    "name": "mcp-server-solidworks",
    "port": 9269,
    "category": "cad",
    "repo": "punkpeye/mcp-server-solidworks",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-solidworks/index.js"
      ],
      "env": {
        "PORT": "9269",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-solidworks",
        "MCP_SERVER_CATEGORY": "cad"
      }
    },
    "tools": [
      {
        "name": "cad_list",
        "description": "List cad resources"
      },
      {
        "name": "cad_get",
        "description": "Get specific cad resource"
      },
      {
        "name": "cad_create",
        "description": "Create new cad resource"
      },
      {
        "name": "cad_update",
        "description": "Update cad resource"
      },
      {
        "name": "cad_delete",
        "description": "Delete cad resource"
      }
    ]
  },
  {
    "name": "mcp-server-ansys",
    "port": 9270,
    "category": "simulation",
    "repo": "punkpeye/mcp-server-ansys",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-ansys/index.js"
      ],
      "env": {
        "PORT": "9270",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-ansys",
        "MCP_SERVER_CATEGORY": "simulation"
      }
    },
    "tools": [
      {
        "name": "simulation_list",
        "description": "List simulation resources"
      },
      {
        "name": "simulation_get",
        "description": "Get specific simulation resource"
      },
      {
        "name": "simulation_create",
        "description": "Create new simulation resource"
      },
      {
        "name": "simulation_update",
        "description": "Update simulation resource"
      },
      {
        "name": "simulation_delete",
        "description": "Delete simulation resource"
      }
    ]
  },
  {
    "name": "mcp-server-matlab",
    "port": 9271,
    "category": "simulation",
    "repo": "punkpeye/mcp-server-matlab",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-matlab/index.js"
      ],
      "env": {
        "PORT": "9271",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-matlab",
        "MCP_SERVER_CATEGORY": "simulation"
      }
    },
    "tools": [
      {
        "name": "simulation_list",
        "description": "List simulation resources"
      },
      {
        "name": "simulation_get",
        "description": "Get specific simulation resource"
      },
      {
        "name": "simulation_create",
        "description": "Create new simulation resource"
      },
      {
        "name": "simulation_update",
        "description": "Update simulation resource"
      },
      {
        "name": "simulation_delete",
        "description": "Delete simulation resource"
      }
    ]
  },
  {
    "name": "mcp-server-jupyter",
    "port": 9272,
    "category": "scientific-computing",
    "repo": "punkpeye/mcp-server-jupyter",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-jupyter/index.js"
      ],
      "env": {
        "PORT": "9272",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-jupyter",
        "MCP_SERVER_CATEGORY": "scientific-computing"
      }
    },
    "tools": [
      {
        "name": "scientific-computing_list",
        "description": "List scientific-computing resources"
      },
      {
        "name": "scientific-computing_get",
        "description": "Get specific scientific-computing resource"
      },
      {
        "name": "scientific-computing_create",
        "description": "Create new scientific-computing resource"
      },
      {
        "name": "scientific-computing_update",
        "description": "Update scientific-computing resource"
      },
      {
        "name": "scientific-computing_delete",
        "description": "Delete scientific-computing resource"
      }
    ]
  },
  {
    "name": "mcp-server-r-studio",
    "port": 9273,
    "category": "scientific-computing",
    "repo": "punkpeye/mcp-server-r-studio",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-r-studio/index.js"
      ],
      "env": {
        "PORT": "9273",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-r-studio",
        "MCP_SERVER_CATEGORY": "scientific-computing"
      }
    },
    "tools": [
      {
        "name": "scientific-computing_list",
        "description": "List scientific-computing resources"
      },
      {
        "name": "scientific-computing_get",
        "description": "Get specific scientific-computing resource"
      },
      {
        "name": "scientific-computing_create",
        "description": "Create new scientific-computing resource"
      },
      {
        "name": "scientific-computing_update",
        "description": "Update scientific-computing resource"
      },
      {
        "name": "scientific-computing_delete",
        "description": "Delete scientific-computing resource"
      }
    ]
  },
  {
    "name": "mcp-server-bioconductor",
    "port": 9274,
    "category": "bioinformatics",
    "repo": "punkpeye/mcp-server-bioconductor",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-bioconductor/index.js"
      ],
      "env": {
        "PORT": "9274",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-bioconductor",
        "MCP_SERVER_CATEGORY": "bioinformatics"
      }
    },
    "tools": [
      {
        "name": "bioinformatics_list",
        "description": "List bioinformatics resources"
      },
      {
        "name": "bioinformatics_get",
        "description": "Get specific bioinformatics resource"
      },
      {
        "name": "bioinformatics_create",
        "description": "Create new bioinformatics resource"
      },
      {
        "name": "bioinformatics_update",
        "description": "Update bioinformatics resource"
      },
      {
        "name": "bioinformatics_delete",
        "description": "Delete bioinformatics resource"
      }
    ]
  },
  {
    "name": "mcp-server-galaxy",
    "port": 9275,
    "category": "bioinformatics",
    "repo": "punkpeye/mcp-server-galaxy",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-galaxy/index.js"
      ],
      "env": {
        "PORT": "9275",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-galaxy",
        "MCP_SERVER_CATEGORY": "bioinformatics"
      }
    },
    "tools": [
      {
        "name": "bioinformatics_list",
        "description": "List bioinformatics resources"
      },
      {
        "name": "bioinformatics_get",
        "description": "Get specific bioinformatics resource"
      },
      {
        "name": "bioinformatics_create",
        "description": "Create new bioinformatics resource"
      },
      {
        "name": "bioinformatics_update",
        "description": "Update bioinformatics resource"
      },
      {
        "name": "bioinformatics_delete",
        "description": "Delete bioinformatics resource"
      }
    ]
  },
  {
    "name": "mcp-server-gatk",
    "port": 9276,
    "category": "genomics",
    "repo": "punkpeye/mcp-server-gatk",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-gatk/index.js"
      ],
      "env": {
        "PORT": "9276",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-gatk",
        "MCP_SERVER_CATEGORY": "genomics"
      }
    },
    "tools": [
      {
        "name": "genomics_list",
        "description": "List genomics resources"
      },
      {
        "name": "genomics_get",
        "description": "Get specific genomics resource"
      },
      {
        "name": "genomics_create",
        "description": "Create new genomics resource"
      },
      {
        "name": "genomics_update",
        "description": "Update genomics resource"
      },
      {
        "name": "genomics_delete",
        "description": "Delete genomics resource"
      }
    ]
  },
  {
    "name": "mcp-server-samtools",
    "port": 9277,
    "category": "genomics",
    "repo": "punkpeye/mcp-server-samtools",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-samtools/index.js"
      ],
      "env": {
        "PORT": "9277",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-samtools",
        "MCP_SERVER_CATEGORY": "genomics"
      }
    },
    "tools": [
      {
        "name": "genomics_list",
        "description": "List genomics resources"
      },
      {
        "name": "genomics_get",
        "description": "Get specific genomics resource"
      },
      {
        "name": "genomics_create",
        "description": "Create new genomics resource"
      },
      {
        "name": "genomics_update",
        "description": "Update genomics resource"
      },
      {
        "name": "genomics_delete",
        "description": "Delete genomics resource"
      }
    ]
  },
  {
    "name": "mcp-server-maxquant",
    "port": 9278,
    "category": "proteomics",
    "repo": "punkpeye/mcp-server-maxquant",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-maxquant/index.js"
      ],
      "env": {
        "PORT": "9278",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-maxquant",
        "MCP_SERVER_CATEGORY": "proteomics"
      }
    },
    "tools": [
      {
        "name": "proteomics_list",
        "description": "List proteomics resources"
      },
      {
        "name": "proteomics_get",
        "description": "Get specific proteomics resource"
      },
      {
        "name": "proteomics_create",
        "description": "Create new proteomics resource"
      },
      {
        "name": "proteomics_update",
        "description": "Update proteomics resource"
      },
      {
        "name": "proteomics_delete",
        "description": "Delete proteomics resource"
      }
    ]
  },
  {
    "name": "mcp-server-rdkit",
    "port": 9279,
    "category": "drug-discovery",
    "repo": "punkpeye/mcp-server-rdkit",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-rdkit/index.js"
      ],
      "env": {
        "PORT": "9279",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-rdkit",
        "MCP_SERVER_CATEGORY": "drug-discovery"
      }
    },
    "tools": [
      {
        "name": "drug-discovery_list",
        "description": "List drug-discovery resources"
      },
      {
        "name": "drug-discovery_get",
        "description": "Get specific drug-discovery resource"
      },
      {
        "name": "drug-discovery_create",
        "description": "Create new drug-discovery resource"
      },
      {
        "name": "drug-discovery_update",
        "description": "Update drug-discovery resource"
      },
      {
        "name": "drug-discovery_delete",
        "description": "Delete drug-discovery resource"
      }
    ]
  },
  {
    "name": "mcp-server-openeye",
    "port": 9280,
    "category": "drug-discovery",
    "repo": "punkpeye/mcp-server-openeye",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-openeye/index.js"
      ],
      "env": {
        "PORT": "9280",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-openeye",
        "MCP_SERVER_CATEGORY": "drug-discovery"
      }
    },
    "tools": [
      {
        "name": "drug-discovery_list",
        "description": "List drug-discovery resources"
      },
      {
        "name": "drug-discovery_get",
        "description": "Get specific drug-discovery resource"
      },
      {
        "name": "drug-discovery_create",
        "description": "Create new drug-discovery resource"
      },
      {
        "name": "drug-discovery_update",
        "description": "Update drug-discovery resource"
      },
      {
        "name": "drug-discovery_delete",
        "description": "Delete drug-discovery resource"
      }
    ]
  },
  {
    "name": "mcp-server-dicom",
    "port": 9281,
    "category": "medical-imaging",
    "repo": "punkpeye/mcp-server-dicom",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-dicom/index.js"
      ],
      "env": {
        "PORT": "9281",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-dicom",
        "MCP_SERVER_CATEGORY": "medical-imaging"
      }
    },
    "tools": [
      {
        "name": "medical-imaging_list",
        "description": "List medical-imaging resources"
      },
      {
        "name": "medical-imaging_get",
        "description": "Get specific medical-imaging resource"
      },
      {
        "name": "medical-imaging_create",
        "description": "Create new medical-imaging resource"
      },
      {
        "name": "medical-imaging_update",
        "description": "Update medical-imaging resource"
      },
      {
        "name": "medical-imaging_delete",
        "description": "Delete medical-imaging resource"
      }
    ]
  },
  {
    "name": "mcp-server-itk",
    "port": 9282,
    "category": "medical-imaging",
    "repo": "punkpeye/mcp-server-itk",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-itk/index.js"
      ],
      "env": {
        "PORT": "9282",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-itk",
        "MCP_SERVER_CATEGORY": "medical-imaging"
      }
    },
    "tools": [
      {
        "name": "medical-imaging_list",
        "description": "List medical-imaging resources"
      },
      {
        "name": "medical-imaging_get",
        "description": "Get specific medical-imaging resource"
      },
      {
        "name": "medical-imaging_create",
        "description": "Create new medical-imaging resource"
      },
      {
        "name": "medical-imaging_update",
        "description": "Update medical-imaging resource"
      },
      {
        "name": "medical-imaging_delete",
        "description": "Delete medical-imaging resource"
      }
    ]
  },
  {
    "name": "mcp-server-clinical-data",
    "port": 9283,
    "category": "clinical-trials",
    "repo": "punkpeye/mcp-server-clinical-data",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-clinical-data/index.js"
      ],
      "env": {
        "PORT": "9283",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-clinical-data",
        "MCP_SERVER_CATEGORY": "clinical-trials"
      }
    },
    "tools": [
      {
        "name": "clinical-trials_list",
        "description": "List clinical-trials resources"
      },
      {
        "name": "clinical-trials_get",
        "description": "Get specific clinical-trials resource"
      },
      {
        "name": "clinical-trials_create",
        "description": "Create new clinical-trials resource"
      },
      {
        "name": "clinical-trials_update",
        "description": "Update clinical-trials resource"
      },
      {
        "name": "clinical-trials_delete",
        "description": "Delete clinical-trials resource"
      }
    ]
  },
  {
    "name": "mcp-server-telehealth",
    "port": 9284,
    "category": "telemedicine",
    "repo": "punkpeye/mcp-server-telehealth",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-telehealth/index.js"
      ],
      "env": {
        "PORT": "9284",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-telehealth",
        "MCP_SERVER_CATEGORY": "telemedicine"
      }
    },
    "tools": [
      {
        "name": "telemedicine_list",
        "description": "List telemedicine resources"
      },
      {
        "name": "telemedicine_get",
        "description": "Get specific telemedicine resource"
      },
      {
        "name": "telemedicine_create",
        "description": "Create new telemedicine resource"
      },
      {
        "name": "telemedicine_update",
        "description": "Update telemedicine resource"
      },
      {
        "name": "telemedicine_delete",
        "description": "Delete telemedicine resource"
      }
    ]
  },
  {
    "name": "mcp-server-ehr",
    "port": 9285,
    "category": "ehr",
    "repo": "punkpeye/mcp-server-ehr",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-ehr/index.js"
      ],
      "env": {
        "PORT": "9285",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-ehr",
        "MCP_SERVER_CATEGORY": "ehr"
      }
    },
    "tools": [
      {
        "name": "ehr_list",
        "description": "List ehr resources"
      },
      {
        "name": "ehr_get",
        "description": "Get specific ehr resource"
      },
      {
        "name": "ehr_create",
        "description": "Create new ehr resource"
      },
      {
        "name": "ehr_update",
        "description": "Update ehr resource"
      },
      {
        "name": "ehr_delete",
        "description": "Delete ehr resource"
      }
    ]
  },
  {
    "name": "mcp-server-fhir",
    "port": 9286,
    "category": "ehr",
    "repo": "punkpeye/mcp-server-fhir",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-fhir/index.js"
      ],
      "env": {
        "PORT": "9286",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-fhir",
        "MCP_SERVER_CATEGORY": "ehr"
      }
    },
    "tools": [
      {
        "name": "ehr_list",
        "description": "List ehr resources"
      },
      {
        "name": "ehr_get",
        "description": "Get specific ehr resource"
      },
      {
        "name": "ehr_create",
        "description": "Create new ehr resource"
      },
      {
        "name": "ehr_update",
        "description": "Update ehr resource"
      },
      {
        "name": "ehr_delete",
        "description": "Delete ehr resource"
      }
    ]
  },
  {
    "name": "mcp-server-pharmacy-management",
    "port": 9287,
    "category": "pharmacy",
    "repo": "punkpeye/mcp-server-pharmacy-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-pharmacy-management/index.js"
      ],
      "env": {
        "PORT": "9287",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-pharmacy-management",
        "MCP_SERVER_CATEGORY": "pharmacy"
      }
    },
    "tools": [
      {
        "name": "pharmacy_list",
        "description": "List pharmacy resources"
      },
      {
        "name": "pharmacy_get",
        "description": "Get specific pharmacy resource"
      },
      {
        "name": "pharmacy_create",
        "description": "Create new pharmacy resource"
      },
      {
        "name": "pharmacy_update",
        "description": "Update pharmacy resource"
      },
      {
        "name": "pharmacy_delete",
        "description": "Delete pharmacy resource"
      }
    ]
  },
  {
    "name": "mcp-server-lis",
    "port": 9288,
    "category": "laboratory",
    "repo": "punkpeye/mcp-server-lis",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-lis/index.js"
      ],
      "env": {
        "PORT": "9288",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-lis",
        "MCP_SERVER_CATEGORY": "laboratory"
      }
    },
    "tools": [
      {
        "name": "laboratory_list",
        "description": "List laboratory resources"
      },
      {
        "name": "laboratory_get",
        "description": "Get specific laboratory resource"
      },
      {
        "name": "laboratory_create",
        "description": "Create new laboratory resource"
      },
      {
        "name": "laboratory_update",
        "description": "Update laboratory resource"
      },
      {
        "name": "laboratory_delete",
        "description": "Delete laboratory resource"
      }
    ]
  },
  {
    "name": "mcp-server-ris",
    "port": 9289,
    "category": "radiology",
    "repo": "punkpeye/mcp-server-ris",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-ris/index.js"
      ],
      "env": {
        "PORT": "9289",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-ris",
        "MCP_SERVER_CATEGORY": "radiology"
      }
    },
    "tools": [
      {
        "name": "radiology_list",
        "description": "List radiology resources"
      },
      {
        "name": "radiology_get",
        "description": "Get specific radiology resource"
      },
      {
        "name": "radiology_create",
        "description": "Create new radiology resource"
      },
      {
        "name": "radiology_update",
        "description": "Update radiology resource"
      },
      {
        "name": "radiology_delete",
        "description": "Delete radiology resource"
      }
    ]
  },
  {
    "name": "mcp-server-his",
    "port": 9290,
    "category": "hospital",
    "repo": "punkpeye/mcp-server-his",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-his/index.js"
      ],
      "env": {
        "PORT": "9290",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-his",
        "MCP_SERVER_CATEGORY": "hospital"
      }
    },
    "tools": [
      {
        "name": "hospital_list",
        "description": "List hospital resources"
      },
      {
        "name": "hospital_get",
        "description": "Get specific hospital resource"
      },
      {
        "name": "hospital_create",
        "description": "Create new hospital resource"
      },
      {
        "name": "hospital_update",
        "description": "Update hospital resource"
      },
      {
        "name": "hospital_delete",
        "description": "Delete hospital resource"
      }
    ]
  },
  {
    "name": "mcp-server-patient-monitoring",
    "port": 9291,
    "category": "patient-monitoring",
    "repo": "punkpeye/mcp-server-patient-monitoring",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-patient-monitoring/index.js"
      ],
      "env": {
        "PORT": "9291",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-patient-monitoring",
        "MCP_SERVER_CATEGORY": "patient-monitoring"
      }
    },
    "tools": [
      {
        "name": "patient-monitoring_list",
        "description": "List patient-monitoring resources"
      },
      {
        "name": "patient-monitoring_get",
        "description": "Get specific patient-monitoring resource"
      },
      {
        "name": "patient-monitoring_create",
        "description": "Create new patient-monitoring resource"
      },
      {
        "name": "patient-monitoring_update",
        "description": "Update patient-monitoring resource"
      },
      {
        "name": "patient-monitoring_delete",
        "description": "Delete patient-monitoring resource"
      }
    ]
  },
  {
    "name": "mcp-server-medical-devices",
    "port": 9292,
    "category": "medical-devices",
    "repo": "punkpeye/mcp-server-medical-devices",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-medical-devices/index.js"
      ],
      "env": {
        "PORT": "9292",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-medical-devices",
        "MCP_SERVER_CATEGORY": "medical-devices"
      }
    },
    "tools": [
      {
        "name": "medical-devices_list",
        "description": "List medical-devices resources"
      },
      {
        "name": "medical-devices_get",
        "description": "Get specific medical-devices resource"
      },
      {
        "name": "medical-devices_create",
        "description": "Create new medical-devices resource"
      },
      {
        "name": "medical-devices_update",
        "description": "Update medical-devices resource"
      },
      {
        "name": "medical-devices_delete",
        "description": "Delete medical-devices resource"
      }
    ]
  },
  {
    "name": "mcp-server-fda-compliance",
    "port": 9293,
    "category": "regulatory",
    "repo": "punkpeye/mcp-server-fda-compliance",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-fda-compliance/index.js"
      ],
      "env": {
        "PORT": "9293",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-fda-compliance",
        "MCP_SERVER_CATEGORY": "regulatory"
      }
    },
    "tools": [
      {
        "name": "regulatory_list",
        "description": "List regulatory resources"
      },
      {
        "name": "regulatory_get",
        "description": "Get specific regulatory resource"
      },
      {
        "name": "regulatory_create",
        "description": "Create new regulatory resource"
      },
      {
        "name": "regulatory_update",
        "description": "Update regulatory resource"
      },
      {
        "name": "regulatory_delete",
        "description": "Delete regulatory resource"
      }
    ]
  },
  {
    "name": "mcp-server-hipaa-compliance",
    "port": 9294,
    "category": "regulatory",
    "repo": "punkpeye/mcp-server-hipaa-compliance",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-hipaa-compliance/index.js"
      ],
      "env": {
        "PORT": "9294",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-hipaa-compliance",
        "MCP_SERVER_CATEGORY": "regulatory"
      }
    },
    "tools": [
      {
        "name": "regulatory_list",
        "description": "List regulatory resources"
      },
      {
        "name": "regulatory_get",
        "description": "Get specific regulatory resource"
      },
      {
        "name": "regulatory_create",
        "description": "Create new regulatory resource"
      },
      {
        "name": "regulatory_update",
        "description": "Update regulatory resource"
      },
      {
        "name": "regulatory_delete",
        "description": "Delete regulatory resource"
      }
    ]
  },
  {
    "name": "mcp-server-qa-automation",
    "port": 9295,
    "category": "quality-assurance",
    "repo": "punkpeye/mcp-server-qa-automation",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-qa-automation/index.js"
      ],
      "env": {
        "PORT": "9295",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-qa-automation",
        "MCP_SERVER_CATEGORY": "quality-assurance"
      }
    },
    "tools": [
      {
        "name": "quality-assurance_list",
        "description": "List quality-assurance resources"
      },
      {
        "name": "quality-assurance_get",
        "description": "Get specific quality-assurance resource"
      },
      {
        "name": "quality-assurance_create",
        "description": "Create new quality-assurance resource"
      },
      {
        "name": "quality-assurance_update",
        "description": "Update quality-assurance resource"
      },
      {
        "name": "quality-assurance_delete",
        "description": "Delete quality-assurance resource"
      }
    ]
  },
  {
    "name": "mcp-server-supply-chain",
    "port": 9296,
    "category": "supply-chain",
    "repo": "punkpeye/mcp-server-supply-chain",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-supply-chain/index.js"
      ],
      "env": {
        "PORT": "9296",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-supply-chain",
        "MCP_SERVER_CATEGORY": "supply-chain"
      }
    },
    "tools": [
      {
        "name": "supply-chain_list",
        "description": "List supply-chain resources"
      },
      {
        "name": "supply-chain_get",
        "description": "Get specific supply-chain resource"
      },
      {
        "name": "supply-chain_create",
        "description": "Create new supply-chain resource"
      },
      {
        "name": "supply-chain_update",
        "description": "Update supply-chain resource"
      },
      {
        "name": "supply-chain_delete",
        "description": "Delete supply-chain resource"
      }
    ]
  },
  {
    "name": "mcp-server-procurement",
    "port": 9297,
    "category": "procurement",
    "repo": "punkpeye/mcp-server-procurement",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-procurement/index.js"
      ],
      "env": {
        "PORT": "9297",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-procurement",
        "MCP_SERVER_CATEGORY": "procurement"
      }
    },
    "tools": [
      {
        "name": "procurement_list",
        "description": "List procurement resources"
      },
      {
        "name": "procurement_get",
        "description": "Get specific procurement resource"
      },
      {
        "name": "procurement_create",
        "description": "Create new procurement resource"
      },
      {
        "name": "procurement_update",
        "description": "Update procurement resource"
      },
      {
        "name": "procurement_delete",
        "description": "Delete procurement resource"
      }
    ]
  },
  {
    "name": "mcp-server-vendor-management",
    "port": 9298,
    "category": "vendor-management",
    "repo": "punkpeye/mcp-server-vendor-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-vendor-management/index.js"
      ],
      "env": {
        "PORT": "9298",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-vendor-management",
        "MCP_SERVER_CATEGORY": "vendor-management"
      }
    },
    "tools": [
      {
        "name": "vendor-management_list",
        "description": "List vendor-management resources"
      },
      {
        "name": "vendor-management_get",
        "description": "Get specific vendor-management resource"
      },
      {
        "name": "vendor-management_create",
        "description": "Create new vendor-management resource"
      },
      {
        "name": "vendor-management_update",
        "description": "Update vendor-management resource"
      },
      {
        "name": "vendor-management_delete",
        "description": "Delete vendor-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-contract-management",
    "port": 9299,
    "category": "contract-management",
    "repo": "punkpeye/mcp-server-contract-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-contract-management/index.js"
      ],
      "env": {
        "PORT": "9299",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-contract-management",
        "MCP_SERVER_CATEGORY": "contract-management"
      }
    },
    "tools": [
      {
        "name": "contract-management_list",
        "description": "List contract-management resources"
      },
      {
        "name": "contract-management_get",
        "description": "Get specific contract-management resource"
      },
      {
        "name": "contract-management_create",
        "description": "Create new contract-management resource"
      },
      {
        "name": "contract-management_update",
        "description": "Update contract-management resource"
      },
      {
        "name": "contract-management_delete",
        "description": "Delete contract-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-risk-assessment",
    "port": 9300,
    "category": "risk-management",
    "repo": "punkpeye/mcp-server-risk-assessment",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-risk-assessment/index.js"
      ],
      "env": {
        "PORT": "9300",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-risk-assessment",
        "MCP_SERVER_CATEGORY": "risk-management"
      }
    },
    "tools": [
      {
        "name": "risk-management_list",
        "description": "List risk-management resources"
      },
      {
        "name": "risk-management_get",
        "description": "Get specific risk-management resource"
      },
      {
        "name": "risk-management_create",
        "description": "Create new risk-management resource"
      },
      {
        "name": "risk-management_update",
        "description": "Update risk-management resource"
      },
      {
        "name": "risk-management_delete",
        "description": "Delete risk-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-audit-management",
    "port": 9301,
    "category": "audit",
    "repo": "punkpeye/mcp-server-audit-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-audit-management/index.js"
      ],
      "env": {
        "PORT": "9301",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-audit-management",
        "MCP_SERVER_CATEGORY": "audit"
      }
    },
    "tools": [
      {
        "name": "audit_list",
        "description": "List audit resources"
      },
      {
        "name": "audit_get",
        "description": "Get specific audit resource"
      },
      {
        "name": "audit_create",
        "description": "Create new audit resource"
      },
      {
        "name": "audit_update",
        "description": "Update audit resource"
      },
      {
        "name": "audit_delete",
        "description": "Delete audit resource"
      }
    ]
  },
  {
    "name": "mcp-server-governance",
    "port": 9302,
    "category": "governance",
    "repo": "punkpeye/mcp-server-governance",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-governance/index.js"
      ],
      "env": {
        "PORT": "9302",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-governance",
        "MCP_SERVER_CATEGORY": "governance"
      }
    },
    "tools": [
      {
        "name": "governance_list",
        "description": "List governance resources"
      },
      {
        "name": "governance_get",
        "description": "Get specific governance resource"
      },
      {
        "name": "governance_create",
        "description": "Create new governance resource"
      },
      {
        "name": "governance_update",
        "description": "Update governance resource"
      },
      {
        "name": "governance_delete",
        "description": "Delete governance resource"
      }
    ]
  },
  {
    "name": "mcp-server-data-governance",
    "port": 9303,
    "category": "data-governance",
    "repo": "punkpeye/mcp-server-data-governance",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-data-governance/index.js"
      ],
      "env": {
        "PORT": "9303",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-data-governance",
        "MCP_SERVER_CATEGORY": "data-governance"
      }
    },
    "tools": [
      {
        "name": "data-governance_list",
        "description": "List data-governance resources"
      },
      {
        "name": "data-governance_get",
        "description": "Get specific data-governance resource"
      },
      {
        "name": "data-governance_create",
        "description": "Create new data-governance resource"
      },
      {
        "name": "data-governance_update",
        "description": "Update data-governance resource"
      },
      {
        "name": "data-governance_delete",
        "description": "Delete data-governance resource"
      }
    ]
  },
  {
    "name": "mcp-server-privacy-management",
    "port": 9304,
    "category": "privacy",
    "repo": "punkpeye/mcp-server-privacy-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-privacy-management/index.js"
      ],
      "env": {
        "PORT": "9304",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-privacy-management",
        "MCP_SERVER_CATEGORY": "privacy"
      }
    },
    "tools": [
      {
        "name": "privacy_list",
        "description": "List privacy resources"
      },
      {
        "name": "privacy_get",
        "description": "Get specific privacy resource"
      },
      {
        "name": "privacy_create",
        "description": "Create new privacy resource"
      },
      {
        "name": "privacy_update",
        "description": "Update privacy resource"
      },
      {
        "name": "privacy_delete",
        "description": "Delete privacy resource"
      }
    ]
  },
  {
    "name": "mcp-server-identity-management",
    "port": 9305,
    "category": "identity",
    "repo": "punkpeye/mcp-server-identity-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-identity-management/index.js"
      ],
      "env": {
        "PORT": "9305",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-identity-management",
        "MCP_SERVER_CATEGORY": "identity"
      }
    },
    "tools": [
      {
        "name": "identity_list",
        "description": "List identity resources"
      },
      {
        "name": "identity_get",
        "description": "Get specific identity resource"
      },
      {
        "name": "identity_create",
        "description": "Create new identity resource"
      },
      {
        "name": "identity_update",
        "description": "Update identity resource"
      },
      {
        "name": "identity_delete",
        "description": "Delete identity resource"
      }
    ]
  },
  {
    "name": "mcp-server-access-control",
    "port": 9306,
    "category": "access-control",
    "repo": "punkpeye/mcp-server-access-control",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-access-control/index.js"
      ],
      "env": {
        "PORT": "9306",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-access-control",
        "MCP_SERVER_CATEGORY": "access-control"
      }
    },
    "tools": [
      {
        "name": "access-control_list",
        "description": "List access-control resources"
      },
      {
        "name": "access-control_get",
        "description": "Get specific access-control resource"
      },
      {
        "name": "access-control_create",
        "description": "Create new access-control resource"
      },
      {
        "name": "access-control_update",
        "description": "Update access-control resource"
      },
      {
        "name": "access-control_delete",
        "description": "Delete access-control resource"
      }
    ]
  },
  {
    "name": "mcp-server-sso",
    "port": 9307,
    "category": "sso",
    "repo": "punkpeye/mcp-server-sso",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-sso/index.js"
      ],
      "env": {
        "PORT": "9307",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-sso",
        "MCP_SERVER_CATEGORY": "sso"
      }
    },
    "tools": [
      {
        "name": "sso_list",
        "description": "List sso resources"
      },
      {
        "name": "sso_get",
        "description": "Get specific sso resource"
      },
      {
        "name": "sso_create",
        "description": "Create new sso resource"
      },
      {
        "name": "sso_update",
        "description": "Update sso resource"
      },
      {
        "name": "sso_delete",
        "description": "Delete sso resource"
      }
    ]
  },
  {
    "name": "mcp-server-mfa",
    "port": 9308,
    "category": "mfa",
    "repo": "punkpeye/mcp-server-mfa",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-mfa/index.js"
      ],
      "env": {
        "PORT": "9308",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-mfa",
        "MCP_SERVER_CATEGORY": "mfa"
      }
    },
    "tools": [
      {
        "name": "mfa_list",
        "description": "List mfa resources"
      },
      {
        "name": "mfa_get",
        "description": "Get specific mfa resource"
      },
      {
        "name": "mfa_create",
        "description": "Create new mfa resource"
      },
      {
        "name": "mfa_update",
        "description": "Update mfa resource"
      },
      {
        "name": "mfa_delete",
        "description": "Delete mfa resource"
      }
    ]
  },
  {
    "name": "mcp-server-certificate-management",
    "port": 9309,
    "category": "certificate",
    "repo": "punkpeye/mcp-server-certificate-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-certificate-management/index.js"
      ],
      "env": {
        "PORT": "9309",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-certificate-management",
        "MCP_SERVER_CATEGORY": "certificate"
      }
    },
    "tools": [
      {
        "name": "certificate_list",
        "description": "List certificate resources"
      },
      {
        "name": "certificate_get",
        "description": "Get specific certificate resource"
      },
      {
        "name": "certificate_create",
        "description": "Create new certificate resource"
      },
      {
        "name": "certificate_update",
        "description": "Update certificate resource"
      },
      {
        "name": "certificate_delete",
        "description": "Delete certificate resource"
      }
    ]
  },
  {
    "name": "mcp-server-key-management",
    "port": 9310,
    "category": "key-management",
    "repo": "punkpeye/mcp-server-key-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-key-management/index.js"
      ],
      "env": {
        "PORT": "9310",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-key-management",
        "MCP_SERVER_CATEGORY": "key-management"
      }
    },
    "tools": [
      {
        "name": "key-management_list",
        "description": "List key-management resources"
      },
      {
        "name": "key-management_get",
        "description": "Get specific key-management resource"
      },
      {
        "name": "key-management_create",
        "description": "Create new key-management resource"
      },
      {
        "name": "key-management_update",
        "description": "Update key-management resource"
      },
      {
        "name": "key-management_delete",
        "description": "Delete key-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-encryption",
    "port": 9311,
    "category": "encryption",
    "repo": "punkpeye/mcp-server-encryption",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-encryption/index.js"
      ],
      "env": {
        "PORT": "9311",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-encryption",
        "MCP_SERVER_CATEGORY": "encryption"
      }
    },
    "tools": [
      {
        "name": "encryption_list",
        "description": "List encryption resources"
      },
      {
        "name": "encryption_get",
        "description": "Get specific encryption resource"
      },
      {
        "name": "encryption_create",
        "description": "Create new encryption resource"
      },
      {
        "name": "encryption_update",
        "description": "Update encryption resource"
      },
      {
        "name": "encryption_delete",
        "description": "Delete encryption resource"
      }
    ]
  },
  {
    "name": "mcp-server-digital-signatures",
    "port": 9312,
    "category": "digital-signatures",
    "repo": "punkpeye/mcp-server-digital-signatures",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-digital-signatures/index.js"
      ],
      "env": {
        "PORT": "9312",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-digital-signatures",
        "MCP_SERVER_CATEGORY": "digital-signatures"
      }
    },
    "tools": [
      {
        "name": "digital-signatures_list",
        "description": "List digital-signatures resources"
      },
      {
        "name": "digital-signatures_get",
        "description": "Get specific digital-signatures resource"
      },
      {
        "name": "digital-signatures_create",
        "description": "Create new digital-signatures resource"
      },
      {
        "name": "digital-signatures_update",
        "description": "Update digital-signatures resource"
      },
      {
        "name": "digital-signatures_delete",
        "description": "Delete digital-signatures resource"
      }
    ]
  },
  {
    "name": "mcp-server-blockchain-security",
    "port": 9313,
    "category": "blockchain-security",
    "repo": "punkpeye/mcp-server-blockchain-security",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-blockchain-security/index.js"
      ],
      "env": {
        "PORT": "9313",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-blockchain-security",
        "MCP_SERVER_CATEGORY": "blockchain-security"
      }
    },
    "tools": [
      {
        "name": "blockchain-security_list",
        "description": "List blockchain-security resources"
      },
      {
        "name": "blockchain-security_get",
        "description": "Get specific blockchain-security resource"
      },
      {
        "name": "blockchain-security_create",
        "description": "Create new blockchain-security resource"
      },
      {
        "name": "blockchain-security_update",
        "description": "Update blockchain-security resource"
      },
      {
        "name": "blockchain-security_delete",
        "description": "Delete blockchain-security resource"
      }
    ]
  },
  {
    "name": "mcp-server-threat-intelligence",
    "port": 9314,
    "category": "threat-intelligence",
    "repo": "punkpeye/mcp-server-threat-intelligence",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-threat-intelligence/index.js"
      ],
      "env": {
        "PORT": "9314",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-threat-intelligence",
        "MCP_SERVER_CATEGORY": "threat-intelligence"
      }
    },
    "tools": [
      {
        "name": "threat-intelligence_list",
        "description": "List threat-intelligence resources"
      },
      {
        "name": "threat-intelligence_get",
        "description": "Get specific threat-intelligence resource"
      },
      {
        "name": "threat-intelligence_create",
        "description": "Create new threat-intelligence resource"
      },
      {
        "name": "threat-intelligence_update",
        "description": "Update threat-intelligence resource"
      },
      {
        "name": "threat-intelligence_delete",
        "description": "Delete threat-intelligence resource"
      }
    ]
  },
  {
    "name": "mcp-server-vulnerability-management",
    "port": 9315,
    "category": "vulnerability",
    "repo": "punkpeye/mcp-server-vulnerability-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-vulnerability-management/index.js"
      ],
      "env": {
        "PORT": "9315",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-vulnerability-management",
        "MCP_SERVER_CATEGORY": "vulnerability"
      }
    },
    "tools": [
      {
        "name": "vulnerability_list",
        "description": "List vulnerability resources"
      },
      {
        "name": "vulnerability_get",
        "description": "Get specific vulnerability resource"
      },
      {
        "name": "vulnerability_create",
        "description": "Create new vulnerability resource"
      },
      {
        "name": "vulnerability_update",
        "description": "Update vulnerability resource"
      },
      {
        "name": "vulnerability_delete",
        "description": "Delete vulnerability resource"
      }
    ]
  },
  {
    "name": "mcp-server-penetration-testing",
    "port": 9316,
    "category": "penetration-testing",
    "repo": "punkpeye/mcp-server-penetration-testing",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-penetration-testing/index.js"
      ],
      "env": {
        "PORT": "9316",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-penetration-testing",
        "MCP_SERVER_CATEGORY": "penetration-testing"
      }
    },
    "tools": [
      {
        "name": "penetration-testing_list",
        "description": "List penetration-testing resources"
      },
      {
        "name": "penetration-testing_get",
        "description": "Get specific penetration-testing resource"
      },
      {
        "name": "penetration-testing_create",
        "description": "Create new penetration-testing resource"
      },
      {
        "name": "penetration-testing_update",
        "description": "Update penetration-testing resource"
      },
      {
        "name": "penetration-testing_delete",
        "description": "Delete penetration-testing resource"
      }
    ]
  },
  {
    "name": "mcp-server-siem",
    "port": 9317,
    "category": "siem",
    "repo": "punkpeye/mcp-server-siem",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-siem/index.js"
      ],
      "env": {
        "PORT": "9317",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-siem",
        "MCP_SERVER_CATEGORY": "siem"
      }
    },
    "tools": [
      {
        "name": "siem_list",
        "description": "List siem resources"
      },
      {
        "name": "siem_get",
        "description": "Get specific siem resource"
      },
      {
        "name": "siem_create",
        "description": "Create new siem resource"
      },
      {
        "name": "siem_update",
        "description": "Update siem resource"
      },
      {
        "name": "siem_delete",
        "description": "Delete siem resource"
      }
    ]
  },
  {
    "name": "mcp-server-security-orchestration",
    "port": 9318,
    "category": "security-orchestration",
    "repo": "punkpeye/mcp-server-security-orchestration",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-security-orchestration/index.js"
      ],
      "env": {
        "PORT": "9318",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-security-orchestration",
        "MCP_SERVER_CATEGORY": "security-orchestration"
      }
    },
    "tools": [
      {
        "name": "security-orchestration_list",
        "description": "List security-orchestration resources"
      },
      {
        "name": "security-orchestration_get",
        "description": "Get specific security-orchestration resource"
      },
      {
        "name": "security-orchestration_create",
        "description": "Create new security-orchestration resource"
      },
      {
        "name": "security-orchestration_update",
        "description": "Update security-orchestration resource"
      },
      {
        "name": "security-orchestration_delete",
        "description": "Delete security-orchestration resource"
      }
    ]
  },
  {
    "name": "mcp-server-fraud-detection",
    "port": 9319,
    "category": "fraud-detection",
    "repo": "punkpeye/mcp-server-fraud-detection",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-fraud-detection/index.js"
      ],
      "env": {
        "PORT": "9319",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-fraud-detection",
        "MCP_SERVER_CATEGORY": "fraud-detection"
      }
    },
    "tools": [
      {
        "name": "fraud-detection_list",
        "description": "List fraud-detection resources"
      },
      {
        "name": "fraud-detection_get",
        "description": "Get specific fraud-detection resource"
      },
      {
        "name": "fraud-detection_create",
        "description": "Create new fraud-detection resource"
      },
      {
        "name": "fraud-detection_update",
        "description": "Update fraud-detection resource"
      },
      {
        "name": "fraud-detection_delete",
        "description": "Delete fraud-detection resource"
      }
    ]
  },
  {
    "name": "mcp-server-aml",
    "port": 9320,
    "category": "aml",
    "repo": "punkpeye/mcp-server-aml",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-aml/index.js"
      ],
      "env": {
        "PORT": "9320",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-aml",
        "MCP_SERVER_CATEGORY": "aml"
      }
    },
    "tools": [
      {
        "name": "aml_list",
        "description": "List aml resources"
      },
      {
        "name": "aml_get",
        "description": "Get specific aml resource"
      },
      {
        "name": "aml_create",
        "description": "Create new aml resource"
      },
      {
        "name": "aml_update",
        "description": "Update aml resource"
      },
      {
        "name": "aml_delete",
        "description": "Delete aml resource"
      }
    ]
  },
  {
    "name": "mcp-server-kyc",
    "port": 9321,
    "category": "kyc",
    "repo": "punkpeye/mcp-server-kyc",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-kyc/index.js"
      ],
      "env": {
        "PORT": "9321",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-kyc",
        "MCP_SERVER_CATEGORY": "kyc"
      }
    },
    "tools": [
      {
        "name": "kyc_list",
        "description": "List kyc resources"
      },
      {
        "name": "kyc_get",
        "description": "Get specific kyc resource"
      },
      {
        "name": "kyc_create",
        "description": "Create new kyc resource"
      },
      {
        "name": "kyc_update",
        "description": "Update kyc resource"
      },
      {
        "name": "kyc_delete",
        "description": "Delete kyc resource"
      }
    ]
  },
  {
    "name": "mcp-server-credit-scoring",
    "port": 9322,
    "category": "credit-scoring",
    "repo": "punkpeye/mcp-server-credit-scoring",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-credit-scoring/index.js"
      ],
      "env": {
        "PORT": "9322",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-credit-scoring",
        "MCP_SERVER_CATEGORY": "credit-scoring"
      }
    },
    "tools": [
      {
        "name": "credit-scoring_list",
        "description": "List credit-scoring resources"
      },
      {
        "name": "credit-scoring_get",
        "description": "Get specific credit-scoring resource"
      },
      {
        "name": "credit-scoring_create",
        "description": "Create new credit-scoring resource"
      },
      {
        "name": "credit-scoring_update",
        "description": "Update credit-scoring resource"
      },
      {
        "name": "credit-scoring_delete",
        "description": "Delete credit-scoring resource"
      }
    ]
  },
  {
    "name": "mcp-server-loan-management",
    "port": 9323,
    "category": "loan-management",
    "repo": "punkpeye/mcp-server-loan-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-loan-management/index.js"
      ],
      "env": {
        "PORT": "9323",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-loan-management",
        "MCP_SERVER_CATEGORY": "loan-management"
      }
    },
    "tools": [
      {
        "name": "loan-management_list",
        "description": "List loan-management resources"
      },
      {
        "name": "loan-management_get",
        "description": "Get specific loan-management resource"
      },
      {
        "name": "loan-management_create",
        "description": "Create new loan-management resource"
      },
      {
        "name": "loan-management_update",
        "description": "Update loan-management resource"
      },
      {
        "name": "loan-management_delete",
        "description": "Delete loan-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-investment-management",
    "port": 9324,
    "category": "investment",
    "repo": "punkpeye/mcp-server-investment-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-investment-management/index.js"
      ],
      "env": {
        "PORT": "9324",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-investment-management",
        "MCP_SERVER_CATEGORY": "investment"
      }
    },
    "tools": [
      {
        "name": "investment_list",
        "description": "List investment resources"
      },
      {
        "name": "investment_get",
        "description": "Get specific investment resource"
      },
      {
        "name": "investment_create",
        "description": "Create new investment resource"
      },
      {
        "name": "investment_update",
        "description": "Update investment resource"
      },
      {
        "name": "investment_delete",
        "description": "Delete investment resource"
      }
    ]
  },
  {
    "name": "mcp-server-portfolio-management",
    "port": 9325,
    "category": "portfolio",
    "repo": "punkpeye/mcp-server-portfolio-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-portfolio-management/index.js"
      ],
      "env": {
        "PORT": "9325",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-portfolio-management",
        "MCP_SERVER_CATEGORY": "portfolio"
      }
    },
    "tools": [
      {
        "name": "portfolio_list",
        "description": "List portfolio resources"
      },
      {
        "name": "portfolio_get",
        "description": "Get specific portfolio resource"
      },
      {
        "name": "portfolio_create",
        "description": "Create new portfolio resource"
      },
      {
        "name": "portfolio_update",
        "description": "Update portfolio resource"
      },
      {
        "name": "portfolio_delete",
        "description": "Delete portfolio resource"
      }
    ]
  },
  {
    "name": "mcp-server-trading-systems",
    "port": 9326,
    "category": "trading",
    "repo": "punkpeye/mcp-server-trading-systems",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-trading-systems/index.js"
      ],
      "env": {
        "PORT": "9326",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-trading-systems",
        "MCP_SERVER_CATEGORY": "trading"
      }
    },
    "tools": [
      {
        "name": "trading_list",
        "description": "List trading resources"
      },
      {
        "name": "trading_get",
        "description": "Get specific trading resource"
      },
      {
        "name": "trading_create",
        "description": "Create new trading resource"
      },
      {
        "name": "trading_update",
        "description": "Update trading resource"
      },
      {
        "name": "trading_delete",
        "description": "Delete trading resource"
      }
    ]
  },
  {
    "name": "mcp-server-market-data",
    "port": 9327,
    "category": "market-data",
    "repo": "punkpeye/mcp-server-market-data",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-market-data/index.js"
      ],
      "env": {
        "PORT": "9327",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-market-data",
        "MCP_SERVER_CATEGORY": "market-data"
      }
    },
    "tools": [
      {
        "name": "market-data_list",
        "description": "List market-data resources"
      },
      {
        "name": "market-data_get",
        "description": "Get specific market-data resource"
      },
      {
        "name": "market-data_create",
        "description": "Create new market-data resource"
      },
      {
        "name": "market-data_update",
        "description": "Update market-data resource"
      },
      {
        "name": "market-data_delete",
        "description": "Delete market-data resource"
      }
    ]
  },
  {
    "name": "mcp-server-financial-reporting",
    "port": 9328,
    "category": "financial-reporting",
    "repo": "punkpeye/mcp-server-financial-reporting",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-financial-reporting/index.js"
      ],
      "env": {
        "PORT": "9328",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-financial-reporting",
        "MCP_SERVER_CATEGORY": "financial-reporting"
      }
    },
    "tools": [
      {
        "name": "financial-reporting_list",
        "description": "List financial-reporting resources"
      },
      {
        "name": "financial-reporting_get",
        "description": "Get specific financial-reporting resource"
      },
      {
        "name": "financial-reporting_create",
        "description": "Create new financial-reporting resource"
      },
      {
        "name": "financial-reporting_update",
        "description": "Update financial-reporting resource"
      },
      {
        "name": "financial-reporting_delete",
        "description": "Delete financial-reporting resource"
      }
    ]
  },
  {
    "name": "mcp-server-tax-management",
    "port": 9329,
    "category": "tax",
    "repo": "punkpeye/mcp-server-tax-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-tax-management/index.js"
      ],
      "env": {
        "PORT": "9329",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-tax-management",
        "MCP_SERVER_CATEGORY": "tax"
      }
    },
    "tools": [
      {
        "name": "tax_list",
        "description": "List tax resources"
      },
      {
        "name": "tax_get",
        "description": "Get specific tax resource"
      },
      {
        "name": "tax_create",
        "description": "Create new tax resource"
      },
      {
        "name": "tax_update",
        "description": "Update tax resource"
      },
      {
        "name": "tax_delete",
        "description": "Delete tax resource"
      }
    ]
  },
  {
    "name": "mcp-server-payroll",
    "port": 9330,
    "category": "payroll",
    "repo": "punkpeye/mcp-server-payroll",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-payroll/index.js"
      ],
      "env": {
        "PORT": "9330",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-payroll",
        "MCP_SERVER_CATEGORY": "payroll"
      }
    },
    "tools": [
      {
        "name": "payroll_list",
        "description": "List payroll resources"
      },
      {
        "name": "payroll_get",
        "description": "Get specific payroll resource"
      },
      {
        "name": "payroll_create",
        "description": "Create new payroll resource"
      },
      {
        "name": "payroll_update",
        "description": "Update payroll resource"
      },
      {
        "name": "payroll_delete",
        "description": "Delete payroll resource"
      }
    ]
  },
  {
    "name": "mcp-server-expense-management",
    "port": 9331,
    "category": "expense",
    "repo": "punkpeye/mcp-server-expense-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-expense-management/index.js"
      ],
      "env": {
        "PORT": "9331",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-expense-management",
        "MCP_SERVER_CATEGORY": "expense"
      }
    },
    "tools": [
      {
        "name": "expense_list",
        "description": "List expense resources"
      },
      {
        "name": "expense_get",
        "description": "Get specific expense resource"
      },
      {
        "name": "expense_create",
        "description": "Create new expense resource"
      },
      {
        "name": "expense_update",
        "description": "Update expense resource"
      },
      {
        "name": "expense_delete",
        "description": "Delete expense resource"
      }
    ]
  },
  {
    "name": "mcp-server-budget-planning",
    "port": 9332,
    "category": "budget",
    "repo": "punkpeye/mcp-server-budget-planning",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-budget-planning/index.js"
      ],
      "env": {
        "PORT": "9332",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-budget-planning",
        "MCP_SERVER_CATEGORY": "budget"
      }
    },
    "tools": [
      {
        "name": "budget_list",
        "description": "List budget resources"
      },
      {
        "name": "budget_get",
        "description": "Get specific budget resource"
      },
      {
        "name": "budget_create",
        "description": "Create new budget resource"
      },
      {
        "name": "budget_update",
        "description": "Update budget resource"
      },
      {
        "name": "budget_delete",
        "description": "Delete budget resource"
      }
    ]
  },
  {
    "name": "mcp-server-financial-analytics",
    "port": 9333,
    "category": "financial-analytics",
    "repo": "punkpeye/mcp-server-financial-analytics",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-financial-analytics/index.js"
      ],
      "env": {
        "PORT": "9333",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-financial-analytics",
        "MCP_SERVER_CATEGORY": "financial-analytics"
      }
    },
    "tools": [
      {
        "name": "financial-analytics_list",
        "description": "List financial-analytics resources"
      },
      {
        "name": "financial-analytics_get",
        "description": "Get specific financial-analytics resource"
      },
      {
        "name": "financial-analytics_create",
        "description": "Create new financial-analytics resource"
      },
      {
        "name": "financial-analytics_update",
        "description": "Update financial-analytics resource"
      },
      {
        "name": "financial-analytics_delete",
        "description": "Delete financial-analytics resource"
      }
    ]
  },
  {
    "name": "mcp-server-regulatory-reporting",
    "port": 9334,
    "category": "regulatory-reporting",
    "repo": "punkpeye/mcp-server-regulatory-reporting",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-regulatory-reporting/index.js"
      ],
      "env": {
        "PORT": "9334",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-regulatory-reporting",
        "MCP_SERVER_CATEGORY": "regulatory-reporting"
      }
    },
    "tools": [
      {
        "name": "regulatory-reporting_list",
        "description": "List regulatory-reporting resources"
      },
      {
        "name": "regulatory-reporting_get",
        "description": "Get specific regulatory-reporting resource"
      },
      {
        "name": "regulatory-reporting_create",
        "description": "Create new regulatory-reporting resource"
      },
      {
        "name": "regulatory-reporting_update",
        "description": "Update regulatory-reporting resource"
      },
      {
        "name": "regulatory-reporting_delete",
        "description": "Delete regulatory-reporting resource"
      }
    ]
  },
  {
    "name": "mcp-server-basel-compliance",
    "port": 9335,
    "category": "basel",
    "repo": "punkpeye/mcp-server-basel-compliance",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-basel-compliance/index.js"
      ],
      "env": {
        "PORT": "9335",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-basel-compliance",
        "MCP_SERVER_CATEGORY": "basel"
      }
    },
    "tools": [
      {
        "name": "basel_list",
        "description": "List basel resources"
      },
      {
        "name": "basel_get",
        "description": "Get specific basel resource"
      },
      {
        "name": "basel_create",
        "description": "Create new basel resource"
      },
      {
        "name": "basel_update",
        "description": "Update basel resource"
      },
      {
        "name": "basel_delete",
        "description": "Delete basel resource"
      }
    ]
  },
  {
    "name": "mcp-server-solvency-ii",
    "port": 9336,
    "category": "solvency",
    "repo": "punkpeye/mcp-server-solvency-ii",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-solvency-ii/index.js"
      ],
      "env": {
        "PORT": "9336",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-solvency-ii",
        "MCP_SERVER_CATEGORY": "solvency"
      }
    },
    "tools": [
      {
        "name": "solvency_list",
        "description": "List solvency resources"
      },
      {
        "name": "solvency_get",
        "description": "Get specific solvency resource"
      },
      {
        "name": "solvency_create",
        "description": "Create new solvency resource"
      },
      {
        "name": "solvency_update",
        "description": "Update solvency resource"
      },
      {
        "name": "solvency_delete",
        "description": "Delete solvency resource"
      }
    ]
  },
  {
    "name": "mcp-server-ifrs-reporting",
    "port": 9337,
    "category": "ifrs",
    "repo": "punkpeye/mcp-server-ifrs-reporting",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-ifrs-reporting/index.js"
      ],
      "env": {
        "PORT": "9337",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-ifrs-reporting",
        "MCP_SERVER_CATEGORY": "ifrs"
      }
    },
    "tools": [
      {
        "name": "ifrs_list",
        "description": "List ifrs resources"
      },
      {
        "name": "ifrs_get",
        "description": "Get specific ifrs resource"
      },
      {
        "name": "ifrs_create",
        "description": "Create new ifrs resource"
      },
      {
        "name": "ifrs_update",
        "description": "Update ifrs resource"
      },
      {
        "name": "ifrs_delete",
        "description": "Delete ifrs resource"
      }
    ]
  },
  {
    "name": "mcp-server-gaap-reporting",
    "port": 9338,
    "category": "gaap",
    "repo": "punkpeye/mcp-server-gaap-reporting",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-gaap-reporting/index.js"
      ],
      "env": {
        "PORT": "9338",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-gaap-reporting",
        "MCP_SERVER_CATEGORY": "gaap"
      }
    },
    "tools": [
      {
        "name": "gaap_list",
        "description": "List gaap resources"
      },
      {
        "name": "gaap_get",
        "description": "Get specific gaap resource"
      },
      {
        "name": "gaap_create",
        "description": "Create new gaap resource"
      },
      {
        "name": "gaap_update",
        "description": "Update gaap resource"
      },
      {
        "name": "gaap_delete",
        "description": "Delete gaap resource"
      }
    ]
  },
  {
    "name": "mcp-server-esg-reporting",
    "port": 9339,
    "category": "esg",
    "repo": "punkpeye/mcp-server-esg-reporting",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-esg-reporting/index.js"
      ],
      "env": {
        "PORT": "9339",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-esg-reporting",
        "MCP_SERVER_CATEGORY": "esg"
      }
    },
    "tools": [
      {
        "name": "esg_list",
        "description": "List esg resources"
      },
      {
        "name": "esg_get",
        "description": "Get specific esg resource"
      },
      {
        "name": "esg_create",
        "description": "Create new esg resource"
      },
      {
        "name": "esg_update",
        "description": "Update esg resource"
      },
      {
        "name": "esg_delete",
        "description": "Delete esg resource"
      }
    ]
  },
  {
    "name": "mcp-server-sustainability-tracking",
    "port": 9340,
    "category": "sustainability",
    "repo": "punkpeye/mcp-server-sustainability-tracking",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-sustainability-tracking/index.js"
      ],
      "env": {
        "PORT": "9340",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-sustainability-tracking",
        "MCP_SERVER_CATEGORY": "sustainability"
      }
    },
    "tools": [
      {
        "name": "sustainability_list",
        "description": "List sustainability resources"
      },
      {
        "name": "sustainability_get",
        "description": "Get specific sustainability resource"
      },
      {
        "name": "sustainability_create",
        "description": "Create new sustainability resource"
      },
      {
        "name": "sustainability_update",
        "description": "Update sustainability resource"
      },
      {
        "name": "sustainability_delete",
        "description": "Delete sustainability resource"
      }
    ]
  },
  {
    "name": "mcp-server-carbon-footprint",
    "port": 9341,
    "category": "carbon",
    "repo": "punkpeye/mcp-server-carbon-footprint",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-carbon-footprint/index.js"
      ],
      "env": {
        "PORT": "9341",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-carbon-footprint",
        "MCP_SERVER_CATEGORY": "carbon"
      }
    },
    "tools": [
      {
        "name": "carbon_list",
        "description": "List carbon resources"
      },
      {
        "name": "carbon_get",
        "description": "Get specific carbon resource"
      },
      {
        "name": "carbon_create",
        "description": "Create new carbon resource"
      },
      {
        "name": "carbon_update",
        "description": "Update carbon resource"
      },
      {
        "name": "carbon_delete",
        "description": "Delete carbon resource"
      }
    ]
  },
  {
    "name": "mcp-server-renewable-energy",
    "port": 9342,
    "category": "renewable-energy",
    "repo": "punkpeye/mcp-server-renewable-energy",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-renewable-energy/index.js"
      ],
      "env": {
        "PORT": "9342",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-renewable-energy",
        "MCP_SERVER_CATEGORY": "renewable-energy"
      }
    },
    "tools": [
      {
        "name": "renewable-energy_list",
        "description": "List renewable-energy resources"
      },
      {
        "name": "renewable-energy_get",
        "description": "Get specific renewable-energy resource"
      },
      {
        "name": "renewable-energy_create",
        "description": "Create new renewable-energy resource"
      },
      {
        "name": "renewable-energy_update",
        "description": "Update renewable-energy resource"
      },
      {
        "name": "renewable-energy_delete",
        "description": "Delete renewable-energy resource"
      }
    ]
  },
  {
    "name": "mcp-server-waste-tracking",
    "port": 9343,
    "category": "waste-tracking",
    "repo": "punkpeye/mcp-server-waste-tracking",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-waste-tracking/index.js"
      ],
      "env": {
        "PORT": "9343",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-waste-tracking",
        "MCP_SERVER_CATEGORY": "waste-tracking"
      }
    },
    "tools": [
      {
        "name": "waste-tracking_list",
        "description": "List waste-tracking resources"
      },
      {
        "name": "waste-tracking_get",
        "description": "Get specific waste-tracking resource"
      },
      {
        "name": "waste-tracking_create",
        "description": "Create new waste-tracking resource"
      },
      {
        "name": "waste-tracking_update",
        "description": "Update waste-tracking resource"
      },
      {
        "name": "waste-tracking_delete",
        "description": "Delete waste-tracking resource"
      }
    ]
  },
  {
    "name": "mcp-server-water-management",
    "port": 9344,
    "category": "water-management",
    "repo": "punkpeye/mcp-server-water-management",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-water-management/index.js"
      ],
      "env": {
        "PORT": "9344",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-water-management",
        "MCP_SERVER_CATEGORY": "water-management"
      }
    },
    "tools": [
      {
        "name": "water-management_list",
        "description": "List water-management resources"
      },
      {
        "name": "water-management_get",
        "description": "Get specific water-management resource"
      },
      {
        "name": "water-management_create",
        "description": "Create new water-management resource"
      },
      {
        "name": "water-management_update",
        "description": "Update water-management resource"
      },
      {
        "name": "water-management_delete",
        "description": "Delete water-management resource"
      }
    ]
  },
  {
    "name": "mcp-server-circular-economy",
    "port": 9345,
    "category": "circular-economy",
    "repo": "punkpeye/mcp-server-circular-economy",
    "config": {
      "command": "node",
      "args": [
        "./community-servers/mcp-server-circular-economy/index.js"
      ],
      "env": {
        "PORT": "9345",
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "mcp-server-circular-economy",
        "MCP_SERVER_CATEGORY": "circular-economy"
      }
    },
    "tools": [
      {
        "name": "circular-economy_list",
        "description": "List circular-economy resources"
      },
      {
        "name": "circular-economy_get",
        "description": "Get specific circular-economy resource"
      },
      {
        "name": "circular-economy_create",
        "description": "Create new circular-economy resource"
      },
      {
        "name": "circular-economy_update",
        "description": "Update circular-economy resource"
      },
      {
        "name": "circular-economy_delete",
        "description": "Delete circular-economy resource"
      }
    ]
  }
];

class CommunityServerDeployer {
  constructor() {
    this.runningServers = new Map();
    this.deploymentStatus = {
      total: servers.length,
      deployed: 0,
      failed: 0,
      running: 0
    };
  }

  async deployServer(serverConfig) {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Deploying ${serverConfig.name} on port ${serverConfig.port}...`);
      
      const serverProcess = spawn(serverConfig.config.command, serverConfig.config.args, {
        env: { ...process.env, ...serverConfig.config.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverStarted = false;
      const timeout = setTimeout(() => {
        if (!serverStarted) {
          console.error(`❌ ${serverConfig.name} failed to start within timeout`);
          serverProcess.kill();
          this.deploymentStatus.failed++;
          reject(new Error('Server start timeout'));
        }
      }, 10000);

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server running') || output.includes('listening')) {
          if (!serverStarted) {
            serverStarted = true;
            clearTimeout(timeout);
            console.log(`✅ ${serverConfig.name} started successfully`);
            this.runningServers.set(serverConfig.name, serverProcess);
            this.deploymentStatus.deployed++;
            this.deploymentStatus.running++;
            resolve(serverProcess);
          }
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error(`⚠️  ${serverConfig.name} stderr: ${data}`);
      });

      serverProcess.on('close', (code) => {
        if (this.runningServers.has(serverConfig.name)) {
          console.log(`🔴 ${serverConfig.name} stopped with code ${code}`);
          this.runningServers.delete(serverConfig.name);
          this.deploymentStatus.running--;
        }
      });

      serverProcess.on('error', (error) => {
        console.error(`❌ ${serverConfig.name} error: ${error.message}`);
        clearTimeout(timeout);
        this.deploymentStatus.failed++;
        reject(error);
      });
    });
  }

  async deployBatch(batchServers, batchSize = 10) {
    const batches = [];
    for (let i = 0; i < batchServers.length; i += batchSize) {
      batches.push(batchServers.slice(i, i + batchSize));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`
📦 Deploying batch ${i + 1}/${batches.length} (${batch.length} servers)...`);
      
      const deployPromises = batch.map(server => 
        this.deployServer(server).catch(error => {
          console.error(`Failed to deploy ${server.name}: ${error.message}`);
          return null;
        })
      );

      await Promise.allSettled(deployPromises);
      
      // Wait between batches
      if (i < batches.length - 1) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  async deployAll() {
    console.log(`🎯 Starting deployment of ${servers.length} community MCP servers...`);
    console.log(`📊 Port range: ${servers[0].port} - ${servers[servers.length - 1].port}`);
    
    const startTime = Date.now();
    
    try {
      await this.deployBatch(servers, 10);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`
🎉 Deployment completed in ${duration.toFixed(2)} seconds`);
      console.log(`📈 Status: ${this.deploymentStatus.deployed}/${this.deploymentStatus.total} deployed, ${this.deploymentStatus.failed} failed`);
      console.log(`🟢 Running servers: ${this.deploymentStatus.running}`);
      
      // Save deployment status
      const statusPath = path.join(__dirname, 'community-deployment-status.json');
      fs.writeFileSync(statusPath, JSON.stringify({
        ...this.deploymentStatus,
        deploymentTime: new Date().toISOString(),
        duration: duration,
        runningServers: Array.from(this.runningServers.keys())
      }, null, 2));
      
    } catch (error) {
      console.error(`💥 Deployment failed: ${error.message}`);
    }
  }

  stopAll() {
    console.log('🛑 Stopping all community servers...');
    this.runningServers.forEach((process, name) => {
      console.log(`Stopping ${name}...`);
      process.kill();
    });
    this.runningServers.clear();
    this.deploymentStatus.running = 0;
  }

  getStatus() {
    return {
      ...this.deploymentStatus,
      runningServers: Array.from(this.runningServers.keys())
    };
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('
🛑 Received SIGINT, stopping all servers...');
  if (global.deployer) {
    global.deployer.stopAll();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('
🛑 Received SIGTERM, stopping all servers...');
  if (global.deployer) {
    global.deployer.stopAll();
  }
  process.exit(0);
});

// Main execution
if (require.main === module) {
  const deployer = new CommunityServerDeployer();
  global.deployer = deployer;
  deployer.deployAll();
}

module.exports = CommunityServerDeployer;
