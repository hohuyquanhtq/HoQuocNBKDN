import React, { useState } from 'react';
import { Exam, Question } from '../../types/index.ts';
import { Layers, Plus, Clock, Award, Trash2, Edit3, CheckCircle2, Eye, X, BookOpen, AlertCircle } from 'lucide-react';

interface ExamManagerProps {
  exams: Exam[];
  questions: Question[];
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onStartTakeExam: (exam: Exam) => void;
  onViewSubmissions: (exam: Exam) => void;
  teacherId: string;
}

export const ExamManager: React.FC<ExamManagerProps> = ({
  exams,
  questions,
  onSaveExam,
  onDeleteExam,
  onStartTakeExam,
  onViewSubmissions,
  teacherId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const handleOpenCreate = () => {
    const newExam: Exam = {
      id: `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: 'Đề kiểm tra Hóa học mới',
      description: 'Kiểm tra đánh giá kiến thức',
      timeLimitMinutes: 20,
      totalPoints: 10.0,
      questions: [],
      createdAt: new Date().toISOString(),
      createdBy: teacherId,
      isPublished: true,
    };
    setEditingExam(newExam);
    setSelectedQuestionIds(questions.map(q => q.id)); // Default select all
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(JSON.parse(JSON.stringify(exam)));
    setSelectedQuestionIds(exam.questions.map(q => q.id));
    setIsModalOpen(true);
  };

  const handleToggleQuestion = (qId: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !editingExam.title.trim()) return;
    if (selectedQuestionIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi cho đề thi.');
      return;
    }

    const examQuestions = questions.filter(q => selectedQuestionIds.includes(q.id));
    const finalExam: Exam = {
      ...editingExam,
      questions: examQuestions,
    };

    onSaveExam(finalExam);
    setIsModalOpen(false);
    setEditingExam(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-800">Quản lý Đề thi Hóa học</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Tạo đề thi từ ngân hàng câu hỏi, cấu hình thời gian làm bài và phát hành cho học sinh.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Tạo đề thi mới
        </button>
      </div>

      {/* Exam list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map(exam => (
          <div
            key={exam.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    exam.isPublished
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {exam.isPublished ? 'Đang mở cho thi' : 'Bản nháp / Đóng'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(exam)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    title="Chỉnh sửa đề thi"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa đề thi này?')) {
                        onDeleteExam(exam.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa đề thi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-base mb-1">{exam.title}</h3>
              {exam.description && (
                <p className="text-xs text-slate-500 mb-3">{exam.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-600 py-2 border-y border-slate-100 mb-4">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <strong>{exam.questions.length}</strong> câu hỏi
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {exam.timeLimitMinutes > 0 ? `${exam.timeLimitMinutes} phút` : 'Không giới hạn'}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  Thang điểm {exam.totalPoints}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => onViewSubmissions(exam)}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Xem kết quả HS
              </button>

              <button
                onClick={() => onStartTakeExam(exam)}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                Thi thử / Xem đề
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Create/Edit Exam */}
      {isModalOpen && editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                {editingExam.id.startsWith('exam-') && !exams.some(e => e.id === editingExam.id)
                  ? 'Tạo đề thi mới'
                  : 'Cập nhật đề thi'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề đề thi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingExam.title}
                  onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả / Ghi chú</label>
                <input
                  type="text"
                  value={editingExam.description || ''}
                  onChange={(e) => setEditingExam({ ...editingExam, description: e.target.value })}
                  placeholder="Ví dụ: Đề kiểm tra 15 phút phần Cân bằng hóa học"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian làm bài (phút)</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={editingExam.timeLimitMinutes}
                    onChange={(e) => setEditingExam({ ...editingExam, timeLimitMinutes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">0 = Không giới hạn thời gian</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thang điểm tổng</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={editingExam.totalPoints}
                    onChange={(e) => setEditingExam({ ...editingExam, totalPoints: parseFloat(e.target.value) || 10 })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái phát hành</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingExam.isPublished}
                      onChange={(e) => setEditingExam({ ...editingExam, isPublished: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Mở cho học sinh thi</span>
                  </label>
                </div>
              </div>

              {/* Questions Picker */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Chọn câu hỏi từ Ngân hàng (Đã chọn: {selectedQuestionIds.length}/{questions.length} câu)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedQuestionIds(questions.map(q => q.id))}
                      className="text-[11px] text-emerald-700 hover:underline"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedQuestionIds([])}
                      className="text-[11px] text-rose-600 hover:underline"
                    >
                      Bỏ chọn hết
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {questions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Ngân hàng câu hỏi chưa có câu nào. Vui lòng thêm câu hỏi hoặc nhập từ Word trước.
                    </div>
                  ) : (
                    questions.map((q, idx) => {
                      const isSelected = selectedQuestionIds.includes(q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => handleToggleQuestion(q.id)}
                          className={`p-3 text-xs flex items-start gap-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-800">
                                {q.code || `Câu ${idx + 1}`}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                {q.type === 'multiple_choice' ? 'Trắc nghiệm' : q.type === 'true_false' ? 'Đúng/Sai' : 'Trả lời ngắn'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                [{q.level || 'BIẾT'}]
                              </span>
                            </div>
                            <p className="line-clamp-2 text-slate-600 font-normal">
                              {q.stem}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lưu đề thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
