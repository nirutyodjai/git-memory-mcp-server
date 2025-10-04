/**
 * Advanced API Versioning Service for Git Memory MCP Server
 *
 * Features:
 * - Semantic versioning support (Major.Minor.Patch)
 * - Automatic deprecation warnings and migration guides
 * - Version negotiation (Accept header, URL path, query parameter)
 * - Backward compatibility management
 * - API evolution tracking and changelog generation
 * - Breaking change detection and notification
 * - Version-specific middleware and validation
 * - A/B testing support for API versions
 */

import { EventEmitter } from 'events';

export interface APIVersion {
  version: string;
  major: number;
  minor: number;
  patch: number;
  status: 'alpha' | 'beta' | 'stable' | 'deprecated' | 'sunset';
  releaseDate: string;
  deprecationDate?: string;
  sunsetDate?: string;
  changelog: string[];
  breakingChanges: string[];
  features: string[];
  middleware?: Array<(req: any, res: any, next: any) => void>;
  validation?: Record<string, any>;
  metadata: Record<string, any>;
}

export interface VersionNegotiation {
  requestedVersion?: string;
  negotiatedVersion: string;
  strategy: 'header' | 'url' | 'query' | 'default';
  warnings: string[];
  migrationGuide?: string;
}

export interface APIVersioningConfig {
  defaultVersion: string;
  supportedVersions: string[];
  versionHeader: string;
  versionParameter: string;
  enableDeprecationWarnings: boolean;
  enableBreakingChangeWarnings: boolean;
  enableMigrationGuides: boolean;
  sunsetGracePeriod: number; // days
  enableABTesting: boolean;
  abTestPercentage: number;
}

export class APIVersioningService extends EventEmitter {
  private versions: Map<string, APIVersion> = new Map();
  private config: APIVersioningConfig;
  private versionStats: Map<string, { requests: number; errors: number; lastUsed: number }> = new Map();

  constructor(config: Partial<APIVersioningConfig> = {}) {
    super();

    this.config = {
      defaultVersion: '2.0.0',
      supportedVersions: ['1.0.0', '2.0.0'],
      versionHeader: 'X-API-Version',
      versionParameter: 'v',
      enableDeprecationWarnings: true,
      enableBreakingChangeWarnings: true,
      enableMigrationGuides: true,
      sunsetGracePeriod: 90,
      enableABTesting: false,
      abTestPercentage: 10,
      ...config
    };

    this.initializeVersions();
  }

  /**
   * Initialize default API versions
   */
  private initializeVersions(): void {
    // Version 1.0.0 (Legacy)
    this.addVersion({
      version: '1.0.0',
      major: 1,
      minor: 0,
      patch: 0,
      status: 'deprecated',
      releaseDate: '2024-01-01',
      deprecationDate: '2024-06-01',
      sunsetDate: '2024-12-01',
      changelog: [
        'Initial API version',
        'Basic Git operations support',
        'WebSocket connections'
      ],
      breakingChanges: [],
      features: ['git_status', 'git_log', 'websocket'],
      middleware: [],
      validation: {},
      metadata: { legacy: true }
    });

    // Version 2.0.0 (Current)
    this.addVersion({
      version: '2.0.0',
      major: 2,
      minor: 0,
      patch: 0,
      status: 'stable',
      releaseDate: '2024-07-01',
      changelog: [
        'Enhanced performance and scalability',
        'Advanced caching and rate limiting',
        'Kubernetes deployment support',
        'TypeScript definitions',
        'WebSocket real-time features',
        'Git webhooks integration'
      ],
      breakingChanges: [
        'Updated response format for git operations',
        'New authentication requirements',
        'Deprecated legacy endpoints'
      ],
      features: [
        'advanced_caching',
        'rate_limiting',
        'kubernetes_deployment',
        'typescript_support',
        'websocket_realtime',
        'webhooks_integration',
        'monitoring_observability',
        'audit_logging'
      ],
      middleware: [],
      validation: {},
      metadata: { current: true, recommended: true }
    });
  }

  /**
   * Add new API version
   */
  addVersion(version: APIVersion): void {
    this.versions.set(version.version, version);
    this.versionStats.set(version.version, {
      requests: 0,
      errors: 0,
      lastUsed: Date.now()
    });

    this.emit('version:added', version);
  }

