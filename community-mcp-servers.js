const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// รายการ MCP servers จาก community และ open source projects
const communityServers = [
  // Aggregators
  { name: 'mcp-server-aggregator', repo: 'punkpeye/mcp-server-aggregator', category: 'aggregator' },
  { name: 'mcp-servers-kagi', repo: 'punkpeye/mcp-servers-kagi', category: 'search' },
  
  // Apps & Tools
  { name: 'mcp-server-raycast', repo: 'punkpeye/mcp-server-raycast', category: 'productivity' },
  { name: 'mcp-server-obsidian', repo: 'punkpeye/mcp-server-obsidian', category: 'notes' },
  { name: 'mcp-server-notion', repo: 'punkpeye/mcp-server-notion', category: 'productivity' },
  { name: 'mcp-server-todoist', repo: 'punkpeye/mcp-server-todoist', category: 'productivity' },
  { name: 'mcp-server-linear', repo: 'punkpeye/mcp-server-linear', category: 'project-management' },
  { name: 'mcp-server-jira', repo: 'punkpeye/mcp-server-jira', category: 'project-management' },
  { name: 'mcp-server-trello', repo: 'punkpeye/mcp-server-trello', category: 'project-management' },
  { name: 'mcp-server-asana', repo: 'punkpeye/mcp-server-asana', category: 'project-management' },
  
  // Communication
  { name: 'mcp-server-slack', repo: 'punkpeye/mcp-server-slack', category: 'communication' },
  { name: 'mcp-server-discord', repo: 'punkpeye/mcp-server-discord', category: 'communication' },
  { name: 'mcp-server-telegram', repo: 'punkpeye/mcp-server-telegram', category: 'communication' },
  { name: 'mcp-server-whatsapp', repo: 'punkpeye/mcp-server-whatsapp', category: 'communication' },
  
  // Databases
  { name: 'mcp-server-sqlite', repo: 'modelcontextprotocol/servers/src/sqlite', category: 'database' },
  { name: 'mcp-server-postgres', repo: 'punkpeye/mcp-server-postgres', category: 'database' },
  { name: 'mcp-server-mysql', repo: 'punkpeye/mcp-server-mysql', category: 'database' },
  { name: 'mcp-server-mongodb', repo: 'punkpeye/mcp-server-mongodb', category: 'database' },
  { name: 'mcp-server-redis', repo: 'punkpeye/mcp-server-redis', category: 'database' },
  { name: 'mcp-server-elasticsearch', repo: 'punkpeye/mcp-server-elasticsearch', category: 'database' },
  
  // Development Tools
  { name: 'mcp-server-github', repo: 'modelcontextprotocol/servers/src/github', category: 'development' },
  { name: 'mcp-server-gitlab', repo: 'punkpeye/mcp-server-gitlab', category: 'development' },
  { name: 'mcp-server-bitbucket', repo: 'punkpeye/mcp-server-bitbucket', category: 'development' },
  { name: 'mcp-server-docker', repo: 'punkpeye/mcp-server-docker', category: 'development' },
  { name: 'mcp-server-kubernetes', repo: 'punkpeye/mcp-server-kubernetes', category: 'development' },
  { name: 'mcp-server-jenkins', repo: 'punkpeye/mcp-server-jenkins', category: 'development' },
  { name: 'mcp-server-circleci', repo: 'punkpeye/mcp-server-circleci', category: 'development' },
  { name: 'mcp-server-travis', repo: 'punkpeye/mcp-server-travis', category: 'development' },
  
  // Cloud Services
  { name: 'mcp-server-aws', repo: 'punkpeye/mcp-server-aws', category: 'cloud' },
  { name: 'mcp-server-gcp', repo: 'punkpeye/mcp-server-gcp', category: 'cloud' },
  { name: 'mcp-server-azure', repo: 'punkpeye/mcp-server-azure', category: 'cloud' },
  { name: 'mcp-server-digitalocean', repo: 'punkpeye/mcp-server-digitalocean', category: 'cloud' },
  { name: 'mcp-server-heroku', repo: 'punkpeye/mcp-server-heroku', category: 'cloud' },
  { name: 'mcp-server-vercel', repo: 'punkpeye/mcp-server-vercel', category: 'cloud' },
  { name: 'mcp-server-netlify', repo: 'punkpeye/mcp-server-netlify', category: 'cloud' },
  
  // File Systems
  { name: 'mcp-server-filesystem', repo: 'modelcontextprotocol/servers/src/filesystem', category: 'filesystem' },
  { name: 'mcp-server-gdrive', repo: 'modelcontextprotocol/servers/src/gdrive', category: 'filesystem' },
  { name: 'mcp-server-dropbox', repo: 'punkpeye/mcp-server-dropbox', category: 'filesystem' },
  { name: 'mcp-server-onedrive', repo: 'punkpeye/mcp-server-onedrive', category: 'filesystem' },
  { name: 'mcp-server-box', repo: 'punkpeye/mcp-server-box', category: 'filesystem' },
  
  // Web & APIs
  { name: 'mcp-server-fetch', repo: 'modelcontextprotocol/servers/src/fetch', category: 'web' },
  { name: 'mcp-server-puppeteer', repo: 'modelcontextprotocol/servers/src/puppeteer', category: 'web' },
  { name: 'mcp-server-playwright', repo: 'punkpeye/mcp-server-playwright', category: 'web' },
  { name: 'mcp-server-selenium', repo: 'punkpeye/mcp-server-selenium', category: 'web' },
  { name: 'mcp-server-curl', repo: 'punkpeye/mcp-server-curl', category: 'web' },
  { name: 'mcp-server-postman', repo: 'punkpeye/mcp-server-postman', category: 'web' },
  
  // Analytics & Monitoring
  { name: 'mcp-server-google-analytics', repo: 'punkpeye/mcp-server-google-analytics', category: 'analytics' },
  { name: 'mcp-server-mixpanel', repo: 'punkpeye/mcp-server-mixpanel', category: 'analytics' },
  { name: 'mcp-server-amplitude', repo: 'punkpeye/mcp-server-amplitude', category: 'analytics' },
  { name: 'mcp-server-datadog', repo: 'punkpeye/mcp-server-datadog', category: 'monitoring' },
  { name: 'mcp-server-newrelic', repo: 'punkpeye/mcp-server-newrelic', category: 'monitoring' },
  { name: 'mcp-server-grafana', repo: 'punkpeye/mcp-server-grafana', category: 'monitoring' },
  
  // E-commerce
  { name: 'mcp-server-shopify', repo: 'punkpeye/mcp-server-shopify', category: 'ecommerce' },
  { name: 'mcp-server-woocommerce', repo: 'punkpeye/mcp-server-woocommerce', category: 'ecommerce' },
  { name: 'mcp-server-magento', repo: 'punkpeye/mcp-server-magento', category: 'ecommerce' },
  { name: 'mcp-server-stripe', repo: 'punkpeye/mcp-server-stripe', category: 'payment' },
  { name: 'mcp-server-paypal', repo: 'punkpeye/mcp-server-paypal', category: 'payment' },
  
  // Social Media
  { name: 'mcp-server-twitter', repo: 'punkpeye/mcp-server-twitter', category: 'social' },
  { name: 'mcp-server-facebook', repo: 'punkpeye/mcp-server-facebook', category: 'social' },
  { name: 'mcp-server-instagram', repo: 'punkpeye/mcp-server-instagram', category: 'social' },
  { name: 'mcp-server-linkedin', repo: 'punkpeye/mcp-server-linkedin', category: 'social' },
  { name: 'mcp-server-youtube', repo: 'punkpeye/mcp-server-youtube', category: 'social' },
  
  // AI & ML
  { name: 'mcp-server-openai', repo: 'punkpeye/mcp-server-openai', category: 'ai' },
  { name: 'mcp-server-anthropic', repo: 'punkpeye/mcp-server-anthropic', category: 'ai' },
  { name: 'mcp-server-huggingface', repo: 'punkpeye/mcp-server-huggingface', category: 'ai' },
  { name: 'mcp-server-tensorflow', repo: 'punkpeye/mcp-server-tensorflow', category: 'ai' },
  { name: 'mcp-server-pytorch', repo: 'punkpeye/mcp-server-pytorch', category: 'ai' },
  
  // Email
  { name: 'mcp-server-gmail', repo: 'punkpeye/mcp-server-gmail', category: 'email' },
  { name: 'mcp-server-outlook', repo: 'punkpeye/mcp-server-outlook', category: 'email' },
  { name: 'mcp-server-sendgrid', repo: 'punkpeye/mcp-server-sendgrid', category: 'email' },
  { name: 'mcp-server-mailchimp', repo: 'punkpeye/mcp-server-mailchimp', category: 'email' },
  
  // CRM
  { name: 'mcp-server-salesforce', repo: 'punkpeye/mcp-server-salesforce', category: 'crm' },
  { name: 'mcp-server-hubspot', repo: 'punkpeye/mcp-server-hubspot', category: 'crm' },
  { name: 'mcp-server-pipedrive', repo: 'punkpeye/mcp-server-pipedrive', category: 'crm' },
  { name: 'mcp-server-zoho', repo: 'punkpeye/mcp-server-zoho', category: 'crm' },
  
  // Content Management
  { name: 'mcp-server-wordpress', repo: 'punkpeye/mcp-server-wordpress', category: 'cms' },
  { name: 'mcp-server-drupal', repo: 'punkpeye/mcp-server-drupal', category: 'cms' },
  { name: 'mcp-server-contentful', repo: 'punkpeye/mcp-server-contentful', category: 'cms' },
  { name: 'mcp-server-strapi', repo: 'punkpeye/mcp-server-strapi', category: 'cms' },
  
  // Security
  { name: 'mcp-server-1password', repo: 'punkpeye/mcp-server-1password', category: 'security' },
  { name: 'mcp-server-bitwarden', repo: 'punkpeye/mcp-server-bitwarden', category: 'security' },
  { name: 'mcp-server-lastpass', repo: 'punkpeye/mcp-server-lastpass', category: 'security' },
  { name: 'mcp-server-vault', repo: 'punkpeye/mcp-server-vault', category: 'security' },
  
  // Finance
  { name: 'mcp-server-quickbooks', repo: 'punkpeye/mcp-server-quickbooks', category: 'finance' },
  { name: 'mcp-server-xero', repo: 'punkpeye/mcp-server-xero', category: 'finance' },
  { name: 'mcp-server-freshbooks', repo: 'punkpeye/mcp-server-freshbooks', category: 'finance' },
  { name: 'mcp-server-wave', repo: 'punkpeye/mcp-server-wave', category: 'finance' },
  
  // Design
  { name: 'mcp-server-figma', repo: 'punkpeye/mcp-server-figma', category: 'design' },
  { name: 'mcp-server-sketch', repo: 'punkpeye/mcp-server-sketch', category: 'design' },
  { name: 'mcp-server-adobe', repo: 'punkpeye/mcp-server-adobe', category: 'design' },
  { name: 'mcp-server-canva', repo: 'punkpeye/mcp-server-canva', category: 'design' },
  
  // Time Tracking
  { name: 'mcp-server-toggl', repo: 'punkpeye/mcp-server-toggl', category: 'time-tracking' },
  { name: 'mcp-server-harvest', repo: 'punkpeye/mcp-server-harvest', category: 'time-tracking' },
  { name: 'mcp-server-clockify', repo: 'punkpeye/mcp-server-clockify', category: 'time-tracking' },
  { name: 'mcp-server-rescuetime', repo: 'punkpeye/mcp-server-rescuetime', category: 'time-tracking' },
  
  // Calendar
  { name: 'mcp-server-google-calendar', repo: 'punkpeye/mcp-server-google-calendar', category: 'calendar' },
  { name: 'mcp-server-outlook-calendar', repo: 'punkpeye/mcp-server-outlook-calendar', category: 'calendar' },
  { name: 'mcp-server-calendly', repo: 'punkpeye/mcp-server-calendly', category: 'calendar' },
  { name: 'mcp-server-acuity', repo: 'punkpeye/mcp-server-acuity', category: 'calendar' },
  
  // Weather & Location
  { name: 'mcp-server-weather', repo: 'modelcontextprotocol/servers/src/weather', category: 'weather' },
  { name: 'mcp-server-maps', repo: 'punkpeye/mcp-server-maps', category: 'location' },
  { name: 'mcp-server-geocoding', repo: 'punkpeye/mcp-server-geocoding', category: 'location' },
  
  // News & Media
  { name: 'mcp-server-news', repo: 'punkpeye/mcp-server-news', category: 'media' },
  { name: 'mcp-server-rss', repo: 'punkpeye/mcp-server-rss', category: 'media' },
  { name: 'mcp-server-podcast', repo: 'punkpeye/mcp-server-podcast', category: 'media' },
  
  // Translation
  { name: 'mcp-server-google-translate', repo: 'punkpeye/mcp-server-google-translate', category: 'translation' },
  { name: 'mcp-server-deepl', repo: 'punkpeye/mcp-server-deepl', category: 'translation' },
  { name: 'mcp-server-azure-translator', repo: 'punkpeye/mcp-server-azure-translator', category: 'translation' },
  
  // Utilities
  { name: 'mcp-server-qr-code', repo: 'punkpeye/mcp-server-qr-code', category: 'utility' },
  { name: 'mcp-server-url-shortener', repo: 'punkpeye/mcp-server-url-shortener', category: 'utility' },
  { name: 'mcp-server-password-generator', repo: 'punkpeye/mcp-server-password-generator', category: 'utility' },
  { name: 'mcp-server-uuid', repo: 'punkpeye/mcp-server-uuid', category: 'utility' },
  
  // Blockchain & Crypto
  { name: 'mcp-server-ethereum', repo: 'punkpeye/mcp-server-ethereum', category: 'blockchain' },
  { name: 'mcp-server-bitcoin', repo: 'punkpeye/mcp-server-bitcoin', category: 'blockchain' },
  { name: 'mcp-server-coinbase', repo: 'punkpeye/mcp-server-coinbase', category: 'blockchain' },
  { name: 'mcp-server-binance', repo: 'punkpeye/mcp-server-binance', category: 'blockchain' },
  
  // IoT & Hardware
  { name: 'mcp-server-arduino', repo: 'punkpeye/mcp-server-arduino', category: 'iot' },
  { name: 'mcp-server-raspberry-pi', repo: 'punkpeye/mcp-server-raspberry-pi', category: 'iot' },
  { name: 'mcp-server-mqtt', repo: 'punkpeye/mcp-server-mqtt', category: 'iot' },
  { name: 'mcp-server-zigbee', repo: 'punkpeye/mcp-server-zigbee', category: 'iot' },
  
  // Gaming
  { name: 'mcp-server-steam', repo: 'punkpeye/mcp-server-steam', category: 'gaming' },
  { name: 'mcp-server-twitch', repo: 'punkpeye/mcp-server-twitch', category: 'gaming' },
  { name: 'mcp-server-discord-bot', repo: 'punkpeye/mcp-server-discord-bot', category: 'gaming' },
  
  // Health & Fitness
  { name: 'mcp-server-fitbit', repo: 'punkpeye/mcp-server-fitbit', category: 'health' },
  { name: 'mcp-server-apple-health', repo: 'punkpeye/mcp-server-apple-health', category: 'health' },
  { name: 'mcp-server-google-fit', repo: 'punkpeye/mcp-server-google-fit', category: 'health' },
  
  // Education
  { name: 'mcp-server-coursera', repo: 'punkpeye/mcp-server-coursera', category: 'education' },
  { name: 'mcp-server-udemy', repo: 'punkpeye/mcp-server-udemy', category: 'education' },
  { name: 'mcp-server-khan-academy', repo: 'punkpeye/mcp-server-khan-academy', category: 'education' },
  
  // Travel
  { name: 'mcp-server-booking', repo: 'punkpeye/mcp-server-booking', category: 'travel' },
  { name: 'mcp-server-airbnb', repo: 'punkpeye/mcp-server-airbnb', category: 'travel' },
  { name: 'mcp-server-expedia', repo: 'punkpeye/mcp-server-expedia', category: 'travel' },
  
  // Food & Delivery
  { name: 'mcp-server-uber-eats', repo: 'punkpeye/mcp-server-uber-eats', category: 'food' },
  { name: 'mcp-server-doordash', repo: 'punkpeye/mcp-server-doordash', category: 'food' },
  { name: 'mcp-server-grubhub', repo: 'punkpeye/mcp-server-grubhub', category: 'food' },
  
  // Music & Entertainment
  { name: 'mcp-server-spotify', repo: 'punkpeye/mcp-server-spotify', category: 'music' },
  { name: 'mcp-server-apple-music', repo: 'punkpeye/mcp-server-apple-music', category: 'music' },
  { name: 'mcp-server-netflix', repo: 'punkpeye/mcp-server-netflix', category: 'entertainment' },
  
  // Real Estate
  { name: 'mcp-server-zillow', repo: 'punkpeye/mcp-server-zillow', category: 'real-estate' },
  { name: 'mcp-server-realtor', repo: 'punkpeye/mcp-server-realtor', category: 'real-estate' },
  
  // Legal
  { name: 'mcp-server-legalzoom', repo: 'punkpeye/mcp-server-legalzoom', category: 'legal' },
  { name: 'mcp-server-docusign', repo: 'punkpeye/mcp-server-docusign', category: 'legal' },
  
  // HR & Recruitment
  { name: 'mcp-server-linkedin-recruiter', repo: 'punkpeye/mcp-server-linkedin-recruiter', category: 'hr' },
  { name: 'mcp-server-indeed', repo: 'punkpeye/mcp-server-indeed', category: 'hr' },
  { name: 'mcp-server-glassdoor', repo: 'punkpeye/mcp-server-glassdoor', category: 'hr' },
  
  // Logistics
  { name: 'mcp-server-fedex', repo: 'punkpeye/mcp-server-fedex', category: 'logistics' },
  { name: 'mcp-server-ups', repo: 'punkpeye/mcp-server-ups', category: 'logistics' },
  { name: 'mcp-server-dhl', repo: 'punkpeye/mcp-server-dhl', category: 'logistics' },
  
  // Agriculture
  { name: 'mcp-server-farm-management', repo: 'punkpeye/mcp-server-farm-management', category: 'agriculture' },
  { name: 'mcp-server-weather-farming', repo: 'punkpeye/mcp-server-weather-farming', category: 'agriculture' },
  
  // Energy
  { name: 'mcp-server-solar-monitoring', repo: 'punkpeye/mcp-server-solar-monitoring', category: 'energy' },
  { name: 'mcp-server-smart-grid', repo: 'punkpeye/mcp-server-smart-grid', category: 'energy' },
  
  // Manufacturing
  { name: 'mcp-server-erp', repo: 'punkpeye/mcp-server-erp', category: 'manufacturing' },
  { name: 'mcp-server-inventory', repo: 'punkpeye/mcp-server-inventory', category: 'manufacturing' },
  
  // Automotive
  { name: 'mcp-server-tesla', repo: 'punkpeye/mcp-server-tesla', category: 'automotive' },
  { name: 'mcp-server-car-diagnostics', repo: 'punkpeye/mcp-server-car-diagnostics', category: 'automotive' },
  
  // Insurance
  { name: 'mcp-server-insurance-api', repo: 'punkpeye/mcp-server-insurance-api', category: 'insurance' },
  { name: 'mcp-server-claims-processing', repo: 'punkpeye/mcp-server-claims-processing', category: 'insurance' },
  
  // Government
  { name: 'mcp-server-gov-data', repo: 'punkpeye/mcp-server-gov-data', category: 'government' },
  { name: 'mcp-server-census', repo: 'punkpeye/mcp-server-census', category: 'government' },
  
  // Non-profit
  { name: 'mcp-server-charity-navigator', repo: 'punkpeye/mcp-server-charity-navigator', category: 'nonprofit' },
  { name: 'mcp-server-donation-tracker', repo: 'punkpeye/mcp-server-donation-tracker', category: 'nonprofit' },
  
  // Sports
  { name: 'mcp-server-espn', repo: 'punkpeye/mcp-server-espn', category: 'sports' },
  { name: 'mcp-server-nfl', repo: 'punkpeye/mcp-server-nfl', category: 'sports' },
  { name: 'mcp-server-nba', repo: 'punkpeye/mcp-server-nba', category: 'sports' },
  
  // Science & Research
  { name: 'mcp-server-pubmed', repo: 'punkpeye/mcp-server-pubmed', category: 'research' },
  { name: 'mcp-server-arxiv', repo: 'punkpeye/mcp-server-arxiv', category: 'research' },
  { name: 'mcp-server-nasa', repo: 'punkpeye/mcp-server-nasa', category: 'research' },
  
  // Retail
  { name: 'mcp-server-amazon', repo: 'punkpeye/mcp-server-amazon', category: 'retail' },
  { name: 'mcp-server-ebay', repo: 'punkpeye/mcp-server-ebay', category: 'retail' },
  { name: 'mcp-server-etsy', repo: 'punkpeye/mcp-server-etsy', category: 'retail' },
  
  // Photography
  { name: 'mcp-server-unsplash', repo: 'punkpeye/mcp-server-unsplash', category: 'photography' },
  { name: 'mcp-server-pexels', repo: 'punkpeye/mcp-server-pexels', category: 'photography' },
  { name: 'mcp-server-shutterstock', repo: 'punkpeye/mcp-server-shutterstock', category: 'photography' },
  
  // Backup & Storage
  { name: 'mcp-server-backblaze', repo: 'punkpeye/mcp-server-backblaze', category: 'backup' },
  { name: 'mcp-server-carbonite', repo: 'punkpeye/mcp-server-carbonite', category: 'backup' },
  
  // Networking
  { name: 'mcp-server-cloudflare', repo: 'punkpeye/mcp-server-cloudflare', category: 'networking' },
  { name: 'mcp-server-dns', repo: 'punkpeye/mcp-server-dns', category: 'networking' },
  
  // Testing
  { name: 'mcp-server-browserstack', repo: 'punkpeye/mcp-server-browserstack', category: 'testing' },
  { name: 'mcp-server-sauce-labs', repo: 'punkpeye/mcp-server-sauce-labs', category: 'testing' },
  
  // Documentation
  { name: 'mcp-server-gitbook', repo: 'punkpeye/mcp-server-gitbook', category: 'documentation' },
  { name: 'mcp-server-confluence', repo: 'punkpeye/mcp-server-confluence', category: 'documentation' },
  
  // Video Conferencing
  { name: 'mcp-server-zoom', repo: 'punkpeye/mcp-server-zoom', category: 'video-conferencing' },
  { name: 'mcp-server-teams', repo: 'punkpeye/mcp-server-teams', category: 'video-conferencing' },
  { name: 'mcp-server-webex', repo: 'punkpeye/mcp-server-webex', category: 'video-conferencing' },
  
  // Survey & Forms
  { name: 'mcp-server-typeform', repo: 'punkpeye/mcp-server-typeform', category: 'forms' },
  { name: 'mcp-server-surveymonkey', repo: 'punkpeye/mcp-server-surveymonkey', category: 'forms' },
  { name: 'mcp-server-google-forms', repo: 'punkpeye/mcp-server-google-forms', category: 'forms' },
  
  // Automation
  { name: 'mcp-server-zapier', repo: 'punkpeye/mcp-server-zapier', category: 'automation' },
  { name: 'mcp-server-ifttt', repo: 'punkpeye/mcp-server-ifttt', category: 'automation' },
  { name: 'mcp-server-microsoft-flow', repo: 'punkpeye/mcp-server-microsoft-flow', category: 'automation' },
  
  // Version Control
  { name: 'mcp-server-git', repo: 'modelcontextprotocol/servers/src/git', category: 'version-control' },
  { name: 'mcp-server-svn', repo: 'punkpeye/mcp-server-svn', category: 'version-control' },
  { name: 'mcp-server-mercurial', repo: 'punkpeye/mcp-server-mercurial', category: 'version-control' },
  
  // Package Managers
  { name: 'mcp-server-npm', repo: 'punkpeye/mcp-server-npm', category: 'package-manager' },
  { name: 'mcp-server-pip', repo: 'punkpeye/mcp-server-pip', category: 'package-manager' },
  { name: 'mcp-server-composer', repo: 'punkpeye/mcp-server-composer', category: 'package-manager' },
  
  // Code Quality
  { name: 'mcp-server-sonarqube', repo: 'punkpeye/mcp-server-sonarqube', category: 'code-quality' },
  { name: 'mcp-server-codeclimate', repo: 'punkpeye/mcp-server-codeclimate', category: 'code-quality' },
  { name: 'mcp-server-eslint', repo: 'punkpeye/mcp-server-eslint', category: 'code-quality' },
  
  // Logging
  { name: 'mcp-server-logstash', repo: 'punkpeye/mcp-server-logstash', category: 'logging' },
  { name: 'mcp-server-splunk', repo: 'punkpeye/mcp-server-splunk', category: 'logging' },
  { name: 'mcp-server-fluentd', repo: 'punkpeye/mcp-server-fluentd', category: 'logging' },
  
  // Message Queues
  { name: 'mcp-server-rabbitmq', repo: 'punkpeye/mcp-server-rabbitmq', category: 'message-queue' },
  { name: 'mcp-server-kafka', repo: 'punkpeye/mcp-server-kafka', category: 'message-queue' },
  { name: 'mcp-server-activemq', repo: 'punkpeye/mcp-server-activemq', category: 'message-queue' },
  
  // Search Engines
  { name: 'mcp-server-solr', repo: 'punkpeye/mcp-server-solr', category: 'search-engine' },
  { name: 'mcp-server-algolia', repo: 'punkpeye/mcp-server-algolia', category: 'search-engine' },
  
  // Cache
  { name: 'mcp-server-memcached', repo: 'punkpeye/mcp-server-memcached', category: 'cache' },
  { name: 'mcp-server-varnish', repo: 'punkpeye/mcp-server-varnish', category: 'cache' },
  
  // Load Balancers
  { name: 'mcp-server-nginx', repo: 'punkpeye/mcp-server-nginx', category: 'load-balancer' },
  { name: 'mcp-server-haproxy', repo: 'punkpeye/mcp-server-haproxy', category: 'load-balancer' },
  
  // Containers
  { name: 'mcp-server-podman', repo: 'punkpeye/mcp-server-podman', category: 'container' },
  { name: 'mcp-server-containerd', repo: 'punkpeye/mcp-server-containerd', category: 'container' },
  
  // Orchestration
  { name: 'mcp-server-nomad', repo: 'punkpeye/mcp-server-nomad', category: 'orchestration' },
  { name: 'mcp-server-swarm', repo: 'punkpeye/mcp-server-swarm', category: 'orchestration' },
  
  // Service Mesh
  { name: 'mcp-server-istio', repo: 'punkpeye/mcp-server-istio', category: 'service-mesh' },
  { name: 'mcp-server-linkerd', repo: 'punkpeye/mcp-server-linkerd', category: 'service-mesh' },
  
  // API Gateway
  { name: 'mcp-server-kong', repo: 'punkpeye/mcp-server-kong', category: 'api-gateway' },
  { name: 'mcp-server-ambassador', repo: 'punkpeye/mcp-server-ambassador', category: 'api-gateway' },
  
  // Secrets Management
  { name: 'mcp-server-consul', repo: 'punkpeye/mcp-server-consul', category: 'secrets' },
  { name: 'mcp-server-etcd', repo: 'punkpeye/mcp-server-etcd', category: 'secrets' },
  
  // Backup Solutions
  { name: 'mcp-server-velero', repo: 'punkpeye/mcp-server-velero', category: 'backup-solution' },
  { name: 'mcp-server-restic', repo: 'punkpeye/mcp-server-restic', category: 'backup-solution' },
  
  // Disaster Recovery
  { name: 'mcp-server-disaster-recovery', repo: 'punkpeye/mcp-server-disaster-recovery', category: 'disaster-recovery' },
  
  // Performance Testing
  { name: 'mcp-server-jmeter', repo: 'punkpeye/mcp-server-jmeter', category: 'performance-testing' },
  { name: 'mcp-server-gatling', repo: 'punkpeye/mcp-server-gatling', category: 'performance-testing' },
  
  // Security Scanning
  { name: 'mcp-server-nessus', repo: 'punkpeye/mcp-server-nessus', category: 'security-scanning' },
  { name: 'mcp-server-openvas', repo: 'punkpeye/mcp-server-openvas', category: 'security-scanning' },
  
  // Compliance
  { name: 'mcp-server-compliance-checker', repo: 'punkpeye/mcp-server-compliance-checker', category: 'compliance' },
  
  // Incident Management
  { name: 'mcp-server-pagerduty', repo: 'punkpeye/mcp-server-pagerduty', category: 'incident-management' },
  { name: 'mcp-server-opsgenie', repo: 'punkpeye/mcp-server-opsgenie', category: 'incident-management' },
  
  // Asset Management
  { name: 'mcp-server-asset-tracker', repo: 'punkpeye/mcp-server-asset-tracker', category: 'asset-management' },
  
  // Change Management
  { name: 'mcp-server-change-tracker', repo: 'punkpeye/mcp-server-change-tracker', category: 'change-management' },
  
  // Knowledge Management
  { name: 'mcp-server-knowledge-base', repo: 'punkpeye/mcp-server-knowledge-base', category: 'knowledge-management' },
  
  // Workflow Management
  { name: 'mcp-server-workflow-engine', repo: 'punkpeye/mcp-server-workflow-engine', category: 'workflow' },
  
  // Business Intelligence
  { name: 'mcp-server-tableau', repo: 'punkpeye/mcp-server-tableau', category: 'business-intelligence' },
  { name: 'mcp-server-power-bi', repo: 'punkpeye/mcp-server-power-bi', category: 'business-intelligence' },
  
  // Data Warehousing
  { name: 'mcp-server-snowflake', repo: 'punkpeye/mcp-server-snowflake', category: 'data-warehouse' },
  { name: 'mcp-server-redshift', repo: 'punkpeye/mcp-server-redshift', category: 'data-warehouse' },
  
  // ETL Tools
  { name: 'mcp-server-airflow', repo: 'punkpeye/mcp-server-airflow', category: 'etl' },
  { name: 'mcp-server-luigi', repo: 'punkpeye/mcp-server-luigi', category: 'etl' },
  
  // Data Lakes
  { name: 'mcp-server-delta-lake', repo: 'punkpeye/mcp-server-delta-lake', category: 'data-lake' },
  { name: 'mcp-server-iceberg', repo: 'punkpeye/mcp-server-iceberg', category: 'data-lake' },
  
  // Stream Processing
  { name: 'mcp-server-spark-streaming', repo: 'punkpeye/mcp-server-spark-streaming', category: 'stream-processing' },
  { name: 'mcp-server-flink', repo: 'punkpeye/mcp-server-flink', category: 'stream-processing' },
  
  // Machine Learning Platforms
  { name: 'mcp-server-mlflow', repo: 'punkpeye/mcp-server-mlflow', category: 'ml-platform' },
  { name: 'mcp-server-kubeflow', repo: 'punkpeye/mcp-server-kubeflow', category: 'ml-platform' },
  
  // Feature Stores
  { name: 'mcp-server-feast', repo: 'punkpeye/mcp-server-feast', category: 'feature-store' },
  
  // Model Serving
  { name: 'mcp-server-seldon', repo: 'punkpeye/mcp-server-seldon', category: 'model-serving' },
  { name: 'mcp-server-kserve', repo: 'punkpeye/mcp-server-kserve', category: 'model-serving' },
  
  // Data Visualization
  { name: 'mcp-server-d3js', repo: 'punkpeye/mcp-server-d3js', category: 'data-visualization' },
  { name: 'mcp-server-plotly', repo: 'punkpeye/mcp-server-plotly', category: 'data-visualization' },
  
  // Geographic Information Systems
  { name: 'mcp-server-qgis', repo: 'punkpeye/mcp-server-qgis', category: 'gis' },
  { name: 'mcp-server-arcgis', repo: 'punkpeye/mcp-server-arcgis', category: 'gis' },
  
  // Remote Sensing
  { name: 'mcp-server-satellite-imagery', repo: 'punkpeye/mcp-server-satellite-imagery', category: 'remote-sensing' },
  
  // Environmental Monitoring
  { name: 'mcp-server-air-quality', repo: 'punkpeye/mcp-server-air-quality', category: 'environmental' },
  { name: 'mcp-server-water-quality', repo: 'punkpeye/mcp-server-water-quality', category: 'environmental' },
  
  // Smart City
  { name: 'mcp-server-traffic-management', repo: 'punkpeye/mcp-server-traffic-management', category: 'smart-city' },
  { name: 'mcp-server-waste-management', repo: 'punkpeye/mcp-server-waste-management', category: 'smart-city' },
  
  // Telecommunications
  { name: 'mcp-server-5g-network', repo: 'punkpeye/mcp-server-5g-network', category: 'telecom' },
  { name: 'mcp-server-network-monitoring', repo: 'punkpeye/mcp-server-network-monitoring', category: 'telecom' },
  
  // Robotics
  { name: 'mcp-server-ros', repo: 'punkpeye/mcp-server-ros', category: 'robotics' },
  { name: 'mcp-server-robot-control', repo: 'punkpeye/mcp-server-robot-control', category: 'robotics' },
  
  // Augmented Reality
  { name: 'mcp-server-ar-toolkit', repo: 'punkpeye/mcp-server-ar-toolkit', category: 'ar' },
  
  // Virtual Reality
  { name: 'mcp-server-vr-engine', repo: 'punkpeye/mcp-server-vr-engine', category: 'vr' },
  
  // 3D Modeling
  { name: 'mcp-server-blender', repo: 'punkpeye/mcp-server-blender', category: '3d-modeling' },
  { name: 'mcp-server-maya', repo: 'punkpeye/mcp-server-maya', category: '3d-modeling' },
  
  // CAD
  { name: 'mcp-server-autocad', repo: 'punkpeye/mcp-server-autocad', category: 'cad' },
  { name: 'mcp-server-solidworks', repo: 'punkpeye/mcp-server-solidworks', category: 'cad' },
  
  // Simulation
  { name: 'mcp-server-ansys', repo: 'punkpeye/mcp-server-ansys', category: 'simulation' },
  { name: 'mcp-server-matlab', repo: 'punkpeye/mcp-server-matlab', category: 'simulation' },
  
  // Scientific Computing
  { name: 'mcp-server-jupyter', repo: 'punkpeye/mcp-server-jupyter', category: 'scientific-computing' },
  { name: 'mcp-server-r-studio', repo: 'punkpeye/mcp-server-r-studio', category: 'scientific-computing' },
  
  // Bioinformatics
  { name: 'mcp-server-bioconductor', repo: 'punkpeye/mcp-server-bioconductor', category: 'bioinformatics' },
  { name: 'mcp-server-galaxy', repo: 'punkpeye/mcp-server-galaxy', category: 'bioinformatics' },
  
  // Genomics
  { name: 'mcp-server-gatk', repo: 'punkpeye/mcp-server-gatk', category: 'genomics' },
  { name: 'mcp-server-samtools', repo: 'punkpeye/mcp-server-samtools', category: 'genomics' },
  
  // Proteomics
  { name: 'mcp-server-maxquant', repo: 'punkpeye/mcp-server-maxquant', category: 'proteomics' },
  
  // Drug Discovery
  { name: 'mcp-server-rdkit', repo: 'punkpeye/mcp-server-rdkit', category: 'drug-discovery' },
  { name: 'mcp-server-openeye', repo: 'punkpeye/mcp-server-openeye', category: 'drug-discovery' },
  
  // Medical Imaging
  { name: 'mcp-server-dicom', repo: 'punkpeye/mcp-server-dicom', category: 'medical-imaging' },
  { name: 'mcp-server-itk', repo: 'punkpeye/mcp-server-itk', category: 'medical-imaging' },
  
  // Clinical Trials
  { name: 'mcp-server-clinical-data', repo: 'punkpeye/mcp-server-clinical-data', category: 'clinical-trials' },
  
  // Telemedicine
  { name: 'mcp-server-telehealth', repo: 'punkpeye/mcp-server-telehealth', category: 'telemedicine' },
  
  // Electronic Health Records
  { name: 'mcp-server-ehr', repo: 'punkpeye/mcp-server-ehr', category: 'ehr' },
  { name: 'mcp-server-fhir', repo: 'punkpeye/mcp-server-fhir', category: 'ehr' },
  
  // Pharmacy
  { name: 'mcp-server-pharmacy-management', repo: 'punkpeye/mcp-server-pharmacy-management', category: 'pharmacy' },
  
  // Laboratory Information Systems
  { name: 'mcp-server-lis', repo: 'punkpeye/mcp-server-lis', category: 'laboratory' },
  
  // Radiology Information Systems
  { name: 'mcp-server-ris', repo: 'punkpeye/mcp-server-ris', category: 'radiology' },
  
  // Hospital Information Systems
  { name: 'mcp-server-his', repo: 'punkpeye/mcp-server-his', category: 'hospital' },
  
  // Patient Monitoring
  { name: 'mcp-server-patient-monitoring', repo: 'punkpeye/mcp-server-patient-monitoring', category: 'patient-monitoring' },
  
  // Medical Devices
  { name: 'mcp-server-medical-devices', repo: 'punkpeye/mcp-server-medical-devices', category: 'medical-devices' },
  
  // Regulatory Compliance
  { name: 'mcp-server-fda-compliance', repo: 'punkpeye/mcp-server-fda-compliance', category: 'regulatory' },
  { name: 'mcp-server-hipaa-compliance', repo: 'punkpeye/mcp-server-hipaa-compliance', category: 'regulatory' },
  
  // Quality Assurance
  { name: 'mcp-server-qa-automation', repo: 'punkpeye/mcp-server-qa-automation', category: 'quality-assurance' },
  
  // Supply Chain
  { name: 'mcp-server-supply-chain', repo: 'punkpeye/mcp-server-supply-chain', category: 'supply-chain' },
  
  // Procurement
  { name: 'mcp-server-procurement', repo: 'punkpeye/mcp-server-procurement', category: 'procurement' },
  
  // Vendor Management
  { name: 'mcp-server-vendor-management', repo: 'punkpeye/mcp-server-vendor-management', category: 'vendor-management' },
  
  // Contract Management
  { name: 'mcp-server-contract-management', repo: 'punkpeye/mcp-server-contract-management', category: 'contract-management' },
  
  // Risk Management
  { name: 'mcp-server-risk-assessment', repo: 'punkpeye/mcp-server-risk-assessment', category: 'risk-management' },
  
  // Audit Management
  { name: 'mcp-server-audit-management', repo: 'punkpeye/mcp-server-audit-management', category: 'audit' },
  
  // Governance
  { name: 'mcp-server-governance', repo: 'punkpeye/mcp-server-governance', category: 'governance' },
  
  // Data Governance
  { name: 'mcp-server-data-governance', repo: 'punkpeye/mcp-server-data-governance', category: 'data-governance' },
  
  // Privacy Management
  { name: 'mcp-server-privacy-management', repo: 'punkpeye/mcp-server-privacy-management', category: 'privacy' },
  
  // Identity Management
  { name: 'mcp-server-identity-management', repo: 'punkpeye/mcp-server-identity-management', category: 'identity' },
  
  // Access Control
  { name: 'mcp-server-access-control', repo: 'punkpeye/mcp-server-access-control', category: 'access-control' },
  
  // Single Sign-On
  { name: 'mcp-server-sso', repo: 'punkpeye/mcp-server-sso', category: 'sso' },
  
  // Multi-Factor Authentication
  { name: 'mcp-server-mfa', repo: 'punkpeye/mcp-server-mfa', category: 'mfa' },
  
  // Certificate Management
  { name: 'mcp-server-certificate-management', repo: 'punkpeye/mcp-server-certificate-management', category: 'certificate' },
  
  // Key Management
  { name: 'mcp-server-key-management', repo: 'punkpeye/mcp-server-key-management', category: 'key-management' },
  
  // Encryption
  { name: 'mcp-server-encryption', repo: 'punkpeye/mcp-server-encryption', category: 'encryption' },
  
  // Digital Signatures
  { name: 'mcp-server-digital-signatures', repo: 'punkpeye/mcp-server-digital-signatures', category: 'digital-signatures' },
  
  // Blockchain Security
  { name: 'mcp-server-blockchain-security', repo: 'punkpeye/mcp-server-blockchain-security', category: 'blockchain-security' },
  
  // Threat Intelligence
  { name: 'mcp-server-threat-intelligence', repo: 'punkpeye/mcp-server-threat-intelligence', category: 'threat-intelligence' },
  
  // Vulnerability Management
  { name: 'mcp-server-vulnerability-management', repo: 'punkpeye/mcp-server-vulnerability-management', category: 'vulnerability' },
  
  // Penetration Testing
  { name: 'mcp-server-penetration-testing', repo: 'punkpeye/mcp-server-penetration-testing', category: 'penetration-testing' },
  
  // Security Information and Event Management
  { name: 'mcp-server-siem', repo: 'punkpeye/mcp-server-siem', category: 'siem' },
  
  // Security Orchestration
  { name: 'mcp-server-security-orchestration', repo: 'punkpeye/mcp-server-security-orchestration', category: 'security-orchestration' },
  
  // Fraud Detection
  { name: 'mcp-server-fraud-detection', repo: 'punkpeye/mcp-server-fraud-detection', category: 'fraud-detection' },
  
  // Anti-Money Laundering
  { name: 'mcp-server-aml', repo: 'punkpeye/mcp-server-aml', category: 'aml' },
  
  // Know Your Customer
  { name: 'mcp-server-kyc', repo: 'punkpeye/mcp-server-kyc', category: 'kyc' },
  
  // Credit Scoring
  { name: 'mcp-server-credit-scoring', repo: 'punkpeye/mcp-server-credit-scoring', category: 'credit-scoring' },
  
  // Loan Management
  { name: 'mcp-server-loan-management', repo: 'punkpeye/mcp-server-loan-management', category: 'loan-management' },
  
  // Investment Management
  { name: 'mcp-server-investment-management', repo: 'punkpeye/mcp-server-investment-management', category: 'investment' },
  
  // Portfolio Management
  { name: 'mcp-server-portfolio-management', repo: 'punkpeye/mcp-server-portfolio-management', category: 'portfolio' },
  
  // Trading Systems
  { name: 'mcp-server-trading-systems', repo: 'punkpeye/mcp-server-trading-systems', category: 'trading' },
  
  // Market Data
  { name: 'mcp-server-market-data', repo: 'punkpeye/mcp-server-market-data', category: 'market-data' },
  
  // Financial Reporting
  { name: 'mcp-server-financial-reporting', repo: 'punkpeye/mcp-server-financial-reporting', category: 'financial-reporting' },
  
  // Tax Management
  { name: 'mcp-server-tax-management', repo: 'punkpeye/mcp-server-tax-management', category: 'tax' },
  
  // Payroll
  { name: 'mcp-server-payroll', repo: 'punkpeye/mcp-server-payroll', category: 'payroll' },
  
  // Expense Management
  { name: 'mcp-server-expense-management', repo: 'punkpeye/mcp-server-expense-management', category: 'expense' },
  
  // Budget Planning
  { name: 'mcp-server-budget-planning', repo: 'punkpeye/mcp-server-budget-planning', category: 'budget' },
  
  // Financial Analytics
  { name: 'mcp-server-financial-analytics', repo: 'punkpeye/mcp-server-financial-analytics', category: 'financial-analytics' },
  
  // Regulatory Reporting
  { name: 'mcp-server-regulatory-reporting', repo: 'punkpeye/mcp-server-regulatory-reporting', category: 'regulatory-reporting' },
  
  // Basel Compliance
  { name: 'mcp-server-basel-compliance', repo: 'punkpeye/mcp-server-basel-compliance', category: 'basel' },
  
  // Solvency II
  { name: 'mcp-server-solvency-ii', repo: 'punkpeye/mcp-server-solvency-ii', category: 'solvency' },
  
  // IFRS Reporting
  { name: 'mcp-server-ifrs-reporting', repo: 'punkpeye/mcp-server-ifrs-reporting', category: 'ifrs' },
  
  // GAAP Reporting
  { name: 'mcp-server-gaap-reporting', repo: 'punkpeye/mcp-server-gaap-reporting', category: 'gaap' },
  
  // ESG Reporting
  { name: 'mcp-server-esg-reporting', repo: 'punkpeye/mcp-server-esg-reporting', category: 'esg' },
  
  // Sustainability Tracking
  { name: 'mcp-server-sustainability-tracking', repo: 'punkpeye/mcp-server-sustainability-tracking', category: 'sustainability' },
  
  // Carbon Footprint
  { name: 'mcp-server-carbon-footprint', repo: 'punkpeye/mcp-server-carbon-footprint', category: 'carbon' },
  
  // Renewable Energy
  { name: 'mcp-server-renewable-energy', repo: 'punkpeye/mcp-server-renewable-energy', category: 'renewable-energy' },
  
  // Waste Tracking
  { name: 'mcp-server-waste-tracking', repo: 'punkpeye/mcp-server-waste-tracking', category: 'waste-tracking' },
  
  // Water Management
  { name: 'mcp-server-water-management', repo: 'punkpeye/mcp-server-water-management', category: 'water-management' },
  
  // Circular Economy
  { name: 'mcp-server-circular-economy', repo: 'punkpeye/mcp-server-circular-economy', category: 'circular-economy' },
];

