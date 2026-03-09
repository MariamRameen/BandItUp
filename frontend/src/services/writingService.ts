/**
 * Writing Module API Service
 * 
 * Handles all API calls for the Writing Practice module
 */

const API_BASE_URL = (import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:4000/api';

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface WritingTask {
  prompt: string;
  essayType?: string;
  topic?: string;
  letterType?: string;
  visualDescription?: string;
  chartType?: string;
  keyPoints?: string[];
  sampleIdeas?: {
    position1: string[];
    position2: string[];
  };
  vocabularyHints?: string[];
  commonMistakes?: string[];
  bulletPoints?: string[];
  appropriateOpening?: string;
  appropriateClosing?: string;
}

export interface CriteriaScore {
  band: number;
  feedback: string;
}

export interface GrammarError {
  original: string;
  correction: string;
  explanation: string;
  errorType?: string;
}

export interface VocabSuggestion {
  original: string;
  upgrade: string;
  context: string;
}

export interface WritingEvaluation {
  overallBand: number;
  taskResponse: CriteriaScore;
  coherenceCohesion: CriteriaScore;
  lexicalResource: CriteriaScore;
  grammaticalRange: CriteriaScore;
  strengths: string[];
  improvements: string[];
}

export interface WritingSession {
  _id: string;
  id?: string;
  userId: string;
  taskType: 1 | 2;
  examType: 'Academic' | 'General';
  task: WritingTask;
  essay: string;
  wordCount: number;
  timeSpent?: number;
  evaluation?: WritingEvaluation;
  grammarErrors?: GrammarError[];
  vocabularySuggestions?: VocabSuggestion[];
  status: 'draft' | 'submitted' | 'evaluated';
  createdAt: string;
  updatedAt?: string;
  evaluatedAt?: string;
}

export interface WritingStats {
  totalSessions: number;
  avgOverallBand: number;
  avgTaskResponse: number;
  avgCoherenceCohesion: number;
  avgLexicalResource: number;
  avgGrammaticalRange: number;
  totalTimeSpent: number;
  avgWordCount: number;
  task1Count: number;
  task2Count: number;
}

export interface RecentProgress {
  date: string;
  band: number;
  taskType: 1 | 2;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

// API Response types
export interface GenerateTaskResponse {
  success: boolean;
  task: WritingTask;
  usage?: AIUsage;
  error?: string;
}

export interface CreateSessionResponse {
  success: boolean;
  session: WritingSession;
  error?: string;
}

export interface UpdateSessionResponse {
  success: boolean;
  session: Partial<WritingSession>;
  error?: string;
}

export interface SubmitEvaluationResponse {
  success: boolean;
  session: WritingSession;
  error?: string;
}

export interface GetSessionResponse {
  success: boolean;
  session: WritingSession;
  error?: string;
}

export interface GetSessionsResponse {
  success: boolean;
  sessions: WritingSession[];
  pagination: Pagination;
  error?: string;
}

export interface GetStatsResponse {
  success: boolean;
  stats: WritingStats;
  recentProgress: RecentProgress[];
  error?: string;
}

export interface GrammarAnalysisResponse {
  success: boolean;
  analysis: {
    errorCount: number;
    errors: GrammarError[];
    overallAssessment: string;
    grammarLevel: string;
  };
  usage?: AIUsage;
  error?: string;
}

export interface VocabAnalysisResponse {
  success: boolean;
  analysis: {
    currentLevel: string;
    estimatedBand: number;
    suggestions: VocabSuggestion[];
    collocations: Array<{
      used: string;
      better: string;
      example: string;
    }>;
    academicVocabulary: {
      present: string[];
      suggested: string[];
    };
    overallAssessment: string;
  };
  usage?: AIUsage;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Writing Service Class
// ─────────────────────────────────────────────────────────────────────────────

class WritingService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/writing${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.msg || 'Request failed');
      }

      return data;
    } catch (error: any) {
      console.error('Writing API request failed:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Task Generation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate a new writing task using AI
   */
  async generateTask(
    taskType: 1 | 2,
    examType: 'Academic' | 'General',
    options?: {
      topic?: string;
      essayType?: string;
      chartType?: string;
      letterType?: string;
    }
  ): Promise<GenerateTaskResponse> {
    return this.request<GenerateTaskResponse>('/generate-task', {
      method: 'POST',
      body: JSON.stringify({
        taskType,
        examType,
        options: options || {},
      }),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Session Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new writing session (start practice)
   */
  async createSession(
    taskType: 1 | 2,
    examType: 'Academic' | 'General',
    task: WritingTask,
    essay: string = ''
  ): Promise<CreateSessionResponse> {
    return this.request<CreateSessionResponse>('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        taskType,
        examType,
        task,
        essay,
      }),
    });
  }

  /**
   * Update a writing session (save draft)
   */
  async updateSession(
    sessionId: string,
    essay: string,
    timeSpent?: number
  ): Promise<UpdateSessionResponse> {
    return this.request<UpdateSessionResponse>(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({
        essay,
        timeSpent,
      }),
    });
  }

  /**
   * Submit essay for AI evaluation
   */
  async submitForEvaluation(
    sessionId: string,
    essay?: string,
    timeSpent?: number
  ): Promise<SubmitEvaluationResponse> {
    return this.request<SubmitEvaluationResponse>(
      `/sessions/${sessionId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({
          essay,
          timeSpent,
        }),
      }
    );
  }

  /**
   * Get a specific writing session
   */
  async getSession(sessionId: string): Promise<GetSessionResponse> {
    return this.request<GetSessionResponse>(`/sessions/${sessionId}`);
  }

  /**
   * Get all writing sessions for current user
   */
  async getSessions(
    options?: {
      status?: 'draft' | 'submitted' | 'evaluated';
      taskType?: 1 | 2;
      examType?: 'Academic' | 'General';
      limit?: number;
      page?: number;
    }
  ): Promise<GetSessionsResponse> {
    const params = new URLSearchParams();
    
    if (options?.status) params.append('status', options.status);
    if (options?.taskType) params.append('taskType', String(options.taskType));
    if (options?.examType) params.append('examType', options.examType);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.page) params.append('page', String(options.page));

    const queryString = params.toString();
    const endpoint = queryString ? `/sessions?${queryString}` : '/sessions';

    return this.request<GetSessionsResponse>(endpoint);
  }

  /**
   * Delete a writing session
   */
  async deleteSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get writing statistics for current user
   */
  async getStats(): Promise<GetStatsResponse> {
    return this.request<GetStatsResponse>('/stats');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Text Analysis
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Analyze text for grammar errors
   */
  async analyzeGrammar(text: string): Promise<GrammarAnalysisResponse> {
    return this.request<GrammarAnalysisResponse>('/analyze/grammar', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  /**
   * Analyze vocabulary and get suggested upgrades
   */
  async analyzeVocabulary(
    text: string,
    targetBand: number = 7
  ): Promise<VocabAnalysisResponse> {
    return this.request<VocabAnalysisResponse>('/analyze/vocabulary', {
      method: 'POST',
      body: JSON.stringify({ text, targetBand }),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Count words in text (same logic as backend)
   */
  countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  /**
   * Get time limit for task type (in seconds)
   */
  getTimeLimit(taskType: 1 | 2): number {
    return taskType === 1 ? 20 * 60 : 40 * 60; // 20 mins for Task 1, 40 mins for Task 2
  }

  /**
   * Get minimum word count for task type
   */
  getMinWords(taskType: 1 | 2): number {
    return taskType === 1 ? 150 : 250;
  }

  /**
   * Format time as MM:SS
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get band color for visual display
   */
  getBandColor(band: number): string {
    if (band >= 8) return '#22c55e'; // green-500
    if (band >= 7) return '#84cc16'; // lime-500
    if (band >= 6) return '#eab308'; // yellow-500
    if (band >= 5) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  }

  /**
   * Get band description
   */
  getBandDescription(band: number): string {
    if (band >= 9) return 'Expert';
    if (band >= 8) return 'Very Good';
    if (band >= 7) return 'Good';
    if (band >= 6) return 'Competent';
    if (band >= 5) return 'Modest';
    if (band >= 4) return 'Limited';
    return 'Basic';
  }
}

// Export singleton instance
export const writingService = new WritingService();
export default writingService;
