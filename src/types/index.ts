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
  requiresManualGrading?: boolean; // Đánh dấu cần giáo viên chấm nếu không thể đối chiếu tự động
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | ShortAnswerQuestion;

export type ExamStatus = 'draft' | 'open' | 'closed';
export type ScorePublishMode = 'immediately' | 'after_teacher_release';

export interface Exam {
  id: string;
  code: string; // Mã đề duy nhất (e.g. CHEM-9281)
  title: string;
  subject?: string; // Môn học (e.g. "Hóa học")
  topic?: string; // Chủ đề / Chuyên đề
  targetGrade?: string; // Lớp / Đối tượng (e.g. "Lớp 11", "Lớp 12")
  description?: string;
  timeLimitMinutes: number; // 0 for unlimited
  totalPoints: number; // Default 10.0
  questions: Question[];
  createdAt: string;
  createdBy: string; // User ID of GV
  isPublished: boolean;
  status: ExamStatus; // 'draft' | 'open' | 'closed'
  shuffleQuestions: boolean; // Xáo trộn câu hỏi
  shuffleOptions: boolean; // Xáo trộn phương án A,B,C,D
  publishScoreMode: ScorePublishMode; // Hiện điểm ngay sau khi nộp hoặc sau khi GV công bố
  allowReviewAfterSubmit: boolean; // Cho phép xem đáp án & hướng dẫn giải sau khi nộp
  startTime?: string; // Thời điểm bắt đầu nhận bài (ISO string)
  endTime?: string; // Thời điểm kết thúc nhận bài (ISO string)
  startedCount?: number; // Số học sinh đã bắt đầu
  submittedCount?: number; // Số học sinh đã nộp
}

export interface AutoExamCriteria {
  title: string;
  subject: string;
  topic: string;
  targetGrade: string;
  mcCount: number;
  tfCount: number;
  saCount: number;
  levelDistribution: {
    biet: number;
    hieu: number;
    vanDung: number;
    vanDungCao: number;
  };
  timeLimitMinutes: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  publishScoreMode: ScorePublishMode;
  allowReviewAfterSubmit: boolean;
  startTime?: string;
  endTime?: string;
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
  status: 'correct' | 'partially_correct' | 'incorrect' | 'unanswered' | 'pending_manual';
  studentAnswer: any;
  correctAnswer: any;
  teacherComment?: string;
  details?: {
    statementResults?: Record<'a' | 'b' | 'c' | 'd', {
      student?: boolean | null;
      correct?: boolean;
      isMatch: boolean;
    }>;
    correctStatementsCount?: number;
    notes?: string;
  };
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examCode: string; // Mã đề thi
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
  pendingManualCount?: number;
  questionResults: QuestionGradingResult[];
  questionsSnapshot: Question[]; // Snapshot của các câu hỏi tại thời điểm làm bài
  // Display policy snapshot from exam
  publishScoreMode: ScorePublishMode;
  allowReviewAfterSubmit: boolean;
}
