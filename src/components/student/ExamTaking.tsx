import React, { useState, useEffect, useRef } from 'react';
import { Exam, StudentAnswer, ExamSubmission, User, Question } from '../../types/index.ts';
import { ChemistryText } from '../ChemistryText.tsx';
import { createSubmission } from '../../services/scoring.ts';
import { incrementExamStarted } from '../../services/storage.ts';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  Bookmark,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  X,
  User as UserIcon,
  Check,
} from 'lucide-react';

interface ExamTakingProps {
  exam: Exam;
  currentUser: User | null;
  guestName?: string;
  guestClass?: string;
  onSubmitted: (submission: ExamSubmission) => void;
  onExit: () => void;
}

// Option colors for A, B, C, D (Section II.2: Mỗi phương án trắc nghiệm A, B, C, D có màu nền khác nhau nhưng hài hòa)
const OPTION_THEMES: Record<'A' | 'B' | 'C' | 'D', {
  bg: string;
  border: string;
  selectedBg: string;
  selectedBorder: string;
  badgeBg: string;
  badgeText: string;
  text: string;
}> = {
  A: {
    bg: 'bg-sky-50/70 hover:bg-sky-100/70',
    border: 'border-sky-200',
    selectedBg: 'bg-sky-100/90 shadow-md',
    selectedBorder: 'border-sky-500 ring-2 ring-sky-500/30',
    badgeBg: 'bg-sky-600 text-white',
    badgeText: 'text-sky-700',
    text: 'text-sky-950',
  },
  B: {
    bg: 'bg-emerald-50/70 hover:bg-emerald-100/70',
    border: 'border-emerald-200',
    selectedBg: 'bg-emerald-100/90 shadow-md',
    selectedBorder: 'border-emerald-500 ring-2 ring-emerald-500/30',
    badgeBg: 'bg-emerald-600 text-white',
    badgeText: 'text-emerald-700',
    text: 'text-emerald-950',
  },
  C: {
    bg: 'bg-indigo-50/70 hover:bg-indigo-100/70',
    border: 'border-indigo-200',
    selectedBg: 'bg-indigo-100/90 shadow-md',
    selectedBorder: 'border-indigo-500 ring-2 ring-indigo-500/30',
    badgeBg: 'bg-indigo-600 text-white',
    badgeText: 'text-indigo-700',
    text: 'text-indigo-950',
  },
  D: {
    bg: 'bg-amber-50/70 hover:bg-amber-100/70',
    border: 'border-amber-200',
    selectedBg: 'bg-amber-100/90 shadow-md',
    selectedBorder: 'border-amber-500 ring-2 ring-amber-500/30',
    badgeBg: 'bg-amber-600 text-white',
    badgeText: 'text-amber-700',
    text: 'text-amber-950',
  },
};

