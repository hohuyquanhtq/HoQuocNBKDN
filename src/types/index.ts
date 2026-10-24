export type UserRole = 'GV' | 'HS';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  email?: string;
  className?: string;
  phoneNumber?: string;
  passwordHash: string; // SHA-256 hash with salt
  createdAt: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export type DifficultyLevel = 'BIẾT' | 'HIỂU' | 'VẬN DỤNG' | 'VẬN DỤNG CAO' | 'CHƯA PHÂN LOẠI';

export interface MultipleChoiceOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface TrueFalseStatement {
  id: 'a' | 'b' | 'c' | 'd';
  text: string;
  correctAnswer?: boolean; // true = Đúng, false = Sai
  explanation?: string;
}

export interface BaseQuestion {
  id: string;
  code?: string; // Mã câu hỏi (e.g. CH-001)
  type: QuestionType;
  stem: string; // Câu dẫn
  level?: DifficultyLevel;
  topic?: string;
  grade?: number; // 10, 11, 12
  explanation?: string; // Lời giải chung
  createdAt: string;
  isDraft?: boolean;
  warnings?: string[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: MultipleChoiceOption[];
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  statements: TrueFalseStatement[];
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  correctAnswer?: string; // e.g. "0.5" or "33" or "NaOH"
  tolerance?: number; // sai số cho phép nếu là số (e.g. 0.01)
  acceptableAnswers?: string[];
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | ShortAnswerQuestion;

export interface Exam {
  id: string;
  title: string;
  description?: string;
  timeLimitMinutes: number; // 0 for unlimited
  totalPoints: number; // Default 10.0
  questions: Question[];
  createdAt: string;
  createdBy: string; // User ID of GV
  isPublished: boolean;
}

export interface StudentMultipleChoiceAnswer {
  questionId: string;
  type: 'multiple_choice';
  selectedOption?: 'A' | 'B' | 'C' | 'D';
}

export interface StudentTrueFalseAnswer {
  questionId: string;
  type: 'true_false';
  statements: Record<'a' | 'b' | 'c' | 'd', boolean | null>;
}

export interface StudentShortAnswer {
  questionId: string;
  type: 'short_answer';
  answerText: string;
}

export type StudentAnswer = StudentMultipleChoiceAnswer | StudentTrueFalseAnswer | StudentShortAnswer;

export interface QuestionGradingResult {
  questionId: string;
  type: QuestionType;
  maxPoints: number;
  earnedPoints: number;
  status: 'correct' | 'partially_correct' | 'incorrect' | 'unanswered';
  studentAnswer: any;
  correctAnswer: any;
  details?: {
    // for true_false
    statementResults?: Record<'a' | 'b' | 'c' | 'd', {
      student?: boolean | null;
      correct?: boolean;
      isMatch: boolean;
    }>;
    correctStatementsCount?: number;
  };
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentClass?: string;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  answers: Record<string, StudentAnswer>;
  flaggedQuestionIds: string[];
  totalScore: number;
  maxScore: number;
  correctCount: number;
  partiallyCorrectCount: number;
  incorrectCount: number;
  unansweredCount: number;
  questionResults: QuestionGradingResult[];
  questionsSnapshot: Question[]; // Snapshots so original exam questions at time of taking are preserved
}
