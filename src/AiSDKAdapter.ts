import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface AiSDKConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface AiRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  options?: Record<string, any>;
}

export interface AiResponse {
  id: string;
  text: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export class AiSDKAdapter {
  private config: AiSDKConfig;
  
  constructor(config: AiSDKConfig) {
    this.config = {
      timeout: 30000,
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
        ...config.headers
      }
    };
  }

  /**
   * Send a request to the AI model and get a response
   * @param request The AI request parameters
   * @returns Promise with AI response
   */
  async generateText(request: AiRequest): Promise<AiResponse> {
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/generate`,
        request,
        {
          headers: this.config.headers,
          timeout: this.config.timeout
        }
      );
      
      return {
        id: response.data.id || uuidv4(),
        text: response.data.text || response.data.content || response.data.completion || '',
        model: response.data.model,
        usage: response.data.usage,
        metadata: response.data.metadata
      };
    } catch (error) {
      console.error('Error generating text with AI SDK:', error);
      throw error;
    }
  }

  /**
   * Explain code using the AI model
   * @param code The code to explain
   * @param language The programming language
   * @returns Promise with explanation text
   */
  async explainCode(code: string, language: string): Promise<string> {
    const prompt = `Explain the following ${language} code in detail:\n\n${code}`;
    
    const response = await this.generateText({
      prompt,
      temperature: 0.3,
      maxTokens: 1000,
      options: { language }
    });
    
    return response.text;
  }

  /**
   * Generate code based on a description
   * @param description The code description
   * @param language The target programming language
   * @returns Promise with generated code
   */
  async generateCode(description: string, language: string): Promise<string> {
    const prompt = `Generate ${language} code for the following description:\n\n${description}`;
    
    const response = await this.generateText({
      prompt,
      temperature: 0.2,
      maxTokens: 1500,
      options: { language }
    });
    
    return response.text;
  }

  /**
   * Check if the AI service is available
   * @returns Promise with boolean indicating availability
   */
  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.config.baseUrl}/health`, {
        timeout: 5000,
        headers: this.config.headers
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}