// ฟังก์ชันสำหรับสร้าง MCP server configuration
function generateMCPServerConfig(server, port) {
  return {
    name: server.name,
    port: port,
    category: server.category,
    repo: server.repo,
    config: {
      command: 'node',
      args: [`./community-servers/${server.name}/index.js`],
      env: {
        PORT: port.toString(),
        NODE_ENV: 'production',
        MCP_SERVER_NAME: server.name,
        MCP_SERVER_CATEGORY: server.category
      }
    },
    tools: [
      {
        name: `${server.category}_list`,
        description: `List ${server.category} resources`
      },
      {
        name: `${server.category}_get`,
        description: `Get specific ${server.category} resource`
      },
      {
        name: `${server.category}_create`,
        description: `Create new ${server.category} resource`
      },
      {
        name: `${server.category}_update`,
        description: `Update ${server.category} resource`
      },
      {
        name: `${server.category}_delete`,
        description: `Delete ${server.category} resource`
      }
    ]
  };
}

// ฟังก์ชันสำหรับสร้าง server registry
function createServerRegistry() {
  const registry = {
    servers: [],
    categories: {},
    totalServers: communityServers.length,
    startPort: 9000,
    endPort: 9000 + communityServers.length - 1
  };

  communityServers.forEach((server, index) => {
    const port = 9000 + index;
    const config = generateMCPServerConfig(server, port);
    
    registry.servers.push(config);
    
    if (!registry.categories[server.category]) {
      registry.categories[server.category] = [];
    }
    registry.categories[server.category].push(config);
  });

  return registry;
}

