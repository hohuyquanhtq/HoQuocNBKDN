import React, { useState } from 'react';
import { Exam, Question, ExamStatus } from '../../types/index.ts';
import { exportSubmissionsToCsv } from '../../services/scoring.ts';
import { getSubmissionsByExam } from '../../services/storage.ts';
import QRCode from 'qrcode';
import {
  Layers,
  Plus,
  Clock,
  Award,
  Trash2,
  Edit3,
  CheckCircle2,
  Eye,
  X,
  BookOpen,
  Copy,
  QrCode,
  Check,
  Zap,
  Lock,
  Unlock,
  FileSpreadsheet,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface ExamManagerProps {
  exams: Exam[];
  questions: Question[];
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onUpdateStatus: (id: string, status: ExamStatus) => void;
  onStartTakeExam: (exam: Exam) => void;
  onViewSubmissions: (exam: Exam) => void;
  onNavigateToQuickCreate: () => void;
  onNavigateToWordExam?: () => void;
  teacherId: string;
}

export const ExamManager: React.FC<ExamManagerProps> = ({
  exams,
  questions,
  onSaveExam,
  onDeleteExam,
  onUpdateStatus,
  onStartTakeExam,
  onViewSubmissions,
  onNavigateToQuickCreate,
  onNavigateToWordExam,
  teacherId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // QR Modal
  const [qrModalExam, setQrModalExam] = useState<Exam | null>(null);
  const [qrModalUrl, setQrModalUrl] = useState<string>('');

  // Copy feedbacks
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const handleOpenQR = (exam: Exam) => {
    setQrModalExam(exam);
    const shareUrl = `${window.location.origin}/?examCode=${exam.code}`;
    QRCode.toDataURL(shareUrl, { width: 300, margin: 2, color: { dark: '#047857', light: '#ffffff' } })
      .then(url => setQrModalUrl(url))
      .catch(err => console.error(err));
  };

  const handleCopyLink = (exam: Exam) => {
    const shareUrl = `${window.location.origin}/?examCode=${exam.code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLinkId(exam.id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  const handleExportExcel = (exam: Exam) => {
    const subs = getSubmissionsByExam(exam.id);
    if (subs.length === 0) {
      alert(`Chưa có học sinh nào nộp bài cho đề "${exam.title}".`);
      return;
    }
    exportSubmissionsToCsv(subs, exam.title);
  };

  const handleToggleStatus = (exam: Exam) => {
    const nextStatus: ExamStatus = exam.status === 'open' ? 'closed' : 'open';
    onUpdateStatus(exam.id, nextStatus);
  };

  const handleOpenEdit = (exam: Exam) => {
    const subs = getSubmissionsByExam(exam.id);
    if (subs.length > 0) {
      const proceed = confirm(
        `Cảnh báo: Đề thi này đã có ${subs.length} học sinh nộp bài.\nViệc chỉnh sửa câu hỏi hoặc đáp án có thể làm sai lệch dữ liệu kết quả trước đó. Bạn có chắc chắn muốn chỉnh sửa?`
      );
      if (!proceed) return;
    }
    setEditingExam(JSON.parse(JSON.stringify(exam)));
    setSelectedQuestionIds(exam.questions.map(q => q.id));
    setIsModalOpen(true);
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-800">Quản lý Đề thi & Giao bài</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Tổng cộng: <strong>{exams.length}</strong> bài thi. Quản lý link chia sẻ, trạng thái nhận bài và xuất kết quả.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToWordExam && (
            <button
              onClick={onNavigateToWordExam}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              TẠO ĐỀ NHANH TỪ FILE WORD
            </button>
          )}

          <button
            onClick={onNavigateToQuickCreate}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-emerald-700" />
            Tạo đề từ ngân hàng
          </button>
        </div>
      </div>

      {/* Exam list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {exams.map(exam => {
          const subs = getSubmissionsByExam(exam.id);
          const isOpen = exam.status === 'open';

          return (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Status & Code */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                        isOpen
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {isOpen ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-rose-600" />}
                      {isOpen ? 'Đang mở nhận bài' : 'Đã đóng bài thi'}
                    </span>

                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-200">
                      Mã: {exam.code}
                    </span>
                  </div>

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
                        if (confirm(`Bạn có chắc muốn xóa đề "${exam.title}"?`)) {
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

                <h3 className="font-bold text-slate-900 text-base mb-1.5 leading-snug">{exam.title}</h3>
                {exam.description && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{exam.description}</p>
                )}

                {/* Exam Meta Info */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Số câu hỏi</span>
                    <strong className="text-slate-800 font-bold">{exam.questions.length}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Thời gian</span>
                    <strong className="text-slate-800 font-bold">
                      {exam.timeLimitMinutes > 0 ? `${exam.timeLimitMinutes}p` : 'Tự do'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Đã nộp bài</span>
                    <strong className="text-emerald-700 font-bold">{subs.length}</strong>
                  </div>
                </div>

                {/* Share Link Strip */}
                <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60 mb-4 flex items-center justify-between gap-2 text-xs">
                  <span className="text-emerald-950 font-mono text-[11px] truncate select-all">
                    {`${window.location.origin}/?examCode=${exam.code}`}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(exam)}
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 transition-all"
                      title="Sao chép link làm bài"
                    >
                      {copiedLinkId === exam.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedLinkId === exam.id ? 'Đã sao chép' : 'Copy link'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenQR(exam)}
                      className="p-1.5 rounded-lg border border-emerald-300 hover:bg-emerald-100 text-emerald-800"
                      title="Hiện mã QR"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleToggleStatus(exam)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                      isOpen
                        ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                        : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {isOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {isOpen ? 'Đóng nhận bài' : 'Mở nhận bài'}
                  </button>

                  <button
                    onClick={() => onStartTakeExam(exam)}
                    className="py-2 px-3 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    Xem thử đề
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onViewSubmissions(exam)}
                    className="py-2 px-3 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Xem kết quả ({subs.length})
                  </button>

                  <button
                    onClick={() => handleExportExcel(exam)}
                    className="py-2 px-3 text-xs font-semibold rounded-xl border border-emerald-300 hover:bg-emerald-50 text-emerald-800 transition-colors flex items-center justify-center gap-1.5"
                    title="Xuất bảng điểm ra Excel (.csv UTF-8)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    Xuất Excel
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal */}
      {qrModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 text-center">
            <button
              onClick={() => setQrModalExam(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider block mb-1">
              Mã QR Đề thi Online
            </span>
            <h3 className="font-bold text-base text-slate-900 mb-1">{qrModalExam.title}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Mã đề: <strong className="text-slate-800">{qrModalExam.code}</strong>
            </p>

            {qrModalUrl && (
              <div className="inline-block p-3 rounded-2xl bg-white border border-slate-200 shadow-sm mb-4">
                <img src={qrModalUrl} alt="QR Code" className="w-52 h-52 mx-auto" />
              </div>
            )}

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Trình chiếu mã QR này trên máy chiếu hoặc in lên bảng để học sinh dùng camera điện thoại quét làm bài ngay.
            </p>

            <button
              onClick={() => handleCopyLink(qrModalExam)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Copy className="w-4 h-4" /> Sao chép đường dẫn làm bài
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                Chỉnh sửa Đề thi: {editingExam.code}
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
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={editingExam.timeLimitMinutes}
                    onChange={(e) => setEditingExam({ ...editingExam, timeLimitMinutes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái nhận bài</label>
                  <select
                    value={editingExam.status}
                    onChange={(e) => setEditingExam({ ...editingExam, status: e.target.value as ExamStatus, isPublished: e.target.value === 'open' })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 bg-white"
                  >
                    <option value="open">Đang mở</option>
                    <option value="closed">Đã đóng</option>
                    <option value="draft">Bản nháp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Xem lời giải sau nộp</label>
                  <select
                    value={editingExam.allowReviewAfterSubmit ? 'yes' : 'no'}
                    onChange={(e) => setEditingExam({ ...editingExam, allowReviewAfterSubmit: e.target.value === 'yes' })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 bg-white"
                  >
                    <option value="yes">Cho phép xem</option>
                    <option value="no">Không cho phép</option>
                  </select>
                </div>
              </div>

              {/* Questions Picker */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Danh sách câu hỏi trong đề ({selectedQuestionIds.length}/{questions.length} câu đã chọn)
                </label>
                <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {questions.map((q, idx) => {
                    const isSelected = selectedQuestionIds.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setSelectedQuestionIds(prev =>
                            prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                          );
                        }}
                        className={`p-3 text-xs flex items-start gap-3 cursor-pointer ${
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
                          <span className="font-bold text-slate-800 mr-2">{q.code || `Câu ${idx + 1}`}</span>
                          <span className="text-slate-600">{q.stem}</span>
                        </div>
                      </div>
                    );
                  })}
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
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lưu cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