  /**
   * Remove API version
   */
  removeVersion(version: string): boolean {
    if (!this.versions.has(version)) return false;

    const versionInfo = this.versions.get(version)!;

    // Check if version is sunset
    if (versionInfo.sunsetDate && new Date(versionInfo.sunsetDate) > new Date()) {
      this.emit('version:removal:blocked', { version, reason: 'Version is not yet sunset' });
      return false;
    }

    this.versions.delete(version);
    this.versionStats.delete(version);

    this.emit('version:removed', version);
    return true;
  }

  /**
   * Negotiate API version for request
   */
  negotiateVersion(
    req: any,
    supportedVersions: string[] = this.config.supportedVersions
  ): VersionNegotiation {
    const warnings: string[] = [];
    let negotiatedVersion = this.config.defaultVersion;
    let strategy: VersionNegotiation['strategy'] = 'default';
    let migrationGuide: string | undefined;

    // Check Accept header
    const acceptHeader = req.headers[this.config.versionHeader.toLowerCase()];
    if (acceptHeader) {
      const requestedVersion = this.parseVersionHeader(acceptHeader);
      if (requestedVersion && this.isVersionSupported(requestedVersion, supportedVersions)) {
        negotiatedVersion = requestedVersion;
        strategy = 'header';
      }
    }

    // Check URL path
    const urlVersion = this.extractVersionFromUrl(req.path);
    if (urlVersion && this.isVersionSupported(urlVersion, supportedVersions)) {
      negotiatedVersion = urlVersion;
      strategy = 'url';
    }

    // Check query parameter
    const queryVersion = req.query[this.config.versionParameter];
    if (queryVersion && this.isVersionSupported(queryVersion, supportedVersions)) {
      negotiatedVersion = queryVersion;
      strategy = 'query';
    }

    // Get version info
    const versionInfo = this.versions.get(negotiatedVersion);
    if (versionInfo) {
      // Check for deprecation warnings
      if (this.config.enableDeprecationWarnings && versionInfo.status === 'deprecated') {
        warnings.push(`API version ${negotiatedVersion} is deprecated. Please migrate to a newer version.`);

        if (this.config.enableMigrationGuides && versionInfo.metadata.migrationGuide) {
          migrationGuide = versionInfo.metadata.migrationGuide;
        }
      }

      // Check for breaking change warnings
      if (this.config.enableBreakingChangeWarnings && versionInfo.breakingChanges.length > 0) {
        warnings.push(`API version ${negotiatedVersion} contains breaking changes. Please review the changelog.`);
      }

      // Track usage
      this.trackVersionUsage(negotiatedVersion);
    }

    return {
      requestedVersion: acceptHeader || urlVersion || queryVersion,
      negotiatedVersion,
      strategy,
      warnings,
      migrationGuide
    };
  }

  /**
   * Apply version-specific middleware
   */
  applyVersionMiddleware(
    req: any,
    res: any,
    version: string,
    next: any
  ): void {
    const versionInfo = this.versions.get(version);
    if (!versionInfo || !versionInfo.middleware) {
      return next();
    }

    // Apply middleware in order
    let index = 0;
    const applyNext = (error?: any) => {
      if (error) return next(error);

      if (index < versionInfo.middleware!.length) {
        const middleware = versionInfo.middleware![index++];
        middleware(req, res, applyNext);
      } else {
        next();
      }
    };

    applyNext();
  }

  /**
   * Get version-specific validation schema
   */
  getVersionValidation(version: string, endpoint: string): Record<string, any> | null {
    const versionInfo = this.versions.get(version);
    if (!versionInfo || !versionInfo.validation) return null;

    return versionInfo.validation[endpoint] || null;
  }

  /**
   * Check if version is supported
   */
  private isVersionSupported(version: string, supportedVersions: string[]): boolean {
    return supportedVersions.includes(version);
  }

  /**
   * Parse version from Accept header
   */
  private parseVersionHeader(header: string): string | null {
    // Parse something like: "application/vnd.git-memory.v2+json"
    const match = header.match(/application\/vnd\.git-memory\.v(\d+)\+json/);
    return match ? `${match[1]}.0.0` : null;
  }

  /**
   * Extract version from URL path
   */
  private extractVersionFromUrl(path: string): string | null {
    // Match patterns like: /v1/git/status, /api/v2.1.0/git/status
    const match = path.match(/^\/(?:api\/)?v?(\d+(?:\.\d+){0,2})/);
    return match ? match[1] : null;
  }