// ฟังก์ชันสำหรับบันทึก registry ลงไฟล์
function saveRegistry() {
  const registry = createServerRegistry();
  const registryPath = path.join(__dirname, 'community-server-registry.json');
  
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  console.log(`✅ Community server registry saved to ${registryPath}`);
  console.log(`📊 Total servers: ${registry.totalServers}`);
  console.log(`📂 Categories: ${Object.keys(registry.categories).length}`);
  console.log(`🔌 Port range: ${registry.startPort}-${registry.endPort}`);
  
  return registry;
}

// ฟังก์ชันสำหรับสร้าง MCP config file
function generateMCPConfig(registry) {
  const mcpConfig = {
    mcpServers: {}
  };

  registry.servers.forEach(server => {
    mcpConfig.mcpServers[server.name] = {
      command: server.config.command,
      args: server.config.args,
      env: server.config.env
    };
  });

  const configPath = path.join(__dirname, 'community-mcp.config.json');
  fs.writeFileSync(configPath, JSON.stringify(mcpConfig, null, 2));
  console.log(`✅ MCP config saved to ${configPath}`);
  
  return mcpConfig;
}

// ฟังก์ชันสำหรับสร้าง proxy routing configuration
function generateProxyRouting(registry) {
  const routing = {
    routes: [],
    loadBalancing: {
      strategy: 'round-robin',
      healthCheck: {
        enabled: true,
        interval: 30000,
        timeout: 5000,
        retries: 3
      }
    },
    categories: {}
  };

  registry.servers.forEach(server => {
    routing.routes.push({
      path: `/${server.category}/*`,
      target: `http://localhost:${server.port}`,
      name: server.name,
      category: server.category
    });
    
    routing.routes.push({
      path: `/${server.name}/*`,
      target: `http://localhost:${server.port}`,
      name: server.name,
      category: server.category
    });
  });

  Object.keys(registry.categories).forEach(category => {
    routing.categories[category] = registry.categories[category].map(server => ({
      name: server.name,
      port: server.port,
      url: `http://localhost:${server.port}`
    }));
  });

  const routingPath = path.join(__dirname, 'community-proxy-routing.json');
  fs.writeFileSync(routingPath, JSON.stringify(routing, null, 2));
  console.log(`✅ Proxy routing config saved to ${routingPath}`);
  
  return routing;
}

