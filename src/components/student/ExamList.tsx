import React, { useState } from 'react';
import { Exam, User } from '../../types/index.ts';
import { BookOpen, Clock, Award, Play, AlertCircle, Sparkles } from 'lucide-react';

interface ExamListProps {
  exams: Exam[];
  currentUser: User | null;
  onStartExam: (exam: Exam, studentName?: string, studentClass?: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const ExamList: React.FC<ExamListProps> = ({
  exams,
  currentUser,
  onStartExam,
  onOpenAuth,
}) => {
  const publishedExams = exams.filter(e => e.isPublished);

  const [guestModalExam, setGuestModalExam] = useState<Exam | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestClass, setGuestClass] = useState('');

  const handleStartClick = (exam: Exam) => {
    if (currentUser) {
      onStartExam(exam);
    } else {
      setGuestModalExam(exam);
    }
  };

  const handleConfirmGuestStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestModalExam) return;
    if (!guestName.trim()) {
      alert('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    onStartExam(guestModalExam, guestName.trim(), guestClass.trim() || undefined);
    setGuestModalExam(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Hero card */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            Hệ thống Khảo sát & Thi trắc nghiệm Hóa học 2025
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Đề kiểm tra & Đánh giá năng lực Hóa học
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Thi trực tuyến thông minh với định dạng mới của Bộ Giáo dục & Đào tạo. Mỗi lần hiển thị một câu hỏi, tự động lưu bài làm và chấm điểm chi tiết tức thì.
          </p>

          {!currentUser && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-xs"
              >
                Đăng nhập để lưu lịch sử
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 rounded-xl bg-emerald-600/60 hover:bg-emerald-600 text-white font-bold text-xs transition-colors border border-white/20"
              >
                Đăng ký tài khoản
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Available Exams */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Danh sách đề thi đang mở ({publishedExams.length})
          </h2>
        </div>

        {publishedExams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Hiện chưa có đề thi nào được mở.</p>
            <p className="text-xs text-slate-400 mt-1">Giáo viên sẽ phát hành đề thi trong thời gian tới.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedExams.map(exam => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Sẵn sàng thi
                    </span>
                    <span className="text-xs text-slate-400">
                      {exam.questions.length} câu hỏi
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1.5">{exam.title}</h3>
                  {exam.description && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{exam.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-600 py-3 border-y border-slate-100 mb-5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {exam.timeLimitMinutes > 0 ? `${exam.timeLimitMinutes} phút` : 'Không giới hạn'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-slate-400" />
                      Thang điểm {exam.totalPoints}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartClick(exam)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Bắt đầu làm bài
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guest Name prompt modal */}
      {guestModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-base text-slate-900 mb-1">Xác nhận thông tin học sinh</h3>
            <p className="text-xs text-slate-500 mb-4">
              Vui lòng nhập họ tên của bạn để ghi nhận kết quả bài thi.
            </p>

            <form onSubmit={handleConfirmGuestStart} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lớp <span className="text-slate-400 font-normal">(không bắt buộc)</span>
                </label>
                <input
                  type="text"
                  value={guestClass}
                  onChange={(e) => setGuestClass(e.target.value)}
                  placeholder="Ví dụ: 11A1"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGuestModalExam(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  Vào thi ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
