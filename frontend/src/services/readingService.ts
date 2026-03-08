/**
 * Reading Service
 * Frontend API service for reading practice module
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionType =
  | 'multiple_choice'
  | 'multiple_choice_multiple'
  | 'matching_headings'
  | 'matching_information'
  | 'matching_features'
  | 'matching_sentence_endings'
  | 'sentence_completion'
  | 'summary_completion'
  | 'note_completion'
  | 'table_completion'
  | 'flow_chart_completion'
  | 'diagram_labelling'
  | 'short_answer'
  | 'true_false_not_given'
  | 'yes_no_not_given'
  | 'list_selection';

export type ExamType = 'Academic' | 'General';
export type Difficulty = 'Band 5-6' | 'Band 6-7' | 'Band 7-8' | 'Band 8-9';
export type SessionStatus = 'in-progress' | 'completed' | 'abandoned';

export interface Paragraph {
  id: string;
  content: string;
  text?: string; // Alias for compatibility
}

export interface ReadingPassage {
  title: string;
  content: string;
  topic: string;
  wordCount: number;
  paragraphs: Paragraph[];
  source?: string;
}

export interface ReadingQuestion {
  _id: string;
  id?: string;
  questionType: QuestionType;
  questionText: string;
  instructions?: string;
  options?: string[];
  correctAnswer?: string | string[];
  paragraphRef?: number;
  explanation?: string;
  userAnswer?: string | string[];
  isCorrect?: boolean;
}

export interface QuestionTypeAnalysis {
  type: string;
  attempted: number;
  correct: number;
  accuracy: number;
}

export interface ReadingFeedback {
  overallFeedback: string;
  overallAnalysis?: string;
  strengths: string[];
  areasToImprove: string[];
  weaknesses?: string[];
  studyTips: string[];
  recommendedPractice?: string[];
  questionTypeAnalysis: QuestionTypeAnalysis[];
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

export interface ReadingSession {
  _id: string;
  id?: string;
  examType: ExamType;
  difficulty: Difficulty;
  passage: ReadingPassage;
  questions: ReadingQuestion[];
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  bandScore?: number;
  timeLimit: number;
  timeRemaining?: number;
  timeSpent?: number;
  status: SessionStatus;
  feedback?: ReadingFeedback;
  startedAt: string;
  completedAt?: string;
  createdAt?: string;
}

export interface SessionSummary {
  id: string;
  examType: ExamType;
  difficulty: Difficulty;
  passageTitle: string;
  passageTopic: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  bandScore: number;
  timeLimit: number;
  timeSpent: number;
  status: SessionStatus;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface ReadingStats {
  totalSessions: number;
  avgBandScore: number;
  avgScore: number;
  avgTimeSpent: number;
  overallAccuracy: number;
  academicCount: number;
  generalCount: number;
  highestBand: number;
  lowestBand: number;
}

export interface RecentProgress {
  date: string;
  bandScore: number;
  score: number;
  examType: ExamType;
  difficulty: Difficulty;
  topic: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// API Response Types
export interface GenerateTestResponse {
  success: boolean;
  passage: ReadingPassage;
  questions: ReadingQuestion[];
  questionCount: number;
  timeLimit: number;
  usage?: AIUsage;
  error?: string;
}

export interface StartSessionResponse {
  success: boolean;
  session: ReadingSession;
  error?: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  questionId: string;
  answer: string | string[];
  error?: string;
}

export interface SubmitAllAnswersResponse {
  success: boolean;
  answersSubmitted: number;
  error?: string;
}

export interface CompleteSessionResponse {
  success: boolean;
  session: ReadingSession;
  error?: string;
}

export interface GetSessionResponse {
  success: boolean;
  session: ReadingSession;
  error?: string;
}

export interface GetSessionsResponse {
  success: boolean;
  sessions: SessionSummary[];
  pagination: Pagination;
  error?: string;
}

export interface GetStatsResponse {
  success: boolean;
  stats: ReadingStats;
  recentProgress: RecentProgress[];
  error?: string;
}

export interface DeleteSessionResponse {
  success: boolean;
  message: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE CLASS
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = (import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:4000/api';

class ReadingService {
  private baseUrl = '/reading';

  /**
   * Get auth token from localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${this.baseUrl}${endpoint}`;
    const token = this.getToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.error || 'Something went wrong');
      }

      return data as T;
    } catch (error: any) {
      console.error('Reading API request failed:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST GENERATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate a new reading test (passage + questions)
   */
  async generateTest(options: {
    examType: ExamType;
    topic?: string;
    difficulty?: Difficulty;
    questionCount?: number;
  }): Promise<GenerateTestResponse> {
    return this.request<GenerateTestResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start a new reading session
   */
  async startSession(data: {
    examType: ExamType;
    difficulty?: Difficulty;
    passage: ReadingPassage;
    questions: ReadingQuestion[];
    timeLimit?: number;
  }): Promise<StartSessionResponse> {
    return this.request<StartSessionResponse>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get a specific session
   */
  async getSession(sessionId: string): Promise<GetSessionResponse> {
    return this.request<GetSessionResponse>(`/sessions/${sessionId}`);
  }

  /**
   * Get all sessions with optional filters
   */
  async getSessions(options?: {
    status?: SessionStatus;
    examType?: ExamType;
    difficulty?: Difficulty;
    page?: number;
    limit?: number;
    sort?: 'asc' | 'desc';
    sortBy?: 'createdAt' | 'bandScore' | 'score';
  }): Promise<GetSessionsResponse> {
    const params = new URLSearchParams();

    if (options?.status) params.append('status', options.status);
    if (options?.examType) params.append('examType', options.examType);
    if (options?.difficulty) params.append('difficulty', options.difficulty);
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.sort) params.append('sort', options.sort);
    if (options?.sortBy) params.append('sortBy', options.sortBy);

    const queryString = params.toString();
    const endpoint = queryString ? `/sessions?${queryString}` : '/sessions';

    return this.request<GetSessionsResponse>(endpoint);
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<DeleteSessionResponse> {
    return this.request<DeleteSessionResponse>(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANSWER SUBMISSION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Submit a single answer
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    answer: string | string[]
  ): Promise<SubmitAnswerResponse> {
    return this.request<SubmitAnswerResponse>(`/sessions/${sessionId}/answer`, {
      method: 'PUT',
      body: JSON.stringify({ questionId, answer }),
    });
  }

  /**
   * Submit all answers at once
   */
  async submitAllAnswers(
    sessionId: string,
    answers: Record<string, string | string[]>,
    timeSpent?: number
  ): Promise<SubmitAllAnswersResponse> {
    return this.request<SubmitAllAnswersResponse>(`/sessions/${sessionId}/answers`, {
      method: 'PUT',
      body: JSON.stringify({ answers, timeSpent }),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SESSION COMPLETION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Complete session and get scores/feedback
   */
  async completeSession(
    sessionId: string,
    timeSpent?: number
  ): Promise<CompleteSessionResponse> {
    return this.request<CompleteSessionResponse>(`/sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ timeSpent }),
    });
  }

  /**
   * Abandon an in-progress session
   */
  async abandonSession(
    sessionId: string,
    timeSpent?: number
  ): Promise<DeleteSessionResponse> {
    return this.request<DeleteSessionResponse>(`/sessions/${sessionId}/abandon`, {
      method: 'PUT',
      body: JSON.stringify({ timeSpent }),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get user's reading statistics
   */
  async getStats(): Promise<GetStatsResponse> {
    return this.request<GetStatsResponse>('/stats');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calculate band score from raw score (for client-side preview)
   */
  calculateBandScore(correctAnswers: number, totalQuestions: number = 40): number {
    const normalized = Math.round((correctAnswers / totalQuestions) * 40);

    if (normalized >= 39) return 9.0;
    if (normalized >= 37) return 8.5;
    if (normalized >= 35) return 8.0;
    if (normalized >= 33) return 7.5;
    if (normalized >= 30) return 7.0;
    if (normalized >= 27) return 6.5;
    if (normalized >= 23) return 6.0;
    if (normalized >= 19) return 5.5;
    if (normalized >= 15) return 5.0;
    if (normalized >= 13) return 4.5;
    if (normalized >= 10) return 4.0;
    if (normalized >= 6) return 3.5;
    if (normalized >= 4) return 3.0;
    return 2.5;
  }

  /**
   * Get color for band score
   */
  getBandColor(band: number): string {
    if (band >= 8.0) return '#10B981'; // Green
    if (band >= 7.0) return '#3B82F6'; // Blue
    if (band >= 6.0) return '#F59E0B'; // Yellow/Orange
    if (band >= 5.0) return '#F97316'; // Orange
    return '#EF4444'; // Red
  }

  /**
   * Get description for band score
   */
  getBandDescription(band: number): string {
    if (band >= 9.0) return 'Expert User';
    if (band >= 8.0) return 'Very Good User';
    if (band >= 7.0) return 'Good User';
    if (band >= 6.0) return 'Competent User';
    if (band >= 5.0) return 'Modest User';
    if (band >= 4.0) return 'Limited User';
    return 'Extremely Limited User';
  }

  /**
   * Format time for display
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format time with labels
   */
  formatTimeWithLabels(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  }

  /**
   * Get question type display name
   */
  getQuestionTypeDisplayName(type: QuestionType): string {
    const names: Record<QuestionType, string> = {
      multiple_choice: 'Multiple Choice',
      multiple_choice_multiple: 'Multiple Choice (Multiple)',
      matching_headings: 'Matching Headings',
      matching_information: 'Matching Information',
      matching_features: 'Matching Features',
      matching_sentence_endings: 'Matching Sentence Endings',
      sentence_completion: 'Sentence Completion',
      summary_completion: 'Summary Completion',
      note_completion: 'Note Completion',
      table_completion: 'Table Completion',
      flow_chart_completion: 'Flow Chart Completion',
      diagram_labelling: 'Diagram Labelling',
      short_answer: 'Short Answer',
      true_false_not_given: 'True/False/Not Given',
      yes_no_not_given: 'Yes/No/Not Given',
      list_selection: 'List Selection',
    };
    return names[type] || type;
  }

  /**
   * Get difficulty color
   */
  getDifficultyColor(difficulty: Difficulty): string {
    switch (difficulty) {
      case 'Band 5-6':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Band 6-7':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Band 7-8':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Band 8-9':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  /**
   * Get status color
   */
  getStatusColor(status: SessionStatus): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'abandoned':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  /**
   * Check if a question requires text input
   */
  isTextInputQuestion(type: QuestionType): boolean {
    return [
      'sentence_completion',
      'summary_completion',
      'note_completion',
      'table_completion',
      'flow_chart_completion',
      'diagram_label_completion',
      'short_answer',
    ].includes(type);
  }

  /**
   * Check if a question is a matching type
   */
  isMatchingQuestion(type: QuestionType): boolean {
    return [
      'matching_headings',
      'matching_information',
      'matching_features',
      'matching_sentence_endings',
    ].includes(type);
  }

  /**
   * Check if a question is True/False/Not Given type
   */
  isTFNGQuestion(type: QuestionType): boolean {
    return ['true_false_not_given', 'yes_no_not_given'].includes(type);
  }

  /**
   * Get TFNG options
   */
  getTFNGOptions(type: QuestionType): string[] {
    if (type === 'true_false_not_given') {
      return ['TRUE', 'FALSE', 'NOT GIVEN'];
    }
    if (type === 'yes_no_not_given') {
      return ['YES', 'NO', 'NOT GIVEN'];
    }
    return [];
  }
}

// Export singleton instance
export const readingService = new ReadingService();
export default readingService;
