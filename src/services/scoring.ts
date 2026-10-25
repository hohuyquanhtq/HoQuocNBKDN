import { Question, StudentAnswer, QuestionGradingResult, ExamSubmission, ScorePublishMode } from '../types/index.ts';

export interface ScoreReport {
  totalScore: number;
  maxScore: number;
  correctCount: number;
  partiallyCorrectCount: number;
  incorrectCount: number;
  unansweredCount: number;
  pendingManualCount: number;
  questionResults: QuestionGradingResult[];
}

export function gradeExam(
  questions: Question[],
  answers: Record<string, StudentAnswer>,
  targetTotalPoints: number = 10.0
): ScoreReport {
  if (questions.length === 0) {
    return {
      totalScore: 0,
      maxScore: targetTotalPoints,
      correctCount: 0,
      partiallyCorrectCount: 0,
      incorrectCount: 0,
      unansweredCount: 0,
      pendingManualCount: 0,
      questionResults: [],
    };
  }

  // Calculate points per question (equal distribution, total sums to targetTotalPoints)
  const pointsPerQuestion = targetTotalPoints / questions.length;

  let totalScore = 0;
  let correctCount = 0;
  let partiallyCorrectCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let pendingManualCount = 0;

  const questionResults: QuestionGradingResult[] = [];

  for (const q of questions) {
    const studentAns = answers[q.id];
    let earned = 0;
    let status: 'correct' | 'partially_correct' | 'incorrect' | 'unanswered' | 'pending_manual' = 'unanswered';
    let details: any = undefined;

    if (q.type === 'multiple_choice') {
      const selected = studentAns?.type === 'multiple_choice' ? studentAns.selectedOption : undefined;
      if (!selected) {
        status = 'unanswered';
        earned = 0;
        unansweredCount++;
      } else if (q.correctAnswer && selected.toUpperCase() === q.correctAnswer.toUpperCase()) {
        status = 'correct';
        earned = pointsPerQuestion;
        correctCount++;
      } else {
        status = 'incorrect';
        earned = 0;
        incorrectCount++;
      }

      questionResults.push({
        questionId: q.id,
        type: 'multiple_choice',
        maxPoints: pointsPerQuestion,
        earnedPoints: Math.round(earned * 100) / 100,
        status,
        studentAnswer: selected || null,
        correctAnswer: q.correctAnswer || null,
      });
    } else if (q.type === 'true_false') {
      const stMap = studentAns?.type === 'true_false' ? studentAns.statements : undefined;
      const labels: ('a' | 'b' | 'c' | 'd')[] = ['a', 'b', 'c', 'd'];

      let answeredCount = 0;
      let matchedCount = 0;
      const statementResults: Record<'a' | 'b' | 'c' | 'd', {
        student?: boolean | null;
        correct?: boolean;
        isMatch: boolean;
      }> = {} as any;

      for (const lbl of labels) {
        const stmt = q.statements.find(s => s.id === lbl);
        const stVal = stMap ? stMap[lbl] : null;
        if (stVal !== null && stVal !== undefined) {
          answeredCount++;
        }
        const isMatch = stmt?.correctAnswer !== undefined && stVal === stmt.correctAnswer;
        if (isMatch) {
          matchedCount++;
        }
        statementResults[lbl] = {
          student: stVal,
          correct: stmt?.correctAnswer,
          isMatch,
        };
      }

      if (answeredCount === 0) {
        status = 'unanswered';
        earned = 0;
        unansweredCount++;
      } else {
        // MOET 2025 Standard True/False grading formula:
        // 1 correct statement: 10%
        // 2 correct statements: 25%
        // 3 correct statements: 50%
        // 4 correct statements: 100%
        let factor = 0;
        if (matchedCount === 1) factor = 0.1;
        else if (matchedCount === 2) factor = 0.25;
        else if (matchedCount === 3) factor = 0.5;
        else if (matchedCount === 4) factor = 1.0;

        earned = pointsPerQuestion * factor;

        if (matchedCount === 4) {
          status = 'correct';
          correctCount++;
        } else if (matchedCount > 0) {
          status = 'partially_correct';
          partiallyCorrectCount++;
        } else {
          status = 'incorrect';
          incorrectCount++;
        }
      }

      details = {
        statementResults,
        correctStatementsCount: matchedCount,
      };

      questionResults.push({
        questionId: q.id,
        type: 'true_false',
        maxPoints: pointsPerQuestion,
        earnedPoints: Math.round(earned * 100) / 100,
        status,
        studentAnswer: stMap || null,
        correctAnswer: q.statements.map(s => ({ id: s.id, correct: s.correctAnswer })),
        details,
      });
    } else if (q.type === 'short_answer') {
      const textAns = studentAns?.type === 'short_answer' ? (studentAns.answerText || '').trim() : '';

      if (!textAns) {
        status = 'unanswered';
        earned = 0;
        unansweredCount++;
      } else if (!q.correctAnswer || q.requiresManualGrading) {
        // If question requires manual grading or has no key, mark as pending_manual
        status = 'pending_manual';
        earned = 0;
        pendingManualCount++;
      } else {
        const isCorrect = checkShortAnswer(textAns, q.correctAnswer || '', q.acceptableAnswers, q.tolerance);
        if (isCorrect) {
          status = 'correct';
          earned = pointsPerQuestion;
          correctCount++;
        } else {
          status = 'incorrect';
          earned = 0;
          incorrectCount++;
        }
      }

      questionResults.push({
        questionId: q.id,
        type: 'short_answer',
        maxPoints: pointsPerQuestion,
        earnedPoints: Math.round(earned * 100) / 100,
        status,
        studentAnswer: textAns || null,
        correctAnswer: q.correctAnswer || null,
        details: status === 'pending_manual' ? { notes: 'Chờ giáo viên chấm' } : undefined,
      });
    }

    totalScore += earned;
  }

  // Round total score to 2 decimal places
  const roundedTotal = Math.round(totalScore * 100) / 100;

  return {
    totalScore: Math.min(targetTotalPoints, Math.max(0, roundedTotal)),
    maxScore: targetTotalPoints,
    correctCount,
    partiallyCorrectCount,
    incorrectCount,
    unansweredCount,
    pendingManualCount,
    questionResults,
  };
}

