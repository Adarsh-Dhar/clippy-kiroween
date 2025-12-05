/**
 * Memory API Service - Client-side API wrapper
 * 
 * Handles API communication with the backend memory service
 */

import type {
  MistakeRecord,
  CodePattern,
  InteractionRecord,
  AngerEvent,
  AngerStats,
} from '../types/memory';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiError {
  error: string;
  category?: string;
  message?: string;
  hint?: string;
  details?: {
    timestamp?: string;
    databaseUrlSet?: boolean;
    databaseUrlMasked?: string;
    originalError?: string;
  };
}

interface SuccessResponse {
  success: boolean;
}

interface MigrationData {
  userId: string;
  mistakes?: MistakeRecord[];
  patterns?: CodePattern[];
  interactions?: InteractionRecord[];
  angerHistory?: AngerEvent[];
  angerStats?: AngerStats;
  createdAt?: number;
}

interface MigrationResponse extends SuccessResponse {
  recordsMigrated?: {
    mistakesMigrated: number;
    patternsMigrated: number;
    interactionsMigrated: number;
    angerEventsMigrated: number;
  };
}

interface MistakeInput {
  errorType: string;
  message: string;
  file: string;
  line: number;
}

interface PatternInput {
  name: string;
  description?: string;
  frequency: number;
  examples?: string[];
  lastSeen?: number;
}

interface InteractionInput {
  type: 'roast' | 'compliment' | 'help' | 'warning' | 'punishment';
  message: string;
  context?: {
    angerLevel?: number;
    errorCount?: number;
  };
}

interface MemorySummary {
  totalMistakes: number;
  commonMistakes: number;
  totalPatterns: number;
  totalInteractions: number;
  totalDeaths: number;
}

