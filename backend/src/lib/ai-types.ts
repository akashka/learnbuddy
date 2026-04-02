/**
 * Common types for AI responses with usage metadata
 */

export interface AIUsageMetadata {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

export interface AIResponse {
  text: string;
  usage?: AIUsageMetadata;
}

export interface AIJsonResponse<T> {
  data: T;
  usage?: AIUsageMetadata;
}