export function checkShortAnswer(
  studentInput: string,
  correctAnswer: string,
  acceptableAnswers?: string[],
  tolerance?: number
): boolean {
  if (!studentInput || !studentInput.trim()) return false;
  if (!correctAnswer || !correctAnswer.trim()) return false;

  const normalize = (str: string) =>
    str
      .trim()
      .toLowerCase()
      .replace(/%/g, '')
      .replace(/,/g, '.')
      .replace(/\s+/g, '');

  const normStudent = normalize(studentInput);
  const normCorrect = normalize(correctAnswer);

  if (normStudent === normCorrect) return true;

  // Check acceptable answers list
  if (acceptableAnswers && acceptableAnswers.length > 0) {
    for (const alt of acceptableAnswers) {
      if (normalize(alt) === normStudent) return true;
    }
  }

  // Check numerical equivalence with tolerance
  const numStudent = parseFloat(normStudent);
  const numCorrect = parseFloat(normCorrect);

  if (!isNaN(numStudent) && !isNaN(numCorrect)) {
    const tol = tolerance !== undefined && tolerance >= 0 ? tolerance : 0.05;
    if (Math.abs(numStudent - numCorrect) <= tol) {
      return true;
    }
  }

  return false;
}

export function formatScore(score: number): string {
  if (isNaN(score)) return '0,00';
  return score.toFixed(2).replace('.', ',');
}

// Build complete submission object ready to persist
export function createSubmission(
  examId: string,
  examCode: string,
  examTitle: string,
  studentId: string,
  studentName: string,
  studentClass: string | undefined,
  startedAt: string,
  durationSeconds: number,
  questions: Question[],
  answers: Record<string, StudentAnswer>,
  flaggedQuestionIds: string[],
  totalPoints: number = 10.0,
  publishScoreMode: ScorePublishMode = 'immediately',
  allowReviewAfterSubmit: boolean = true
): ExamSubmission {
  const report = gradeExam(questions, answers, totalPoints);

  return {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    examId,
    examCode,
    examTitle,
    studentId,
    studentName,
    studentClass,
    startedAt,
    submittedAt: new Date().toISOString(),
    durationSeconds,
    answers,
    flaggedQuestionIds,
    totalScore: report.totalScore,
    maxScore: report.maxScore,
    correctCount: report.correctCount,
    partiallyCorrectCount: report.partiallyCorrectCount,
    incorrectCount: report.incorrectCount,
    unansweredCount: report.unansweredCount,
    pendingManualCount: report.pendingManualCount,
    questionResults: report.questionResults,
    questionsSnapshot: JSON.parse(JSON.stringify(questions)),
    publishScoreMode,
    allowReviewAfterSubmit,
  };
}

// Export student submissions to an Excel-compatible CSV file with UTF-8 BOM
export function exportSubmissionsToCsv(submissions: ExamSubmission[], examTitle: string): void {
  const headers = [
    'STT',
    'Mã bài thi',
    'Họ và tên học sinh',
    'Lớp',
    'Điểm số',
    'Thang điểm',
    'Số câu đúng',
    'Số câu đúng 1 phần',
    'Số câu sai',
    'Số câu chưa làm',
    'Thời gian làm (giây)',
    'Thời điểm nộp',
  ];

  const rows = submissions.map((sub, idx) => [
    idx + 1,
    `"${sub.examCode}"`,
    `"${sub.studentName.replace(/"/g, '""')}"`,
    `"${(sub.studentClass || '').replace(/"/g, '""')}"`,
    `"${formatScore(sub.totalScore)}"`,
    `"${formatScore(sub.maxScore)}"`,
    sub.correctCount,
    sub.partiallyCorrectCount,
    sub.incorrectCount,
    sub.unansweredCount,
    sub.durationSeconds,
    `"${new Date(sub.submittedAt).toLocaleString('vi-VN')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (examTitle || 'Ket_qua_thi').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `EduChem_${safeTitle}_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
