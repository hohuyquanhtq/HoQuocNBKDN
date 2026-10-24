import React, { useState, useEffect, useRef } from 'react';
import { Exam, StudentAnswer, ExamSubmission, User } from '../../types/index.ts';
import { ChemistryText } from '../ChemistryText.tsx';
import { createSubmission } from '../../services/scoring.ts';
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
} from 'lucide-react';

interface ExamTakingProps {
  exam: Exam;
  currentUser: User | null;
  onSubmitted: (submission: ExamSubmission) => void;
  onExit: () => void;
}

export const ExamTaking: React.FC<ExamTakingProps> = ({
  exam,
  currentUser,
  onSubmitted,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guest name/class fallback if not logged in
  const [guestName, setGuestName] = useState(currentUser?.fullName || 'Học sinh');
  const [guestClass, setGuestClass] = useState(currentUser?.className || '11A');

  // Timer
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    exam.timeLimitMinutes > 0 ? exam.timeLimitMinutes * 60 : null
  );

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  const questions = exam.questions;
  const currentQuestion = questions[currentIndex];

  // Initialize timer
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
      exam.title,
      currentUser?.id || 'guest-student',
      currentUser?.fullName || guestName,
      currentUser?.className || guestClass,
      new Date(startTimeRef.current).toISOString(),
      elapsedSeconds,
      questions,
      answers,
      flaggedIds,
      exam.totalPoints
    );

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

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      {/* Top Exam Header */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-18 z-30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Đang làm bài
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Câu {currentIndex + 1} / {questions.length}
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{exam.title}</h1>
          <p className="text-xs text-slate-500">
            Học sinh: <strong className="text-slate-800">{currentUser?.fullName || guestName}</strong>
            {(currentUser?.className || guestClass) && (
              <> • Lớp: <strong className="text-slate-800">{currentUser?.className || guestClass}</strong></>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {remainingSeconds !== null && (
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono font-bold text-sm ${
                remainingSeconds < 300
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>
          )}

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Nộp bài
          </button>
        </div>
      </div>

      {/* Main Single Question Display Area */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        {/* Question Header & Action */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
              {currentIndex + 1}
            </span>
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {currentQuestion.type === 'multiple_choice'
                  ? 'Trắc nghiệm 4 lựa chọn'
                  : currentQuestion.type === 'true_false'
                  ? 'Chọn Đúng hoặc Sai cho mỗi phát biểu'
                  : 'Điền đáp án ngắn'}
              </span>
              <span className="text-[11px] text-slate-400">
                Mức độ: {currentQuestion.level || 'BIẾT'}
              </span>
            </div>
          </div>

          <button
            onClick={() => toggleFlag(currentQuestion.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
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

        {/* Question Stem */}
        <div className="text-base sm:text-lg font-medium text-slate-800 mb-6 leading-relaxed">
          <ChemistryText content={currentQuestion.stem} />
        </div>

        {/* Answer Options Area */}
        {currentQuestion.type === 'multiple_choice' && (
          <div className="space-y-3">
            {currentQuestion.options.map(opt => {
              const currentAns = answers[currentQuestion.id];
              const isSelected =
                currentAns?.type === 'multiple_choice' &&
                currentAns.selectedOption === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectMC(opt.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {opt.id}
                  </div>
                  <div className="flex-1 text-slate-800 text-sm sm:text-base font-normal pt-0.5">
                    <ChemistryText content={opt.text} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentQuestion.type === 'true_false' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 italic mb-2">
              (Học sinh phải chọn ĐÚNG hoặc SAI cho đầy đủ cả 4 ý bên dưới)
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
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="font-extrabold text-slate-800 text-sm shrink-0 w-5">
                      {st.id})
                    </span>
                    <div className="text-sm text-slate-800 leading-relaxed">
                      <ChemistryText content={st.text} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleSelectTF(st.id, true)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        currentVal === true
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ĐÚNG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTF(st.id, false)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        currentVal === false
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
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

        {currentQuestion.type === 'short_answer' && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
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
              className="w-full sm:w-80 px-4 py-2.5 text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-xs text-slate-400">
              Mẹo: Hệ thống chấp nhận dấu phẩy (,) hoặc dấu chấm (.) cho số thập phân.
            </p>
          </div>
        )}

        {/* Previous / Next buttons */}
        <div className="flex items-center justify-between gap-3 pt-8 mt-8 border-t border-slate-100">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Câu trước
          </button>

          <span className="text-xs font-semibold text-slate-500">
            Câu {currentIndex + 1} / {questions.length}
          </span>

          <button
            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIndex === questions.length - 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            Câu tiếp theo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Status Grid Palette (Thanh trạng thái câu hỏi) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Thanh điều hướng & Trạng thái câu hỏi ({questions.length} câu)
          </h2>

          {/* Status Legends */}
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
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-10 rounded-xl border flex flex-col items-center justify-center text-xs font-semibold transition-all ${bgClass} ${borderClass}`}
                title={`Câu ${idx + 1}: ${
                  status === 'completed'
                    ? 'Đã làm xong'
                    : status === 'partially_answered'
                    ? 'Làm một phần'
                    : 'Chưa làm'
                }${isFlagged ? ' (Đã đánh dấu)' : ''}`}
              >
                <span>{idx + 1}</span>
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-slate-900 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Xác nhận nộp bài thi?</h3>
                <p className="text-xs text-slate-500">Sau khi nộp, hệ thống sẽ tiến hành chấm điểm tự động.</p>
              </div>
            </div>

            {/* Warning stats */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 mb-5">
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Số câu đã hoàn thành:</span>
                <strong>{completedCount} câu</strong>
              </div>
              {partialCount > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Số câu làm một phần (Đúng/Sai):</span>
                  <strong>{partialCount} câu</strong>
                </div>
              )}
              {unansweredCount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Số câu chưa trả lời:</span>
                  <strong>{unansweredCount} câu</strong>
                </div>
              )}
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-rose-600 font-medium mb-4">
                ⚠️ Bạn vẫn còn <strong>{unansweredCount} câu chưa làm</strong>. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700"
              >
                Quay lại làm tiếp
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Xác nhận nộp bài
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
