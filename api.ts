import { Quiz, ActiveAttempt, DashboardKPIs, Question, ParticipantRecord } from '../types';

const ADMIN_TOKEN_KEY = 'quizcraft_admin_token';
const ADMIN_USER_KEY = 'quizcraft_admin_username';

async function readApiJson<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(
      'The server returned a web page instead of API data. The /api route must be connected to the QuizCraft backend; static hosting alone cannot process admin requests.'
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error('The server returned an invalid response. Please check the QuizCraft backend.');
  }
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminAuth(token: string, username: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, username);
}

export function clearAdminAuth() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

export function getAdminUsername(): string | null {
  return localStorage.getItem(ADMIN_USER_KEY);
}

function adminHeaders() {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Public
  async getAvailableQuizzes(): Promise<{ quizzes: Quiz[] }> {
    const res = await fetch('/api/quizzes/available');
    if (!res.ok) throw new Error('Failed to load available quizzes');
    return readApiJson(res);
  },

  async checkEligibility(quizId: string, phone: string): Promise<{ eligible: boolean; message?: string; attemptId?: string; status?: string }> {
    const res = await fetch('/api/attempts/check-eligibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, phone })
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to check eligibility');
    return data;
  },

  async startAttempt(quizId: string, fullName: string, phone: string): Promise<{
    success: boolean;
    attemptId: string;
    quizTitle: string;
    durationMinutes: number;
    startedAt: number;
    deadlineAt: number;
    remainingSeconds: number;
    totalQuestions: number;
  }> {
    const res = await fetch('/api/attempts/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, fullName, phone })
    });
    const data = await readApiJson(res);
    if (!res.ok) {
      const err = new Error(data.error || 'Failed to start quiz');
      (err as any).code = data.code;
      (err as any).attemptId = data.attemptId;
      throw err;
    }
    return data;
  },

  async getAttempt(attemptId: string): Promise<ActiveAttempt> {
    const res = await fetch(`/api/attempts/${attemptId}`);
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to load attempt');
    return data;
  },

  async saveAnswer(attemptId: string, questionId: string, selectedOptionId: string | null): Promise<void> {
    const res = await fetch(`/api/attempts/${attemptId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, selectedOptionId })
    });
    if (!res.ok) {
      const data = await readApiJson(res);
      throw new Error(data.error || 'Failed to save answer');
    }
  },

  async submitAttempt(attemptId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to submit quiz');
    return data;
  },

  // Admin Auth
  async adminLogin(username: string, password: string): Promise<{ token: string; username: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async adminMe(): Promise<{ username: string }> {
    const res = await fetch('/api/admin/me', { headers: adminHeaders() });
    if (!res.ok) throw new Error('Unauthorized');
    return readApiJson(res);
  },

  async adminChangePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to change password');
    return data;
  },

  // Admin Quizzes
  async getAdminQuizzes(): Promise<{ quizzes: Quiz[] }> {
    const res = await fetch('/api/admin/quizzes', { headers: adminHeaders() });
    if (!res.ok) throw new Error('Failed to fetch quizzes');
    return readApiJson(res);
  },

  async getAdminQuiz(id: string): Promise<{ quiz: Quiz; bankQuestions: Question[] }> {
    const res = await fetch(`/api/admin/quizzes/${id}`, { headers: adminHeaders() });
    if (!res.ok) throw new Error('Failed to fetch quiz');
    return readApiJson(res);
  },

  async createQuiz(payload: any): Promise<{ quizId: string }> {
    const res = await fetch('/api/admin/quizzes', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to create quiz');
    return data;
  },

  async updateQuiz(id: string, payload: any): Promise<void> {
    const res = await fetch(`/api/admin/quizzes/${id}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to update quiz');
  },

  async duplicateQuiz(id: string): Promise<{ newQuizId: string }> {
    const res = await fetch(`/api/admin/quizzes/${id}/duplicate`, {
      method: 'POST',
      headers: adminHeaders()
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to duplicate quiz');
    return data;
  },

  async deleteQuiz(id: string): Promise<void> {
    const res = await fetch(`/api/admin/quizzes/${id}`, {
      method: 'DELETE',
      headers: adminHeaders()
    });
    if (!res.ok) {
      const data = await readApiJson(res);
      throw new Error(data.error || 'Failed to delete quiz');
    }
  },

  // Admin Questions
  async getAdminQuestions(params?: { search?: string; topic?: string; difficulty?: string }): Promise<{ questions: Question[]; topics: string[] }> {
    const qs = new URLSearchParams();
    if (params?.search) qs.append('search', params.search);
    if (params?.topic) qs.append('topic', params.topic);
    if (params?.difficulty) qs.append('difficulty', params.difficulty);

    const res = await fetch(`/api/admin/questions?${qs.toString()}`, { headers: adminHeaders() });
    if (!res.ok) throw new Error('Failed to fetch questions');
    return readApiJson(res);
  },

  async createQuestion(payload: any): Promise<{ questionId: string }> {
    const res = await fetch('/api/admin/questions', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to create question');
    return data;
  },

  async updateQuestion(id: string, payload: any): Promise<void> {
    const res = await fetch(`/api/admin/questions/${id}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to update question');
  },

  async deleteQuestion(id: string): Promise<void> {
    const res = await fetch(`/api/admin/questions/${id}`, {
      method: 'DELETE',
      headers: adminHeaders()
    });
    if (!res.ok) {
      const data = await readApiJson(res);
      throw new Error(data.error || 'Failed to delete question');
    }
  },

  async bulkImportQuestions(csvText: string): Promise<{ importedCount: number; errors: string[] }> {
    const res = await fetch('/api/admin/questions/bulk-import', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ csvText })
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || 'Bulk import failed');
    return data;
  },

  // Admin Participants
  async getAdminParticipants(params?: { search?: string; quizId?: string; status?: string }): Promise<{ participants: ParticipantRecord[] }> {
    const qs = new URLSearchParams();
    if (params?.search) qs.append('search', params.search);
    if (params?.quizId) qs.append('quizId', params.quizId);
    if (params?.status) qs.append('status', params.status);

    const res = await fetch(`/api/admin/participants?${qs.toString()}`, { headers: adminHeaders() });
    if (!res.ok) throw new Error('Failed to fetch participants');
    return readApiJson(res);
  },

  async getAttemptDetails(id: string): Promise<{ attempt: any; questions: any[] }> {
    const res = await fetch(`/api/admin/attempts/${id}`, { headers: adminHeaders() });
    if (!res.ok) throw new Error('Failed to fetch attempt details');
    return readApiJson(res);
  },

  async deleteAttempt(id: string): Promise<void> {
    const res = await fetch(`/api/admin/attempts/${id}`, {
      method: 'DELETE',
      headers: adminHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete attempt');
  },

  // Admin Reports
  async getReportsOverview(): Promise<{ kpis: DashboardKPIs; recentActivity: any[]; scoreDistribution: any[] }> {
    const res = await fetch('/api/admin/reports/overview', { headers: adminHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return readApiJson(res);
  },

  async getQuizReport(quizId: string): Promise<any> {
    const res = await fetch(`/api/admin/reports/quiz/${quizId}`, { headers: adminHeaders() });
    if (!res.ok) throw new Error('Failed to fetch quiz report');
    return readApiJson(res);
  }
};
