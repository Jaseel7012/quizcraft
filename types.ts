export interface Quiz {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  pass_mark: number;
  questions_per_attempt: number;
  negative_marking: number;
  is_published: number;
  start_date?: string | null;
  end_date?: string | null;
  show_results_immediately: number;
  shuffle_options: number;
  created_at: number;
  updated_at: number;
  question_bank_count?: number;
  total_attempts?: number;
  completed_attempts?: number;
  avg_score?: number | null;
  max_score?: number | null;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_key: 'A' | 'B' | 'C' | 'D';
  option_text: string;
  is_correct?: number;
}

export interface Question {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  marks: number;
  explanation?: string;
  created_at: number;
  updated_at: number;
  options: QuestionOption[];
}

export interface AttemptQuestion {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  marks: number;
  display_order: number;
  selected_option_id: string | null;
  options: {
    id: string;
    question_id: string;
    option_key: 'A' | 'B' | 'C' | 'D';
    option_text: string;
    is_correct?: number;
  }[];
  explanation?: string;
  is_correct?: number;
  score_awarded?: number;
}

export interface ActiveAttempt {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  status: 'in-progress' | 'submitted' | 'timed-out';
  startedAt: number;
  deadlineAt: number;
  remainingSeconds: number;
  showResultsImmediately: boolean;
  questions: AttemptQuestion[];
}

export interface QuizResultData {
  attemptId: string;
  quizTitle: string;
  status: 'submitted' | 'timed-out';
  score: number;
  totalPossibleScore: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  showResultsImmediately: boolean;
  review?: AttemptQuestion[];
}

export interface ParticipantRecord {
  attempt_id: string;
  status: 'in-progress' | 'submitted' | 'timed-out';
  started_at: number;
  deadline_at: number;
  submitted_at: number | null;
  score: number;
  total_possible_score: number;
  percentage: number;
  passed: number;
  participant_id: string;
  full_name: string;
  normalized_phone: string;
  quiz_id: string;
  quiz_title: string;
  duration_minutes: number;
  duration_seconds: number;
}

export interface DashboardKPIs {
  totalQuizzes: number;
  publishedQuizzes: number;
  totalParticipants: number;
  totalAttempts: number;
  avgScore: number;
  maxScore: number;
  avgPercentage: number;
  avgCompletionSeconds: number;
  passedCount: number;
  failedCount: number;
}