// ฟังก์ชันสำหรับสร้าง deployment script
function generateDeploymentScript(registry) {
  let script = `#!/usr/bin/env node

// Community MCP Servers Deployment Script
// Auto-generated script to deploy ${registry.totalServers} MCP servers

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const servers = ${JSON.stringify(registry.servers, null, 2)};

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
      console.log(\`🚀 Deploying \${serverConfig.name} on port \${serverConfig.port}...\`);
      
      const serverProcess = spawn(serverConfig.config.command, serverConfig.config.args, {
        env: { ...process.env, ...serverConfig.config.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverStarted = false;
      const timeout = setTimeout(() => {
        if (!serverStarted) {
          console.error(\`❌ \${serverConfig.name} failed to start within timeout\`);
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
            console.log(\`✅ \${serverConfig.name} started successfully\`);
            this.runningServers.set(serverConfig.name, serverProcess);
            this.deploymentStatus.deployed++;
            this.deploymentStatus.running++;
            resolve(serverProcess);
          }
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error(\`⚠️  \${serverConfig.name} stderr: \${data}\`);
      });

      serverProcess.on('close', (code) => {
        if (this.runningServers.has(serverConfig.name)) {
          console.log(\`🔴 \${serverConfig.name} stopped with code \${code}\`);
          this.runningServers.delete(serverConfig.name);
          this.deploymentStatus.running--;
        }
      });

      serverProcess.on('error', (error) => {
        console.error(\`❌ \${serverConfig.name} error: \${error.message}\`);
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
      console.log(\`\n📦 Deploying batch \${i + 1}/\${batches.length} (\${batch.length} servers)...\`);
      
      const deployPromises = batch.map(server => 
        this.deployServer(server).catch(error => {
          console.error(\`Failed to deploy \${server.name}: \${error.message}\`);
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
    console.log(\`🎯 Starting deployment of \${servers.length} community MCP servers...\`);
    console.log(\`📊 Port range: \${servers[0].port} - \${servers[servers.length - 1].port}\`);
    
    const startTime = Date.now();
    
    try {
      await this.deployBatch(servers, 10);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(\`\n🎉 Deployment completed in \${duration.toFixed(2)} seconds\`);
      console.log(\`📈 Status: \${this.deploymentStatus.deployed}/\${this.deploymentStatus.total} deployed, \${this.deploymentStatus.failed} failed\`);
      console.log(\`🟢 Running servers: \${this.deploymentStatus.running}\`);
      
      // Save deployment status
      const statusPath = path.join(__dirname, 'community-deployment-status.json');
      fs.writeFileSync(statusPath, JSON.stringify({
        ...this.deploymentStatus,
        deploymentTime: new Date().toISOString(),
        duration: duration,
        runningServers: Array.from(this.runningServers.keys())
      }, null, 2));
      
    } catch (error) {
      console.error(\`💥 Deployment failed: \${error.message}\`);
    }
  }

  stopAll() {
    console.log('🛑 Stopping all community servers...');
    this.runningServers.forEach((process, name) => {
      console.log(\`Stopping \${name}...\`);
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
  console.log('\n🛑 Received SIGINT, stopping all servers...');
  if (global.deployer) {
    global.deployer.stopAll();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping all servers...');
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
`;

  const scriptPath = path.join(__dirname, 'deploy-community-servers.js');
  fs.writeFileSync(scriptPath, script);
  console.log(`✅ Deployment script saved to ${scriptPath}`);
  
  return scriptPath;
}

