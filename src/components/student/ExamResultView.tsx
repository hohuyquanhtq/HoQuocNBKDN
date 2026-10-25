import React, { useEffect } from 'react';
import { ExamSubmission } from '../../types/index.ts';
import { formatScore } from '../../services/scoring.ts';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Calendar,
  BookOpen,
  ArrowRight,
  History,
  Lock,
  FileText,
} from 'lucide-react';

interface ExamResultViewProps {
  submission: ExamSubmission;
  onViewDetailedReview: () => void;
  onBackToExams: () => void;
  onViewHistory: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  submission,
  onViewDetailedReview,
  onBackToExams,
  onViewHistory,
}) => {
  const isScoreReleased = submission.publishScoreMode !== 'after_teacher_release';
  const isReviewAllowed = submission.allowReviewAfterSubmit !== false;

  useEffect(() => {
    // Burst confetti if score is released and >= 7.0
    if (isScoreReleased && submission.totalScore >= 7.0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isScoreReleased, submission.totalScore]);

  const scorePercent = Math.round((submission.totalScore / submission.maxScore) * 100);

  let evaluation = { text: 'Cần cố gắng hơn', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
  if (submission.totalScore >= 9.0) {
    evaluation = { text: 'Xuất sắc! Nắm rất vững kiến thức Hóa học', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
  } else if (submission.totalScore >= 8.0) {
    evaluation = { text: 'Giỏi! Đạt yêu cầu cao của chương trình', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' };
  } else if (submission.totalScore >= 6.5) {
    evaluation = { text: 'Khá! Cần củng cố thêm một số dạng câu hỏi', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
  }

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m} phút ${s < 10 ? '0' + s : s} giây`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Result Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-8 text-white text-center relative">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
            <Award className="w-9 h-9" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-200 px-3 py-1 rounded-full bg-white/10 border border-white/20">
            KẾT QUẢ BÀI THI ONLINE
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
            {submission.examTitle}
          </h1>
          <p className="text-sm text-emerald-100 mt-1">
            Học sinh: <strong className="text-white">{submission.studentName}</strong>
            {submission.studentClass && (
              <> • Lớp: <strong className="text-white">{submission.studentClass}</strong></>
            )}
            {submission.examCode && (
              <> • Mã đề: <strong className="font-mono text-emerald-200">{submission.examCode}</strong></>
            )}
          </p>
        </div>

        {/* Score & Evaluation */}
        <div className="p-8 text-center border-b border-slate-100 bg-slate-50/50">
          {isScoreReleased ? (
            <>
              <div className="inline-block p-6 rounded-3xl bg-white border border-slate-200 shadow-sm mb-4">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  TỔNG ĐIỂM ĐẠT ĐƯỢC
                </span>
                <div className="text-4xl sm:text-5xl font-black text-emerald-600 tracking-tight">
                  {formatScore(submission.totalScore)}{' '}
                  <span className="text-xl sm:text-2xl font-bold text-slate-400">
                    / {formatScore(submission.maxScore)} điểm
                  </span>
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-500">
                  Đạt <strong>{scorePercent}%</strong> tổng điểm bài kiểm tra
                </div>
              </div>

              <div className={`max-w-md mx-auto p-3 rounded-2xl border text-sm font-semibold ${evaluation.bg} ${evaluation.color}`}>
                {evaluation.text}
              </div>
            </>
          ) : (
            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 max-w-md mx-auto">
              <Lock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h3 className="font-bold text-base mb-1">Điểm số đang được giữ bí mật</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Bài thi của bạn đã được ghi nhận thành công trên hệ thống. Giáo viên quy định công bố điểm số sau khi toàn bộ học sinh hoàn thành bài kiểm tra.
              </p>
            </div>
          )}
        </div>

        {/* Statistical Summary Grid */}
        <div className="p-8">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">
            CHI TIẾT KẾT QUẢ THEO CÂU HỎI
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-700 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Câu đúng</span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-800">
                {isScoreReleased ? submission.correctCount : '—'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-700 mb-1">
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Đúng 1 phần</span>
              </div>
              <div className="text-2xl font-extrabold text-amber-800">
                {isScoreReleased ? submission.partiallyCorrectCount : '—'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <div className="flex items-center justify-center gap-1.5 text-rose-700 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Câu sai</span>
              </div>
              <div className="text-2xl font-extrabold text-rose-800">
                {isScoreReleased ? submission.incorrectCount : '—'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Chưa làm</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-700">
                {submission.unansweredCount}
              </div>
            </div>
          </div>

          {/* Time & Submission Details */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-around gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Thời gian làm bài: <strong>{formatDuration(submission.durationSeconds)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Nộp lúc: <strong>{new Date(submission.submittedAt).toLocaleTimeString('vi-VN')} - {new Date(submission.submittedAt).toLocaleDateString('vi-VN')}</strong>
            </span>
          </div>

          {/* Action Button: XEM ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI */}
          <div className="mt-8 space-y-3">
            {isReviewAllowed ? (
              <button
                type="button"
                onClick={onViewDetailedReview}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 group"
              >
                <span>XEM ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 text-center text-xs font-semibold border border-slate-200">
                🔒 Giáo viên không cho phép xem đáp án và hướng dẫn giải sau khi nộp bài.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onBackToExams}
                className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-slate-500" />
                Danh sách đề thi
              </button>

              <button
                type="button"
                onClick={onViewHistory}
                className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <History className="w-4 h-4 text-slate-500" />
                Lịch sử bài thi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
