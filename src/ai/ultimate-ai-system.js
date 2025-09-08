/**
 * NEXUS IDE - Ultimate AI System
 * ระบบ AI ที่เทพที่สุดสำหรับการพัฒนาในหลายรูปแบบ
 * เชื่อมต่อกับ MCP Servers และ Git Memory
 */

const axios = require('axios');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class UltimateAISystem extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      apiGatewayUrl: config.apiGatewayUrl || 'http://localhost:8080',
      gitMemoryUrl: config.gitMemoryUrl || 'http://localhost:3001',
      wsUrl: config.wsUrl || 'ws://localhost:8081',
      maxConcurrentRequests: config.maxConcurrentRequests || 100,
      aiModels: config.aiModels || [
        'gpt-4-turbo',
        'claude-3-opus',
        'gemini-pro',
        'llama-3-70b',
        'codellama-34b',
        'deepseek-coder',
        'starcoder2-15b'
      ],
      specializedAIs: {
        codeGeneration: ['codellama-34b', 'deepseek-coder', 'starcoder2-15b'],
        codeReview: ['gpt-4-turbo', 'claude-3-opus'],
        debugging: ['gpt-4-turbo', 'deepseek-coder'],
        documentation: ['claude-3-opus', 'gemini-pro'],
        testing: ['gpt-4-turbo', 'codellama-34b'],
        refactoring: ['claude-3-opus', 'deepseek-coder'],
        architecture: ['gpt-4-turbo', 'claude-3-opus', 'gemini-pro'],
        security: ['gpt-4-turbo', 'claude-3-opus'],
        performance: ['deepseek-coder', 'llama-3-70b'],
        database: ['gpt-4-turbo', 'claude-3-opus']
      },
      ...config
    };
    
    this.mcpConnections = new Map();
    this.aiModelPool = new Map();
    this.contextMemory = new Map();
    this.learningData = new Map();
    this.activeRequests = new Set();
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      modelUsage: new Map()
    };
    
    this.initialize();
  }

  async initialize() {
    console.log('🚀 Initializing Ultimate AI System...');
    
    try {
      // เชื่อมต่อกับ API Gateway
      await this.connectToAPIGateway();
      
      // เชื่อมต่อกับ Git Memory
      await this.connectToGitMemory();
      
      // เชื่อมต่อกับ MCP Servers
      await this.connectToMCPServers();
      
      // เริ่มต้น AI Models
      await this.initializeAIModels();
      
      // โหลดข้อมูลการเรียนรู้
      await this.loadLearningData();
      
      // เริ่มต้น WebSocket สำหรับ real-time communication
      await this.initializeWebSocket();
      
      console.log('✅ Ultimate AI System initialized successfully!');
      this.emit('initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Ultimate AI System:', error);
      this.emit('error', error);
    }
  }

  async connectToAPIGateway() {
    console.log('🔌 Connecting to API Gateway...');
    try {
      const response = await axios.get(`${this.config.apiGatewayUrl}/health`);
      console.log('✅ Connected to API Gateway:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to API Gateway:', error.message);
      throw error;
    }
  }

  async connectToGitMemory() {
    console.log('🔌 Connecting to Git Memory...');
    try {
      const response = await axios.get(`${this.config.gitMemoryUrl}/api/status`);
      console.log('✅ Connected to Git Memory:', response.data);
      return true;
    } catch (error) {
      console.warn('⚠️  Git Memory connection failed, continuing without it:', error.message);
      return false;
    }
  }

  async connectToMCPServers() {
    console.log('🔌 Connecting to MCP Servers...');
    try {
      const response = await axios.get(`${this.config.apiGatewayUrl}/api/mcp/servers`);
      const servers = response.data.servers || [];
      
      for (const server of servers) {
        this.mcpConnections.set(server.id, {
          id: server.id,
          name: server.name,
          capabilities: server.capabilities,
          status: 'connected',
          lastUsed: Date.now()
        });
      }
      
      console.log(`✅ Connected to ${servers.length} MCP Servers`);
      return servers.length;
    } catch (error) {
      console.warn('⚠️  MCP Servers connection failed:', error.message);
      return 0;
    }
  }

  async initializeAIModels() {
    console.log('🤖 Initializing AI Models...');
    
    for (const model of this.config.aiModels) {
      this.aiModelPool.set(model, {
        name: model,
        status: 'ready',
        usage: 0,
        averageResponseTime: 0,
        specializations: this.getModelSpecializations(model),
        lastUsed: 0
      });
    }
    
    console.log(`✅ Initialized ${this.config.aiModels.length} AI Models`);
  }

  getModelSpecializations(model) {
    const specializations = [];
    for (const [specialty, models] of Object.entries(this.config.specializedAIs)) {
      if (models.includes(model)) {
        specializations.push(specialty);
      }
    }
    return specializations;
  }

  async loadLearningData() {
    console.log('📚 Loading learning data...');
    try {
      const dataPath = path.join(__dirname, '../../data/ai-learning-data.json');
      const data = await fs.readFile(dataPath, 'utf8');
      const learningData = JSON.parse(data);
      
      for (const [key, value] of Object.entries(learningData)) {
        this.learningData.set(key, value);
      }
      
      console.log(`✅ Loaded ${this.learningData.size} learning data entries`);
    } catch (error) {
      console.log('📚 No existing learning data found, starting fresh');
    }
  }

  async initializeWebSocket() {
    console.log('🔌 Initializing WebSocket connection...');
    try {
      this.ws = new WebSocket(this.config.wsUrl);
      
      this.ws.on('open', () => {
        console.log('✅ WebSocket connected');
        this.emit('websocket-connected');
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      });
      
      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
      
    } catch (error) {
      console.warn('⚠️  WebSocket initialization failed:', error.message);
    }
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'ai-request':
        this.handleAIRequest(message.data);
        break;
      case 'context-update':
        this.updateContext(message.data);
        break;
      case 'learning-feedback':
        this.processFeedback(message.data);
        break;
      default:
        console.log('📨 Unknown WebSocket message type:', message.type);
    }
  }

  // ========== AI Request Handling ==========

  async processAIRequest(request) {
    const requestId = this.generateRequestId();
    this.activeRequests.add(requestId);
    
    try {
      console.log(`🤖 Processing AI request: ${request.type}`);
      
      // เลือก AI model ที่เหมาะสมที่สุด
      const selectedModel = await this.selectBestModel(request);
      
      // รวบรวม context จาก MCP servers และ Git Memory
      const context = await this.gatherContext(request);
      
      // ประมวลผลคำขอด้วย AI
      const result = await this.executeAIRequest(selectedModel, request, context);
      
      // บันทึกผลลัพธ์และเรียนรู้
      await this.recordResult(request, result, selectedModel);
      
      this.activeRequests.delete(requestId);
      return result;
      
    } catch (error) {
      console.error(`❌ AI request failed:`, error);
      this.activeRequests.delete(requestId);
      throw error;
    }
  }

  async selectBestModel(request) {
    const requestType = request.type;
    const availableModels = this.config.specializedAIs[requestType] || this.config.aiModels;
    
    // เลือกโมเดลตามประสิทธิภาพและความเหมาะสม
    let bestModel = availableModels[0];
    let bestScore = 0;
    
    for (const model of availableModels) {
      const modelInfo = this.aiModelPool.get(model);
      if (!modelInfo || modelInfo.status !== 'ready') continue;
      
      // คำนวณคะแนนตามหลายปัจจัย
      const score = this.calculateModelScore(modelInfo, request);
      
      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }
    
    console.log(`🎯 Selected model: ${bestModel} (score: ${bestScore.toFixed(2)})`);
    return bestModel;
  }

  calculateModelScore(modelInfo, request) {
    let score = 100; // Base score
    
    // ลดคะแนนตาม usage (load balancing)
    score -= modelInfo.usage * 0.1;
    
    // เพิ่มคะแนนถ้าเป็น specialization
    if (modelInfo.specializations.includes(request.type)) {
      score += 50;
    }
    
    // ลดคะแนนตาม response time
    score -= modelInfo.averageResponseTime * 0.01;
    
    // เพิ่มคะแนนถ้าใช้งานล่าสุด (warm model)
    const timeSinceLastUse = Date.now() - modelInfo.lastUsed;
    if (timeSinceLastUse < 60000) { // 1 minute
      score += 20;
    }
    
    return Math.max(0, score);
  }

  async gatherContext(request) {
    console.log('📊 Gathering context from all sources...');
    const context = {
      project: {},
      git: {},
      mcp: {},
      user: {},
      history: []
    };
    
    try {
      // รวบรวมข้อมูลจาก Git Memory
      if (request.projectPath) {
        context.git = await this.getGitContext(request.projectPath);
      }
      
      // รวบรวมข้อมูลจาก MCP Servers
      context.mcp = await this.getMCPContext(request);
      
      // รวบรวมข้อมูล user context
      context.user = await this.getUserContext(request.userId);
      
      // รวบรวมประวัติการสนทนา
      context.history = await this.getConversationHistory(request.sessionId);
      
      console.log('✅ Context gathered successfully');
      return context;
      
    } catch (error) {
      console.warn('⚠️  Failed to gather some context:', error.message);
      return context;
    }
  }

  async getGitContext(projectPath) {
    try {
      const response = await axios.post(`${this.config.gitMemoryUrl}/api/analyze`, {
        path: projectPath,
        includeHistory: true,
        includeDiff: true
      });
      return response.data;
    } catch (error) {
      console.warn('⚠️  Failed to get Git context:', error.message);
      return {};
    }
  }

  async getMCPContext(request) {
    const mcpData = {};
    
    for (const [serverId, serverInfo] of this.mcpConnections) {
      try {
        const response = await axios.post(`${this.config.apiGatewayUrl}/api/mcp/query`, {
          serverId,
          query: request.query || request.content,
          context: request.context
        });
        
        mcpData[serverId] = response.data;
      } catch (error) {
        console.warn(`⚠️  Failed to get context from MCP server ${serverId}:`, error.message);
      }
    }
    
    return mcpData;
  }

  async getUserContext(userId) {
    if (!userId) return {};
    
    return this.contextMemory.get(`user:${userId}`) || {};
  }

  async getConversationHistory(sessionId) {
    if (!sessionId) return [];
    
    return this.contextMemory.get(`session:${sessionId}`) || [];
  }

  async executeAIRequest(model, request, context) {
    const startTime = Date.now();
    
    try {
      // สร้าง prompt ที่ครบถ้วนและมี context
      const enhancedPrompt = await this.createEnhancedPrompt(request, context);
      
      // ส่งคำขอไปยัง AI model
      const response = await this.callAIModel(model, enhancedPrompt, request);
      
      // ประมวลผลและปรับปรุงผลลัพธ์
      const processedResult = await this.processAIResponse(response, request, context);
      
      const responseTime = Date.now() - startTime;
      
      // อัปเดตสถิติ
      this.updateModelStats(model, responseTime, true);
      
      return {
        success: true,
        result: processedResult,
        model: model,
        responseTime: responseTime,
        context: context
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateModelStats(model, responseTime, false);
      throw error;
    }
  }

  async createEnhancedPrompt(request, context) {
    let prompt = `
# NEXUS IDE - Ultimate AI Assistant

## Request Type: ${request.type}
## User Query: ${request.content || request.query}

## Project Context:
${JSON.stringify(context.project, null, 2)}

## Git Context:
${JSON.stringify(context.git, null, 2)}

## MCP Data:
${JSON.stringify(context.mcp, null, 2)}

## User Preferences:
${JSON.stringify(context.user, null, 2)}

## Conversation History:
${context.history.slice(-5).map(h => `- ${h.role}: ${h.content}`).join('\n')}

## Instructions:
You are the ultimate AI assistant for NEXUS IDE. You have access to comprehensive project context, Git history, and data from multiple MCP servers. Provide the most accurate, helpful, and contextually relevant response possible.

For code generation: Write clean, efficient, and well-documented code.
For debugging: Provide step-by-step analysis and solutions.
For architecture: Consider scalability, maintainability, and best practices.
For reviews: Be thorough but constructive.

Always explain your reasoning and provide actionable insights.
`;
    
    // เพิ่ม specialized instructions ตาม request type
    if (this.config.specializedAIs[request.type]) {
      prompt += await this.getSpecializedInstructions(request.type);
    }
    
    return prompt;
  }

  async getSpecializedInstructions(type) {
    const instructions = {
      codeGeneration: `\n## Code Generation Guidelines:\n- Follow project's coding standards\n- Include comprehensive error handling\n- Add meaningful comments\n- Consider performance implications\n- Ensure type safety`,
      
      codeReview: `\n## Code Review Guidelines:\n- Check for security vulnerabilities\n- Verify performance implications\n- Ensure code maintainability\n- Validate error handling\n- Suggest improvements`,
      
      debugging: `\n## Debugging Guidelines:\n- Analyze error patterns\n- Check common pitfalls\n- Provide step-by-step solutions\n- Suggest prevention strategies\n- Include testing recommendations`,
      
      architecture: `\n## Architecture Guidelines:\n- Consider scalability requirements\n- Evaluate technology choices\n- Design for maintainability\n- Plan for future growth\n- Include security considerations`
    };
    
    return instructions[type] || '';
  }

  async callAIModel(model, prompt, request) {
    // ในการใช้งานจริง จะเชื่อมต่อกับ AI APIs ต่างๆ
    // ตอนนี้จะ simulate response
    
    console.log(`🤖 Calling AI model: ${model}`);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    return {
      model: model,
      response: `This is a simulated response from ${model} for request type: ${request.type}`,
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      tokens: Math.floor(Math.random() * 1000) + 100
    };
  }

  async processAIResponse(response, request, context) {
    // ประมวลผลและปรับปรุงผลลัพธ์จาก AI
    let processedResult = {
      content: response.response,
      model: response.model,
      confidence: response.confidence,
      suggestions: [],
      actions: [],
      metadata: {
        tokens: response.tokens,
        processingTime: Date.now()
      }
    };
    
    // เพิ่ม suggestions ตาม request type
    if (request.type === 'codeGeneration') {
      processedResult.suggestions = [
        'Consider adding unit tests',
        'Review error handling',
        'Check performance implications'
      ];
    }
    
    // เพิ่ม actions ที่สามารถทำได้
    processedResult.actions = [
      { type: 'save', label: 'Save to file' },
      { type: 'test', label: 'Run tests' },
      { type: 'review', label: 'Request review' }
    ];
    
    return processedResult;
  }

  updateModelStats(model, responseTime, success) {
    const modelInfo = this.aiModelPool.get(model);
    if (!modelInfo) return;
    
    modelInfo.usage++;
    modelInfo.lastUsed = Date.now();
    
    // อัปเดต average response time
    if (modelInfo.averageResponseTime === 0) {
      modelInfo.averageResponseTime = responseTime;
    } else {
      modelInfo.averageResponseTime = (modelInfo.averageResponseTime + responseTime) / 2;
    }
    
    // อัปเดต performance metrics
    this.performanceMetrics.totalRequests++;
    if (success) {
      this.performanceMetrics.successfulRequests++;
    }
    
    const currentUsage = this.performanceMetrics.modelUsage.get(model) || 0;
    this.performanceMetrics.modelUsage.set(model, currentUsage + 1);
  }

  async recordResult(request, result, model) {
    // บันทึกผลลัพธ์เพื่อการเรียนรู้
    const record = {
      timestamp: Date.now(),
      request: {
        type: request.type,
        content: request.content,
        userId: request.userId
      },
      result: {
        success: result.success,
        confidence: result.result.confidence,
        model: model
      }
    };
    
    // เก็บใน learning data
    const key = `${request.type}:${Date.now()}`;
    this.learningData.set(key, record);
    
    // บันทึกลงไฟล์ทุก 100 records
    if (this.learningData.size % 100 === 0) {
      await this.saveLearningData();
    }
  }

  async saveLearningData() {
    try {
      const dataPath = path.join(__dirname, '../../data/ai-learning-data.json');
      const data = Object.fromEntries(this.learningData);
      await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
      console.log('💾 Learning data saved');
    } catch (error) {
      console.error('❌ Failed to save learning data:', error);
    }
  }

  // ========== Public API Methods ==========

  async generateCode(request) {
    return this.processAIRequest({
      ...request,
      type: 'codeGeneration'
    });
  }

  async reviewCode(request) {
    return this.processAIRequest({
      ...request,
      type: 'codeReview'
    });
  }

  async debugCode(request) {
    return this.processAIRequest({
      ...request,
      type: 'debugging'
    });
  }

  async designArchitecture(request) {
    return this.processAIRequest({
      ...request,
      type: 'architecture'
    });
  }

  async generateTests(request) {
    return this.processAIRequest({
      ...request,
      type: 'testing'
    });
  }

  async refactorCode(request) {
    return this.processAIRequest({
      ...request,
      type: 'refactoring'
    });
  }

  async generateDocumentation(request) {
    return this.processAIRequest({
      ...request,
      type: 'documentation'
    });
  }

  async analyzePerformance(request) {
    return this.processAIRequest({
      ...request,
      type: 'performance'
    });
  }

  async analyzeSecurity(request) {
    return this.processAIRequest({
      ...request,
      type: 'security'
    });
  }

  async designDatabase(request) {
    return this.processAIRequest({
      ...request,
      type: 'database'
    });
  }

  // ========== Utility Methods ==========

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSystemStatus() {
    return {
      status: 'running',
      activeRequests: this.activeRequests.size,
      connectedMCPServers: this.mcpConnections.size,
      availableModels: Array.from(this.aiModelPool.keys()),
      performanceMetrics: this.performanceMetrics,
      uptime: process.uptime()
    };
  }

  async shutdown() {
    console.log('🛑 Shutting down Ultimate AI System...');
    
    // บันทึก learning data
    await this.saveLearningData();
    
    // ปิด WebSocket connection
    if (this.ws) {
      this.ws.close();
    }
    
    // รอให้ active requests เสร็จสิ้น
    while (this.activeRequests.size > 0) {
      console.log(`⏳ Waiting for ${this.activeRequests.size} active requests...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ Ultimate AI System shutdown complete');
    this.emit('shutdown');
  }
}

module.exports = UltimateAISystem;

// Export for testing
if (require.main === module) {
  const aiSystem = new UltimateAISystem();
  
  // Test the system
  setTimeout(async () => {
    try {
      console.log('\n🧪 Testing Ultimate AI System...');
      
      const testRequest = {
        type: 'codeGeneration',
        content: 'Create a React component for a todo list',
        userId: 'test-user',
        sessionId: 'test-session',
        projectPath: process.cwd()
      };
      
      const result = await aiSystem.generateCode(testRequest);
      console.log('\n✅ Test Result:', result);
      
      console.log('\n📊 System Status:', aiSystem.getSystemStatus());
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }, 5000);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    await aiSystem.shutdown();
    process.exit(0);
  });
}