/**
 * Memory API Service - Client-side API wrapper
 * 
 * Handles API communication with the backend memory service
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiError {
  error: string;
  details?: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async migrate(data: any) {
    return this.request('/api/memory/migrate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recordMistake(userId: string, mistake: any) {
    return this.request('/api/memory/mistakes', {
      method: 'POST',
      body: JSON.stringify({ userId, ...mistake }),
    });
  }

  async getMistakes(userId: string, errorType?: string) {
    const params = new URLSearchParams({ userId });
    if (errorType) params.append('errorType', errorType);
    return this.request(`/api/memory/mistakes?${params}`);
  }

  async getCommonMistakes(userId: string) {
    return this.request(`/api/memory/mistakes/common?userId=${userId}`);
  }

  async getMistakeCount(userId: string, errorType: string) {
    const result = await this.request<{ count: number }>(`/api/memory/mistakes/count?userId=${userId}&errorType=${errorType}`);
    return result.count;
  }

  async analyzePatterns(userId: string, patterns: any[]) {
    return this.request('/api/memory/patterns', {
      method: 'POST',
      body: JSON.stringify({ userId, patterns }),
    });
  }

  async getPatterns(userId: string) {
    return this.request(`/api/memory/patterns?userId=${userId}`);
  }

  async getFavoritePatterns(userId: string) {
    return this.request(`/api/memory/patterns/favorite?userId=${userId}`);
  }

  async recordInteraction(userId: string, interaction: any) {
    return this.request('/api/memory/interactions', {
      method: 'POST',
      body: JSON.stringify({ userId, ...interaction }),
    });
  }

  async getRecentInteractions(userId: string, limit: number = 10) {
    return this.request(`/api/memory/interactions?userId=${userId}&limit=${limit}`);
  }

  async getInteractionsByType(userId: string, type: string) {
    return this.request(`/api/memory/interactions?userId=${userId}&type=${type}`);
  }

  async recordAngerChange(userId: string, level: number, trigger?: string) {
    return this.request('/api/memory/anger', {
      method: 'POST',
      body: JSON.stringify({ userId, level, trigger }),
    });
  }

  async getAngerStats(userId: string) {
    return this.request(`/api/memory/anger/stats?userId=${userId}`);
  }

  async getAngerHistory(userId: string, limit?: number) {
    const params = new URLSearchParams({ userId });
    if (limit) params.append('limit', limit.toString());
    return this.request(`/api/memory/anger/history?${params}`);
  }

  async getSummary(userId: string) {
    return this.request(`/api/memory/summary?userId=${userId}`);
  }

  async reset(userId: string) {
    return this.request('/api/memory/reset', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async cleanup(userId: string) {
    return this.request('/api/memory/cleanup', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }
}

export const apiClient = new ApiClient();

