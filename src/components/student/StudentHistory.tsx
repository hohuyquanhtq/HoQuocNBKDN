import React from 'react';
import { ExamSubmission } from '../../types/index.ts';
import { formatScore } from '../../services/scoring.ts';
import { History, Award, Clock, Calendar, Eye, AlertCircle } from 'lucide-react';

interface StudentHistoryProps {
  submissions: ExamSubmission[];
  onReviewSubmission: (submission: ExamSubmission) => void;
  onTakeNewExam: () => void;
}

export const StudentHistory: React.FC<StudentHistoryProps> = ({
  submissions,
  onReviewSubmission,
  onTakeNewExam,
}) => {
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' + s : s}s`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-800">Lịch sử bài thi của tôi</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Tổng cộng: <strong>{submissions.length}</strong> bài thi đã hoàn thành. Xem lại điểm số và đáp án chi tiết bất kỳ lúc nào.
          </p>
        </div>

        <button
          onClick={onTakeNewExam}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
        >
          Làm bài thi mới
        </button>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-base mb-1">Bạn chưa có bài thi nào</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            Hãy bắt đầu làm một bài kiểm tra để đánh giá năng lực và tích lũy điểm số của bạn.
          </p>
          <button
            onClick={onTakeNewExam}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            Vào làm bài ngay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Đã hoàn thành
                  </span>
                  <span className="text-xs text-slate-400">
                    Lượt thi #{sub.id.substring(4, 11)}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">{sub.examTitle}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(sub.submittedAt).toLocaleDateString('vi-VN')} {new Date(sub.submittedAt).toLocaleTimeString('vi-VN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Thời gian: {formatDuration(sub.durationSeconds)}
                  </span>
                  <span>
                    Đúng: <strong className="text-emerald-700">{sub.correctCount}</strong> • Sai: <strong className="text-rose-700">{sub.incorrectCount}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Điểm số</span>
                  <span className="text-2xl font-black text-emerald-600">
                    {formatScore(sub.totalScore)}{' '}
                    <span className="text-xs font-bold text-slate-400">/ {formatScore(sub.maxScore)}</span>
                  </span>
                </div>

                <button
                  onClick={() => onReviewSubmission(sub)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem lại bài
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