  /**
   * Track version usage statistics
   */
  private trackVersionUsage(version: string): void {
    const stats = this.versionStats.get(version);
    if (stats) {
      stats.requests++;
      stats.lastUsed = Date.now();
    }
  }

  /**
   * Record version error
   */
  recordVersionError(version: string): void {
    const stats = this.versionStats.get(version);
    if (stats) {
      stats.errors++;
    }
  }

  /**
   * Get version statistics
   */
  getVersionStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [version, versionInfo] of this.versions.entries()) {
      const usageStats = this.versionStats.get(version) || { requests: 0, errors: 0, lastUsed: 0 };

      stats[version] = {
        ...versionInfo,
        usage: usageStats,
        errorRate: usageStats.requests > 0 ? (usageStats.errors / usageStats.requests) * 100 : 0
      };
    }

    return stats;
  }

  /**
   * Get migration guide for version upgrade
   */
  getMigrationGuide(fromVersion: string, toVersion: string): string | null {
    const from = this.versions.get(fromVersion);
    const to = this.versions.get(toVersion);

    if (!from || !to) return null;

    const guide = [
      `# Migration Guide: ${fromVersion} → ${toVersion}`,
      '',
      '## Breaking Changes',
      ...to.breakingChanges.map(change => `- ${change}`),
      '',
      '## New Features',
      ...to.features.map(feature => `- ${feature}`),
      '',
      '## Migration Steps',
      '1. Update your API version header or URL',
      '2. Review breaking changes above',
      '3. Test your integration with the new version',
      '4. Update your client code as needed',
      '',
      '## Timeline',
      `- Released: ${new Date(to.releaseDate).toLocaleDateString()}`,
      ...(to.deprecationDate ? [`- Deprecated: ${new Date(to.deprecationDate).toLocaleDateString()}`] : []),
      ...(to.sunsetDate ? [`- Sunset: ${new Date(to.sunsetDate).toLocaleDateString()}`] : [])
    ];

    return guide.join('\n');
  }

  /**
   * Check if version should be sunset
   */
  checkSunsetVersions(): string[] {
    const now = new Date();
    const sunsetVersions: string[] = [];

    for (const [version, versionInfo] of this.versions.entries()) {
      if (versionInfo.sunsetDate && new Date(versionInfo.sunsetDate) <= now) {
        sunsetVersions.push(version);
      }
    }

    return sunsetVersions;
  }

  /**
   * Generate API changelog
   */
  generateChangelog(): string {
    const sortedVersions = Array.from(this.versions.values())
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

    const changelog = [
      '# API Changelog',
      '',
      ...sortedVersions.map(version => [
        `## Version ${version.version} (${version.status}) - ${new Date(version.releaseDate).toLocaleDateString()}`,
        '',
        '### Features',
        ...version.features.map(feature => `- ${feature}`),
        '',
        '### Breaking Changes',
        ...version.breakingChanges.map(change => `- ${change}`),
        '',
        '### Changelog',
        ...version.changelog.map(change => `- ${change}`),
        ''
      ]).flat()
    ];

    return changelog.join('\n');
  }

  /**
   * Create version-specific response headers
   */
  createVersionHeaders(negotiation: VersionNegotiation): Record<string, string> {
    const headers: Record<string, string> = {
      'X-API-Version': negotiation.negotiatedVersion,
      'X-API-Version-Negotiation': negotiation.strategy
    };

    if (negotiation.warnings.length > 0) {
      headers['X-API-Warnings'] = negotiation.warnings.join(', ');
    }

    if (negotiation.migrationGuide) {
      headers['X-API-Migration-Guide'] = negotiation.migrationGuide;
    }

    // Get version info for additional headers
    const versionInfo = this.versions.get(negotiation.negotiatedVersion);
    if (versionInfo) {
      if (versionInfo.status === 'deprecated') {
        headers['X-API-Deprecation'] = 'true';
        if (versionInfo.sunsetDate) {
          headers['X-API-Sunset-Date'] = versionInfo.sunsetDate;
        }
      }

      if (versionInfo.breakingChanges.length > 0) {
        headers['X-API-Breaking-Changes'] = 'true';
      }
    }

    return headers;
  }

  /**
   * A/B Testing support for API versions
   */
  selectABTestVersion(baseVersion: string, testVersion: string): string {
    if (!this.config.enableABTesting) return baseVersion;

    // Simple percentage-based A/B testing
    const random = Math.random() * 100;
    return random < this.config.abTestPercentage ? testVersion : baseVersion;
  }

  /**
   * Validate API compatibility
   */
  validateCompatibility(currentVersion: string, requiredVersion: string): {
    compatible: boolean;
    message?: string;
  } {
    const current = this.parseVersion(currentVersion);
    const required = this.parseVersion(requiredVersion);

    if (!current || !required) {
      return {
        compatible: false,
        message: 'Invalid version format'
      };
    }

    // Major version compatibility (semantic versioning)
    if (required.major > current.major) {
      return {
        compatible: false,
        message: `Requires major version ${required.major}, current is ${current.major}`
      };
    }

    // Minor version compatibility
    if (required.major === current.major && required.minor > current.minor) {
      return {
        compatible: false,
        message: `Requires minor version ${required.minor}, current is ${current.minor}`
      };
    }

    return { compatible: true };
  }

  /**
   * Parse version string into components
   */
  private parseVersion(version: string): { major: number; minor: number; patch: number } | null {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return null;

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10)
    };
  }

  /**
   * Get all available versions
   */
  getVersions(): APIVersion[] {
    return Array.from(this.versions.values());
  }

  /**
   * Get version info
   */
  getVersion(version: string): APIVersion | null {
    return this.versions.get(version) || null;
  }

  /**
   * Update version status
   */
  updateVersionStatus(version: string, status: APIVersion['status']): boolean {
    const versionInfo = this.versions.get(version);
    if (!versionInfo) return false;

    const oldStatus = versionInfo.status;
    versionInfo.status = status;

    // Set dates based on status
    if (status === 'deprecated' && !versionInfo.deprecationDate) {
      versionInfo.deprecationDate = new Date().toISOString();
    }

    if (status === 'sunset' && !versionInfo.sunsetDate) {
      versionInfo.sunsetDate = new Date(Date.now() + (this.config.sunsetGracePeriod * 24 * 60 * 60 * 1000)).toISOString();
    }

    this.emit('version:status:updated', { version, oldStatus, newStatus: status });
    return true;
  }

  /**
   * Health check
   */
  healthCheck(): { status: 'healthy' | 'unhealthy'; details?: any } {
    const totalVersions = this.versions.size;
    const stableVersions = Array.from(this.versions.values()).filter(v => v.status === 'stable').length;

    if (stableVersions === 0) {
      return {
        status: 'unhealthy',
        details: { issue: 'No stable API versions available' }
      };
    }

    return { status: 'healthy' };
  }

  /**
   * Generate OpenAPI/Swagger documentation for specific version
   */
  generateOpenAPIDoc(version: string): Record<string, any> | null {
    const versionInfo = this.versions.get(version);
    if (!versionInfo) return null;

    return {
      openapi: '3.0.0',
      info: {
        title: 'Git Memory MCP Server API',
        version: version,
        description: `Git Memory MCP Server API version ${version}`,
        contact: {
          name: 'API Support',
          url: 'https://github.com/your-org/git-memory-mcp-server'
        }
      },
      servers: [
        {
          url: '/api/{version}',
          description: 'Git Memory API',
          variables: {
            version: {
              enum: [version],
              default: version
            }
          }
        }
      ],
      paths: this.generatePathsForVersion(version),
      components: {
        schemas: this.generateSchemasForVersion(version),
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          }
        }
      }
    };
  }

  /**
   * Generate paths for specific version
   */
  private generatePathsForVersion(version: string): Record<string, any> {
    // This would generate actual API paths based on version
    // For now, return a sample structure
    return {
      '/git/status': {
        get: {
          summary: 'Get Git repository status',
          parameters: [
            {
              name: 'repoPath',
              in: 'query',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Git status information',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/GitStatus' }
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Generate schemas for specific version
   */
  private generateSchemasForVersion(version: string): Record<string, any> {
    // This would generate actual schemas based on version
    // For now, return sample schemas
    return {
      GitStatus: {
        type: 'object',
        properties: {
          branch: { type: 'string' },
          modified: { type: 'array', items: { type: 'string' } },
          staged: { type: 'array', items: { type: 'string' } }
        }
      }
    };
  }
}