export const ExamTaking: React.FC<ExamTakingProps> = ({
  exam,
  currentUser,
  guestName,
  guestClass,
  onSubmitted,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student identifier
  const studentName = currentUser?.fullName || guestName || 'Học sinh';
  const studentClass = currentUser?.className || guestClass || '';
  const studentId = currentUser?.id || `guest-${Date.now()}`;

  // Session storage key to restore answers if student reloads page
  const draftKey = `educhem_draft_${exam.id}_${studentId}`;

  // Load questions (apply question order shuffle if enabled)
  const [questions, setQuestions] = useState<Question[]>(() => {
    let list = [...exam.questions];
    if (exam.shuffleQuestions) {
      list = list.sort(() => Math.random() - 0.5);
    }
    return list;
  });

  // Track started count on mount
  useEffect(() => {
    incrementExamStarted(exam.id);

    // Restore draft answers if available
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.flaggedIds) setFlaggedIds(parsed.flaggedIds);
      }
    } catch {}
  }, [exam.id]);

  // Persist draft on every answer change
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ answers, flaggedIds, updatedAt: Date.now() }));
    } catch {}
  }, [answers, flaggedIds]);

  // Timer
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    exam.timeLimitMinutes > 0 ? exam.timeLimitMinutes * 60 : null
  );

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  const currentQuestion = questions[currentIndex];

  // Initialize countdown timer
  useEffect(() => {
    if (exam.timeLimitMinutes > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Auto submit when time expires
            handleConfirmSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exam.timeLimitMinutes]);

  // Answer updater for Multiple Choice
  const handleSelectMC = (optId: 'A' | 'B' | 'C' | 'D') => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        type: 'multiple_choice',
        selectedOption: optId,
      },
    }));
  };

  // Answer updater for True/False
  const handleSelectTF = (statementId: 'a' | 'b' | 'c' | 'd', val: boolean) => {
    setAnswers(prev => {
      const existing = prev[currentQuestion.id];
      const existingMap =
        existing?.type === 'true_false'
          ? { ...existing.statements }
          : { a: null, b: null, c: null, d: null };

      existingMap[statementId] = val;

      return {
        ...prev,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          type: 'true_false',
          statements: existingMap,
        },
      };
    });
  };

  // Answer updater for Short Answer
  const handleShortAnswerChange = (val: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        type: 'short_answer',
        answerText: val,
      },
    }));
  };

  // Flag toggle
  const toggleFlag = (qId: string) => {
    setFlaggedIds(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  // Status calculation for each question
  const getQuestionStatus = (
    qId: string
  ): 'unanswered' | 'partially_answered' | 'completed' => {
    const q = questions.find(item => item.id === qId);
    if (!q) return 'unanswered';
    const ans = answers[qId];
    if (!ans) return 'unanswered';

    if (q.type === 'multiple_choice') {
      return ans.type === 'multiple_choice' && ans.selectedOption
        ? 'completed'
        : 'unanswered';
    }

    if (q.type === 'true_false') {
      if (ans.type !== 'true_false' || !ans.statements) return 'unanswered';
      const keys: ('a' | 'b' | 'c' | 'd')[] = ['a', 'b', 'c', 'd'];
      const values = keys.map(k => ans.statements[k]);
      const answeredCount = values.filter(v => v !== null && v !== undefined).length;
      if (answeredCount === 4) return 'completed';
      if (answeredCount > 0) return 'partially_answered';
      return 'unanswered';
    }

    if (q.type === 'short_answer') {
      return ans.type === 'short_answer' && ans.answerText && ans.answerText.trim()
        ? 'completed'
        : 'unanswered';
    }

    return 'unanswered';
  };

  // Submit Handler
  const handleConfirmSubmit = () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    const submission = createSubmission(
      exam.id,
      exam.code,
      exam.title,
      studentId,
      studentName,
      studentClass || undefined,
      new Date(startTimeRef.current).toISOString(),
      elapsedSeconds,
      questions,
      answers,
      flaggedIds,
      exam.totalPoints,
      exam.publishScoreMode,
      exam.allowReviewAfterSubmit
    );

    // Clean up draft
    try {
      localStorage.removeItem(draftKey);
    } catch {}

    setIsSubmitModalOpen(false);
    onSubmitted(submission);
  };

  // Count statistics for submit modal
  const completedCount = questions.filter(q => getQuestionStatus(q.id) === 'completed').length;
  const partialCount = questions.filter(q => getQuestionStatus(q.id) === 'partially_answered').length;
  const unansweredCount = questions.length - completedCount - partialCount;

  // Format timer
  const formatTimer = (sec: number | null) => {
    if (sec === null) return 'Không giới hạn';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeWarning = remainingSeconds !== null && remainingSeconds <= 180; // < 3 minutes

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      {/* Top Exam Header */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-4 z-30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Đang làm bài online
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Mã đề: <strong className="font-mono text-slate-800">{exam.code}</strong>
            </span>
            <span className="text-xs font-semibold text-slate-400">•</span>
            <span className="text-xs font-semibold text-emerald-700">
              Đã trả lời: <strong>{completedCount}/{questions.length}</strong> câu
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{exam.title}</h1>
          <p className="text-xs text-slate-500">
            Học sinh: <strong className="text-slate-800">{studentName}</strong>
            {studentClass && (
              <> • Lớp: <strong className="text-slate-800">{studentClass}</strong></>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {remainingSeconds !== null && (
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono font-bold text-sm ${
                isTimeWarning
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimeWarning ? 'text-rose-600' : 'text-emerald-600'}`} />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Nộp bài
          </button>
        </div>
      </div>

      {/* Main Single Question Display Area (Requirement: 22-26px font for question text on desktop) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-sm">
        {/* Question Sub-header & Review Flag */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-black text-base flex items-center justify-center shadow-xs">
              {currentIndex + 1}
            </span>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                {currentQuestion.type === 'multiple_choice'
                  ? 'Trắc nghiệm 4 lựa chọn'
                  : currentQuestion.type === 'true_false'
                  ? 'Chọn Đúng hoặc Sai cho mỗi phát biểu'
                  : 'Điền câu trả lời ngắn'}
              </span>
              <span className="text-[11px] text-slate-400">
                Mức độ: {currentQuestion.level || 'BIẾT'} • Điểm câu: {(exam.totalPoints / questions.length).toFixed(2)} đ
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleFlag(currentQuestion.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              flaggedIds.includes(currentQuestion.id)
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
            }`}
          >
            <Bookmark
              className={`w-3.5 h-3.5 ${
                flaggedIds.includes(currentQuestion.id) ? 'fill-amber-500 text-amber-500' : ''
              }`}
            />
            {flaggedIds.includes(currentQuestion.id) ? 'Đã đánh dấu xem lại' : 'Đánh dấu câu này'}
          </button>
        </div>

        {/* Question Stem: large readable font (22-26px on desktop as specified) */}
        <div className="text-xl md:text-2xl font-semibold text-slate-900 mb-8 leading-relaxed">
          <ChemistryText content={currentQuestion.stem} />
        </div>

        {/* Answer Options Area: Multiple Choice with harmonious distinct themes for A, B, C, D */}
        {currentQuestion.type === 'multiple_choice' && (
          <div className="space-y-3.5">
            {currentQuestion.options.map(opt => {
              const currentAns = answers[currentQuestion.id];
              const isSelected =
                currentAns?.type === 'multiple_choice' &&
                currentAns.selectedOption === opt.id;

              const theme = OPTION_THEMES[opt.id] || OPTION_THEMES.A;

              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectMC(opt.id)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    isSelected ? theme.selectedBg + ' ' + theme.selectedBorder : theme.bg + ' ' + theme.border
                  }`}
                >
                  {/* Option Badge */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-transform ${
                      isSelected ? theme.badgeBg + ' scale-105' : 'bg-white/80 border border-slate-300 ' + theme.badgeText
                    }`}
                  >
                    {opt.id}
                  </div>

                  {/* Option Text */}
                  <div className={`flex-1 text-base sm:text-lg font-medium pt-0.5 leading-relaxed ${theme.text}`}>
                    <ChemistryText content={opt.text} />
                  </div>

                  {/* Checked indicator */}
                  <div className="shrink-0 self-center">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white/50" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Answer Options Area: True / False with separate buttons per statement */}
        {currentQuestion.type === 'true_false' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 italic mb-2">
              (Học sinh chọn ĐÚNG hoặc SAI cho đầy đủ cả 4 phát biểu bên dưới)
            </p>
            {currentQuestion.statements.map(st => {
              const currentAns = answers[currentQuestion.id];
              const currentVal =
                currentAns?.type === 'true_false'
                  ? currentAns.statements[st.id]
                  : null;

              return (
                <div
                  key={st.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span className="font-extrabold text-slate-900 text-base shrink-0 w-6">
                      {st.id})
                    </span>
                    <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                      <ChemistryText content={st.text} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleSelectTF(st.id, true)}
                      className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all border ${
                        currentVal === true
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ĐÚNG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTF(st.id, false)}
                      className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all border ${
                        currentVal === false
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      SAI
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Answer Options Area: Short Answer with large text box */}
        {currentQuestion.type === 'short_answer' && (
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-800">
              Nhập câu trả lời của bạn:
            </label>
            <input
              type="text"
              value={
                answers[currentQuestion.id]?.type === 'short_answer'
                  ? (answers[currentQuestion.id] as any).answerText || ''
                  : ''
              }
              onChange={(e) => handleShortAnswerChange(e.target.value)}
              placeholder="Nhập giá trị số hoặc từ khóa (ví dụ: 33 hoặc 0,5)..."
              className="w-full sm:w-96 px-5 py-3.5 text-lg font-bold rounded-2xl border-2 border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            />
            <p className="text-xs text-slate-400">
              Hệ thống tự động chấp nhận cả dấu phẩy (,) và dấu chấm (.) đối với số thập phân.
            </p>
          </div>
        )}

        {/* Previous / Next buttons */}
        <div className="flex items-center justify-between gap-3 pt-8 mt-8 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            CÂU TRƯỚC
          </button>

          <span className="text-xs sm:text-sm font-bold text-slate-500">
            Câu {currentIndex + 1} / {questions.length}
          </span>

          <button
            type="button"
            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIndex === questions.length - 1}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            CÂU TIẾP THEO
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Palette (Thanh điều hướng câu hỏi) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Thanh điều hướng câu hỏi ({questions.length} câu)
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              Đã làm
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
              Làm một phần
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
              Chưa làm
            </span>
            <span className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Đã đánh dấu
            </span>
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2">
          {questions.map((q, idx) => {
            const status = getQuestionStatus(q.id);
            const isCurrent = idx === currentIndex;
            const isFlagged = flaggedIds.includes(q.id);

            let bgClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
            let borderClass = 'border-slate-200';

            if (status === 'completed') {
              bgClass = 'bg-emerald-500 text-white font-bold';
              borderClass = 'border-emerald-600';
            } else if (status === 'partially_answered') {
              bgClass = 'bg-amber-400 text-amber-950 font-bold';
              borderClass = 'border-amber-500';
            }

            if (isCurrent) {
              borderClass = 'ring-2 ring-slate-900 ring-offset-2';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-11 rounded-2xl border flex flex-col items-center justify-center text-xs font-bold transition-all ${bgClass} ${borderClass}`}
                title={`Câu ${idx + 1}`}
              >
                <span>{idx + 1}</span>
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7">
            <div className="flex items-center gap-3 text-slate-900 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Xác nhận nộp bài thi?</h3>
                <p className="text-xs text-slate-500">Mã đề: {exam.code}</p>
              </div>
            </div>

            {/* Warning summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 mb-5">
              <div className="flex justify-between text-slate-700">
                <span>Tổng số câu hỏi:</span>
                <strong>{questions.length} câu</strong>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Đã trả lời đầy đủ:</span>
                <strong>{completedCount} câu</strong>
              </div>
              {partialCount > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Trả lời chưa hoàn chỉnh (Đúng/Sai):</span>
                  <strong>{partialCount} câu</strong>
                </div>
              )}
              {unansweredCount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Chưa trả lời:</span>
                  <strong>{unansweredCount} câu</strong>
                </div>
              )}
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-rose-600 font-semibold mb-5 bg-rose-50 p-3 rounded-xl border border-rose-200">
                ⚠️ Bạn vẫn còn <strong>{unansweredCount} câu chưa làm</strong>. Bạn có chắc chắn muốn nộp bài ngay không?
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700"
              >
                QUAY LẠI LÀM BÀI
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> XÁC NHẬN NỘP BÀI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