class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    fallbackValue?: T
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Handle 503 (Service Unavailable) gracefully - return fallback value
      if (response.status === 503) {
        // Extract detailed error information
        try {
          const errorData: ApiError = await response.json();
          
          // Log detailed diagnostics in development mode
          if (import.meta.env.DEV) {
            console.group(`🔴 Database Connection Error [${errorData.category || 'UNKNOWN'}]`);
            console.error('Message:', errorData.message || errorData.error);
            if (errorData.hint) {
              console.info('💡 Hint:', errorData.hint);
            }
            if (errorData.details) {
              console.debug('Details:', {
                timestamp: errorData.details.timestamp,
                databaseUrlSet: errorData.details.databaseUrlSet,
                databaseUrlMasked: errorData.details.databaseUrlMasked,
                originalError: errorData.details.originalError,
              });
            }
            console.groupEnd();
          }
        } catch {
          // If we can't parse the error, log the raw response
          if (import.meta.env.DEV) {
            console.warn('Database unavailable (503) - could not parse error details');
          }
        }
        
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
        // Default fallback for 503 errors
        return [] as unknown as T;
      }

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `API request failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error: unknown) {
      // Handle network errors or other failures gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isDatabaseError = errorMessage.includes('Database unavailable') || 
                              errorMessage.includes('503') ||
                              errorMessage.includes('Service Unavailable') ||
                              errorMessage.includes('Failed to fetch');
      
      if (isDatabaseError && fallbackValue !== undefined) {
        return fallbackValue;
      }
      
      // Re-throw non-database errors
      throw error;
    }
  }

  async migrate(data: MigrationData): Promise<MigrationResponse> {
    return this.request<MigrationResponse>('/api/memory/migrate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recordMistake(userId: string, mistake: MistakeInput): Promise<SuccessResponse> {
    return this.request<SuccessResponse>(
      '/api/memory/mistakes',
      {
        method: 'POST',
        body: JSON.stringify({ userId, ...mistake }),
      },
      { success: true }
    );
  }

  async getMistakes(userId: string, errorType?: string): Promise<MistakeRecord[]> {
    const params = new URLSearchParams({ userId });
    if (errorType) params.append('errorType', errorType);
    return this.request<MistakeRecord[]>(`/api/memory/mistakes?${params}`, {}, []);
  }

  async getCommonMistakes(userId: string): Promise<MistakeRecord[]> {
    return this.request<MistakeRecord[]>(`/api/memory/mistakes/common?userId=${userId}`, {}, []);
  }

  async getMistakeCount(userId: string, errorType: string) {
    const result = await this.request<{ count: number }>(
      `/api/memory/mistakes/count?userId=${userId}&errorType=${errorType}`,
      {},
      { count: 0 }
    );
    return result.count;
  }

  async analyzePatterns(userId: string, patterns: PatternInput[]): Promise<SuccessResponse> {
    return this.request<SuccessResponse>(
      '/api/memory/patterns',
      {
        method: 'POST',
        body: JSON.stringify({ userId, patterns }),
      },
      { success: true }
    );
  }

  async getPatterns(userId: string): Promise<CodePattern[]> {
    return this.request<CodePattern[]>(`/api/memory/patterns?userId=${userId}`, {}, []);
  }

  async getFavoritePatterns(userId: string): Promise<CodePattern[]> {
    return this.request<CodePattern[]>(`/api/memory/patterns/favorite?userId=${userId}`, {}, []);
  }

  async recordInteraction(userId: string, interaction: InteractionInput): Promise<SuccessResponse> {
    return this.request<SuccessResponse>(
      '/api/memory/interactions',
      {
        method: 'POST',
        body: JSON.stringify({ userId, ...interaction }),
      },
      { success: true }
    );
  }

  async getRecentInteractions(userId: string, limit: number = 10): Promise<InteractionRecord[]> {
    return this.request<InteractionRecord[]>(`/api/memory/interactions?userId=${userId}&limit=${limit}`, {}, []);
  }

  async getInteractionsByType(userId: string, type: string): Promise<InteractionRecord[]> {
    return this.request<InteractionRecord[]>(`/api/memory/interactions?userId=${userId}&type=${type}`, {}, []);
  }

  async recordAngerChange(userId: string, level: number, trigger?: string): Promise<SuccessResponse> {
    return this.request<SuccessResponse>(
      '/api/memory/anger',
      {
        method: 'POST',
        body: JSON.stringify({ userId, level, trigger }),
      },
      { success: true }
    );
  }

  async getAngerStats(userId: string): Promise<AngerStats> {
    return this.request<AngerStats>(
      `/api/memory/anger/stats?userId=${userId}`,
      {},
      {
        totalDeaths: 0,
        highestLevel: 0,
        averageLevel: 0,
        levelCounts: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        timeAtLevel: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }
    );
  }

  async getAngerHistory(userId: string, limit?: number): Promise<AngerEvent[]> {
    const params = new URLSearchParams({ userId });
    if (limit) params.append('limit', limit.toString());
    return this.request<AngerEvent[]>(`/api/memory/anger/history?${params}`, {}, []);
  }

  async getSummary(userId: string): Promise<MemorySummary> {
    return this.request<MemorySummary>(
      `/api/memory/summary?userId=${userId}`,
      {},
      {
        totalMistakes: 0,
        commonMistakes: 0,
        totalPatterns: 0,
        totalInteractions: 0,
        totalDeaths: 0,
      }
    );
  }

  async reset(userId: string): Promise<SuccessResponse> {
    return this.request<SuccessResponse>(
      '/api/memory/reset',
      {
        method: 'POST',
        body: JSON.stringify({ userId }),
      },
      { success: true }
    );
  }

  async cleanup(userId: string): Promise<SuccessResponse> {
    return this.request<SuccessResponse>(
      '/api/memory/cleanup',
      {
        method: 'POST',
        body: JSON.stringify({ userId }),
      },
      { success: true }
    );
  }

  /**
   * Get detailed database health diagnostics
   */
  async getDatabaseHealth(): Promise<{
    healthy: boolean;
    category?: string;
    error?: string;
    message?: string;
    hint?: string;
    details?: {
      timestamp?: string;
      databaseUrlSet?: boolean;
      databaseUrlMasked?: string;
      originalError?: string;
    };
  }> {
    try {
      return await this.request<{
        healthy: boolean;
        category?: string;
        error?: string;
        message?: string;
        hint?: string;
        details?: {
          timestamp?: string;
          databaseUrlSet?: boolean;
          databaseUrlMasked?: string;
          originalError?: string;
        };
      }>('/api/memory/health', {}, {
        healthy: false,
        category: 'NETWORK_ERROR',
        error: 'Could not reach health check endpoint',
        hint: 'Check if server is running',
      });
    } catch (error) {
      return {
        healthy: false,
        category: 'NETWORK_ERROR',
        error: error instanceof Error ? error.message : String(error),
        hint: 'Failed to check database health',
      };
    }
  }
}

export const apiClient = new ApiClient();

