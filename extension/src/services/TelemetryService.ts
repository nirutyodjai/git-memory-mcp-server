import { ConfigurationService } from './ConfigurationService';

export interface TelemetryEvent {
  name: string;
  properties?: Record<string, any>;
  measurements?: Record<string, number>;
  timestamp?: Date;
}

/**
 * Telemetry service for collecting usage metrics
 */
export class TelemetryService {
  private events: TelemetryEvent[] = [];
  private isEnabled = false;
  private flushInterval?: NodeJS.Timeout;
  
  constructor(private configService: ConfigurationService) {
    this.isEnabled = this.configService.get('telemetry.enabled', false);
  }
  
  /**
   * Start telemetry collection
   */
  start(): void {
    if (!this.isEnabled) return;
    
    // Flush events every 5 minutes
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5 * 60 * 1000);
  }
  
  /**
   * Stop telemetry collection
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = undefined;
    }
    this.flush();
  }
  
  /**
   * Track event
   */
  trackEvent(name: string, properties?: Record<string, any>, measurements?: Record<string, number>): void {
    if (!this.isEnabled) return;
    
    this.events.push({
      name,
      properties,
      measurements,
      timestamp: new Date()
    });
    
    // Auto-flush if too many events
    if (this.events.length >= 100) {
      this.flush();
    }
  }
  
  /**
   * Track snippet usage
   */
  trackSnippetUsage(snippetId: string, success: boolean, context?: string): void {
    this.trackEvent('snippet.used', {
      snippetId,
      success,
      context
    }, {
      success: success ? 1 : 0
    });
  }
  
  /**
   * Track pattern usage
   */
  trackPatternUsage(patternId: string, success: boolean, executionTime?: number): void {
    this.trackEvent('pattern.used', {
      patternId,
      success
    }, {
      success: success ? 1 : 0,
      executionTime: executionTime || 0
    });
  }
  
  /**
   * Track auto-fix
   */
  trackAutoFix(issueType: string, success: boolean, fixTime?: number): void {
    this.trackEvent('autofix.executed', {
      issueType,
      success
    }, {
      success: success ? 1 : 0,
      fixTime: fixTime || 0
    });
  }
  
  /**
   * Flush events to storage/server
   */
  private flush(): void {
    if (this.events.length === 0) return;
    
    // In a real implementation, you would send these to a telemetry service
    console.log('Telemetry events:', this.events);
    
    // Clear events
    this.events = [];
  }
  
  /**
   * Dispose telemetry service
   */
  dispose(): void {
    this.stop();
  }
}