// Main execution function
function main() {
  console.log('🚀 Generating Community MCP Servers Configuration...');
  console.log(`📊 Total servers to configure: ${communityServers.length}`);
  
  try {
    // Create registry
    const registry = saveRegistry();
    
    // Generate MCP config
    generateMCPConfig(registry);
    
    // Generate proxy routing
    generateProxyRouting(registry);
    
    // Generate deployment script
    generateDeploymentScript(registry);
    
    console.log('\n🎉 All configuration files generated successfully!');
    console.log('\n📋 Generated files:');
    console.log('  - community-server-registry.json');
    console.log('  - community-mcp.config.json');
    console.log('  - community-proxy-routing.json');
    console.log('  - deploy-community-servers.js');
    
    console.log('\n🚀 Next steps:');
    console.log('  1. Run: node deploy-community-servers.js');
    console.log('  2. Update MCP Proxy to use community-proxy-routing.json');
    console.log('  3. Test server connectivity and health checks');
    
  } catch (error) {
    console.error('❌ Error generating configuration:', error.message);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = {
  communityServers,
  generateMCPServerConfig,
  createServerRegistry,
  saveRegistry,
  generateMCPConfig,
  generateProxyRouting,
  generateDeploymentScript,
  main
};

// Run if called directly
if (require.main === module) {
  main();
}