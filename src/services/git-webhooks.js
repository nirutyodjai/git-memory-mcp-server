/**
 * Git Webhooks Service for Git Memory MCP Server
 *
 * Handles incoming webhooks from Git hosting services like GitHub, GitLab, etc.
 * Processes Git events and broadcasts them to subscribed WebSocket clients.
 */

import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Git Webhooks Service
 */
export class GitWebhooksService {
  constructor(server, options = {}) {
    this.server = server;
    this.webhookSecret = options.webhookSecret || process.env.GIT_WEBHOOK_SECRET;
    this.allowedOrigins = options.allowedOrigins || ['github.com', 'gitlab.com'];
    this.eventHandlers = new Map();

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for different Git events
   */
  setupEventHandlers() {
    // GitHub webhook events
    this.registerEventHandler('push', this.handlePushEvent.bind(this));
    this.registerEventHandler('pull_request', this.handlePullRequestEvent.bind(this));
    this.registerEventHandler('pull_request_review', this.handlePullRequestReviewEvent.bind(this));
    this.registerEventHandler('issues', this.handleIssuesEvent.bind(this));
    this.registerEventHandler('issue_comment', this.handleIssueCommentEvent.bind(this));

    // GitLab webhook events
    this.registerEventHandler('Push Hook', this.handlePushEvent.bind(this));
    this.registerEventHandler('Merge Request Hook', this.handleMergeRequestEvent.bind(this));
    this.registerEventHandler('Issue Hook', this.handleIssueEvent.bind(this));
    this.registerEventHandler('Note Hook', this.handleNoteEvent.bind(this));

    // Generic Git events
    this.registerEventHandler('ping', this.handlePingEvent.bind(this));
  }

  /**
   * Register event handler for specific event type
   */
  registerEventHandler(eventType, handler) {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Verify webhook signature (GitHub/GitLab style)
   */
  verifyWebhookSignature(payload, signature, secret) {
    if (!signature || !secret) {
      return false;
    }

    try {
      // Support both GitHub (sha256) and GitLab (sha1) signatures
      const [algorithm, expectedSignature] = signature.split('=');

      if (!algorithm || !expectedSignature) {
        return false;
      }

      const hmac = crypto.createHmac(algorithm, secret);
      hmac.update(payload);
      const computedSignature = hmac.digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(computedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Verify webhook origin
   */
  verifyWebhookOrigin(req) {
    if (this.allowedOrigins.length === 0) {
      return true; // Allow all if no restrictions
    }

    const userAgent = req.get('User-Agent') || '';
    const origin = req.get('X-GitHub-Event') || req.get('X-Gitlab-Event') || '';

    return this.allowedOrigins.some(allowed => userAgent.includes(allowed) || origin.includes(allowed));
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(req, res) {
    try {
      const eventType = req.get('X-GitHub-Event') || req.get('X-Gitlab-Event') || 'unknown';
      const signature = req.get('X-Hub-Signature-256') || req.get('X-Hub-Signature') || req.get('X-Gitlab-Token');
      const deliveryId = req.get('X-GitHub-Delivery') || req.get('X-Gitlab-Event-UUID') || 'unknown';

      // Verify origin
      if (!this.verifyWebhookOrigin(req)) {
        logger.warn(`Webhook from unauthorized origin: ${req.get('User-Agent')}`);
        return res.status(403).json({ error: 'Unauthorized origin' });
      }

      // Get raw payload
      const rawPayload = JSON.stringify(req.body);

      // Verify signature if secret is configured
      if (this.webhookSecret && signature) {
        if (!this.verifyWebhookSignature(rawPayload, signature, this.webhookSecret)) {
          logger.warn(`Invalid webhook signature for event: ${eventType}`);
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      // Process the event
      const eventData = {
        eventType,
        deliveryId,
        timestamp: new Date().toISOString(),
        source: this.detectWebhookSource(req),
        payload: req.body
      };

      await this.handleWebhookEvent(eventType, eventData);

      // Record metrics
      if (this.server.metrics) {
        this.server.metrics.incrementWebhookEvents(eventType);
      }

      res.json({
        success: true,
        event: eventType,
        delivery: deliveryId,
        processed: true
      });

    } catch (error) {
      logger.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Detect webhook source (GitHub, GitLab, etc.)
   */
  detectWebhookSource(req) {
    const userAgent = req.get('User-Agent') || '';

    if (userAgent.includes('GitHub')) {
      return 'github';
    } else if (userAgent.includes('GitLab')) {
      return 'gitlab';
    } else if (userAgent.includes('Bitbucket')) {
      return 'bitbucket';
    }

    return 'unknown';
  }

  /**
   * Handle webhook event
   */
  async handleWebhookEvent(eventType, eventData) {
    const handler = this.eventHandlers.get(eventType);

    if (handler) {
      try {
        await handler(eventData);
      } catch (error) {
        logger.error(`Error handling ${eventType} event:`, error);
      }
    } else {
      logger.info(`No handler for event type: ${eventType}`);
    }
  }

  /**
   * Handle GitHub/GitLab push events
   */
  async handlePushEvent(eventData) {
    const { repository, ref, commits, pusher } = eventData.payload;

    if (!repository || !ref) {
      return;
    }

    // Extract repository path and branch
    const repoPath = this.extractRepositoryPath(repository);
    const branch = ref.replace('refs/heads/', '');

    // Process commits
    const commitDetails = commits?.map(commit => ({
      id: commit.id || commit.sha,
      message: commit.message,
      author: commit.author?.name || commit.commit?.author?.name,
      timestamp: commit.timestamp || commit.commit?.author?.date
    })) || [];

    // Create Git event for broadcasting
    const gitEvent = {
      type: 'push',
      repoPath,
      branch,
      commits: commitDetails,
      pusher: pusher?.name,
      repository: repository.full_name || repository.name,
      source: eventData.source
    };

    // Broadcast to WebSocket subscribers
    if (this.server.broadcastRepoEvent) {
      this.server.broadcastRepoEvent(repoPath, 'push_received', gitEvent);
    }

    logger.info(`Push event processed for ${repoPath}:${branch} (${commitDetails.length} commits)`);
  }

  /**
   * Handle GitHub pull request events
   */
  async handlePullRequestEvent(eventData) {
    const { action, pull_request, repository } = eventData.payload;

    if (!pull_request || !repository) {
      return;
    }

    const repoPath = this.extractRepositoryPath(repository);

    const prEvent = {
      type: 'pull_request',
      action,
      number: pull_request.number,
      title: pull_request.title,
      state: pull_request.state,
      repoPath,
      repository: repository.full_name || repository.name,
      source: eventData.source,
      url: pull_request.html_url
    };

    // Broadcast to WebSocket subscribers
    if (this.server.broadcastRepoEvent) {
      this.server.broadcastRepoEvent(repoPath, 'pull_request_updated', prEvent);
    }

    logger.info(`Pull request ${action} for ${repoPath}:${pull_request.number}`);
  }

  /**
   * Handle GitHub pull request review events
   */
  async handlePullRequestReviewEvent(eventData) {
    const { action, review, pull_request, repository } = eventData.payload;

    if (!review || !pull_request || !repository) {
      return;
    }

    const repoPath = this.extractRepositoryPath(repository);

    const reviewEvent = {
      type: 'pull_request_review',
      action,
      reviewState: review.state,
      reviewBody: review.body,
      prNumber: pull_request.number,
      repoPath,
      repository: repository.full_name || repository.name,
      source: eventData.source
    };

    // Broadcast to WebSocket subscribers
    if (this.server.broadcastRepoEvent) {
      this.server.broadcastRepoEvent(repoPath, 'pull_request_review_updated', reviewEvent);
    }
  }

  /**
   * Handle GitHub issues events
   */
  async handleIssuesEvent(eventData) {
    const { action, issue, repository } = eventData.payload;

    if (!issue || !repository) {
      return;
    }

    const repoPath = this.extractRepositoryPath(repository);

    const issueEvent = {
      type: 'issue',
      action,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      repoPath,
      repository: repository.full_name || repository.name,
      source: eventData.source
    };

    // Broadcast to WebSocket subscribers
    if (this.server.broadcastRepoEvent) {
      this.server.broadcastRepoEvent(repoPath, 'issue_updated', issueEvent);
    }
  }

  /**
   * Handle GitHub issue comment events
   */
  async handleIssueCommentEvent(eventData) {
    const { action, comment, issue, repository } = eventData.payload;

    if (!comment || !repository) {
      return;
    }

    const repoPath = this.extractRepositoryPath(repository);

    const commentEvent = {
      type: 'issue_comment',
      action,
      commentBody: comment.body,
      issueNumber: issue?.number,
      repoPath,
      repository: repository.full_name || repository.name,
      source: eventData.source
    };

    // Broadcast to WebSocket subscribers
    if (this.server.broadcastRepoEvent) {
      this.server.broadcastRepoEvent(repoPath, 'issue_comment_added', commentEvent);
    }
  }

  /**
   * Handle GitLab merge request events
   */
  async handleMergeRequestEvent(eventData) {
    const { object_attributes, project } = eventData.payload;

    if (!object_attributes || !project) {
      return;
    }

    const repoPath = project.path_with_namespace;

    const mrEvent = {
      type: 'merge_request',
      action: object_attributes.action,
      iid: object_attributes.iid,
      title: object_attributes.title,
      state: object_attributes.state,
      repoPath,
      repository: project.path_with_namespace,
      source: eventData.source,
      url: object_attributes.url
    };

    // Broadcast to WebSocket subscribers
    if (this.server.broadcastRepoEvent) {
      this.server.broadcastRepoEvent(repoPath, 'merge_request_updated', mrEvent);
    }
  }

  /**
   * Handle GitLab issue events
   */
  async handleIssueEvent(eventData) {
    const { object_attributes, project } = eventData.payload;

    if (!object_attributes || !project) {
      return;
    }

    const repoPath = project.path_with_namespace;

    const issueEvent = {
      type: 'issue',
      action: object_attributes.action,
      iid: object_attributes.iid,
      title: object_attributes.title,
      state: object_attributes.state,
      repoPath,
      repository: project.path_with_namespace,
      source: eventData.source
    };

    // Broadcast to WebSocket subscribers
    if (this.server.broadcastRepoEvent) {
      this.server.broadcastRepoEvent(repoPath, 'issue_updated', issueEvent);
    }
  }

  /**
   * Handle GitLab note events (comments)
   */
  async handleNoteEvent(eventData) {
    const { object_attributes, project } = eventData.payload;

    if (!object_attributes || !project) {
      return;
    }

    const repoPath = project.path_with_namespace;

    const noteEvent = {
      type: 'note',
      noteableType: object_attributes.noteable_type,
      noteBody: object_attributes.note,
      repoPath,
      repository: project.path_with_namespace,
      source: eventData.source
    };

    // Broadcast to WebSocket subscribers
    if (this.server.broadcastRepoEvent) {
      this.server.broadcastRepoEvent(repoPath, 'note_added', noteEvent);
    }
  }

  /**
   * Handle ping events
   */
  async handlePingEvent(eventData) {
    logger.info(`Ping received from ${eventData.source}`);

    // Respond to ping for webhook verification
    if (this.server.broadcastRepoEvent) {
      this.server.broadcastRepoEvent('*', 'ping_received', {
        source: eventData.source,
        timestamp: eventData.timestamp
      });
    }
  }

  /**
   * Extract repository path from webhook payload
   */
  extractRepositoryPath(repository) {
    if (repository.full_name) {
      return repository.full_name; // GitHub format: owner/repo
    } else if (repository.path_with_namespace) {
      return repository.path_with_namespace; // GitLab format: owner/repo
    } else if (repository.name) {
      return repository.name; // Fallback to just repo name
    }

    return 'unknown';
  }
}

/**
 * Webhook endpoint handler for Express
 */
export function createWebhookEndpoint(server, options = {}) {
  const webhooksService = new GitWebhooksService(server, options);

  return async (req, res) => {
    // Handle both GET (for webhook verification) and POST (for actual webhooks)
    if (req.method === 'GET') {
      // GitHub webhook verification
      if (req.query.hub.mode === 'subscribe' && req.query.hub.challenge) {
        logger.info('GitHub webhook verification successful');
        return res.send(req.query.hub.challenge);
      }

      // GitLab webhook verification
      if (req.query.token) {
        logger.info('GitLab webhook verification successful');
        return res.json({ status: 'ok' });
      }

      return res.status(400).json({ error: 'Invalid webhook verification' });
    }

    if (req.method === 'POST') {
      return await webhooksService.processWebhook(req, res);
    }

    res.status(405).json({ error: 'Method not allowed' });
  };
}
